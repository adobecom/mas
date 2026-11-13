import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import generateFragmentStore from '../../src/reactivity/source-fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { buildInheritanceParent, cachedInheritanceParent, mergeParentFields } from '../../src/aem/variation-utils.js';
import { EXPLICIT_EMPTY_SENTINEL } from '../../../io/www/src/fragment/utils/explicit-empty.js';

const CARD_MODEL = { path: '/conf/mas/settings/dam/cfm/models/card' };

const createCard = (fields, path = '/content/dam/mas/sandbox/en_US/card') =>
    new Fragment({ id: path, path, model: CARD_MODEL, tags: [], fields });

describe('mergeParentFields', () => {
    const parent = {
        fields: [
            { name: 'subtitle', values: ['Parent subtitle'] },
            { name: 'badge', values: ['Parent badge'] },
            { name: 'features', multiple: true, values: ['a'] },
            { name: 'promoText', values: ['Parent promo'] },
            { name: 'callout', values: [] },
        ],
    };

    it('fills empty fields and adds missing ones from the parent', () => {
        const data = mergeParentFields({ fields: [{ name: 'subtitle', values: [''] }] }, parent);

        expect(data.fields.find(({ name }) => name === 'subtitle').values).to.deep.equal(['Parent subtitle']);
        expect(data.fields.find(({ name }) => name === 'promoText').values).to.deep.equal(['Parent promo']);
        expect(data.fields.find(({ name }) => name === 'callout')).to.be.undefined;
    });

    it('keeps own values, the explicit empty sentinel and cleared multi-value fields', () => {
        const data = mergeParentFields(
            {
                fields: [
                    { name: 'subtitle', values: ['Own subtitle'] },
                    { name: 'badge', values: [EXPLICIT_EMPTY_SENTINEL] },
                    { name: 'features', multiple: true, values: [''] },
                ],
            },
            parent,
        );

        expect(data.fields.find(({ name }) => name === 'subtitle').values).to.deep.equal(['Own subtitle']);
        expect(data.fields.find(({ name }) => name === 'badge').values).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);
        expect(data.fields.find(({ name }) => name === 'features').values).to.deep.equal(['']);
    });

    describe('icons', () => {
        const iconParent = {
            fields: [
                { name: 'mnemonicIcon', multiple: true, values: ['parent.svg'] },
                { name: 'mnemonicAlt', multiple: true, values: ['Parent'] },
            ],
        };
        const valuesOf = (data, fieldName) => data.fields.find(({ name }) => name === fieldName)?.values;

        it('inherits the parent icon with its alt text', () => {
            const data = mergeParentFields({ fields: [] }, iconParent);

            expect(valuesOf(data, 'mnemonicIcon')).to.deep.equal(['parent.svg']);
            expect(valuesOf(data, 'mnemonicAlt')).to.deep.equal(['Parent']);
        });

        it('never gives its own icon the parent alt text', () => {
            const data = mergeParentFields(
                { fields: [{ name: 'mnemonicIcon', multiple: true, values: ['own.svg'] }] },
                iconParent,
            );

            expect(valuesOf(data, 'mnemonicAlt')).to.be.undefined;
        });

        it('inherits no icon nor alt text once its icons are cleared', () => {
            const data = mergeParentFields({ fields: [{ name: 'mnemonicIcon', multiple: true, values: [''] }] }, iconParent);

            expect(valuesOf(data, 'mnemonicIcon')).to.deep.equal(['']);
            expect(valuesOf(data, 'mnemonicAlt')).to.be.undefined;
        });

        it('overrides the alt text of the parent icon', () => {
            const data = mergeParentFields({ fields: [{ name: 'mnemonicAlt', multiple: true, values: ['Own'] }] }, iconParent);

            expect(valuesOf(data, 'mnemonicIcon')).to.deep.equal(['parent.svg']);
            expect(valuesOf(data, 'mnemonicAlt')).to.deep.equal(['Own']);
        });
    });
});

