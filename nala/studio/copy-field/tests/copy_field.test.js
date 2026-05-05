import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import CopyFieldSpec from '../specs/copy_field.spec.js';

const { features } = CopyFieldSpec;

test.describe('M@S Studio Copy Field test suite', () => {
    // @studio-copy-field-popover-tax-label - MWPW-193548:
    // The Copy Field popover preview must include the locale-driven tax label
    // ("TTC" for fr_FR) that the rendered card preview shows. Before the fix
    // the popover dropped the label and emitted only the bare price.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        let renderedTaxLabel;

        await test.step('step-2: Wait for editor panel and rendered card preview', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
            await expect(await studio.getCard(data.cardid)).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-3: Verify rendered card preview shows the locale tax label', async () => {
            const card = await studio.getCard(data.cardid);
            const taxLabel = card.locator('span[is="inline-price"][data-template="price"] .price-tax-inclusivity').first();
            await expect(taxLabel).toBeVisible();
            await expect(taxLabel).not.toHaveClass(/(^|\s)disabled(\s|$)/);
            renderedTaxLabel = (await taxLabel.textContent())?.trim();
            expect(renderedTaxLabel).toBeTruthy();
        });

        await test.step('step-4: Open Copy Field popover from the side nav', async () => {
            await expect(studio.copyFieldButton).toBeVisible();
            await studio.copyFieldButton.click();
            await expect(studio.copyFieldPopover).toBeVisible({ timeout: 5000 });
        });

        await test.step('step-5: Verify popover preview includes the same tax label', async () => {
            const valueLocator = studio.copyFieldRowValue(data.priceField);
            await expect(valueLocator).toBeVisible();
            await expect(valueLocator).toContainText(renderedTaxLabel);
        });
    });
});
