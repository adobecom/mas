import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import '../../src/components/ost-country-picker.js';

describe('ost-country-picker', () => {
    let originalFetch;

    beforeEach(() => {
        store.country = 'US';
        store.env = 'PRODUCTION';
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        store.country = 'US';
        store.env = 'PRODUCTION';
    });

    it('renders the country control as an sp-picker, not a textfield', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        expect(el.shadowRoot.querySelector('sp-picker.country-input')).to.exist;
        expect(el.shadowRoot.querySelector('sp-textfield')).to.be.null;
    });

    it('reflects the current store country as the picker value', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        const picker = el.shadowRoot.querySelector('sp-picker.country-input');
        expect(picker.getAttribute('value')).to.equal('US');
    });

    it('renders sp-switch for env toggle', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        const toggle = el.shadowRoot.querySelector('sp-switch');
        expect(toggle).to.exist;
        expect(toggle.textContent.trim()).to.equal('Stage');
    });

    it('populates menu items from fetched countries', async () => {
        globalThis.fetch = () =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ 'iso2-code': 'DE' }, { 'iso2-code': 'US' }, { 'iso2-code': 'FR' }]),
            });
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 50));
        await el.updateComplete;
        const items = el.shadowRoot.querySelectorAll('sp-picker.country-input sp-menu-item');
        expect(items.length).to.be.greaterThan(0);
    });

    it('falls back to static countries on fetch failure', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const items = el.shadowRoot.querySelectorAll('sp-picker.country-input sp-menu-item');
        expect(items.length).to.be.greaterThan(10);
    });

    it('calls store.setCountry when the picker value changes', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const calls = [];
        const origSetCountry = store.setCountry.bind(store);
        store.setCountry = (val) => {
            calls.push(val);
            origSetCountry(val);
        };
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const picker = el.shadowRoot.querySelector('sp-picker.country-input');
        picker.value = 'DE';
        picker.dispatchEvent(new Event('change'));
        expect(calls).to.include('DE');
        store.setCountry = origSetCountry;
    });
});
