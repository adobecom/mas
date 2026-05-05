// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { fixture, fixtureCleanup, html } from '@open-wc/testing';
import { nothing } from 'lit';
import Store from '../../src/store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { cardSkeleton } from '../../src/mas-content.js';
import '../../src/mas-repository.js';
import '../../src/mas-content.js';

import { getTemplateContent } from '../utils.js';

const spTheme = document.querySelector('sp-theme');

const initElementFromTemplate = (templateId) => {
    const [root] = getTemplateContent(templateId);
    spTheme.append(root);
    return root;
};

runTests(async () => {
    describe('mas-content component', () => {
        let originalSearch;
        let originalFilters;
        let originalLoading;
        let originalFirstPageLoaded;
        let originalFragments;
        let originalRenderMode;
        let originalPathMeta;
        let originalQueryMeta;
        let originalLocaleMeta;

        beforeEach(() => {
            originalSearch = structuredClone(Store.search.get());
            originalFilters = structuredClone(Store.filters.get());
            originalLoading = Store.fragments.list.loading.get();
            originalFirstPageLoaded = Store.fragments.list.firstPageLoaded.get();
            originalFragments = Store.fragments.list.data.get();
            originalRenderMode = Store.renderMode.get();
            originalPathMeta = Store.fragments.list.data.getMeta('path');
            originalQueryMeta = Store.fragments.list.data.getMeta('query');
            originalLocaleMeta = Store.fragments.list.data.getMeta('locale');
        });

        afterEach(() => {
            fixtureCleanup();
            Store.search.set(originalSearch);
            Store.filters.set(originalFilters);
            Store.fragments.list.loading.set(originalLoading);
            Store.fragments.list.firstPageLoaded.set(originalFirstPageLoaded);
            Store.fragments.list.data.set(originalFragments);
            Store.renderMode.set(originalRenderMode);
            if (originalPathMeta === null) Store.fragments.list.data.removeMeta('path');
            else Store.fragments.list.data.setMeta('path', originalPathMeta);
            if (originalQueryMeta === null) Store.fragments.list.data.removeMeta('query');
            else Store.fragments.list.data.setMeta('query', originalQueryMeta);
            if (originalLocaleMeta === null) Store.fragments.list.data.removeMeta('locale');
            else Store.fragments.list.data.setMeta('locale', originalLocaleMeta);
        });

        const createFragmentStore = (overrides = {}) =>
            new FragmentStore({
                id: 'fragment-1',
                path: '/content/dam/mas/sandbox/en_US/fragment-1',
                model: { path: '/models/collection' },
                title: 'Test Fragment',
                fields: [],
                ...overrides,
            });

        it('uses a reactive store, managed by mas-repository, as data source', () => {
            const [masRepository, masContent] = initElementFromTemplate('mas-content-with-data-source').children;
            expect(masRepository).to.exist;
            expect(masContent).to.exist;
        });

        it('renders a locale-specific empty state for a missing fragment id', async () => {
            const query = '1458bc3f-13b3-430c-aca0-074118668c6d';
            Store.search.set({ path: 'sandbox', query });
            Store.filters.set({ locale: 'da_DK' });
            Store.fragments.list.loading.set(false);
            Store.fragments.list.firstPageLoaded.set(true);
            Store.fragments.list.data.set([]);
            Store.fragments.list.data.setMeta('path', 'sandbox');
            Store.fragments.list.data.setMeta('query', query);
            Store.fragments.list.data.setMeta('locale', 'da_DK');
            Store.renderMode.set('render');

            const el = await fixture(html`<mas-content></mas-content>`);
            const emptyState = el.querySelector('.content-empty-state');

            expect(emptyState).to.exist;
            expect(emptyState.textContent).to.include('No fragment found');
            expect(emptyState.textContent).to.include(query);
            expect(emptyState.textContent).to.include('da_DK');
        });

        it('does not render the empty state before the current search resolves', async () => {
            const query = '1458bc3f-13b3-430c-aca0-074118668c6d';
            Store.search.set({ path: 'sandbox', query });
            Store.filters.set({ locale: 'da_DK' });
            Store.fragments.list.loading.set(false);
            Store.fragments.list.firstPageLoaded.set(true);
            Store.fragments.list.data.set([]);
            Store.fragments.list.data.removeMeta('path');
            Store.fragments.list.data.removeMeta('query');
            Store.fragments.list.data.removeMeta('locale');
            Store.renderMode.set('render');

            const el = await fixture(html`<mas-content></mas-content>`);

            expect(el.querySelector('.content-empty-state')).to.not.exist;
        });

        it('renders fragments when search results exist', async () => {
            Store.search.set({ path: 'sandbox', query: '1458bc3f-13b3-430c-aca0-074118668c6d' });
            Store.filters.set({ locale: 'en_US' });
            Store.fragments.list.loading.set(false);
            Store.fragments.list.firstPageLoaded.set(true);
            Store.fragments.list.data.set([createFragmentStore()]);
            Store.renderMode.set('render');

            const el = await fixture(html`<mas-content></mas-content>`);

            expect(el.querySelector('.content-empty-state')).to.not.exist;
            expect(el.querySelector('mas-fragment')).to.exist;
        });
    });

    describe('cardSkeleton', () => {
        it('returns a template with skeleton placeholder elements', () => {
            const container = document.createElement('div');
            const templateResult = cardSkeleton();
            expect(templateResult).to.not.be.undefined;
            expect(templateResult.strings).to.exist;
            const joined = templateResult.strings.join('');
            expect(joined).to.include('render-fragment-placeholder');
            expect(joined).to.include('skeleton-title');
            expect(joined).to.include('skeleton-body');
            expect(joined).to.include('skeleton-footer');
        });
    });

    describe('skeleton rendering paths', () => {
        let masContent;
        let sandbox;

        beforeEach(async () => {
            sandbox = sinon.createSandbox();
            masContent = document.createElement('mas-content');
            spTheme.append(masContent);
            await masContent.updateComplete;
        });

        afterEach(() => {
            masContent.remove();
            sandbox.restore();
        });

        describe('renderView getter', () => {
            it('returns 8 card skeletons when firstPageLoaded is false', () => {
                Store.fragments.list.firstPageLoaded.set(false);
                const result = masContent.renderView;
                const joined = result.strings.join('');
                expect(joined).to.include('id="render"');
                expect(result.values.length).to.equal(1);
                const skeletons = result.values[0];
                expect(skeletons).to.have.length(8);
            });

            it('returns fragment list when firstPageLoaded is true', () => {
                Store.fragments.list.firstPageLoaded.set(true);
                Store.fragments.list.data.set([]);
                const result = masContent.renderView;
                const joined = result.strings.join('');
                expect(joined).to.include('id="render"');
            });
        });

        describe('tableView getter', () => {
            it('returns skeleton table when firstPageLoaded is false', () => {
                Store.fragments.list.firstPageLoaded.set(false);
                const result = masContent.tableView;
                const joined = result.strings.join('');
                expect(joined).to.include('sp-table');
                expect(joined).to.include('sp-table-head');
                expect(joined).to.include('sp-table-body');
                expect(joined).to.include('Last modified');
                const skeletons = result.values.find((v) => Array.isArray(v) && v.length === 8);
                expect(skeletons).to.exist;
            });

            it('returns data table when firstPageLoaded is true', () => {
                Store.fragments.list.firstPageLoaded.set(true);
                Store.fragments.list.data.set([]);
                const result = masContent.tableView;
                const joined = result.strings.join('');
                expect(joined).to.include('sp-table');
                expect(joined).to.include('Last modified');
            });
        });

        describe('tableLoadingSkeletons getter', () => {
            it('returns 4 skeleton rows when loading and firstPageLoaded are both true', () => {
                Store.fragments.list.loading.set(true);
                Store.fragments.list.firstPageLoaded.set(true);
                const result = masContent.tableLoadingSkeletons;
                expect(result).to.not.equal(nothing);
                expect(result.values.length).to.equal(1);
                const rows = result.values[0];
                expect(rows).to.have.length(4);
            });

            it('returns nothing when loading is false', () => {
                Store.fragments.list.loading.set(false);
                Store.fragments.list.firstPageLoaded.set(true);
                expect(masContent.tableLoadingSkeletons).to.equal(nothing);
            });

            it('returns nothing when firstPageLoaded is false', () => {
                Store.fragments.list.loading.set(true);
                Store.fragments.list.firstPageLoaded.set(false);
                expect(masContent.tableLoadingSkeletons).to.equal(nothing);
            });
        });

        describe('pageLoadingSkeletons getter', () => {
            it('returns card skeletons in render mode when loading', () => {
                Store.fragments.list.loading.set(true);
                Store.fragments.list.firstPageLoaded.set(true);
                Store.renderMode.set('render');
                const result = masContent.pageLoadingSkeletons;
                expect(result).to.not.equal(nothing);
                const joined = result.strings.join('');
                expect(joined).to.include('next-page-skeletons');
            });

            it('returns nothing in table mode', () => {
                Store.fragments.list.loading.set(true);
                Store.fragments.list.firstPageLoaded.set(true);
                Store.renderMode.set('table');
                expect(masContent.pageLoadingSkeletons).to.equal(nothing);
            });

            it('returns nothing when not loading', () => {
                Store.fragments.list.loading.set(false);
                Store.fragments.list.firstPageLoaded.set(true);
                Store.renderMode.set('render');
                expect(masContent.pageLoadingSkeletons).to.equal(nothing);
            });
        });
    });

    describe('sort interactions', () => {
        let masContent;
        let originalSort;
        let originalFragments;
        let originalPage;

        beforeEach(async () => {
            originalSort = structuredClone(Store.sort.get());
            originalFragments = Store.fragments.list.data.get();
            originalPage = Store.page.get();
            // The Store.sort validator scopes valid fields to SORT_COLUMNS[currentPage]; setting
            // page to 'content' is what makes path/title/modifiedAt accepted in these tests.
            Store.page.set('content');
            masContent = document.createElement('mas-content');
            spTheme.append(masContent);
            await masContent.updateComplete;
        });

        afterEach(() => {
            masContent.remove();
            Store.fragments.list.data.set(originalFragments);
            Store.sort.set(originalSort);
            Store.page.set(originalPage);
        });

        const makeStore = (path, title = path) =>
            new FragmentStore({
                id: path,
                path,
                model: { path: '/models/collection' },
                title,
                fields: [],
            });

        describe('updateSort', () => {
            it('sets sortBy and asc direction when called with a new field', () => {
                Store.sort.set({ sortBy: null, sortDirection: 'asc' });
                masContent.updateSort('path');
                expect(Store.sort.get()).to.deep.equal({ sortBy: 'path', sortDirection: 'asc' });
            });

            it('defaults modifiedAt to desc on first selection', () => {
                Store.sort.set({ sortBy: null, sortDirection: 'asc' });
                masContent.updateSort('modifiedAt');
                expect(Store.sort.get()).to.deep.equal({ sortBy: 'modifiedAt', sortDirection: 'desc' });
            });

            it('toggles direction when called with the same field twice', () => {
                Store.sort.set({ sortBy: 'path', sortDirection: 'asc' });
                masContent.updateSort('path');
                expect(Store.sort.get().sortDirection).to.equal('desc');
                masContent.updateSort('path');
                expect(Store.sort.get().sortDirection).to.equal('asc');
            });
        });

        describe('sortedFragments', () => {
            it('returns fragments unsorted when sortBy is modifiedAt (delegated to backend)', () => {
                const stores = [makeStore('/c'), makeStore('/a'), makeStore('/b')];
                Store.fragments.list.data.set(stores);
                Store.sort.set({ sortBy: 'modifiedAt', sortDirection: 'desc' });
                const result = masContent.sortedFragments;
                expect(result.map((s) => s.get().path)).to.deep.equal(['/c', '/a', '/b']);
            });

            it('sorts by path ascending when sortBy is "path"', () => {
                const stores = [makeStore('/c'), makeStore('/a'), makeStore('/b')];
                Store.fragments.list.data.set(stores);
                Store.sort.set({ sortBy: 'path', sortDirection: 'asc' });
                const result = masContent.sortedFragments;
                expect(result.map((s) => s.get().path)).to.deep.equal(['/a', '/b', '/c']);
            });

            it('sorts by path descending when sortDirection is "desc"', () => {
                const stores = [makeStore('/a'), makeStore('/b'), makeStore('/c')];
                Store.fragments.list.data.set(stores);
                Store.sort.set({ sortBy: 'path', sortDirection: 'desc' });
                const result = masContent.sortedFragments;
                expect(result.map((s) => s.get().path)).to.deep.equal(['/c', '/b', '/a']);
            });

            it('sorts by title ascending case-insensitively (mixed case interleaved, not segregated)', () => {
                const stores = [
                    makeStore('/p1', 'Banana'),
                    makeStore('/p2', 'apple'),
                    makeStore('/p3', 'Cherry'),
                    makeStore('/p4', 'avocado'),
                    makeStore('/p5', 'BLUEBERRY'),
                ];
                Store.fragments.list.data.set(stores);
                Store.sort.set({ sortBy: 'title', sortDirection: 'asc' });
                const result = masContent.sortedFragments;
                expect(result.map((s) => s.get().title)).to.deep.equal(['apple', 'avocado', 'Banana', 'BLUEBERRY', 'Cherry']);
            });

            it('sorts by title descending case-insensitively', () => {
                const stores = [makeStore('/p1', 'apple'), makeStore('/p2', 'Banana'), makeStore('/p3', 'cherry')];
                Store.fragments.list.data.set(stores);
                Store.sort.set({ sortBy: 'title', sortDirection: 'desc' });
                const result = masContent.sortedFragments;
                expect(result.map((s) => s.get().title)).to.deep.equal(['cherry', 'Banana', 'apple']);
            });

            it('sorts paths case-insensitively (does not group uppercase before lowercase)', () => {
                const stores = [
                    makeStore('/sandbox/Cake'),
                    makeStore('/sandbox/apple'),
                    makeStore('/sandbox/Banana'),
                    makeStore('/sandbox/avocado'),
                ];
                Store.fragments.list.data.set(stores);
                Store.sort.set({ sortBy: 'path', sortDirection: 'asc' });
                const result = masContent.sortedFragments;
                expect(result.map((s) => s.get().path)).to.deep.equal([
                    '/sandbox/apple',
                    '/sandbox/avocado',
                    '/sandbox/Banana',
                    '/sandbox/Cake',
                ]);
            });

            it('orders titles naturally when they contain numbers (card2 < card10)', () => {
                const stores = [makeStore('/p1', 'card10'), makeStore('/p2', 'card2'), makeStore('/p3', 'card1')];
                Store.fragments.list.data.set(stores);
                Store.sort.set({ sortBy: 'title', sortDirection: 'asc' });
                const result = masContent.sortedFragments;
                expect(result.map((s) => s.get().title)).to.deep.equal(['card1', 'card2', 'card10']);
            });
        });

        describe('sortIndicator', () => {
            // The active branch nests a chevron template inside a value expression, so the icon
            // tag name lives in `values[0].strings`, not the outer `strings` array.
            const innerJoined = (result) => {
                const parts = result.strings.slice();
                for (const v of result.values || []) {
                    if (v && Array.isArray(v.strings)) parts.push(...v.strings);
                }
                return parts.join('');
            };

            it('renders chevron-up for the active asc field', () => {
                Store.sort.set({ sortBy: 'path', sortDirection: 'asc' });
                const joined = innerJoined(masContent.sortIndicator('path'));
                expect(joined).to.include('sp-icon-chevron-up');
                expect(joined).to.not.include('sp-icon-chevron-down');
            });

            it('renders chevron-down for the active desc field', () => {
                Store.sort.set({ sortBy: 'path', sortDirection: 'desc' });
                const joined = innerJoined(masContent.sortIndicator('path'));
                expect(joined).to.include('sp-icon-chevron-down');
                expect(joined).to.not.include('sp-icon-chevron-up');
            });

            it('renders idle order icon for inactive fields', () => {
                Store.sort.set({ sortBy: 'title', sortDirection: 'asc' });
                const joined = innerJoined(masContent.sortIndicator('path'));
                expect(joined).to.include('sp-icon-order');
            });
        });
    });

    describe('IntersectionObserver and scroll-sentinel', () => {
        let masContent;
        let sandbox;

        beforeEach(async () => {
            sandbox = sinon.createSandbox();
            masContent = document.createElement('mas-content');
            spTheme.append(masContent);
            await masContent.updateComplete;
        });

        afterEach(() => {
            masContent.remove();
            sandbox.restore();
            Store.fragments.list.hasMore.set(false);
            Store.fragments.list.loading.set(false);
            Store.fragments.list.firstPageLoaded.set(false);
            Store.renderMode.set('render');
        });

        it('creates scrollObserver in connectedCallback', () => {
            expect(masContent.scrollObserver).to.be.instanceOf(IntersectionObserver);
        });

        it('attaches observer to scroll-sentinel on updated', async () => {
            Store.fragments.list.hasMore.set(true);
            Store.fragments.list.firstPageLoaded.set(true);
            Store.fragments.list.data.set([]);
            Store.renderMode.set('render');
            masContent.requestUpdate();
            await masContent.updateComplete;

            const sentinel = masContent.querySelector('.scroll-sentinel');
            expect(sentinel).to.exist;
            expect(masContent.observedSentinel).to.equal(sentinel);
        });

        it('clears observedSentinel when sentinel is removed', async () => {
            Store.fragments.list.hasMore.set(true);
            Store.fragments.list.firstPageLoaded.set(true);
            Store.fragments.list.data.set([]);
            Store.renderMode.set('render');
            masContent.requestUpdate();
            await masContent.updateComplete;
            expect(masContent.observedSentinel).to.exist;

            Store.fragments.list.hasMore.set(false);
            masContent.requestUpdate();
            await masContent.updateComplete;

            const sentinel = masContent.querySelector('.scroll-sentinel');
            expect(sentinel).to.be.null;
            expect(masContent.observedSentinel).to.be.null;
        });

        it('renders scroll-sentinel when hasMore is true', async () => {
            Store.fragments.list.hasMore.set(true);
            Store.fragments.list.firstPageLoaded.set(true);
            Store.fragments.list.data.set([]);
            Store.renderMode.set('render');
            masContent.requestUpdate();
            await masContent.updateComplete;

            expect(masContent.querySelector('.scroll-sentinel')).to.exist;
        });

        it('does not render scroll-sentinel when hasMore is false', async () => {
            Store.fragments.list.hasMore.set(false);
            Store.fragments.list.firstPageLoaded.set(true);
            Store.fragments.list.data.set([]);
            Store.renderMode.set('render');
            masContent.requestUpdate();
            await masContent.updateComplete;

            expect(masContent.querySelector('.scroll-sentinel')).to.be.null;
        });

        it('disconnects observer on disconnectedCallback', () => {
            const disconnectSpy = sandbox.spy(masContent.scrollObserver, 'disconnect');
            masContent.remove();
            expect(disconnectSpy.called).to.be.true;
        });
    });
});
