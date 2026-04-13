import { test, expect, translations, translationEditor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import TranslationsSpec from '../specs/translations.spec.js';

const { features } = TranslationsSpec;

test.describe('M@S Studio Translations Test Suite', () => {
    // 0. @studio-translations-list-load - Validate translations page loads and list is sorted (newest first)
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Translations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Wait for list to load', async () => {
            await translations.waitForListToLoad();
        });

        await test.step('step-3: Validate table is visible with at least 3 projects and sorted newest first', async () => {
            await expect(translations.translationTable).toBeVisible();
            const rowCount = await translations.tableRows.count();
            expect(rowCount).toBeGreaterThanOrEqual(3);
            const allTitles = await translations.getAllProjectTitles();
            expect(allTitles.find((t) => t.includes('loc 1'))).toBeDefined();
            expect(allTitles.find((t) => t.includes('loc 2'))).toBeDefined();
            expect(allTitles.find((t) => t.includes('loc 3'))).toBeDefined();
            const sentOnTexts = await translations.getSentOnColumnTexts();
            const timestamps = sentOnTexts.map(translations.parseSentOnText);
            for (let i = 1; i < timestamps.length; i++) {
                const prev = timestamps[i - 1];
                const curr = timestamps[i];
                if (prev > 0 && curr > 0) {
                    expect(curr).toBeLessThanOrEqual(prev);
                }
            }
        });

        await test.step('step-4: Validate table headers', async () => {
            await expect(translations.tableHeaders.translationProject).toBeVisible();
            await expect(translations.tableHeaders.translationProject).toHaveText('Translation Project');
            await expect(translations.tableHeaders.lastUpdatedBy).toBeVisible();
            await expect(translations.tableHeaders.lastUpdatedBy).toHaveText('Last updated by');
            await expect(translations.tableHeaders.sentOn).toBeVisible();
            await expect(translations.tableHeaders.sentOn).toHaveText('Sent on');
            await expect(translations.tableHeaders.actions).toBeVisible();
            await expect(translations.tableHeaders.actions).toHaveText('Actions');
        });
    });

    // 1. @translation-editor-cards-table – Select Items Table: Cards Tab and Collapsible Rows
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
        await expect(translationEditor.breadcrumb).toBeVisible();
        await expect(translationEditor.titleField).toBeVisible();

        // @translation-editor-cards-expand-collapse
        await test.step('step-1: Open Add Items dialog and navigate to Cards tab', async () => {
            await translationEditor.addItemsButton.click();
            await expect(translationEditor.selectItemsDialog).toBeVisible({ timeout: 10000 });
            await expect(translationEditor.cardsTab).toBeVisible({ timeout: 5000 });
            await translationEditor.cardsTab.click();
            await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 30000 });
        });

        await test.step('step-2: Expand a card with variations, verify nested rows appear', async () => {
            await translationEditor.expandRowButton(0).click();
            await page.waitForTimeout(1000);
            await expect(page.getByRole('tab', { name: 'Grouped variation' }).first()).toBeVisible({ timeout: 5000 });
        });

        await test.step('step-3: Collapse the card, verify nested rows disappear', async () => {
            await translationEditor.expandRowButton(0).click();
            await page.waitForTimeout(500);
            await expect(page.getByRole('tab', { name: 'Grouped variation' }).first()).not.toBeVisible({ timeout: 10000 });
        });

        // @translation-editor-cards-checkbox-select
        await test.step('step-4: Close dialog and verify save and translate buttons are disabled before selecting', async () => {
            await translationEditor.selectItemsDialog.getByRole('button', { name: 'Cancel' }).click();
            await expect(translationEditor.selectItemsDialog).not.toBeVisible({ timeout: 10000 });
            await expect(translationEditor.saveButton).toBeDisabled();
            await expect(translationEditor.sendToLocButton).toBeDisabled({ timeout: 5000 });
        });

        await test.step('step-5: Re-open Add Items, select one fragment (card) via checkbox', async () => {
            await translationEditor.addItemsButton.click();
            await expect(translationEditor.selectItemsDialog).toBeVisible({ timeout: 10000 });
            await expect(translationEditor.cardsTab).toBeVisible({ timeout: 5000 });
            await translationEditor.cardsTab.click();
            await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 15000 });
            // When MWPW-190616 is fixed, change back to clicking the row instead of the checkbox
            // const tableEl = tables.find((el) => el.shadowRoot?.querySelector('sp-table.fragments-table sp-table-row'));
            // const row = tableEl?.shadowRoot?.querySelector('sp-table.fragments-table sp-table-row');
            // if (row) row.click();
            await translationEditor.tableRowCheckbox(0).click();
            await expect(translationEditor.selectedItemsButton).toContainText('(1)');
        });

        await test.step('step-6: Select one collection', async () => {
            await translationEditor.collectionsTab.click();
            await expect(translationEditor.tableRowsCollections.first()).toBeVisible({ timeout: 10000 });
            await translationEditor.tableRowCheckboxCollections(0).click();
            await expect(translationEditor.selectedItemsButton).toContainText('(2)');
        });

        await test.step('step-7: Select one placeholder', async () => {
            await translationEditor.placeholdersTab.click();
            await expect(translationEditor.tableRowsPlaceholders.first()).toBeVisible({ timeout: 10000 });
            await translationEditor.tableRowCheckboxPlaceholders(0).click();
            await expect(translationEditor.selectedItemsButton).toContainText('(3)');
        });

        await test.step('step-8: Add selected items and close dialog', async () => {
            await translationEditor.addSelectedItemsButton.click();
            await expect(translationEditor.selectItemsDialog).not.toBeVisible({ timeout: 15000 });
            await page.waitForTimeout(1000);
        });

        await test.step('step-9: Open sidebar and verify selection and count in sidebar and header', async () => {
            await translationEditor.selectedItemsToggleButton.click();
            await expect(translationEditor.selectedItemsExpandedPanel).toBeVisible({ timeout: 5000 });
            await expect(translationEditor.selectedItemsHeader).toContainText('(3)');
        });

        await test.step('step-10: Click Hide selection and verify sidebar closed', async () => {
            await translationEditor.selectedItemsToggleButton.click();
            await expect(translationEditor.selectedItemsExpandedPanel).not.toBeVisible();
        });
    });

    // 2. @translation-editor-search-filters – Search and Filters
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
        await expect(translationEditor.breadcrumb).toBeVisible();
        await expect(translationEditor.titleField).toBeVisible();

        await test.step('step-1: Open Add Items dialog and navigate to Cards tab', async () => {
            await translationEditor.addItemsButton.click();
            await expect(translationEditor.cardsTab).toBeVisible({ timeout: 10000 });
            await translationEditor.cardsTab.click();
            await expect(translationEditor.selectItemsTable).toBeVisible({ timeout: 10000 });
            await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 30000 });
            await translationEditor.expectResultCountMatchesTableRows();
        });

        // @translation-editor-search
        await test.step('step-2: Enter search term, verify results update', async () => {
            await translationEditor.searchInput.fill(data.searchTerm);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);
            await translationEditor.expectCardRowsMatchSearchTerm(data.searchTerm);
            await translationEditor.expectResultCountMatchesTableRows();
            await translationEditor.searchInput.fill('');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);
            await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 30000 });
            await translationEditor.expectResultCountMatchesTableRows();
        });

        // @translation-editor-filters
        await test.step('step-3: Apply Template filter', async () => {
            const filterBtn = translationEditor.filterButtons.nth(0);
            await expect(filterBtn).toBeVisible({ timeout: 10000 });
            await filterBtn.click();
            await expect(translationEditor.filterPopover).toBeVisible({ timeout: 8000 });
            const checkbox = translationEditor.filterPopover.getByText(data.filters.template, { exact: true });
            await checkbox.click();
            await filterBtn.click();
            await page.waitForTimeout(500);
            await expect(translationEditor.appliedFilterTags.filter({ hasText: data.filters.template })).toHaveCount(1);
            await translationEditor.expectResultCountMatchesTableRows();
            await translationEditor.expectCardRowsColumnContains(translationEditor.COLUMNS.PATH, data.filters.template);
        });

        await test.step('step-4: Apply Market Segment filter', async () => {
            const filterBtn = translationEditor.filterButtons.nth(1);
            await expect(filterBtn).toBeVisible({ timeout: 10000 });
            await filterBtn.click();
            await expect(translationEditor.filterPopover).toBeVisible({ timeout: 8000 });
            const checkbox = translationEditor.filterPopover.getByText(data.filters.marketSegment, { exact: true });
            await checkbox.click();
            await filterBtn.click();
            await page.waitForTimeout(500);
            await expect(translationEditor.appliedFilterTags.filter({ hasText: data.filters.marketSegment })).toHaveCount(1);
            await translationEditor.expectResultCountMatchesTableRows();
            await translationEditor.expectCardRowsColumnContains(translationEditor.COLUMNS.PATH, data.filters.marketSegment);
        });

        await test.step('step-5: Apply Customer Segment filter', async () => {
            const filterBtn = translationEditor.filterButtons.nth(2);
            await expect(filterBtn).toBeVisible({ timeout: 10000 });
            await filterBtn.click();
            await expect(translationEditor.filterPopover).toBeVisible({ timeout: 8000 });
            const checkbox = translationEditor.filterPopover.getByText(data.filters.customerSegment, {
                exact: true,
            });
            await checkbox.click();
            await filterBtn.click();
            await page.waitForTimeout(500);
            await expect(translationEditor.appliedFilterTags.filter({ hasText: data.filters.customerSegment })).toHaveCount(1);
            await translationEditor.expectResultCountMatchesTableRows();
            await translationEditor.expectCardRowsColumnContains(translationEditor.COLUMNS.PATH, data.filters.customerSegment);
        });

        await test.step('step-6: Apply Product filter', async () => {
            const filterBtn = translationEditor.filterButtons.nth(3);
            await expect(filterBtn).toBeVisible({ timeout: 10000 });
            await filterBtn.click();
            await expect(translationEditor.filterPopover).toBeVisible({ timeout: 8000 });
            const checkbox = translationEditor.filterPopover.getByText(data.filters.product, { exact: true });
            await checkbox.click();
            await filterBtn.click();
            await page.waitForTimeout(500);
            await expect(translationEditor.appliedFilterTags.filter({ hasText: data.filters.product })).toHaveCount(1);
            await translationEditor.expectResultCountMatchesTableRows();
            await translationEditor.expectCardRowsColumnContains(translationEditor.COLUMNS.OFFER, data.filters.product);
        });
    });

    // 3. @translation-editor-copy-offer-id – For a row with offer data, click copy button
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
        await translationEditor.addItemsButton.click();
        await expect(translationEditor.cardsTab).toBeVisible({ timeout: 10000 });
        await translationEditor.cardsTab.click();
        await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 30000 });
        await expect(translationEditor.copyOfferIdButton.first()).toBeVisible({ timeout: 5000 });
        await translationEditor.copyOfferIdButton.first().click();
        const toast = page.locator('sp-toast').first();
        await expect(toast).toBeVisible({ timeout: 15000 });
    });

    // 4. @translation-editor-view-only – Open existing read-only translation project
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
        await expect(translationEditor.breadcrumb).toBeVisible();
        await expect(translationEditor.titleField).toBeVisible();
        await expect(translationEditor.selectedItemsHeader).toBeVisible({ timeout: 10000 });
        await translationEditor.selectedItemsToggleButton.click();
        await expect(translationEditor.viewOnlyCardsTab).toBeVisible({ timeout: 10000 });
        await expect(translationEditor.tableRowCheckbox(0)).not.toBeVisible();
        await expect(translationEditor.saveButton).toBeDisabled();
        await expect(translationEditor.editLanguagesButton).not.toBeVisible();
        await expect(translationEditor.editItemsButton).not.toBeVisible();
        await expect(translationEditor.sendToLocButton).toBeDisabled();
    });

    // 5. @translation-editor-loading-variations – Expand grouped variation
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
        await translationEditor.addItemsButton.click();
        await expect(translationEditor.cardsTab).toBeVisible({ timeout: 10000 });
        await translationEditor.cardsTab.click();
        await expect(translationEditor.selectItemsTable).toBeVisible({ timeout: 15000 });
        await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 30000 });
        await translationEditor.expandRowButton(0).click();
        await page.waitForTimeout(1500);
        await expect(page.getByRole('tab', { name: 'Grouped variation' }).first()).toBeVisible({ timeout: 5000 });
    });

    // 6. @translation-editor-actions
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}`;
        setTestPage(testPage);
        let projectTitle;

        await test.step('step-1: Create and save project', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            projectTitle = await translationEditor.createTranslationProject();
            await translationEditor.saveTranslationProject();
        });

        await test.step('step-2: Delete created project and verify it is removed', async () => {
            await translationEditor.deleteButton.click();
            await page.waitForTimeout(500);
            await expect(translations.deleteConfirmDialog).toBeVisible({ timeout: 10000 });
            await translations.deleteConfirmButton.click();
            await translations.waitForListToLoad();
            const allTitles = await translations.getAllProjectTitles();
            expect(allTitles.some((t) => t.includes(projectTitle))).toBe(false);
        });
    });
});
