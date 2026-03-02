import {
    test,
    expect,
    studio,
    editor,
    plans,
    slice,
    suggested,
    trybuywidget,
    ost,
    webUtil,
    miloLibs,
    setTestPage,
} from '../../../../../libs/mas-test.js';
import ACOMPlansIndividualsSpec from '../specs/education_edit_and_discard.spec.js';

const { features } = ACOMPlansIndividualsSpec;

test.describe('M@S Studio ACOM Plans Individuals card test suite', () => {
    /// move this to education and make this one UTP promo
    // // @studio-plans-individuals-phone-number - Validate phone number for plans individuals card in mas studio
    // test(`${features[18].name},${features[18].tags}`, async ({ page, baseURL }) => {
    //     const { data } = features[18];
    //     const testPage = `${baseURL}${features[18].path}${miloLibs}${features[18].browserParams}${data.cardid}`;
    //     setTestPage(testPage);
    //     await test.step('step-1: Go to MAS Studio test page', async () => {
    //         await page.goto(testPage);
    //         await page.waitForLoadState('domcontentloaded');
    //     });
    //     await test.step('step-2: Open card editor', async () => {
    //         await expect(await studio.getCard(data.cardid)).toBeVisible();
    //         await (await studio.getCard(data.cardid)).dblclick();
    //         await expect(await editor.panel).toBeVisible();
    //         await expect(await studio.getCard(data.cardid)).toBeVisible();
    //     });
    //     await test.step('step-3: Add phone link to the description', async () => {
    //         await expect(await editor.descriptionFieldGroup.locator(editor.linkEdit)).toBeVisible();
    //         await editor.descriptionFieldGroup.locator(editor.linkEdit).click();
    //         await expect(editor.phoneLinkTab).toBeVisible();
    //         await editor.phoneLinkTab.click();
    //         await expect(await editor.phoneLinkText).toBeVisible();
    //         await expect(await editor.linkSave).toBeVisible();
    //         await editor.phoneLinkText.fill(data.phoneNumber);
    //         await editor.linkSave.click();
    //     });
    //     await test.step('step-4: Validate phone link addition in Editor panel', async () => {
    //         await expect(await editor.description.locator(editor.phoneLink)).toHaveText(data.phoneNumber);
    //     });
    //     await test.step('step-5: Validate phone link addition on the card', async () => {
    //         await expect(await plans.cardPhoneLink).toHaveText(data.phoneNumber);
    //     });
    //     await test.step('step-6: Close the editor and verify discard is triggered', async () => {
    //         await studio.discardEditorChanges(editor);
    //     });
    //     await test.step('step-7: Verify no phone number is added to the card', async () => {
    //         await expect(await plans.cardPhoneLink).not.toBeVisible();
    //     });
    // });
});
