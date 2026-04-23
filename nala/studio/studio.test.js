import { test, expect, studio, editor, miloLibs, setTestPage } from '../libs/mas-test.js';
import { getTitle } from '../utils/fragment-tracker.js';
import StudioSpec from './studio.spec.js';

const { features } = StudioSpec;

test.describe('M@S Studio feature test suite', () => {
    // @studio-load - Validate studio Welcome page is loaded
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate studio load', async () => {
            await expect(await studio.quickActions).toBeVisible();
            // enable the follwoing check once loadiing this section is stable
            // await expect(await studio.recentlyUpdated).toBeVisible();
            await expect(await studio.topnav).toBeVisible();
            await expect(await studio.surfacePicker).toBeVisible();
            await expect(await studio.localePicker).toBeVisible();
            await expect(await studio.sideNav).toBeVisible();
            await expect(await studio.homeButton).toBeVisible();
            await expect(await studio.fragmentsButton).toBeVisible();
            await expect(await studio.placeholdersButton).toBeVisible();
            await expect(await studio.supportButton).toBeVisible();
        });
    });

    // @studio-direct-search - Validate direct search feature in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        const expectedUrl = `${baseURL}${features[1].path}${miloLibs}#page=content&path=nala&query=${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search results', async () => {
            await studio.waitForCardsLoaded();

            const cards = studio.renderView.locator('merch-card');
            await expect(cards).toHaveCount(1);
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(page).toHaveURL(expectedUrl);
            expect(await studio.surfacePicker).toHaveAttribute('value', 'nala');
        });
    });

    // @studio-search-field - Validate search field in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search field rendered', async () => {
            await expect(await studio.searchInput).toBeVisible();
            await expect(await studio.searchIcon).toBeVisible();
            await expect(await studio.renderView).toBeVisible();
            await studio.waitForCardsLoaded();
            const cards = studio.renderView.locator('merch-card');
            expect(await cards.count()).toBeGreaterThan(1);
        });

        await test.step('step-3: Validate search feature', async () => {
            await studio.searchInput.fill(data.cardid);
            await page.keyboard.press('Enter');
            await studio.waitForCardsLoaded();

            const searchResult = await studio.renderView.locator('merch-card');
            await expect(searchResult).toHaveCount(1);
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
        });
    });

    // @studio-empty-card - Validate empty/broken cards are not previewed
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);

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
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Go to content', async () => {
            await expect(await studio.quickActions).toBeVisible();
            await expect(await studio.gotoContent).toBeVisible();
            await expect(await studio.surfacePicker).toHaveAttribute('value', 'sandbox');
            await studio.gotoContent.click();
        });

        await test.step('step-3: Validate page view', async () => {
            await studio.waitForCardsLoaded();
            await expect(await studio.renderView).toBeVisible();
            const cards = await studio.renderView.locator('merch-card');
            expect(await cards.count()).toBeGreaterThan(1);
            await expect(page).toHaveURL(`${testPage}#page=content&path=sandbox`);
            expect(await studio.surfacePicker).toHaveAttribute('value', 'sandbox');
        });
    });

    // @studio-card-dblclick - Validate message for double-click on the card in mas studio and open editor
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate double-click message', async () => {
            await studio.waitForCardsLoaded();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await (await studio.getCard(data.cardid)).click();
            await expect(page.locator('sp-tooltip')).toHaveText('Double click the card to start editing.');
        });

        await test.step('step-3: Double-click on the card and open editor', async () => {
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });
    });

    // @studio-surface-change - Validate surface change in mas studio
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[6].path}${miloLibs}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Change surface', async () => {
            await expect(await studio.topnav).toBeVisible();
            await expect(await studio.surfacePicker).toBeVisible();
            await studio.surfacePicker.click();
            await page.getByRole('menuitem', { name: 'sandbox' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate surface change', async () => {
            await expect(await studio.surfacePicker).toHaveAttribute('value', 'sandbox');
            await expect(page).toHaveURL(`${testPage}#page=welcome&path=sandbox`);
            await expect(await studio.sideNav).toBeVisible();
            await expect(await studio.homeButton).toBeVisible();
            await expect(await studio.fragmentsButton).toBeVisible();
            await expect(await studio.placeholdersButton).toBeVisible();
        });
    });

    // @studio-locale-change - Validate locale change in mas studio
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Change locale', async () => {
            await expect(await studio.localePicker).toBeVisible();
            await expect(await studio.localePicker).toHaveAttribute('value', 'en_US');
            await studio.localePicker.click();
            await page.waitForTimeout(500);
            await page.getByRole('menuitem', { name: `${data.localePicker}` }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate locale change', async () => {
            await expect(await studio.localePicker).toHaveAttribute('value', data.locale);
            await expect(page).toHaveURL(`${testPage}#locale=${data.locale}&page=welcome&path=sandbox`);
            await expect(await studio.sideNav).toBeVisible();
            await expect(await studio.homeButton).toBeVisible();
            await expect(await studio.fragmentsButton).toBeVisible();
            await expect(await studio.placeholdersButton).toBeVisible();
            await expect(await studio.supportButton).toBeVisible();
        });
    });

    // @studio-table-view - Validate Table View
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
        });

        await test.step('step-2: Change to the table view', async () => {
            await expect(await studio.previewMenu).toBeVisible();
            await expect(await studio.previewMenu).toHaveAttribute('value', 'render');
            await studio.previewMenu.click();
            await expect(await studio.renderViewOption).toBeVisible();
            await expect(await studio.tableViewOption).toBeVisible();
            await studio.tableViewOption.click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate the table view', async () => {
            await expect(await studio.tableView).toBeVisible();
            await expect(await studio.tableViewHeaders).toBeVisible();
            const cards = await studio.tableView.locator('mas-fragment');
            expect(await cards.count()).toBeGreaterThan(1);
            await expect(await studio.tableView.locator('mas-fragment').first()).toHaveAttribute('view', 'table');
        });

        await test.step('step-4: Validate card editing in table view', async () => {
            await studio.tableView.locator('mas-fragment').first().dblclick();
            await expect(await editor.panel).toBeVisible();
        });
    });

    // @studio-create-fragment - Validate creating a new fragment
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}`;
        setTestPage(testPage);
        let fragmentId;
        const expectedTitle = getTitle();

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.renderView).toBeVisible();
        });

        await test.step('step-2: Create fragment', async () => {
            fragmentId = await studio.createFragment({
                osi: data.osi,
                variant: data.variant,
            });
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

            const fragmentRow = studio.tableViewRowByFragmentId(fragmentId);
            await expect(fragmentRow).toBeVisible();

            const pathCell = studio.tableViewPathCell(fragmentRow);
            const fragmentPath = await pathCell.textContent();
            expect(fragmentPath).toBeTruthy();
            expect(fragmentPath).not.toContain('undefined');
            expect(fragmentPath.trim().length).toBeGreaterThan(0);

            const titleCell = studio.tableViewTitleCell(fragmentRow);
            const fragmentTitle = await titleCell.textContent();
            expect(fragmentTitle).toBeTruthy();
            expect(fragmentTitle.trim().length).toBeGreaterThan(0);
            expect(fragmentTitle.trim()).toBe(expectedTitle);
        });

        await test.step('step-6: Open editor from table view and verify fragment details', async () => {
            const fragmentRow = studio.tableViewRowByFragmentId(fragmentId);
            await fragmentRow.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', data.variant);
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
        });
    });

    // @studio-load-variation - Validate loading a variation in mas studio
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Switch to table view and find cardid row', async () => {
            await studio.waitForCardsLoaded();
            await studio.switchToTableView();
            await expect(studio.tableViewFragmentTable(data.cardid)).toBeVisible();
            expect(await (await studio.tableViewPriceCell(studio.tableViewRowByFragmentId(data.cardid))).textContent()).toMatch(
                data.price,
            );
        });

        await test.step('step-3: Expand row and verify variation exists and price visible', async () => {
            await studio.tableViewFragmentTable(data.cardid).locator('button.expand-button').click();
            await expect(studio.tableViewFragmentTable(data.variationid)).toBeVisible();
            await expect(studio.tableViewPriceCell(studio.tableViewRowByFragmentId(data.variationid))).toBeVisible();
            expect(
                await (await studio.tableViewPriceCell(studio.tableViewRowByFragmentId(data.variationid))).textContent(),
            ).toMatch(
                data.price, // change to regional price once MWPW-187797 is fixed
            );
        });
    });

    // @studio-nala-personalization-table-groups — Nala content in table view with personalization on shows grouped headers
    test(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Open nala content with personalization filter enabled (hash)', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.renderView).toBeVisible();
        });

        await test.step('step-2: Switch to table view', async () => {
            await studio.switchToTableView();
        });

        await test.step('step-3: Validate Personalization / All other fragment group headers', async () => {
            await expect(studio.contentTableBody).toBeVisible({ timeout: 30000 });
            await expect(studio.contentTableBody.getByText(/Personalization fragments\s*\(/)).toBeVisible({
                timeout: 30000,
            });
            await expect(studio.contentTableBody.getByText(/All other fragments\s*\(/)).toBeVisible({
                timeout: 30000,
            });
        });
    });

    // @studio-nala-table-without-personalization-groups — Same path without personalization: no grouped section headers
    test(`${features[12].name},${features[12].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[12].path}${miloLibs}${features[12].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Open nala content without personalization in URL', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.renderView).toBeVisible();
        });

        await test.step('step-2: Switch to table view', async () => {
            await studio.switchToTableView();
        });

        await test.step('step-3: Table body has no personalization group rows', async () => {
            await expect(studio.contentTableBody).toBeVisible({ timeout: 30000 });
            await expect(studio.contentTableBody.getByText(/Personalization fragments\s*\(/)).toHaveCount(0);
            await expect(studio.contentTableBody.getByText(/All other fragments\s*\(/)).toHaveCount(0);
        });
    });

    // @studio-variations-locale-filter — Locale and grouped variation visibility per studio locale (Nala)
    test(`${features[13].name},${features[13].tags}`, async ({ page, baseURL }) => {
        const { data } = features[13];
        const testPage = `${baseURL}${features[13].path}${miloLibs}${features[13].browserParams}${data.query}`;
        setTestPage(testPage);

        /**
         * The default en_US card is translated to en_GB and de_DE. It has one locale variation (en_QA), and
         * two grouped variations: de_DE, and pl_PL, both not translated.
         */

        await test.step('step-1: en_US — locale and grouped variations are displayed', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.switchToTableView();
            await page.waitForTimeout(2000);
            const rootRow = studio.tableViewFragmentTable(data.usCardId);
            await expect(rootRow).toBeVisible({ timeout: 15000 });
            await rootRow.locator('button.expand-button').click();
            await expect(studio.regionalVariationsTable(data.usCardId)).toHaveCount(1, { timeout: 15000 });
            await expect(studio.tableViewFragmentTable(data.localeVariationEnQaId)).toBeVisible({ timeout: 15000 });
            await studio.groupedVariationsTab(data.usCardId).click();
            await expect(studio.groupedVariationsTable(data.usCardId)).toHaveCount(2, { timeout: 15000 });
            await expect(studio.tableViewFragmentTable(data.groupedVariationDeDeId)).toBeVisible({ timeout: 15000 });
            await expect(studio.tableViewFragmentTable(data.groupedVariationPlPlId)).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: en_GB — locale or grouped variations are not displayed', async () => {
            await studio.selectLocale(data.localeEnglishGb.label);
            await expect(studio.localePicker).toHaveAttribute('value', data.localeEnglishGb.value);
            await page.waitForLoadState('domcontentloaded');
            await studio.switchToTableView();
            await page.waitForTimeout(2000);
            const fragmentRow = studio.tableViewRowByFragmentId(data.gbCardId);
            await expect(fragmentRow).toBeVisible();
            await fragmentRow.locator('button.expand-button').click();
            await expect(studio.localeVariationsTabPanel(data.gbCardId).getByText('No locale variations found')).toBeVisible({
                timeout: 15000,
            });
            await studio.groupedVariationsTab(data.gbCardId).click();
            await expect(studio.groupedVariationsTabPanel(data.gbCardId).getByText('No grouped variations found')).toBeVisible({
                timeout: 15000,
            });
        });

        await test.step('step-3: de_DE — locale or grouped variations are not displayed', async () => {
            await studio.selectLocale(data.localeGermanDe.label);
            await expect(studio.localePicker).toHaveAttribute('value', data.localeGermanDe.value);
            await page.waitForLoadState('domcontentloaded');
            await studio.switchToTableView();
            await page.waitForTimeout(2000);
            const fragmentRow = studio.tableViewRowByFragmentId(data.deCardId);
            await expect(fragmentRow).toBeVisible();
            await fragmentRow.locator('button.expand-button').click();
            await expect(studio.localePicker).toHaveAttribute('value', data.localeGermanDe.value);
            await expect(studio.localeVariationsTabPanel(data.deCardId).getByText('No locale variations found')).toBeVisible({
                timeout: 15000,
            });
            await studio.groupedVariationsTab(data.deCardId).click();
            await expect(studio.groupedVariationsTabPanel(data.deCardId).getByText('No grouped variations found')).toBeVisible({
                timeout: 15000,
            });
        });
    });

    // @studio-sandbox-no-created-by-filter - Validate Sandbox does not auto-apply a Created By filter
    test(`${features[14].name},${features[14].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[14].path}${miloLibs}${features[14].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio sandbox page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate sandbox surface is selected', async () => {
            await expect(studio.surfacePicker).toHaveAttribute('value', 'sandbox');
        });

        await test.step('step-3: Validate no Created By filter is auto-applied', async () => {
            await studio.waitForCardsLoaded();
            await expect(studio.createdByTag).toHaveCount(0);
            await expect(studio.renderView.locator('merch-card').nth(1)).toBeVisible();
        });
    });
});
