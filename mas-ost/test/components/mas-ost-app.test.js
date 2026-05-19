import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/mas-ost-app.js';
import { store } from '../../src/store/ost-store.js';

describe('mas-ost-app', () => {
    it('renders sp-theme with correct attributes', async () => {
        const el = await fixture(html`<mas-ost-app></mas-ost-app>`);
        const theme = el.shadowRoot.querySelector('sp-theme');
        expect(theme).to.exist;
        expect(theme.getAttribute('system')).to.equal('spectrum-two');
        expect(theme.getAttribute('color')).to.equal('light');
        expect(theme.getAttribute('scale')).to.equal('medium');
    });

    it('initializes store when config property is set', async () => {
        const el = await fixture(html`<mas-ost-app></mas-ost-app>`);
        el.config = { country: 'DE', language: 'de', env: 'STAGE' };
        await el.updateComplete;
        expect(store.country).to.equal('DE');
        expect(store.env).to.equal('STAGE');
    });

    it('renders left and right panels', async () => {
        const el = await fixture(html`<mas-ost-app></mas-ost-app>`);
        const leftPanel = el.shadowRoot.querySelector('.ost-left-panel');
        const rightPanel = el.shadowRoot.querySelector('.ost-right-panel');
        expect(leftPanel).to.exist;
        expect(rightPanel).to.exist;
    });

    it('renders child component slots in correct panels', async () => {
        const el = await fixture(html`<mas-ost-app></mas-ost-app>`);
        const left = el.shadowRoot.querySelector('.ost-left-panel');
        const headerBar = el.shadowRoot.querySelector('.ost-header-bar');
        expect(headerBar.querySelector('mas-ost-country-picker')).to.exist;
        expect(left.querySelector('mas-ost-search')).to.exist;
        expect(left.querySelector('mas-ost-filter-bar')).to.exist;
        expect(left.querySelector('mas-ost-product-list')).to.exist;
    });

    it('renders welcome screen when no product is selected', async () => {
        const el = await fixture(html`<mas-ost-app></mas-ost-app>`);
        const welcomeScreen = el.shadowRoot.querySelector('mas-ost-welcome-screen');
        expect(welcomeScreen).to.exist;
    });

    it('renders header and footer bars', async () => {
        const el = await fixture(html`<mas-ost-app></mas-ost-app>`);
        expect(el.shadowRoot.querySelector('.ost-header-bar')).to.exist;
        expect(el.shadowRoot.querySelector('.ost-footer-bar')).to.exist;
        expect(el.shadowRoot.querySelector('.ost-title').textContent).to.equal('Offer Selector Tool');
    });

    it('dispatches ost-select event', async () => {
        const el = await fixture(html`<mas-ost-app></mas-ost-app>`);
        let received = null;
        el.addEventListener('ost-select', (e) => {
            received = e.detail;
        });
        el.select({ osi: 'test-osi', type: 'price' });
        expect(received).to.deep.include({ osi: 'test-osi', type: 'price' });
    });

    it('dispatches ost-cancel event', async () => {
        const el = await fixture(html`<mas-ost-app></mas-ost-app>`);
        let cancelled = false;
        el.addEventListener('ost-cancel', () => {
            cancelled = true;
        });
        el.cancel();
        expect(cancelled).to.be.true;
    });
});
