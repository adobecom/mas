import { devices } from '@playwright/test';

const USER_AGENT_DESKTOP =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.6900.0 Safari/537.36 NALA-MAS';

/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */

const config = {
    testDir: './nala',
    outputDir: './test-results',
    globalSetup: './nala/utils/global.setup.js',
    /* On GitHub Actions, teardown runs as separate workflow step; otherwise runs automatically */
    globalTeardown: process.env.GITHUB_ACTIONS === 'true' ? undefined : './nala/utils/global.teardown.js',
    /* Maximum time one test can run for. */
    timeout: 45 * 1000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
        timeout: 30000,
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
        : [['html', { outputFolder: 'test-html-results' }], ['list'], ['./nala/utils/base-reporter.js']],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
        actionTimeout: 60000,

        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        baseURL: process.env.PR_BRANCH_LIVE_URL || process.env.LOCAL_TEST_LIVE_URL || 'https://main--mas--adobecom.aem.live',
    },

    /* Configure projects for major browsers */
    projects: [
        // Setup project
        {
            name: 'setup',
            use: {
                ...devices['Desktop Chrome'],
                userAgent: USER_AGENT_DESKTOP,
            },
            testMatch: /.*\.setup\.cjs/,
        },

        {
            name: 'mas-live-chromium',
            use: {
                ...devices['Desktop Chrome'],
                userAgent: USER_AGENT_DESKTOP,
            },
            bypassCSP: true,
            launchOptions: {
                args: ['--disable-web-security', '--disable-gpu'],
            },
        },

        // This project runs with authentication and is used for Studio tests.
        // It has a dependency on the 'setup' project which performs the login.
        {
            name: 'mas-live-chromium-studio',
            use: {
                ...devices['Desktop Chrome'],
                userAgent: USER_AGENT_DESKTOP,
                ...(process.env.SKIP_AUTH !== 'true' && {
                    storageState: './nala/.auth/user.json',
                }),
            },
            bypassCSP: true,
            launchOptions: {
                args: ['--disable-web-security', '--disable-gpu'],
            },
            ...(process.env.SKIP_AUTH !== 'true' && {
                dependencies: ['setup'],
            }),
        },
    ],
};

export default config;
