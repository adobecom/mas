import { test as base } from '@playwright/test';
import GlobalRequestCounter from './global-request-counter.js';

/**
 * Extended Playwright test that automatically handles common MAS test operations
 * - Automatically initializes request counter in beforeEach
 * - Automatically saves request data in afterEach
 * - No need to manually add hooks to every test file
 */
const masTest = base.extend({
    // Add custom fixtures here if needed
});

// Automatically add counter initialization to every test
masTest.beforeEach(async ({ page }) => {
    await GlobalRequestCounter.init(page);
});

// Automatically save counter data after every test
masTest.afterEach(async () => {
    GlobalRequestCounter.saveCountToFileSync();
});

// Export both the extended test and original expect
export { masTest as test };
export { expect } from '@playwright/test';
