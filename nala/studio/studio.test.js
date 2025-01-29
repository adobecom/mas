import { expect, test } from '@playwright/test';
import StudioSpec from './studio.spec.js';
import StudioPage from './studio.page.js';
import ims from '../libs/imslogin.js';

const { features } = StudioSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;

test.beforeEach(async ({ page, browserName, baseURL }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
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

test.describe('M@S Studio feature test suite', () => {
    // @studio-load - Validate studio Welcome page is loaded
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate studio load', async () => {
            await expect(await studio.quickActions).toBeVisible();
            // enable the follwoing check once loadiing this section is stable
            // await expect(await studio.recentlyUpdated).toBeVisible();
        });
    });

    // @studio-direct-search - Validate direct search feature in mas studio
    test.skip(`${features[1].name},${features[1].tags}`, async ({
        // skip the test until MWPW-165152 is fixed
        page,
        baseURL,
    }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search results', async () => {
            await expect(await studio.renderView).toBeVisible();

            const cards = await studio.renderView.locator('merch-card');
            expect(await cards.count()).toBe(1);
        });
    });

    // @studio-search-field - Validate search field in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
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

        await test.step('step-2: Validate search field rendered', async () => {
            await expect(await studio.searchInput).toBeVisible();
            await expect(await studio.searchIcon).toBeVisible();
            await expect(await studio.renderView).toBeVisible();
            const cards = await studio.renderView.locator('merch-card');
            expect(await cards.count()).toBeGreaterThan(1);
        });

        await test.step('step-3: Validate search feature', async () => {
            await studio.searchInput.fill(data.cardid);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            expect(await studio.getCard(data.cardid, 'suggested')).toBeVisible;
            const searchResult = await studio.renderView.locator('merch-card');
            expect(await searchResult.count()).toBe(1);
        });
    });

    // @studio-edit-title - Validate edit title feature in mas studio
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
            expect(await studio.getCard(data.cardid, 'suggested')).toBeVisible;
        });

        await test.step('step-2: Open card editor', async () => {
            expect(await studio.getCard(data.cardid, 'suggested')).toBeVisible;
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            expect(await studio.editorPanel).toBeVisible;
        });

        await test.step('step-3: Close card editor', async () => {
            await studio.closeEditor.click();
            expect(await studio.editorPanel).not.toBeVisible();
        });


        // await test.step('step-3: Edit title field', async () => {
        //     expect(await studio.editorPanel.title).toBeVisible;
        //     await expect(
        //         await studio.editorPanel.locator(studio.editorTitle),
        //     ).toHaveAttribute('value', `${data.title}`);
        //     await studio.editorPanel
        //         .locator(studio.editorTitle)
        //         .locator('input')
        //         .fill(data.newTitle);
        // });

        // await test.step('step-4: Validate edited title field', async () => {
        //     await expect(
        //         await studio.editorPanel.locator(studio.editorTitle),
        //     ).toHaveAttribute('value', `${data.newTitle}`);
        // });
    });

    // @studio-clone-edit-save-delete - Clone Field & Edit card, edit, save then delete
    test(`${features[4].name},${features[4].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[4];
        // uncomment the following line once MWPW-165149 is fixed and delete the line after
        // const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
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
            expect(await studio.getCard(data.cardid, 'suggested')).toBeVisible;
        });

        await test.step('step-2: Open card editor', async () => {
            expect(await studio.getCard(data.cardid, 'suggested')).toBeVisible;
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            expect(await studio.editorPanel).toBeVisible;
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard.click();
            await page.waitForTimeout(2000);
            let clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit title fields and save card', async () => {
            expect(await studio.editorPanel.title).toBeVisible;
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveAttribute('value', `${data.title}`);
            await studio.editorPanel
                .locator(studio.editorTitle)
                .locator('input')
                .fill(data.newTitle);
            await studio.editorPanel
                .locator(studio.editorSubtitle)
                .locator('input')
                .fill(data.newSubtitle);
            await studio.editorPanel
                .locator(studio.editorIconURL)
                .locator('input')
                .fill(data.newIconURL);
            await studio.editorPanel
                .locator(studio.editorDescription)
                .fill(data.newDescription);
            await studio.saveCard.click();
            await page.waitForTimeout(2000);
        });

        // await test.step(
        //     'step-5: Validate edited fields in Editor',
        //     async () => {
        //         await expect(
        //             await studio.editorPanel.locator(studio.editorTitle),
        //         ).toHaveAttribute('value', `${data.newTitle}`);
        //         await expect(
        //             await studio.editorPanel.locator(studio.editorSubtitle),
        //         ).toHaveAttribute('value', `${data.newSubtitle}`);
        //         await expect(
        //             await studio.editorPanel.locator(studio.editorIconURL),
        //         ).toHaveAttribute('value', `${data.newIconURL}`);
        //         expect(
        //             await studio.editorPanel
        //                 .locator(studio.editorDescription)
        //                 .innerText(),
        //         ).toBe(`${data.newDescription}`);
        //     },
        // );

        await test.step('step-6: Search for the cloned card and verify changes', async () => {
            await studio.searchInput.fill(data.clonedCardID);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            expect(
                await studio.getCard(data.clonedCardID, 'suggested'),
            ).toBeVisible();
        });

        await test.step('step-7: Verify applied changes in card then delete', async () => {
            expect(await studio.cardIcon.getAttribute('src')).toBe(
                data.newIconURL,
            );
            expect(await studio.suggestedCardTitle).toHaveText(data.newTitle);
            expect(await studio.suggestedCardEyebrow).toHaveText(
                data.newSubtitle,
            );
            expect(await studio.suggestedCardDescription).toHaveText(
                data.newDescription,
            );
            await studio.deleteCard.click();
            await page.waitForTimeout(3000);
            expect(
                await studio.getCard(data.clonedCardID, 'suggested'),
            ).not.toBeVisible();
        });
    });
});
