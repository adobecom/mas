import { devices } from '@playwright/test';

// const envs = require('./envs/envs.js');

/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */

const config = {
    testDir: './nala',
    outputDir: './test-results',
    globalSetup: './nala/utils/global.setup.js',
    /* Maximum time one test can run for. */
    timeout: 45 * 1000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
        timeout: 20000,
    },
    testMatch: '**/*.test.js',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 1 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 4 : 3,
    /* Reporter to use. */
    reporter: process.env.CI
        ? [['github'], ['list'], ['./nala/utils/base-reporter.js']]
        : [
              ['html', { outputFolder: 'test-html-results' }],
              ['list'],
              ['./nala/utils/base-reporter.js'],
          ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
        actionTimeout: 60000,

        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        baseURL:
            process.env.PR_BRANCH_LIVE_URL ||
            process.env.LOCAL_TEST_LIVE_URL ||
            'https://main--mas--adobecom.aem.live',
    },

    /* Configure projects for major browsers */
    projects: [
        // Setup project
        { name: 'setup', testMatch: /.*\.setup\.cjs/ },

        {
            name: 'mas-live-chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Use prepared auth state.
                storageState: './test-results/user.json',
            },
            bypassCSP: true,
            launchOptions: {
                args: ['--disable-web-security', '--disable-gpu'],
            },
            dependencies: ['setup'],
        },
    ],
};

export default config;
