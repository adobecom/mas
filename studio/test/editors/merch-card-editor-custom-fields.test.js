import { expect } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';
import { Fragment } from '../../src/aem/fragment.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';

const customFields = (values, labels) => [
    { name: 'customFields', values },
    { name: 'customFieldLabels', values: labels },
];

describe('merch-card-editor custom field saved state', () => {
    function makeEditor(fields, parentFields) {
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        editor.fragmentStore = new FragmentStore(new Fragment({ path: '/content/dam/mas/sandbox/en_US/card', fields }));
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
});
