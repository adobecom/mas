import { test, expect, studio, editor, individuals, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import VariationsSpec from '../specs/variations.spec.js';

const { features } = VariationsSpec;

test.describe('M@S Studio - Variations Page test suite', () => {
    // @studio-create-variation-editor - Validate creating a variation from editor
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.renderView).toBeVisible();
        });

        await test.step('step-2: Clone the fragment', async () => {
            await studio.cloneCard(data.cardid);
            const clonedCard = await studio.getCard(data.cardid, 'cloned');
            await expect(clonedCard).toBeVisible();
            clonedFragmentId = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            expect(clonedFragmentId).toBeTruthy();
        });

        await test.step('step-3: Create variation from editor', async () => {
            variationId = await studio.createVariation(clonedFragmentId, data.locale);
            expect(variationId).toBeTruthy();
        });

        await test.step('step-4: Verify variation header is visible in editor', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.localeVariationHeader).toBeVisible({ timeout: 15000 });
            const headerText = await editor.localeVariationHeader.textContent();
            expect(headerText).toContain('Regional variation');
            expect(headerText).toContain(data.locale.split('_')[0].toUpperCase());
            expect(headerText).toContain(data.localeName);
        });

        await test.step('step-5: Wait for preview to resolve and verify price in editor', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
        });

        await test.step('step-6: Verify price in card preview', async () => {
            const cardPreview = await studio.getCard(variationId);
            await expect(cardPreview).toBeVisible();

            const cardPrice = cardPreview.locator(individuals.cardPrice);
            await expect(cardPrice).toBeVisible({ timeout: 10000 });
            await expect(await cardPrice).toContainText(data.price);
        });

        // await test.step('step-7: Verify variation is visible in the content page', async () => {
        //     await expect(studio.fragmentsTable).toBeVisible();
        //     await studio.fragmentsTable.scrollIntoViewIfNeeded();
        //     await studio.fragmentsTable.click();
        //     await page.waitForTimeout(2000);
        //     await expect(await studio.getCard(clonedFragmentId)).toBeVisible();
        //     await studio.switchToTableView();
        //     await expect(await studio.getCard(clonedFragmentId)).toBeVisible();
        //     await studio.getCard(clonedFragmentId).locator('button.expand-button').click();
        //     await expect(await studio.tableViewFragmentTable(variationId)).toBeVisible();
        //     await expect(await studio.tableViewPriceCell(studio.tableViewRowByFragmentId(variationId))).toBeVisible();
        //     expect(
        //         await (await studio.tableViewPriceCell(studio.tableViewRowByFragmentId(variationId))).textContent(),
        //     ).not.toBe('');
        // });
    });

    // @studio-create-variation-table-view - Validate creating a variation from table view
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.renderView).toBeVisible();
        });

        await test.step('step-2: Clone the fragment', async () => {
            await studio.cloneCard(data.cardid);
            const clonedCard = await studio.getCard(data.cardid, 'cloned');
            await expect(clonedCard).toBeVisible();
            clonedFragmentId = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            expect(clonedFragmentId).toBeTruthy();
        });

        await test.step('step-3: Create variation from table view', async () => {
            await expect(studio.fragmentsTable).toBeVisible();
            await studio.fragmentsTable.scrollIntoViewIfNeeded();
            await studio.fragmentsTable.click();
            await page.waitForTimeout(2000);
            variationId = await studio.createVariation(clonedFragmentId, data.locale);
            expect(variationId).toBeTruthy();
        });

        await test.step('step-4: Verify variation header is visible in editor', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.localeVariationHeader).toBeVisible();
            const headerText = await editor.localeVariationHeader.textContent();
            expect(headerText).toContain('Regional variation');
            expect(headerText).toContain(data.locale.split('_')[0].toUpperCase());
            expect(headerText).toContain(data.localeName);
        });

        await test.step('step-5: Wait for preview to resolve and verify price in editor', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
        });

        await test.step('step-6: Verify price in card preview', async () => {
            const cardPreview = await studio.getCard(variationId);
            await expect(cardPreview).toBeVisible();

            const cardPrice = cardPreview.locator(individuals.cardPrice);
            await expect(cardPrice).toBeVisible({ timeout: 10000 });
            await expect(await cardPrice).toContainText(data.price);
        });
    });

    // @studio-create-variation-new-fragment - Validate creating a variation from new fragment
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);
        let newFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.renderView).toBeVisible();
        });

        await test.step('step-2: Create new fragment', async () => {
            newFragmentId = await studio.createFragment({
                osi: data.osi,
                variant: data.variant,
            });
            expect(newFragmentId).toBeTruthy();
        });

        await test.step('step-3: Create variation from editor', async () => {
            variationId = await studio.createVariation(newFragmentId, data.locale);
            expect(variationId).toBeTruthy();
        });

        await test.step('step-4: Verify variation header is visible in editor', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.localeVariationHeader).toBeVisible();
            const headerText = await editor.localeVariationHeader.textContent();
            expect(headerText).toContain('Regional variation');
            expect(headerText).toContain(data.locale.split('_')[0].toUpperCase());
            expect(headerText).toContain(data.localeName);
        });

        await test.step('step-5: Wait for preview to resolve and verify price in editor', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
        });

        await test.step('step-6: Verify price in card preview', async () => {
            const cardPreview = await studio.getCard(variationId);
            await expect(cardPreview).toBeVisible();

            const cardPrice = cardPreview.locator(individuals.cardPrice);
            await expect(cardPrice).toBeVisible({ timeout: 10000 });
            await expect(await cardPrice).toContainText(data.price);
        });
    });

    // @studio-create-delete-variation - Validate creating a variation from editor
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.renderView).toBeVisible();
        });

        await test.step('step-2: Clone the fragment', async () => {
            await studio.cloneCard(data.cardid);
            const clonedCard = await studio.getCard(data.cardid, 'cloned');
            await expect(clonedCard).toBeVisible();
            clonedFragmentId = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            expect(clonedFragmentId).toBeTruthy();
        });

        await test.step('step-3: Create variation from editor', async () => {
            variationId = await studio.createVariation(clonedFragmentId, data.locale);
            expect(variationId).toBeTruthy();
        });

        await test.step('step-4: Verify variation fragment', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.localeVariationHeader).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
        });

        await test.step('step-5: Delete variation', async () => {
            await studio.deleteCard(variationId);
        });

        await test.step('step-6: Verify variation is deleted', async () => {
            await expect(await editor.panel).not.toBeVisible();
            await expect(await studio.getCard(variationId)).not.toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });
    });
});
