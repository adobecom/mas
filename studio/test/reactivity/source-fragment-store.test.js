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

        store.setBaselineParent(baselineParent);

        expect(store.previewStore.baselineParent).to.equal(baselineParent);
        expect(store.previewStore.value.getFieldValue('subtitle')).to.equal('');
        expect(store.previewStore.resolveFragment.calledOnce).to.be.true;
    });

    it('drops the baseline values from the preview when baselines are turned off', () => {
        createStore(createCard([{ name: 'subtitle', values: [''] }]));
        store.setBaselineParent(baselineParent);
        store.previewStore.value.fields[0].values = ['Baseline subtitle'];

        store.setBaselineParent(null);

        expect(store.previewStore.baselineParent).to.be.null;
        expect(store.previewStore.value.getFieldValue('subtitle')).to.equal('');
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
});
