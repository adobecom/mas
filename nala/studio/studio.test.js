import { expect, test } from '@playwright/test';
import StudioSpec from './studio.spec.js';
import StudioPage from './studio.page.js';
import EditorPage from './editor.page.js';

const { features } = StudioSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    editor = new EditorPage(page);
});

test.describe('M@S Studio feature test suite', () => {
    // @studio-load - Validate studio Welcome page is loaded
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
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
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        const expectedUrl = `${baseURL}${features[1].path}${miloLibs}#page=content&path=nala&query=${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search results', async () => {
            await expect(await studio.renderView).toBeVisible();

            const cards = await studio.renderView.locator('merch-card');
            expect(await cards.count()).toBe(1);
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(page).toHaveURL(expectedUrl);
            expect(await studio.folderPicker).toHaveAttribute('value', 'nala');
        });
    });

    // @studio-search-field - Validate search field in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
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
            const searchResult = await studio.renderView.locator('merch-card');
            expect(await searchResult.count()).toBe(1);
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
        });
    });

    // @studio-empty-card - Validate empty/broken cards are not previewed
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate empty card is not displayed', async () => {
            await expect(await studio.renderView).toBeVisible();
            await expect(await studio.emptyCard).not.toBeVisible();
        });
    });

    // @studio-goto-content - Validate Go to Content
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[4].path}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Go to content', async () => {
            await expect(await studio.quickActions).toBeVisible();
            await expect(await studio.gotoContent).toBeVisible();
            await expect(await studio.folderPicker).toHaveAttribute('value', 'acom');
            await studio.gotoContent.click();
        });

        await test.step('step-3: Validate page view', async () => {
            await expect(await studio.renderView).toBeVisible();
            const cards = await studio.renderView.locator('merch-card');
            expect(await cards.count()).toBeGreaterThan(1);
            await expect(page).toHaveURL(`${testPage}#page=content&path=acom`);
            expect(await studio.folderPicker).toHaveAttribute('value', 'acom');
        });
    });

    // @studio-ccd-suggested-editor - Validate editor fields for CCD suggested card in mas studio
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-suggested');
            await expect(await editor.size).not.toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.badgeColor).not.toBeVisible();
            await expect(await editor.badgeBorderColor).not.toBeVisible();
            await expect(await editor.cardBorderColor).not.toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showAddOn).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-ccd-slice-editor - Validate editor fields for slice card in mas studio
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'wide');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.authorPath).toBeVisible();
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-slice');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).not.toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).not.toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.badgeColor).not.toBeVisible();
            await expect(await editor.badgeBorderColor).not.toBeVisible();
            await expect(await editor.cardBorderColor).not.toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showAddOn).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-try-buy-widget-editor - Validate editor fields for try buy widget card in mas studio
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'triple');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-card-dblclick-info - Validate message for double-click on the card in mas studio
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate double-click message', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await (await studio.getCard(data.cardid)).click();
            await expect(page.locator('sp-tooltip')).toHaveText('Double click the card to start editing.');
        });
    });

    // @studio-plans-individuals-editor - Validate editor fields for plans individuals card in mas studio
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'plans');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.badgeColor).toBeVisible();
            await expect(await editor.badgeBorderColor).toBeVisible();
            await expect(await editor.cardBorderColor).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).not.toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await expect(await editor.promoText).toBeVisible();
            await expect(await editor.callout).toBeVisible();
            await expect(await editor.showAddOn).toBeVisible();
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-promoted-plans-editor - Validate editor fields for promoted plans card
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-promoted-plans');
            await expect(await editor.title).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });
    });
});
