import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/editors/variant-picker.js';
import { VARIANTS, VARIANT_NAMES } from '../../src/editors/variant-picker.js';
import { spTheme } from '../utils.js';

describe('VariantPicker', () => {
    it('should render the sp-picker', async () => {
        const el = await fixture(html`<variant-picker></variant-picker>`, { parentNode: spTheme() });
        const picker = el.shadowRoot.querySelector('sp-picker');
        expect(picker).to.exist;
    });

    it('should exclude "all" variant by default (showAll is falsy)', async () => {
        const el = await fixture(html`<variant-picker></variant-picker>`, { parentNode: spTheme() });
        expect(el.showAll).to.not.be.true;
        const allItems = el.shadowRoot.querySelectorAll('sp-menu-item');
        const values = Array.from(allItems).map((item) => item.getAttribute('value'));
        expect(values).to.not.include('all');
    });

    it('should include "all" variant when show-all attribute is set', async () => {
        const el = await fixture(html`<variant-picker show-all></variant-picker>`, { parentNode: spTheme() });
        expect(el.showAll).to.be.true;
        const allItems = el.shadowRoot.querySelectorAll('sp-menu-item');
        const values = Array.from(allItems).map((item) => item.getAttribute('value'));
        expect(values).to.include('all');
    });

    it('should reflect given value on the picker', async () => {
        const el = await fixture(html`<variant-picker value="plans"></variant-picker>`, { parentNode: spTheme() });
        expect(el.value).to.equal('plans');
        const picker = el.shadowRoot.querySelector('sp-picker');
        expect(picker.value).to.equal('plans');
    });

    it('should update value when picker change event fires', async () => {
        const el = await fixture(html`<variant-picker value="plans"></variant-picker>`, { parentNode: spTheme() });
        const picker = el.shadowRoot.querySelector('sp-picker');
        picker.value = 'catalog';
        picker.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;
        expect(el.value).to.equal('catalog');
    });

    it('should be disabled when the disabled attribute is set', async () => {
        const el = await fixture(html`<variant-picker disabled></variant-picker>`, { parentNode: spTheme() });
        const picker = el.shadowRoot.querySelector('sp-picker');
        expect(picker.disabled).to.be.true;
    });

    it('should not be disabled by default', async () => {
        const el = await fixture(html`<variant-picker></variant-picker>`, { parentNode: spTheme() });
        const picker = el.shadowRoot.querySelector('sp-picker');
        expect(picker.disabled).to.be.false;
    });

    it('should use defaultValue when value is not set', async () => {
        const el = await fixture(html`<variant-picker default-value="segment"></variant-picker>`, {
            parentNode: spTheme(),
        });
        const picker = el.shadowRoot.querySelector('sp-picker');
        expect(picker.value).to.equal('segment');
    });

    describe('VARIANTS', () => {
        it('should include mini-compare-chart variant', () => {
            const mcc = VARIANTS.find((v) => v.value === VARIANT_NAMES.MINI_COMPARE_CHART);
            expect(mcc).to.exist;
            expect(mcc.label).to.equal('Mini Compare Chart');
        });

        it('should include mini-compare-chart-mweb variant', () => {
            const mccMweb = VARIANTS.find((v) => v.value === VARIANT_NAMES.MINI_COMPARE_CHART_MWEB);
            expect(mccMweb).to.exist;
            expect(mccMweb.label).to.equal('Mini Compare Chart Mweb');
        });

        it('should include the "all" variant', () => {
            const all = VARIANTS.find((v) => v.value === VARIANT_NAMES.ALL);
            expect(all).to.exist;
        });

        it('should include plans variant', () => {
            const plans = VARIANTS.find((v) => v.value === VARIANT_NAMES.PLANS);
            expect(plans).to.exist;
        });
    });
});
