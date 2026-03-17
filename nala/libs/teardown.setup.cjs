/* eslint-disable import/no-import-module-exports */
/**
 * Teardown project: runs after all projects that depend on setup (studio).
 * Same rule as auth – when only docs runs, setup does not run, so this teardown does not run.
 * On GitHub Actions we skip here; cleanup runs only in the separate "Cleanup cloned cards" workflow step.
 */
import { test as teardown } from '@playwright/test';

teardown('nala teardown: cleanup cloned cards', async () => {
    if (process.env.GITHUB_ACTIONS === 'true') return;
    const globalTeardown = (await import('../utils/global.teardown.js')).default;
    await globalTeardown();
});
