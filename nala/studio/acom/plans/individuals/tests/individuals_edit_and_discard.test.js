import {
    test,
    expect,
    studio,
    editor,
    individuals,
    slice,
    suggested,
    trybuywidget,
    ost,
    webUtil,
    miloLibs,
    setTestPage,
} from '../../../../../libs/mas-test.js';
import ACOMPlansIndividualsSpec from '../specs/individuals_edit_and_discard.spec.js';

const { features } = ACOMPlansIndividualsSpec;

test.describe('M@S Studio ACOM Plans Individuals card test suite', () => {
    // @studio-plans-individuals-edit-discard-variant-change-to-suggested - Validate variant change for plans individuals card to suggested in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'plans');
            await editor.variant.click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-suggested');
            await expect(await editor.size).not.toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditMenu).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showAddOn).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-5: Validate new variant of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(await suggested.cardTitle).toBeVisible();
            await expect(await suggested.cardDescription).toBeVisible();
            await expect(await suggested.cardPrice).toBeVisible();
            await expect(await suggested.cardIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardPromoText).not.toBeVisible();
            await expect(await individuals.cardCallout).not.toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(await individuals.cardQuantitySelector).not.toBeVisible();
            await expect(await individuals.cardSecureTransaction).not.toBeVisible();
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ccd-suggested');
        });
    });

    // @studio-plans-individuals-edit-discard-variant-change-to-slice - Validate variant change for plans individuals card to slice in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'plans');
            await editor.variant.click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-slice');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).not.toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditMenu).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).not.toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showAddOn).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-5: Validate new variant of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');

            await expect(await individuals.cardTitle).not.toBeVisible();
            await expect(await slice.cardDescription).toBeVisible();
            await expect(await slice.cardPrice).not.toBeVisible();
            await expect(await slice.cardIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardPromoText).not.toBeVisible();
            await expect(await individuals.cardCallout).not.toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(await individuals.cardQuantitySelector).not.toBeVisible();
            await expect(await individuals.cardSecureTransaction).not.toBeVisible();
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ccd-slice');
        });
    });

    // @studio-plans-individuals-edit-discard-variant-change-to-trybuywidget - Validate variant change for plans individuals card to try-buy-widget in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'plans');
            await editor.variant.click();
            await page.getByRole('option', { name: 'try buy widget' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('value', 'ah-try-buy-widget');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditMenu).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showAddOn).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-5: Validate new variant of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardDescription).toBeVisible();
            await expect(await trybuywidget.cardPrice).toBeVisible();
            await expect(await trybuywidget.cardIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardPromoText).not.toBeVisible();
            await expect(await individuals.cardCallout).not.toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(await individuals.cardQuantitySelector).not.toBeVisible();
            await expect(await individuals.cardSecureTransaction).not.toBeVisible();
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ah-try-buy-widget');
        });
    });

    // @studio-plans-individuals-edit-discard-size - Validate edit size for plans individuals card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await expect(await editor.size).toHaveAttribute('value', 'Default');
            await editor.size.scrollIntoViewIfNeeded();
            await editor.size.click();
            await page.waitForTimeout(500);
            await page.getByRole('option', { name: 'Wide', exact: true }).click();
            await expect(editor.size).toHaveAttribute('value', 'wide');
        });

        await test.step('step-4: Validate new size of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'wide');
        });

        await test.step('step-5: Edit size field to super-wide', async () => {
            await expect(editor.size).toBeVisible();
            await editor.size.scrollIntoViewIfNeeded();
            await editor.size.click();
            await page.waitForTimeout(500);
            await page.getByRole('option', { name: 'Super Wide', exact: true }).click();
            await expect(editor.size).toHaveAttribute('value', 'super-wide');
        });

        await test.step('step-6: Validate new size of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'super-wide');
        });

        await test.step('step-7: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-8: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('size', 'super-wide');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('size', 'wide');
        });
    });

    // @studio-plans-individuals-edit-discard-title - Validate edit title for plans individuals card in mas studio
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.title).toContainText(data.title.original);
            await editor.title.fill(data.title.updated);
        });

        await test.step('step-4: Validate title field updated', async () => {
            await expect(await editor.title).toContainText(data.title.updated);
            await expect(await individuals.cardTitle).toHaveText(data.title.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Validate title field not updated', async () => {
            await expect(await individuals.cardTitle).toHaveText(data.title.original);
        });
    });

    // @studio-plans-individuals-edit-discard-badge - Validate edit badge for plans individuals card in mas studio
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Remove badge field', async () => {
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.badge).toHaveValue(data.badge.original);
            await editor.badge.fill('');
        });

        await test.step('step-4: Validate badge field is removed', async () => {
            await expect(await editor.badge).toHaveValue('');
            await expect(await individuals.cardBadge).not.toBeVisible();
        });

        await test.step('step-5: Enter new value in the badge field', async () => {
            await editor.badge.fill(data.badge.updated);
        });

        await test.step('step-6: Validate badge field updated', async () => {
            await expect(await editor.badge).toHaveValue(data.badge.updated);
            await expect(await individuals.cardBadge).toHaveText(data.badge.updated);
        });

        await test.step('step-7: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-8: Verify there is no changes of the card', async () => {
            await expect(await individuals.cardBadge).toHaveText(data.badge.original);
        });
    });

    // @studio-plans-individuals-edit-discard-description - Validate edit description for plans individuals card in mas studio
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(data.description.original);
            await editor.description.fill(data.description.updated);
        });

        await test.step('step-4: Validate description field updated', async () => {
            await expect(await editor.description).toContainText(data.description.updated);
            await expect(await individuals.cardDescription).toContainText(data.description.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Validate description field not updated', async () => {
            await expect(await individuals.cardDescription).toContainText(data.description.original);
        });
    });

    // @studio-plans-individuals-edit-discard-mnemonic - Validate edit mnemonic for plans individuals card in mas studio
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await editor.openMnemonicModal();
            await editor.mnemonicUrlTab.click();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL.original);
            await editor.iconURL.fill(data.iconURL.updated);
        });

        await test.step('step-4: Validate mnemonic URL field updated', async () => {
            await expect(await editor.iconURL).toHaveValue(data.iconURL.updated);
            await editor.saveMnemonicModal();
            await expect(await individuals.cardIcon).toHaveAttribute('src', data.iconURL.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Validate mnemonic field not updated', async () => {
            await expect(await individuals.cardIcon).toHaveAttribute('src', data.iconURL.original);
        });
    });

    // @studio-plans-individuals-edit-discard-callout - Validate edit callout for plans individuals card in mas studio
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Remove callout field', async () => {
            await expect(await editor.calloutRTE).toBeVisible();
            await editor.calloutRTE.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            await expect(await editor.calloutRTE).toContainText(data.calloutText.original);
            await editor.calloutRTE.click();
            await page.waitForTimeout(500);
            await editor.calloutRTE.clear();
            await page.waitForTimeout(1000);
            await expect(await editor.calloutRTE).toHaveText('');
        });

        await test.step('step-4: Validate callout field is removed', async () => {
            await expect(await individuals.cardCallout).not.toBeVisible();
        });

        await test.step('step-5: Enter new value in the callout field', async () => {
            await editor.calloutRTE.fill(data.calloutText.updated);
            await page.waitForTimeout(1000);
        });

        await test.step('step-6: Validate callout field updated', async () => {
            await expect(await editor.calloutRTE).toContainText(data.calloutText.updated);
            await expect(await individuals.cardCallout).toBeVisible();
            await expect(await individuals.cardCallout).toContainText(data.calloutText.updated);
        });

        await test.step('step-7: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-8: Validate callout field not updated', async () => {
            await expect(await individuals.cardCallout).toBeVisible();
            await expect(await individuals.cardCallout).toContainText(data.calloutText.original);
        });
    });

    // @studio-plans-individuals-edit-discard-promo-text - Validate edit promo text for plans individuals card in mas studio
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Remove promo text field', async () => {
            await expect(await editor.promoText).toBeVisible();
            await expect(await editor.promoText).toHaveValue(data.promoText.original);
            await editor.promoText.fill('');
        });

        await test.step('step-4: Validate promo text field is removed', async () => {
            await expect(await editor.promoText).toHaveValue('');
            await expect(await individuals.cardPromoText).not.toBeVisible();
        });

        await test.step('step-5: Enter new value in the promo text field', async () => {
            await editor.promoText.fill(data.promoText.updated);
        });

        await test.step('step-6: Validate promo text field updated', async () => {
            await expect(await editor.promoText).toHaveValue(data.promoText.updated);
            await expect(await individuals.cardPromoText).toHaveText(data.promoText.updated);
        });

        await test.step('step-7: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-8: Validate promo text field not updated', async () => {
            await expect(await individuals.cardPromoText).toHaveText(data.promoText.original);
        });
    });

    // @studio-plans-individuals-edit-discard-price - Validate edit price for plans individuals card in mas studio
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price.original);
            await expect(await editor.prices).not.toContainText(data.price.updated);
            await expect(await editor.prices).toContainText(data.strikethroughPrice.original);
            await expect(await editor.prices).not.toContainText(data.strikethroughPrice.updated);
            await expect(await editor.prices.locator(editor.promoStrikethroughPrice)).toHaveCSS(
                'text-decoration-line',
                'line-through',
            );
            await (await editor.prices.locator(editor.regularPrice)).click();
            await (await editor.prices.locator(editor.OSTButton)).click();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.price).toContainText(data.price.original);
            await expect(await ost.price).not.toContainText(data.price.updated);
            await expect(await ost.price).toContainText(data.strikethroughPrice.original);
            await expect(await ost.price).not.toContainText(data.strikethroughPrice.updated);
            await expect(await ost.pricePromoStrikethrough).toHaveCSS('text-decoration-line', 'line-through');
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo);
            await expect(await ost.promoField).toHaveValue(data.promo);

            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await expect(await ost.price).toContainText(data.price.updated);
            await expect(await ost.price).toContainText(data.strikethroughPrice.updated);
            await expect(await ost.pricePromoStrikethrough).toHaveCSS('text-decoration-line', 'line-through');
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.price.updated);
            await expect(await editor.prices).toContainText(data.strikethroughPrice.updated);
            await expect(await editor.prices.locator(editor.promoStrikethroughPrice)).toHaveCSS(
                'text-decoration-line',
                'line-through',
            );
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await individuals.cardPrice).not.toContainText(data.price.updated);
            await expect(await individuals.cardPrice).not.toContainText(data.strikethroughPrice.updated);
            await expect(await individuals.cardPrice).toContainText(data.price.original);
            await expect(await individuals.cardPrice).toContainText(data.strikethroughPrice.original);
            await expect(await individuals.cardPriceStrikethrough).toHaveCSS('text-decoration-line', 'line-through');
            await expect(await individuals.cardPriceLegal).toBeVisible();
            await expect(await individuals.cardPriceLegal).toContainText(data.legalText);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await individuals.cardPrice).toContainText(data.price.original);
            await expect(await individuals.cardPrice).toContainText(data.strikethroughPrice.original);
            await expect(await individuals.cardPrice).not.toContainText(data.price.updated);
            await expect(await individuals.cardPrice).not.toContainText(data.strikethroughPrice.updated);
        });
    });

    // @studio-plans-individuals-edit-discard-osi - Validate edit OSI for plans individuals card in mas studio
    test(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Change OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi.original);
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.offerType}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.marketSegment}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.planType}`));
            await editor.OSIButton.click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.osi.updated);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited OSI and tags in Editor panel', async () => {
            await expect(await editor.OSI).toContainText(data.osi.updated);
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.updated.offerType}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.updated.marketSegment}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.updated.planType}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.original.offerType}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.original.marketSegment}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.original.planType}`));
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Open the editor and validate there are no changes', async () => {
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi.original);
            await expect(await editor.OSI).not.toContainText(data.osi.updated);
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.offerType}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.marketSegment}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.planType}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.updated.offerType}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.updated.marketSegment}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.updated.planType}`));
        });
    });

    // @studio-plans-individuals-edit-discard-stock-checkbox - Validate edit stock checkbox for plans individuals card in mas studio
    test.skip(`${features[12].name},${features[12].tags}`, async ({ page, baseURL }) => {
        const { data } = features[12];
        const testPage = `${baseURL}${features[12].path}${miloLibs}${features[12].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Toggle stock checkbox', async () => {
            await expect(await editor.showStockCheckbox).toBeVisible();
            await expect(await editor.showStockCheckbox).toBeChecked();
            await expect(await individuals.cardStockCheckbox).toBeVisible();
            await expect(await individuals.cardStockCheckboxIcon).toBeVisible();
            await editor.showStockCheckbox.click();
        });

        await test.step('step-4: Validate stock checkbox updated', async () => {
            await expect(await editor.showStockCheckbox).not.toBeChecked();
            await expect(await editor.showStockCheckbox).toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(await individuals.cardStockCheckboxIcon).not.toBeVisible();
        });

        await test.step('step-5: Toggle back stock checkbox', async () => {
            await editor.showStockCheckbox.click();
        });

        await test.step('step-6: Validate stock checkbox updated', async () => {
            await expect(await editor.showStockCheckbox).toBeChecked();
            await expect(await editor.showStockCheckbox).toBeVisible();
            await expect(await individuals.cardStockCheckbox).toBeVisible();
            await expect(await individuals.cardStockCheckboxIcon).toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-discard-quantity-selector - Validate edit quantity selector for plans individuals card in mas studio
    test(`${features[13].name},${features[13].tags}`, async ({ page, baseURL }) => {
        const { data } = features[13];
        const testPage = `${baseURL}${features[13].path}${miloLibs}${features[13].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Toggle quantity selector', async () => {
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await editor.showQuantitySelector).toBeChecked();
            await expect(await individuals.cardQuantitySelector).toBeVisible();
            await editor.showQuantitySelector.click();
        });

        await test.step('step-4: Validate quantity selector updated', async () => {
            await expect(await editor.showQuantitySelector).not.toBeChecked();
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await individuals.cardQuantitySelector).not.toBeVisible();
        });

        await test.step('step-5: Toggle back quantity selector', async () => {
            await editor.showQuantitySelector.click();
        });

        await test.step('step-6: Validate quantity selector updated', async () => {
            await expect(await editor.showQuantitySelector).toBeChecked();
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await individuals.cardQuantitySelector).toBeVisible();
        });

        await test.step('step-7: Edit quantity selector start value', async () => {
            await expect(await editor.quantitySelectorStart).toBeVisible();
            await expect(await editor.quantitySelectorStart).toHaveValue(data.startValue.original);
            await editor.quantitySelectorStart.fill(data.startValue.updated);
            await expect(await editor.quantitySelectorStart).toHaveValue(data.startValue.updated);
        });

        await test.step('step-8: Edit quantity selector step value', async () => {
            await expect(await editor.quantitySelectorStep).toBeVisible();
            await expect(await editor.quantitySelectorStep).toHaveValue(data.stepValue.original);
            await editor.quantitySelectorStep.fill(data.stepValue.updated);
            await expect(await editor.quantitySelectorStep).toHaveValue(data.stepValue.updated);
        });

        await test.step('step-10: Validate quantity selector step value on card', async () => {
            await expect(await individuals.cardQuantitySelector).toHaveAttribute('step', data.stepValue.updated);
            await expect(await individuals.cardQuantitySelector).toHaveAttribute('min', data.startValue.updated);
            // Test stepping through values
            await individuals.cardQuantitySelector.locator('button').click();
            await individuals.cardQuantitySelector.locator('button').press('ArrowDown');
            await individuals.cardQuantitySelector.locator('button').press('Enter');
            await expect(await individuals.cardQuantitySelector.locator('.text-field-input')).toHaveValue(
                String(Number(data.startValue.updated) + Number(data.stepValue.updated)),
            );
        });

        await test.step('step-11: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-12: Verify quantity selector is unchanged', async () => {
            await expect(await individuals.cardQuantitySelector).toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-discard-whats-included - Validate edit whats included for plans individuals card in mas studio
    test(`${features[14].name},${features[14].tags}`, async ({ page, baseURL }) => {
        const { data } = features[14];
        const testPage = `${baseURL}${features[14].path}${miloLibs}${features[14].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit whats included field', async () => {
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await expect(await editor.whatsIncludedLabel).toHaveValue('');
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await editor.whatsIncludedLabel.fill(data.whatsIncluded.text);
        });

        await test.step('step-4: Validate whats included field updated', async () => {
            await expect(await editor.whatsIncludedLabel).toHaveValue(data.whatsIncluded.text);
            await expect(await individuals.cardWhatsIncluded).toBeVisible();
            await expect(await individuals.cardWhatsIncludedLabel).toHaveText(data.whatsIncluded.text);
        });

        await test.step('step-5: Add icon to whats included', async () => {
            await expect(await editor.whatsIncludedAddIcon).toBeVisible();
            await editor.whatsIncludedAddIcon.click();
            await expect(await editor.mnemonicUrlTab).toBeVisible();
            await editor.mnemonicUrlTab.click();
            await expect(await editor.mnemonicUrlIconInput).toBeVisible();
            await expect(await editor.mnemonicUrlAltInput).toBeVisible();
            await editor.mnemonicUrlIconInput.fill(data.whatsIncluded.iconURL);
            await editor.mnemonicUrlAltInput.fill(data.whatsIncluded.iconLabel);
            await editor.saveMnemonicModal();
        });

        await test.step('step-6: Validate icon added to whats included', async () => {
            await expect(await individuals.cardWhatsIncludedIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncludedIcon).toHaveAttribute('src', data.whatsIncluded.iconURL);
            await expect(await individuals.cardWhatsIncludedIconLabel).toHaveText(data.whatsIncluded.iconLabel);
        });

        await test.step('step-7: Remove whats included label field', async () => {
            await editor.whatsIncludedLabel.fill('');
        });

        await test.step('step-8: Validate whats included label is removed', async () => {
            await expect(await editor.whatsIncludedLabel).toHaveValue('');
            await expect(await individuals.cardWhatsIncludedLabel).not.toBeVisible();
            await expect(await individuals.cardWhatsIncludedIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncludedIconLabel).toBeVisible();
        });

        await test.step('step-9: Remove whats included icon', async () => {
            await expect(await editor.whatsIncluded.locator(editor.mnemonicEditMenu)).toBeVisible();
            await editor.whatsIncluded.locator(editor.mnemonicEditMenu).click();
            await expect(await editor.whatsIncluded.locator(editor.mnemonicDeleteButton)).toBeVisible();
            await editor.whatsIncluded.locator(editor.mnemonicDeleteButton).click();
        });

        await test.step('step-10: Validate whats included field is removed', async () => {
            await expect(await editor.whatsIncludedLabel).toHaveValue('');
            await expect(await editor.whatsIncludedIconURL).not.toBeVisible();
            await expect(await editor.whatsIncludedIconLabel).not.toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardWhatsIncludedIcon).not.toBeVisible();
            await expect(await individuals.cardWhatsIncludedIconLabel).not.toBeVisible();
        });

        await test.step('step-11: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-12: Verify whats included text not updated', async () => {
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-discard-badge-color - Validate edit badge color for plans individuals card in mas studio
    test(`${features[15].name},${features[15].tags}`, async ({ page, baseURL }) => {
        const { data } = features[15];
        const testPage = `${baseURL}${features[15].path}${miloLibs}${features[15].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const individualsCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await individualsCard).toBeVisible();
            await expect(await individualsCard).toHaveAttribute('variant', 'plans');
            await individualsCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await individualsCard).toBeVisible();
        });

        await test.step('step-3: Edit badge color field', async () => {
            await expect(await editor.badgeColor).toBeVisible();
            await expect(await editor.badgeColor).toContainText(data.color.original);
            await editor.badgeColor.scrollIntoViewIfNeeded();
            await editor.badgeColor.click();
            await page.getByRole('option', { name: data.color.updated, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate badge color field updated', async () => {
            await expect(await editor.badgeColor).toContainText(data.color.updated);
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardBadge), {
                    'background-color': data.colorCSS.updated,
                }),
            ).toBeTruthy();
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify badge color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardBadge), {
                    'background-color': data.colorCSS.original,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-edit-discard-badge-border-color - Validate edit badge border color for plans individuals card in mas studio
    test(`${features[16].name},${features[16].tags}`, async ({ page, baseURL }) => {
        const { data } = features[16];
        const testPage = `${baseURL}${features[16].path}${miloLibs}${features[16].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const individualsCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await individualsCard).toBeVisible();
            await expect(await individualsCard).toHaveAttribute('variant', 'plans');
            await individualsCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await individualsCard).toBeVisible();
        });

        await test.step('step-3: Edit badge border color field', async () => {
            await expect(await editor.badgeBorderColor).toBeVisible();
            await expect(await editor.badgeBorderColor).toContainText(data.color.original);
            await editor.badgeBorderColor.scrollIntoViewIfNeeded();
            await editor.badgeBorderColor.click();
            await expect(await editor.badgeBorderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate badge border color field updated', async () => {
            await expect(await editor.badgeBorderColor).toContainText(data.color.updated);
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardBadge), {
                    'border-left-color': data.colorCSS.updated,
                    'border-top-color': data.colorCSS.updated,
                    'border-bottom-color': data.colorCSS.updated,
                }),
            ).toBeTruthy();
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify badge border color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardBadge), {
                    'border-left-color': data.colorCSS.original,
                    'border-top-color': data.colorCSS.original,
                    'border-bottom-color': data.colorCSS.original,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-edit-discard-card-border-color - Validate edit card border color for plans individuals card in mas studio
    test(`${features[17].name},${features[17].tags}`, async ({ page, baseURL }) => {
        const { data } = features[17];
        const testPage = `${baseURL}${features[17].path}${miloLibs}${features[17].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const individualsCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await individualsCard).toBeVisible();
            await expect(await individualsCard).toHaveAttribute('variant', 'plans');
            await individualsCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await individualsCard).toBeVisible();
        });

        await test.step('step-3: Edit card border color field', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.borderColor).toContainText(data.color.original);
            await editor.borderColor.scrollIntoViewIfNeeded();
            await editor.borderColor.click();
            await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate card border color field updated', async () => {
            await expect(await editor.borderColor).toContainText(data.color.updated);
            expect(
                await webUtil.verifyCSS(individualsCard, {
                    'background-color': data.colorCSS.updated,
                }),
            ).toBeTruthy();
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify card border color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(individualsCard, {
                    'background-color': data.colorCSS.original,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-edit-discard-promo-price - Validate edit price promo for plans individuals card in mas studio
    test(`${features[18].name},${features[18].tags}`, async ({ page, baseURL }) => {
        const { data } = features[18];
        const testPage = `${baseURL}${features[18].path}${miloLibs}${features[18].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit promo field', async () => {
            await expect(await editor.prices.locator(editor.regularPrice)).toHaveAttribute(
                'data-promotion-code',
                data.promo.original,
            );
            await expect(await individuals.cardPrice).toHaveAttribute('data-promotion-code', data.promo.original);
            await (await editor.prices.locator(editor.regularPrice)).dblclick();

            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo.original);
            await expect(await ost.promoField).toHaveValue(data.promo.original);

            await ost.promoField.fill(data.promo.updated);
            await expect(await ost.promoLabel).toContainText(data.promo.updated);
            await expect(await ost.promoField).toHaveValue(data.promo.updated);
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate promo change in Editor panel', async () => {
            await expect(await editor.prices.locator(editor.regularPrice)).toHaveAttribute(
                'data-promotion-code',
                data.promo.updated,
            );
        });

        await test.step('step-5: Validate edited price promo on the card', async () => {
            await expect(await individuals.cardPrice).toHaveAttribute('data-promotion-code', data.promo.updated);
        });

        await test.step('step-6: Remove promo', async () => {
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();

            await ost.promoField.fill('');
            await expect(await ost.promoLabel).toContainText('no promo');
            await expect(await ost.promoField).toHaveValue('');
            await ost.priceUse.click();
        });

        await test.step('step-7: Validate promo removed in Editor panel', async () => {
            await expect(await editor.prices.locator(editor.regularPrice)).not.toHaveAttribute('data-promotion-code');
        });

        await test.step('step-8: Validate price promo removed from the card', async () => {
            await expect(await individuals.cardPrice).not.toHaveAttribute('data-promotion-code');
        });
    });

    // @studio-plans-individuals-phone-number - Validate phone number for plans individuals card in mas studio
    test(`${features[19].name},${features[19].tags}`, async ({ page, baseURL }) => {
        const { data } = features[19];
        const testPage = `${baseURL}${features[19].path}${miloLibs}${features[19].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Add phone link to the description', async () => {
            await expect(await editor.descriptionFieldGroup.locator(editor.linkEdit)).toBeVisible();
            await editor.descriptionFieldGroup.locator(editor.linkEdit).click();
            await expect(editor.phoneLinkTab).toBeVisible();
            await editor.phoneLinkTab.click();
            await expect(await editor.phoneLinkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await editor.phoneLinkText.fill(data.phoneNumber);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate phone link addition in Editor panel', async () => {
            await expect(await editor.description.locator(editor.phoneLink)).toHaveText(data.phoneNumber);
        });

        await test.step('step-5: Validate phone link addition on the card', async () => {
            await expect(await individuals.cardPhoneLink).toHaveText(data.phoneNumber);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify no phone number is added to the card', async () => {
            await expect(await individuals.cardPhoneLink).not.toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-discard-cta-variant - Validate edit CTA variant for plans individuals card in mas studio
    test(`${features[20].name},${features[20].tags}`, async ({ page, baseURL }) => {
        const { data } = features[20];
        const testPage = `${baseURL}${features[20].path}${miloLibs}${features[20].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.CTA).toHaveClass(data.cta.original.variant);
            expect(await webUtil.verifyCSS(await individuals.cardCTA, data.cta.original.CSS)).toBeTruthy();
            await editor.CTA.scrollIntoViewIfNeeded();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.getLinkVariant(data.cta.updated.variant)).toBeVisible();
            await (await editor.getLinkVariant(data.cta.updated.variant)).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA variant in Editor panel', async () => {
            await expect(await editor.CTA).toHaveClass(data.cta.updated.variant);
            await expect(await editor.CTA).not.toHaveClass(data.cta.original.variant);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            expect(await webUtil.verifyCSS(await individuals.cardCTA, data.cta.updated.CSS)).toBeTruthy();
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify CTA variant is unchanged', async () => {
            expect(await webUtil.verifyCSS(await individuals.cardCTA, data.cta.original.CSS)).toBeTruthy();
        });
    });

    // @studio-plans-individuals-edit-discard-cta-checkout-params - Validate edit CTA checkout params for plans individuals card in mas studio
    test(`${features[21].name},${features[21].tags}`, async ({ page, baseURL }) => {
        const { data } = features[21];
        const testPage = `${baseURL}${features[21].path}${miloLibs}${features[21].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit CTA checkout params', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await editor.CTA.scrollIntoViewIfNeeded();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.checkoutParameters).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();

            const checkoutParamsString = Object.keys(data.checkoutParams)
                .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data.checkoutParams[key])}`)
                .join('&');
            await editor.checkoutParameters.fill(checkoutParamsString);
            await editor.linkSave.click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate edited CTA on the card', async () => {
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
            const CTAhref = await individuals.cardCTA.getAttribute('href');
            const searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
            expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
            expect(searchParams.get('promoid')).toBe(data.checkoutParams.promoid);
            expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            const changedCTAhref = await individuals.cardCTA.getAttribute('href');
            const noSearchParams = new URLSearchParams(decodeURI(changedCTAhref).split('?')[1]);
            expect(noSearchParams).toBeNull;
        });
    });

    // @studio-plans-individuals-edit-discard-cta-ost - Validate edit CTA for plans individuals card in mas studio
    test(`${features[22].name},${features[22].tags}`, async ({ page, baseURL }) => {
        const { data } = features[22];
        const testPage = `${baseURL}${features[22].path}${miloLibs}${features[22].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit CTA in OST', async () => {
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.footer).toContainText(data.cta.original.text);
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
            await expect(await individuals.cardCTA).toHaveAttribute(
                'data-checkout-workflow-step',
                data.cta.original.workflowStep,
            );

            await (await editor.CTA).click();
            await (await editor.footer.locator(editor.OSTButton)).click();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.workflowMenu).toBeVisible();
            await expect(await ost.ctaTextMenu).toBeEnabled();
            await expect(await ost.checkoutLink).toBeVisible();
            await expect(await ost.checkoutLinkUse).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.cta.promo);
            await expect(await ost.promoField).toHaveValue(data.cta.promo);
            await expect(await ost.checkoutLink).toHaveAttribute('data-checkout-workflow-step', data.cta.original.workflowStep);
            await expect(async () => {
                await ost.ctaTextMenu.click();
                await expect(
                    page.locator('div[role="option"]', {
                        hasText: `${data.cta.updated.option}`,
                    }),
                ).toBeVisible({
                    timeout: 500,
                });
            }).toPass();
            await page
                .locator('div[role="option"]', {
                    hasText: `${data.cta.updated.option}`,
                })
                .click();
            await expect(async () => {
                await ost.workflowMenu.click();
                await expect(
                    page.locator('div[role="option"]', {
                        hasText: `${data.cta.updated.workflowStep}`,
                    }),
                ).toBeVisible({
                    timeout: 500,
                });
            }).toPass();
            await page
                .locator('div[role="option"]', {
                    hasText: `${data.cta.updated.workflowOption}`,
                })
                .click();
            await expect(await ost.checkoutLink).toHaveAttribute('data-checkout-workflow-step', data.cta.updated.workflowStep);
            await ost.checkoutLinkUse.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Validate edited CTA in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.cta.updated.text);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await individuals.cardCTA).toContainText(data.cta.updated.text);
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
            await expect(await individuals.cardCTA).toHaveAttribute(
                'data-checkout-workflow-step',
                data.cta.updated.workflowStep,
            );

            const CTAhref = await individuals.cardCTA.getAttribute('href');
            const workflowStep = decodeURI(CTAhref).split('?')[0];
            const searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);

            expect(workflowStep).toContain(data.cta.updated.ucv3);
            expect(searchParams.get('co')).toBe(data.cta.country);
            expect(searchParams.get('ctx')).toBe(data.cta.ctx);
            expect(searchParams.get('lang')).toBe(data.cta.lang);
            expect(searchParams.get('cli')).toBe(data.cta.client);
            expect(searchParams.get('apc')).toBe(data.cta.promo);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await individuals.cardCTA).toContainText(data.cta.original.text);
        });
    });

    // @studio-plans-individuals-edit-discard-cta-label - Validate edit CTA label for plans individuals card in mas studio
    test(`${features[23].name},${features[23].tags}`, async ({ page, baseURL }) => {
        const { data } = features[23];
        const testPage = `${baseURL}${features[23].path}${miloLibs}${features[23].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit CTA label', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.footer).toContainText(data.label.original);
            await editor.CTA.scrollIntoViewIfNeeded();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.linkText).toHaveValue(data.label.original);
            await editor.linkText.fill(data.label.updated);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA label in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.label.updated);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await individuals.cardCTA).toContainText(data.label.updated);
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await individuals.cardCTA).toContainText(data.label.original);
        });
    });

    // @studio-plans-individuals-edit-discard-cta-promo - Validate edit cta promo for plans individuals card in mas studio
    test(`${features[24].name},${features[24].tags}`, async ({ page, baseURL }) => {
        const { data } = features[24];
        const testPage = `${baseURL}${features[24].path}${miloLibs}${features[24].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit CTA promo field', async () => {
            await expect(await editor.CTA).toHaveAttribute('data-promotion-code', data.promo.original);
            await expect(await individuals.cardCTA).toHaveAttribute('data-promotion-code', data.promo.original);

            const CTAhref = await individuals.cardCTA.getAttribute('href');
            const workflowStep = decodeURI(CTAhref).split('?')[0];
            const searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
            expect(searchParams.get('apc')).toBe(data.promo.original);

            await (await editor.CTA).dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo.original);
            await expect(await ost.promoField).toHaveValue(data.promo.original);

            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.planType).toBeVisible();
            await ost.planType.click();
            await expect(await ost.planTypeABM).toBeVisible();
            await ost.planTypeABM.click();
            await page.waitForTimeout(2000);
            await ost.nextButton.click();
            await ost.promoField.fill(data.promo.updated);
            expect(await ost.promoLabel).toContainText(data.promo.updated);
            await expect(await ost.promoField).toHaveValue(data.promo.updated);
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-4: Validate edited CTA promo in Editor panel', async () => {
            await expect(await editor.CTA).toHaveAttribute('data-promotion-code', data.promo.updated);
        });

        await test.step('step-5: Validate edited CTA promo on the card', async () => {
            const newCTA = await individuals.cardCTA;
            await expect(newCTA).toHaveAttribute('data-promotion-code', data.promo.updated);
            await expect(newCTA).toHaveAttribute('href', new RegExp(`${data.ucv3}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`co=${data.country}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`ctx=${data.ctx}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`lang=${data.lang}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`cli=${data.client}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`apc=${data.promo.updated}`));
        });

        await test.step('step-6: Remove promo', async () => {
            await (await editor.CTA).dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();

            await ost.promoField.fill('');
            expect(await ost.promoLabel).toContainText('no promo');
            await expect(await ost.promoField).toHaveValue('');
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-7: Validate promo removed in Editor panel', async () => {
            await expect(await editor.CTA).not.toHaveAttribute('data-promotion-code');
        });

        await test.step('step-8: Validate CTA promo removed from the card', async () => {
            await expect(await individuals.cardCTA).not.toHaveAttribute('data-promotion-code');
            await expect(await individuals.cardCTA).not.toHaveAttribute('href', /apc=/);
        });
    });

    // @studio-plans-individuals-add-description-price-legal-disclamer - Validate adding legal disclamer in description for plans individuals card in mas studio
    test(`${features[25].name},${features[25].tags}`, async ({ page, baseURL }) => {
        const { data } = features[25];
        const testPage = `${baseURL}${features[25].path}${miloLibs}${features[25].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).not.toContainText(data.legalDisclaimer);
            await editor.descriptionFieldGroup.locator(editor.OSTButton).click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.osi.updated);
            await (await ost.nextButton).click();
            await ost.legalDisclaimer.scrollIntoViewIfNeeded();
            await expect(await ost.legalDisclaimer).not.toContainText(data.cardLegalDisclaimer);
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await expect(await ost.legalDisclaimer).toContainText(data.cardLegalDisclaimer);
            await expect(await ost.legalDisclaimerUse).toBeVisible();
            await ost.legalDisclaimerUse.click();
            await page.waitForTimeout(5000);
        });

        await test.step('step-4: Validate description field updated', async () => {
            await expect(await editor.description).toContainText(data.legalDisclaimer);
            await expect(await individuals.cardDescription).toContainText(data.cardLegalDisclaimer);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await individuals.cardDescription).not.toContainText(data.legalDisclaimer);
        });
    });

    // @studio-plans-individuals-edit-discard-product-icon-picker - Validate edit and discard product icon using icon picker for plans individuals card in mas studio
    test(`${features[26].name},${features[26].tags}`, async ({ page, baseURL }) => {
        const { data } = features[26];
        const testPage = `${baseURL}${features[26].path}${miloLibs}${features[26].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Validate original icon', async () => {
            await expect(await individuals.cardIcon).toHaveAttribute('src', data.productIcon.original.src);
        });

        await test.step('step-4: Select product icon from icon picker', async () => {
            await editor.openMnemonicModal();
            await editor.selectProductIcon(data.productIcon.name);
            await editor.saveMnemonicModal();
        });

        await test.step('step-5: Validate mnemonic icon updated in editor', async () => {
            await expect(await individuals.cardIcon).toHaveAttribute('src', data.productIcon.updated.src);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Validate icon reverted to original', async () => {
            await expect(await individuals.cardIcon).toHaveAttribute('src', data.productIcon.original.src);
        });
    });
});
