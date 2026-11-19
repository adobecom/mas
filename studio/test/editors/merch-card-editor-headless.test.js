import { expect } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';
import { Fragment } from '../../src/aem/fragment.js';
import generateFragmentStore from '../../src/reactivity/source-fragment-store.js';
import { VARIANT_NAMES } from '../../src/editors/variant-picker.js';
import '../../../web-components/src/merch-card.js';

describe('merch-card-editor fragment title preview', () => {
    function makeEditor(variant, title) {
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
            title,
            description: '',
        });
        const store = generateFragmentStore(fragment);
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        editor.fragmentStore = store;
        document.body.append(editor);
        return { editor, store };
    }

    async function finishRendering(editor) {
        await editor.updateComplete;
        editor.fieldsReady = true;
        await editor.updateComplete;
    }

    const text = (editor, selector) => editor.querySelector(selector).textContent;

    afterEach(() => {
        document.querySelectorAll('merch-card-editor').forEach((editor) => editor.remove());
    });

    it('splits title at first colon into bold and grey parts', async () => {
        const { editor } = makeEditor(VARIANT_NAMES.HEADLESS, 'MERCH: [BLOCK]: Photoshop: Individual');
        await finishRendering(editor);
        const preview = editor.querySelector('#fragment-title-preview');
        expect(preview).to.exist;
        expect(text(editor, '.fragment-title-preview-label')).to.equal('Fragment title preview');
        expect(text(editor, '.fragment-title-preview-emphasis')).to.equal('MERCH');
        expect(text(editor, '.fragment-title-preview-rest')).to.equal(': [BLOCK]: Photoshop: Individual');
        expect(preview.querySelector('input, sp-textfield, button, sp-action-button')).to.not.exist;
    });

    it('shows an all-bold title when there is no colon and renders an empty title without error', async () => {
        for (const [title, emphasis] of [
            ['Photoshop', 'Photoshop'],
            ['', ''],
            [undefined, ''],
        ]) {
            const { editor } = makeEditor(VARIANT_NAMES.HEADLESS, title);
            await finishRendering(editor);
            expect(text(editor, '.fragment-title-preview-label')).to.equal('Fragment title preview');
            expect(text(editor, '.fragment-title-preview-emphasis')).to.equal(emphasis);
            expect(text(editor, '.fragment-title-preview-rest')).to.equal('');
            editor.remove();
        }
    });

    it('does not render the title preview for non-headless templates', async () => {
        for (const variant of [
            VARIANT_NAMES.PLANS,
            VARIANT_NAMES.MINI,
            VARIANT_NAMES.MARQUEE,
            VARIANT_NAMES.FAQ,
            VARIANT_NAMES.BANNER_BLADE,
        ]) {
            const { editor } = makeEditor(variant, 'MERCH: Title');
            await finishRendering(editor);
            expect(editor.querySelector('#fragment-title-preview'), variant).to.not.exist;
            editor.remove();
        }
    });

    it('updates the preview when the title is edited', async () => {
        const { editor, store } = makeEditor(VARIANT_NAMES.HEADLESS, 'OLD: Title');
        await finishRendering(editor);
        store.updateFieldInternal('title', 'NEW: Rest');
        await editor.updateComplete;
        expect(text(editor, '.fragment-title-preview-emphasis')).to.equal('NEW');
        expect(text(editor, '.fragment-title-preview-rest')).to.equal(': Rest');
    });
});
