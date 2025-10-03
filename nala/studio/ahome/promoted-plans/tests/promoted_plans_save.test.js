import {
    test,
    expect,
    studio,
    editor,
    promotedplans,
    setClonedCardID,
    getClonedCardID,
    miloLibs,
} from '../../../../libs/mas-test.js';
import AHPromotedPlansSpec from '../specs/promoted_plans_save.spec.js';

const { features } = AHPromotedPlansSpec;

test.describe('M@S Studio AHome Promoted Plans Save test suite', () => {
    // @studio-promoted-plans-save-edited-border - Validate saving card after editing border
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
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
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Change to Transparent border', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.click();
            await page.getByRole('option', { name: data.border.updated.color }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Verify border change is saved', async () => {
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('border-color', data.border.updated.cssColor);
            await expect(await editor.borderColor).toContainText(data.border.updated.color);
        });
    });

    // @studio-promoted-plans-save-variant-change - Validate saving card after variant change
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
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
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Verify variant change is saved', async () => {
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.clonedCardID)).not.toHaveAttribute('variant', 'ah-promoted-plans');
        });
    });

    // @studio-promoted-plans-save-edited-cta-variant - Validate saving CTA variant changes
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
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
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit CTA variant and save card', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA.nth(2)).toBeVisible();
            await expect(await editor.CTA.nth(2)).toHaveClass(data.variant.original);
            await editor.CTA.nth(2).click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.getLinkVariant(data.variant.updated)).toBeVisible();
            await (await editor.getLinkVariant(data.variant.updated)).click();
            await editor.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate CTA variant change', async () => {
            await expect(await editor.CTA.nth(2)).toHaveClass(data.variant.updated);
            await expect(await editor.CTA.nth(2)).not.toHaveClass(data.variant.original);
            await expect(await clonedCard.locator(promotedplans.buyNowButton)).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await clonedCard.locator(promotedplans.buyNowButton)).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-promoted-plans-save-edited-analytics-ids - Validate saving card after editing analytics IDs
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
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
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit analytics IDs and save card', async () => {
            await expect(await editor.CTA.nth(2)).toBeVisible();
            await editor.CTA.nth(2).click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.analyticsId).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await editor.analyticsId.click();
            await page.getByRole('option', { name: data.analyticsID.updated }).click();
            await editor.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited analytics IDs are saved', async () => {
            await expect(await clonedCard.locator(promotedplans.cardCTA.nth(1))).toHaveAttribute(
                'data-analytics-id',
                data.analyticsID.updated,
            );
            // await expect(await clonedCard.locator(promotedplans.cardCTA.nth(1))).toHaveAttribute(
            //     'daa-ll',
            //     data.daaLL.updated
            // );
            await expect(await clonedCard).toHaveAttribute('daa-lh', data.daaLH);
        });
    });
});
