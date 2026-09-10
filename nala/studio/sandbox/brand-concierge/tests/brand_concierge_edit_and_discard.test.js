import { test, expect, studio, editor, brandConcierge, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import BrandConciergeSpec from '../specs/brand_concierge_edit_and_discard.spec.js';

const { features } = BrandConciergeSpec;

test.describe('M@S Studio Sandbox Brand Concierge Product card test suite', () => {
    // @studio-brand-concierge-edit-discard-editor-fields - Validate editor fields rendering for brand concierge product card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const card = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await card).toBeVisible();
            await expect(await card).toHaveAttribute('variant', 'brand-concierge-product');
        });

        await test.step('step-2: Validate editor fields rendering', async () => {
            await expect(await editor.variant).toHaveAttribute('value', 'brand-concierge-product');
            await expect(await editor.title).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicFieldGroup).toBeVisible();
            await expect(await editor.badgeFieldGroup).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.promoTextFieldGroup).toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });

        await test.step('step-3: Validate card rendering', async () => {
            await expect(await card.locator(brandConcierge.cardTitle)).toBeVisible();
            await expect(await card.locator(brandConcierge.cardDescription)).toBeVisible();
            await expect(await card.locator(brandConcierge.cardCTA).first()).toBeVisible();
        });
    });

    // @studio-brand-concierge-edit-discard-title - Validate edit title for brand concierge product card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const card = await studio.getCard(data.cardid);
        let originalTitle;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await card).toBeVisible();
            await expect(await card).toHaveAttribute('variant', 'brand-concierge-product');
            originalTitle = await card.locator(brandConcierge.cardTitle).textContent();
        });

        await test.step('step-2: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.title.updated);
        });

        await test.step('step-3: Validate title field updated', async () => {
            await expect(await editor.title).toContainText(data.title.updated);
            await expect(await card.locator(brandConcierge.cardTitle)).toHaveText(data.title.updated);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Validate title field not updated', async () => {
            await expect(await card.locator(brandConcierge.cardTitle)).toHaveText(originalTitle.trim());
        });
    });

    // @studio-brand-concierge-edit-discard-description - Validate edit description for brand concierge product card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const card = await studio.getCard(data.cardid);
        let originalDescription;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await card).toBeVisible();
            await expect(await card).toHaveAttribute('variant', 'brand-concierge-product');
            originalDescription = await card.locator(brandConcierge.cardDescription).textContent();
        });

        await test.step('step-2: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.description.updated);
        });

        await test.step('step-3: Validate description field updated', async () => {
            await expect(await editor.description).toContainText(data.description.updated);
            await expect(await card.locator(brandConcierge.cardDescription)).toContainText(data.description.updated);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Validate description field not updated', async () => {
            await expect(await card.locator(brandConcierge.cardDescription)).toContainText(originalDescription.trim());
        });
    });
});
