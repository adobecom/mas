import { expect } from '@esm-bundle/chai';
import '../../src/editors/merch-card-editor.js';
import { VARIANT_NAMES } from '../../src/editors/variant-picker.js';

/**
 * Verifies the variant gating: plans-bizpro routes "What's included" through
 * the section parser/serializer, while every other variant keeps the shared
 * merch-whats-included path untouched.
 */
describe('merch-card-editor whats-included variant routing', () => {
    function makeEditor(variant, whatsIncludedHtml) {
        const editor = document.createElement('merch-card-editor');
        editor.getEffectiveFieldValue = (key) =>
            key === 'variant' ? variant : key === 'whatsIncluded' ? whatsIncludedHtml : '';
        return editor;
    }

    const SECTIONS =
        '<div class="section"><h4><sp-icon-star class="sp-icon"></sp-icon-star>PDF</h4>' +
        '<ul><li>row a</li><li>row b</li></ul></div>';

    it('parses section markup into bullets for plans-bizpro', () => {
        const editor = makeEditor(VARIANT_NAMES.BIZPRO_PLANS, SECTIONS);
        const { bullets } = editor.whatsIncluded;
        expect(bullets).to.have.lengthOf(1);
        expect(bullets[0].icon).to.equal('sp-icon-star');
        expect(bullets[0].alt).to.equal('<p>PDF</p><p>row a</p><p>row b</p>');
    });

    it('ignores section markup for the shared (plans) path', () => {
        // The standard parser looks for <merch-whats-included>; given section
        // markup it finds none, so the model is empty — proving plans-bizpro
        // logic does not leak into other variants.
        const editor = makeEditor(VARIANT_NAMES.PLANS, SECTIONS);
        const wi = editor.whatsIncluded;
        expect(wi.label).to.equal('');
        expect(wi.bullets).to.have.lengthOf(0);
    });
});
