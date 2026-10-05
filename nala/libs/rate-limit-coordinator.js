import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const RECOVERY_GAP_MS = 100;

/** Serialize recovery traffic only after an origin has returned a 429. */
export class OriginRateLimits {
    origins = new Map();

    cooldown(origin, deadline) {
        let state = this.origins.get(origin);
        if (!state) {
            state = { deadline: 0, nextAt: 0, queue: Promise.resolve() };
            this.origins.set(origin, state);
        }
        state.deadline = Math.max(state.deadline, deadline);
    }

    async wait(origin) {
        const state = this.origins.get(origin);
        if (!state) return 0;
        const started = Date.now();
        const next = state.queue.then(async () => {
            let delay;
            while ((delay = Math.max(state.deadline, state.nextAt) - Date.now()) > 0) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
            state.nextAt = Date.now() + RECOVERY_GAP_MS;
            return Date.now() - started;
        });
        state.queue = next;
        return next;
    }
}

const localLimits = new OriginRateLimits();

export async function coordinateRateLimit(action, origin, deadline) {
    const endpoint = process.env.NALA_RATE_LIMIT_COORDINATOR;
    if (!endpoint) {
        if (action === 'cooldown') return localLimits.cooldown(origin, deadline);
        return localLimits.wait(origin);
    }
    const response = await fetch(`${endpoint}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ origin, deadline }),
    });
    if (!response.ok) throw new Error(`Nala rate-limit coordinator failed: HTTP ${response.status()}`);
    return (await response.json()).waitMs;
}

/** A fresh loopback coordinator belongs to this invocation, never another run or PR. */
export default async function initializeRateLimitCoordinator() {
    const limits = new OriginRateLimits();
    const token = randomUUID();
    const handle = async (request, response) => {
        if (request.method !== 'POST' || ![`/${token}/wait`, `/${token}/cooldown`].includes(request.url)) {
            response.writeHead(404);
            response.end();
            return;
        }
        let body = '';
        for await (const chunk of request) body += chunk;
        const { origin, deadline } = JSON.parse(body);
        let waitMs = 0;
        if (request.url.endsWith('/cooldown')) limits.cooldown(origin, deadline);
        else waitMs = await limits.wait(origin);
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ waitMs }));
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
        delete process.env.NALA_RATE_LIMIT_COORDINATOR;
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    };
}
