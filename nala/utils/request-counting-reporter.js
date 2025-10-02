import { readFileSync, existsSync } from 'fs';

/**
 * Reporter that adds ODIN AEM request summary at the end
 */
export default class RequestCountingReporter {
    constructor(options) {
        this.options = options;
    }

    // Playwright reporter interface methods
    onBegin(config, suite) {}
    async onTestEnd(test, result) {}

    async onEnd() {
        // Print ODIN AEM request summary after all tests complete
        this.printAEMSummary();
    }

    printAEMSummary() {
        // Read the final count from file
        let totalAEMRequests = 0;
        const counterFile = './test-results/aem-request-count.txt';

        try {
            if (existsSync(counterFile)) {
                const count = readFileSync(counterFile, 'utf8');
                totalAEMRequests = parseInt(count) || 0;
            }
        } catch (error) {
            totalAEMRequests = 0;
        }

        // Print the ODIN AEM request summary (base-reporter.js handles the main summary)
        const requestSummary = `
    \x1b[1m\x1b[34m---------ODIN AEM Request Summary--------------\x1b[0m
    \x1b[1m\x1b[33m# Total ODIN AEM Requests    :\x1b[0m \x1b[32m${totalAEMRequests}\x1b[0m
    \x1b[1m\x1b[33m# Target URL            :\x1b[0m \x1b[32mhttps://author-p22655-e59433.adobeaemcloud.com\x1b[0m`;

        console.log(requestSummary);
    }
}
