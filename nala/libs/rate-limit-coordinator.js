import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RECOVERY_GAP_MS = 100;
const LEASE_MS = 90000;
const RECOVERY_WINDOW_MS = 10000;

export const previewOrigin = () => new URL(process.env.NALA_ODIN_PREVIEW_ORIGIN || 'https://odinpreview.corp.adobe.com').origin;
export const isPreviewOrigin = (url) => new URL(url).origin === previewOrigin();

/** Preview reads are paced from startup; all origins still honor observed cooldowns. */
export class OriginRateLimits {
    origins = new Map();

    constructor({
        origin = previewOrigin(),
        maxRps = Number(process.env.NALA_ODIN_PREVIEW_MAX_RPS || 10),
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
            queue: Promise.resolve(),
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
            },
        };
    }

    cooldown(origin, deadline) {
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
    }

    async wait(origin, read) {
        const state = this.origins.get(origin);
        if (!state) return 0;
        const started = Date.now();
        const next = state.queue.then(async () => {
            while (true) {
                const now = Date.now();
                for (const [id, lease] of state.leases) {
                    if (now - lease.started >= LEASE_MS) {
                        state.leases.delete(id);
                        console.warn(
                            `[NALA] Expired Odin read permit for ${origin}${lease.path}; releasing abandoned capacity.`,
                        );
                    }
                }
                const delay = Math.max(state.deadline, state.nextAt) - now;
                if (delay > 0) await new Promise((resolve) => setTimeout(resolve, Math.ceil(delay)));
                else if (read && state.leases.size >= this.maxInFlight) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                } else break;
            }
            const now = Date.now();
            state.lastStart = now;
            state.nextAt = now + state.gap;
            const waitMs = now - started;
            if (!read) return waitMs;
            const id = randomUUID();
            state.leases.set(id, { started: now, path: read.path });
            state.userAgents.add(read.userAgent);
            state.recentStarts = state.recentStarts.filter((time) => now - time < 1000);
            state.recentStarts.push(now);
            state.paths.set(read.path, (state.paths.get(read.path) ?? 0) + 1);
            state.stats.starts++;
            state.stats.waitMs += waitMs;
            state.stats.peakInFlight = Math.max(state.stats.peakInFlight, state.leases.size);
            state.stats.peakStartsPerSecond = Math.max(state.stats.peakStartsPerSecond, state.recentStarts.length);
            return { id, waitMs };
        });
        state.queue = next.then(() => {});
        return next;
    }

    release(origin, id, status, latencyMs) {
        const state = this.origins.get(origin);
        if (!state?.leases.delete(id)) throw new Error('Unknown or expired Odin read permit');
        state.stats.completed++;
        state.stats.latencyMs += latencyMs;
        state.stats.maxLatencyMs = Math.max(state.stats.maxLatencyMs, latencyMs);
        if (status >= 200 && status < 400) {
            state.successes++;
            const now = Date.now();
            if (state.successes >= 20 && now - state.recoveredAt >= RECOVERY_WINDOW_MS) {
                state.gap = Math.max(this.minGap, state.gap * 0.9);
                state.recoveredAt = now;
                state.successes = 0;
            }
        } else state.successes = 0;
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
            userAgents: [...state.userAgents],
            paths: Object.fromEntries(state.paths),
        };
    }
}

const localLimits = new OriginRateLimits();

export async function coordinateRateLimit(action, origin, deadline, details = {}) {
    const endpoint = process.env.NALA_RATE_LIMIT_COORDINATOR;
    if (!endpoint) {
        if (action === 'cooldown') return localLimits.cooldown(origin, deadline);
        if (action === 'acquire') return localLimits.wait(origin, details);
        if (action === 'release') return localLimits.release(origin, details.id, details.status, details.latencyMs);
        return localLimits.wait(origin);
    }
    const response = await fetch(`${endpoint}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ origin, deadline, ...details }),
    });
    if (!response.ok) throw new Error(`Nala rate-limit coordinator failed: HTTP ${response.status()}`);
    const result = await response.json();
    return action === 'acquire' ? result : result.waitMs;
}

/** A fresh loopback coordinator belongs to this invocation, never another run or PR. */
export default async function initializeRateLimitCoordinator(config, options, pressureFile = 'odin-pressure.json') {
    const limits = new OriginRateLimits(options);
    const token = randomUUID();
    const handle = async (request, response) => {
        if (
            request.method !== 'POST' ||
            !['wait', 'cooldown', 'acquire', 'release'].some((action) => request.url === `/${token}/${action}`)
        ) {
            response.writeHead(404);
            response.end();
            return;
        }
        let body = '';
        for await (const chunk of request) body += chunk;
        const details = JSON.parse(body);
        const { origin, deadline } = details;
        let waitMs = 0;
        let permit;
        if (request.url.endsWith('/acquire')) permit = await limits.wait(origin, details);
        else if (request.url.endsWith('/release')) limits.release(origin, details.id, details.status, details.latencyMs);
        else if (request.url.endsWith('/cooldown')) limits.cooldown(origin, deadline);
        else waitMs = await limits.wait(origin);
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify(permit ?? { waitMs }));
    };
    const server = createServer((request, response) => {
        handle(request, response).catch((error) => {
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
