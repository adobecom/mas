/**
 * Global ODIN AEM request counter utility
 * Uses file-based persistence to work across Playwright worker processes
 */

import * as fs from 'fs';
import * as path from 'path';

// Store modules in globalThis for access from static methods
globalThis._fsModule = fs;
globalThis._pathModule = path;

// Store counter in globalThis within worker process
if (!globalThis.aemRequestCounter) {
    globalThis.aemRequestCounter = {
        totalRequests: 0,
        targetUrl: 'https://author-p22655-e59433.adobeaemcloud.com',
        counterFile: './test-results/aem-request-count.txt',
    };
}

class GlobalAEMCounter {
    /**
     * Initialize global request tracking for a page
     * Call this once in your test setup (beforeEach or beforeAll)
     * @param {Page} page - Playwright page object
     */
    static async init(page) {
        // Load existing count from file (for cross-process persistence)
        await this.loadCountFromFile();
        console.log(`🔄 Current ODIN AEM request count: ${globalThis.aemRequestCounter.totalRequests}`);

        // Always set up routing for each page
        await page.route('**/*', async (route) => {
            const url = route.request().url();

            if (url.startsWith(globalThis.aemRequestCounter.targetUrl)) {
                globalThis.aemRequestCounter.totalRequests++;
            }

            await route.continue();
        });

        console.log(`🔍 Global ODIN AEM request tracking initialized for: ${globalThis.aemRequestCounter.targetUrl}`);
    }

    /**
     * Save count to file synchronously (for immediate persistence)
     */
    static saveCountToFileSync() {
        try {
            this._saveCountSyncHelper();
        } catch (error) {
            console.log(`❌ Failed to save ODIN AEM request count: ${error.message}`);
        }
    }

    /**
     * Helper method that uses ES module imports
     */
    static _saveCountSyncHelper() {
        const fs = globalThis._fsModule;
        const path = globalThis._pathModule;

        if (!fs || !path) {
            throw new Error('Modules not available - need to import at top level');
        }

        const dir = path.dirname(globalThis.aemRequestCounter.counterFile);

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created ODIN AEM request directory: ${dir}`);
        }

        // Write count synchronously
        fs.writeFileSync(globalThis.aemRequestCounter.counterFile, globalThis.aemRequestCounter.totalRequests.toString());
        console.log(
            `💾 Saved ODIN AEM request count ${globalThis.aemRequestCounter.totalRequests} to ${globalThis.aemRequestCounter.counterFile}`,
        );
    }

    /**
     * Load count from file (for cross-process communication)
     */
    static async loadCountFromFile() {
        try {
            const fs = await import('fs/promises');
            const count = await fs.readFile(globalThis.aemRequestCounter.counterFile, 'utf8');
            globalThis.aemRequestCounter.totalRequests = parseInt(count) || 0;
        } catch (error) {
            // ODIN AEM request file doesn't exist yet - that's fine, start at 0
            globalThis.aemRequestCounter.totalRequests = 0;
        }
    }

    /**
     * Get current total count
     * @returns {number} Total ODIN AEM requests made across all tests
     */
    static getCurrentTotal() {
        return globalThis.aemRequestCounter.totalRequests;
    }

    /**
     * Reset ODIN AEM request counter (for new test runs)
     */
    static reset() {
        globalThis.aemRequestCounter.totalRequests = 0;
        this.saveCountToFileSync();
    }

    /**
     * Set custom target URL
     * @param {string} url - Custom URL to track
     */
    static setTargetUrl(url) {
        globalThis.aemRequestCounter.targetUrl = url;
    }
}

export default GlobalAEMCounter;
