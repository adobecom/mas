/**
 * MAS Studio — soft-bundle authoring from every OST-enabled RTE field.
 *
 * Every RTE field in the merch-card editor (Title, Product price, Promo Text,
 * Description, Callout, CTAs) exposes the OST toolbar cart
 * button, and its "Use" routes through the same onPlaceholderSelect path. This
 * suite opens the OST from each field, authors a Soft Bundle (2 offers), clicks
 * Use, and asserts a comma-joined data-wcs-osi inline-price lands in that field
 * without the market_segments crash (MWPW-200982).
 *
 * Requires the dedicated fr_FR OST fragment and a healthy NALA Studio env.
 * Run: npm run nala -- --grep @ost-bundle-rte-fields
 */
import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import OSTNewPage from '../ost-new.page.js';
import OSTSpec, { OST_FR_FRAGMENT } from '../specs/ost_bundle_rte_fields.spec.js';

const { features } = OSTSpec;

const editorUrl = (baseURL, feature, fragmentId) => {
    const libs = miloLibs ? `&${miloLibs.replace(/^[?&]/, '')}` : '';
    return `${baseURL}${feature.path}?ost=new${libs}#locale=fr_FR&page=fragment-editor&path=nala&fragmentId=${fragmentId}`;
};

const openEditor = async (page, baseURL, feature, fragmentId) => {
    const testPage = editorUrl(baseURL, feature, fragmentId);
    setTestPage(testPage);
    await page.goto(testPage);
    await page.waitForLoadState('domcontentloaded');
    await expect(await editor.panel).toBeVisible();
    await expect(await studio.getCard(fragmentId)).toBeVisible();
};

// The cart button lives inside each rte-field's shadow root. Scope it to the
// field's sp-field-group so we open the OST from the field under test, then
// clear the deep-link landing so the authoring-mode picker is reachable.
const openOSTFromField = async (page, fieldGroup) => {
    const ost = new OSTNewPage(page);
    const group = editor.panel.locator(`sp-field-group#${fieldGroup}`);
    await group.scrollIntoViewIfNeeded();
    await group.locator('#offerSelectorToolButton').click();
    await expect(await ost.popup).toBeVisible();
    if (await ost.backButton.isVisible()) {
        await ost.backButton.click();
        await expect(await ost.searchField).toBeVisible();
    }
    return ost;
};

test.describe('M@S Studio OST soft bundle across RTE fields', () => {
    features.forEach((feature) => {
        test(`${feature.name},${feature.tags}`, async ({ page, baseURL }) => {
            const pageErrors = [];
            page.on('pageerror', (err) => pageErrors.push(err.message));

            await openEditor(page, baseURL, feature, OST_FR_FRAGMENT);
            const ost = await openOSTFromField(page, feature.data.fieldGroup);

            await test.step('step-1: Soft Bundle mode advances to the offer step', async () => {
                await expect(await ost.authoringMode).toBeVisible();
                await ost.authoringMode.click();
                await ost.authoringModeBundle.click();
                await expect(await ost.nextButton).toBeEnabled();
                await ost.nextButton.click();
                await expect(await ost.backButton).toBeVisible();
            });

            await test.step('step-2: Select two offers to form a bundle', async () => {
                await ost.offerCard.nth(0).click();
                await ost.offerCard.nth(1).click();
                await expect(await ost.footerUseButton).toBeEnabled();
            });

            await test.step('step-3: Use inserts a comma-joined-OSI price into the field', async () => {
                await ost.footerUseButton.click();
                await expect(await ost.popup).not.toBeVisible();
                const inserted = editor.panel
                    .locator(`sp-field-group#${feature.data.fieldGroup} span[is="inline-price"][data-wcs-osi*=","]`)
                    .first();
                await expect(inserted).toBeVisible();
            });

            await test.step('step-4: No market_segments crash during Use', async () => {
                const crash = pageErrors.find((m) => /reading '0'|market_segments/.test(m));
                expect(crash, `Unexpected page error: ${crash}`).toBeUndefined();
            });
        });
    });
});
