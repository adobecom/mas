import { test, expect, studio, editor, versionPage, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import VersionPageSpec from '../specs/versions.spec.js';

const { features } = VersionPageSpec;

test.describe('M@S Studio - Version Page test suite', () => {
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
            await expect(versionPage.currentDot).toBeVisible();
            await expect(versionPage.versionStatus).toContainText('Current');
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
            await page.waitForTimeout(2000);
            const columnCount = await versionPage.previewColumns.count();
            expect(columnCount).toBeGreaterThanOrEqual(1);
        });

        await test.step('step-3: Select a different version', async () => {
            const versionCount = await versionPage.getVersionCount();
            if (versionCount > 1) {
                await versionPage.selectVersionByIndex(1);
                await versionPage.waitForPreviewUpdate();
                const columnCount = await versionPage.previewColumns.count();
                expect(columnCount).toBe(2);
            }
        });

        await test.step('step-4: Validate changed fields section', async () => {
            const hasChanges = await versionPage.hasChangedFields();
            if (hasChanges) {
                await expect(versionPage.changedFieldsLabel).toBeVisible();
                await expect(versionPage.changedFieldsLabel).toContainText('Changed Fields');
                await expect(versionPage.changedFieldsList).toBeVisible();
                const fieldCount = await versionPage.getChangedFieldsCount();
                expect(fieldCount).toBeGreaterThan(0);
                const fields = await versionPage.getAllChangedFields();
                expect(fields.length).toBeGreaterThan(0);
                fields.forEach((field) => {
                    expect(field.length).toBeGreaterThan(0);
                });

                // Validate each changed field matches a known FIELD_CONFIG label
                const knownLabels = await page.evaluate(() => {
                    const VersionPageClass = customElements.get('version-page');
                    if (!VersionPageClass?.FIELD_CONFIG) return [];
                    return Object.values(VersionPageClass.FIELD_CONFIG)
                        .filter((f) => !f.hidden)
                        .map((f) => f.label);
                });
                for (const fieldText of fields) {
                    const isKnownLabel = knownLabels.some((label) => fieldText.includes(label) || fieldText.startsWith(label));
                    expect(isKnownLabel, `Changed field "${fieldText}" should match a known label`).toBe(true);
                }
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
            expect(searchResultCount).toBeGreaterThanOrEqual(0);
        });

        await test.step('step-5: Clear search', async () => {
            await versionPage.clearSearch();
            await page.waitForTimeout(1000);
            const finalCount = await versionPage.getVersionCount();
            expect(finalCount).toBeGreaterThan(0);
        });
    });

    // @version-page-nala-breadcrumb-to-editor - Breadcrumb to editor has fragmentId in URL
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

        await test.step('step-2: Click Editor breadcrumb', async () => {
            await expect(versionPage.layoutBreadcrumbItems.nth(1)).toContainText('Editor');
            await versionPage.clickBreadcrumbEditor();
        });

        await test.step('step-3: Validate URL is fragment editor with correct fragmentId', async () => {
            await page.waitForTimeout(2000);
            const hash = await page.evaluate(() => window.location.hash);
            expect(hash).toContain(`page=${data.expectedPage}`);
            expect(hash).toContain(`path=${data.expectedPath}`);
            if (data.expectFragmentIdInUrl) {
                expect(hash).toContain(`fragmentId=${data.fragmentId}`);
            }
        });

        await test.step('step-4: Validate fragment editor is visible', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 10000 });
        });
    });

    // @version-page-nala-breadcrumb-to-fragments-table - Breadcrumb to fragments table, no fragmentId, correct path
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

        await test.step('step-2: Click Fragments table breadcrumb', async () => {
            await expect(versionPage.layoutBreadcrumbItems.first()).toContainText('Fragments');
            await versionPage.clickBreadcrumbFragmentsTable();
        });

        await test.step('step-3: Validate URL is content page with path=nala and no fragmentId', async () => {
            await page.waitForTimeout(2000);
            const hash = await page.evaluate(() => window.location.hash);
            expect(hash).toContain(`page=${data.expectedPage}`);
            expect(hash).toContain(`path=${data.expectedPath}`);
            if (data.expectFragmentIdInUrl === false) {
                expect(hash).not.toContain('fragmentId=');
            }
        });

        await test.step('step-4: Validate fragments table/view is visible', async () => {
            await expect(studio.renderView.or(studio.tableView)).toBeVisible({ timeout: 10000 });
        });
    });

    // @version-page-nala-clone-restore - Clone, change fields, save/publish, new version, restore and validate toast
    // include again when reliable version of the test is implemented
    test.skip(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        test.setTimeout(210000);
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to fragments table', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(studio.renderView.or(studio.tableView)).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: Clone the fragment', async () => {
            await studio.cloneCard(data.fragmentId);
        });

        await test.step('step-3: Change a field and save', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 10000 });
            const subtitleInput = editor.subtitle;
            await subtitleInput.fill(data.subtitle);
            await page.waitForTimeout(500);
            await studio.saveCard();
        });

        await test.step('step-4: Publish the fragment', async () => {
            await studio.publishCard();
        });

        await test.step('step-5: Change a field, save, and publish', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 10000 });
            const subtitleInput = editor.subtitle;
            await subtitleInput.fill(data.subtitleV2);
            await page.waitForTimeout(500);
            await studio.saveCard();
            await studio.publishCard();
            await page.waitForTimeout(15000);
        });

        await test.step('step-6: Open version history and validate new version exists', async () => {
            await page.waitForTimeout(15000);
            const currentFragmentId = await page.evaluate(() => {
                const hash = window.location.hash || '';
                const m = hash.match(/fragmentId=([^&]+)/);
                if (m) return m[1];
                return window.Store?.fragmentEditor?.fragmentId?.get?.() || null;
            });
            expect(currentFragmentId, 'Current fragment id (cloned) should be in URL or Store').toBeTruthy();

            const maxRetries = 8;
            let versionCount = 0;
            const versionPageUrl = `${baseURL}${features[5].path}${miloLibs}#page=version&path=nala&fragmentId=${currentFragmentId}`;

            for (let attempt = 0; attempt < maxRetries; attempt += 1) {
                if (attempt === 0) {
                    await studio.versionHistoryButton.click();
                } else {
                    await page.goto(versionPageUrl);
                }
                await page.waitForTimeout(3000);
                await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
                await page.waitForSelector('version-page .version-item', { timeout: 15000 });
                versionCount = await versionPage.getVersionCount();
                if (versionCount >= 2) break;
                if (attempt < maxRetries - 1) {
                    await page.waitForTimeout(10000);
                    await versionPage.clickBreadcrumbEditor();
                    await page.waitForTimeout(3000);
                }
            }
            expect(versionCount).toBeGreaterThanOrEqual(2);
        });

        await test.step('step-7: Restore previous version', async () => {
            await versionPage.selectVersionByIndex(1);
            await page.waitForTimeout(1000);
            await versionPage.openVersionMenu(1);
            await versionPage.clickRestoreThisVersion();
            await page.waitForTimeout(500);
            await expect(versionPage.confirmRestoreButton).toBeVisible({ timeout: 5000 });
            await versionPage.confirmRestoreButton.click();
            await page.waitForTimeout(5000);
        });

        await test.step('step-8: Validate success toast with version number', async () => {
            await expect(studio.toastPositive).toBeVisible({ timeout: 15000 });
            const toastContent = await studio.toastPositive.textContent();
            expect(toastContent).toMatch(/Version\s+.+\s+restored successfully/);
        });
    });

    // @version-page-nala-search-by-author - Search by version author name
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Search by author name', async () => {
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            await versionPage.searchVersions(data.authorName);
            await page.waitForTimeout(1500);
        });

        await test.step('step-3: Validate filtered results contain that author', async () => {
            const count = await versionPage.getVersionCount();
            expect(count).toBeGreaterThan(0);
            for (let i = 0; i < count; i++) {
                const item = versionPage.getVersionByIndex(i);
                const text = await item.textContent();
                expect(text?.toLowerCase()).toContain(data.authorName.toLowerCase());
            }
        });
    });
});
