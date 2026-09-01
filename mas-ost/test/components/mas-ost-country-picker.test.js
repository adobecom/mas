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

    async function openDropdown(el) {
        const input = el.shadowRoot.querySelector('sp-textfield.country-input');
        input.dispatchEvent(new Event('focus'));
        await el.updateComplete;
        return el.shadowRoot.querySelectorAll('.country-option');
    }

    it('renders the country typeahead seeded from store.country', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<mas-ost-country-picker></mas-ost-country-picker>`);
        const input = el.shadowRoot.querySelector('sp-textfield.country-input');
        expect(input).to.exist;
        expect(input.getAttribute('placeholder')).to.equal('US');
    });

    it('renders sp-switch for env toggle', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<mas-ost-country-picker></mas-ost-country-picker>`);
        const toggle = el.shadowRoot.querySelector('sp-switch');
        expect(toggle).to.exist;
        expect(toggle.textContent.trim()).to.equal('Stage');
    });

    // fetchCountries() bails out on localhost, which is the host the test
    // runner serves from, so the countries API branch cannot be reached
    // here. Cover the guard itself rather than asserting nothing.
    it('skips the countries fetch on localhost and keeps the static list', async () => {
        let fetched = false;
        globalThis.fetch = () => {
            fetched = true;
            return Promise.reject(new Error('network'));
        };
        const el = await fixture(html`<mas-ost-country-picker></mas-ost-country-picker>`);
        await el.updateComplete;
        expect(fetched).to.be.false;
        const options = await openDropdown(el);
        expect([...options].map((o) => o.textContent.trim())).to.include('US');
    });

    it('renders the full static country list in the dropdown', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<mas-ost-country-picker></mas-ost-country-picker>`);
        await el.updateComplete;
        const options = await openDropdown(el);
        expect(options.length).to.be.greaterThan(10);
    });

    it('calls store.setCountry when a country option is picked', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const calls = [];
        const origSetCountry = store.setCountry.bind(store);
        store.setCountry = (val) => {
            calls.push(val);
            origSetCountry(val);
        };
        const el = await fixture(html`<mas-ost-country-picker></mas-ost-country-picker>`);
        const options = await openDropdown(el);
        const german = [...options].find((o) => o.textContent.trim() === 'DE');
        expect(german).to.exist;
        german.click();
        expect(calls).to.include('DE');
        store.setCountry = origSetCountry;
    });
});
