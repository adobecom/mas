import { readFileSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

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
        // Sum all individual test count files - no race conditions!
        let totalAEMRequests = 0;
        const testResultsDir = './test-results';

        try {
            if (existsSync(testResultsDir)) {
                // Find all aem-count-*.txt files
                const files = readdirSync(testResultsDir);
                const countFiles = files.filter((file) => file.startsWith('aem-count-') && file.endsWith('.txt'));

                // Sum all individual counts
                for (const file of countFiles) {
                    try {
                        const filePath = join(testResultsDir, file);
                        const count = readFileSync(filePath, 'utf8');
                        totalAEMRequests += parseInt(count) || 0;

                        // Delete the file after reading to prevent accumulation
                        unlinkSync(filePath);
                    } catch (error) {
                        // Skip corrupted files (might already be deleted)
                    }
                }
            }
        } catch (error) {
            totalAEMRequests = 0;
        }

        // Print the ODIN AEM request summary
        const requestSummary = `
    \x1b[1m\x1b[34m---------ODIN AEM Request Summary--------------\x1b[0m
    \x1b[1m\x1b[33m# Total ODIN AEM Requests    :\x1b[0m \x1b[32m${totalAEMRequests}\x1b[0m
    \x1b[1m\x1b[33m# Target URL            :\x1b[0m \x1b[32mhttps://author-p22655-e59433.adobeaemcloud.com\x1b[0m`;

        console.log(requestSummary);
    }
}
