import { ODIN_PREVIEW_ORIGIN } from '../constants.js';

export function createOdinTelemetry({ origin = ODIN_PREVIEW_ORIGIN, log }) {
    const counts = new Map();

    function record(status) {
        counts.set(status, (counts.get(status) ?? 0) + 1);
    }

    function observe(entries) {
        for (const entry of entries) {
            if (entry.name.startsWith(origin)) record(entry.responseStatus ?? 0);
        }
    }

    function flush() {
        if (counts.size === 0) return;
        const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
        const throttled = counts.get(429) ?? 0;
        const statuses = [...counts.entries()].map(([status, count]) => `${status}:${count}`).join(',');
        log(`Odin preview requests¶total=${total}¶429=${throttled}¶statuses=${statuses}`, {
            severity: throttled > 0 ? 'warning' : 'info',
            errorType: 'i',
            tags: 'studio,odin-preview',
        });
        counts.clear();
    }

    return { record, observe, flush };
}

export function startOdinTelemetry() {
    if (typeof PerformanceObserver === 'undefined') return null;
    const telemetry = createOdinTelemetry({ log: (message, options) => window.lana?.log(message, options) });
    new PerformanceObserver((list) => telemetry.observe(list.getEntries())).observe({ type: 'resource', buffered: true });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') telemetry.flush();
    });
    window.addEventListener('pagehide', telemetry.flush);
    return telemetry;
}
