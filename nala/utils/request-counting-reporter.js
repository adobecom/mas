import { readFileSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Reporter that adds multi-service request summary at the end
 * Supports ODIN AEM, WCS, MAS/IO and other configured services
 */
export default class RequestCountingReporter {
    constructor(options) {
        this.options = options;
    }

    // Playwright reporter interface methods
    onBegin(config, suite) {}
    async onTestEnd(test, result) {}

    async onEnd() {
        // Print multi-service request summary after all tests complete
        this.printRequestSummary();
    }

    printRequestSummary() {
        // Sum all individual test count files across all services
        const serviceTotals = {};
        const serviceMethodCounts = {};
        const trackedUrls = {};
        const testResultsDir = './test-results';

        try {
            if (existsSync(testResultsDir)) {
                // Find all request-count-*.json files
                const files = readdirSync(testResultsDir);
                const countFiles = files.filter((file) => file.startsWith('request-count-') && file.endsWith('.json'));

                // Process each test's data
                for (const file of countFiles) {
                    try {
                        const filePath = join(testResultsDir, file);
                        const jsonData = readFileSync(filePath, 'utf8');
                        const data = JSON.parse(jsonData);

                        // Store tracked URLs (should be consistent across tests)
                        Object.assign(trackedUrls, data.trackedUrls || {});

                        // Aggregate service counts
                        for (const [serviceName, serviceData] of Object.entries(data.serviceCounts || {})) {
                            // Initialize service totals
                            if (!serviceTotals[serviceName]) {
                                serviceTotals[serviceName] = 0;
                                serviceMethodCounts[serviceName] = {};
                            }

                            // Add total requests
                            serviceTotals[serviceName] += serviceData.totalRequests || 0;

                            // Aggregate method counts
                            for (const [method, count] of Object.entries(serviceData.methods || {})) {
                                serviceMethodCounts[serviceName][method] =
                                    (serviceMethodCounts[serviceName][method] || 0) + count;
                            }
                        }

                        // Delete the file after reading to prevent accumulation
                        unlinkSync(filePath);
                    } catch (error) {
                        // Skip corrupted files (might already be deleted)
                    }
                }
            }
        } catch (error) {
            console.error('Error reading request count files:', error.message);
        }

        // Print summary for each service
        if (Object.keys(serviceTotals).length > 0) {
            console.log('\n    \x1b[1m\x1b[34m---------Request Summary--------------\x1b[0m');

            for (const [serviceName, total] of Object.entries(serviceTotals).sort()) {
                // Service header
                const serviceLabel = `# Total ${serviceName} Requests`;
                const servicePadding = ' '.repeat(Math.max(0, 25 - serviceLabel.length));
                console.log(`    \x1b[1m\x1b[33m${serviceLabel}${servicePadding}: \x1b[0m\x1b[32m${total}\x1b[0m`);

                // Method breakdown for this service
                const methods = serviceMethodCounts[serviceName] || {};
                for (const [method, count] of Object.entries(methods).sort()) {
                    const methodLabel = `# ${method} Requests`;
                    const methodPadding = ' '.repeat(Math.max(0, 25 - methodLabel.length));
                    console.log(`        \x1b[1m\x1b[33m${methodLabel}${methodPadding}: \x1b[0m\x1b[32m${count}\x1b[0m`);
                }

                // Target URL for this service
                const targetUrl = trackedUrls[serviceName] || 'Unknown';
                const urlLabel = `# Target URL`;
                const urlPadding = ' '.repeat(Math.max(0, 25 - urlLabel.length));
                console.log(`        \x1b[1m\x1b[33m${urlLabel}${urlPadding}: \x1b[0m\x1b[32m${targetUrl}\x1b[0m\n`);
            }
        } else {
            console.log('\n    \x1b[1m\x1b[34m---------Request Summary--------------\x1b[0m');
            console.log('    \x1b[1m\x1b[33mNo requests tracked\x1b[0m');
        }
    }
}
