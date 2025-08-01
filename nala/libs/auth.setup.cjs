/* eslint-disable import/no-import-module-exports */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../nala/.auth/user.json');

setup('authenticate, @mas-studio', async ({ page, baseURL, browserName }) => {
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }

    expect(process.env.IMS_EMAIL, 'ERROR: No environment variable for email provided for IMS Test.').toBeTruthy();
    expect(process.env.IMS_PASS, 'ERROR: No environment variable for password provided for IMS Test.').toBeTruthy();

    await page.goto(`${baseURL}/studio.html`);
    await page.waitForURL('**/auth.services.adobe.com/en_US/index.html**/');

    // await expect(page).toHaveTitle(/Adobe ID/);
    let heading = await page.locator('.spectrum-Heading1,.Heading-1').first().innerText();
    expect(heading).toBe('Sign in');

    // Fill out Sign-in Form
    await expect(async () => {
        await page.locator('#EmailPage-EmailField').fill(process.env.IMS_EMAIL);
        await page.locator('[data-id=EmailPage-ContinueButton]').click();
        await expect(page.locator('text=Reset your password')).toBeVisible({ timeout: 45000 }); // Timeout accounting for how long IMS Login page takes to switch form
    }).toPass({
        intervals: [1_000],
        timeout: 10_000,
    });

    heading = await page.locator('.spectrum-Heading1,.Heading-1', { hasText: 'Enter your password' }).first().innerText();
    expect(heading).toBe('Enter your password');
    await page.locator('#PasswordPage-PasswordField').fill(process.env.IMS_PASS);
    await page.locator('[data-id=PasswordPage-ContinueButton]').click();
    await page.waitForURL(`${baseURL}/studio.html#path=acom`);
    await expect(page).toHaveURL(`${baseURL}/studio.html#path=acom`);

    await expect(async () => {
        const response = await page.request.get(`${baseURL}/studio.html`);
        expect(response.status()).toBe(200);
    }).toPass();
    await page.waitForLoadState('domcontentloaded');

    // End of authentication steps.

    await page.context().storageState({ path: authFile });
});
