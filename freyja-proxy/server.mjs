import fs from 'node:fs';
import http2 from 'node:http2';
import https from 'node:https';
import { randomBytes } from 'node:crypto';

try { process.loadEnvFile(); } catch {}

const DEFAULT_TARGET_ORIGIN = 'https://preview-p22655-e59433.adobeaemcloud.com/';
const TARGET = new URL(process.env.TARGET_ORIGIN || DEFAULT_TARGET_ORIGIN);
const PORT = process.env.PORT || 3000;
const SSL_CERT = process.env.SSL_CERT;
const SSL_KEY = process.env.SSL_KEY;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SCOPES = process.env.SCOPES;
const TOKEN_ENDPOINT = process.env.TOKEN_ENDPOINT || 'https://ims-na1.adobelogin.com/ims/token/v3';
const LOG_LEVEL = (process.env.LOG_LEVEL || 'debug').toLowerCase();
const LOG_CURL = !['0', 'false', 'no', 'off'].includes((process.env.LOG_CURL ?? 'true').toLowerCase());

function parseNonNegativeInt(value, fallback) {
  if (value === undefined) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
// Shared server-side cache TTL for `stage`-mode responses (seconds).
// 0 disables the cache entirely (pure passthrough + browser Cache-Control only).
const CACHE_TTL_SEC = parseNonNegativeInt(process.env.CACHE_TTL_SEC, 60);
// Max entries retained in the shared cache (LRU eviction beyond this).
const CACHE_MAX_ENTRIES = parseNonNegativeInt(process.env.CACHE_MAX_ENTRIES, 500);

if (!SSL_CERT || !SSL_KEY) {
  console.error('SSL_CERT and SSL_KEY environment variables are required (paths to PEM files)');
  process.exit(1);
}
if (!CLIENT_ID || !CLIENT_SECRET || !SCOPES) {
  console.error('CLIENT_ID, CLIENT_SECRET and SCOPES are required for IMS S2S token mint');
  process.exit(1);
}

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const ACTIVE_LEVEL = LEVELS[LOG_LEVEL] ?? LEVELS.debug;

// Downstream Cache-Control policy: the browser is the real cache.
// - Short max-age: freshness commitment.
// - Long stale-while-revalidate: near-instant perceived latency; the browser
//   serves the stale body immediately and revalidates in the background.
// - stale-if-error: keep serving stale briefly if upstream blips.
// Browser revalidation is cheap because ETag / Last-Modified pass through
// unchanged, so background refreshes are usually 304s.
const STAGE_CACHE_CONTROL =
  'public, max-age=15, stale-while-revalidate=604800, stale-if-error=604800';
const BYPASS_CACHE_CONTROL = 'no-store';

const SENSITIVE_HEADER_KEYS = new Set(['authorization', 'proxy-authorization']);
const OMIT_FROM_LOG = new Set(['cookie', 'set-cookie']);

// CORS headers injected on every response so the browser sees upstream errors
// instead of a generic CORS wall. Using '*' because the proxy strips cookies
// and never forwards credentials — so credentialed CORS isn't in play.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
  'Access-Control-Max-Age': '600',
  // This host resolves to a private (RFC1918) address. Callers on a public origin
  // (e.g. www.stage.adobe.com) are subject to Chrome's Private Network Access
  // check and need this grant on the preflight, or the browser blocks the request
  // with "Permission was denied for this request to access the `local` address space."
  'Access-Control-Allow-Private-Network': 'true',
};

function redactHeaders(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) {
    const lk = k.toLowerCase();
    if (OMIT_FROM_LOG.has(lk)) continue;
    out[k] = SENSITIVE_HEADER_KEYS.has(lk) ? '[REDACTED]' : v;
  }
  return out;
}

function stripResponseCookies(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === 'set-cookie') continue;
    out[k] = v;
  }
  return out;
}

function dropHeaders(headers, names) {
  const drop = new Set(names.map((n) => n.toLowerCase()));
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (drop.has(k.toLowerCase())) continue;
    out[k] = v;
  }
  return out;
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function buildCurl(method, path, headers) {
  const url = new URL(path, TARGET.origin).toString();
  const parts = [`curl -X ${method} ${shellQuote(url)}`];
  for (const [k, v] of Object.entries(headers)) {
    const lk = k.toLowerCase();
    if (lk === 'host' || lk === 'content-length') continue;
    parts.push(`  -H ${shellQuote(`${k}: ${v}`)}`);
  }
  return parts.join(' \\\n');
}

