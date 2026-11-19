import { expect, test } from '../../libs/docs-test.js';
import { publishedCards, unpublishedCard, collectionPreview, sharedPreview } from './preview.spec.js';
import { constructTestUrl } from '../../utils/commerce.js';

const previewPath = '/web-components/docs/mas-preview.html';
const getPreviewUrl = (baseURL, fragment) => {
    const params = new URLSearchParams({
        'fragment-id': fragment.fragmentId,
        'content-type': fragment.contentType ?? 'merch-card',
        locale: 'en_US',
        theme: fragment.theme,
        'mas.preview': fragment.preview ?? 'off',
    });
    return constructTestUrl(baseURL, previewPath, `?${params}`);
};

const expectPreviewLoaded = async (page, fragment) => {
    const theme = new URL(page.url()).searchParams.get('theme') ?? 'light';
    await expect(page.locator('body')).toHaveClass(new RegExp(`\\bspectrum--${theme}\\b`));
    await expect(page.locator('body > sp-theme')).toHaveAttribute('color', theme === 'darkest' ? 'dark' : theme);
    await expect(page.locator('#preview > *')).toHaveJSProperty('localName', fragment.contentType ?? 'merch-card');
    const card = page.locator('#preview merch-card').first();
    await expect(card).toHaveAttribute('variant', fragment.variant);
    await expect(card).toHaveAttribute('spectrum', fragment.spectrum);
    await expect.poll(() => page.evaluate(() => window.previewReady)).toBe(true);
    await expect(card).toBeVisible();
    await expect(page.locator('#status')).toBeEmpty();
};

test.describe('M@S preview @mas-docs @mas-preview', () => {
    test.beforeEach(async ({ context }) => {
        await context.setExtraHTTPHeaders({ 'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"' });
        await context.addInitScript(() => {
            window.previewReady = false;
            document.addEventListener('mas:ready', () => {
                window.previewReady = true;
            });
        });
    });

    test('loads existing published CCD, Adobe Home and Commerce cards', async ({ page, baseURL }) => {
        for (const fragment of publishedCards) {
            await test.step(fragment.name, async () => {
                await page.goto(getPreviewUrl(baseURL, fragment));
                await expectPreviewLoaded(page, fragment);
            });
        }
    });

    test('loads an existing unpublished card through Odin Preview', async ({ page, baseURL }) => {
        await page.goto(getPreviewUrl(baseURL, unpublishedCard));
        await expectPreviewLoaded(page, unpublishedCard);
        expect(
            await page.evaluate(
                (id) =>
                    performance
                        .getEntriesByType('resource')
                        .some(({ name }) => name.startsWith(`https://odinpreview.corp.adobe.com/adobe/contentFragments/${id}`)),
                unpublishedCard.fragmentId,
            ),
        ).toBe(true);
    });

    test('loads an existing collection and displays its cards', async ({ page, baseURL }) => {
        await page.goto(getPreviewUrl(baseURL, collectionPreview));
        await expectPreviewLoaded(page, collectionPreview);
        for (const card of await page.locator('#preview merch-card').all()) {
            await expect(card).toBeVisible();
        }
    });

    test('applies the selected theme and restores the copied preview link', async ({ page, context, baseURL }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
        await page.goto(getPreviewUrl(baseURL, sharedPreview));
        await expectPreviewLoaded(page, sharedPreview);
        await page.locator('#theme').click();
        await page.locator(`#theme sp-menu-item[value="${sharedPreview.selectedTheme}"]`).click();
        await page.getByRole('button', { name: 'Preview', exact: true }).click();

        await expectPreviewLoaded(page, sharedPreview);
        expect(new URL(page.url()).searchParams.get('theme')).toBe(sharedPreview.selectedTheme);
        await expect(page.locator('sp-theme')).toHaveAttribute('color', sharedPreview.selectedTheme);
        const previewText = await page.locator('#preview').innerText();

        await page.getByRole('button', { name: 'Copy URL', exact: true }).click();
        await expect(page.locator('#status')).toHaveText('URL copied.');
        const copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
        expect(copiedUrl).toBe(page.url());

        const copiedPage = await context.newPage();
        await copiedPage.goto(copiedUrl);
        await expectPreviewLoaded(copiedPage, sharedPreview);
        await expect(copiedPage.locator('#theme')).toHaveJSProperty('value', sharedPreview.selectedTheme);
        await expect(copiedPage.locator('sp-theme')).toHaveAttribute('color', sharedPreview.selectedTheme);
        await expect(copiedPage.locator('#preview')).toHaveText(previewText, { useInnerText: true });
        await copiedPage.close();
    });
});
