import { expect } from '@esm-bundle/chai';
import '../src/swc.js';
import '../src/mas-chat.js';

const RAW_PRODUCTS = [
    {
        arrangement_code: 'ccsn_direct_individual',
        product_code: 'CCSN',
        product_family: 'CC_ALL_APPS',
        name: 'Creative Cloud Pro',
        copy: { name: 'Creative Cloud Pro' },
        assets: { icons: { svg: 'https://example.com/cc.svg' } },
    },
    {
        arrangement_code: 'phsp_direct_individual',
        product_code: 'PHSP',
        product_family: 'CC_ALL_APPS',
        name: 'Photoshop',
        copy: { name: 'Adobe Photoshop' },
        assets: { icons: { svg: 'https://example.com/phsp.svg' } },
    },
];

function cardlessGuidedStep() {
    return {
        type: 'guided_step',
        message: 'I found multiple products matching your search. Review the details and select one:',
    };
}

describe('MasChat enrichGuidedStepWithRecentProducts', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('mas-chat');
    });

    it('injects the products from the last lookup into a cardless product step', async () => {
        el.recentProducts = RAW_PRODUCTS;
        const enriched = await el.enrichGuidedStepWithRecentProducts(cardlessGuidedStep());
        expect(enriched.productCards).to.have.length(2);
        expect(enriched.productCards[0].value).to.equal('ccsn_direct_individual');
        expect(enriched.productCards[0].label).to.equal('Creative Cloud Pro');
        expect(enriched.message).to.include('found multiple products');
    });

    it('consumes the remembered products so they cannot leak into later steps', async () => {
        el.recentProducts = RAW_PRODUCTS;
        await el.enrichGuidedStepWithRecentProducts(cardlessGuidedStep());
        const second = await el.enrichGuidedStepWithRecentProducts(cardlessGuidedStep());
        expect(second.productCards).to.equal(undefined);
    });

    it('leaves a step that already carries productCards untouched', async () => {
        el.recentProducts = RAW_PRODUCTS;
        const response = {
            type: 'guided_step',
            message: 'Found your product:',
            productCards: [{ label: 'Existing', value: 'existing_code' }],
        };
        const enriched = await el.enrichGuidedStepWithRecentProducts(response);
        expect(enriched.productCards).to.have.length(1);
        expect(enriched.productCards[0].value).to.equal('existing_code');
        expect(el.recentProducts).to.have.length(2);
    });

    it('leaves a buttonGroup step untouched even when products are remembered', async () => {
        el.recentProducts = RAW_PRODUCTS;
        const response = {
            type: 'guided_step',
            message: 'What type of offering should this card feature?',
            buttonGroup: { label: 'Offering Type', options: [{ label: 'Monthly', value: 'MONTH|MONTHLY' }] },
        };
        const enriched = await el.enrichGuidedStepWithRecentProducts(response);
        expect(enriched.productCards).to.equal(undefined);
        expect(el.recentProducts).to.have.length(2);
    });

    it('does nothing when no recent lookup is remembered', async () => {
        const enriched = await el.enrichGuidedStepWithRecentProducts(cardlessGuidedStep());
        expect(enriched.productCards).to.equal(undefined);
    });

    it('skips non-product messages so unrelated cardless steps stay plain', async () => {
        el.recentProducts = RAW_PRODUCTS;
        const response = { type: 'guided_step', message: 'Please confirm your locale to continue.' };
        const enriched = await el.enrichGuidedStepWithRecentProducts(response);
        expect(enriched.productCards).to.equal(undefined);
        expect(el.recentProducts).to.have.length(2);
    });
});
