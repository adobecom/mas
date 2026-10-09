import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RECOVERY_GAP_MS = 100;
const LEASE_MS = 90000;
const RECOVERY_WINDOW_MS = 10000;
const FOREGROUND_BURST = 3;

export const previewOrigin = () => new URL(process.env.NALA_ODIN_PREVIEW_ORIGIN || 'https://odinpreview.corp.adobe.com').origin;
export const isPreviewOrigin = (url) => new URL(url).origin === previewOrigin();
export const isOdinOrigin = (url) => {
    const { hostname } = new URL(url);
    return isPreviewOrigin(url) || hostname.endsWith('.adobeaemcloud.com') || hostname === 'odin.adobe.com';
};

export function resolveOdinMaxRps() {
    if (process.env.NALA_ODIN_PREVIEW_MAX_RPS) return Number(process.env.NALA_ODIN_PREVIEW_MAX_RPS);
    if (!process.env.NALA_TOTAL_WORKERS) return 10;
    const total = Number(process.env.NALA_TOTAL_WORKERS);
    const workers = Number(process.env.NALA_WORKER_COUNT);
    const budget = Number(process.env.NALA_ODIN_MAX_RPS || 20);
    if (!Number.isInteger(total) || !Number.isInteger(workers) || workers <= 0 || total < workers || budget <= 0) {
        throw new Error('Odin worker allocation requires positive worker counts within the total pool and a positive budget');
    }
    return (budget * workers) / total;
}

/** Author and preview traffic share a budget; all origins honor observed cooldowns. */
export class OriginRateLimits {
    origins = new Map();

    constructor({
        origin = previewOrigin(),
        maxRps = resolveOdinMaxRps(),
        maxInFlight = Number(process.env.NALA_ODIN_PREVIEW_MAX_IN_FLIGHT || 3),
    } = {}) {
        if (!Number.isFinite(maxRps) || maxRps <= 0 || !Number.isInteger(maxInFlight) || maxInFlight <= 0) {
            throw new Error('Odin preview MAX_RPS must be positive and MAX_IN_FLIGHT must be a positive integer');
        }
        this.preview = origin;
        this.startedAt = Date.now();
        this.minGap = 1000 / maxRps;
        this.maxInFlight = maxInFlight;
        this.origins.set(origin, this.createState(this.minGap));
    }

    createState(gap) {
        return {
            deadline: 0,
            nextAt: 0,
            lastStart: 0,
            queue: [],
            timer: null,
            owners: [],
            foregroundBursts: new Map(),
            gap,
            decreaseUntil: 0,
            recoveredAt: 0,
            successes: 0,
            leases: new Map(),
            recentStarts: [],
            userAgents: new Set(),
            paths: new Map(),
            stats: {
                starts: 0,
                completed: 0,
                peakInFlight: 0,
                peakStartsPerSecond: 0,
                latencyMs: 0,
                maxLatencyMs: 0,
                waitMs: 0,
                cancelled: 0,
                maxWaitMs: 0,
                foregroundStarts: 0,
                maxForegroundWaitMs: 0,
            },
        };
    }

    cooldown(origin, deadline) {
        origin = this.budgetOrigin(origin);
        let state = this.origins.get(origin);
        if (!state) {
            state = this.createState(RECOVERY_GAP_MS);
            this.origins.set(origin, state);
        }
        const now = Date.now();
        if (origin === this.preview) {
            if (now >= Math.max(state.decreaseUntil, state.deadline)) {
                state.gap = Math.min(Math.max(1000, this.minGap), state.gap * 2);
                state.nextAt = Math.max(state.nextAt, state.lastStart + state.gap);
            }
            state.decreaseUntil = Math.max(state.decreaseUntil, deadline, now + 1000);
            state.successes = 0;
            state.recoveredAt = Math.max(deadline, now);
        }
        state.deadline = Math.max(state.deadline, deadline);
        this.pump(state);
    }

    budgetOrigin(origin) {
        return origin === this.preview || isOdinOrigin(origin) ? this.preview : origin;
    }

    wait(origin, read, { signal, owner = read?.owner, priority = read?.priority } = {}) {
        origin = this.budgetOrigin(origin);
        const state = this.origins.get(origin);
        if (!state) return Promise.resolve(0);
        signal?.throwIfAborted();
        const started = Date.now();
        return new Promise((resolve, reject) => {
            const entry = { read, owner, priority, started, resolve, reject, signal };
            entry.cancel = () => {
                const index = state.queue.indexOf(entry);
                if (index < 0) return;
                state.queue.splice(index, 1);
                if (!state.queue.some((queued) => queued.owner === owner)) state.foregroundBursts.delete(owner);
                state.stats.cancelled++;
                reject(signal.reason);
                this.pump(state);
            };
            signal?.addEventListener('abort', entry.cancel, { once: true });
            state.queue.push(entry);
            if (!state.owners.includes(owner)) state.owners.push(owner);
            this.pump(state);
        });
    }

