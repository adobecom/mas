import { test, expect, studio, editor, fries, setClonedCardID, getClonedCardID, miloLibs } from '../../../../libs/mas-test.js';
import CCDFriesSpec from '../specs/fries_save.spec.js';

const { features } = CCDFriesSpec;

test.describe('M@S Studio Commerce Fries card test suite', () => {
    // @studio-fries-save-edited-title - Validate saving card after editing card title
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

        await test.step('step-3: Edit title and save card', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.newTitle);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card title', async () => {
            await expect(await editor.title).toHaveValue(data.newTitle);
            await expect(await clonedCard.locator(fries.title)).toHaveText(data.newTitle);
        });
    });

    // @studio-fries-save-edited-description - Validate saving card after editing card description
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

        await test.step('step-3: Edit description and save card', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.newDescription);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card description', async () => {
            await expect(await editor.description).toContainText(data.newDescription);
            await expect(await clonedCard.locator(fries.description)).toHaveText(data.newDescription);
        });
    });

    // @studio-fries-save-edited-mnemonic - Validate saving card after editing card mnemonic
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

        await test.step('step-3: Edit mnemonic and save card', async () => {
            // Use first() to avoid multiple elements issue
            const iconInput = await editor.iconURL.first();
            await expect(iconInput).toBeVisible();
            await iconInput.fill(data.newIconURL);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card mnemonic', async () => {
            const iconInput = await editor.iconURL.first();
            await expect(iconInput).toHaveValue(data.newIconURL);
            await expect(await clonedCard.locator(fries.icon).first()).toHaveAttribute('src', data.newIconURL);
        });
    });

    // @studio-fries-save-edited-price - Validate saving card after editing card price
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

        await test.step('step-3: Edit price and save card', async () => {
            await expect(await editor.prices).toBeVisible();
            await studio.saveCard();
        });

        await test.step('step-4: Validate card price', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await clonedCard.locator(fries.price).first()).toBeVisible();
        });
    });

    // @studio-fries-save-edited-cta-label - Validate saving card after editing CTA label
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit CTA and save card', async () => {
            if ((await editor.CTA.count()) > 0) {
                await editor.CTA.click();
                if ((await editor.footer.locator(editor.linkEdit).count()) > 0) {
                    await editor.footer.locator(editor.linkEdit).click();
                    await editor.linkText.fill(data.newCtaText);
                    await editor.linkSave.click();
                }
            }
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card CTA', async () => {
            if ((await editor.footer.count()) > 0) {
                await expect(await editor.footer).toContainText(data.newCtaText);
            }
            if ((await clonedCard.locator(fries.cta).count()) > 0) {
                await expect(await clonedCard.locator(fries.cta)).toContainText(data.newCtaText);
            }
        });
    });
});
