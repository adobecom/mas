import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    testMatch: '*.pw.js',
    globalSetup: '../libs/rate-limit-coordinator.js',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 30000,
    reporter: 'line',
    outputDir: '../../test-results/setup-cache',
    use: { viewport: { width: 1280, height: 720 }, userAgent: 'Nala offline regression' },
});
