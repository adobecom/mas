/* eslint-disable import/no-import-module-exports */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { installEdsThrottleOnPage } from './eds-throttle.js';
import { signIn } from './ims-auth.js';
import { recordRunStaticHar } from './run-static-har.js';
import { waitForEditorReady } from './editor-bootstrap.js';
import individualsSpec from '../studio/acom/plans/individuals/specs/individuals_edit_and_discard.spec.js';

const authFile = path.join(__dirname, '../../nala/.auth/user.json');

setup('authenticate, @mas-studio', async ({ page, browser, baseURL, browserName }, testInfo) => {
    testInfo.setTimeout(180000);
    page.setDefaultTimeout(testInfo.timeout);
    page.setDefaultNavigationTimeout(testInfo.timeout);
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

    const heading = await page.locator('.spectrum-Heading1,.Heading-1').first().innerText();
    expect(heading).toBe('Sign in');

    const escapedBaseURL = baseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const welcomeUrlPattern = new RegExp(`^${escapedBaseURL}/studio\\.html#page=welcome`, 'i');
    await signIn(page, {
        email: process.env.IMS_EMAIL,
        password: process.env.IMS_PASS,
        welcomeUrlPattern,
        timeout: testInfo.timeout,
    });

    await expect(async () => {
        const status = await page.evaluate(async (url) => (await fetch(url)).status, `${baseURL}/studio.html`);
        expect(status).toBe(200);
    }).toPass({ timeout: testInfo.timeout });
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
