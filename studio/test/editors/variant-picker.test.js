import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/editors/variant-picker.js';
import { VARIANTS, VARIANT_NAMES, getVariantTreeData } from '../../src/editors/variant-picker.js';
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

    describe('getVariantTreeData', () => {
        it('should return only CC templates for acom-cc surface', () => {
            const result = getVariantTreeData('acom-cc');
            const names = result.map((v) => v.name);
            expect(names).to.include('product');
            expect(names).to.include('segment');
            expect(names).to.include('mini-compare-chart');
            expect(names).to.include('image');
            expect(names).to.include('special-offers');
            expect(names).to.not.include('plans');
            expect(names).to.not.include('catalog');
            expect(names).to.not.include('ccd-slice');
            expect(names.length).to.equal(5);
        });

        it('should return only DC templates for acom-dc surface', () => {
            const result = getVariantTreeData('acom-dc');
            const names = result.map((v) => v.name);
            expect(names).to.include('product');
            expect(names).to.include('segment');
            expect(names).to.include('mini-compare-chart');
            expect(names).to.include('image');
            expect(names).to.not.include('special-offers');
            expect(names).to.not.include('plans');
            expect(names.length).to.equal(4);
        });

        it('should return only plans/catalog templates for acom surface', () => {
            const result = getVariantTreeData('acom');
            const names = result.map((v) => v.name);
            expect(names).to.include('plans');
            expect(names).to.include('plans-v2');
            expect(names).to.include('plans-students');
            expect(names).to.include('plans-education');
            expect(names).to.include('catalog');
            expect(names).to.include('media');
            expect(names).to.include('mini-compare-chart-mweb');
            expect(names).to.not.include('product');
            expect(names).to.not.include('segment');
            expect(names).to.not.include('image');
            expect(names).to.not.include('special-offers');
        });

        it('should return all variants for sandbox surface', () => {
            const result = getVariantTreeData('sandbox');
            const names = result.map((v) => v.name);
            expect(names).to.include('product');
            expect(names).to.include('plans');
            expect(names).to.include('ccd-slice');
        });
    });
});
