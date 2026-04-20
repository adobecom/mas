import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/swc.js';
import { Fragment } from '../src/aem/fragment.js';
import Store from '../src/store.js';
import { CARD_MODEL_PATH } from '../src/constants.js';
import '../src/mas-content.js';

describe('MasContent table + personalization grouping', () => {
    let snapshot;

    beforeEach(() => {
        const f = Store.filters.get();
        const list = Store.fragments.list.data;
        snapshot = {
            renderMode: Store.renderMode.get(),
            filters: {
                locale: f.locale,
                tags: f.tags,
                personalizationFilterEnabled: f.personalizationFilterEnabled,
            },
            search: Store.search.get(),
            fragmentListValue: list.value,
            loading: Store.fragments.list.loading.get(),
            firstPageLoaded: Store.fragments.list.firstPageLoaded.get(),
        };
        Store.search.set({ path: 'acom' });
        Store.fragments.list.loading.set(false);
        Store.fragments.list.firstPageLoaded.set(true);
    });

    afterEach(() => {
        Store.renderMode.set(snapshot.renderMode);
        Store.filters.set(snapshot.filters);
        Store.search.set(snapshot.search);
        /** Bypass `.set()` so structuredClone is not applied to FragmentStore-like mocks. */
        Store.fragments.list.data.value = snapshot.fragmentListValue;
        Store.fragments.list.loading.set(snapshot.loading);
        Store.fragments.list.firstPageLoaded.set(snapshot.firstPageLoaded);
    });

    const makeFragment = (overrides = {}) =>
        new Fragment({
            id: 'frag-id',
            path: '/content/dam/mas/acom/en_US/cards/x',
            title: 'T',
            status: 'PUBLISHED',
            model: { path: CARD_MODEL_PATH },
            fields: [],
            tags: [],
            ...overrides,
        });

    /** Minimal FragmentStore shape for mas-fragment-table ReactiveController */
    const makeStore = (fragment) => {
        const subs = [];
        return {
            get: () => fragment,
            value: fragment,
            subscribe: (fn) => {
                if (!subs.includes(fn)) subs.push(fn);
                fn(fragment, fragment);
            },
            unsubscribe: (fn) => {
                const i = subs.indexOf(fn);
                if (i !== -1) subs.splice(i, 1);
            },
        };
    };

    it('renders Personalization vs All other group headers when personalization is on', async () => {
        const pzn = makeFragment({
            id: 'a',
            path: '/content/dam/mas/acom/en_US/cards/a',
            tags: [{ id: 'mas:pzn/general' }],
        });
        const plain = makeFragment({
            id: 'b',
            path: '/content/dam/mas/acom/en_US/cards/b',
            tags: [],
        });
        Store.filters.set({
            locale: 'en_US',
            personalizationFilterEnabled: true,
            tags: '',
        });
        Store.renderMode.set('table');
        Store.fragments.list.data.value = [makeStore(pzn), makeStore(plain)];

        const el = await fixture(html`<mas-content></mas-content>`);
        await el.updateComplete;

        const text = el.textContent ?? '';
        expect(text).to.include('Personalization fragments (1)');
        expect(text).to.include('All other fragments (1)');
    });

    it('uses requestAnimationFrame to re-observe sentinel after a page load completes', async () => {
        Store.fragments.list.loading.set(true);
        Store.fragments.list.firstPageLoaded.set(true);
        Store.fragments.list.hasMore.set(true);
        Store.fragments.list.data.value = [];

        const el = await fixture(html`<mas-content></mas-content>`);
        await el.updateComplete;

        // Capture RAF callbacks without executing them — proves observe() is deferred
        const rafCallbacks = [];
        const rafStub = sinon.stub(window, 'requestAnimationFrame').callsFake((cb) => {
            rafCallbacks.push(cb);
            return rafCallbacks.length;
        });

        try {
            Store.fragments.list.loading.set(false);
            await el.updateComplete;

            // RAF was scheduled
            expect(rafStub.called).to.be.true;
            // Callback was NOT yet executed (observe is deferred)
            expect(rafCallbacks).to.have.length(1);
        } finally {
            rafStub.restore();
            Store.fragments.list.hasMore.set(false);
        }
    });

    it('narrows the personalization group when selected filter tags are non-country PZN ids', async () => {
        const withGeneral = makeFragment({
            id: 'g',
            path: '/content/dam/mas/acom/en_US/cards/g',
            tags: [{ id: 'mas:pzn/general' }],
        });
        const withSegment = makeFragment({
            id: 's',
            path: '/content/dam/mas/acom/en_US/cards/s',
            tags: [{ id: 'mas:pzn/segment-only' }],
        });
        Store.filters.set({
            locale: 'en_US',
            personalizationFilterEnabled: true,
            tags: 'mas:pzn/general',
        });
        Store.renderMode.set('table');
        Store.fragments.list.data.value = [makeStore(withGeneral), makeStore(withSegment)];

        const el = await fixture(html`<mas-content></mas-content>`);
        await el.updateComplete;

        const text = el.textContent ?? '';
        expect(text).to.include('Personalization fragments (1)');
        expect(text).to.include('All other fragments (0)');
    });

    it('narrows personalization group using pznTags field when metadata tags are empty', async () => {
        const withGeneralOnField = makeFragment({
            id: 'pf',
            path: '/content/dam/mas/acom/en_US/cards/pf',
            tags: [],
            fields: [{ name: 'pznTags', values: ['mas:pzn/general'] }],
        });
        const withSegmentOnField = makeFragment({
            id: 'sf',
            path: '/content/dam/mas/acom/en_US/cards/sf',
            tags: [],
            fields: [{ name: 'pznTags', values: ['mas:pzn/segment-only'] }],
        });
        Store.filters.set({
            locale: 'en_US',
            personalizationFilterEnabled: true,
            tags: 'mas:pzn/general',
        });
        Store.renderMode.set('table');
        Store.fragments.list.data.value = [makeStore(withGeneralOnField), makeStore(withSegmentOnField)];

        const el = await fixture(html`<mas-content></mas-content>`);
        await el.updateComplete;

        const text = el.textContent ?? '';
        expect(text).to.include('Personalization fragments (1)');
        expect(text).to.include('All other fragments (0)');
    });
});
