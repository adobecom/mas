import { test, expect, studio, editor, pro, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import ACOMProSpec from '../specs/pro_edit_and_discard.spec.js';

const { features } = ACOMProSpec;

test.describe('M@S Studio ACOM Pro card test suite', () => {
    // @studio-pro-edit-discard-editor-fields - Validate editor fields rendering for pro card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const proCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await proCard).toBeVisible();
            await expect(await proCard).toHaveAttribute('variant', 'pro');
        });

        await test.step('step-2: Validate editor fields rendering', async () => {
            await expect(await editor.variant).toHaveAttribute('value', 'pro');
            await expect(await editor.title).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicFieldGroup).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncluded).toBeVisible();
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await expect(await editor.callout).toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-3: Validate card rendering', async () => {
            // Content-independent elements only — the whats-included toggle and
            // license zone render conditionally based on authored content.
            await expect(await proCard.locator(pro.cardTitle)).toBeVisible();
            await expect(await proCard.locator(pro.cardDescription)).toBeVisible();
            await expect(await proCard.locator(pro.cardPrice)).toBeVisible();
            await expect(await proCard.locator(pro.cardTopCard)).toBeVisible();
        });
    });

    // @studio-pro-edit-discard-title - Validate edit title for pro card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const proCard = await studio.getCard(data.cardid);
        let originalTitle;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await proCard).toBeVisible();
            await expect(await proCard).toHaveAttribute('variant', 'pro');
            originalTitle = await proCard.locator(pro.cardTitle).textContent();
        });

        await test.step('step-2: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.title.updated);
        });

        await test.step('step-3: Validate title field updated', async () => {
            await expect(await editor.title).toContainText(data.title.updated);
            await expect(await proCard.locator(pro.cardTitle)).toHaveText(data.title.updated);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Validate title field not updated', async () => {
            await expect(await proCard.locator(pro.cardTitle)).toHaveText(originalTitle);
        });
    });

    // @studio-pro-edit-discard-description - Validate edit description for pro card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const proCard = await studio.getCard(data.cardid);
        let originalDescription;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await proCard).toBeVisible();
            await expect(await proCard).toHaveAttribute('variant', 'pro');
            originalDescription = await proCard.locator(pro.cardDescription).textContent();
        });

        await test.step('step-2: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.description.updated);
        });

        await test.step('step-3: Validate description field updated', async () => {
            await expect(await editor.description).toContainText(data.description.updated);
            await expect(await proCard.locator(pro.cardDescription)).toContainText(data.description.updated);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Validate description field not updated', async () => {
            await expect(await proCard.locator(pro.cardDescription)).toContainText(originalDescription.trim());
        });
    });

    // @studio-pro-edit-discard-whats-included-label - Validate edit whats included toggle label for pro card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const proCard = await studio.getCard(data.cardid);
        let originalLabel;

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await proCard).toBeVisible();
            await expect(await proCard).toHaveAttribute('variant', 'pro');
            originalLabel = await proCard.locator(pro.cardWhatsIncludedToggleLabel).textContent();
        });

        await test.step('step-2: Edit whats included label field', async () => {
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await editor.whatsIncludedLabel.fill(data.whatsIncluded.label);
        });

        await test.step('step-3: Validate whats included toggle label updated on the card', async () => {
            await expect(await editor.whatsIncludedLabel).toHaveValue(data.whatsIncluded.label);
            await expect(await proCard.locator(pro.cardWhatsIncludedToggleLabel)).toHaveText(data.whatsIncluded.label);
        });

        // Discard immediately after the edit (mirrors the title/description
        // tests). The expand/collapse behaviour of the toggle is covered by the
        // CSS test; interacting with the card preview between the edit and the
        // discard intermittently clears the editor's unsaved-changes state, so
        // it is deliberately kept out of this discard flow.
        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Validate whats included toggle label not updated', async () => {
            await expect(await proCard.locator(pro.cardWhatsIncludedToggleLabel)).toHaveText(originalLabel.trim());
        });
    });
});