function logCurl(reqId, method, path, headers) {
  if (!LOG_CURL || LEVELS.debug > ACTIVE_LEVEL) return;
  console.log(`${new Date().toISOString()} [DEBUG] upstream curl reqId=${reqId}`);
  console.log(buildCurl(method, path, headers));
}

function log(level, msg, ctx) {
  if ((LEVELS[level] ?? 99) > ACTIVE_LEVEL) return;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${msg}`;
  if (ctx && Object.keys(ctx).length) {
    console.log(line, JSON.stringify(ctx));
  } else {
    console.log(line);
  }
}

const tlsOptions = {
  cert: fs.readFileSync(SSL_CERT),
  key: fs.readFileSync(SSL_KEY),
};

// Persistent TCP+TLS pool to upstream. Critical now that the browser does
// most caching: every browser SWR revalidation still traverses the proxy,
// and paying a handshake per 304 would dominate latency.
const upstreamAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 64,
});

const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'host',
]);

// Headers from the incoming client request that must NOT be forwarded upstream:
//  - cookie / authorization: scoped to this proxy, useless (and large) to AEM;
//    we set our own Authorization below.
//  - cache-control / pragma: a mode signal for this proxy, not a directive
//    for AEM; AEM should decide caching on its own.
//  - sec-ch-* / sec-fetch-* / upgrade-insecure-requests / dnt / priority:
//    browser fetch metadata AEM doesn't use and that causes HTTP 431.
//  - referer / origin: point at this proxy, not upstream.
// Note: If-None-Match / If-Modified-Since are intentionally *not* dropped —
// they're the browser's conditional revalidation and must flow through.
const DROP_FROM_UPSTREAM = new Set([
  'cookie', 'authorization',
  'cache-control', 'pragma',
  'referer', 'origin',
  'upgrade-insecure-requests', 'dnt', 'priority',
  'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-ch-ua-arch',
  'sec-ch-ua-bitness', 'sec-ch-ua-full-version', 'sec-ch-ua-full-version-list',
  'sec-ch-ua-model', 'sec-ch-ua-platform-version', 'sec-ch-ua-wow64',
  'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-user',
]);

// Shared response cache for `stage`-mode GET/HEAD requests. Unlike the
// per-browser Cache-Control policy, this is shared across every caller —
// including QA automation's many fresh, isolated browser contexts, which
// never benefit from browser-side caching alone. Concurrent identical
// requests during a miss are coalesced onto a single upstream fetch.
const cache = new Map();
const cacheInFlight = new Map();

function cacheSizeLabel() {
  return `${cache.size}/${CACHE_MAX_ENTRIES}`;
}

function cacheControlFor(mode, status) {
  const is2xx = status >= 200 && status < 300;
  return mode === 'stage' && is2xx ? STAGE_CACHE_CONTROL : BYPASS_CACHE_CONTROL;
}

function sanitizeForCache(headers) {
  return dropHeaders(stripResponseCookies(headers), [
    'cache-control', 'content-length',
    'access-control-allow-origin', 'access-control-allow-methods',
    'access-control-allow-headers', 'access-control-expose-headers',
    'access-control-max-age', 'access-control-allow-credentials',
    ...HOP_BY_HOP,
  ]);
}

// `maxAgeCeiling` is the caller's own request-side Cache-Control: max-age
// (RFC 7234 §5.2.1.1) — "don't give me a response older than this" — or
// Infinity when stage mode was triggered by a heuristic (Origin/UA) rather
// than an explicit max-age, meaning the caller asked for no ceiling of its
// own. CACHE_TTL_SEC is the operator's own retention cap; a caller may ask
// for something stricter (smaller) than that, and this must honor whichever
// is tighter. A hit that's too old for THIS caller is left in place for
// others whose own ceiling would still accept it — not evicted, just not served.
function cacheGet(key, maxAgeCeiling) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  const now = Date.now();
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return undefined;
  }
  const ageSec = (now - entry.storedAt) / 1000;
  if (ageSec > maxAgeCeiling) return undefined;
  // Touch: re-insert so Map iteration order tracks least-recently-used.
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function cacheStore(key, entry) {
  if (!cache.has(key) && cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, entry);
}

const REFRESH_SKEW_MS = 5 * 60 * 1000;

let tokenCache = null;
let tokenInFlight = null;

async function mintToken() {
  log('info', 'token mint: requesting', { endpoint: TOKEN_ENDPOINT, scopes: SCOPES });
  const start = Date.now();
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: SCOPES,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const durationMs = Date.now() - start;
  if (!res.ok) {
    const text = await res.text();
    log('error', 'token mint: failed', { status: res.status, durationMs, body: text.slice(0, 500) });
    throw new Error(`Token request failed: ${res.status}`);
  }
  const data = await res.json();
  const expiresInSec = data.expires_in ?? 3600;
  log('info', 'token mint: success', { expiresInSec, durationMs });
  return { token: data.access_token, expiresAt: Date.now() + expiresInSec * 1000 - REFRESH_SKEW_MS };
}

async function getToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  if (!tokenInFlight) {
    log('debug', 'token cache miss, minting');
    tokenInFlight = mintToken()
      .then((t) => { tokenCache = t; return t.token; })
      .finally(() => { tokenInFlight = null; });
  }
  return tokenInFlight;
}

// Returns the raw max-age value (including 0), or undefined if the
// directive is absent — distinct from parseMaxAge's 0, which conflates
// "absent" with "explicitly zero". isExplicitNoStore needs that distinction.
function extractMaxAge(headerValue) {
  if (!headerValue) return undefined;
  const value = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;
  const match = /(?:^|[,\s])max-age\s*=\s*(\d+)/i.exec(value);
  if (!match) return undefined;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseMaxAge(headerValue) {
  const n = extractMaxAge(headerValue);
  return n && n > 0 ? n : 0;
}

// Caller explicitly asked to skip the cache — no-store, max-age=0, or the
// older Pragma: no-cache. This always overrides the heuristic stage-mode
// signals below, so e.g. a specific Nala test case that needs guaranteed
// freshness can still force a bypass despite matching the Nala User-Agent.
function isExplicitNoStore(cacheControlHeader, pragmaHeader) {
  if (pragmaHeader) {
    const p = Array.isArray(pragmaHeader) ? pragmaHeader.join(',') : pragmaHeader;
    if (/no-cache/i.test(p)) return true;
  }
  if (!cacheControlHeader) return false;
  const value = Array.isArray(cacheControlHeader) ? cacheControlHeader.join(',') : cacheControlHeader;
  if (/(?:^|[,\s])no-store\b/i.test(value)) return true;
  return extractMaxAge(cacheControlHeader) === 0;
}

// Additional stage-mode signals beyond the explicit Cache-Control opt-in.
// Real callers (Studio's preview panel, stage/*.aem.page pages, Nala
// automation) don't set that header at all today — see project notes on
// why — so mode detection also has to work from what they DO send.
const STAGE_ORIGIN_HOSTS = [/^www\.stage\.adobe\.com$/i, /\.aem\.page$/i];
const NALA_USER_AGENT_MARKER = 'NALA-MAS';

function hostnameOf(headerValue) {
  if (!headerValue) return undefined;
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  try {
    return new URL(raw).hostname;
  } catch {
    return undefined;
  }
}

function matchesStageOrigin(originHeader, refererHeader) {
  const host = hostnameOf(originHeader) || hostnameOf(refererHeader);
  return !!host && STAGE_ORIGIN_HOSTS.some((re) => re.test(host));
}

function isNalaRequest(userAgentHeader) {
  if (!userAgentHeader) return false;
  const value = Array.isArray(userAgentHeader) ? userAgentHeader.join(' ') : userAgentHeader;
  return value.includes(NALA_USER_AGENT_MARKER);
}

async function buildUpstreamHeaders(req) {
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    const lk = k.toLowerCase();
    if (lk.startsWith(':')) continue;
    if (HOP_BY_HOP.has(lk) || DROP_FROM_UPSTREAM.has(lk)) continue;
    headers[k] = v;
  }
  headers['host'] = TARGET.host;
  headers['authorization'] = `Bearer ${await getToken()}`;
  return headers;
}

async function fetchUpstreamBuffered(reqId, req, mode, key) {
  const headers = await buildUpstreamHeaders(req);
  const upstreamStart = Date.now();
  log('debug', 'upstream request', { reqId, method: req.method, path: req.url, mode });
  logCurl(reqId, req.method, req.url, headers);

  return new Promise((resolve, reject) => {
    const proxyReq = https.request({
      hostname: TARGET.hostname,
      port: TARGET.port || 443,
      path: req.url,
      method: req.method,
      headers,
      agent: upstreamAgent,
    }, (proxyRes) => {
      log('info', 'upstream response', {
        reqId, status: proxyRes.statusCode,
        durationMs: Date.now() - upstreamStart,
        contentLength: proxyRes.headers['content-length'], mode,
      });
      const chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const body = Buffer.concat(chunks);
        const status = proxyRes.statusCode;
        const result = { status, headers: sanitizeForCache(proxyRes.headers), body };
        if (status >= 200 && status < 300) {
          const storedAt = Date.now();
          cacheStore(key, { ...result, storedAt, expiresAt: storedAt + CACHE_TTL_SEC * 1000 });
          log('info', 'cache store', { reqId, key, bytes: body.length, ttlSec: CACHE_TTL_SEC, cacheEntries: cacheSizeLabel() });
        }
        resolve(result);
      });
      proxyRes.on('error', reject);
    });
    proxyReq.on('error', reject);
    // mode 'stage' is GET/HEAD-only, so there's no request body to forward —
    // safe for concurrent coalesced callers to share this single upstream call.
    req.pipe(proxyReq);
  });
}

function writeBufferedResponse(res, mode, result, xCache) {
  const outHeaders = {
    ...result.headers,
    'Cache-Control': cacheControlFor(mode, result.status),
    ...CORS_HEADERS,
    'Content-Length': result.body.length,
    'X-Cache': xCache,
  };
  res.writeHead(result.status, outHeaders);
  res.end(result.body);
}

// Stage-mode path: served from the shared cache when possible, otherwise
// fetched upstream (with concurrent identical requests coalesced onto one
// fetch) and buffered so the result can populate the cache before replying.
async function handleCacheable(reqId, req, res, mode, maxAgeCeiling) {
  const key = `${req.method} ${req.url}`;
  const cached = cacheGet(key, maxAgeCeiling);
  if (cached) {
    log('info', 'cache hit', { reqId, key, maxAgeCeiling });
    writeBufferedResponse(res, mode, cached, 'HIT');
    return;
  }

  let pending = cacheInFlight.get(key);
  if (pending) {
    log('debug', 'cache coalesced', { reqId, key });
  } else {
    pending = fetchUpstreamBuffered(reqId, req, mode, key)
      .finally(() => cacheInFlight.delete(key));
    cacheInFlight.set(key, pending);
  }

  const result = await pending;
  writeBufferedResponse(res, mode, result, 'MISS');
}

// Authoring / cache-disabled path: unbuffered streaming passthrough.
async function handleBypass(reqId, req, res, mode) {
  const headers = await buildUpstreamHeaders(req);
  const upstreamStart = Date.now();
  log('debug', 'upstream request', { reqId, method: req.method, path: req.url, mode });
  logCurl(reqId, req.method, req.url, headers);

  const proxyReq = https.request({
    hostname: TARGET.hostname,
    port: TARGET.port || 443,
    path: req.url,
    method: req.method,
    headers,
    agent: upstreamAgent,
  }, (proxyRes) => {
    log('info', 'upstream response', {
      reqId, status: proxyRes.statusCode,
      durationMs: Date.now() - upstreamStart,
      contentLength: proxyRes.headers['content-length'], mode,
    });
    // Override upstream Cache-Control: the proxy, not AEM, decides what the
    // browser should do with these responses. ETag / Last-Modified pass
    // through unchanged so browser conditional revalidation keeps working.
    const outHeaders = dropHeaders(stripResponseCookies(proxyRes.headers), [
      'cache-control',
      'access-control-allow-origin', 'access-control-allow-methods',
      'access-control-allow-headers', 'access-control-expose-headers',
      'access-control-max-age', 'access-control-allow-credentials',
      ...HOP_BY_HOP,
    ]);
    outHeaders['Cache-Control'] = cacheControlFor(mode, proxyRes.statusCode);
    outHeaders['X-Cache'] = 'BYPASS';
    Object.assign(outHeaders, CORS_HEADERS);
    res.writeHead(proxyRes.statusCode, outHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    log('error', 'upstream request error', { reqId, message: err.message });
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain', ...CORS_HEADERS });
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq);
}

async function handleRequest(reqId, req, res, mode, maxAgeCeiling) {
  if (mode === 'stage' && CACHE_TTL_SEC > 0) {
    return handleCacheable(reqId, req, res, mode, maxAgeCeiling);
  }
  return handleBypass(reqId, req, res, mode);
}

function onHandlerError(reqId, res, err) {
  log('error', 'handler error', { reqId, message: err.message });
  if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain', ...CORS_HEADERS });
  res.end('Bad Gateway');
}

log('info', 'starting', {
  target: TARGET.origin, port: PORT, sslCert: SSL_CERT, sslKey: SSL_KEY,
  tokenEndpoint: TOKEN_ENDPOINT, logLevel: LOG_LEVEL,
  stageCacheControl: STAGE_CACHE_CONTROL, bypassCacheControl: BYPASS_CACHE_CONTROL,
  cacheTtlSec: CACHE_TTL_SEC, cacheMaxEntries: CACHE_MAX_ENTRIES,
});

try {
  await getToken();
} catch (err) {
  log('error', 'initial token mint failed, exiting', { message: err.message });
  process.exit(1);
}

const server = http2.createSecureServer({ ...tlsOptions, allowHTTP1: true }, (req, res) => {
  const reqId = randomBytes(4).toString('hex');
  const start = Date.now();

  if (req.url === '/favicon.ico') {
    log('debug', 'favicon short-circuit', { reqId });
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // CORS preflight: answer directly so a 404 from upstream on OPTIONS can't
  // strip our CORS headers and break the browser's preflight check.
  if (req.method === 'OPTIONS') {
    log('debug', 'preflight short-circuit', { reqId });
    res.writeHead(204, { ...CORS_HEADERS, 'Content-Length': '0' });
    res.end();
    return;
  }

  // Mode selection. Stage-mode signals (any of):
  //  - explicit opt-in: Cache-Control: max-age>0 on the request.
  //  - Origin/Referer matching a known stage front-end (www.stage.adobe.com,
  //    *.aem.page).
  //  - User-Agent carrying Nala's NALA-MAS marker.
  // An explicit no-store / max-age=0 / Pragma: no-cache always wins over the
  // heuristics above (see isExplicitNoStore), so any specific caller — e.g.
  // one Nala test case that needs guaranteed freshness — can still force a
  // bypass. Non-GET/HEAD is always authoring; writes are never cacheable.
  const isCacheableMethod = req.method === 'GET' || req.method === 'HEAD';
  const noStore = isCacheableMethod && isExplicitNoStore(req.headers['cache-control'], req.headers['pragma']);
  const reqMaxAge = parseMaxAge(req.headers['cache-control']);
  const heuristicStage = isCacheableMethod && !noStore && (
    matchesStageOrigin(req.headers['origin'], req.headers['referer']) ||
    isNalaRequest(req.headers['user-agent'])
  );
  const mode = isCacheableMethod && !noStore && (reqMaxAge > 0 || heuristicStage)
    ? 'stage' : 'bypass';
  // Heuristic-triggered stage requests didn't specify their own max-age, so
  // there's no per-request ceiling to enforce beyond the operator's own
  // CACHE_TTL_SEC (see cacheGet).
  const effectiveMaxAge = reqMaxAge > 0 ? reqMaxAge : Infinity;

  log('info', 'request', {
    reqId, method: req.method, url: req.url,
    remote: req.socket.remoteAddress, mode, reqMaxAge, heuristicStage, noStore,
    headers: redactHeaders(req.headers),
  });

  res.on('finish', () => {
    log('info', 'response', {
      reqId, status: res.statusCode, durationMs: Date.now() - start,
      cacheEntries: cacheSizeLabel(),
    });
  });

  handleRequest(reqId, req, res, mode, effectiveMaxAge).catch((err) => onHandlerError(reqId, res, err));
});

server.listen(PORT, () => {
  log('info', 'listening', { port: PORT, target: TARGET.origin });
});
