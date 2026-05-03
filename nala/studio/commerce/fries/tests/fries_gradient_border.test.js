import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import COMFriesGradientBorderSpec from '../specs/fries_gradient_border.spec.js';

const { features } = COMFriesGradientBorderSpec;

const verifyGradientApplied = async (card, stops) => {
    const background = await card.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(background).toContain('linear-gradient');
    for (const stop of stops) {
        const r = parseInt(stop.slice(1, 3), 16);
        const g = parseInt(stop.slice(3, 5), 16);
        const b = parseInt(stop.slice(5, 7), 16);
        expect(background).toContain(`rgb(${r}, ${g}, ${b})`);
    }
};

test.describe('M@S Studio Commerce Fries gradient border test suite', () => {
    for (const feature of features) {
        // @studio-fries-gradient-border-* - Validate selecting a gradient border option
        // wires the expected attributes and applies the gradient ring to the fries card.
        test(`${feature.name},${feature.tags}`, async ({ page, baseURL }) => {
            const { data } = feature;
            const testPage = `${baseURL}${feature.path}${miloLibs}${feature.browserParams}${data.cardid}`;
            setTestPage(testPage);
            const friesCard = await studio.getCard(data.cardid);

            await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
                await page.goto(testPage);
                await page.waitForLoadState('domcontentloaded');
                await expect(await editor.panel).toBeVisible();
            });

            await test.step('step-2: Validate initial border color picker state', async () => {
                await expect(await editor.borderColor).toBeVisible();
                await editor.borderColor.scrollIntoViewIfNeeded();
                await expect(await editor.borderColor).toContainText(data.color.original);
            });

            await test.step(`step-3: Border color picker exposes the "${data.color.updated}" option`, async () => {
                await editor.borderColor.click();
                await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
                const option = page.getByRole('option', { name: data.color.updated, exact: true });
                await expect(option).toBeVisible();
                await option.click();
            });

            await test.step('step-4: Validate fries card receives gradient-border attributes', async () => {
                await expect(await editor.borderColor).toContainText(data.color.updated);
                await expect(friesCard).toHaveAttribute('border-color', data.borderColorAttribute);
                await expect(friesCard).toHaveAttribute('gradient-border', 'true');
            });

            await test.step('step-5: Validate gradient ring is painted on the card host', async () => {
                await verifyGradientApplied(friesCard, data.gradientStops);
            });

            await test.step('step-6: Close the editor and verify discard is triggered', async () => {
                await studio.discardEditorChanges(editor);
            });

            await test.step('step-7: Validate gradient-border attributes are cleared after discard', async () => {
                const borderColorAttr = await friesCard.getAttribute('border-color');
                expect(borderColorAttr === null || borderColorAttr === '').toBeTruthy();
                const gradientBorderAttr = await friesCard.getAttribute('gradient-border');
                expect(gradientBorderAttr === null || gradientBorderAttr === '').toBeTruthy();
            });
        });
    }
});
