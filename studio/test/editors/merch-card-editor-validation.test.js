import { expect } from '@open-wc/testing';
import { nothing, render } from 'lit';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';
import { Fragment } from '../../src/aem/fragment.js';

const renderToText = (template) => {
    const container = document.createElement('div');
    render(template, container);
    return container.textContent;
};

const makeEditor = (validationStatus) => {
    const MerchCardEditor = customElements.get('merch-card-editor');
    const editor = new MerchCardEditor();
    const fragment = new Fragment({
        id: 'x',
        path: '/content/dam/mas/sandbox/en_US/card',
        fields: [{ name: 'ctas', values: ['<a>x</a>'] }],
        validationStatus,
    });
    editor.fragmentStore = { get: () => fragment };
    return editor;
};

describe('merch-card-editor validationStatus', () => {
    it('renders no field indicator when the field has no validation error', () => {
        const editor = makeEditor([]);
        expect(editor.renderFieldValidationIndicator('ctas')).to.equal(nothing);
    });

    it('anchors the verbatim message to the matching field', () => {
        const editor = makeEditor([{ property: 'fields.ctas.values[0].<list element>', message: 'is not valid HTML' }]);
        expect(renderToText(editor.renderFieldValidationIndicator('ctas'))).to.include('is not valid HTML');
    });

    it('does not anchor an error to an unrelated field', () => {
        const editor = makeEditor([{ property: 'fields.ctas.values[0].<list element>', message: 'is not valid HTML' }]);
        expect(editor.renderFieldValidationIndicator('cardTitle')).to.equal(nothing);
    });

    it('surfaces field validation even when the fragment is not a variation', () => {
        const editor = makeEditor([{ property: 'fields.ctas.values[0].<list element>', message: 'is not valid HTML' }]);
        editor.isVariation = false;
        expect(editor.renderFieldStatusIndicator('ctas')).to.not.equal(nothing);
    });

    it('renders no banner when the fragment is valid', () => {
        const editor = makeEditor([]);
        expect(editor.renderValidationBanner()).to.equal(nothing);
    });

    it('lists unanchored errors in the banner', () => {
        const editor = makeEditor([{ property: 'path', message: 'path is required' }]);
        expect(renderToText(editor.renderValidationBanner())).to.include('path is required');
    });
});
