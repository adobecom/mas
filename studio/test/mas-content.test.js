import { expect, fixture, html } from '@open-wc/testing';
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

    it('renders title and last-modified sort headers in table view', async () => {
        const frag = makeFragment({ id: 'x', path: '/content/dam/mas/acom/en_US/cards/x' });
        Store.renderMode.set('table');
        Store.fragments.list.data.value = [makeStore(frag)];

        const el = await fixture(html`<mas-content></mas-content>`);
        await el.updateComplete;

        const text = el.textContent ?? '';
        expect(text).to.include('Fragment Title');
        expect(text).to.include('Last Modified');
    });

    it('sorts fragment stores by title ascending', async () => {
        const fragA = makeFragment({ id: 'a', path: '/content/dam/mas/acom/en_US/cards/a', title: 'Alpha' });
        const fragB = makeFragment({ id: 'b', path: '/content/dam/mas/acom/en_US/cards/b', title: 'Beta' });
        const fragC = makeFragment({ id: 'c', path: '/content/dam/mas/acom/en_US/cards/c', title: 'Gamma' });

        Store.renderMode.set('table');
        Store.sort.set({ sortBy: 'title', sortDirection: 'asc' });
        Store.fragments.list.data.value = [makeStore(fragC), makeStore(fragA), makeStore(fragB)];

        const el = await fixture(html`<mas-content></mas-content>`);
        await el.updateComplete;

        const rows = [...el.querySelectorAll('sp-table-cell.title')];
        const titles = rows.map((r) => r.textContent.trim());
        expect(titles).to.deep.equal(['Alpha', 'Beta', 'Gamma']);
    });

    it('sorts fragment stores by title descending', async () => {
        const fragA = makeFragment({ id: 'a', path: '/content/dam/mas/acom/en_US/cards/a', title: 'Alpha' });
        const fragB = makeFragment({ id: 'b', path: '/content/dam/mas/acom/en_US/cards/b', title: 'Beta' });
        const fragC = makeFragment({ id: 'c', path: '/content/dam/mas/acom/en_US/cards/c', title: 'Gamma' });

        Store.renderMode.set('table');
        Store.sort.set({ sortBy: 'title', sortDirection: 'desc' });
        Store.fragments.list.data.value = [makeStore(fragA), makeStore(fragC), makeStore(fragB)];

        const el = await fixture(html`<mas-content></mas-content>`);
        await el.updateComplete;

        const rows = [...el.querySelectorAll('sp-table-cell.title')];
        const titles = rows.map((r) => r.textContent.trim());
        expect(titles).to.deep.equal(['Gamma', 'Beta', 'Alpha']);
    });

    it('sorts fragment stores by modifiedAt ascending (oldest first)', async () => {
        const fragOld = makeFragment({
            id: 'old',
            path: '/content/dam/mas/acom/en_US/cards/old',
            title: 'Old',
            modified: { at: '2023-01-01T00:00:00Z', by: 'user' },
        });
        const fragNew = makeFragment({
            id: 'new',
            path: '/content/dam/mas/acom/en_US/cards/new',
            title: 'New',
            modified: { at: '2024-06-01T00:00:00Z', by: 'user' },
        });

        Store.renderMode.set('table');
        Store.sort.set({ sortBy: 'modifiedAt', sortDirection: 'asc' });
        Store.fragments.list.data.value = [makeStore(fragNew), makeStore(fragOld)];

        const el = await fixture(html`<mas-content></mas-content>`);
        await el.updateComplete;

        const rows = [...el.querySelectorAll('sp-table-cell.title')];
        const titles = rows.map((r) => r.textContent.trim());
        expect(titles).to.deep.equal(['Old', 'New']);
    });

    it('sorts fragment stores by modifiedAt descending (newest first)', async () => {
        const fragOld = makeFragment({
            id: 'old',
            path: '/content/dam/mas/acom/en_US/cards/old',
            title: 'Old',
            modified: { at: '2023-01-01T00:00:00Z', by: 'user' },
        });
        const fragNew = makeFragment({
            id: 'new',
            path: '/content/dam/mas/acom/en_US/cards/new',
            title: 'New',
            modified: { at: '2024-06-01T00:00:00Z', by: 'user' },
        });

        Store.renderMode.set('table');
        Store.sort.set({ sortBy: 'modifiedAt', sortDirection: 'desc' });
        Store.fragments.list.data.value = [makeStore(fragOld), makeStore(fragNew)];

        const el = await fixture(html`<mas-content></mas-content>`);
        await el.updateComplete;

        const rows = [...el.querySelectorAll('sp-table-cell.title')];
        const titles = rows.map((r) => r.textContent.trim());
        expect(titles).to.deep.equal(['New', 'Old']);
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
});
