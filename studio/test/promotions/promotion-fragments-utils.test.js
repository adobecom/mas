import { expect } from '@esm-bundle/chai';
import { nothing } from 'lit';
import { Fragment } from '../../src/aem/fragment.js';
import Store from '../../src/store.js';
import { CARD_MODEL_PATH } from '../../src/constants.js';
import {
    getPromotionFragmentName,
    promotionProductOfferTitle,
    promotionVariantDisplayLabel,
    renderPromotionFragmentStatusCell,
} from '../../src/promotions/promotion-fragments-utils.js';

describe('promotion-fragments-utils', () => {
    let originalSearchValue;

    beforeEach(() => {
        originalSearchValue = Store.search.get();
        Store.search.set({ ...originalSearchValue, path: 'acom' });
    });

    afterEach(() => {
        Store.search.set(originalSearchValue);
    });

    it('promotionProductOfferTitle returns mas:product_code tag title', () => {
        const item = {
            tags: [{ id: 'mas:product_code/cc', title: 'Creative Cloud' }],
        };
        expect(promotionProductOfferTitle(item)).to.equal('Creative Cloud');
    });

    it('promotionProductOfferTitle returns empty string when missing', () => {
        expect(promotionProductOfferTitle(null)).to.equal('');
        expect(promotionProductOfferTitle({ tags: [] })).to.equal('');
    });

    it('promotionVariantDisplayLabel maps known variant values', () => {
        expect(promotionVariantDisplayLabel('catalog')).to.equal('Catalog');
    });

    it('getPromotionFragmentName formats a card fragment', () => {
        const fragment = new Fragment({
            path: '/content/dam/mas/acom/en_US/cards/test',
            model: { path: CARD_MODEL_PATH },
            title: 'Test Card',
            fields: [
                { name: 'name', values: ['test-card'] },
                { name: 'cardTitle', values: ['Test Card'] },
                { name: 'variant', values: ['catalog'] },
            ],
            tags: [],
        });
        const name = getPromotionFragmentName(fragment);
        expect(name).to.match(/^merch-card: ACOM/);
        expect(name).to.include('Catalog');
    });

    it('getPromotionFragmentName returns empty string for null', () => {
        expect(getPromotionFragmentName(null)).to.equal('');
    });

    it('getPromotionFragmentName uses Fragment label when model path is unknown', () => {
        const fragment = new Fragment({
            path: '/content/dam/mas/acom/en_US/cards/test',
            model: { path: '/unknown/model' },
            title: 'X',
            fields: [{ name: 'name', values: ['x'] }],
            tags: [],
        });
        const name = getPromotionFragmentName(fragment);
        expect(name).to.match(/^Fragment:/);
    });

    it('renderPromotionFragmentStatusCell returns nothing when status is falsy', () => {
        expect(renderPromotionFragmentStatusCell()).to.equal(nothing);
    });
});
