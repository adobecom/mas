# mas-freyja-proxy

Minimal HTTP/2 reverse proxy fronting the AEM Freyja preview environment
(default `https://preview-p22655-e59433.adobeaemcloud.com/`, override via
`TARGET_ORIGIN`) for MAS Studio. Injects an Adobe IMS bearer token
server-side (OAuth Server-to-Server / client_credentials grant) so clients
don't handle IMS credentials.

Zero runtime dependencies — Node stdlib only (`node:http2`, `node:https`,
`node:crypto`, `node:fs`) and the built-in `.env` loader.

## Modes

Selected per-request. Stage-mode GET/HEAD responses are cached
**server-side** (shared across every caller, TTL via `CACHE_TTL_SEC`) *and*
get a browser-facing `Cache-Control` so the browser caches on top of that.
Authoring responses are never cached anywhere.

Stage mode is triggered by any of:

| Signal                          | Example                                          |
| -------------------------------- | ------------------------------------------------- |
| Explicit opt-in                 | `Cache-Control: max-age=N` (N > 0) on the request  |
| Origin/Referer                  | `www.stage.adobe.com`, or any `*.aem.page`         |

Real callers (Studio's preview panel, stage/`*.aem.page` pages) mostly
don't set `Cache-Control` themselves, hence the Origin/Referer heuristic —
the explicit header remains the primary, most precise signal where a caller
does set it.

An explicit `Cache-Control: no-store`, `max-age=0`, or `Pragma: no-cache`
**always overrides the heuristic above** and forces authoring/no-store.
Non-GET/HEAD is always authoring; writes are never cacheable.

| Caller              | Sends                      | Proxy emits (on 2xx)                                                          |
| ------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| Authoring (default) | _no signal, or explicit opt-out_ | `no-store`                                                              |
| Stage / website      | any stage-mode signal above | `public, max-age=15, stale-while-revalidate=604800, stale-if-error=604800`    |

`N` (when present) is a mode/freshness signal only; the emitted *downstream*
policy is fixed (15 s fresh, 7 d SWR) regardless of N. Non-2xx responses
always get `no-store` so transient upstream errors can't be pinned in either
cache.

### Server-side cache (stage mode only)

A shared, in-memory response cache (`CACHE_TTL_SEC`, default `60`) sits in
front of the upstream call for stage-mode GET/HEAD requests. Unlike the
browser cache, it's shared across every caller — including QA automation
runs that each use a fresh, isolated browser context and would otherwise get
zero benefit from browser-side caching alone. Concurrent identical requests
during a miss are coalesced onto a single upstream fetch. Every response
carries `X-Cache: HIT | MISS | BYPASS` for observability, and every logged
response includes `cacheEntries` (e.g. `345/500`) showing current size against
the cap. Capped at `CACHE_MAX_ENTRIES` entries (default `500`, LRU eviction);
cleared on restart. Set `CACHE_TTL_SEC=0` to disable
and fall back to pure passthrough.

A cache hit also honors the *caller's own* `Cache-Control: max-age=N` (RFC
7234 request semantics: "don't give me anything older than N seconds") as a
ceiling tighter than `CACHE_TTL_SEC` — an entry older than the caller's
requested `max-age` is treated as a miss (and refreshed) even if it's still
within the operator's TTL, rather than silently serving stale data past what
the caller asked for. Requests that land in stage mode via the
Origin/Referer/User-Agent heuristics (no explicit `max-age` of their own)
have no extra ceiling beyond `CACHE_TTL_SEC`.

## Features

- **HTTP/2** with HTTP/1.1 fallback (`http2.createSecureServer({ allowHTTP1: true })`).
- **IMS token injection** via `client_credentials` grant, auto-refresh with
  in-flight coalescing.
- **CORS always on** — preflight is answered directly by the proxy; every
  response carries `Access-Control-Allow-*` so upstream errors remain visible.
- **Keep-alive upstream pool** (`https.Agent({ keepAlive: true, maxSockets: 64 })`)
  — critical so browser SWR revalidations don't pay a TLS handshake per 304.
- **Shared server-side cache** for stage-mode responses (`CACHE_TTL_SEC`),
  with single-flight coalescing of concurrent identical requests during a
  miss. `X-Cache: HIT | MISS | BYPASS` on every response.
- **Header hygiene**: strips client-scoped request headers (`cookie`,
  `authorization`, `referer`, `origin`, `sec-ch-ua*`, `sec-fetch-*`, etc.) and
  hop-by-hop headers per RFC 7230. Drops `Set-Cookie` and upstream
  `Cache-Control` from responses. Forwards `If-None-Match` / `If-Modified-Since`
  so browser conditional revalidation works end-to-end.

## Configuration (`.env`)

| Var              | Required | Purpose                                                        |
| ---------------- | -------- | -------------------------------------------------------------- |
| `SSL_CERT`       | yes      | Path to PEM certificate (chain).                               |
| `SSL_KEY`        | yes      | Path to PEM private key.                                       |
| `CLIENT_ID`      | yes      | IMS S2S client ID.                                             |
| `CLIENT_SECRET`  | yes      | IMS S2S client secret.                                         |
| `SCOPES`         | yes      | IMS scopes, e.g. `AdobeID, openid`.                            |
| `TARGET_ORIGIN`  | no       | Override upstream origin (default Freyja preview, see above). |
| `PORT`           | no       | Listen port (default `3000`).                                  |
| `CACHE_TTL_SEC`  | no       | Server-side cache TTL (seconds) for stage-mode responses (default `60`; `0` disables). |
| `CACHE_MAX_ENTRIES` | no    | Max entries in the shared cache before LRU eviction (default `500`). |
| `TOKEN_ENDPOINT` | no       | Override IMS token endpoint (default `ims-na1` prod).          |
| `LOG_LEVEL`      | no       | `error` \| `warn` \| `info` \| `debug` (default `debug`).      |
| `LOG_CURL`       | no       | Log a reproducible `curl` per upstream call. Default on.       |

## Running

```bash
node server.mjs
```

Systemd (production): see [`service.sh`](service.sh) and
[`deploy/mas-freyja-proxy.service`](deploy/mas-freyja-proxy.service).

```bash
./service.sh install   # template + enable + start
./service.sh status
./service.sh logs      # tails journald
./service.sh restart
./service.sh uninstall
```

## Logging

Structured lines to stdout; `journalctl -u mas-freyja-proxy` under systemd.
Every request gets a short `reqId` threaded through its log lines. `LOG_CURL=true`
emits a ready-to-run `curl` per upstream call — includes the real bearer token,
leave off in shared environments.
