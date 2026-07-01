import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EXPLICIT_EMPTY_SENTINEL, normalizeExplicitEmptyInFields } from '../../../io/www/src/fragment/utils/explicit-empty.js';
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

    it('clears explicit_empty badge after merge when preview omits the field', () => {
        const originalFields = [
            { name: 'badge', values: [EXPLICIT_EMPTY_SENTINEL], multiple: false },
            { name: 'title', values: ['Parent title'], multiple: false },
        ];
        const merged = mergeResolvedPreviewFields(originalFields, { title: 'Parent title' }, {});
        expect(merged.find((field) => field.name === 'badge').values).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);

        const normalized = normalizeExplicitEmptyInFields(merged);
        expect(normalized.find((field) => field.name === 'badge').values).to.deep.equal(['']);
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
    let originalPlaceholdersPreviewByLocale;
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
        originalPlaceholdersPreviewByLocale = Store.placeholders.previewByLocale;

        Store.placeholders.previewByLocale = {
            value: { en_US: { key: 'value' } },
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
        Store.placeholders.previewByLocale = originalPlaceholdersPreviewByLocale;
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

    it('leaves resolved=false when dictionary is not ready so a later subscription fires resolution', () => {
        const fragment = createFragment();
        // Dictionary empty for the active locale: previewDictionaryReady() returns false.
        Store.placeholders.previewByLocale.value = { en_US: {} };

        const store = new PreviewFragmentStore(fragment, null, { lazy: true });
        const getResolvedSpy = sandbox.stub(store, 'getResolvedFragment').resolves(null);

        store.resolveFragment(true);
        expect(store.resolved).to.be.false;
        expect(getResolvedSpy.called).to.be.false;

        // Dictionary arrives; subscription fires synchronous resolve dispatch.
        Store.placeholders.previewByLocale.value = { en_US: { key: 'value' } };
        placeholderSubscribers.forEach((fn) => fn());

        expect(getResolvedSpy.calledOnce).to.be.true;
        store.dispose();
    });

    it('re-resolves when the active locale dictionary changes', async () => {
        const fragment = createFragment();
        const store = new PreviewFragmentStore(fragment, null, { lazy: true });
        // Resolve to a real-looking value so the resolved-locale signature is recorded.
        const resolvedValue = { fields: [] };
        const getResolvedSpy = sandbox.stub(store, 'getResolvedFragment').resolves(resolvedValue);
        sandbox.stub(store, 'replaceFrom');

        // First resolve for en_US.
        store.resolveFragment(true);
        expect(getResolvedSpy.callCount).to.equal(1);
        // Let the resolve promise chain settle so #resolvedDictionarySig is recorded
        // and #resolving is cleared.
        await new Promise((r) => setTimeout(r));

        Store.localeOrRegion.returns('fr_FR');
        Store.placeholders.previewByLocale.value = { en_US: { key: 'value' }, fr_FR: { key: 'valeur' } };
        placeholderSubscribers.forEach((fn) => fn());

        expect(getResolvedSpy.callCount).to.equal(2);
        store.dispose();
    });
});
