// Regression coverage for MWPW-194513.
//
// The fries variant must be registered when only merch-card.js is loaded.
// Consumer pages (e.g. da-cc, cc) reach merch-card via Milo's
// merch-card-autoblock, which loads dist/merch-card.js but never dist/mas.js.
// Pre-fix, registerVariant('fries', ...) lived only in src/mas.js, so
// getFragmentMapping('fries') returned undefined, <merch-card variant="fries">
// resolved variantLayout to undefined, and hydration silently failed inside
// an unawaited promise.
//
// This file deliberately imports ../src/merch-card.js, NOT ../src/mas.js —
// that's the whole point. Adding `import '../src/mas.js'` here would mask
// the regression.
//
// We don't instantiate a card here because connectedCallback requires the
// mas-commerce-service. The registry-lookup contract below is what merch-card
// uses internally to resolve variantLayout, so locking it down is sufficient
// to guarantee fries is reachable from the leaf bundle.
import { expect } from '@esm-bundle/chai';
import '../src/merch-card.js';
import { FRIES_AEM_FRAGMENT_MAPPING } from '../src/variants/fries.js';

describe('merch-card variants registry — leaf bundle (no mas.js)', () => {
    const MerchCard = customElements.get('merch-card');

    it('exposes registry statics on the merch-card class', () => {
        expect(MerchCard, 'merch-card not registered').to.exist;
        expect(MerchCard.getFragmentMapping).to.be.a('function');
    });

    it('registers fries via core variants module so dist/merch-card.js ships it', () => {
        expect(
            MerchCard.getFragmentMapping('fries'),
            'fries fragment mapping missing — registerVariant call is not in src/variants/variants.js',
        ).to.equal(FRIES_AEM_FRAGMENT_MAPPING);
    });

    it('registers other core variants alongside fries (sanity)', () => {
        // Spot-check that we didn't accidentally break the existing registry
        // while moving fries in. plans + catalog have always been in variants.js.
        expect(MerchCard.getFragmentMapping('plans')).to.exist;
        expect(MerchCard.getFragmentMapping('catalog')).to.exist;
    });
});
