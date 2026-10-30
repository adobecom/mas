import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import generateFragmentStore from '../../src/reactivity/source-fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { mergeParentFields } from '../../src/aem/variation-utils.js';
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
