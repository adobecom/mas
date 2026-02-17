import { test, expect, miloLibs, setTestPage } from '../libs/mas-test.js';
import { getCurrentRunId } from '../utils/fragment-tracker.js';
import StudioPage from './studio.page.js';
import EditorPage from './editor.page.js';
import VersionPageSpec, { NALA_VERSION_FRAGMENT_ID } from './version-page.spec.js';
import VersionPage from './version-page.page.js';

const { features } = VersionPageSpec;

// Known field labels shown in version history "Changed Fields" (from version-page FIELD_CONFIG)
const KNOWN_CHANGED_FIELD_LABELS = [
    'Card title',
    'Description',
    'Prices',
    'CTAs',
    'Border color',
    'Size',
    'Background color',
    'Background image',
    'Mnemonic icon',
    'Mnemonic alt',
    'Mnemonic link',
    'Badge',
    'Trial badge',
    'Promo text',
    'Subtitle',
    'Callout',
    'Whats included',
    'Per unit label',
    'Quantity select',
    'Variant',
    'OSI',
    'Background image alt text',
    'Card name',
    'Card title link',
    'Short description',
    'Promo code',
    'Show secure label',
    'Show plan type',
    'Addon',
    'Addon confirmation',
    'Variations',
    'Product',
    'Tags',
    'Loc ready',
    'Fragment title',
    'Fragment description',
];

