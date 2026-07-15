import { expect } from '@playwright/test';

export default class MasChatPage {
    constructor(page) {
        this.page = page;

        this.chatContainer = page.locator('mas-chat');
        this.chatInputContainer = page.locator('mas-chat-input');
        this.sendButton = page.locator('mas-chat-input sp-button[variant="accent"]');
        this.messages = page.locator('mas-chat-message');
        this.promptSuggestions = page.locator('mas-prompt-suggestions');
        this.suggestionButton = page.locator('mas-prompt-suggestions sp-button');
        this.loadingIndicator = page.locator('mas-chat .loading, mas-chat-message[is-loading]');
        this.operationResult = page.locator('mas-operation-result');
        this.errorMessage = page.locator('mas-chat-message[role="error"]');
        this.cardPreview = page.locator('merch-card');
        this.sessionSelector = page.locator('mas-chat-session-selector');
    }

    async open() {
        await this.page.goto('/studio.html');
        const chatButton = this.page.locator('sp-action-button[label="AI Chat"]');
        await chatButton.click();
        await expect(this.chatContainer).toBeVisible({ timeout: 10000 });
    }

    async waitForChatReady() {
        await expect(this.chatContainer).toBeVisible({ timeout: 10000 });
        await this.page.waitForLoadState('networkidle');
    }

    async sendMessage(message) {
        await this.chatInputContainer.evaluate((inputEl, text) => {
            const rteField = inputEl.querySelector('rte-field');
            if (!rteField || !rteField.editorView) {
                throw new Error('RTE field not found or not initialized');
            }
            const { state, dispatch } = rteField.editorView;
            const tr = state.tr.replaceWith(0, state.doc.content.size, state.schema.text(text));
            dispatch(tr);
        }, message);
        await this.sendButton.click();
    }

    async waitForResponse(timeout = 30000) {
        await expect(this.loadingIndicator).toBeHidden({ timeout });
    }

    async getLastMessage() {
        const lastMessage = this.messages.last();
        await expect(lastMessage).toBeVisible();
        return lastMessage;
    }

    async getLastMessageContent() {
        const lastMessage = await this.getLastMessage();
        return lastMessage.locator('.message-content').textContent();
    }

    async clickSuggestion(index = 0) {
        const suggestions = this.suggestionButton;
        await suggestions.nth(index).click();
    }

    async hasError() {
        return (await this.errorMessage.count()) > 0;
    }

    async getErrorText() {
        if (await this.hasError()) {
            return this.errorMessage.textContent();
        }
        return null;
    }

    async hasOperationResult() {
        return (await this.operationResult.count()) > 0;
    }

    async getOperationResultMessage() {
        if (await this.hasOperationResult()) {
            return this.operationResult.locator('.message').textContent();
        }
        return null;
    }

    async waitForCards(count, timeout = 10000) {
        await this.page.waitForFunction(
            ({ selector, expectedCount }) => {
                const cards = document.querySelectorAll(selector);
                return cards.length >= expectedCount;
            },
            { selector: 'merch-card', expectedCount: count },
            { timeout },
        );
    }

    async getCardCount() {
        return this.cardPreview.count();
    }

    async getConsoleLogs() {
        const logs = [];
        this.page.on('console', (msg) => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                logs.push({ type: msg.type(), text: msg.text() });
            }
        });
        return logs;
    }

    async clearConsoleErrors() {
        this.consoleErrors = [];
    }

    setupConsoleErrorListener() {
        this.consoleErrors = [];
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                this.consoleErrors.push(msg.text());
            }
        });
    }

    async hasConsoleErrors() {
        return this.consoleErrors && this.consoleErrors.length > 0;
    }

    async getConsoleErrors() {
        return this.consoleErrors || [];
    }
}
