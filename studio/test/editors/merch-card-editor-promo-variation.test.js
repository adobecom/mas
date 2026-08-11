import { expect } from '@open-wc/testing';
import { render } from 'lit';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';
import { Fragment } from '../../src/aem/fragment.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';

describe('merch-card-editor promo variation geo tags', () => {
    let sandbox;

    function makeEditor(path, pznTagsValues) {
        const MerchCardEditor = customElements.get('merch-card-editor');
        const editor = new MerchCardEditor();
        editor.fragmentStore = new FragmentStore(
            new Fragment({
                path,
                fields: [{ name: 'pznTags', values: pznTagsValues }],
                tags: [],
            }),
        );
        return editor;
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        document.querySelectorAll('merch-card-editor').forEach((editor) => editor.remove());
    });

    describe('promo variation created from a default (parent) fragment', () => {
        const promoFromDefaultFragmentPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';

        it('shows the geo tags picked at creation', () => {
            const editor = makeEditor(promoFromDefaultFragmentPath, ['mas:pzn/country/ar', 'mas:locale/fr_FR']);
            expect(editor.promoGeoTags).to.deep.equal(['mas:pzn/country/ar', 'mas:locale/fr_FR']);
        });

        it('removes a geo tag', () => {
            const editor = makeEditor(promoFromDefaultFragmentPath, ['mas:pzn/country/ar', 'mas:locale/fr_FR']);
            const updateFieldSpy = sandbox.spy(editor.fragmentStore, 'updateField');
            const container = document.createElement('div');
            document.body.appendChild(container);
            render(editor.promoVariationGeoTagsTemplate, container);

            const tag = Array.from(container.querySelectorAll('sp-tag')).find((t) => t.textContent.trim() === 'ar');
            tag.dispatchEvent(new CustomEvent('delete', { cancelable: true }));

            expect(updateFieldSpy.calledOnce).to.be.true;
            expect(updateFieldSpy.firstCall.args).to.deep.equal(['pznTags', ['mas:locale/fr_FR']]);
            container.remove();
        });

        it('adds a new geo tag', () => {
            const editor = makeEditor(promoFromDefaultFragmentPath, ['mas:pzn/country/ar']);
            const updateFieldSpy = sandbox.spy(editor.fragmentStore, 'updateField');
            const container = document.createElement('div');
            document.body.appendChild(container);
            render(editor.promoVariationGeoTagsTemplate, container);

            const geosPicker = container.querySelector('mas-promo-variation-geos');
            geosPicker.dispatchEvent(
                new CustomEvent('change', { detail: { value: ['mas:pzn/country/ar', 'mas:locale/de_DE'] } }),
            );

            expect(updateFieldSpy.calledOnce).to.be.true;
            expect(updateFieldSpy.firstCall.args).to.deep.equal(['pznTags', ['mas:pzn/country/ar', 'mas:locale/de_DE']]);
            container.remove();
        });
    });

    describe('promo variation created from a grouped variation', () => {
        const promoFromGroupedVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card/pzn/edu';

        it('excludes the grouped-variation personalization tag from promoGeoTags', () => {
            const editor = makeEditor(promoFromGroupedVariationPath, ['mas:pzn/edu', 'mas:pzn/country/ar']);
            expect(editor.promoGeoTags).to.deep.equal(['mas:pzn/country/ar']);
        });

        it('preserves the personalization tag when removing a promo geo tag', () => {
            const editor = makeEditor(promoFromGroupedVariationPath, ['mas:pzn/edu', 'mas:pzn/country/ar']);
            const updateFieldSpy = sandbox.spy(editor.fragmentStore, 'updateField');
            const container = document.createElement('div');
            document.body.appendChild(container);
            render(editor.promoVariationGeoTagsTemplate, container);

            const tag = Array.from(container.querySelectorAll('sp-tag')).find((t) => t.textContent.trim() === 'ar');
            tag.dispatchEvent(new CustomEvent('delete', { cancelable: true }));

            expect(updateFieldSpy.calledOnce).to.be.true;
            expect(updateFieldSpy.firstCall.args).to.deep.equal(['pznTags', ['mas:pzn/edu']]);
            container.remove();
        });

        it('preserves the personalization tag when adding a new promo geo tag', () => {
            const editor = makeEditor(promoFromGroupedVariationPath, ['mas:pzn/edu']);
            const updateFieldSpy = sandbox.spy(editor.fragmentStore, 'updateField');
            const container = document.createElement('div');
            document.body.appendChild(container);
            render(editor.promoVariationGeoTagsTemplate, container);

            const geosPicker = container.querySelector('mas-promo-variation-geos');
            geosPicker.dispatchEvent(new CustomEvent('change', { detail: { value: ['mas:pzn/country/de'] } }));

            expect(updateFieldSpy.calledOnce).to.be.true;
            expect(updateFieldSpy.firstCall.args).to.deep.equal(['pznTags', ['mas:pzn/edu', 'mas:pzn/country/de']]);
            container.remove();
        });
    });
});
