/* eslint-disable import/no-import-module-exports */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { installEdsThrottleOnPage } from './eds-throttle.js';
import { recordRunStaticHar } from './run-static-har.js';
import { waitForEditorReady } from './editor-bootstrap.js';
import individualsSpec from '../studio/acom/plans/individuals/specs/individuals_edit_and_discard.spec.js';

const authFile = path.join(__dirname, '../../nala/.auth/user.json');

setup('authenticate, @mas-studio', async ({ page, browser, baseURL, browserName }, testInfo) => {
    testInfo.setTimeout(180000);
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }

    expect(process.env.IMS_EMAIL, 'ERROR: No environment variable for email provided for IMS Test.').toBeTruthy();
    expect(process.env.IMS_PASS, 'ERROR: No environment variable for password provided for IMS Test.').toBeTruthy();

    await installEdsThrottleOnPage(page);
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

    await expect(page.locator('#PasswordPage-PasswordField')).toBeVisible({ timeout: 45000 });
    await page.locator('#PasswordPage-PasswordField').fill(process.env.IMS_PASS);
    await page.locator('[data-id=PasswordPage-ContinueButton]').click();

    const skipPasskey = page.locator('button:has-text("Skip"), [data-id="PasskeyNudgePage-SkipButton"]');
    try {
        await skipPasskey.click({ timeout: 5000 });
    } catch {
        // Passkey dialog may not appear — continue
    }

    const escapedBaseURL = baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Case-insensitive: branch baseURLs carry the uppercase ticket id
    // (e.g. MWPW-195919--mas--adobecom.aem.live), but the browser normalizes
    // the host to lowercase, so an anchored case-sensitive pattern never matches.
    const welcomeUrlPattern = new RegExp(`^${escapedBaseURL}/studio\\.html#page=welcome`, 'i');
    // toHaveURL polls the URL string; safer than waitForURL because the
    // hash-only updates that IMS produces don't fire a 'load' event, which
    // waitForURL waits for by default.
    await expect(page).toHaveURL(welcomeUrlPattern, { timeout: 45000 });

    await expect(async () => {
        const response = await page.request.get(`${baseURL}/studio.html`);
        expect(response.status()).toBe(200);
    }).toPass();
    await page.waitForLoadState('domcontentloaded');

    // End of authentication steps.

    await page.context().storageState({ path: authFile });
    const fragmentId = individualsSpec.features[0].data.cardid;
    const url = new URL('/studio.html', baseURL);
    for (const override of [process.env.MILO_LIBS, process.env.MAS_LIBS, process.env.MAS_IO_URL]) {
        for (const [name, value] of new URLSearchParams(override)) url.searchParams.set(name, value);
    }
    url.hash = `page=fragment-editor&path=nala&fragmentId=${fragmentId}`;
    const newOstUrl = new URL(url);
    newOstUrl.searchParams.set('ost', 'new');
    await recordRunStaticHar({
        browser,
        name: 'studio',
        urls: [url.href, newOstUrl.href],
        contextOptions: {
            storageState: authFile,
            userAgent: testInfo.project.use.userAgent,
            extraHTTPHeaders: { 'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"' },
        },
        ready: (page) => waitForEditorReady(page, fragmentId),
    });
});
