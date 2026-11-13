import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';
import { Fragment } from '../../src/aem/fragment.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { CARD_MODEL_PATH } from '../../src/constants.js';

const customFields = (values, labels) => [
    { name: 'customFields', values },
    { name: 'customFieldLabels', values: labels },
];

describe('merch-card-editor custom field saved state', () => {
    function makeEditor(fields, parentFields, fragmentData = {}) {
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        editor.fragmentStore = new FragmentStore(
            new Fragment({ path: '/content/dam/mas/sandbox/en_US/card', fields, ...fragmentData }),
        );
        if (parentFields) {
            editor.localeDefaultFragment = new Fragment({
                path: '/content/dam/mas/sandbox/en_US/parent',
                fields: parentFields,
            });
            editor.isVariation = true;
        }
        return editor;
    }

    it('flags fields loaded from the saved card', () => {
        const editor = makeEditor(customFields(['<p>a</p>'], ['A']));
        expect(editor.customFieldValues).to.deep.equal([{ value: '<p>a</p>', label: 'A', saved: true }]);
    });

    it('does not flag a field added since the last save', () => {
        const editor = makeEditor(customFields(['<p>a</p>'], ['A']));
        editor.fragmentStore.updateField('customFields', ['<p>a</p>', '']);
        editor.fragmentStore.updateField('customFieldLabels', ['A', 'New']);
        expect(editor.customFieldValues[1]).to.deep.equal({ label: 'New' });
    });

    it('flags a saved field that has no label', () => {
        const editor = makeEditor(customFields(['<p>a</p>'], ['']));
        expect(editor.customFieldValues[0].saved).to.be.true;
    });

    it('keeps a saved field flagged after a new field is dragged above it', () => {
        const editor = makeEditor(customFields(['<p>a</p>'], ['A']));
        editor.fragmentStore.updateField('customFields', ['', '<p>a</p>']);
        editor.fragmentStore.updateField('customFieldLabels', ['New', 'A']);
        expect(editor.customFieldValues.map((item) => Boolean(item.saved))).to.deep.equal([false, true]);
    });

    it('flags fields a variation inherits from its parent', () => {
        const editor = makeEditor(customFields([], []), customFields(['<p>a</p>'], ['A']));
        expect(editor.customFieldValues[0].saved).to.be.true;
    });

    it('does not flag a new field when saved labels contain duplicates', () => {
        const editor = makeEditor(customFields(['<p>a</p>', '<p>b</p>'], ['A', 'A']));
        editor.fragmentStore.updateField('customFields', ['<p>a</p>', '<p>b</p>', '']);
        editor.fragmentStore.updateField('customFieldLabels', ['A', 'A', 'New']);
        expect(editor.customFieldValues[2].saved).to.be.undefined;
    });

    it('does not flag a blank saved row', () => {
        const editor = makeEditor(customFields(['', '<p>b</p>'], ['', 'B']));
        expect(editor.customFieldValues[0].saved).to.be.undefined;
    });

    it('keeps an unnamed saved field flagged after a new field is dragged above it', () => {
        const editor = makeEditor(customFields(['<p>a</p>'], ['']));
        editor.fragmentStore.updateField('customFields', ['', '<p>a</p>']);
        editor.fragmentStore.updateField('customFieldLabels', ['New', '']);
        expect(editor.customFieldValues.map((item) => Boolean(item.saved))).to.deep.equal([false, true]);
    });

    it('does not flag a blank row placed above an unnamed saved field', () => {
        const editor = makeEditor(customFields(['<p>a</p>'], ['']));
        editor.fragmentStore.updateField('customFields', ['', '<p>a</p>']);
        editor.fragmentStore.updateField('customFieldLabels', ['', '']);
        expect(editor.customFieldValues.map((item) => Boolean(item.saved))).to.deep.equal([false, true]);
    });

    it('reads the saved card once per fragment refresh', () => {
        const editor = makeEditor(customFields(['<p>a</p>'], ['A']));
        editor.customFieldValues;
        const clone = sinon.spy(window, 'structuredClone');
        try {
            editor.customFieldValues;
            expect(clone.callCount).to.equal(0);
        } finally {
            clone.restore();
        }
    });

    it('flags a field as saved once the fragment is refreshed with it', () => {
        const editor = makeEditor(customFields(['<p>a</p>'], ['A']));
        editor.fragmentStore.updateField('customFields', ['<p>a</p>', '<p>b</p>']);
        editor.fragmentStore.updateField('customFieldLabels', ['A', 'B']);
        expect(editor.customFieldValues[1].saved).to.be.undefined;
        editor.fragmentStore.refreshFrom(editor.fragmentStore.get());
        expect(editor.customFieldValues[1].saved).to.be.true;
    });

    describe('multifield events', () => {
        const emptyFields = [
            'addonConfirmation',
            'backgroundColor',
            'backgroundImage',
            'backgroundImageAltText',
            'backgrounds',
            'borderColor',
            'callout',
            'cardName',
            'cardTitle',
            'ctas',
            'description',
            'enableBaselines',
            'image',
            'osi',
            'perUnitLabel',
            'prices',
            'promoCode',
            'promoText',
            'shortDescription',
            'size',
            'subtitle',
        ].map((name) => ({ name, values: [] }));

        async function renderEditor(fields) {
            const editor = makeEditor([{ name: 'variant', values: ['plans'] }, ...emptyFields, ...fields], undefined, {
                model: { path: CARD_MODEL_PATH },
                tags: [],
                title: '',
                description: '',
            });
            document.body.append(editor);
            await editor.updateComplete;
            editor.fieldsReady = true;
            await editor.updateComplete;
            return editor;
        }

        function emitChange(editor, items) {
            const multifield = editor.querySelector('#customFields mas-multifield');
            multifield.value = items;
            multifield.dispatchEvent(new CustomEvent('change'));
        }

        afterEach(() => {
            document.querySelectorAll('merch-card-editor').forEach((editor) => editor.remove());
        });

        it('keeps an unnamed saved field flagged after its value is edited', async () => {
            const editor = await renderEditor(customFields(['<p>a</p>'], ['']));
            emitChange(editor, [{ value: '<p>b</p>', saved: true }]);
            expect(editor.customFieldValues).to.deep.equal([{ value: '<p>b</p>', saved: true }]);
        });

        it('follows the saved flag carried by reordered items', async () => {
            const editor = await renderEditor(customFields(['<p>a</p>'], ['']));
            emitChange(editor, [{ label: 'New' }, { value: '<p>a</p>', saved: true }]);
            expect(editor.customFieldValues.map((item) => Boolean(item.saved))).to.deep.equal([false, true]);
        });
    });
});
