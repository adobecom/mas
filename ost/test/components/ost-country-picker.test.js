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
        expect(el.shadowRoot.querySelector('sp-picker[data-testid="ost-filter-country"]')).to.exist;
        expect(el.shadowRoot.querySelector('sp-textfield')).to.be.null;
    });

    it('reflects the current store country as the picker value', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        const picker = el.shadowRoot.querySelector('sp-picker[data-testid="ost-filter-country"]');
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
        const items = el.shadowRoot.querySelectorAll('sp-picker[data-testid="ost-filter-country"] sp-menu-item');
        expect(items.length).to.be.greaterThan(0);
    });

    it('falls back to static countries on fetch failure', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const items = el.shadowRoot.querySelectorAll('sp-picker[data-testid="ost-filter-country"] sp-menu-item');
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
        const picker = el.shadowRoot.querySelector('sp-picker[data-testid="ost-filter-country"]');
        picker.value = 'DE';
        picker.dispatchEvent(new Event('change'));
        expect(calls).to.include('DE');
        store.setCountry = origSetCountry;
    });

    it('renders exactly one sp-menu-item per country in the countries array', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const items = el.shadowRoot.querySelectorAll('sp-picker[data-testid="ost-filter-country"] sp-menu-item');
        const values = Array.from(items).map((item) => item.getAttribute('value'));
        expect(items.length).to.equal(el.countries.length);
        expect(values).to.deep.equal(el.countries);
    });

    it('updates store country to the dispatched picker value, not a fixed default', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const picker = el.shadowRoot.querySelector('sp-picker[data-testid="ost-filter-country"]');
        picker.value = 'JP';
        picker.dispatchEvent(new Event('change'));
        expect(store.country).to.equal('JP');
        expect(store.country).to.not.equal('US');
    });

    it('renders the landscape control as an sp-picker with its options', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        const landscape = el.shadowRoot.querySelector('sp-picker[data-testid="ost-filter-landscape"]');
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

    it('notifies subscribers when the landscape picker value changes', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        let notified = false;
        const listener = () => {
            notified = true;
        };
        store.addEventListener('state-changed', listener);
        const pickers = el.shadowRoot.querySelectorAll('sp-picker');
        const landscape = Array.from(pickers).find((p) => !p.classList.contains('country-input'));
        landscape.value = 'BOTH';
        landscape.dispatchEvent(new Event('change'));
        store.removeEventListener('state-changed', listener);
        expect(notified).to.be.true;
    });

    it('sets store.language to the mapped language for a mapped country code', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const picker = el.shadowRoot.querySelector('sp-picker[data-testid="ost-filter-country"]');
        picker.value = 'JP';
        picker.dispatchEvent(new Event('change'));
        expect(store.language).to.equal('ja');
    });

    it('sets store.language to a different mapped language for another mapped code', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const picker = el.shadowRoot.querySelector('sp-picker[data-testid="ost-filter-country"]');
        picker.value = 'DE';
        picker.dispatchEvent(new Event('change'));
        expect(store.language).to.equal('de');
    });

    it('falls back store.language to en for an unmapped country code', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        store.language = 'fr';
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const picker = el.shadowRoot.querySelector('sp-picker[data-testid="ost-filter-country"]');
        picker.value = 'ZZ';
        picker.dispatchEvent(new Event('change'));
        expect(store.country).to.equal('ZZ');
        expect(store.language).to.equal('en');
    });

    it('switches store.env to STAGE when the switch is checked', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const toggle = el.shadowRoot.querySelector('sp-switch');
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change'));
        expect(store.env).to.equal('STAGE');
    });

    it('switches store.env to PRODUCTION when the switch is unchecked', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network'));
        store.env = 'STAGE';
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        const toggle = el.shadowRoot.querySelector('sp-switch');
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
        expect(store.env).to.equal('PRODUCTION');
    });

    it('calls fetchCountries on connect, returning early on localhost without replacing static countries', async () => {
        let fetchCalled = false;
        globalThis.fetch = () => {
            fetchCalled = true;
            return Promise.reject(new Error('network'));
        };
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 50));
        expect(window.location.hostname).to.equal('localhost');
        expect(fetchCalled).to.be.false;
        expect(el.countries.length).to.be.greaterThan(10);
    });

    it('replaces countries with the fetched, mapped, sorted list when not on localhost', async () => {
        globalThis.fetch = () =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ 'iso2-code': 'US' }, { 'iso2-code': 'DE' }, { 'iso2-code': 'FR' }]),
            });
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        el.isLocalhost = () => false;
        await el.fetchCountries();
        expect(el.countries).to.deep.equal(['DE', 'FR', 'US']);
    });

    it('appends the current store country and re-sorts when the fetched list omits it', async () => {
        store.country = 'JP';
        globalThis.fetch = () =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ 'iso2-code': 'US' }, { 'iso2-code': 'DE' }]),
            });
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        el.isLocalhost = () => false;
        await el.fetchCountries();
        expect(el.countries).to.include('JP');
        expect(el.countries).to.deep.equal(['DE', 'JP', 'US']);
    });

    it('keeps the static fallback when the countries request returns a non-ok response', async () => {
        globalThis.fetch = () => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve([]) });
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        const fallback = el.countries;
        el.isLocalhost = () => false;
        await el.fetchCountries();
        expect(el.countries).to.equal(fallback);
        expect(el.countries.length).to.be.greaterThan(10);
    });

    it('keeps the static fallback when the countries fetch rejects off localhost', async () => {
        globalThis.fetch = () => Promise.reject(new Error('network down'));
        const el = await fixture(html`<ost-country-picker></ost-country-picker>`);
        const fallback = el.countries;
        el.isLocalhost = () => false;
        await el.fetchCountries();
        expect(el.countries).to.equal(fallback);
        expect(el.countries.length).to.be.greaterThan(10);
    });
});
