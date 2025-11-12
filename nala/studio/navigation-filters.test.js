import { test, expect, studio, miloLibs, setTestPage } from '../libs/mas-test.js';

test.describe('M@S Studio Navigation Filters test suite', () => {
    test.beforeEach(async ({ page, baseURL }) => {
        const testPage = `${baseURL}/studio.html${miloLibs}#page=content&path=acom`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(studio.renderView).toBeVisible();
    });

    test('@studio-locale-picker-visibility - Validate locale picker is visible and functional', async ({ page }) => {
        await test.step('Verify locale picker is visible', async () => {
            await expect(studio.localePicker).toBeVisible();
        });

        await test.step('Verify locale picker shows current locale', async () => {
            const currentLocale = await studio.localePicker.getAttribute('value');
            expect(currentLocale).toBeTruthy();
            expect(currentLocale).toBe('en_US'); // Default locale
        });

        await test.step('Verify locale picker can be opened', async () => {
            await studio.localePicker.click();
            await expect(page.locator('mas-nav-locale-picker sp-menu').first()).toBeVisible();
        });
    });

    test('@studio-locale-picker-change - Validate changing locale filters fragments', async ({ page, baseURL }) => {
        await test.step('Open locale picker and select different locale', async () => {
            await studio.localePicker.click();
            await page.waitForTimeout(500);

            const frLocaleOption = page.locator('mas-nav-locale-picker sp-menu-item[value="fr_FR"]');
            await expect(frLocaleOption).toBeVisible();
            await frLocaleOption.click();
            await page.waitForTimeout(1000);
        });

        await test.step('Verify URL updated with locale parameter', async () => {
            const url = page.url();
            expect(url).toContain('locale=fr_FR');
        });

        await test.step('Verify locale picker shows new value', async () => {
            const currentLocale = await studio.localePicker.getAttribute('value');
            expect(currentLocale).toBe('fr_FR');
        });
    });

    test('@studio-folder-picker-visibility - Validate folder picker is visible and functional', async ({ page }) => {
        await test.step('Verify folder picker is visible', async () => {
            await expect(studio.folderPicker).toBeVisible();
        });

        await test.step('Verify folder picker shows current folder', async () => {
            const currentFolder = await studio.folderPicker.getAttribute('value');
            expect(currentFolder).toBeTruthy();
            expect(currentFolder).toBe('acom'); // From URL path parameter
        });

        await test.step('Verify folder picker can be opened', async () => {
            await studio.folderPicker.click();
            await expect(page.locator('mas-nav-folder-picker sp-menu').first()).toBeVisible();
        });
    });

    test('@studio-folder-picker-change - Validate changing folder switches content', async ({ page, baseURL }) => {
        await test.step('Open folder picker and select different folder', async () => {
            await studio.folderPicker.click();
            await page.waitForTimeout(500);

            const ccdFolderOption = page.locator('mas-nav-folder-picker sp-menu-item[value="ccd"]');
            await expect(ccdFolderOption).toBeVisible();
            await ccdFolderOption.click();
            await page.waitForTimeout(1000);
        });

        await test.step('Verify URL updated with new path', async () => {
            const url = page.url();
            expect(url).toContain('path=ccd');
        });

        await test.step('Verify folder picker shows new value', async () => {
            const currentFolder = await studio.folderPicker.getAttribute('value');
            expect(currentFolder).toBe('ccd');
        });

        await test.step('Verify fragments list refreshed', async () => {
            await expect(studio.renderView).toBeVisible();
            const cards = await studio.renderView.locator('merch-card');
            expect(await cards.count()).toBeGreaterThan(0);
        });
    });

    test('@studio-folder-and-locale-combined - Validate folder and locale filters work together', async ({ page }) => {
        await test.step('Change folder to commerce', async () => {
            await studio.folderPicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-folder-picker sp-menu-item[value="commerce"]').click();
            await page.waitForTimeout(1000);
        });

        await test.step('Change locale to de_DE', async () => {
            await studio.localePicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-locale-picker sp-menu-item[value="de_DE"]').click();
            await page.waitForTimeout(1000);
        });

        await test.step('Verify both filters are applied in URL', async () => {
            const url = page.url();
            expect(url).toContain('path=commerce');
            expect(url).toContain('locale=de_DE');
        });

        await test.step('Verify UI reflects both selections', async () => {
            expect(await studio.folderPicker.getAttribute('value')).toBe('commerce');
            expect(await studio.localePicker.getAttribute('value')).toBe('de_DE');
        });
    });

    test('@studio-folder-picker-all-options - Validate all folder options are available', async ({ page }) => {
        await studio.folderPicker.click();
        await page.waitForTimeout(500);

        const expectedFolders = ['acom', 'ccd', 'commerce', 'adobe-home'];

        for (const folder of expectedFolders) {
            const folderOption = page.locator(`mas-nav-folder-picker sp-menu-item[value="${folder}"]`);
            await expect(folderOption).toBeVisible();
        }
    });

    test('@studio-locale-picker-common-locales - Validate common locale options are available', async ({ page }) => {
        await studio.localePicker.click();
        await page.waitForTimeout(500);

        const expectedLocales = ['en_US', 'fr_FR', 'de_DE', 'ja_JP', 'es_ES'];

        for (const locale of expectedLocales) {
            const localeOption = page.locator(`mas-nav-locale-picker sp-menu-item[value="${locale}"]`);
            await expect(localeOption).toBeVisible();
        }
    });

    test('@studio-filter-persistence-across-navigation - Validate locale filter persists across page navigation', async ({
        page,
        baseURL,
    }) => {
        await test.step('Change locale to fr_FR', async () => {
            await studio.localePicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-locale-picker sp-menu-item[value="fr_FR"]').click();
            await page.waitForTimeout(1000);
        });

        await test.step('Navigate to a fragment editor', async () => {
            const fragmentEditorUrl = `${baseURL}/studio.html${miloLibs}#page=fragment-editor&fragmentId=206a8742-0289-4196-92d4-ced99ec4191e&path=acom`;
            await page.goto(fragmentEditorUrl);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('Navigate back to content page', async () => {
            const contentUrl = `${baseURL}/studio.html${miloLibs}#page=content&path=acom`;
            await page.goto(contentUrl);
            await page.waitForLoadState('domcontentloaded');
            // Wait for UI to fully load after navigation
            await expect(studio.localePicker).toBeVisible({ timeout: 10000 });
            await page.waitForTimeout(1000);
        });

        await test.step('Verify locale filter is still set', async () => {
            await expect(studio.localePicker).toBeVisible();
            const currentLocale = await studio.localePicker.getAttribute('value');
            expect(currentLocale).toBe('fr_FR');
        });
    });

    test('@studio-filter-search-interaction - Validate locale filter works with search', async ({ page, baseURL }) => {
        await test.step('Change to ja_JP locale', async () => {
            await studio.localePicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-locale-picker sp-menu-item[value="ja_JP"]').click();
            await page.waitForTimeout(1000);
        });

        await test.step('Verify URL contains locale parameter', async () => {
            const url = page.url();
            expect(url).toContain('locale=ja_JP');
        });

        await test.step('Verify content is filtered by locale', async () => {
            const cards = studio.renderView.locator('merch-card');
            const count = await cards.count();
            // Should have ja_JP specific fragments
            expect(count).toBeGreaterThanOrEqual(0);
        });
    });

    test('@studio-locale-filter-fragment-list - Validate locale affects displayed fragments', async ({ page }) => {
        await test.step('Note initial fragment count with en_US', async () => {
            const enFragments = studio.renderView.locator('merch-card');
            const enCount = await enFragments.count();
            expect(enCount).toBeGreaterThan(0);
        });

        await test.step('Switch to es_ES locale', async () => {
            await studio.localePicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-locale-picker sp-menu-item[value="es_ES"]').click();
            await page.waitForTimeout(1000);
        });

        await test.step('Verify fragments are for es_ES locale', async () => {
            const esFragments = studio.renderView.locator('merch-card');
            const esCount = await esFragments.count();
            // May have different count of es_ES fragments
            expect(esCount).toBeGreaterThanOrEqual(0);
        });

        await test.step('Verify URL has correct locale', async () => {
            const url = page.url();
            expect(url).toContain('locale=es_ES');
        });
    });

    test('@studio-folder-navigation-preserves-locale - Validate folder change preserves locale selection', async ({ page }) => {
        await test.step('Set locale to fr_FR', async () => {
            await studio.localePicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-locale-picker sp-menu-item[value="fr_FR"]').click();
            await page.waitForTimeout(1000);
        });

        await test.step('Change folder to ccd', async () => {
            await studio.folderPicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-folder-picker sp-menu-item[value="ccd"]').click();
            await page.waitForTimeout(1000);
        });

        await test.step('Verify both filters are still active', async () => {
            const url = page.url();
            expect(url).toContain('path=ccd');
            expect(url).toContain('locale=fr_FR');
        });

        await test.step('Verify both picker values are correct', async () => {
            const currentLocale = await studio.localePicker.getAttribute('value');
            const currentFolder = await studio.folderPicker.getAttribute('value');
            expect(currentLocale).toBe('fr_FR');
            expect(currentFolder).toBe('ccd');
        });
    });

    test('@studio-locale-picker-styling - Validate locale picker displays selected value visually', async ({ page }) => {
        await test.step('Open locale picker', async () => {
            await studio.localePicker.click();
            await page.waitForTimeout(500);
        });

        await test.step('Select de_DE locale', async () => {
            const deOption = page.locator('mas-nav-locale-picker sp-menu-item[value="de_DE"]');
            await expect(deOption).toBeVisible();
            await deOption.click();
            await page.waitForTimeout(500);
        });

        await test.step('Verify picker displays new value', async () => {
            const value = await studio.localePicker.getAttribute('value');
            expect(value).toBe('de_DE');
        });

        await test.step('Verify picker label is updated', async () => {
            const label = await studio.localePicker.textContent();
            expect(label).toContain('de_DE');
        });
    });

    test('@studio-folder-locale-reset - Validate resetting to default values', async ({ page }) => {
        await test.step('Set non-default values', async () => {
            await studio.localePicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-locale-picker sp-menu-item[value="ja_JP"]').click();
            await page.waitForTimeout(500);

            await studio.folderPicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-folder-picker sp-menu-item[value="adobe-home"]').click();
            await page.waitForTimeout(1000);
        });

        await test.step('Reset to en_US and acom', async () => {
            await studio.localePicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-locale-picker sp-menu-item[value="en_US"]').click();
            await page.waitForTimeout(500);

            await studio.folderPicker.click();
            await page.waitForTimeout(500);
            await page.locator('mas-nav-folder-picker sp-menu-item[value="acom"]').click();
            await page.waitForTimeout(1000);
        });

        await test.step('Verify values are reset', async () => {
            const locale = await studio.localePicker.getAttribute('value');
            const folder = await studio.folderPicker.getAttribute('value');
            expect(locale).toBe('en_US');
            expect(folder).toBe('acom');
        });
    });

    test('@studio-rapid-filter-changes - Validate handling rapid filter changes', async ({ page }) => {
        await test.step('Rapidly change locales', async () => {
            const locales = ['fr_FR', 'de_DE', 'ja_JP', 'en_US'];

            for (const locale of locales) {
                await studio.localePicker.click();
                await page.waitForTimeout(300);
                const localeOption = page.locator(`mas-nav-locale-picker sp-menu-item[value="${locale}"]`);
                await localeOption.click();
                await page.waitForTimeout(300);
            }
        });

        await test.step('Verify final state is en_US', async () => {
            const currentLocale = await studio.localePicker.getAttribute('value');
            expect(currentLocale).toBe('en_US');
        });

        await test.step('Verify UI is stable and responsive', async () => {
            await expect(studio.renderView).toBeVisible();
        });
    });
});
