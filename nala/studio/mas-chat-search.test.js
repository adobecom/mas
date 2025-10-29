import { test, expect } from '@playwright/test';
import MasChatPage from './mas-chat.page.js';

test.describe('MAS Chat - AI Search Operations', () => {
    let masChat;

    test.beforeEach(async ({ page }) => {
        masChat = new MasChatPage(page);

        const consoleMessages = [];
        const consoleErrors = [];

        page.on('console', (msg) => {
            const text = msg.text();
            consoleMessages.push({ type: msg.type(), text });

            if (msg.type() === 'error') {
                consoleErrors.push(text);
            }

            if (text.includes('[AEMClient]') || text.includes('[MCP Client]')) {
                console.log(`[Browser Console ${msg.type()}]:`, text);
            }
        });

        masChat.consoleMessages = consoleMessages;
        masChat.consoleErrors = consoleErrors;
    });

    test('@mas-chat-search-without-query - Search cards without query text', async ({ page, baseURL }) => {
        test.setTimeout(60000);

        await test.step('Open Studio and AI Chat', async () => {
            await page.goto(`${baseURL}/studio.html`);
            await page.waitForLoadState('networkidle');

            const chatButton = page.locator('sp-sidenav-item[label="AI Assistant"]');
            await chatButton.click({ timeout: 10000 });
            await expect(masChat.chatContainer).toBeVisible({ timeout: 10000 });
        });

        await test.step('Send search request without query', async () => {
            await masChat.sendMessage('show me the cards in the acom surface');
            await masChat.waitForResponse(30000);
        });

        await test.step('Verify search results or error handling', async () => {
            const hasError = await masChat.hasError();

            if (hasError) {
                const errorText = await masChat.getErrorText();
                console.log('[Test] Error received:', errorText);

                expect(errorText).not.toContain('Bad Request');
                expect(errorText).not.toContain('AEM search failed');
            }

            if (await masChat.hasOperationResult()) {
                const resultMessage = await masChat.getOperationResultMessage();
                console.log('[Test] Operation result:', resultMessage);
                expect(resultMessage).toMatch(/Found \d+ card/);
            }

            const errors = masChat.consoleErrors.filter((error) => !error.includes('Failed to load resource'));

            if (errors.length > 0) {
                console.log('[Test] Console errors:', errors);
            }

            const aemErrors = errors.filter((error) => error.includes('AEM') || error.includes('Bad Request'));
            expect(aemErrors).toHaveLength(0);
        });
    });

    test('@mas-chat-search-with-query - Search cards with query text', async ({ page, baseURL }) => {
        test.setTimeout(60000);

        await test.step('Open Studio and AI Chat', async () => {
            await page.goto(`${baseURL}/studio.html`);
            await page.waitForLoadState('networkidle');

            const chatButton = page.locator('sp-sidenav-item[label="AI Assistant"]');
            await chatButton.click({ timeout: 10000 });
            await expect(masChat.chatContainer).toBeVisible({ timeout: 10000 });
        });

        await test.step('Send search request with query', async () => {
            await masChat.sendMessage('find cards with "Test" in the title in acom');
            await masChat.waitForResponse(30000);
        });

        await test.step('Verify search results or error handling', async () => {
            const hasError = await masChat.hasError();

            if (hasError) {
                const errorText = await masChat.getErrorText();
                console.log('[Test] Error received:', errorText);

                expect(errorText).not.toContain('Bad Request');
                expect(errorText).not.toContain('AEM search failed');
            }

            if (await masChat.hasOperationResult()) {
                const resultMessage = await masChat.getOperationResultMessage();
                console.log('[Test] Operation result:', resultMessage);
                expect(resultMessage).toMatch(/Found \d+ card/);
            }

            const errors = masChat.consoleErrors.filter((error) => !error.includes('Failed to load resource'));

            if (errors.length > 0) {
                console.log('[Test] Console errors:', errors);
            }

            const aemErrors = errors.filter((error) => error.includes('AEM') || error.includes('Bad Request'));
            expect(aemErrors).toHaveLength(0);
        });
    });

    test('@mas-chat-search-with-variant - Search cards with variant filter', async ({ page, baseURL }) => {
        test.setTimeout(60000);

        await test.step('Open Studio and AI Chat', async () => {
            await page.goto(`${baseURL}/studio.html`);
            await page.waitForLoadState('networkidle');

            const chatButton = page.locator('sp-sidenav-item[label="AI Assistant"]');
            await chatButton.click({ timeout: 10000 });
            await expect(masChat.chatContainer).toBeVisible({ timeout: 10000 });
        });

        await test.step('Send search request with variant', async () => {
            await masChat.sendMessage('show me plans cards in acom');
            await masChat.waitForResponse(30000);
        });

        await test.step('Verify search results', async () => {
            const hasError = await masChat.hasError();

            if (hasError) {
                const errorText = await masChat.getErrorText();
                console.log('[Test] Error received:', errorText);

                expect(errorText).not.toContain('Bad Request');
                expect(errorText).not.toContain('AEM search failed');
            }

            if (await masChat.hasOperationResult()) {
                const resultMessage = await masChat.getOperationResultMessage();
                console.log('[Test] Operation result:', resultMessage);
                expect(resultMessage).toMatch(/Found \d+ card/);
            }

            const errors = masChat.consoleErrors.filter((error) => !error.includes('Failed to load resource'));
            const aemErrors = errors.filter((error) => error.includes('AEM') || error.includes('Bad Request'));
            expect(aemErrors).toHaveLength(0);
        });
    });

    test('@mas-chat-search-console-logging - Verify proper console logging', async ({ page, baseURL }) => {
        test.setTimeout(60000);

        await test.step('Open Studio and AI Chat', async () => {
            await page.goto(`${baseURL}/studio.html`);
            await page.waitForLoadState('networkidle');

            const chatButton = page.locator('sp-sidenav-item[label="AI Assistant"]');
            await chatButton.click({ timeout: 10000 });
            await expect(masChat.chatContainer).toBeVisible({ timeout: 10000 });
        });

        await test.step('Send search request', async () => {
            await masChat.sendMessage('show me cards in commerce');
            await masChat.waitForResponse(30000);
        });

        await test.step('Verify console logs show proper request structure', async () => {
            const aemLogs = masChat.consoleMessages.filter((msg) => msg.text.includes('[AEMClient]'));

            console.log('[Test] AEM Client logs:', aemLogs.length);

            const queryStructureLog = aemLogs.find((msg) => msg.text.includes('Search query structure'));
            if (queryStructureLog) {
                console.log('[Test] Query structure logged correctly');
            }

            const requestUrlLog = aemLogs.find((msg) => msg.text.includes('Request URL'));
            if (requestUrlLog) {
                console.log('[Test] Request URL:', requestUrlLog.text);

                expect(requestUrlLog.text).not.toContain('%2520');
                expect(requestUrlLog.text).not.toContain('undefined');
            }
        });
    });
});
