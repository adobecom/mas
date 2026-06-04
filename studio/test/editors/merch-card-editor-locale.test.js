import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { Fragment } from '../../src/aem/fragment.js';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';

describe('merch-card-editor locale', () => {
    it('sets previewLocaleOverride from regional variation path locale', () => {
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        const parentFragment = new Fragment({
            id: 'parent-id',
            path: '/content/dam/mas/acom/en_US/cards/default',
            fields: [{ name: 'prices', values: ['<span is="inline-price"></span>'] }],
        });
        const variationFragment = new Fragment({
            id: 'variation-id',
            path: '/content/dam/mas/acom/ar_EG/cards/default',
            fields: [{ name: 'prices', values: ['<span is="inline-price"></span>'] }],
        });

        editor.isVariation = true;
        editor.localeDefaultFragment = parentFragment;
        editor.fragmentStore = { get: () => variationFragment };
        editor.willUpdate(new Map());

        expect(editor.previewLocaleOverride).to.equal('ar_EG');
    });

    it('clears previewLocaleOverride for non-variation cards', () => {
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        const fragment = new Fragment({
            id: 'card-id',
            path: '/content/dam/mas/acom/en_US/cards/default',
            fields: [],
        });

        editor.previewLocaleOverride = 'ar_EG';
        editor.isVariation = false;
        editor.localeDefaultFragment = null;
        editor.fragmentStore = { get: () => fragment };
        editor.willUpdate(new Map());

        expect(editor.previewLocaleOverride).to.equal(null);
    });

    it('refreshRenderedPrices calls commerce service refreshOffers', () => {
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        const refreshOffers = sinon.stub();
        const service = document.createElement('mas-commerce-service');
        service.refreshOffers = refreshOffers;
        document.body.append(service);

        editor.refreshRenderedPrices();

        expect(refreshOffers.calledOnce).to.be.true;
        service.remove();
    });
});
