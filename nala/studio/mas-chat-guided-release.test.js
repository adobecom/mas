import { test, expect } from '@playwright/test';
import MasChatPage from './mas-chat.page.js';

const PARSE_ERROR_TEXT = 'I had trouble formatting that response';

test.describe('MAS Chat - Guided card creation (release flow)', () => {
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

    async function openChat(page, baseURL) {
        await page.goto(`${baseURL}/studio.html`);
        await page.waitForLoadState('networkidle');
        const chatButton = page.locator('sp-sidenav-item[label="Cosmocat"]');
        await chatButton.click({ timeout: 10000 });
        await expect(masChat.chatContainer).toBeVisible({ timeout: 10000 });
    }

    async function allMessageTexts() {
        return masChat.messages.allTextContents();
    }

    test('@mas-chat-guided-release - product name reaches product selection without formatting errors', async ({
        page,
        baseURL,
    }) => {
        test.setTimeout(120000);

        await test.step('Open Studio and AI Chat', async () => {
            await openChat(page, baseURL);
        });

        await test.step('Start the guided card creation flow', async () => {
            await masChat.sendMessage('Help me create cards');
            await masChat.waitForResponse(45000);
            const texts = await allMessageTexts();
            expect(texts.join('\n')).not.toContain(PARSE_ERROR_TEXT);
            expect(texts.join('\n')).toContain('Which product');
        });

        await test.step('Answer with a product name', async () => {
            await masChat.sendMessage('creative cloud pro');
            await masChat.waitForResponse(60000);
        });

        await test.step('Verify the flow presented products instead of a parse error', async () => {
            const texts = await allMessageTexts();
            expect(texts.join('\n')).not.toContain(PARSE_ERROR_TEXT);

            const productCards = page.locator('mas-chat-product-cards');
            const productCardCount = await productCards.count();
            const combined = texts.join('\n');
            const advancedWithoutCards = /offering|Found your product|No products found/i.test(combined);
            expect(productCardCount > 0 || advancedWithoutCards).toBe(true);
        });
    });

    test('@mas-chat-guided-release-quotes - quote-heavy product input does not break the guided step', async ({
        page,
        baseURL,
    }) => {
        test.setTimeout(120000);

        await test.step('Open Studio and AI Chat', async () => {
            await openChat(page, baseURL);
        });

        await test.step('Start the flow and send a quoted product name', async () => {
            await masChat.sendMessage('Help me create cards');
            await masChat.waitForResponse(45000);
            await masChat.sendMessage('"creative cloud" pro plan');
            await masChat.waitForResponse(60000);
        });

        await test.step('Verify no formatting error and no blank assistant bubble', async () => {
            const texts = await allMessageTexts();
            expect(texts.join('\n')).not.toContain(PARSE_ERROR_TEXT);

            const messageCount = await masChat.messages.count();
            for (let i = 0; i < messageCount; i += 1) {
                const messageText = (await masChat.messages.nth(i).textContent())?.trim();
                const hasInteractiveContent =
                    (await masChat.messages.nth(i).locator('mas-chat-product-cards, mas-chat-button-group').count()) > 0;
                expect(Boolean(messageText) || hasInteractiveContent).toBe(true);
            }
        });
    });
});
