import { test, expect, bulkPublish, placeholders, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import BulkPublishSpec from '../specs/bulk_publish.spec.js';

const { features } = BulkPublishSpec;

test.describe('M@S Studio Bulk Publish Test Suite', () => {
    // @studio-bulk-publish-import-placeholder-url
    // Pasting a copied placeholder link into a Bulk Publish project validates it as a placeholder. A link that names
    // the placeholder by key instead of id is marked Invalid URL. Nothing is saved.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const placeholdersPage = `${baseURL}/studio.html${miloLibs}#page=placeholders&path=nala&locale=en_US`;
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        let placeholderLink;
        setTestPage(testPage);

        await test.step('step-1: Copy a real placeholder Studio link', async () => {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
            await page.goto(placeholdersPage);
            await page.waitForLoadState('domcontentloaded');
            await placeholders.waitForTableToLoad();
            await placeholders.searchPlaceholder(data.key);
            await placeholders.getRowMenuButton(data.key).click();
            await placeholders.getRowMenuItems(data.key).filter({ hasText: 'Copy Link' }).click();
            await expect(placeholders.toastPositive).toHaveText('Copied 1 placeholder link(s)', { timeout: 10000 });
            placeholderLink = await page.evaluate(() => navigator.clipboard.readText());
            expect(new URLSearchParams(new URL(placeholderLink).hash.slice(1)).get('search')).toMatch(/^[0-9a-f-]{36}$/);
        });

        await test.step('step-2: Open a new in-memory Bulk Publish project', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(bulkPublish.editor).toBeVisible({ timeout: 15000 });
            await expect(bulkPublish.heading).toHaveText('Create bulk publish project');
            await expect(bulkPublish.urlInput).toBeVisible();
        });

        await test.step('step-3: Validate the UUID link as a placeholder', async () => {
            await bulkPublish.enterUrlAndValidate(placeholderLink);
            const item = await bulkPublish.waitForItem({ path: data.placeholderPath, status: 'valid' });
            const row = await bulkPublish.getItemRow({ path: data.placeholderPath });

            await expect(row).toBeVisible();
            await expect(row).toContainText(placeholderLink);
            await expect(bulkPublish.getStatusCell(row)).toHaveText('Validated');
            expect(item.type).toBe('placeholder');
            await expect(bulkPublish.urlInput).toHaveJSProperty('value', '');
        });

        await test.step('step-4: Reject the key-based placeholder link as invalid-url', async () => {
            const keyLink = placeholderLink.replace(/search=[0-9a-f-]{36}$/, `search=${data.key}`);
            await bulkPublish.enterUrlAndValidate(keyLink);
            const item = await bulkPublish.waitForItem({ url: keyLink, status: 'error' });
            const row = await bulkPublish.getItemRow({ url: keyLink });

            expect(item.reason).toBe('invalid-url');
            await expect(bulkPublish.getStatusCell(row)).toHaveText('Invalid URL');
            await expect(bulkPublish.urlInput).toHaveJSProperty('value', '');
        });
    });
});
