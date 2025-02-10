import { expect, test } from '@playwright/test';
import StudioPage from '../../studio.page.js';
import CCDSliceSpec from './slice.spec.js';
import CCDSlicePage from './slice.page.js';
import ims from '../../../libs/imslogin.js';

const { features } = CCDSliceSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let slice;

test.beforeEach(async ({ page, browserName, baseURL }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    slice = new CCDSlicePage(page);
    features[0].url = `${baseURL}/studio.html`;
    await page.goto(features[0].url);
    await page.waitForURL('**/auth.services.adobe.com/en_US/index.html**/');
    await ims.fillOutSignInForm(features[0], page);
    await expect(async () => {
        const response = await page.request.get(features[0].url);
        expect(response.status()).toBe(200);
    }).toPass();
    await page.waitForLoadState('domcontentloaded');
});

test.describe('M@S Studio CCD Slice card test suite', () => {
    // @studio-slice-editor - Validate editor fields for slice card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        // uncomment the following line once MWPW-165149 is fixed and delete the line after
        // const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const testPage = `${baseURL}${features[0].path}${miloLibs}${'#path=nala'}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165149 is fixed
        await test.step('step-1a: Go to MAS Studio content test page', async () => {
            await expect(await studio.gotoContent).toBeVisible();
            await studio.gotoContent.click();
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165152 is fixed
        await test.step('step-1b: Search for the card', async () => {
            await studio.searchInput.fill(data.cardid);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ccd-slice');
            expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).not.toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).not.toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).not.toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toBeVisible();
        });
    });

    // @studio-slice-edit-size - Validate edit size for slice card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[1];
        // uncomment the following line once MWPW-165149 is fixed and delete the line after
        // const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        const testPage = `${baseURL}${features[1].path}${miloLibs}${'#path=nala'}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165149 is fixed
        await test.step('step-1a: Go to MAS Studio content test page', async () => {
            await expect(await studio.gotoContent).toBeVisible();
            await studio.gotoContent.click();
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165152 is fixed
        await test.step('step-1b: Search for the card', async () => {
            await studio.searchInput.fill(data.cardid);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit size field', async () => {
            expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toHaveAttribute('value', 'wide');
            await studio.editorPanel.locator(studio.editorSize).click();
            await page.getByRole('option', { name: 'normal' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate new size of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'slice'),
            ).not.toHaveAttribute('size', 'wide');
        });

        await test.step('step-5: Edit size field back', async () => {
            await studio.editorPanel.locator(studio.editorSize).click();
            await page.getByRole('option', { name: 'wide' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate new size of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
        });
    });

    // @studio-slice-edit-badge - Validate edit badge field for slice card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        // uncomment the following line once MWPW-165149 is fixed and delete the line after
        // const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        const testPage = `${baseURL}${features[2].path}${miloLibs}${'#path=nala'}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165149 is fixed
        await test.step('step-1a: Go to MAS Studio content test page', async () => {
            await expect(await studio.gotoContent).toBeVisible();
            await studio.gotoContent.click();
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165152 is fixed
        await test.step('step-1b: Search for the card', async () => {
            await studio.searchInput.fill(data.cardid);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Remove badge field', async () => {
            expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toHaveValue(data.badge);
            await studio.editorPanel.locator(studio.editorBadge).fill('');
        });

        await test.step('step-4: Validate edited badge field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toHaveValue('');
        });

        await test.step('step-5: Validate badge is removed from the card', async () => {
            await expect(await slice.cardBadge).not.toBeVisible();
        });

        await test.step('step-6: Enter new value in the badge field', async () => {
            await studio.editorPanel
                .locator(studio.editorBadge)
                .fill(data.newBadge);
        });

        await test.step('step-4: Validate edited badge field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toHaveValue(data.newBadge);
        });

        await test.step('step-5: Validate badge new badge on the card', async () => {
            await expect(await slice.cardBadge).toBeVisible();
            await expect(await slice.cardBadge).toHaveText(data.newBadge);
        });
    });

    // @studio-slice-edit-description - Validate edit description field for slice card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[3];
        // uncomment the following line once MWPW-165149 is fixed and delete the line after
        // const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        const testPage = `${baseURL}${features[3].path}${miloLibs}${'#path=nala'}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165149 is fixed
        await test.step('step-1a: Go to MAS Studio content test page', async () => {
            await expect(await studio.gotoContent).toBeVisible();
            await studio.gotoContent.click();
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165152 is fixed
        await test.step('step-1b: Search for the card', async () => {
            await studio.searchInput.fill(data.cardid);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.description);
            await studio.editorPanel
                .locator(studio.editorDescription)
                .fill(data.newDescription);
        });

        await test.step('step-4: Validate edited background URL field in Editor panel', async () => {
            expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.newDescription);
        });

        await test.step('step-5: Validate edited background src on the card', async () => {
            await expect(await slice.cardDescription).toHaveText(
                data.newDescription,
            );
        });
    });

    // @studio-slice-edit-mnemonic - Validate edit mnemonic URL field for slice card in mas studio
    test(`${features[4].name},${features[4].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[4];
        // uncomment the following line once MWPW-165149 is fixed and delete the line after
        // const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        const testPage = `${baseURL}${features[4].path}${miloLibs}${'#path=nala'}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165149 is fixed
        await test.step('step-1a: Go to MAS Studio content test page', async () => {
            await expect(await studio.gotoContent).toBeVisible();
            await studio.gotoContent.click();
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165152 is fixed
        await test.step('step-1b: Search for the card', async () => {
            await studio.searchInput.fill(data.cardid);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.iconURL);
            await studio.editorPanel
                .locator(studio.editorIconURL)
                .fill(data.newIconURL);
        });

        await test.step('step-4: Validate edited mnemonic URL field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.newIconURL);
        });

        await test.step('step-5: Validate edited mnemonic src on the card', async () => {
            await expect(await slice.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
        });
    });

    // @studio-slice-edit-image - Validate edit background image field for slice card in mas studio
    test(`${features[5].name},${features[5].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[5];
        // uncomment the following line once MWPW-165149 is fixed and delete the line after
        // const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        const testPage = `${baseURL}${features[5].path}${miloLibs}${'#path=nala'}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165149 is fixed
        await test.step('step-1a: Go to MAS Studio content test page', async () => {
            await expect(await studio.gotoContent).toBeVisible();
            await studio.gotoContent.click();
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165152 is fixed
        await test.step('step-1b: Search for the card', async () => {
            await studio.searchInput.fill(data.cardid);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Remove background URL field', async () => {
            expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue(data.backgroundURL);
            await studio.editorPanel
                .locator(studio.editorBackgroundImage)
                .fill('');
        });

        await test.step('step-4: Validate edited background image url field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue('');
        });

        await test.step('step-5: Validate image is removed from the card', async () => {
            await expect(await slice.cardImage).not.toBeVisible();
        });

        await test.step('step-6: Enter new value in the background URL field', async () => {
            await studio.editorPanel
                .locator(studio.editorBackgroundImage)
                .fill(data.newBackgroundURL);
        });

        await test.step('step-7: Validate edited background image url field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue(data.newBackgroundURL);
        });

        await test.step('step-8: Validate new image on the card', async () => {
            await expect(await slice.cardImage).toBeVisible();
            await expect(await slice.cardImage).toHaveAttribute(
                'src',
                data.newBackgroundURL,
            );
        });
    });

    // @studio-slice-clone-edit-save-delete - Clone Field & Edit card, edit, save then delete slice card
    test(`${features[6].name},${features[6].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[6];
        // uncomment the following line once MWPW-165149 is fixed and delete the line after
        // const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        const testPage = `${baseURL}${features[6].path}${miloLibs}${'#path=nala'}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165149 is fixed
        await test.step('step-1a: Go to MAS Studio content test page', async () => {
            await expect(await studio.gotoContent).toBeVisible();
            await studio.gotoContent.click();
            await page.waitForLoadState('domcontentloaded');
        });

        // remove this step once MWPW-165152 is fixed
        await test.step('step-1b: Search for the card', async () => {
            await studio.searchInput.fill(data.cardid);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard.click();
            await expect(studio.toastPositive).toHaveText(
                'Fragment successfully copied.',
                { timeout: 10000 },
            );
            let clonedCard = await studio.getCard(
                data.cardid,
                'slice-wide',
                'cloned',
            );
            let clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit fields and save card', async () => {
            expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.description);
            await studio.editorPanel
                .locator(studio.editorBadge)
                .fill(data.newBadge);
            await studio.editorPanel.locator(studio.editorSize).click();
            await page.getByRole('option', { name: 'normal' }).click();
            await studio.editorPanel
                .locator(studio.editorIconURL)
                .fill(data.newIconURL);
            await studio.editorPanel
                .locator(studio.editorDescription)
                .fill(data.newDescription);
            await studio.saveCard.click();
            await expect(studio.toastPositive).toHaveText(
                'Fragment successfully saved.',
                { timeout: 10000 },
            );
        });

        await test.step('step-5: Validate edited fields in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toHaveValue(data.newBadge);
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.newIconURL);
            expect(
                await studio.editorPanel
                    .locator(studio.editorDescription)
                    .innerText(),
            ).toBe(data.newDescription);
        });

        await test.step('step-6: Search for the cloned card and verify changes then delete the card', async () => {
            await studio.searchInput.fill(data.clonedCardID);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            await expect(
                await studio.getCard(data.clonedCardID, 'slice'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'slice-wide'),
            ).not.toBeVisible();

            await expect(await slice.cardBadge).toHaveText(data.newBadge);
            await expect(await slice.cardDescription).toHaveText(
                data.newDescription,
            );
            await expect(await slice.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
            await studio.deleteCard.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.confirmationDialog
                .locator(studio.deleteDialog)
                .click();
            await expect(studio.toastPositive).toHaveText(
                'Fragment successfully deleted.',
                { timeout: 10000 },
            );
            await expect(
                await studio.getCard(data.clonedCardID, 'slice'),
            ).not.toBeVisible();
        });
    });
});
