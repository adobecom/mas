import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './',
    use: {
        headless: false,
    },
    projects: [
        {
            name: 'chromium',
            use: { browserName: 'chromium' },
        },
    ],
    testMatch: ['**/ioAutomation.js'],
});
