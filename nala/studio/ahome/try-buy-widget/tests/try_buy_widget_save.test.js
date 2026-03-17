import {
    test,
    expect,
    studio,
    editor,
    slice,
    suggested,
    trybuywidget,
    ost,
    setClonedCardID,
    getClonedCardID,
    webUtil,
    miloLibs,
    setTestPage,
} from '../../../../libs/mas-test.js';
import AHTryBuyWidgetSpec from '../specs/try_buy_widget_save.spec.js';

const { features } = AHTryBuyWidgetSpec;

test.describe('M@S Studio AHome Try Buy Widget card test suite', () => {
    // @studio-try-buy-widget-save-bg-color-and-image - Edit bg-color and image, save at end, validate in parallel
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
            data.clonedCardID = getClonedCardID();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Edit background color', async () => {
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.backgroundColor).toHaveAttribute('value', data.color.original);
            await editor.backgroundColor.scrollIntoViewIfNeeded();
            await editor.backgroundColor.click();
            await expect(await editor.backgroundColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit background image', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue(data.background.original);
            await editor.backgroundImage.fill(data.background.updated);
        });

        await test.step('step-5: Save card with all changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-6: Validate all changes in parallel', async () => {
            const validationLabels = ['background color saved on card', 'image saved on card'];

            const results = await Promise.allSettled([
                test.step('Validation-1: Verify background color saved on card', async () => {
                    const card = await studio.getCard(data.clonedCardID);
                    await expect(await card).not.toHaveAttribute('background-color', data.color.original);
                    await expect(await card).toHaveAttribute('background-color', data.color.updated.toLowerCase());
                }),

                test.step('Validation-2: Verify image saved on card', async () => {
                    const card = await studio.getCard(data.clonedCardID);
                    await expect(await card.locator(trybuywidget.cardImage)).toHaveAttribute('src', data.background.updated);
                }),
            ]);

            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(
                    `\x1b[31m✘\x1b[0m Try Buy Widget save bg-color and image validation failures:\n${failures.join('\n')}`,
                );
            }
        });
    });
});
