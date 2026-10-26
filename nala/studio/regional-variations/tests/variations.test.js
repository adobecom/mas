import { test, expect, studio, editor, plans, ost, webUtil, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import VariationsSpec from '../specs/variations.spec.js';

const { features } = VariationsSpec;

const expectGroupedVariationInEditor = async (data) => {
    await expect(await editor.panel).toBeVisible();
    await expect(editor.localeVariationHeader).toBeVisible({ timeout: 15000 });
    await expect(editor.localeVariationHeader).toContainText('Grouped variation');
    for (const locale of data.locales) {
        await expect(editor.localeVariationHeader).toContainText(locale);
    }
    await expect(editor.localeVariationDeprecationNotice).not.toBeVisible();
    await expect(editor.derivedFromContainer).toBeVisible();
    await expect(editor.derivedFromContainer).toContainText('Derived from');
    await expect(editor.derivedFromContainer).toContainText('View fragment');
    await expect(editor.derivedFromContainer).toContainText(': Default US (EN)');
};

const expectGroupedVariationPrice = async (data, variationId) => {
    await expect(await editor.prices).toBeVisible();
    await expect(await editor.prices).toContainText(data.editorPrice);
    const cardPrice = (await studio.getCard(variationId)).locator(plans.cardPrice);
    await expect(cardPrice).toBeVisible({ timeout: 10000 });
    await expect(cardPrice).toContainText(data.price);
};

const cloneFragment = async (cardId) => {
    const clonedFragmentId = await studio.cloneCard(cardId);
    const clonedCard = await studio.getCard(clonedFragmentId);
    await expect(clonedCard).toBeVisible();
    expect(clonedFragmentId).toBeTruthy();
    return clonedFragmentId;
};

const openContentTableView = async (page) => {
    await expect(studio.fragmentsTable).toBeVisible();
    await studio.fragmentsTable.scrollIntoViewIfNeeded();
    await studio.fragmentsTable.click();
    await expect(page).toHaveURL((url) => new URLSearchParams(url.hash.slice(1)).get('page') === 'content');
    await studio.switchToTableView();
    await expect(await studio.tableView).toBeVisible();
};

test.describe('M@S Studio - Variations Page test suite', () => {
    // @studio-create-grouped-variation-editor - Validate creating a grouped variation from editor
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await studio.openPage(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Clone the fragment', async () => {
            clonedFragmentId = await cloneFragment(data.cardid);
        });

        await test.step('step-3: Open create variation dialog and verify only Grouped is offered', async () => {
            await studio.openVariationDialog();
            await expect(studio.variationDialogTypePicker).toBeVisible();
            await expect(studio.variationDialogTypePicker).toHaveAttribute('disabled', '');
            await expect(studio.variationDialogTypePicker).toHaveJSProperty('value', 'grouped');
            await expect(studio.variationDialogTypePicker.locator('sp-menu-item')).toHaveCount(1);
            await expect(studio.variationDialogTagPicker).toBeVisible();
            await expect(studio.variationDialogUnavailableMessage).not.toBeVisible();
            await expect(studio.variationDialogCreateButton).toBeDisabled();
            await studio.variationDialogCancelButton.click();
            await expect(studio.variationDialog).not.toBeVisible();
        });

        await test.step('step-4: Create grouped variation', async () => {
            variationId = await studio.createVariation(clonedFragmentId, data.locales);
            expect(variationId).toBeTruthy();
        });

        await test.step('step-5: Verify grouped variation in editor', async () => {
            await expectGroupedVariationInEditor(data);
        });

        await test.step('step-6: Verify price in editor and card preview', async () => {
            await expectGroupedVariationPrice(data, variationId);
        });

        await test.step('step-7: Verify grouped variation is listed under the parent in table view', async () => {
            await openContentTableView(page);
            await expect(await studio.tableViewFragmentTable(clonedFragmentId)).toBeVisible();
            await studio.expandButton(clonedFragmentId).click();
            await studio.groupedVariationsTab(clonedFragmentId).click();
            await expect(
                studio.groupedVariationsTabPanel(clonedFragmentId).locator(`mas-fragment-table[data-id="${variationId}"]`),
            ).toBeVisible();
        });
    });

    // @studio-create-grouped-variation-table-view - Validate creating a grouped variation from table view
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await studio.openPage(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Clone the fragment', async () => {
            clonedFragmentId = await cloneFragment(data.cardid);
        });

        await test.step('step-3: Create grouped variation from table view', async () => {
            await openContentTableView(page);
            await expect(await studio.tableViewFragmentTable(clonedFragmentId)).toBeVisible();
            variationId = await studio.createVariation(clonedFragmentId, data.locales);
            expect(variationId).toBeTruthy();
        });

        await test.step('step-4: Verify grouped variation in editor', async () => {
            await expectGroupedVariationInEditor(data);
        });

        await test.step('step-5: Verify price in editor and card preview', async () => {
            await expectGroupedVariationPrice(data, variationId);
        });
    });

    // @studio-create-grouped-variation-new-fragment - Validate creating a grouped variation from a new fragment
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);
        let newFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await studio.openPage(testPage);
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

        await test.step('step-3: Create grouped variation from editor', async () => {
            variationId = await studio.createVariation(newFragmentId, data.locales);
            expect(variationId).toBeTruthy();
        });

        await test.step('step-4: Verify grouped variation in editor', async () => {
            await expectGroupedVariationInEditor(data);
        });

        await test.step('step-5: Verify price in editor and card preview', async () => {
            await expectGroupedVariationPrice(data, variationId);
        });
    });

    // @studio-delete-grouped-variation - Validate deleting a grouped variation
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await studio.openPage(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Clone the fragment', async () => {
            clonedFragmentId = await cloneFragment(data.cardid);
        });

        await test.step('step-3: Create grouped variation from editor', async () => {
            variationId = await studio.createVariation(clonedFragmentId, data.locales);
            expect(variationId).toBeTruthy();
            await expectGroupedVariationInEditor(data);
        });

        await test.step('step-4: Delete grouped variation', async () => {
            await studio.deleteCard(variationId);
        });

        await test.step('step-5: Verify grouped variation is deleted', async () => {
            await expect(await editor.panel).not.toBeVisible();
            await expect(await studio.getCard(clonedFragmentId)).toBeVisible();
            await studio.switchToTableView();
            await expect(await studio.tableViewFragmentTable(clonedFragmentId)).toBeVisible();
            await studio.expandButton(clonedFragmentId).click();
            await expect(await studio.tableViewFragmentTable(variationId)).not.toBeVisible();
        });
    });

    // @studio-grouped-variation-selfreference - Grouped variation must not reference itself after save
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;
        const referencesUrl = (id) => `${data.referencesBaseUrl}/${id}?references=all-hydrated`;

        // Count how many times the fragment ID (e.g. UUID) appears in the page body.
        const countReferencesToId = async (fragmentId) => {
            const bodyText = await page.locator('body').textContent();
            // Escape special regex chars so the ID is matched literally.
            const escapedFragmentId = fragmentId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            const matches = bodyText.match(new RegExp(escapedFragmentId, 'g'));
            return matches ? matches.length : 0;
        };

        await test.step('step-1: Go to MAS Studio fragment editor and clone', async () => {
            await studio.openPage(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            clonedFragmentId = await cloneFragment(data.cardid);
        });

        await test.step('step-2: Create grouped variation', async () => {
            variationId = await studio.createVariation(clonedFragmentId, data.locales);
            expect(variationId).toBeTruthy();
            await expect(editor.panel).toBeVisible();
        });

        await test.step('step-3: Open references URL and verify exactly one reference to variation id', async () => {
            await page.goto(referencesUrl(variationId));
            await page.waitForLoadState('domcontentloaded');
            expect(await countReferencesToId(variationId)).toBe(1);
        });

        await test.step('step-4: Return to editor, edit title, save', async () => {
            const editorPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${variationId}`;
            await studio.openPage(editorPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible({ timeout: 15000 });
            await expect(await editor.title).toBeVisible();
            await editor.fillRteField(editor.title, data.editedTitle);
            await studio.saveCard();
        });

        await test.step('step-5: Open references URL again and verify still exactly one reference', async () => {
            await page.goto(referencesUrl(variationId));
            await page.waitForLoadState('domcontentloaded');
            expect(await countReferencesToId(variationId)).toBe(1);
        });
    });

    // @studio-variation-dialog-unavailable-GB - Non en_US fragments cannot create any variation
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await studio.openPage(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Open create variation dialog and verify creation is unavailable', async () => {
            await studio.openVariationDialog();
            await expect(studio.variationDialogUnavailableMessage).toBeVisible();
            await expect(studio.variationDialogUnavailableMessage).toContainText(data.unavailableMessage);
            await expect(studio.variationDialogTypePicker.locator('sp-menu-item')).toHaveCount(0);
            await expect(studio.variationDialogTagPicker).not.toBeVisible();
            await expect(studio.variationDialogCreateButton).toBeDisabled();
        });
    });

    // @studio-variation-override-restore - Per-field steps (edit → verify preview → click restore → verify original), run in serial
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const { original } = data;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await studio.openPage(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(editor.derivedFromContainer).toBeVisible();
            await expect(editor.derivedFromContainer).toContainText('Derived from');
            await expect(editor.derivedFromContainer).toContainText('View fragment');
            await expect(editor.derivedFromContainer).toContainText(': Default US (EN)');
            await expect(editor.localeVariationDeprecationNotice).toBeVisible();
            await expect(editor.localeVariationDeprecationNotice).toContainText(data.deprecationMessage);
        });

        const fieldStepFns = [
            () =>
                test.step('field: title — edit, verify preview, click restore, verify original', async () => {
                    await expect(await editor.title).toBeVisible();
                    await editor.fillRteField(editor.title, data.title);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(plans.cardTitle)).toHaveText(data.title);
                    await editor.overrideRestoreIn(editor.titleFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.title).toContainText(original.title);
                    await expect((await studio.getCard(data.cardid)).locator(plans.cardTitle)).toHaveText(original.title);
                }),
            () =>
                test.step('field: badge — edit, verify preview, click restore, verify original', async () => {
                    // add check that other badge fields are not marked as override when MWPW-188853 is fixed
                    await editor.fillRteField(editor.badge, data.badge);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(plans.cardBadge)).toHaveText(data.badge);
                    await editor.overrideRestoreIn(editor.badgeFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.badge).toHaveText(original.badge);
                    await expect((await studio.getCard(data.cardid)).locator(plans.cardBadge)).toHaveText(original.badge);
                }),
            () =>
                test.step('field: description — edit, verify preview, click restore, verify original', async () => {
                    await editor.fillRteField(editor.description, data.description);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(plans.cardDescription)).toHaveText(data.description);
                    await editor.overrideRestoreIn(editor.descriptionFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.description).toContainText(original.description);
                    await expect((await studio.getCard(data.cardid)).locator(plans.cardDescription)).toContainText(
                        original.description,
                    );
                }),
            () =>
                test.step('field: mnemonic (iconURL) — edit, verify preview, click restore, verify original', async () => {
                    await editor.openMnemonicModal();
                    await editor.mnemonicUrlTab.click();
                    await expect(await editor.iconURL).toBeVisible();
                    await editor.iconURL.fill(data.iconURL);
                    await editor.saveMnemonicModal();
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(plans.cardIcon)).toHaveAttribute('src', data.iconURL);
                    await editor.overrideRestoreIn(editor.mnemonicFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await editor.openMnemonicModal();
                    await editor.mnemonicUrlTab.click();
                    await expect(await editor.iconURL).toHaveValue(original.iconURL);
                    await editor.cancelMnemonicModal();
                    await expect((await studio.getCard(data.cardid)).locator(plans.cardIcon)).toHaveAttribute(
                        'src',
                        original.iconURL,
                    );
                }),
            () =>
                test.step('field: callout — edit, verify preview, click restore, verify original', async () => {
                    await editor.fillRteField(editor.calloutRTE, data.callout);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(plans.cardCallout)).toHaveText(data.callout);
                    await editor.overrideRestoreIn(editor.callout).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.calloutRTE).toContainText(original.callout);
                    await expect((await studio.getCard(data.cardid)).locator(plans.cardCallout)).not.toBeVisible();
                }),
            () =>
                test.step('field: promo text — edit, verify preview, click restore, verify original', async () => {
                    await editor.fillRteField(editor.promoText, data.promoText);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(plans.cardPromoText)).toHaveText(data.promoText);
                    await editor.overrideRestoreIn(editor.promoTextFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.promoText).toHaveText(original.promoText);
                    await expect((await studio.getCard(data.cardid)).locator(plans.cardPromoText)).not.toBeVisible();
                }),
            () =>
                test.step('field: whats included — edit, verify preview, click restore, verify original', async () => {
                    await editor.whatsIncludedLabel.fill(data.whatsIncludedText);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(plans.cardWhatsIncluded)).toHaveText(data.whatsIncludedText);
                    await editor.overrideRestoreIn(editor.whatsIncluded).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.whatsIncludedLabel).toHaveValue(original.whatsIncludedText);
                    await expect((await studio.getCard(data.cardid)).locator(plans.cardWhatsIncluded)).not.toBeVisible();
                }),
            () =>
                test.step('field: badge color — edit, verify preview, click restore, verify original', async () => {
                    // add check that other badge fields are not marked as override when MWPW-188853 is fixed
                    await editor.selectPickerOption(editor.badgeColor, data.badgeColor.name);
                    const card = await studio.getCard(data.cardid);
                    expect(
                        await webUtil.verifyCSS(card.locator(plans.cardBadge), {
                            'background-color': data.badgeColor.css,
                        }),
                    ).toBeTruthy();
                    await editor.overrideRestoreIn(editor.badgeColorFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.badgeColor).toContainText(original.badgeColor.name);
                }),
            () =>
                test.step('field: badge border color — edit, verify preview, click restore, verify original', async () => {
                    // add check that other badge fields are not marked as override when MWPW-188853 is fixed
                    await editor.selectPickerOption(editor.badgeBorderColor, data.badgeBorderColor.name);
                    const card = await studio.getCard(data.cardid);
                    expect(
                        await webUtil.verifyCSS(card.locator(plans.cardBadge), {
                            'border-left-color': data.badgeBorderColor.css,
                            'border-top-color': data.badgeBorderColor.css,
                            'border-bottom-color': data.badgeBorderColor.css,
                        }),
                    ).toBeTruthy();
                    await editor.overrideRestoreIn(editor.badgeBorderColorFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.badgeBorderColor).toContainText(original.badgeBorderColor.name);
                }),
            () =>
                test.step('field: card border color — edit, verify preview, click restore, verify original', async () => {
                    await editor.selectPickerOption(editor.borderColor, data.borderColor.name);
                    const card = await studio.getCard(data.cardid);
                    expect(await webUtil.verifyCSS(card, { 'background-color': data.borderColor.css })).toBeTruthy();
                    await editor.overrideRestoreIn(editor.borderColorFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.borderColor).toContainText(original.borderColor.name);
                }),
            () =>
                test.step('field: price (OST) — edit, verify preview, click restore, verify original', async () => {
                    await expect(await editor.prices).toBeVisible();
                    await editor.prices.locator(editor.regularPrice).dblclick();
                    await expect(await ost.price).toBeVisible();
                    await expect(await ost.priceUse).toBeVisible();
                    await expect(await ost.unitCheckbox).toBeVisible();
                    await ost.unitCheckbox.click();
                    await ost.priceUse.click();
                    await page.waitForTimeout(400);
                    const editorUnitType = await editor.prices.locator('.price-unit-type');
                    await expect(editorUnitType).not.toHaveClass(/disabled/);
                    const card = await studio.getCard(data.cardid);
                    const cardUnitType = await card.locator(plans.cardPriceLegal).locator('.price-unit-type');
                    await expect(cardUnitType).not.toHaveClass(/disabled/);
                    await editor.overrideRestoreIn(editor.prices).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.prices).toContainText(original.price);
                    await expect(await editor.prices.locator('.price-unit-type')).toHaveClass(/disabled/);
                    const cardAfter = await studio.getCard(data.cardid);
                    await expect(cardAfter.locator(plans.cardPrice)).toContainText(original.price);
                    await expect(cardAfter.locator(plans.cardPriceLegal).locator('.price-unit-type')).toHaveClass(/disabled/);
                }),
            () =>
                test.step('field: CTA label (link edit) — edit, verify preview, click restore, verify original', async () => {
                    await expect(await editor.CTA).toBeVisible();
                    await editor.CTA.scrollIntoViewIfNeeded();
                    await editor.CTA.click();
                    await editor.footer.locator(editor.linkEdit).click();
                    await expect(await editor.linkText).toBeVisible();
                    await editor.linkText.fill(data.ctaLabel);
                    await editor.linkSave.click();
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(plans.cardCTA)).toContainText(data.ctaLabel);
                    await editor.overrideRestoreIn(editor.footer).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.footer).toContainText(original.ctaLabel);
                    await expect((await studio.getCard(data.cardid)).locator(plans.cardCTA)).toContainText(original.ctaLabel);
                }),
            () =>
                test.step('field: OSI — edit, verify OSI and tags, click restore, verify original', async () => {
                    await expect(await editor.OSI).toBeVisible();
                    await expect(await editor.tags).toBeVisible();
                    await editor.OSIButton.click();
                    await ost.backButton.click();
                    await page.waitForTimeout(2000);
                    await expect(await ost.searchField).toBeVisible();
                    await ost.searchField.fill(data.osi);
                    await (await ost.nextButton).click();
                    await expect(ost.priceUse).toBeVisible();
                    await ost.priceUse.click();
                    await page.waitForTimeout(400);
                    await expect(await editor.OSI).toContainText(data.osi);
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(data.osiTags.offerType));
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(data.osiTags.marketSegment));
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(data.osiTags.planType));
                    await editor.overrideRestoreIn(editor.OSIFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.OSI).toContainText(original.osi);
                    await editor.overrideRestoreIn(editor.tagsFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(original.osiTags.offerType));
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(original.osiTags.marketSegment));
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(original.osiTags.planType));
                }),
        ];

        await test.step('step-3: Run all field steps in serial', async () => {
            for (const run of fieldStepFns) {
                await run();
            }
        });
    });
});
