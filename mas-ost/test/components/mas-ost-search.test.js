import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/mas-ost-search.js';

describe('mas-ost-search', () => {
    it('renders sp-search element', async () => {
        const el = await fixture(html`<mas-ost-search></mas-ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        expect(search).to.exist;
        expect(search.getAttribute('placeholder')).to.include('Search');
    });

    it('does not show badge when query is empty', async () => {
        const el = await fixture(html`<mas-ost-search></mas-ost-search>`);
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.not.exist;
    });

    it('shows Product badge for text input', async () => {
        const el = await fixture(html`<mas-ost-search></mas-ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'photoshop';
        search.dispatchEvent(new Event('input'));
        await new Promise((r) => setTimeout(r, 300));
        await el.updateComplete;
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal('Product');
    });

    it('shows Offer ID badge for 32-char hex input', async () => {
        const el = await fixture(html`<mas-ost-search></mas-ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = '257E1D82082387D152029F93C1030624';
        search.dispatchEvent(new Event('input'));
        await new Promise((r) => setTimeout(r, 300));
        await el.updateComplete;
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal('Offer ID');
    });

    it('shows OSI badge for 43-char base64 input', async () => {
        const el = await fixture(html`<mas-ost-search></mas-ost-search>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v';
        search.dispatchEvent(new Event('input'));
        await new Promise((r) => setTimeout(r, 300));
        await el.updateComplete;
        const badge = el.shadowRoot.querySelector('sp-badge');
        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal('OSI');
    });
});
