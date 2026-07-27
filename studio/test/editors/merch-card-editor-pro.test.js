import { expect } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';
import { Fragment } from '../../src/aem/fragment.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { VARIANT_NAMES } from '../../src/editors/variant-picker.js';

/**
 * Verifies the variant gating: pro routes "What's included" through
 * the section parser/serializer, while every other variant keeps the shared
 * merch-whats-included path untouched.
 */
describe('merch-card-editor whats-included variant routing', () => {
    function makeEditor(variant, whatsIncludedHtml) {
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        editor.fragmentStore = new FragmentStore(
            new Fragment({
                fields: [
                    { name: 'variant', values: [variant] },
                    { name: 'whatsIncluded', values: [whatsIncludedHtml] },
                ],
            }),
        );
        return editor;
    }

    const SECTIONS =
        '<div class="section"><h4><sp-icon-star class="sp-icon"></sp-icon-star>PDF</h4>' +
        '<ul><li>row a</li><li>row b</li></ul></div>';

    it('parses section markup into bullets for pro', () => {
        const editor = makeEditor(VARIANT_NAMES.PRO, SECTIONS);
        const { bullets } = editor.whatsIncluded;
        expect(bullets).to.have.lengthOf(1);
        expect(bullets[0].icon).to.equal('sp-icon-star');
        expect(bullets[0].alt).to.equal('<p>PDF</p><p>row a</p><p>row b</p>');
    });

    it('parses the toggle label for pro and exposes it to the label input', () => {
        const editor = makeEditor(VARIANT_NAMES.PRO, `<p class="whats-included-label">Voir le contenu :</p>${SECTIONS}`);
        const wi = editor.whatsIncluded;
        expect(wi.label).to.equal('Voir le contenu :');
        expect(wi.bullets).to.have.lengthOf(1);
    });

    it('keeps an empty label for pre-label pro markup', () => {
        const editor = makeEditor(VARIANT_NAMES.PRO, SECTIONS);
        expect(editor.whatsIncluded.label).to.equal('');
    });

    it('opens a stored bizpro fragment with pro-gated behavior', () => {
        const editor = makeEditor('bizpro', SECTIONS);

        expect(editor.getEffectiveFieldValue('variant')).to.equal(VARIANT_NAMES.PRO);
        expect(editor.whatsIncluded.bullets).to.have.lengthOf(1);
    });

    it('ignores section markup for the shared (plans) path', () => {
        // The standard parser looks for <merch-whats-included>; given section
        // markup it finds none, so the model is empty — proving pro
        // logic does not leak into other variants.
        const editor = makeEditor(VARIANT_NAMES.PLANS, SECTIONS);
        const wi = editor.whatsIncluded;
        expect(wi.label).to.equal('');
        expect(wi.bullets).to.have.lengthOf(0);
    });
});
