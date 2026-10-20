import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { EXPLICIT_EMPTY_SENTINEL, normalizeExplicitEmptyInFields } from '../../../io/www/src/fragment/utils/explicit-empty.js';
import {
    mergeResolvedPreviewFields,
    PreviewFragmentStore,
    serializePreviewFields,
} from '../../src/reactivity/preview-fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import { Promotion } from '../../src/aem/promotion.js';
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

    it('previewLocale getter prefers the override over the global locale', () => {
        const store = new PreviewFragmentStore(createFragment(), null, { lazy: true });
        expect(store.previewLocale).to.equal('en_US');
        store.previewLocaleOverride = 'de_DE';
        expect(store.previewLocale).to.equal('de_DE');
        store.dispose();
    });

    it('keys dictionary readiness off previewLocaleOverride, not the global locale', () => {
        const fragment = createFragment();
        // Global locale (en_US) dictionary is ready, but the override locale's is not.
        Store.placeholders.previewByLocale.value = { en_US: { key: 'value' }, de_DE: {} };

        const store = new PreviewFragmentStore(fragment, null, { lazy: true });
        store.previewLocaleOverride = 'de_DE';
        const getResolvedSpy = sandbox.stub(store, 'getResolvedFragment').resolves(null);

        store.resolveFragment(true);
        expect(getResolvedSpy.called).to.be.false;

        Store.placeholders.previewByLocale.value = { en_US: { key: 'value' }, de_DE: { key: 'wert' } };
        placeholderSubscribers.forEach((fn) => fn());

        expect(getResolvedSpy.calledOnce).to.be.true;
        store.dispose();
    });

    describe('countdown dates', () => {
        const SENTINEL_FIELDS = [{ name: 'description', values: ['<p>Ends <a href="#">countdown-timer</a></p>'] }];
        const DATES = { cdtStart: '2026-02-01T00:00:00Z', cdtEnd: '2026-02-10T00:00:00Z' };
        const NONE = { cdtStart: undefined, cdtEnd: undefined };
        let repository;
        let service;
        let originalList;
        let originalListValue;

        // Raw author JSON, as the AEM search yields it: no Fragment methods.
        const rawProject = () => ({
            id: 'p1',
            path: '/content/dam/mas/promotions/p1',
            tags: [{ id: 'mas:promotion/p1' }],
            fields: [
                { name: 'cdtStart', values: [DATES.cdtStart] },
                { name: 'cdtEnd', values: [DATES.cdtEnd] },
            ],
        });

        const createStore = (overrides) => {
            const store = new PreviewFragmentStore(createFragment(overrides), null, { lazy: true });
            sandbox.stub(store, 'previewPublishedFragment').resolves({
                body: { promoProject: 'Black Friday' },
                promoProjects: [{ label: 'Black Friday', project: DATES }],
            });
            return store;
        };
        const variation = () => ({
            path: '/content/dam/mas/test/en_US/promotions/p1/fragment',
            tags: [{ id: 'mas:promotion/p1' }],
        });

        beforeEach(() => {
            originalList = Store.promotions.list.data;
            originalListValue = originalList.get();
            originalList.set([]);
            originalList.removeMeta('listFetched');
            repository = {
                getPromotionsPath: () => '/content/dam/mas/promotions',
                searchFragmentList: sandbox.stub().resolves([rawProject()]),
                loadPromotions: sandbox.stub().resolves(),
            };
            service = { settings: { instant: '2026-02-05T00:00:00Z' } };
            const query = sandbox.stub(document, 'querySelector').callThrough();
            query.withArgs('mas-repository').returns(repository);
            query.withArgs('mas-commerce-service').callsFake(() => service);
        });

        afterEach(() => {
            originalList.set(originalListValue);
            originalList.removeMeta('listFetched');
        });

        it('makes no read for a card without the sentinel', async () => {
            const store = createStore();
            expect(await store.getCountdownDates([{ name: 'description', values: ['<p>plain</p>'] }])).to.deep.equal(NONE);
            expect(store.previewPublishedFragment.called).to.be.false;
            expect(repository.searchFragmentList.called).to.be.false;
            store.dispose();
        });

        it('resolves countdown dates and locale into the preview without changing the authored fragment', async () => {
            sandbox.stub(window, 'fetch').callsFake(async () => new Response('{}', { status: 404 }));
            const description = '<p>Offer <a href="#">countdown-timer</a></p>';
            Store.placeholders.previewByLocale.value.ko_KR = { 'offer-description': JSON.stringify(description).slice(1, -1) };
            const source = createFragment({
                fields: [
                    { name: 'variant', values: ['pro'] },
                    { name: 'description', values: ['{{offer-description}}'] },
                ],
            });
            const store = createStore(source);
            store.previewLocaleOverride = 'ko_KR';

            const result = await store.getResolvedFragment();

            expect(result.fields.find((field) => field.name === 'description').values).to.deep.equal([description]);
            expect(result).to.include({ ...DATES, previewLocale: 'ko_KR' });
            expect(source.getFieldValue('description')).to.equal('{{offer-description}}');
            expect(source.cdtStart).to.be.undefined;
            expect(source.previewLocale).to.be.undefined;
            expect(store.value.cdtStart).to.be.undefined;

            store.replaceFrom(result);
            store.value.updateField('description', ['<p>Offer without a timer</p>']);
            const cleared = await store.getResolvedFragment();

            expect(cleared.cdtStart).to.be.undefined;
            expect(cleared.cdtEnd).to.be.undefined;
            expect(cleared.previewLocale).to.equal('ko_KR');
            expect(store.previewPublishedFragment.calledOnce).to.be.true;
            expect(repository.searchFragmentList.called).to.be.false;
            store.dispose();
        });

        it('takes a default card dates from the pipeline-selected project provenance', async () => {
            const store = createStore({ id: 'card-id' });
            expect(await store.getCountdownDates(SENTINEL_FIELDS)).to.deep.equal(DATES);
            expect(store.previewPublishedFragment.calledOnce).to.be.true;
            // Only the saved fragment id and request settings leave: never the unsaved authored fields.
            expect(store.previewPublishedFragment.firstCall.args).to.deep.equal([
                'card-id',
                { locale: 'en_US', country: 'US', instant: '2026-02-05T00:00:00Z', fullContext: true },
            ]);
            expect(repository.searchFragmentList.called).to.be.false;
            store.dispose();
        });

        it('reuses the pipeline result across refreshes and re-asks when id, locale or instant change', async () => {
            const store = createStore({ id: 'card-id' });
            await store.getCountdownDates(SENTINEL_FIELDS);
            await store.getCountdownDates(SENTINEL_FIELDS);
            await store.getCountdownDates(SENTINEL_FIELDS);
            expect(store.previewPublishedFragment.callCount).to.equal(1);
            store.previewLocaleOverride = 'ko_KR';
            await store.getCountdownDates(SENTINEL_FIELDS);
            expect(store.previewPublishedFragment.callCount).to.equal(2);
            service.settings.instant = '2026-03-01T00:00:00Z';
            await store.getCountdownDates(SENTINEL_FIELDS);
            expect(store.previewPublishedFragment.callCount).to.equal(3);
            store.dispose();
        });

        it('asks again once the cached pipeline result is 30 seconds old', async () => {
            const clock = sandbox.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
            const store = createStore({ id: 'card-id' });
            await store.getCountdownDates(SENTINEL_FIELDS);
            clock.tick(29000);
            await store.getCountdownDates(SENTINEL_FIELDS);
            expect(store.previewPublishedFragment.callCount).to.equal(1);
            clock.tick(1000);
            await store.getCountdownDates(SENTINEL_FIELDS);
            expect(store.previewPublishedFragment.callCount).to.equal(2);
            store.dispose();
        });

        it('does not cache a failed pipeline read', async () => {
            const store = createStore();
            store.previewPublishedFragment.onFirstCall().rejects(new Error('boom'));
            sandbox.stub(console, 'warn');
            expect(await store.getCountdownDates(SENTINEL_FIELDS)).to.deep.equal(NONE);
            expect(await store.getCountdownDates(SENTINEL_FIELDS)).to.deep.equal(DATES);
            expect(store.previewPublishedFragment.callCount).to.equal(2);
            store.dispose();
        });

        it('requests the pipeline with the preview locale country and omits an unset instant', async () => {
            service.settings.instant = undefined;
            const store = createStore();
            store.previewLocaleOverride = 'ko_KR';
            await store.getCountdownDates(SENTINEL_FIELDS);
            expect(store.previewPublishedFragment.firstCall.args[1]).to.deep.equal({
                locale: 'ko_KR',
                country: 'KR',
                fullContext: true,
            });
            store.dispose();
        });

        it('clears dates when the pipeline selects no project', async () => {
            const store = createStore();
            store.previewPublishedFragment.resolves({ body: {}, promoProjects: [] });
            expect(await store.getCountdownDates(SENTINEL_FIELDS)).to.deep.equal(NONE);
            store.dispose();
        });

        it('skips the pipeline for a card that cannot be a MAS default card', async () => {
            const store = createStore({ path: '/somewhere/else' });
            expect(await store.getCountdownDates(SENTINEL_FIELDS)).to.deep.equal(NONE);
            expect(store.previewPublishedFragment.called).to.be.false;
            store.dispose();
        });

        it('clears dates when the pipeline read fails', async () => {
            const store = createStore();
            store.previewPublishedFragment.rejects(new Error('boom'));
            sandbox.stub(console, 'warn');
            expect(await store.getCountdownDates(SENTINEL_FIELDS)).to.deep.equal(NONE);
            store.dispose();
        });

        it('takes a promo variation dates from its tagged project via a cold raw search, never loadPromotions', async () => {
            const store = createStore(variation());
            expect(await store.getCountdownDates(SENTINEL_FIELDS)).to.deep.equal(DATES);
            await store.getCountdownDates(SENTINEL_FIELDS);
            expect(repository.searchFragmentList.calledOnce).to.be.true;
            expect(repository.searchFragmentList.firstCall.args[0].path).to.equal('/content/dam/mas/promotions');
            expect(repository.loadPromotions.called).to.be.false;
            expect(store.previewPublishedFragment.called).to.be.false;
            store.dispose();
        });

        it('uses the loaded promotions list for a promo variation instead of searching', async () => {
            Store.promotions.list.data.set([{ get: () => new Promotion(rawProject()) }]);
            const store = createStore(variation());
            expect(await store.getCountdownDates(SENTINEL_FIELDS)).to.deep.equal(DATES);
            expect(repository.searchFragmentList.called).to.be.false;
            store.dispose();
        });

        it('clears dates when the promo variation project read fails', async () => {
            repository.searchFragmentList.rejects(new Error('boom'));
            sandbox.stub(console, 'warn');
            const store = createStore(variation());
            expect(await store.getCountdownDates(SENTINEL_FIELDS)).to.deep.equal(NONE);
            store.dispose();
        });

        it('delegates the published read to the fragment client', async () => {
            sandbox.stub(window, 'fetch').rejects(new Error('offline'));
            const store = new PreviewFragmentStore(createFragment(), null, { lazy: true });
            const read = store.previewPublishedFragment('card-id', { locale: 'en_US' });
            expect(read).to.be.instanceOf(Promise);
            await read.catch(() => {});
            store.dispose();
        });

        it('replaces then clears previous dates on the preview fragment only', () => {
            const source = createFragment();
            const store = new PreviewFragmentStore(new Fragment(structuredClone(source)), null, { lazy: true });
            store.replaceFrom({ cdtStart: 'a', cdtEnd: 'b', previewLocale: 'ko_KR' });
            expect(store.value.cdtStart).to.equal('a');
            expect(store.value.previewLocale).to.equal('ko_KR');
            store.replaceFrom({ cdtStart: undefined, cdtEnd: undefined, previewLocale: 'ko_KR' });
            expect(store.value.cdtStart).to.be.undefined;
            expect(store.value.cdtEnd).to.be.undefined;
            expect(source.cdtStart).to.be.undefined;
            expect(source.previewLocale).to.be.undefined;
            expect(structuredClone(store.value).previewLocale).to.equal('ko_KR');
            store.dispose();
        });
    });
});