    pump(state) {
        clearTimeout(state.timer);
        state.timer = null;
        while (state.queue.length) {
            const now = Date.now();
            for (const [id, lease] of state.leases) {
                if (now - lease.started < LEASE_MS) continue;
                state.leases.delete(id);
                console.warn(`[NALA] Expired Odin read permit for ${this.preview}${lease.path}; releasing abandoned capacity.`);
            }
            state.owners = state.owners.filter((owner) => state.queue.some((entry) => entry.owner === owner));
            const available = (entry) => !entry.read || state.leases.size < this.maxInFlight;
            const ownerIndex = state.owners.findIndex((owner) =>
                state.queue.some((entry) => entry.owner === owner && available(entry)),
            );
            const delay = Math.max(state.deadline, state.nextAt) - now;
            if (delay > 0 || ownerIndex < 0) {
                state.timer = setTimeout(() => this.pump(state), Math.max(1, Math.ceil(delay > 0 ? delay : 50)));
                return;
            }
            const owner = state.owners[ownerIndex];
            const backgroundIndex = state.queue.findIndex(
                (entry) => entry.owner === owner && available(entry) && entry.priority !== 'foreground',
            );
            const foregroundIndex = state.queue.findIndex(
                (entry) => entry.owner === owner && available(entry) && entry.priority === 'foreground',
            );
            const useForeground =
                foregroundIndex >= 0 && (backgroundIndex < 0 || (state.foregroundBursts.get(owner) ?? 0) < FOREGROUND_BURST);
            const index = useForeground ? foregroundIndex : backgroundIndex;
            const entry = state.queue[index];
            state.queue.splice(index, 1);
            state.owners.splice(ownerIndex, 1);
            if (state.queue.some((queued) => queued.owner === entry.owner)) {
                state.owners.push(entry.owner);
                state.foregroundBursts.set(owner, useForeground ? (state.foregroundBursts.get(owner) ?? 0) + 1 : 0);
            } else state.foregroundBursts.delete(owner);
            entry.signal?.removeEventListener('abort', entry.cancel);
            state.lastStart = now;
            state.nextAt = now + state.gap;
            const waitMs = now - entry.started;
            if (entry.priority === 'foreground') {
                state.stats.foregroundStarts++;
                state.stats.maxForegroundWaitMs = Math.max(state.stats.maxForegroundWaitMs, waitMs);
            }
            if (!entry.read) {
                entry.resolve(waitMs);
                continue;
            }
            const { read } = entry;
            const id = read.requestId ?? randomUUID();
            state.leases.set(id, { started: now, path: read.path });
            state.userAgents.add(read.userAgent);
            state.recentStarts = state.recentStarts.filter((time) => now - time < 1000);
            state.recentStarts.push(now);
            state.paths.set(read.path, (state.paths.get(read.path) ?? 0) + 1);
            state.stats.starts++;
            state.stats.waitMs += waitMs;
            state.stats.maxWaitMs = Math.max(state.stats.maxWaitMs, waitMs);
            state.stats.peakInFlight = Math.max(state.stats.peakInFlight, state.leases.size);
            state.stats.peakStartsPerSecond = Math.max(state.stats.peakStartsPerSecond, state.recentStarts.length);
            entry.resolve({ id, waitMs });
        }
        state.owners = [];
    }

    release(origin, id, status, latencyMs, cancelled = false) {
        origin = this.budgetOrigin(origin);
        const state = this.origins.get(origin);
        if (!state?.leases.delete(id)) throw new Error('Unknown or expired Odin read permit');
        state.stats.completed++;
        state.stats.latencyMs += latencyMs;
        state.stats.maxLatencyMs = Math.max(state.stats.maxLatencyMs, latencyMs);
        if (!cancelled && status >= 200 && status < 500 && status !== 429) {
            state.successes++;
            const now = Date.now();
            if (state.successes >= 20 && now - state.recoveredAt >= RECOVERY_WINDOW_MS) {
                state.gap = 1000 / Math.min(1000 / this.minGap, 1000 / state.gap + 1);
                state.recoveredAt = now;
                state.successes = 0;
            }
        } else if (!cancelled && [0, 429, 503, 529].includes(status)) state.successes = 0;
        this.pump(state);
    }

