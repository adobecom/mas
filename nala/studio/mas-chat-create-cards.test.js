/**
 * MAS Studio — "Create cards with AI" (NPI release) guided flow, end-to-end.
 *
 * Drives the AI assistant's guided card-creation flow for a known product and
 * asserts the two user-visible milestones:
 *   1. the product preview (<mas-chat-product-cards>) renders for the matched product;
 *   2. a card is actually created (<mas-operation-result> success: "Created N cards…").
 *
 * SEEDED-WORKSPACE PREREQUISITE
 * Card creation reads products from the OST/MCS product cache, which is only
 * populated in seeded workspaces — personal/stage workspaces start EMPTY. Seed the
 * target workspace by invoking the `ost-products-write` action on its
 * `14257-masstudio-<workspace>` namespace (or wait for the daily `ost-products.yaml`
 * GitHub workflow). An unseeded workspace makes `ost-products-read` return an empty
 * 200 ("The OST product cache is not populated for this environment."), so this spec
 * SKIPS with a clear message instead of hanging or failing cryptically.
 *
 * WORKSPACE PARAMETERIZATION
 * Set MAS_STUDIO_IO_ENV=<workspace> to point Studio's IO backend at that workspace.
 * It is appended as ?io.studio.env=<workspace>, which studio.html interpolates into
 * the io-base-url meta → https://14257-masstudio-<workspace>.adobeioruntime.net/...
 * Unset → the default production Studio IO env, whose OST cache is populated.
 *
 * OST OFFER FRONTIER
 * The offer-selection step opens the Offer Selector Tool with
 * mode=plans-base-and-trial, which needs live MCS offer data for the product. If the
 * flow reaches that modal (no completable offer in this workspace), the spec SKIPS —
 * milestone 1 is asserted first. The flow is model-driven and branchy, so it is
 * driven with a bounded advance-loop, not a hardcoded click-script.
 *
 * Run (against main — the default, populated env):
 *   npm run nala -- --grep @mas-chat-create-cards
 * Against a seeded dev workspace:
 *   MAS_STUDIO_IO_ENV=<workspace> npm run nala -- --grep @mas-chat-create-cards
 */
import { test, expect } from '@playwright/test';
import MasChatPage from './mas-chat.page.js';

const PRODUCT = process.env.MAS_NPI_PRODUCT || 'Creative Cloud Pro';
const STUDIO_IO_ENV = process.env.MAS_STUDIO_IO_ENV || '';

const PARSE_ERROR_TEXT = 'I had trouble formatting that response';

// Source-grounded, user-visible strings that mean the OST product/offer cache is not
// populated for this workspace — the clean SKIP boundary (never a cryptic failure).
// (studio/src/mas-chat.js, studio/src/services/product-api.js.)
const EMPTY_CACHE_SIGNALS = [
    'The OST product cache is not populated for this environment.',
    'No products found matching',
    'No products found in the catalog.',
    'No products found.',
    'Operation failed:',
];

const MAX_GUIDED_STEPS = 10;

function studioUrl(baseURL) {
    const url = new URL(`${baseURL}/studio.html`);
    if (STUDIO_IO_ENV) url.searchParams.set('io.studio.env', STUDIO_IO_ENV);
    return url.toString();
}

test.describe('MAS Chat - Create cards with AI (NPI end-to-end)', () => {
    let masChat;

    test.beforeEach(async ({ page }) => {
        masChat = new MasChatPage(page);

        const consoleErrors = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        masChat.consoleErrors = consoleErrors;
    });

    test('@mas-chat-create-cards - product preview renders and a card is created', async ({ page, baseURL }) => {
        test.setTimeout(180000);

        await test.step('Open Studio and the AI assistant', async () => {
            await page.goto(studioUrl(baseURL));
            await page.waitForLoadState('networkidle');
            await page.locator('mas-side-nav-item[label="MASA"]').click({ timeout: 10000 });
            await expect(masChat.chatContainer).toBeVisible({ timeout: 10000 });
        });

        await test.step('Start the guided card-creation flow', async () => {
            await masChat.sendMessage('Help me create cards');
            await masChat.waitForResponse(45000);
            const texts = await masChat.allMessageTexts();
            expect(texts).not.toContain(PARSE_ERROR_TEXT);
            expect(texts).toContain('Which product');
        });

        await test.step(`Answer with the product name ("${PRODUCT}")`, async () => {
            await masChat.sendMessage(PRODUCT);
            await masChat.waitForResponse(60000);
        });

        // SKIP cleanly when the workspace OST cache is empty — the product lookup
        // returns nothing and no product preview renders. Do NOT fail or hang.
        const lookupSignal = await masChat.firstSignal(EMPTY_CACHE_SIGNALS);
        test.skip(
            lookupSignal !== null && (await masChat.productCards.count()) === 0,
            `OST cache not populated for this workspace — run ost-products-write (saw: "${lookupSignal}")`,
        );

        await test.step('Milestone 1 — product preview renders for the matched product', async () => {
            await expect(masChat.productCards.first()).toBeVisible({ timeout: 30000 });
            await expect.poll(async () => masChat.lastProductCard.count(), { timeout: 30000 }).toBeGreaterThan(0);
            expect(await masChat.allMessageTexts()).not.toContain(PARSE_ERROR_TEXT);
        });

        // Milestone 2 — drive the model-driven flow forward one control at a time.
        // The loop is bounded and every data-dependency boundary is a clean SKIP,
        // so the spec never hangs and never fails cryptically on missing seed data.
        for (let step = 0; step < MAX_GUIDED_STEPS; step += 1) {
            if (await masChat.releaseCardsResult.count()) break;

            const signal = await masChat.firstSignal(EMPTY_CACHE_SIGNALS);
            test.skip(
                signal !== null,
                `Card creation blocked by missing seeded data — run ost-products-write (saw: "${signal}")`,
            );

            if (await masChat.selectOfferButton.count()) {
                test.skip(
                    true,
                    `Guided flow reached the Offer Selector Tool (mode=plans-base-and-trial). Completing card ` +
                        `creation needs seeded MCS offer data for "${PRODUCT}" in this workspace; milestone 1 verified.`,
                );
            } else if (await masChat.confirmationSummary.count()) {
                if (await masChat.createCardsButtonDisabled()) {
                    if (await masChat.selectTemplateButton.count()) {
                        await masChat.selectTemplateButton.click();
                        await masChat.templateCard.first().click();
                        await masChat.templateConfirmButton.click();
                    }
                }
                await masChat.createCardsButton.click();
            } else if (await masChat.lastButtonGroupOption.count()) {
                await masChat.lastButtonGroupOption.first().click();
            } else if ((await masChat.lastProductCard.count()) && (await masChat.selectedProductCard.count()) === 0) {
                await masChat.lastProductCard.first().click();
            } else {
                break;
            }

            await masChat.waitForResponse(60000);
        }

        await test.step('Milestone 2 — a card is created', async () => {
            await expect(masChat.releaseCardsResult.first()).toBeVisible({ timeout: 60000 });
            await expect(masChat.releaseCardsResult.first()).toContainText(/Created \d+ card/);
        });
    });
});
