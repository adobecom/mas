import {
    test,
    expect,
    studio,
    editor,
    individuals,
    slice,
    suggested,
    trybuywidget,
    ost,
    webUtil,
    miloLibs,
    setTestPage,
} from '../../../../../libs/mas-test.js';
import ACOMPlansCreateSpec from '../specs/individuals_create.spec.js';

const { features } = ACOMPlansCreateSpec;

test.describe('M@S Studio feature test suite', () => {

    
    // @studio-create-fragment - Validate creating a new fragment
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[14];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);
        let fragmentId;
        const runId = getCurrentRunId();
        const expectedTitle = `MAS Nala Automation Fragment [${runId}]`;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.renderView).toBeVisible();
        });

        await test.step('step-2: Create fragment', async () => {
            fragmentId = await studio.createFragment(
                {
                    osi: data.osi,
                    variant: data.variant,
                },
                editor,
            );
            expect(fragmentId).toBeTruthy();
            await page.waitForTimeout(3000);
        });

        await test.step('step-3: Verify fragment is visible in content page', async () => {
            await expect(studio.fragmentsTable).toBeVisible();
            await studio.fragmentsTable.scrollIntoViewIfNeeded();
            await studio.fragmentsTable.click();
            await page.waitForTimeout(2000);
            await expect(studio.renderView).toBeVisible();
        });

        await test.step('step-4: Verify fragment has correct variant', async () => {
            const createdCard = await studio.getCard(fragmentId);
            await expect(createdCard).toBeVisible();
            await expect(createdCard).toHaveAttribute('variant', data.variant);
        });

        await test.step('step-5: Switch to table view and verify fragment details', async () => {
            await studio.switchToTableView();
            await page.waitForTimeout(2000);

            // Find the fragment row by data-id attribute on mas-fragment-table
            const fragmentRow = studio.tableViewRowByFragmentId(fragmentId);
            await expect(fragmentRow).toBeVisible();

            // Get the path cell (class "name")
            const pathCell = studio.tableViewPathCell(fragmentRow);
            const fragmentPath = await pathCell.textContent();
            expect(fragmentPath).toBeTruthy();
            expect(fragmentPath).not.toContain('undefined');
            expect(fragmentPath.trim().length).toBeGreaterThan(0);

            // Get the title cell (class "title")
            const titleCell = studio.tableViewTitleCell(fragmentRow);
            const fragmentTitle = await titleCell.textContent();
            expect(fragmentTitle).toBeTruthy();
            expect(fragmentTitle.trim().length).toBeGreaterThan(0);
            expect(fragmentTitle.trim()).toBe(expectedTitle);
        });

        await test.step('step-6: Open editor from table view and verify fragment details', async () => {
            const fragmentRow = studio.tableViewRowByFragmentId(fragmentId);
            await fragmentRow.dblclick();
            await expect(await editor.panel).toBeVisible({ timeout: 30000 });
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', data.variant);
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
        });
    });
});