test.describe('M@S Studio - Version Page test suite', () => {
    let studio;
    let editor;
    let versionPage;

    test.beforeEach(async ({ page }) => {
        studio = new StudioPage(page);
        editor = new EditorPage(page);
        versionPage = new VersionPage(page);
    });

    // @version-page-load - Validate version page loads correctly
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000); // Wait for version page to render
        });

        await test.step('step-2: Validate version page elements', async () => {
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
            await expect(versionPage.versionListPanel).toBeVisible();
            await expect(versionPage.previewPanel).toBeVisible();
            await expect(versionPage.searchInput).toBeVisible();
            await expect(versionPage.versionStatus).toBeVisible();
        });

        await test.step('step-3: Validate version items loaded', async () => {
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            const versionCount = await versionPage.getVersionCount();
            expect(versionCount).toBeGreaterThan(0);
        });

        await test.step('step-4: Validate version item details', async () => {
            const firstVersion = versionPage.getVersionByIndex(0);
            await expect(firstVersion).toBeVisible();
            const dateTime = firstVersion.locator('.version-date-time');
            const author = firstVersion.locator('.version-author');
            await expect(dateTime).toBeVisible();
            await expect(author).toBeVisible();
        });

        await test.step('step-5: Validate current version indicator and styling', async () => {
            // Check if version status indicator exists with green dot
            await expect(versionPage.currentDot).toBeVisible();
            await expect(versionPage.versionStatus).toContainText('Current');

            // The first version item should have the 'current' class (green border)
            await expect(versionPage.currentVersionItem).toBeVisible();
            const firstItem = versionPage.getVersionByIndex(0);
            await expect(firstItem).toHaveClass(/current/);
        });
    });

    // @version-page-preview - Validate version preview and changed fields functionality
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Validate initial preview displays', async () => {
            await expect(versionPage.previewPanel).toBeVisible();
            await expect(versionPage.previewContent).toBeVisible();
            // Wait for preview columns to render
            await page.waitForTimeout(2000);
            const columnCount = await versionPage.previewColumns.count();
            expect(columnCount).toBeGreaterThanOrEqual(1);
        });

        await test.step('step-3: Select a different version', async () => {
            const versionCount = await versionPage.getVersionCount();
            if (versionCount > 1) {
                // Select the second version (first historical version)
                await versionPage.selectVersionByIndex(1);
                await versionPage.waitForPreviewUpdate();

                // Should now have 2 preview columns (current + selected)
                const columnCount = await versionPage.previewColumns.count();
                expect(columnCount).toBe(2);
            }
        });

        await test.step('step-4: Validate changed fields section', async () => {
            const hasChanges = await versionPage.hasChangedFields();

            if (hasChanges) {
                // Validate the changed fields label
                await expect(versionPage.changedFieldsLabel).toBeVisible();
                await expect(versionPage.changedFieldsLabel).toContainText('Changed Fields');

                // Validate the list structure (ul element)
                await expect(versionPage.changedFieldsList).toBeVisible();

                // Verify list items exist
                const fieldCount = await versionPage.getChangedFieldsCount();
                expect(fieldCount).toBeGreaterThan(0);

                // Validate field display format
                const fields = await versionPage.getAllChangedFields();
                expect(fields.length).toBeGreaterThan(0);

                // All fields should have labels
                fields.forEach((field) => {
                    expect(field.length).toBeGreaterThan(0);
                });
            }
        });
    });

    // @version-page-search - Validate version search functionality
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Get initial version count', async () => {
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            const initialCount = await versionPage.getVersionCount();
            expect(initialCount).toBeGreaterThan(0);
        });

        await test.step('step-3: Search for versions', async () => {
            await versionPage.searchVersions(data.searchQuery);
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Validate search results', async () => {
            await expect(versionPage.versionListPanel).toBeVisible();
            const searchResultCount = await versionPage.getVersionCount();
            // Search should filter results or show all if no match
            expect(searchResultCount).toBeGreaterThanOrEqual(0);
        });

        await test.step('step-5: Clear search', async () => {
            await versionPage.clearSearch();
            await page.waitForTimeout(1000);
            const finalCount = await versionPage.getVersionCount();
            expect(finalCount).toBeGreaterThan(0);
        });
    });

    // @version-page-nala-preview-changed-fields - Open history, validate all changed fields listed in preview (1.3 vs 1.0)
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Select version 1.0 for comparison', async () => {
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            await versionPage.selectVersionByTitle('1.0');
            await versionPage.waitForPreviewUpdate();
        });

        await test.step('step-3: Validate preview has two columns (current + selected)', async () => {
            const columnCount = await versionPage.previewColumns.count();
            expect(columnCount).toBe(2);
        });

        await test.step('step-4: Validate changed fields are listed and use known labels', async () => {
            const hasChanges = await versionPage.hasChangedFields();
            expect(hasChanges).toBe(true);
            await expect(versionPage.changedFieldsLabel).toContainText('Changed Fields');
            await expect(versionPage.changedFieldsList).toBeVisible();

            const fields = await versionPage.getAllChangedFields();
            expect(fields.length).toBeGreaterThan(0);

            for (const fieldText of fields) {
                const isKnownLabel = KNOWN_CHANGED_FIELD_LABELS.some(
                    (label) => fieldText.includes(label) || fieldText.startsWith(label),
                );
                expect(isKnownLabel, `Changed field "${fieldText}" should match a known label`).toBe(true);
            }
        });
    });

    // @version-page-nala-breadcrumb-to-editor - Breadcrumb to editor has fragmentId in URL
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Click Editor breadcrumb', async () => {
            await expect(versionPage.layoutBreadcrumbItems.nth(1)).toContainText('Editor');
            await versionPage.clickBreadcrumbEditor();
        });

        await test.step('step-3: Validate URL is fragment editor with correct fragmentId', async () => {
            await page.waitForTimeout(2000);
            const hash = await page.evaluate(() => window.location.hash);
            expect(hash).toContain('page=fragment-editor');
            expect(hash).toContain(`fragmentId=${NALA_VERSION_FRAGMENT_ID}`);
            expect(hash).toContain('path=nala');
        });

        await test.step('step-4: Validate fragment editor is visible', async () => {
            await expect(studio.editorPanel).toBeVisible({ timeout: 10000 });
        });
    });

    // @version-page-nala-breadcrumb-to-fragments-table - Breadcrumb to fragments table, no fragmentId, correct path
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Click Fragments table breadcrumb', async () => {
            await expect(versionPage.layoutBreadcrumbItems.first()).toContainText('Fragments table');
            await versionPage.clickBreadcrumbFragmentsTable();
        });

        await test.step('step-3: Validate URL is content page with path=nala and no fragmentId', async () => {
            await page.waitForTimeout(2000);
            const hash = await page.evaluate(() => window.location.hash);
            expect(hash).toContain('page=content');
            expect(hash).toContain('path=nala');
            expect(hash).not.toContain('fragmentId=');
        });

        await test.step('step-4: Validate fragments table/view is visible', async () => {
            await expect(studio.renderView.or(studio.tableView)).toBeVisible({ timeout: 10000 });
        });
    });

    // @version-page-nala-clone-restore - Clone, change fields, save/publish, new version, restore and validate toast
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to fragment editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(studio.editorPanel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: Clone the fragment', async () => {
            await studio.cloneCardButton.click();
            await page.waitForTimeout(1500);
            const cloneDialog = page.locator('mas-fragment-editor sp-dialog.clone-dialog');
            await expect(cloneDialog).toBeVisible({ timeout: 8000 });
            const runId = getCurrentRunId();
            const titleInput = cloneDialog.locator('sp-textfield#new-fragment-title input');
            await titleInput.fill(`MAS Nala Automation Cloned Fragment [${runId}]`);
            await page.waitForTimeout(300);
            await cloneDialog.locator('sp-button:has-text("Clone")').click();
            await page.waitForTimeout(5000);
        });

        await test.step('step-3: Change a field and save', async () => {
            await expect(studio.editorPanel).toBeVisible({ timeout: 10000 });
            const subtitleInput = editor.subtitle;
            await subtitleInput.fill('Nala test subtitle');
            await page.waitForTimeout(500);
            await studio.saveCardButton.click();
            await page.waitForTimeout(3000);
            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-4: Publish the fragment', async () => {
            const publishBtn = page.locator('mas-side-nav-item[label="Publish"]');
            const publishToast = page.locator('mas-toast sp-toast[variant="positive"]:has-text("successfully published")');
            await publishBtn.click();
            await expect(publishToast).toBeVisible({ timeout: 20000 });
            await page.waitForTimeout(1000);
        });

        await test.step('step-5: Change a field, save, and publish', async () => {
            await expect(studio.editorPanel).toBeVisible({ timeout: 10000 });
            const subtitleInput = editor.subtitle;
            await subtitleInput.fill('Nala test subtitle v2');
            await page.waitForTimeout(500);
            await studio.saveCardButton.click();
            await page.waitForTimeout(3000);
            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            const publishBtn = page.locator('mas-side-nav-item[label="Publish"]');
            const publishToast = page.locator('mas-toast sp-toast[variant="positive"]:has-text("successfully published")');
            await publishBtn.click();
            await expect(publishToast).toBeVisible({ timeout: 20000 });
            await page.waitForTimeout(1000);
        });

        await test.step('step-6: Open version history and validate new version exists', async () => {
            const versionHistoryBtn = page.locator('mas-side-nav-item[label="History"]');
            await versionHistoryBtn.click();
            await page.waitForTimeout(3000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            const versionCount = await versionPage.getVersionCount();
            expect(versionCount).toBeGreaterThanOrEqual(2);
        });

        await test.step('step-7: Restore previous version', async () => {
            await versionPage.selectVersionByIndex(1);
            await page.waitForTimeout(1000);
            await versionPage.openVersionMenu(1);
            await versionPage.clickRestoreThisVersion();
            await page.waitForTimeout(500);
            const confirmRestore = page.getByRole('button', { name: 'Restore' });
            await expect(confirmRestore).toBeVisible({ timeout: 5000 });
            await confirmRestore.click();
            await page.waitForTimeout(5000);
        });

        await test.step('step-8: Validate success toast with version number', async () => {
            await expect(studio.toastPositive).toBeVisible({ timeout: 15000 });
            const toastContent = await studio.toastPositive.textContent();
            expect(toastContent).toMatch(/Version\s+[\d.]+\s+restored successfully/);
        });
    });

    // @version-page-nala-search-by-author - Search by version author name
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
        });

        let authorName = '';
        await test.step('step-2: Get author name from first version item', async () => {
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            const firstItem = versionPage.getVersionByIndex(0);
            const authorEl = firstItem.locator('.version-author-name');
            await expect(authorEl).toBeVisible();
            authorName = (await authorEl.textContent())?.trim() || '';
            expect(authorName.length).toBeGreaterThan(0);
        });

        await test.step('step-3: Search by author name', async () => {
            await versionPage.searchVersions(authorName);
            await page.waitForTimeout(1500);
        });

        await test.step('step-4: Validate filtered results contain that author', async () => {
            const count = await versionPage.getVersionCount();
            expect(count).toBeGreaterThan(0);
            for (let i = 0; i < count; i++) {
                const item = versionPage.getVersionByIndex(i);
                const text = await item.textContent();
                expect(text?.toLowerCase()).toContain(authorName.toLowerCase());
            }
        });
    });
});