describe('SourceFragmentStore of a variation with baselines', () => {
    const VARIATION_PATH = '/content/dam/mas/sandbox/en_AU/card';
    const baselineParent = new Fragment({
        fields: [
            { name: 'subtitle', values: ['Baseline subtitle'] },
            { name: 'promoText', values: ['Baseline promo'] },
            { name: 'mnemonicIcon', multiple: true, values: ['baseline.svg'] },
            { name: 'mnemonicAlt', multiple: true, values: ['Baseline'] },
        ],
    });
    let store;

    const createStore = (variationFields, defaultFields = []) => {
        store = generateFragmentStore(createCard(variationFields, VARIATION_PATH), createCard(defaultFields), { lazy: true });
        sinon.stub(store.previewStore, 'resolveFragment');
        store.setBaselineParent(baselineParent);
        return store;
    };
    const previewValues = (fieldName) => store.previewStore.value.getFieldValues(fieldName);

    afterEach(() => {
        store.previewStore.dispose();
        sinon.restore();
    });

    it('inherits the baseline values its locale default card leaves empty', () => {
        createStore([]);

        expect(store.inheritanceParent.getFieldValues('subtitle')).to.deep.equal(['Baseline subtitle']);
        expect(previewValues('subtitle')).to.deep.equal(['Baseline subtitle']);
    });

    it('inherits the values of its locale default card over the baselines', () => {
        createStore([], [{ name: 'subtitle', values: ['Default subtitle'] }]);

        expect(store.inheritanceParent.getFieldValues('subtitle')).to.deep.equal(['Default subtitle']);
        expect(previewValues('subtitle')).to.deep.equal(['Default subtitle']);
        expect(previewValues('promoText')).to.deep.equal(['Baseline promo']);
    });

    it('clears an inherited baseline value, in the source and the preview', () => {
        createStore([]);

        store.updateField('subtitle', ['']);

        expect(store.get().getFieldValues('subtitle')).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);
        expect(previewValues('subtitle')).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);
    });

    it('previews the values of its locale default card over the baselines when a field gets inherited again', () => {
        createStore([{ name: 'subtitle', values: ['Own subtitle'] }], [{ name: 'subtitle', values: ['Default subtitle'] }]);

        store.updateField('subtitle', ['Default subtitle']);

        expect(previewValues('subtitle')).to.deep.equal(['Default subtitle']);
    });

    it('restores the baseline value its locale default card leaves empty', () => {
        createStore([{ name: 'subtitle', values: ['Own subtitle'] }]);

        store.resetFieldToParent('subtitle');

        expect(previewValues('subtitle')).to.deep.equal(['Baseline subtitle']);
    });

    it('previews its own icon without the alt text of a lower layer', () => {
        createStore([], [{ name: 'mnemonicAlt', multiple: true, values: ['Default'] }]);

        store.updateField('mnemonicIcon', ['own.svg']);

        expect(previewValues('mnemonicIcon')).to.deep.equal(['own.svg']);
        expect(previewValues('mnemonicAlt')).to.deep.equal([]);
    });

    it('previews the inherited icon with its alt text once its own icon is reset', () => {
        createStore([{ name: 'mnemonicIcon', multiple: true, values: ['own.svg'] }]);

        store.resetFieldToParent('mnemonicIcon');

        expect(previewValues('mnemonicIcon')).to.deep.equal(['baseline.svg']);
        expect(previewValues('mnemonicAlt')).to.deep.equal(['Baseline']);
    });

    it('overrides the alt text of the inherited icon', () => {
        createStore([]);

        store.updateField('mnemonicAlt', ['Own']);

        expect(previewValues('mnemonicIcon')).to.deep.equal(['baseline.svg']);
        expect(previewValues('mnemonicAlt')).to.deep.equal(['Own']);
    });
});

