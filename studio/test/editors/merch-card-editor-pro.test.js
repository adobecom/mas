import { expect } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';
import { Fragment } from '../../src/aem/fragment.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { VARIANT_NAMES } from '../../src/editors/variant-picker.js';
import '../../../web-components/src/merch-card.js';
import { getFragmentMapping } from '../../src/utils.js';

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

describe('merch-card-editor pro appearance mapping', () => {
    const mapping = getFragmentMapping(VARIANT_NAMES.PRO);

    function makeAppearanceEditor(variant = VARIANT_NAMES.PRO) {
        const emptyFields = [
            'cardName',
            'osi',
            'cardTitle',
            'subtitle',
            'size',
            'backgroundImage',
            'backgroundImageAltText',
            'description',
            'prices',
            'ctas',
            'backgroundColor',
        ];
        const fragment = new Fragment({
            model: { path: '/conf/mas/settings/dam/cfm/models/card' },
            fields: [{ name: 'variant', values: [variant] }, ...emptyFields.map((name) => ({ name, values: [] }))],
            tags: [],
            title: '',
            description: '',
        });
        const store = new FragmentStore(fragment);
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        editor.fragmentStore = store;
        editor.updateFragment = ({ target }) => {
            store.updateField(target.dataset.field, [target.value]);
        };
        document.body.append(editor);
        return { editor, store };
    }

    async function finishRendering(editor) {
        await editor.updateComplete;
        editor.fieldsReady = true;
        await editor.updateComplete;
    }

    afterEach(() => {
        document.querySelectorAll('merch-card-editor').forEach((editor) => editor.remove());
    });

    it('exposes light and dark through the existing background color field', () => {
        expect(mapping.backgroundColor).to.deep.equal({
            attribute: 'background-color',
            editorLabel: 'Theme',
            specialValues: {
                Light: 'light',
                Dark: 'dark',
            },
        });
    });

    it('exposes wide and edu through the existing size field', () => {
        expect(mapping.size).to.deep.equal(['wide', 'edu']);
    });

    it('renders only Light and Dark for Theme and Default, Wide, and Edu for Size', async () => {
        const { editor } = makeAppearanceEditor();
        await finishRendering(editor);

        const themeGroup = editor.querySelector('sp-field-group#backgroundColor');
        const themePicker = themeGroup.querySelector('sp-picker');
        const sizePicker = editor.querySelector('sp-field-group#size sp-picker');

        expect(themeGroup.querySelector('sp-field-label').textContent.trim()).to.equal('Theme');
        expect(themePicker.value).to.equal('Light');
        expect([...themePicker.querySelectorAll('sp-menu-item')].map((item) => item.value)).to.deep.equal(['Light', 'Dark']);
        expect([...sizePicker.querySelectorAll('sp-menu-item')].map((item) => item.value)).to.deep.equal([
            'Default',
            'wide',
            'edu',
        ]);
        expect([...sizePicker.querySelectorAll('sp-menu-item')].map((item) => item.textContent.trim())).to.deep.equal([
            'Default',
            'Wide',
            'Edu',
        ]);
    });

    it('persists Theme and Size changes through the fragment store', async () => {
        const { editor, store } = makeAppearanceEditor();
        await finishRendering(editor);
        const themePicker = editor.querySelector('sp-field-group#backgroundColor sp-picker');

        themePicker.value = 'Dark';
        themePicker.dispatchEvent(new Event('change'));
        expect(store.get().getFieldValue('backgroundColor')).to.equal('dark');

        themePicker.value = 'Light';
        themePicker.dispatchEvent(new Event('change'));
        expect(store.get().getFieldValue('backgroundColor')).to.equal('light');

        await editor.updateComplete;
        const sizePicker = editor.querySelector('sp-field-group#size sp-picker');
        sizePicker.value = 'edu';
        sizePicker.dispatchEvent(new Event('change'));
        expect(store.get().getFieldValue('size')).to.equal('edu');
    });

    it('displays an unknown stored theme value without masking it as Light', async () => {
        const { editor, store } = makeAppearanceEditor();
        store.get().updateField('backgroundColor', ['gray']);
        await finishRendering(editor);

        const themePicker = editor.querySelector('sp-field-group#backgroundColor sp-picker');
        expect(themePicker.value).to.equal('gray');
    });

    it('keeps the existing Background Color options for a non-pro variant', async () => {
        const { editor } = makeAppearanceEditor(VARIANT_NAMES.HEADLESS);
        await finishRendering(editor);
        const fieldGroup = editor.querySelector('sp-field-group#backgroundColor');
        const picker = fieldGroup.querySelector('sp-picker');

        expect(fieldGroup.querySelector('sp-field-label').textContent.trim()).to.equal('Background Color');
        expect([...picker.querySelectorAll('sp-menu-item')].map((item) => item.value)).to.deep.equal([
            'Default',
            'Transparent',
        ]);
    });
});
