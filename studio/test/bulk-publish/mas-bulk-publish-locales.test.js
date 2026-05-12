import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-locales.js';

describe('mas-bulk-publish-locales', () => {
    it('renders add-locales zone when no locales', async () => {
        const el = await fixture(html` <mas-bulk-publish-locales .locales=${[]}></mas-bulk-publish-locales> `);
        await el.updateComplete;
        const zone = el.shadowRoot.querySelector('[data-testid="add-locales-zone"]');
        expect(zone).to.exist;
        expect(zone.textContent).to.include('Add locales');
    });

    it('shows description text', async () => {
        const el = await fixture(html` <mas-bulk-publish-locales .locales=${[]}></mas-bulk-publish-locales> `);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.description')).to.exist;
    });

    it('renders summary when locales present', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-locales .locales=${['US', 'CA_en', 'FR']}></mas-bulk-publish-locales>
        `);
        await el.updateComplete;
        const summary = el.shadowRoot.querySelector('[data-testid="summary"]');
        expect(summary).to.exist;
        expect(summary.textContent).to.include('US');
        expect(summary.textContent).to.include('CA');
    });

    it('shows Edit button when locales present, not when empty', async () => {
        const withLocales = await fixture(html` <mas-bulk-publish-locales .locales=${['US']}></mas-bulk-publish-locales> `);
        await withLocales.updateComplete;
        expect(withLocales.shadowRoot.querySelector('[data-testid="edit-locales-btn"]')).to.exist;

        const empty = await fixture(html` <mas-bulk-publish-locales .locales=${[]}></mas-bulk-publish-locales> `);
        await empty.updateComplete;
        expect(empty.shadowRoot.querySelector('[data-testid="edit-locales-btn"]')).to.not.exist;
    });

    it('dispatches edit-locales when add-locales zone clicked', async () => {
        const el = await fixture(html` <mas-bulk-publish-locales .locales=${[]}></mas-bulk-publish-locales> `);
        await el.updateComplete;
        setTimeout(() => el.shadowRoot.querySelector('[data-testid="add-locales-zone"]').click());
        const ev = await oneEvent(el, 'edit-locales');
        expect(ev).to.exist;
    });

    it('dispatches edit-locales when edit button clicked', async () => {
        const el = await fixture(html` <mas-bulk-publish-locales .locales=${['US']}></mas-bulk-publish-locales> `);
        await el.updateComplete;
        setTimeout(() => el.shadowRoot.querySelector('[data-testid="edit-locales-btn"]').click());
        const ev = await oneEvent(el, 'edit-locales');
        expect(ev).to.exist;
    });
});
