import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import DiscountSpec from '../specs/discount.spec.js';

const { features } = DiscountSpec;

test.describe('M@S Studio Discount Badge test suite', () => {
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
            await expect(await card).toHaveAttribute('variant', 'plans');
        });

        await test.step('step-2: Validate discount inline-price in badge on card', async () => {
            const badge = card.locator('merch-badge');
            await expect(badge).toBeVisible();
            await expect(badge).toContainText('Save');
            const discountPrice = badge.locator('span[is="inline-price"][data-template="discount"]');
            await expect(discountPrice).toBeVisible();
        });

        await test.step('step-3: Validate badge field in editor contains discount', async () => {
            await expect(await editor.badge).toBeVisible();
            const discountInEditor = editor.badge.locator('span[is="inline-price"]');
            await expect(discountInEditor).toBeVisible();
        });
    });

    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const card = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await card).toBeVisible();
        });

        await test.step('step-2: Verify badge contains discount text and inline-price', async () => {
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.badge).toContainText(data.badge.original);
            const badge = card.locator('merch-badge');
            await expect(badge).toContainText(data.badge.original);
        });

        await test.step('step-3: Clear badge field', async () => {
            await editor.badge.click();
            await expect(editor.badge).toBeFocused();
            await page.keyboard.press('ControlOrMeta+A');
            await page.keyboard.press('Backspace');
        });

        await test.step('step-4: Validate badge is removed from card', async () => {
            await expect(card.locator('merch-badge')).not.toBeVisible();
        });

        await test.step('step-5: Discard changes', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify badge is restored after discard', async () => {
            const badge = card.locator('merch-badge');
            await expect(badge).toBeVisible();
            await expect(badge).toContainText(data.badge.original);
        });
    });
});
