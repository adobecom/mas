/**
 * Global request counter utility for multiple services
 * Tracks requests to AEM, WCS, MAS/IO, and other configurable endpoints
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_TRACKED_URLS = {
    ODIN_AEM: 'https://author-p22655-e59433.adobeaemcloud.com',
    // Future: Add more services
    // WCS: 'https://www.adobe.com/web_commerce_artifact',
    // MAS_IO: 'https://mas.adobe.com/io',
};

// Store modules in globalThis for access from static methods
globalThis._fsModule = fs;
globalThis._pathModule = path;

// Store counter in globalThis within worker process
if (!globalThis.requestCounter) {
    globalThis.requestCounter = {
        serviceCounts: {}, // { serviceName: { totalRequests: 0, methods: {} } }
        trackedUrls: { ...DEFAULT_TRACKED_URLS },
        counterFile: './test-results/request-count.json',
    };
} else {
    // Merge defaults with any runtime additions (preserves addTrackedUrl calls)
    globalThis.requestCounter.trackedUrls = {
        ...DEFAULT_TRACKED_URLS,
        ...globalThis.requestCounter.trackedUrls,
    };
}

/** EDS / Helix edge (~200 rps cap). Lower workers does not cap in-flight requests per page. */
function resolveEdsMaxRps() {
    if (process.env.NALA_EDS_THROTTLE_DISABLED === '1') return 0;
    if (process.env.NALA_EDS_MAX_RPS !== undefined && process.env.NALA_EDS_MAX_RPS !== '') {
        const v = Number.parseInt(process.env.NALA_EDS_MAX_RPS, 10);
        return Number.isFinite(v) && v > 0 ? v : 0;
    }
    return process.env.CI === 'true' ? 150 : 0;
}

function isEdsEdgeHost(url) {
    try {
        const { hostname } = new URL(url);
        return (
            hostname.endsWith('.aem.live') ||
            hostname.endsWith('.hlx.page') ||
            hostname.endsWith('.hlx.live') ||
            hostname === 'aem.live'
        );
    } catch {
        return false;
    }
}

/**
 * Serialize route.continue() for EDS hosts with a minimum gap so burst RPS stays bounded.
 * Shared per worker (globalThis).
 */
function throttleEdsGap(maxRps) {
    const minGapMs = 1000 / maxRps;
    if (!globalThis._edsThrottleChain) {
        globalThis._edsThrottleChain = Promise.resolve();
    }

    const next = globalThis._edsThrottleChain.then(async () => {
        const last = globalThis._edsThrottleLastContinueAt ?? 0;
        const now = Date.now();
        const wait = Math.max(0, minGapMs - (now - last));
        if (wait > 0) {
            await new Promise((r) => setTimeout(r, wait));
        }
        globalThis._edsThrottleLastContinueAt = Date.now();
    });

    globalThis._edsThrottleChain = next.catch(() => {});
    return next;
}

class GlobalRequestCounter {
    /**
     * Initialize global request tracking for multiple services
     * @param {Page} page - Playwright page object
     */
    static async init(page) {
        // Reset counters for this individual test
        globalThis.requestCounter.serviceCounts = {};

        // Initialize each tracked service
        for (const serviceName of Object.keys(globalThis.requestCounter.trackedUrls)) {
            globalThis.requestCounter.serviceCounts[serviceName] = {
                totalRequests: 0,
                methods: {},
            };
        }

        const edsMaxRps = resolveEdsMaxRps();
        if (edsMaxRps > 0 && !globalThis._edsThrottleLogged) {
            console.info(
                `[NALA] EDS request pacing enabled (~${edsMaxRps} rps max for .aem.live / hlx hosts). Set NALA_EDS_THROTTLE_DISABLED=1 to turn off.\n`,
            );
            globalThis._edsThrottleLogged = true;
        }

        // Set up routing to track requests to all configured URLs
        await page.route('**/*', async (route) => {
            const url = route.request().url();
            const method = route.request().method();

            // Check which service this request belongs to
            for (const [serviceName, serviceUrl] of Object.entries(globalThis.requestCounter.trackedUrls)) {
                if (url.startsWith(serviceUrl)) {
                    const serviceCount = globalThis.requestCounter.serviceCounts[serviceName];
                    serviceCount.totalRequests++;
                    serviceCount.methods[method] = (serviceCount.methods[method] || 0) + 1;
                    break; // Only count for the first matching service
                }
            }

            if (edsMaxRps > 0 && isEdsEdgeHost(url)) {
                await throttleEdsGap(edsMaxRps);
            }

            await route.continue();
        });
    }

    /**
     * Save count to individual file per test to avoid race conditions completely
     */
    static saveCountToFileSync() {
        try {
            this._saveToIndividualFile();
        } catch (error) {
            console.log(`\x1b[31m✘\x1b[0m Failed to save request count: ${error.message}`);
        }
    }

    /**
     * Write this test's count to a unique file - reporter will sum them all
     */
    static _saveToIndividualFile() {
        const fs = globalThis._fsModule;
        const path = globalThis._pathModule;

        if (!fs || !path) {
            throw new Error('Modules not available - need to import at top level');
        }

        const dir = path.dirname(globalThis.requestCounter.counterFile);

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Create unique filename for this test execution
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const individualFile = path.join(dir, `request-count-${timestamp}-${random}.json`);

        // Write this test's counts and methods as JSON
        const data = {
            serviceCounts: globalThis.requestCounter.serviceCounts,
            trackedUrls: globalThis.requestCounter.trackedUrls,
        };

        fs.writeFileSync(individualFile, JSON.stringify(data));
    }

    /**
     * Get current total count for a specific service
     * @param {string} serviceName - Name of the service (e.g., 'ODIN_AEM')
     * @returns {number} Total requests made to that service
     */
    static getCurrentTotal(serviceName = 'ODIN_AEM') {
        return globalThis.requestCounter.serviceCounts[serviceName]?.totalRequests || 0;
    }

    /**
     * Reset request counter (for new test runs)
     */
    static reset() {
        globalThis.requestCounter.serviceCounts = {};
        this.saveCountToFileSync();
    }

    /**
     * Add or update a tracked service URL
     * @param {string} serviceName - Name of the service (e.g., 'WCS', 'MAS_IO')
     * @param {string} url - URL to track for this service
     */
    static addTrackedUrl(serviceName, url) {
        globalThis.requestCounter.trackedUrls[serviceName] = url;
        console.log(`🎯 Added tracked service: ${serviceName} -> ${url}`);
    }

    /**
     * Set target URL for a specific service (backward compatibility)
     * @param {string} url - Custom URL to track
     * @param {string} serviceName - Service name (defaults to ODIN_AEM)
     */
    static setTargetUrl(url, serviceName = 'ODIN_AEM') {
        globalThis.requestCounter.trackedUrls[serviceName] = url;
        console.log(`🎯 Target URL set to: ${url} for service: ${serviceName}\n`);
    }
}

export default GlobalRequestCounter;
export { DEFAULT_TRACKED_URLS };
