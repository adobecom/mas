import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-fragment-editor.js';
import Store from '../src/store.js';
import { Fragment } from '../src/aem/fragment.js';
import { PAGE_NAMES } from '../src/constants.js';

describe('MasFragmentEditor', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('renders loading state when no fragment', async () => {
        const el = await fixture(html`<mas-fragment-editor></mas-fragment-editor>`);
        expect(el.querySelector('#loading-state')).to.exist;
    });

    it('extracts locale from path', async () => {
        const el = document.createElement('mas-fragment-editor');
        expect(el.extractLocaleFromPath('/content/dam/mas/surface/en_US/fragment')).to.equal('en_US');
    });

    it('calculates preview attributes correctly', async () => {
        const fragment = new Fragment({
            id: 'test-id',
            fields: [
                { name: 'variant', values: ['plans'] },
                { name: 'size', values: ['wide'] },
                { name: 'cardName', values: ['Test Card'] },
            ],
        });
        const el = document.createElement('mas-fragment-editor');
        el.inEdit.value = { get: () => fragment };

        const mockMapping = { size: ['wide', 'standard'] };
        if (!customElements.get('merch-card')) {
            customElements.define(
                'merch-card',
                class extends HTMLElement {
                    static getFragmentMapping() {
                        return mockMapping;
                    }
                },
            );
        }

        const attrs = el.previewAttributes;
        expect(attrs.variant).to.equal('plans');
        expect(attrs.size).to.equal('wide');
        expect(attrs.name).to.equal('Test Card');
    });

    it('calculates preview CSS custom properties', async () => {
        const fragment = new Fragment({
            id: 'test-id',
            fields: [
                { name: 'backgroundColor', values: ['gray-100'] },
                { name: 'borderColor', values: ['transparent'] },
            ],
        });
        const el = document.createElement('mas-fragment-editor');
        el.inEdit.value = { get: () => fragment };

        const css = el.previewCSSCustomProperties;
        expect(css).to.contain('--merch-card-custom-background-color: var(--spectrum-gray-100)');
        expect(css).to.contain('--consonant-merch-card-border-color: transparent');
    });
});
