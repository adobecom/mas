import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import EditorDragPositionSpec from '../specs/editor_drag_resize.spec.js';

const { features } = EditorDragPositionSpec;

test.describe('M@S Studio Editor Drag and Position test suite', () => {
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible({ timeout: 10000 });
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Get initial editor position', async () => {
            const initialBox = await editor.panel.boundingBox();
            expect(initialBox).toBeTruthy();
            expect(initialBox.x).toBeGreaterThan(0);
            expect(initialBox.y).toBeGreaterThan(0);
        });

        await test.step('step-4: Drag editor panel to new position', async () => {
            const toolbar = editor.editorToolbar;
            await expect(toolbar).toBeVisible();

            const initialBox = await editor.panel.boundingBox();
            await toolbar.dragTo(page.locator('body'), {
                sourcePosition: { x: 10, y: 10 },
                targetPosition: {
                    x: data.positions.afterDrag.x,
                    y: data.positions.afterDrag.y,
                },
            });

            await page.waitForTimeout(500);

            const newBox = await editor.panel.boundingBox();
            expect(Math.abs(newBox.x - initialBox.x)).toBeGreaterThan(50);
        });

        await test.step('step-5: Verify editor is still functional after drag', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.closeEditor).toBeVisible();
        });
    });

    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible({ timeout: 10000 });
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Verify position button exists', async () => {
            await expect(await editor.positionButton).toBeVisible();
        });

        await test.step('step-4: Click position button', async () => {
            const initialBox = await editor.panel.boundingBox();
            await editor.positionButton.click();
            await page.waitForTimeout(500);

            const newBox = await editor.panel.boundingBox();
            expect(newBox.x !== initialBox.x || newBox.y !== initialBox.y).toBeTruthy();
        });

        await test.step('step-5: Verify editor is positioned next to card', async () => {
            const card = await studio.getCard(data.cardid);
            const cardBox = await card.boundingBox();
            const editorBox = await editor.panel.boundingBox();

            const isPositionedCorrectly =
                Math.abs(editorBox.x - (cardBox.x + cardBox.width)) < 100 ||
                Math.abs(editorBox.x + editorBox.width - cardBox.x) < 100;

            expect(isPositionedCorrectly).toBeTruthy();
        });
    });
});
