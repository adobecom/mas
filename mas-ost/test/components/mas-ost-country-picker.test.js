import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import '../../src/components/mas-ost-country-picker.js';

describe('mas-ost-country-picker', () => {
    let originalFetch;

    beforeEach(() => {
        store.country = 'US';
        store.env = 'PRODUCTION';
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it('renders sp-picker with country value', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(
            html`<mas-ost-country-picker></mas-ost-country-picker>`,
        );
        const pickers = el.shadowRoot.querySelectorAll('sp-picker');
        const countryPicker = pickers[1];
        expect(countryPicker).to.exist;
        expect(countryPicker.getAttribute('value')).to.equal('US');
    });

    it('renders sp-switch for env toggle', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(
            html`<mas-ost-country-picker></mas-ost-country-picker>`,
        );
        const toggle = el.shadowRoot.querySelector('sp-switch');
        expect(toggle).to.exist;
        expect(toggle.textContent.trim()).to.equal('Stage');
    });

    it('fetches countries from API and updates picker', async () => {
        globalThis.fetch = () =>
            Promise.resolve({
                json: () =>
                    Promise.resolve([
                        { 'iso2-code': 'DE' },
                        { 'iso2-code': 'US' },
                        { 'iso2-code': 'FR' },
                    ]),
            });
        const el = await fixture(
            html`<mas-ost-country-picker></mas-ost-country-picker>`,
        );
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 50));
        await el.updateComplete;
        const items = el.shadowRoot.querySelectorAll('sp-menu-item');
        expect(items.length).to.be.greaterThan(0);
    });

    it('falls back to static countries on fetch failure', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(
            html`<mas-ost-country-picker></mas-ost-country-picker>`,
        );
        await el.updateComplete;
        const items = el.shadowRoot.querySelectorAll('sp-menu-item');
        expect(items.length).to.be.greaterThan(10);
    });

    it('calls store.setCountry on picker change', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const calls = [];
        const origSetCountry = store.setCountry.bind(store);
        store.setCountry = (val) => {
            calls.push(val);
            origSetCountry(val);
        };
        const el = await fixture(
            html`<mas-ost-country-picker></mas-ost-country-picker>`,
        );
        const pickers = el.shadowRoot.querySelectorAll('sp-picker');
        const picker = pickers[1];
        picker.value = 'DE';
        picker.dispatchEvent(new Event('change'));
        expect(calls).to.include('DE');
        store.setCountry = origSetCountry;
    });
});