describe('SourceFragmentStore.setBaselineParent', () => {
    const baselineParent = new Fragment({ fields: [{ name: 'subtitle', values: ['Baseline subtitle'] }] });
    let store;

    const createStore = (card, parentFragment) => {
        store = generateFragmentStore(card, parentFragment, { lazy: true });
        sinon.stub(store.previewStore, 'resolveFragment');
        return store;
    };

    afterEach(() => {
        store.previewStore.dispose();
        sinon.restore();
    });

    it('hands the baseline parent to the preview and rebuilds it from the source', () => {
        createStore(createCard([{ name: 'subtitle', values: [''] }]));
        store.previewStore.value.fields[0].values = ['Previous baseline subtitle'];

        store.setBaselineParent(baselineParent, 'compare-chart-column');

        expect(store.baselineParent).to.equal(baselineParent);
        expect(store.baselineVariant).to.equal('compare-chart-column');
        expect(store.previewStore.value.getFieldValue('subtitle')).to.equal('Baseline subtitle');
        expect(store.previewStore.resolveFragment.calledOnce).to.be.true;
    });

    it('drops the baseline values from the preview when baselines are turned off', () => {
        createStore(createCard([{ name: 'subtitle', values: [''] }]));
        store.setBaselineParent(baselineParent);

        store.setBaselineParent(null);

        expect(store.baselineParent).to.be.null;
        expect(store.baselineVariant).to.be.null;
        expect(store.previewStore.value.getFieldValue('subtitle')).to.equal('');
    });

    it('keeps a field cleared over the baselines empty in the preview', () => {
        createStore(createCard([{ name: 'subtitle', values: [EXPLICIT_EMPTY_SENTINEL] }]));

        store.setBaselineParent(baselineParent);

        expect(store.previewStore.value.getFieldValues('subtitle')).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);
    });

    it('keeps the locale default values of a variation preview', () => {
        const localeDefault = createCard([{ name: 'cardTitle', values: ['Default title'] }]);
        createStore(createCard([{ name: 'cardTitle', values: [''] }], '/content/dam/mas/sandbox/en_AU/card'), localeDefault);

        store.setBaselineParent(baselineParent);

        expect(store.previewStore.value.getFieldValue('cardTitle')).to.equal('Default title');
    });

    it('does nothing when the baseline parent is unchanged', () => {
        createStore(createCard([]));
        store.setBaselineParent(baselineParent);

        store.setBaselineParent(baselineParent);

        expect(store.previewStore.resolveFragment.calledOnce).to.be.true;
    });
});

describe('buildInheritanceParent', () => {
    const baselineParent = new Fragment({
        fields: [
            { name: 'subtitle', values: ['Baseline subtitle'] },
            { name: 'promoText', values: ['Baseline promo'] },
        ],
    });

    it('is the locale default fragment or the baselines alone', () => {
        const localeDefault = createCard([]);

        expect(buildInheritanceParent(localeDefault, null)).to.equal(localeDefault);
        expect(buildInheritanceParent(null, baselineParent)).to.equal(baselineParent);
        expect(buildInheritanceParent(null, null)).to.be.null;
    });

    it('fills the empty locale default fields with the baselines', () => {
        const localeDefault = createCard([
            { name: 'subtitle', values: ['Default subtitle'] },
            { name: 'promoText', values: [''] },
        ]);

        const parent = buildInheritanceParent(localeDefault, baselineParent);

        expect(parent.getFieldValues('subtitle')).to.deep.equal(['Default subtitle']);
        expect(parent.getFieldValues('promoText')).to.deep.equal(['Baseline promo']);
        expect(localeDefault.getFieldValues('promoText')).to.deep.equal(['']);
    });

    it('is rebuilt only when the parent or the baselines change', () => {
        const inheritanceParent = cachedInheritanceParent();
        const localeDefault = createCard([]);

        const first = inheritanceParent(localeDefault, baselineParent);

        expect(inheritanceParent(localeDefault, baselineParent)).to.equal(first);
        expect(inheritanceParent(localeDefault, null)).to.equal(localeDefault);
    });
});

