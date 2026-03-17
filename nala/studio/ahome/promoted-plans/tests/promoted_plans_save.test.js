import {
    test,
    expect,
    studio,
    editor,
    promotedplans,
    setClonedCardID,
    getClonedCardID,
    miloLibs,
    setTestPage,
} from '../../../../libs/mas-test.js';
import AHPromotedPlansSpec from '../specs/promoted_plans_save.spec.js';

const { features } = AHPromotedPlansSpec;

test.describe('M@S Studio AHome Promoted Plans Save test suite', () => {
    // @studio-promoted-plans-save-edited-border - Validate saving card after editing border
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

        await test.step('step-3: Change to Transparent border', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.scrollIntoViewIfNeeded();
            await editor.borderColor.click();
            await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.border.updated.color }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Verify border change is saved', async () => {
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('border-color', data.border.updated.cssColor);
            await expect(await editor.borderColor).toContainText(data.border.updated.color);
        });
    });
});
