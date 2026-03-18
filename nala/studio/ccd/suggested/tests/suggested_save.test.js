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
import CCDSuggestedSpec from '../specs/suggested_save.spec.js';
const { features } = CCDSuggestedSpec;

test.describe('M@S Studio CCD Suggested card test suite', () => {
    // @studio-suggested-remove-correct-fragment - Clone card then delete, verify the correct card is removed from screen
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            const clonedCardOne = await studio.getCard(data.cardid, 'cloned');
            const clonedCardOneID = await clonedCardOne.locator('aem-fragment').getAttribute('fragment');
            data.clonedCardOneID = await clonedCardOneID;
            await studio.cloneCard(clonedCardOneID);

            const clonedCardTwo = await studio.getCard(data.cardid, 'cloned', data.clonedCardOneID);

            await expect(await clonedCardTwo).toBeVisible();

            const clonedCardTwoID = await clonedCardTwo.locator('aem-fragment').getAttribute('fragment');
            data.clonedCardTwoID = clonedCardTwoID;
        });

        await test.step('step-3: Delete cloned cards', async () => {
            const clonedCardOne = await studio.getCard(data.clonedCardOneID);
            const clonedCardTwo = await studio.getCard(data.clonedCardTwoID);

            await expect(await studio.fragmentsTable).toBeVisible();
            await studio.fragmentsTable.click();
            await page.waitForTimeout(2000);
            await expect(await clonedCardOne).toBeVisible();
            await expect(await clonedCardTwo).toBeVisible();

            await clonedCardOne.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCardOne).toBeVisible();
            await studio.deleteCard(data.clonedCardOneID);
            await expect(await clonedCardOne).not.toBeVisible();

            await expect(await clonedCardTwo).toBeVisible();
            await clonedCardTwo.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCardTwo).toBeVisible();
            await studio.deleteCard(data.clonedCardTwoID);
            await expect(await clonedCardTwo).not.toBeVisible();
        });
    });

    // @studio-suggested-save-variant-change-to-slice - Validate saving card after variant change to ccd slice
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            const clonedCard = await studio.getCard(data.cardid, 'cloned');
            setClonedCardID(await clonedCard.locator('aem-fragment').getAttribute('fragment'));
            data.clonedCardID = getClonedCardID();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-suggested');
            await editor.variant.click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Validate variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-slice');
            await expect(await studio.getCard(data.clonedCardID)).not.toHaveAttribute('variant', 'ccd-suggested');
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await (await studio.getCard(data.clonedCardID)).locator(slice.cardCTA)).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await (await studio.getCard(data.clonedCardID)).locator(slice.cardCTA)).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-suggested-save-edited-RTE-fields - Validate field edits and save for suggested card in mas studio
    // Combines: eyebrow, and background image
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit eyebrow field', async () => {
            await expect(await editor.subtitle).toBeVisible();
            await editor.subtitle.fill(data.subtitle);
        });

        await test.step('step-4: Edit background image field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await editor.backgroundImage.fill(data.backgroundURL);
        });

        await test.step('step-5: Save card with all changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-6: Validate all field changes in parallel', async () => {
            const validationLabels = ['eyebrow', 'background image'];

            const results = await Promise.allSettled([
                test.step('Validation-1: Verify eyebrow saved', async () => {
                    await expect(await editor.subtitle).toHaveValue(data.subtitle);
                    await expect(await clonedCard.locator(suggested.cardEyebrow)).toHaveText(data.subtitle);
                }),

                test.step('Validation-2: Verify background image saved', async () => {
                    await expect(await editor.backgroundImage).toHaveValue(data.backgroundURL);
                    await expect(await clonedCard).toHaveAttribute('background-image', data.backgroundURL);
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Suggested card field save validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
