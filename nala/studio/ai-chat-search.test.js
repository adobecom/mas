import { test, expect } from '@playwright/test';

test.describe('MAS Studio AI Chat Search', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/?path=acom#query=');
        await page.waitForSelector('mas-studio', { timeout: 10000 });
    });

    test('should search cards with specific query', async ({ page }) => {
        const chatInput = page.locator('mas-chat').locator('textarea');
        await chatInput.waitFor({ state: 'visible' });

        await chatInput.fill('show me cards with OSI KvzpMygyLD2aOsscDZxtx1Tr1Ah_FgtkbLHP9-4OHJM');
        await chatInput.press('Enter');

        await page.waitForTimeout(2000);

        const errorMessage = page.locator('text=Operation failed');
        await expect(errorMessage).toHaveCount(0);

        const successMessage = page.locator('mas-chat-message');
        await expect(successMessage).toBeVisible();
    });

    test('should search cards without query (show me the cards in this surface)', async ({ page }) => {
        const chatInput = page.locator('mas-chat').locator('textarea');
        await chatInput.waitFor({ state: 'visible' });

        await chatInput.fill('show me the cards in this surface');
        await chatInput.press('Enter');

        await page.waitForTimeout(3000);

        const errorMessage = page.locator('text=Operation failed');
        const badRequestError = page.locator('text=Bad Request');

        if ((await errorMessage.isVisible()) || (await badRequestError.isVisible())) {
            const fullError = await page.locator('mas-chat-message').last().textContent();
            console.log('Error found:', fullError);

            const mcpLogs = await page.evaluate(() => {
                return window.localStorage.getItem('mcp-debug-logs');
            });
            console.log('MCP Logs:', mcpLogs);
        }

        await expect(errorMessage).toHaveCount(0);
        await expect(badRequestError).toHaveCount(0);

        const successMessage = page.locator('mas-chat-message');
        await expect(successMessage).toBeVisible();
    });

    test('should search for variant-specific cards', async ({ page }) => {
        const chatInput = page.locator('mas-chat').locator('textarea');
        await chatInput.waitFor({ state: 'visible' });

        await chatInput.fill('show me plans cards');
        await chatInput.press('Enter');

        await page.waitForTimeout(2000);

        const errorMessage = page.locator('text=Operation failed');
        await expect(errorMessage).toHaveCount(0);

        const successMessage = page.locator('mas-chat-message');
        await expect(successMessage).toBeVisible();
    });

    test('should handle empty search gracefully', async ({ page }) => {
        const chatInput = page.locator('mas-chat').locator('textarea');
        await chatInput.waitFor({ state: 'visible' });

        await chatInput.fill('search for cards');
        await chatInput.press('Enter');

        await page.waitForTimeout(2000);

        const errorMessage = page.locator('text=Bad Request');

        if (await errorMessage.isVisible()) {
            await page.screenshot({ path: '/tmp/ai-chat-bad-request-error.png' });
            console.log('Screenshot saved to /tmp/ai-chat-bad-request-error.png');
        }

        await expect(errorMessage).toHaveCount(0);
    });
});
