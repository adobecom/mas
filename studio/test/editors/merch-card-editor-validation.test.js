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
    it('renders no banner when the fragment is valid', () => {
        const editor = makeEditor([]);
        expect(editor.renderValidationBanner()).to.equal(nothing);
    });

    it('lists every property and message in the banner verbatim', () => {
        const editor = makeEditor([
            { property: 'fields.ctas.values[0].<list element>', message: 'is not valid HTML' },
            { property: 'path', message: 'path is required' },
        ]);
        const text = renderToText(editor.renderValidationBanner());
        expect(text).to.include('fields.ctas.values[0].<list element>');
        expect(text).to.include('is not valid HTML');
        expect(text).to.include('path');
        expect(text).to.include('path is required');
    });
});
