import { test, expect, studio, editor, setClonedCardID, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import COMFriesGradientBorderSaveSpec from '../specs/fries_gradient_border_save.spec.js';

const { features } = COMFriesGradientBorderSaveSpec;

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

test.describe('M@S Studio Commerce Fries gradient border save test suite', () => {
    // @studio-fries-gradient-border-save-purple-blue - Save a fries card with the purple-blue
    // gradient border and verify both border-color and gradient-border attributes persist.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            setClonedCardID(await clonedCard.locator('aem-fragment').getAttribute('fragment'));
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step(`step-3: Select "${data.color.updated}" border color option`, async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.scrollIntoViewIfNeeded();
            await editor.borderColor.click();
            await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Save card with gradient border applied', async () => {
            await studio.saveCard();
        });

        await test.step('step-5: Verify gradient border attributes persist after save', async () => {
            await expect(await editor.borderColor).toContainText(data.color.updated);
            await expect(clonedCard).toHaveAttribute('border-color', data.borderColorAttribute);
            await expect(clonedCard).toHaveAttribute('gradient-border', 'true');
        });

        await test.step('step-6: Verify gradient ring is painted on the saved card', async () => {
            await verifyGradientApplied(clonedCard, data.gradientStops);
        });
    });

    // @studio-fries-gradient-border-save-firefly-spectrum - Save a fries card with the
    // firefly-spectrum gradient border and verify both border-color and gradient-border
    // attributes persist.
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            setClonedCardID(await clonedCard.locator('aem-fragment').getAttribute('fragment'));
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step(`step-3: Select "${data.color.updated}" border color option`, async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.scrollIntoViewIfNeeded();
            await editor.borderColor.click();
            await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Save card with gradient border applied', async () => {
            await studio.saveCard();
        });

        await test.step('step-5: Verify gradient border attributes persist after save', async () => {
            await expect(await editor.borderColor).toContainText(data.color.updated);
            await expect(clonedCard).toHaveAttribute('border-color', data.borderColorAttribute);
            await expect(clonedCard).toHaveAttribute('gradient-border', 'true');
        });

        await test.step('step-6: Verify gradient ring is painted on the saved card', async () => {
            await verifyGradientApplied(clonedCard, data.gradientStops);
        });
    });
});
