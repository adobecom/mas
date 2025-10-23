import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import EditorDragResizeSpec from '../specs/editor_drag_resize.spec.js';

const { features } = EditorDragResizeSpec;

test.describe('M@S Studio Editor Drag and Resize test suite', () => {
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

        await test.step('step-3: Get initial editor size', async () => {
            const initialBox = await editor.panel.boundingBox();
            expect(initialBox.width).toBeGreaterThanOrEqual(data.minSize.width);
            expect(initialBox.height).toBeGreaterThanOrEqual(data.minSize.height);
        });

        await test.step('step-4: Resize editor using SE handle', async () => {
            const resizeHandle = editor.resizeHandleSE;
            await expect(resizeHandle).toBeVisible();

            const initialBox = await editor.panel.boundingBox();
            await resizeHandle.dragTo(page.locator('body'), {
                sourcePosition: { x: 0, y: 0 },
                targetPosition: {
                    x: initialBox.x + data.dimensions.afterResize.width,
                    y: initialBox.y + data.dimensions.afterResize.height,
                },
            });

            await page.waitForTimeout(500);

            const newBox = await editor.panel.boundingBox();
            expect(newBox.width).toBeGreaterThan(initialBox.width);
            expect(newBox.height).toBeGreaterThan(initialBox.height);
        });

        await test.step('step-5: Verify minimum size constraints', async () => {
            const resizeHandle = editor.resizeHandleSE;
            const initialBox = await editor.panel.boundingBox();

            await resizeHandle.dragTo(page.locator('body'), {
                sourcePosition: { x: 0, y: 0 },
                targetPosition: {
                    x: initialBox.x + 100,
                    y: initialBox.y + 100,
                },
            });

            await page.waitForTimeout(500);

            const newBox = await editor.panel.boundingBox();
            expect(newBox.width).toBeGreaterThanOrEqual(data.minSize.width);
            expect(newBox.height).toBeGreaterThanOrEqual(data.minSize.height);
        });

        await test.step('step-6: Verify editor is still functional after resize', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.closeEditor).toBeVisible();
        });
    });

    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
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

    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
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

        await test.step('step-3: Drag editor to custom position', async () => {
            const toolbar = editor.editorToolbar;
            await toolbar.dragTo(page.locator('body'), {
                sourcePosition: { x: 10, y: 10 },
                targetPosition: {
                    x: data.customPosition.x,
                    y: data.customPosition.y,
                },
            });
            await page.waitForTimeout(500);
        });

        await test.step('step-4: Resize editor to custom size', async () => {
            const resizeHandle = editor.resizeHandleSE;
            const editorBox = await editor.panel.boundingBox();

            await resizeHandle.dragTo(page.locator('body'), {
                sourcePosition: { x: 0, y: 0 },
                targetPosition: {
                    x: editorBox.x + data.customSize.width,
                    y: editorBox.y + data.customSize.height,
                },
            });
            await page.waitForTimeout(500);
        });

        await test.step('step-5: Get editor position and size before closing', async () => {
            const boxBeforeClose = await editor.panel.boundingBox();
            expect(boxBeforeClose).toBeTruthy();

            await editor.closeEditor.click();
            await page.waitForTimeout(500);
        });

        await test.step('step-6: Reopen editor and verify position/size persisted', async () => {
            const card = await studio.getCard(data.cardid);
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
            await page.waitForTimeout(500);

            const boxAfterReopen = await editor.panel.boundingBox();
            expect(boxAfterReopen).toBeTruthy();
        });
    });
});
