import { test as setup } from '@playwright/test';
import { recordRunStaticHar } from './run-static-har.js';
import { constructTestUrl, DOCS_GALLERY_PATH } from '../utils/commerce.js';

setup('record current-run Docs static assets, @mas-docs', async ({ browser, baseURL }, testInfo) => {
    await recordRunStaticHar({
        browser,
        name: 'docs',
        urls: [constructTestUrl(baseURL, DOCS_GALLERY_PATH.MERCH_CARD)],
        contextOptions: { userAgent: testInfo.project.use.userAgent },
        ready: (page) => page.waitForFunction(() => customElements.get('merch-card')),
    });
});
