import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    mergeResolvedPreviewFields,
    PreviewFragmentStore,
    serializePreviewFields,
} from '../../src/reactivity/preview-fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import Store from '../../src/store.js';

describe('serializePreviewFields', () => {
    it('omits single-value settings inherit sentinels from preview payloads', () => {
        const result = serializePreviewFields([
            { name: 'showSecureLabel', values: [''] },
            { name: 'showPlanType', values: [''] },
            { name: 'addon', values: [''] },
            { name: 'description', values: [''] },
            { name: 'tags', multiple: true, values: [''] },
        ]);

        expect(result).to.not.have.property('showSecureLabel');
        expect(result).to.not.have.property('showPlanType');
        expect(result).to.not.have.property('addon');
        expect(result.description).to.equal('');
        expect(result.tags).to.deep.equal(['']);
    });

    it('keeps explicit setting values in preview payloads', () => {
        const result = serializePreviewFields([
            { name: 'showSecureLabel', values: ['true'] },
            { name: 'showPlanType', values: ['false'] },
            { name: 'addon', values: ['{{addon-stock-trial}}'] },
        ]);

        expect(result.showSecureLabel).to.equal('true');
        expect(result.showPlanType).to.equal('false');
        expect(result.addon).to.equal('{{addon-stock-trial}}');
    });
});

describe('mergeResolvedPreviewFields', () => {
    it('uses resolved field values from the preview response', () => {
        const result = mergeResolvedPreviewFields(
            [
                { name: 'variant', values: ['plans'] },
                { name: 'addon', values: [] },
            ],
            { variant: 'plans', addon: '<p>Resolved addon</p>' },
        );

        expect(result.find((field) => field.name === 'addon')?.values).to.deep.equal(['<p>Resolved addon</p>']);
    });

    it('backfills inherited settings from resolvedSettings when not in resolvedFields', () => {
        const result = mergeResolvedPreviewFields(
            [
                { name: 'variant', values: ['plans'] },
                { name: 'addon', values: [] },
                { name: 'showPlanType', values: [] },
                { name: 'showSecureLabel', values: [] },
            ],
            { variant: 'plans' },
            { addon: '<p>Resolved addon</p>', showPlanType: 'true', showSecureLabel: 'true' },
        );

        expect(result.find((field) => field.name === 'addon')?.values).to.deep.equal(['<p>Resolved addon</p>']);
        expect(result.find((field) => field.name === 'showPlanType')?.values).to.deep.equal(['true']);
        expect(result.find((field) => field.name === 'showSecureLabel')?.values).to.deep.equal(['true']);
    });

    it('preserves unresolved author fields instead of writing undefined', () => {
        const result = mergeResolvedPreviewFields(
            [
                { name: 'addon', values: [] },
                { name: 'showPlanType', values: [''] },
            ],
            {},
            {},
        );

        expect(result.find((field) => field.name === 'addon')?.values).to.deep.equal([]);
        expect(result.find((field) => field.name === 'showPlanType')?.values).to.deep.equal(['']);
    });

    it('does not mutate the original field objects', () => {
        const originalFields = [
            { name: 'variant', values: ['plans'] },
            { name: 'addon', values: [] },
        ];

        const result = mergeResolvedPreviewFields(originalFields, { variant: 'business' }, { addon: '<p>Resolved addon</p>' });

        expect(originalFields[0].values).to.deep.equal(['plans']);
        expect(originalFields[1].values).to.deep.equal([]);
        expect(result[0].values).to.deep.equal(['business']);
        expect(result[1].values).to.deep.equal(['<p>Resolved addon</p>']);
        expect(result[0]).to.not.equal(originalFields[0]);
        expect(result[1]).to.not.equal(originalFields[1]);
    });
});

describe('PreviewFragmentStore', () => {
    let sandbox;
    let placeholderSubscribers;
    let originalPlaceholdersPreview;
    let originalSurface;
    let originalLocaleOrRegion;

    const createFragment = (overrides = {}) =>
        new Fragment({
            id: 'test-fragment-id',
            path: '/content/dam/mas/test/en_US/fragment',
            model: { path: '/conf/mas/settings/dam/cfm/models/card' },
            fields: [
                { name: 'variant', values: ['catalog'] },
                { name: 'title', values: ['Test'] },
            ],
            ...overrides,
        });

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        placeholderSubscribers = [];
        originalPlaceholdersPreview = Store.placeholders.preview;

        Store.placeholders.preview = {
            value: { key: 'value' },
            subscribe: (fn) => {
                placeholderSubscribers.push(fn);
                return fn;
            },
            unsubscribe: sandbox.stub(),
        };

        originalSurface = Store.surface;
        Store.surface = sandbox.stub().returns('acom');

        originalLocaleOrRegion = Store.localeOrRegion;
        Store.localeOrRegion = sandbox.stub().returns('en_US');

        sandbox.stub(customElements, 'get').returns(null);
    });

    afterEach(() => {
        sandbox.restore();
        Store.placeholders.preview = originalPlaceholdersPreview;
        Store.surface = originalSurface;
        Store.localeOrRegion = originalLocaleOrRegion;
    });

    it('lazy: true does NOT call resolveFragment in constructor', () => {
        const fragment = createFragment();
        const store = new PreviewFragmentStore(fragment, null, { lazy: true });
        expect(store.lazy).to.be.true;
        expect(store.resolved).to.be.false;
        store.dispose();
    });

    it('lazy: true ignores placeholder subscription updates', () => {
        const fragment = createFragment();
        const store = new PreviewFragmentStore(fragment, null, { lazy: true });

        placeholderSubscribers.forEach((fn) => fn());

        expect(store.lazy).to.be.true;
        expect(store.resolved).to.be.false;
        store.dispose();
    });

    it('resolveFragment sets lazy to false', () => {
        const fragment = createFragment();
        const store = new PreviewFragmentStore(fragment, null, { lazy: true });
        expect(store.lazy).to.be.true;

        store.resolveFragment();
        expect(store.lazy).to.be.false;
        store.dispose();
    });
});
