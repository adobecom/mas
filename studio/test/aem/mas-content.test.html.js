// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import { fixture, fixtureCleanup, html } from '@open-wc/testing';
import Store from '../../src/store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';

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
});
