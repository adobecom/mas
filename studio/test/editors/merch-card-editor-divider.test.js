import { expect } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';

describe('merch-card-editor whats-included divider', () => {
    it('createIncludedElement applies divider attribute when token is set', () => {
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        const el = editor.createIncludedElement('Label', [], [], 'spectrum-red-700-plans');
        expect(el?.getAttribute('whats-included-divider-color')).to.equal('spectrum-red-700-plans');
    });

    it('createIncludedElement omits divider attribute for Default token', () => {
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        const el = editor.createIncludedElement('Label', [], [], 'default');
        expect(el?.hasAttribute('whats-included-divider-color')).to.be.false;
    });
});
