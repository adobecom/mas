import { ODIN_PREVIEW_ORIGIN } from '../constants.js';

const MISSING_STATUS = 'none';

export function createOdinTelemetry({ log }) {
    const sessionId = crypto.randomUUID();
    const counts = new Map();

    function countOf(status) {
        return counts.get(status) ?? 0;
    }

    function record(status) {
        counts.set(status, countOf(status) + 1);
    }

    function observe(entries) {
        for (const entry of entries) {
            if (entry.name.startsWith(ODIN_PREVIEW_ORIGIN)) record(entry.responseStatus ?? MISSING_STATUS);
        }
    }

    function flush() {
        if (counts.size === 0) return;
        const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
        const throttled = countOf(429);
        const unknown = countOf(0) + countOf(MISSING_STATUS);
        const statuses = [...counts.entries()].map(([status, count]) => `${status}:${count}`).join(',');
        log(
            `Odin preview requests¶session=${sessionId}¶total=${total}¶429=${throttled}¶unknown=${unknown}¶statuses=${statuses}`,
            {
                severity: throttled > 0 ? 'warning' : 'info',
                sampleRate: 100,
                tags: 'studio,odin-preview',
            },
        );
        counts.clear();
    }

    return { observe, flush };
}

export function startOdinTelemetry() {
    if (typeof PerformanceObserver === 'undefined') return;
    const telemetry = createOdinTelemetry({ log: (message, options) => window.lana?.log(message, options) });
    new PerformanceObserver((list) => telemetry.observe(list.getEntries())).observe({ type: 'resource', buffered: true });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') telemetry.flush();
    });
    window.addEventListener('pagehide', telemetry.flush);
}