describe('SourceFragmentStore.updateField with baselines', () => {
    const baselineParent = new Fragment({ fields: [{ name: 'subtitle', values: ['Baseline subtitle'] }] });
    let store;

    beforeEach(() => {
        store = generateFragmentStore(createCard([{ name: 'subtitle', values: ['Own subtitle'] }]), null, { lazy: true });
        sinon.stub(store.previewStore, 'resolveFragment');
        store.setBaselineParent(baselineParent);
    });

    afterEach(() => {
        store.previewStore.dispose();
        sinon.restore();
    });

    it('inherits from the baselines', () => {
        expect(store.inheritanceParent).to.equal(baselineParent);
    });

    it('keeps a cleared optional field empty, in the source and the preview', () => {
        store.updateField('subtitle', ['']);

        expect(store.get().getFieldValues('subtitle')).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);
        expect(store.previewStore.value.getFieldValues('subtitle')).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);
    });

    it('inherits again when the field is set to the baseline value', () => {
        expect(store.updateField('subtitle', ['Baseline subtitle'])).to.equal('reset');

        expect(store.get().getField('subtitle')).to.be.undefined;
        expect(store.previewStore.value.getFieldValues('subtitle')).to.deep.equal(['Baseline subtitle']);
    });

    it('keeps a cleared field empty when the resolved preview is resolved again', async () => {
        sinon.stub(window, 'fetch').callsFake(async () => new Response('{}', { status: 404 }));
        store.updateField('subtitle', ['']);
        store.previewStore.replaceFrom(await store.previewStore.getResolvedFragment());

        const result = await store.previewStore.getResolvedFragment();

        expect(result.fields.find(({ name }) => name === 'subtitle').values).to.deep.equal(['']);
    });

    it('keeps a cleared field empty in the preview after a save', () => {
        store.updateField('subtitle', ['']);

        store.refreshFrom(structuredClone(store.get()));

        expect(store.previewStore.value.getFieldValues('subtitle')).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);
    });
});

describe('SourceFragmentStore compare-chart-column features with baselines', () => {
    const baselineParent = new Fragment({ fields: [{ name: 'features', multiple: true, values: ['template', 'segment'] }] });
    let store;

    const createStore = (variant, features) => {
        const card = createCard([
            { name: 'variant', values: [variant] },
            { name: 'features', multiple: true, values: features },
        ]);
        store = generateFragmentStore(card, null, { lazy: true });
        sinon.stub(store.previewStore, 'resolveFragment');
        store.setBaselineParent(baselineParent);
    };
    const previewFeatures = () => store.previewStore.value.getFieldValues('features');

    afterEach(() => {
        store.previewStore.dispose();
        sinon.restore();
    });

    it('appends the card features to the baseline features in the preview, like delivery', () => {
        createStore('compare-chart-column', ['own']);

        expect(previewFeatures()).to.deep.equal(['template', 'segment', 'own']);
        expect(store.get().getFieldValues('features')).to.deep.equal(['own']);
    });

    it('keeps appending the card features to the baseline features while editing', () => {
        createStore('compare-chart-column', ['own']);

        store.updateField('features', ['own', 'added']);

        expect(previewFeatures()).to.deep.equal(['template', 'segment', 'own', 'added']);
        expect(store.get().getFieldValues('features')).to.deep.equal(['own', 'added']);
    });

    it('shows only the baseline features once the card features are removed', () => {
        createStore('compare-chart-column', ['own']);

        store.updateField('features', []);

        expect(previewFeatures()).to.deep.equal(['template', 'segment']);
    });

    it('shows the baseline features once when the card features are reset to them', () => {
        createStore('compare-chart-column', ['own']);

        expect(store.updateField('features', ['template', 'segment'])).to.equal('reset');

        expect(previewFeatures()).to.deep.equal(['template', 'segment']);
        expect(store.get().getFieldValues('features')).to.deep.equal([]);
    });

    it('appends the card features with the baseline variant when the card has none', () => {
        store = generateFragmentStore(createCard([{ name: 'features', multiple: true, values: ['own'] }]), null, {
            lazy: true,
        });
        sinon.stub(store.previewStore, 'resolveFragment');

        store.setBaselineParent(baselineParent, 'compare-chart-column');

        expect(previewFeatures()).to.deep.equal(['template', 'segment', 'own']);
    });

    it('appends the variation features with the variant of its locale default card when it has none', () => {
        const variation = createCard(
            [{ name: 'features', multiple: true, values: ['own'] }],
            '/content/dam/mas/sandbox/en_AU/card',
        );
        const localeDefault = createCard([{ name: 'variant', values: ['compare-chart-column'] }]);
        store = generateFragmentStore(variation, localeDefault, { lazy: true });
        sinon.stub(store.previewStore, 'resolveFragment');
        store.setBaselineParent(baselineParent);

        store.updateField('features', ['own', 'added']);

        expect(previewFeatures()).to.deep.equal(['template', 'segment', 'own', 'added']);
    });

    it('overrides the baseline features with the card features for other templates', () => {
        createStore('catalog', ['own']);

        store.updateField('features', ['own', 'added']);

        expect(previewFeatures()).to.deep.equal(['own', 'added']);
    });
});
