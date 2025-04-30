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
    test(`${features[1].name},${features[1].tags}`, async ({
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
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await expect(page).toHaveURL(`${testPage}&page=content&path=nala`);
            expect(await studio.folderPicker).toHaveAttribute('value', 'nala');
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
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
        });
    });

    // @studio-empty-card - Validate empty/broken cards are not previewed
    test(`${features[3].name},${features[3].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate empty card is not displayed', async () => {
            await expect(await studio.renderView).toBeVisible();
            const emptyCard = await studio.getCard(data.cardid, 'empty');
            await expect(
                await studio.getCard(data.cardid, 'empty'),
            ).not.toBeVisible();
        });
    });

    // @studio-goto-content - Validate Go to Content
    test(`${features[4].name},${features[4].tags}`, async ({
        page,
        baseURL,
    }) => {
        const testPage = `${baseURL}${features[4].path}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Go to content', async () => {
            await expect(await studio.quickActions).toBeVisible();
            await expect(await studio.gotoContent).toBeVisible();
            await expect(await studio.folderPicker).toHaveAttribute(
                'value',
                'acom',
            );
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
    test(`${features[5].name},${features[5].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ccd-suggested',
            );
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
            await expect(await editor.showStockCheckbox).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-ccd-slice-editor - Validate editor fields for slice card in mas studio
    test(`${features[6].name},${features[6].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.authorPath).toBeVisible();
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ccd-slice',
            );
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
            await expect(await editor.showStockCheckbox).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-try-buy-widget-editor - Validate editor fields for try buy widget card in mas studio
    test(`${features[7].name},${features[7].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ah-try-buy-widget',
            );
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
    test(`${features[8].name},${features[8].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate double-click message', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).click();
            await expect(page.locator('sp-tooltip')).toHaveText(
                'Double click the card to start editing.',
            );
        });
    });

    // @studio-plans-individuals-editor - Validate editor fields for plans individuals card in mas studio
    test(`${features[9].name},${features[9].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'plans',
            );
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
            await expect(await editor.showStockCheckbox).toBeVisible();
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-promoted-plans-editor - Validate editor fields for promoted plans card
    test(`${features[10].name},${features[10].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ah-promoted-plans'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ah-promoted-plans');
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBorderColor),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toBeVisible();
        });
    });

    // @studio-promoted-plans-gradient-border - Validate gradient border for promoted plans card
    test(`${features[11].name},${features[11].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor and set gradient border', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ah-promoted-plans'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();

            await expect(
                await studio.editorPanel.locator(studio.editorBorderColor),
            ).toBeVisible();

            await studio.editorPanel.locator(studio.editorBorderColor).click();
            await page
                .getByRole('option', { name: data.gradientBorderColor })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate gradient border applied to card', async () => {
            const borderColor = await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).getAttribute('border-color');

            expect(borderColor).toBe(data.gradientBorderCSSColor);
            await expect(
                await studio.getCard(data.cardid, 'ah-promoted-plans-gradient'),
            ).toBeVisible();
        });
    });

    // @studio-promoted-plans-acrobat-card - Validate Acrobat promoted plans card
    test(`${features[12].name},${features[12].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate Acrobat card properties', async () => {
            const card = await studio.getCard(data.cardid, 'ah-promoted-plans');
            await expect(card).toBeVisible();

            // Verify icon
            const iconElement = card.locator('merch-icon[slot="icons"]');
            await expect(iconElement).toHaveAttribute('src', data.iconURL);

            // Verify border color
            await expect(card).toHaveAttribute(
                'border-color',
                data.borderColor,
            );
        });
    });
});
