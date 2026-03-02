import { test, expect, studio, editor, individuals, ost, webUtil, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import VariationsSpec from '../specs/variations.spec.js';

const { features } = VariationsSpec;

test.describe('M@S Studio - Variations Page test suite', () => {
    // @studio-create-variation-editor - Validate creating a variation from editor
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.editorPanel).toBeVisible();
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
            await expect(editor.derivedFromContainer).toBeVisible();
            await expect(editor.derivedFromContainer).toContainText('Derived from');
            await expect(editor.derivedFromContainer).toContainText('View fragment');
            await expect(editor.derivedFromContainer).toContainText(': Default US (EN)');
        });

        await test.step('step-5: Verify price in editor', async () => {
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

        await test.step('step-7: Verify variation is visible in the content page', async () => {
            await expect(studio.fragmentsTable).toBeVisible();
            await studio.fragmentsTable.scrollIntoViewIfNeeded();
            await studio.fragmentsTable.click();
            await page.waitForTimeout(2000);
            await expect(await studio.getCard(clonedFragmentId)).toBeVisible();
            await studio.switchToTableView();
            await expect(await studio.tableViewFragmentTable(clonedFragmentId)).toBeVisible();
            await studio.tableViewFragmentTable(clonedFragmentId).locator('button.expand-button').click();
            await expect(await studio.tableViewFragmentTable(variationId)).toBeVisible();
            await expect(await studio.tableViewPriceCell(studio.tableViewRowByFragmentId(variationId))).toBeVisible();
            expect(await (await studio.tableViewPriceCell(studio.tableViewRowByFragmentId(variationId))).textContent()).toMatch(
                data.priceUS, // change to data.price once MWPW-187797 is fixed
            );
        });
    });

    // @studio-create-variation-table-view - Validate creating a variation from table view
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.editorPanel).toBeVisible();
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
            await studio.switchToTableView();
            await expect(await studio.tableView).toBeVisible();
            await expect(await studio.tableViewFragmentTable(clonedFragmentId)).toBeVisible();
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
            await expect(editor.derivedFromContainer).toBeVisible();
            await expect(editor.derivedFromContainer).toContainText('Derived from');
            await expect(editor.derivedFromContainer).toContainText('View fragment');
            await expect(editor.derivedFromContainer).toContainText(': Default US (EN)');
        });

        await test.step('step-5: Verify price in editor', async () => {
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
            await expect(editor.derivedFromContainer).toBeVisible();
            await expect(editor.derivedFromContainer).toContainText('Derived from');
            await expect(editor.derivedFromContainer).toContainText('View fragment');
            await expect(editor.derivedFromContainer).toContainText(': Default US (EN)');
        });

        await test.step('step-5: Verify price in editor', async () => {
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
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.editorPanel).toBeVisible();
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
            await expect(editor.derivedFromContainer).toBeVisible();
            await expect(editor.derivedFromContainer).toContainText('Derived from');
            await expect(editor.derivedFromContainer).toContainText('View fragment');
            await expect(editor.derivedFromContainer).toContainText(': Default US (EN)');
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
        });

        await test.step('step-5: Delete variation', async () => {
            await studio.deleteCard(variationId);
        });

        await test.step('step-6: Verify variation is deleted', async () => {
            await expect(await editor.panel).not.toBeVisible();
            await expect(await studio.getCard(clonedFragmentId)).toBeVisible();
            await studio.switchToTableView();
            await expect(await studio.tableViewFragmentTable(clonedFragmentId)).toBeVisible();
            await studio.tableViewFragmentTable(clonedFragmentId).locator('button.expand-button').click();
            await expect(await studio.tableViewFragmentTable(variationId)).not.toBeVisible();
        });
    });

    // @studio-variation-locales-US - Validate variation locales in US
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Open create variation dialog and verify locales', async () => {
            await page.waitForLoadState('networkidle').catch(() => {});
            await page.waitForTimeout(500);

            await expect(await studio.createVariationButton).toBeVisible({ timeout: 10000 });
            await expect(await studio.createVariationButton).toBeEnabled({ timeout: 15000 });

            await studio.createVariationButton.scrollIntoViewIfNeeded();
            await studio.page.waitForTimeout(500);

            await studio.createVariationButton.hover({ timeout: 5000 });
            await studio.page.waitForTimeout(300);

            await studio.createVariationButton.click({ timeout: 5000 });

            await expect(await studio.variationDialog).toBeVisible();
            await page.waitForTimeout(500);

            await expect(await studio.variationDialogLocalePicker).toBeVisible();
            await studio.variationDialogLocalePicker.click();
            await page.waitForTimeout(500);

            const localeOptionGB = await studio.variationDialogLocalePicker
                .locator('sp-menu-item', { hasText: data.locales.en_GB })
                .first();
            const localeOptionAU = await studio.variationDialogLocalePicker
                .locator('sp-menu-item', { hasText: data.locales.en_AU })
                .first();
            const localeOptionIN = await studio.variationDialogLocalePicker
                .locator('sp-menu-item', { hasText: data.locales.en_IN })
                .first();
            await expect(await localeOptionGB).not.toBeVisible();
            await expect(await localeOptionAU).not.toBeVisible();
            await expect(await localeOptionIN).not.toBeVisible();
        });
    });

    // @studio-variation-locales-GB - Validate variation locales in GB (only AU and IN)
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Open create variation dialog and verify only AU and IN locales', async () => {
            await studio.page.waitForLoadState('networkidle').catch(() => {});
            await studio.page.waitForTimeout(500);

            await expect(await studio.createVariationButton).toBeVisible({ timeout: 10000 });
            await expect(await studio.createVariationButton).toBeEnabled({ timeout: 15000 });

            await studio.createVariationButton.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);

            await studio.createVariationButton.hover({ timeout: 5000 });
            await page.waitForTimeout(300);

            await studio.createVariationButton.click({ timeout: 5000 });

            await expect(await studio.variationDialog).toBeVisible();
            await page.waitForTimeout(500);

            await expect(await studio.variationDialogLocalePicker).toBeVisible();
            await studio.variationDialogLocalePicker.click();
            await page.waitForTimeout(500);

            const localeMenuItems = await studio.variationDialogLocalePicker.locator('sp-menu-item');
            await expect(await localeMenuItems).toHaveCount(2);

            const localeOptionAU = await studio.variationDialogLocalePicker
                .locator('sp-menu-item', {
                    hasText: data.locales.en_AU,
                })
                .first();
            const localeOptionIN = await studio.variationDialogLocalePicker
                .locator('sp-menu-item', {
                    hasText: data.locales.en_IN,
                })
                .first();
            await expect(await localeOptionAU).toBeVisible();
            await expect(await localeOptionIN).toBeVisible();
        });
    });

    // @studio-variation-override-restore - Per-field steps (edit → verify preview → click restore → verify original), run in serial
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const { original } = data;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.editorPanel).toBeVisible();
            await expect(editor.derivedFromContainer).toBeVisible();
            await expect(editor.derivedFromContainer).toContainText('Derived from');
            await expect(editor.derivedFromContainer).toContainText('View fragment');
            await expect(editor.derivedFromContainer).toContainText(': Default US (EN)');
        });

        const fieldStepFns = [
            () =>
                test.step('field: title — edit, verify preview, click restore, verify original', async () => {
                    await expect(await editor.title).toBeVisible();
                    await editor.title.fill(data.title);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(individuals.cardTitle)).toHaveText(data.title);
                    await editor.overrideRestoreIn(editor.cardTitleFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.title).toContainText(original.title);
                    await expect((await studio.getCard(data.cardid)).locator(individuals.cardTitle)).toHaveText(original.title);
                }),
            () =>
                test.step('field: badge — edit, verify preview, click restore, verify original', async () => {
                    // add check that other badge fields are not marked as override when MWPW-188853 is fixed
                    await editor.badge.fill(data.badge);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(individuals.cardBadge)).toHaveText(data.badge);
                    await editor.overrideRestoreIn(editor.cardBadgeFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.badge).toHaveValue(original.badge);
                    await expect((await studio.getCard(data.cardid)).locator(individuals.cardBadge)).toHaveText(original.badge);
                }),
            () =>
                test.step('field: description — edit, verify preview, click restore, verify original', async () => {
                    await editor.description.fill(data.description);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(individuals.cardDescription)).toHaveText(data.description);
                    await editor.overrideRestoreIn(editor.descriptionFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.description).toContainText(original.description);
                    await expect((await studio.getCard(data.cardid)).locator(individuals.cardDescription)).toContainText(
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
                    await expect(await card.locator(individuals.cardIcon)).toHaveAttribute('src', data.iconURL);
                    await editor.overrideRestoreIn(editor.mnemonicFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await editor.openMnemonicModal();
                    await editor.mnemonicUrlTab.click();
                    await expect(await editor.iconURL).toHaveValue(original.iconURL);
                    await editor.cancelMnemonicModal();
                    await expect((await studio.getCard(data.cardid)).locator(individuals.cardIcon)).toHaveAttribute(
                        'src',
                        original.iconURL,
                    );
                }),
            () =>
                test.step('field: callout — edit, verify preview, click restore, verify original', async () => {
                    await editor.calloutRTE.fill(data.callout);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(individuals.cardCallout)).toHaveText(data.callout);
                    await editor.overrideRestoreIn(editor.calloutFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.calloutRTE).toContainText(original.callout);
                    await expect((await studio.getCard(data.cardid)).locator(individuals.cardCallout)).not.toBeVisible();
                }),
            () =>
                test.step('field: promo text — edit, verify preview, click restore, verify original', async () => {
                    await editor.promoText.fill(data.promoText);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(individuals.cardPromoText)).toHaveText(data.promoText);
                    await editor.overrideRestoreIn(editor.promoTextFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.promoText).toHaveValue(original.promoText);
                    await expect((await studio.getCard(data.cardid)).locator(individuals.cardPromoText)).not.toBeVisible();
                }),
            () =>
                test.step('field: whats included — edit, verify preview, click restore, verify original', async () => {
                    await editor.whatsIncludedLabel.fill(data.whatsIncludedText);
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    await expect(await card.locator(individuals.cardWhatsIncluded)).toHaveText(data.whatsIncludedText);
                    await editor.overrideRestoreIn(editor.whatsIncludedFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.whatsIncludedLabel).toHaveValue(original.whatsIncludedText);
                    await expect((await studio.getCard(data.cardid)).locator(individuals.cardWhatsIncluded)).not.toBeVisible();
                }),
            () =>
                test.step('field: badge color — edit, verify preview, click restore, verify original', async () => {
                    // add check that other badge fields are not marked as override when MWPW-188853 is fixed
                    await editor.badgeColor.scrollIntoViewIfNeeded();
                    await editor.badgeColor.click();
                    await page.getByRole('option', { name: data.badgeColor.name, exact: true }).click();
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    expect(
                        await webUtil.verifyCSS(card.locator(individuals.cardBadge), {
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
                    await editor.badgeBorderColor.scrollIntoViewIfNeeded();
                    await editor.badgeBorderColor.click();
                    await page.getByRole('option', { name: data.badgeBorderColor.name, exact: true }).click();
                    await page.waitForTimeout(400);
                    const card = await studio.getCard(data.cardid);
                    expect(
                        await webUtil.verifyCSS(card.locator(individuals.cardBadge), {
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
                    await editor.borderColor.scrollIntoViewIfNeeded();
                    await editor.borderColor.click();
                    await page.getByRole('option', { name: data.borderColor.name, exact: true }).click();
                    await page.waitForTimeout(400);
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
                    const cardUnitType = await card.locator(individuals.cardPriceLegal).locator('.price-unit-type');
                    await expect(cardUnitType).not.toHaveClass(/disabled/);
                    await editor.overrideRestoreIn(editor.pricesFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.prices).toContainText(original.price);
                    await expect(await editor.prices.locator('.price-unit-type')).toHaveClass(/disabled/);
                    const cardAfter = await studio.getCard(data.cardid);
                    await expect(cardAfter.locator(individuals.cardPrice)).toContainText(original.price);
                    await expect(cardAfter.locator(individuals.cardPriceLegal).locator('.price-unit-type')).toHaveClass(
                        /disabled/,
                    );
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
                    await expect(await card.locator(individuals.cardCTA)).toContainText(data.ctaLabel);
                    await editor.overrideRestoreIn(editor.ctasFieldGroup).first().click();
                    await page.waitForTimeout(300);
                    await expect(await editor.footer).toContainText(original.ctaLabel);
                    await expect((await studio.getCard(data.cardid)).locator(individuals.cardCTA)).toContainText(
                        original.ctaLabel,
                    );
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
                    await editor.overrideRestoreIn(editor.osiFieldGroup).first().click();
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

    // @studio-create-variation-GB - Validate creating a variation from GB locale
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}`;
        setTestPage(testPage);
        let newFragmentId;
        let variationId;

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
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
            await expect(editor.derivedFromContainer).toBeVisible();
            await expect(editor.derivedFromContainer).toContainText('Derived from');
            await expect(editor.derivedFromContainer).toContainText('View fragment');
            await expect(editor.derivedFromContainer).toContainText(': Default GB (EN)');
        });

        await test.step('step-5: Verify price in editor', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
        });

        await test.step('step-6: Verify price in card preview', async () => {
            const cardPreview = await studio.getCard(variationId);
            await expect(await cardPreview).toBeVisible();

            const cardPrice = cardPreview.locator(individuals.cardPrice);
            await expect(await cardPrice).toBeVisible({ timeout: 10000 });
            await expect(await cardPrice).toContainText(data.price);
        });
    });

    // @studio-variation-selfreference - Create variation, verify one reference on references URL, edit+save, verify still one reference
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedFragmentId;
        let variationId;
        const referencesUrl = (id) => `${data.referencesBaseUrl}/${id}?references=all-hydrated`;

        // Count how many times the fragment ID (e.g. UUID) appears in the page body.
        const countReferencesToId = async (fragmentId) => {
            const bodyText = await page.locator('body').textContent();
            // Escape special regex chars (e.g. -, ., (, ), etc.) so the ID is matched literally, not as regex.
            // Put a backslash in front of every character that is special in regex, meaning "find this exact ID string"
            const escapedFragmentId = fragmentId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            const matches = bodyText.match(new RegExp(escapedFragmentId, 'g'));
            return matches ? matches.length : 0;
        };

        await test.step('step-1: Go to MAS Studio fragment editor and clone', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.editorPanel).toBeVisible();
            await studio.cloneCard(data.cardid);
            const clonedCard = await studio.getCard(data.cardid, 'cloned');
            await expect(clonedCard).toBeVisible();
            clonedFragmentId = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            expect(clonedFragmentId).toBeTruthy();
        });

        await test.step('step-2: Create variation', async () => {
            variationId = await studio.createVariation(clonedFragmentId, data.locale);
            expect(variationId).toBeTruthy();
            await expect(editor.panel).toBeVisible();
        });

        await test.step('step-3: Open references URL and verify exactly one reference to variation id', async () => {
            await page.goto(referencesUrl(variationId));
            await page.waitForLoadState('domcontentloaded');
            const count = await countReferencesToId(variationId);
            expect(count).toBe(1);
        });

        await test.step('step-4: Return to editor, edit title, save', async () => {
            const editorPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${variationId}`;
            await page.goto(editorPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible({ timeout: 15000 });
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.editedTitle);
            await page.waitForTimeout(400);
            await studio.saveCard();
        });

        await test.step('step-5: Open references URL again and verify still exactly one reference', async () => {
            await page.goto(referencesUrl(variationId));
            await page.waitForLoadState('domcontentloaded');
            const count = await countReferencesToId(variationId);
            expect(count).toBe(1);
        });
    });
});
