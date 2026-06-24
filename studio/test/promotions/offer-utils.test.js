import { expect } from '@esm-bundle/chai';
import { buildOfferTags, resolveOfferMnemonicIconUrl } from '../../src/promotions/offer-utils.js';

describe('buildOfferTags', () => {
    it('maps OST offer fields to mas tag ids and display titles', () => {
        const tags = buildOfferTags(
            {
                product_code: 'FFSA',
                offer_type: 'BASE',
                planType: 'ABM',
                customer_segment: 'INDIVIDUAL',
                market_segments: 'COM',
            },
            'PA-2511',
        );
        expect(tags).to.deep.include({ id: 'mas:product_code/ffsa', title: 'FFSA' });
        expect(tags).to.deep.include({ id: 'mas:product_arrangement/pa-2511', title: 'PA-2511' });
        expect(tags).to.deep.include({ id: 'mas:offer_type/base', title: 'BASE' });
        expect(tags).to.deep.include({ id: 'mas:plan_type/abm', title: 'ABM' });
        expect(tags).to.deep.include({ id: 'mas:customer_segment/individual', title: 'INDIVIDUAL' });
        expect(tags).to.deep.include({ id: 'mas:market_segment/com', title: 'COM' });
    });

    it('uses product_name for product_code tag title when present', () => {
        const tags = buildOfferTags({ product_code: 'ilst', product_name: 'Illustrator' });
        expect(tags).to.deep.include({ id: 'mas:product_code/ilst', title: 'Illustrator' });
    });
});

describe('resolveOfferMnemonicIconUrl', () => {
    it('returns offer icon when present on OST payload', () => {
        expect(resolveOfferMnemonicIconUrl({ icon: 'https://example.com/icon.svg' })).to.equal('https://example.com/icon.svg');
    });

    it('resolves icon from product_name when product_code does not match ADOBE_PRODUCTS', () => {
        const url = resolveOfferMnemonicIconUrl({ product_code: 'ilst', product_name: 'Illustrator' });
        expect(url).to.equal('https://www.adobe.com/cc-shared/assets/img/product-icons/svg/illustrator.svg');
    });

    it('resolves icon from productArrangement.productFamily when product_code is absent', () => {
        const url = resolveOfferMnemonicIconUrl({
            productArrangement: { productCode: 'phsp', productFamily: 'Photoshop' },
        });
        expect(url).to.equal('https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg');
    });
});
