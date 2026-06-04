import { expect, fixture, html } from '@open-wc/testing';
import { store } from '../../src/store/ost-store.js';
import '../../src/components/ost-country-picker.js';

describe('ost-country-picker', () => {
    let originalFetch;

    beforeEach(() => {
        store.country = 'US';
        store.env = 'PRODUCTION';
        store.landscape = 'PUBLISHED';
        originalFetch = globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        store.country = 'US';
        store.env = 'PRODUCTION';
        store.landscape = 'PUBLISHED';
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

    it('renders exactly one sp-menu-item per country in the countries array', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const items = el.shadowRoot.querySelectorAll('sp-picker.country-input sp-menu-item');
        const values = Array.from(items).map((item) => item.getAttribute('value'));
        expect(items.length).to.equal(el.countries.length);
        expect(values).to.deep.equal(el.countries);
    });

    it('updates store country to the dispatched picker value, not a fixed default', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const picker = el.shadowRoot.querySelector('sp-picker.country-input');
        picker.value = 'JP';
        picker.dispatchEvent(new Event('change'));
        expect(store.country).to.equal('JP');
        expect(store.country).to.not.equal('US');
    });

    it('renders the landscape control as an sp-picker with its options', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        const pickers = el.shadowRoot.querySelectorAll('sp-picker');
        const landscape = Array.from(pickers).find((p) => !p.classList.contains('country-input'));
        expect(landscape).to.exist;
        expect(landscape.tagName.toLowerCase()).to.equal('sp-picker');
        const values = Array.from(landscape.querySelectorAll('sp-menu-item')).map((i) => i.getAttribute('value'));
        expect(values).to.include('PUBLISHED');
        expect(values).to.include('DRAFT');
        expect(values).to.include('BOTH');
    });

    it('sets store.landscape when the landscape picker value changes', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const pickers = el.shadowRoot.querySelectorAll('sp-picker');
        const landscape = Array.from(pickers).find((p) => !p.classList.contains('country-input'));
        landscape.value = 'DRAFT';
        landscape.dispatchEvent(new Event('change'));
        expect(store.landscape).to.equal('DRAFT');
        expect(store.landscape).to.not.equal('PUBLISHED');
    });
});
