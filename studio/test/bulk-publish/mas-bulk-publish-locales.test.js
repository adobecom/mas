import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-locales.js';

describe('mas-bulk-publish-locales', () => {
    it('renders empty dropzone when no locales', async () => {
        const el = await fixture(html` <mas-bulk-publish-locales .locales=${[]}></mas-bulk-publish-locales> `);
        expect(el.shadowRoot.querySelector('[data-testid="empty-dropzone"]')).to.exist;
    });

    it('renders summary when locales present', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-locales .locales=${['US', 'CA_en', 'FR']}></mas-bulk-publish-locales>
        `);
        await el.updateComplete;
        const summary = el.shadowRoot.querySelector('[data-testid="summary"]');
        expect(summary).to.exist;
        expect(summary.textContent).to.include('US');
        expect(summary.textContent).to.include('CA_en');
    });

    it('dispatches edit-locales when clicked', async () => {
        const el = await fixture(html` <mas-bulk-publish-locales .locales=${[]}></mas-bulk-publish-locales> `);
        await el.updateComplete;
        setTimeout(() => el.shadowRoot.querySelector('[data-testid="empty-dropzone"]').click());
        const ev = await oneEvent(el, 'edit-locales');
        expect(ev).to.exist;
    });
});
