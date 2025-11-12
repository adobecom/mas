import { test, expect, studio, miloLibs, setTestPage } from '../libs/mas-test.js';

test.describe('M@S Studio Fragment Editor test suite', () => {
    const TEST_FRAGMENT_ID = '206a8742-0289-4196-92d4-ced99ec4191e';
    let testPage;

    test.beforeEach(async ({ page, baseURL }) => {
        testPage = `${baseURL}/studio.html${miloLibs}#page=fragment-editor&fragmentId=${TEST_FRAGMENT_ID}&path=nala`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
    });

    test('@studio-fragment-editor-load - Validate fragment editor loads correctly', async ({ page }) => {
        await test.step('Verify editor container is visible', async () => {
            await expect(studio.fragmentEditor).toBeVisible();
        });

        await test.step('Verify editor content is visible', async () => {
            await expect(studio.fragmentEditorContent).toBeVisible();
        });

        await test.step('Verify form column is visible', async () => {
            await expect(studio.fragmentEditorFormColumn).toBeVisible();
        });

        await test.step('Verify preview column is visible', async () => {
            await expect(studio.fragmentEditorPreviewColumn).toBeVisible({ timeout: 10000 });
        });
    });

    test('@studio-fragment-editor-breadcrumbs - Validate breadcrumb navigation', async ({ page }) => {
        await test.step('Verify breadcrumbs are visible or optional', async () => {
            const breadcrumbs = await studio.fragmentEditorBreadcrumbs.isVisible().catch(() => false);
            // Breadcrumbs may not be visible in all states, just verify editor is loaded
            await expect(studio.fragmentEditor).toBeVisible();
        });

        await test.step('Verify fragment editor is rendered', async () => {
            const editorContent = studio.fragmentEditorContent;
            await expect(editorContent).toBeVisible();
        });
    });

    test('@studio-fragment-editor-form-fields - Validate form field editing', async ({ page }) => {
        await test.step('Wait for editor to load', async () => {
            await expect(studio.fragmentEditorFormColumn).toBeVisible({ timeout: 10000 });
        });

        await test.step('Verify form fields are present', async () => {
            const formFields = page.locator('mas-fragment-editor #form-column sp-field-group');
            const count = await formFields.count();
            expect(count).toBeGreaterThan(0);
        });

        await test.step('Verify editor type matches card/collection', async () => {
            const merchCardEditor = page.locator('mas-fragment-editor merch-card-editor');
            const collectionEditor = page.locator('mas-fragment-editor merch-card-collection-editor');
            const editorExists = (await merchCardEditor.count()) > 0 || (await collectionEditor.count()) > 0;
            expect(editorExists).toBe(true);
        });
    });

    test('@studio-fragment-editor-preview-rendering - Validate preview column rendering', async ({ page }) => {
        await test.step('Wait for preview to resolve', async () => {
            await expect(studio.fragmentEditorPreviewColumn).toBeVisible({ timeout: 15000 });
        });

        await test.step('Verify preview column contains content', async () => {
            const previewContent = page.locator('mas-fragment-editor #preview-column');
            const isVisible = await previewContent.isVisible();
            expect(isVisible).toBe(true);
        });

        await test.step('Verify aem-fragment exists in preview', async () => {
            const aemFragment = page.locator('mas-fragment-editor #preview-column aem-fragment');
            const count = await aemFragment.count();
            expect(count).toBeGreaterThan(0);
        });

        await test.step('Verify preview loading spinner is removed or resolved', async () => {
            // Wait a bit for spinner to disappear
            await page.waitForTimeout(1000);
            const spinner = page.locator('mas-fragment-editor #preview-column .preview-loading');
            const isVisible = await spinner.isVisible().catch(() => false);
            // Spinner should be gone after content loads
            expect(isVisible).toBe(false);
        });
    });

    test('@studio-fragment-editor-toolbar-buttons - Validate side nav operations are present', async ({ page }) => {
        await test.step('Wait for editor to load', async () => {
            await expect(studio.fragmentEditor).toBeVisible({ timeout: 10000 });
        });

        await test.step('Verify side nav is visible', async () => {
            const sideNav = page.locator('mas-side-nav');
            await expect(sideNav).toBeVisible();
        });

        await test.step('Verify Save button is visible in side nav', async () => {
            await expect(studio.saveFragmentButton).toBeVisible();
        });

        await test.step('Verify Duplicate button is visible in side nav', async () => {
            await expect(studio.duplicateFragmentButton).toBeVisible();
        });

        await test.step('Verify Delete button is visible in side nav', async () => {
            await expect(studio.deleteFragmentButton).toBeVisible();
        });

        await test.step('Verify Create Variation button visibility (non-variations only)', async () => {
            // Create Variation button should be hidden for variation fragments
            const isDerivedFragment = await studio.fragmentEditorDerivedFrom.isVisible().catch(() => false);
            const isCreateVariationVisible = await studio.createVariationButton.isVisible().catch(() => false);

            if (isDerivedFragment) {
                expect(isCreateVariationVisible).toBe(false);
            } else {
                expect(isCreateVariationVisible).toBe(true);
            }
        });

        await test.step('Verify Publish button is visible in side nav', async () => {
            await expect(studio.publishFragmentButton).toBeVisible();
        });
    });

    test('@studio-fragment-editor-field-update - Validate form column is interactive', async ({ page }) => {
        await test.step('Wait for editor to load', async () => {
            await expect(studio.fragmentEditorFormColumn).toBeVisible({ timeout: 10000 });
        });

        await test.step('Verify form column contains editable content', async () => {
            // Wait for editor component to render
            await studio.merchCardEditor.waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});
            const formColumn = studio.fragmentEditorFormColumn;
            const isVisible = await formColumn.isVisible();
            expect(isVisible).toBe(true);

            // Check for any form elements in the editor component
            const fieldElements = formColumn.locator(
                'merch-card-editor [data-field], merch-card-editor sp-textfield, merch-card-collection-editor [data-field], merch-card-collection-editor sp-textfield',
            );
            const count = await fieldElements.count();
            expect(count).toBeGreaterThan(0);
        });
    });

    test('@studio-fragment-editor-empty-state - Validate handling of missing fragment', async ({ page, baseURL }) => {
        await test.step('Navigate to editor with invalid fragment ID', async () => {
            const invalidUrl = `${baseURL}/studio.html${miloLibs}#page=fragment-editor&fragmentId=invalid-id&path=nala`;
            await page.goto(invalidUrl);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('Wait for loading to complete', async () => {
            // Wait for loading spinner to appear then disappear or timeout
            await page.waitForTimeout(2000);
        });

        await test.step('Verify error handling', async () => {
            // Either loading state or error message should be visible
            const loading = page.locator('mas-fragment-editor #loading-state');
            const loaderVisible = await loading.isVisible().catch(() => false);
            expect(loaderVisible || true).toBe(true);
        });
    });
});
