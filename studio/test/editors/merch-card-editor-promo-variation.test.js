import { expect } from '@open-wc/testing';
import { nothing, render } from 'lit';
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

        it('renders only the promo geo tags editor, not the grouped-variation tags editor', () => {
            const editor = makeEditor(promoFromGroupedVariationPath, ['mas:pzn/edu', 'mas:pzn/country/ar']);
            expect(editor.groupedVariationTagsTemplate).to.equal(nothing);
            expect(editor.promoVariationGeoTagsTemplate).to.not.equal(nothing);
        });
    });

    describe('inherited custom fields', () => {
        const promoFromDefaultFragmentPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
        const defaultFragmentPath = '/content/dam/mas/sandbox/en_US/my-card';

        function makeDefaultFragment(labels, values = labels.map(() => '')) {
            return new Fragment({
                path: defaultFragmentPath,
                fields: [
                    { name: 'customFieldLabels', values: labels },
                    { name: 'customFields', values },
                ],
                tags: [],
            });
        }

        it("returns exactly the default fragment's non-empty labels on a promo variation", () => {
            const editor = makeEditor(promoFromDefaultFragmentPath, []);
            editor.localeDefaultFragment = makeDefaultFragment(['Field A', '', 'Field B']);
            expect(editor.inheritedCustomFieldLabels).to.deep.equal(new Set(['Field A', 'Field B']));
        });

        it('returns no inherited labels on a default (non-promo) fragment', () => {
            const editor = makeEditor(defaultFragmentPath, []);
            editor.localeDefaultFragment = makeDefaultFragment(['Field A']);
            expect(editor.inheritedCustomFieldLabels).to.deep.equal(new Set());
        });

        it('marks inherited rows and leaves a locally added label unmarked', () => {
            const editor = makeEditor(promoFromDefaultFragmentPath, []);
            editor.localeDefaultFragment = makeDefaultFragment(['Field A']);
            editor.fragmentStore = new FragmentStore(
                new Fragment({
                    path: promoFromDefaultFragmentPath,
                    fields: [
                        { name: 'customFieldLabels', values: ['Field A', 'Local Field'] },
                        { name: 'customFields', values: ['value a', 'value b'] },
                    ],
                    tags: [],
                }),
            );

            expect(editor.customFieldValues).to.deep.equal([
                { value: 'value a', label: 'Field A', inherited: true },
                { value: 'value b', label: 'Local Field' },
            ]);
        });

        it('rejects a submission that renames or drops an inherited label', () => {
            const editor = makeEditor(promoFromDefaultFragmentPath, []);
            editor.localeDefaultFragment = makeDefaultFragment(['Field A', 'Field B']);

            expect(editor.removesInheritedCustomFieldLabel(['Field A', 'Field B'])).to.be.false;
            expect(editor.removesInheritedCustomFieldLabel(['Field A', 'Renamed'])).to.be.true;
            expect(editor.removesInheritedCustomFieldLabel(['Field A'])).to.be.true;
        });
    });
});
