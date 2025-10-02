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
            console.log(`❌ Failed to save request count: ${error.message}`);
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
        console.log(`🎯 Target URL set to: ${url} for service: ${serviceName}`);
    }
}

export default GlobalRequestCounter;
export { DEFAULT_TRACKED_URLS };
