import { expect } from '@playwright/test';

export default class BulkPublishPage {
    constructor(page) {
        this.page = page;

        // mas-bulk-publish-editor.js:944-960 renders the editor and its heading.
        this.editor = page.locator('mas-bulk-publish-editor');
        this.heading = this.editor.locator('h1');

        // mas-bulk-publish-editor.js:985-997 binds items and URLs to this child.
        this.itemsPanel = this.editor.locator('mas-bulk-publish-items');
        // mas-bulk-publish-items.js:196-205 renders the multiline URL input.
        this.urlInput = this.itemsPanel.locator('sp-textfield.url-input');
        // mas-bulk-publish-items.js:142-166 renders one data-testid row per item.
        this.itemRows = this.itemsPanel.locator('[data-testid="item-row"]');
    }

    async enterUrlAndValidate(url) {
        await this.urlInput.evaluate((input, value) => {
            input.value = value;
            input.dispatchEvent(
                new InputEvent('input', {
                    bubbles: true,
                    composed: true,
                    data: value,
                    inputType: 'insertFromPaste',
                }),
            );
            input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        }, url);
    }

    async getItem(match) {
        return this.itemsPanel.evaluate((panel, expected) => {
            return (panel.items ?? []).find((item) =>
                Object.entries(expected).every(([property, value]) => item[property] === value),
            );
        }, match);
    }

    async waitForItem(match) {
        await expect.poll(async () => Boolean(await this.getItem(match)), { timeout: 15000 }).toBe(true);
        return this.getItem(match);
    }

    async getItemRow(match) {
        const index = await this.itemsPanel.evaluate((panel, expected) => {
            return (panel.items ?? []).findIndex((item) =>
                Object.entries(expected).every(([property, value]) => item[property] === value),
            );
        }, match);
        if (index < 0) throw new Error(`Bulk Publish item not found: ${JSON.stringify(match)}`);
        return this.itemRows.nth(index);
    }

    // mas-bulk-publish-items.js:87-108 renders pending, Validated, or Invalid URL status text.
    getStatusCell(row) {
        return row.locator('.status-cell');
    }
}
