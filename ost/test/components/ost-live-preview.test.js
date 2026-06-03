import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-placeholder-panel.js';
import { store } from '../../src/store/ost-store.js';

describe('ost-live-preview', () => {
    beforeEach(() => {
        store.selectedOffer = { offer_id: 'TEST123', offer_type: 'BASE' };
        store.selectedOsi = 'test-osi';
        store.masCommerceService = { createInlinePrice: () => document.createElement('span') };
        store.promotionCode = undefined;
        store.storedPromoOverride = undefined;
    });

    afterEach(() => {
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
        store.masCommerceService = null;
        store.promotionCode = undefined;
        store.storedPromoOverride = undefined;
        store.country = 'US';
        store.landscape = 'PUBLISHED';
    });

    async function getPreview() {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        return panel.shadowRoot.querySelector('ost-live-preview');
    }

    it('puts the context promotionCode into placeholderOptions when no override is set', async () => {
        store.promotionCode = 'CONTEXT30';
        const preview = await getPreview();
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.promotionCode).to.equal('CONTEXT30');
    });

    it('prefers the typed override over the context promotionCode', async () => {
        store.promotionCode = 'CONTEXT30';
        store.setPromoCode('MANUAL10');
        const preview = await getPreview();
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.promotionCode).to.equal('MANUAL10');
    });

    it('passes the store country into placeholderOptions', async () => {
        store.country = 'GB';
        const preview = await getPreview();
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.country).to.equal('GB');
    });

    it('passes the store landscape into placeholderOptions', async () => {
        store.landscape = 'DRAFT';
        const preview = await getPreview();
        const result = preview.buildPlaceholderOptions();
        expect(result.placeholderOptions.landscape).to.equal('DRAFT');
    });
});
