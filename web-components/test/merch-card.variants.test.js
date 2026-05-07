// MWPW-194513 regression: dist/merch-card.js (loaded by Milo's
// merch-card-autoblock without mas.js) must register the fries variant.
// Importing only ../src/merch-card.js below is intentional.
import { expect } from '@esm-bundle/chai';
import '../src/merch-card.js';
import { FRIES_AEM_FRAGMENT_MAPPING } from '../src/variants/fries.js';

describe('merch-card variants registry (leaf bundle)', () => {
    const MerchCard = customElements.get('merch-card');

    it('exposes the registry on merch-card', () => {
        expect(MerchCard).to.exist;
        expect(MerchCard.getFragmentMapping).to.be.a('function');
    });

    it('registers fries via core variants', () => {
        expect(MerchCard.getFragmentMapping('fries')).to.equal(
            FRIES_AEM_FRAGMENT_MAPPING,
        );
    });

    it('registers plans and catalog (sanity)', () => {
        expect(MerchCard.getFragmentMapping('plans')).to.exist;
        expect(MerchCard.getFragmentMapping('catalog')).to.exist;
    });
});