    cancel(origin, id) {
        const state = this.origins.get(this.budgetOrigin(origin));
        const index = state.queue.findIndex((entry) => entry.read?.requestId === id);
        if (index >= 0) {
            const [entry] = state.queue.splice(index, 1);
            entry.signal?.removeEventListener('abort', entry.cancel);
            entry.reject(new DOMException('Read acquisition cancelled', 'AbortError'));
            state.stats.cancelled++;
            this.pump(state);
            return;
        }
        if (state.leases.has(id)) {
            state.stats.cancelled++;
            this.release(origin, id, 0, 0, true);
        }
    }

    snapshot() {
        const state = this.origins.get(this.preview);
        return {
            origin: this.preview,
            elapsedMs: Date.now() - this.startedAt,
            maxRps: 1000 / this.minGap,
            maxInFlight: this.maxInFlight,
            currentRps: 1000 / state.gap,
            ...state.stats,
            active: state.leases.size,
            queued: state.queue.length,
            userAgents: [...state.userAgents],
            paths: Object.fromEntries(state.paths),
        };
    }
}

const localLimits = new OriginRateLimits();

export async function coordinateRateLimit(action, origin, deadline, details = {}, { signal } = {}) {
    if (action === 'acquire') details = { ...details, requestId: randomUUID() };
    const endpoint = process.env.NALA_RATE_LIMIT_COORDINATOR;
    if (!endpoint) {
        if (action === 'cooldown') return localLimits.cooldown(origin, deadline);
        if (action === 'acquire') {
            const permit = await localLimits.wait(origin, details, { signal });
            if (signal?.aborted) {
                localLimits.cancel(origin, details.requestId);
                signal.throwIfAborted();
            }
            return permit;
        }
        if (action === 'cancel') return localLimits.cancel(origin, details.id);
        if (action === 'release')
            return localLimits.release(origin, details.id, details.status, details.latencyMs, details.cancelled);
        return localLimits.wait(origin, undefined, { signal, owner: details.owner, priority: details.priority });
    }
    try {
        const response = await fetch(`${endpoint}/${action}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ origin, deadline, ...details }),
            signal,
        });
        if (!response.ok) throw new Error(`Nala rate-limit coordinator failed: HTTP ${response.status}`);
        const result = await response.json();
        return action === 'acquire' ? result : result.waitMs;
    } catch (error) {
        if (action === 'acquire' && error.name === 'AbortError') {
            await coordinateRateLimit('cancel', origin, undefined, { id: details.requestId });
        }
        throw error;
    }
}

/** A fresh loopback coordinator belongs to this invocation, never another run or PR. */
export default async function initializeRateLimitCoordinator(config, options, pressureFile = 'odin-pressure.json') {
    const limits = new OriginRateLimits(options);
    const token = randomUUID();
    const handle = async (request, response) => {
        if (
            request.method !== 'POST' ||
            !['wait', 'cooldown', 'acquire', 'release', 'cancel'].some((action) => request.url === `/${token}/${action}`)
        ) {
            response.writeHead(404);
            response.end();
            return;
        }
        let body = '';
        for await (const chunk of request) body += chunk;
        const details = JSON.parse(body);
        const { origin, deadline } = details;
        const controller = new AbortController();
        response.on('close', () => {
            if (!response.writableEnded) controller.abort();
        });
        let waitMs = 0;
        let permit;
        if (request.url.endsWith('/acquire')) permit = await limits.wait(origin, details, { signal: controller.signal });
        else if (request.url.endsWith('/cancel')) limits.cancel(origin, details.id);
        else if (request.url.endsWith('/release'))
            limits.release(origin, details.id, details.status, details.latencyMs, details.cancelled);
        else if (request.url.endsWith('/cooldown')) limits.cooldown(origin, deadline);
        else
            waitMs = await limits.wait(origin, undefined, {
                signal: controller.signal,
                owner: details.owner,
                priority: details.priority,
            });
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify(permit ?? { waitMs }));
    };
    const server = createServer((request, response) => {
        handle(request, response).catch((error) => {
            if (error.name === 'AbortError') {
                if (!response.destroyed) {
                    response.writeHead(499);
                    response.end('Read acquisition cancelled');
                }
                return;
            }
            console.error(`[NALA] Rate-limit coordinator error: ${error.message}`);
            response.writeHead(500);
            response.end();
        });
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    process.env.NALA_RATE_LIMIT_COORDINATOR = `http://127.0.0.1:${server.address().port}/${token}`;
    return async () => {
        const outputDir = config?.projects?.[0]?.outputDir;
        if (outputDir) {
            mkdirSync(outputDir, { recursive: true });
            writeFileSync(join(outputDir, pressureFile), JSON.stringify(limits.snapshot()));
        }
        delete process.env.NALA_RATE_LIMIT_COORDINATOR;
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    };
}
