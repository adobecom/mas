import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import AHTryBuyWidgetSpec from '../specs/try_buy_widget_edit.spec.js';
import AHTryBuyWidgetPage from '../try-buy-widget.page.js';
import OSTPage from '../../../ost.page.js';

const { features } = AHTryBuyWidgetSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let trybuywidget;
let ost;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    trybuywidget = new AHTryBuyWidgetPage(page);
    ost = new OSTPage(page);
});

test.describe('M@S Studio AHome Try Buy Widget card test suite', () => {
    // @studio-try-buy-widget-editor - Validate editor fields for try buy widget card in mas studio
    test.skip(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
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
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBorderColor),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundColor),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toBeVisible();
        });
    });
});
