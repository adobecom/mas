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
import CCDSliceSpec from '../specs/slice_save.spec.js';

const { features } = CCDSliceSpec;

test.describe('M@S Studio CCD Slice card test suite', () => {
    // @studio-slice-save-variant-change-to-suggested - Validate saving card after variant change to ccd suggested
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
            const clonedCard = await studio.getCard(data.cardid, 'cloned');
            setClonedCardID(await clonedCard.locator('aem-fragment').getAttribute('fragment'));
            data.clonedCardID = getClonedCardID();
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-slice');
            await editor.variant.click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Validate variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-suggested');
            await expect(await studio.getCard(data.clonedCardID)).not.toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(await (await studio.getCard(data.clonedCardID)).locator(suggested.cardCTA)).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await (await studio.getCard(data.clonedCardID)).locator(suggested.cardCTA)).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-slice-save-edited-RTE-fields - Validate field edits and save for slice card in mas studio
    // Combines: description, badge, mnemonic, background image, and size
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
            data.clonedCardID = getClonedCardID();
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.description);
        });

        await test.step('step-4: Edit badge field', async () => {
            await expect(await editor.badge).toBeVisible();
            await editor.badge.fill(data.badge);
        });

        await test.step('step-5: Edit mnemonic field', async () => {
            await editor.openMnemonicModal();
            await editor.mnemonicUrlTab.click();
            await expect(await editor.iconURL).toBeVisible();
            await editor.iconURL.fill(data.iconURL);
            await editor.saveMnemonicModal();
        });

        await test.step('step-6: Edit background image field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await editor.backgroundImage.fill(data.backgroundURL);
        });

        await test.step('step-7: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await editor.size.scrollIntoViewIfNeeded();
            await editor.size.click();
            await page.getByRole('option', { name: 'default' }).click();
        });

        await test.step('step-8: Save card with all changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-9: Validate all field changes in parallel', async () => {
            const validationLabels = ['description', 'badge', 'mnemonic', 'background image', 'size'];

            const results = await Promise.allSettled([
                test.step('Validation-1: Verify description saved', async () => {
                    await expect(await editor.description).toContainText(data.description);
                    await expect(await clonedCard.locator(slice.cardDescription)).toHaveText(data.description);
                }),

                test.step('Validation-2: Verify badge saved', async () => {
                    await expect(await editor.badge).toHaveValue(data.badge);
                    await expect(await clonedCard.locator(slice.cardBadge)).toBeVisible();
                    await expect(await clonedCard.locator(slice.cardBadge)).toHaveText(data.badge);
                }),

                test.step('Validation-3: Verify mnemonic saved', async () => {
                    await editor.openMnemonicModal();
                    await editor.mnemonicUrlTab.click();
                    await expect(await editor.iconURL).toHaveValue(data.iconURL);
                    await editor.cancelMnemonicModal();
                    await expect(await clonedCard.locator(slice.cardIcon)).toHaveAttribute('src', data.iconURL);
                }),

                test.step('Validation-4: Verify background image saved', async () => {
                    await expect(await editor.backgroundImage).toHaveValue(data.backgroundURL);
                    await expect(await clonedCard.locator(slice.cardImage)).toBeVisible();
                    await expect(await clonedCard.locator(slice.cardImage)).toHaveAttribute('src', data.backgroundURL);
                }),

                test.step('Validation-5: Verify size saved', async () => {
                    await expect(await clonedCard).not.toHaveAttribute('size', 'wide');
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Slice card field save validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
