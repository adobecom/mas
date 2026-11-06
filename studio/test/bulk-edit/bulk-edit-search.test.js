import { expect, fixture, html, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { EDITABLE_FRAGMENT_MODEL_IDS, FRAGMENT_STATUS_OPTIONS } from '../../src/constants.js';
import { MasRepository } from '../../src/mas-repository.js';
import { AEM } from '../../src/aem/aem.js';
import { getAemSearchTerm } from '../../src/utils.js';
import { __tagCacheStores } from '../../src/aem/tag-cache.js';
import { buildSearchRow, findSearchRows, highlightSearchText, SEARCH_FIELDS } from '../../src/bulk-edit/bulk-edit-search.js';
import '../../src/bulk-edit/mas-bulk-edit-editor.js';

const rawFragment = (id, fields, metadata = {}) => ({
    id,
    title: id,
    description: '',
    path: `/content/dam/mas/acom/en_US/${id}`,
    fields: Object.entries(fields).map(([name, values]) => ({
        name,
        values: Array.isArray(values) ? values : [values],
    })),
    ...metadata,
});

describe('bulk edit text matching', () => {
    it('uses the same longest-term selection for AEM filtering as Fragments search', () => {
        expect(getAemSearchTerm('School')).to.equal('School');
        expect(getAemSearchTerm('high school')).to.equal('school');
        expect(getAemSearchTerm('  high\t school \n')).to.equal('school');
        expect(getAemSearchTerm('plan text')).to.equal('plan');
        expect(getAemSearchTerm('school.*')).to.equal('school.*');
        expect(getAemSearchTerm('   ')).to.equal('');
    });

    it('extracts metadata and visible field text, excluding CTA destinations and HTML attributes', () => {
        const row = buildSearchRow(
            rawFragment(
                'card',
                {
                    badge: '<strong>School &amp; college</strong>',
                    ctas: '<a href="/school" title="School">Buy now</a>',
                    callout: '<p>Back to <strong>school</strong></p>',
                    tags: ['mas:segment/school', 'mas:product/photoshop'],
                },
                { title: 'Education', description: 'Fragment notes' },
            ),
        );
        expect(row.text.badge).to.equal('School & college');
        expect(row.text.ctas).to.equal('Buy now');
        expect(row.text.callout).to.equal('Back to school');
        expect(row.text.fragmentTitle).to.equal('Education');
        expect(row.text.fragmentDescription).to.equal('Fragment notes');
        expect(row.text.tags).to.equal('mas:segment/school, mas:product/photoshop');
        expect(findSearchRows([row], 'school', ['ctas'], false)).to.have.lengthOf(0);
    });

    it('matches literal text in selected fields and honors case and multiple values', () => {
        const row = buildSearchRow(rawFragment('card', { badge: ['School.*', 'University'], description: 'College' }));
        expect(findSearchRows([row], 'school.*', ['badge'], false)).to.have.lengthOf(1);
        expect(findSearchRows([row], 'school.*', ['badge'], true)).to.have.lengthOf(0);
        expect(findSearchRows([row], 'University', ['badge'], true)).to.have.lengthOf(1);
        expect(findSearchRows([row], 'school', ['description'], false)).to.have.lengthOf(0);
        expect(findSearchRows([row], 'school', [], false)).to.have.lengthOf(0);
        expect(findSearchRows([row], '', ['badge'], false)).to.have.lengthOf(0);
    });

    it('includes offer type, product description and fragment status for result columns', () => {
        const row = buildSearchRow(
            rawFragment(
                'card',
                { tags: ['mas:offer_type/base'], description: '<p>Product details</p>' },
                { status: 'PUBLISHED', tags: [{ id: 'mas:offer_type/base', title: 'Base offer' }] },
            ),
        );
        expect(row.offerType).to.equal('Base offer');
        expect(row.text.description).to.equal('Product details');
        expect(row.status).to.equal('PUBLISHED');
        expect(buildSearchRow(rawFragment('no-offer-type', {})).offerType).to.equal('');
    });

    it('highlights matches without rendering HTML from authored content or the query', async () => {
        const text = '<img src=x onerror=alert(1)> School SCHOOL school';
        const el = await fixture(html`<div>${highlightSearchText(text, 'school', false)}</div>`);
        expect(el.querySelector('img')).to.not.exist;
        expect(el.textContent).to.equal(text);
        expect([...el.querySelectorAll('mark')].map((mark) => mark.textContent)).to.deep.equal(['School', 'SCHOOL', 'school']);
        const caseSensitive = await fixture(html`<div>${highlightSearchText(text, 'School', true)}</div>`);
        expect(caseSensitive.querySelectorAll('mark')).to.have.lengthOf(1);
    });

    it('previews every literal replacement while preserving the original matched case and surrounding text', async () => {
        const el = await fixture(
            html`<div>${highlightSearchText('Back to School.* and SCHOOL.* offers', 'school.*', false, 'university $&')}</div>`,
        );
        expect([...el.querySelectorAll('del')].map((match) => match.textContent)).to.deep.equal(['School.*', 'SCHOOL.*']);
        expect([...el.querySelectorAll('ins')].map((match) => match.textContent)).to.deep.equal([
            'university $&',
            'university $&',
        ]);
        expect(el.textContent).to.equal('Back to School.* → university $& and SCHOOL.* → university $& offers');
        expect(el.querySelector('mark')).to.not.exist;
    });

    it('honors case, empty queries and empty replacement text in previews', async () => {
        const text = 'School school';
        const el = await fixture(html`<div>${highlightSearchText(text, 'School', true, 'University')}</div>`);
        expect(el.querySelectorAll('del')).to.have.lengthOf(1);
        expect(el.textContent).to.equal('School → University school');
        const emptyQuery = await fixture(html`<div>${highlightSearchText(text, '', false, 'University')}</div>`);
        expect(emptyQuery.textContent).to.equal(text);
        expect(emptyQuery.querySelector('del')).to.not.exist;
        const emptyReplacement = await fixture(html`<div>${highlightSearchText(text, 'school', false, '')}</div>`);
        expect(emptyReplacement.querySelectorAll('mark')).to.have.lengthOf(2);
        expect(emptyReplacement.querySelector('del')).to.not.exist;
    });

    it('escapes both authored and replacement text in previews', async () => {
        const text = '<img src=x onerror=alert(1)> school';
        const replacement = '<img src=x onerror=alert(2)> $&';
        const el = await fixture(html`<div>${highlightSearchText(text, 'school', false, replacement)}</div>`);
        expect(el.querySelector('img')).to.not.exist;
        expect(el.querySelector('ins').textContent).to.equal(replacement);
        expect(el.textContent).to.equal(`<img src=x onerror=alert(1)> school → ${replacement}`);
    });
});

describe('progressive Enter-to-find search', () => {
    let editor;
    let previousSearch;
    let previousFilters;
    let previousTagCache;
    let repository;
    const fragments = [
        rawFragment('school', { cardTitle: 'Photoshop', callout: 'Back to School' }, { title: 'School education' }),
        rawFragment('university', { cardTitle: 'Acrobat', badge: 'University offer' }),
    ];
    const matchingPage = (start, count = 25) =>
        Array.from({ length: count }, (_, index) =>
            rawFragment(`card-${start + index}`, { cardTitle: `Offer ${start + index}`, callout: 'School' }),
        );

    const stubVariations = () => {
        const locale = rawFragment('locale', { callout: 'Regional text' }, { path: '/content/dam/mas/acom/en_GB/school' });
        const promotion = rawFragment('promotion', {}, { path: '/content/dam/mas/acom/en_US/promotions/sale/school' });
        const grouped = rawFragment('grouped', {}, { path: '/content/dam/mas/acom/en_US/school/pzn/education' });
        const parent = rawFragment(
            'school',
            {
                cardTitle: 'Photoshop',
                callout: 'Back to School',
                variations: [locale.path, grouped.path],
            },
            { references: [locale, promotion, grouped] },
        );
        repository.aem = {
            sites: {
                cf: {
                    fragments: {
                        getById: sinon.stub().resolves(parent),
                        search: async function* () {
                            yield [];
                        },
                    },
                },
            },
        };
        repository.loadPromotions = sinon.stub().resolves();
        return { parent, locale, promotion, grouped };
    };

    const connect = async () => {
        editor = document.createElement('mas-bulk-edit-editor');
        Object.defineProperty(editor, 'repository', { value: repository });
        document.body.append(editor);
        await editor.updateComplete;
        return editor;
    };
    const type = async (value) => {
        const input = editor.shadowRoot.querySelector('#find-text');
        input.value = value;
        input.dispatchEvent(new Event('input'));
        await editor.updateComplete;
    };
    const submit = async (value) => {
        await type(value);
        return editor.handleFindSubmit({
            target: editor.shadowRoot.querySelector('#find-text'),
            preventDefault: sinon.spy(),
        });
    };

    beforeEach(() => {
        previousSearch = Store.search.get();
        previousFilters = Store.filters.get();
        previousTagCache = __tagCacheStores.data.get('/content/cq:tags/mas');
        __tagCacheStores.data.set(
            '/content/cq:tags/mas',
            new Map(
                [
                    ['market_segments/edu', 'Education'],
                    ['customer_segment/individual', 'Individual'],
                    ['product_code/photoshop', 'Photoshop'],
                    ['product_code/photoshop/cc', 'Photoshop CC'],
                ].map(([name, title]) => {
                    const path = `/content/cq:tags/mas/${name}`;
                    return [path, { path, title }];
                }),
            ),
        );
        Store.search.set({ ...previousSearch, path: 'acom' });
        Store.filters.set({ ...previousFilters, locale: 'en_US' });
        Store.bulkEditProjects.projectId.set(null);
        repository = {
            searchFragmentPages: sinon.stub().callsFake(async function* ({ query }) {
                yield fragments.filter(({ title }) => title.toLowerCase().includes(query.toLowerCase()));
            }),
            processError: sinon.stub(),
        };
    });

    afterEach(() => {
        editor?.remove();
        sinon.restore();
        Store.search.set(previousSearch);
        Store.filters.set(previousFilters);
        if (previousTagCache) __tagCacheStores.data.set('/content/cq:tags/mas', previousTagCache);
        else __tagCacheStores.data.delete('/content/cq:tags/mas');
        Store.bulkEditProjects.inEdit.set(null);
    });

    it('uses a Spectrum search control and does not fetch on connection or after typing stops', async () => {
        await connect();
        expect(editor.shadowRoot.querySelector('#find-text').localName).to.equal('sp-search');
        expect(repository.searchFragmentPages.called).to.be.false;
        const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        await type('school');
        await clock.tickAsync(5000);
        expect(repository.searchFragmentPages.called).to.be.false;
        expect(editor.searchResults).to.have.lengthOf(0);
        clock.restore();
    });

    it('submits the selected surface and locale in newest-updated order and honors Search in and Match case', async () => {
        await connect();
        await submit('school');
        const [options, pageSize, controller] = repository.searchFragmentPages.firstCall.args;
        expect(options).to.deep.equal({
            path: '/content/dam/mas/acom/en_US',
            modelIds: EDITABLE_FRAGMENT_MODEL_IDS,
            query: 'school',
            sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
        });
        expect(pageSize).to.equal(50);
        expect(controller.signal.aborted).to.be.false;
        expect(editor.searchResults.map((row) => row.id)).to.deep.equal(['school']);
        editor.matchCase = true;
        await editor.updateComplete;
        await waitUntil(() => !editor.searching);
        expect(editor.searchResults).to.have.lengthOf(0);
        await submit('School');
        expect(editor.searchResults).to.have.lengthOf(1);
        editor.searchFields = ['badge'];
        await editor.updateComplete;
        await waitUntil(() => !editor.searching);
        expect(editor.searchResults).to.have.lengthOf(0);
        editor.searchFields = [];
        await editor.updateComplete;
        expect(editor.searchedQuery).to.equal('School');
        const calls = repository.searchFragmentPages.callCount;
        await submit('School');
        expect(repository.searchFragmentPages.callCount).to.equal(calls + 1);
        expect(editor.searchResults).to.have.lengthOf(0);
    });

    it('previews replacements in variation rows without changing variation data', async () => {
        await connect();
        await submit('school');
        editor.replaceText = 'university';
        editor.searchFields = ['callout'];
        await editor.updateComplete;
        for (const kind of ['locale', 'promotion', 'grouped']) {
            const fragment = rawFragment(kind, { callout: 'Back to School', badge: 'School offer' });
            const row = { ...buildSearchRow(fragment), parentId: 'school', variationClass: 'variation-cell' };
            const el = await fixture(html`<sp-table-row>${editor.renderSearchRow(row)}</sp-table-row>`);
            expect(el.querySelector('.callout del').textContent).to.equal('School');
            expect(el.querySelector('.callout ins').textContent).to.equal('university');
            expect(el.querySelector('.badge del')).to.not.exist;
            expect(row.text.callout).to.equal('Back to School');
            expect(row.fragment).to.equal(fragment);
        }
    });

    it('shows five local filters below Match case after finding and keeps their values across query changes', async () => {
        await connect();
        expect(editor.shadowRoot.querySelector('mas-bulk-edit-filters')).to.equal(null);
        await submit('school');
        await editor.updateComplete;
        const filters = editor.shadowRoot.querySelector('mas-bulk-edit-filters');
        await filters.updateComplete;
        expect([...filters.shadowRoot.querySelectorAll('aem-tag-picker-field')].map((picker) => picker.label)).to.deep.equal([
            'Market Segment',
            'Customer Segment',
            'Product',
        ]);
        expect(filters.shadowRoot.querySelector('sp-action-button[label="Status"]')).to.exist;
        expect(filters.shadowRoot.querySelector('sp-action-button[label="Locale"]')).to.exist;
        expect(
            [...filters.shadowRoot.querySelectorAll('sp-field-group[aria-label="Status"] sp-checkbox')].map(
                ({ value }) => value,
            ),
        ).to.deep.equal(FRAGMENT_STATUS_OPTIONS.map(({ id }) => id));
        const matchCase = editor.shadowRoot.querySelector('#find-text').parentElement.querySelector('sp-checkbox');
        expect(filters.getBoundingClientRect().top).to.be.at.least(matchCase.getBoundingClientRect().bottom);
        expect(filters.getBoundingClientRect().bottom).to.be.at.most(
            editor.shadowRoot.querySelector('.fragments-table').getBoundingClientRect().top,
        );
        filters.updateFilters({ ...filters.value, statuses: ['PUBLISHED'] });
        await waitUntil(() => !editor.searching);
        await submit('university');
        await editor.updateComplete;
        expect(editor.shadowRoot.querySelector('mas-bulk-edit-filters').value.statuses).to.deep.equal(['PUBLISHED']);
        expect(Store.filters.get()).to.deep.equal({ ...previousFilters, locale: 'en_US' });
    });

    it('uses the tag pickers and expands product descendants in the server search without mutating Fragments filters', async () => {
        await connect();
        await submit('school');
        await editor.updateComplete;
        const filters = editor.shadowRoot.querySelector('mas-bulk-edit-filters');
        await filters.updateComplete;
        for (const [type, leaf] of [
            ['market_segments', 'edu'],
            ['customer_segment', 'individual'],
            ['product_code', 'photoshop'],
        ]) {
            const picker = filters.shadowRoot.querySelector(`aem-tag-picker-field[top="${type}"]`);
            await waitUntil(() => picker.ready);
            picker.tempValue = [`/content/cq:tags/mas/${type}/${leaf}`];
            await picker.applySelection();
            await waitUntil(() => editor.resultFilters.tagPaths[type]?.length === 1 && !editor.searching);
        }
        const options = repository.searchFragmentPages.lastCall.args[0];
        expect(options.tags).to.deep.equal([
            'mas:market_segments/edu',
            'mas:customer_segment/individual',
            'mas:product_code/photoshop',
            'mas:product_code/photoshop/cc',
        ]);
        expect(options.path).to.equal('/content/dam/mas/acom/en_US');
        expect(Store.filters.get().tags).to.equal(previousFilters.tags);
    });

    it('serializes tag and status filters to AEM and re-runs the active term while ignoring cancelled pages', async () => {
        let resolveOld;
        repository.searchFragmentPages.onFirstCall().returns({
            next: () => new Promise((resolve) => (resolveOld = resolve)),
        });
        await connect();
        const oldSearch = submit('school');
        await waitUntil(() => resolveOld);
        const next = {
            tagPaths: {},
            tags: ['mas:market_segments/edu', 'mas:customer_segment/individual'],
            statuses: ['PUBLISHED', 'MODIFIED'],
            locales: null,
        };
        editor.handleResultFiltersChange({ detail: next });
        await waitUntil(() => !editor.searching);
        expect(repository.searchFragmentPages.firstCall.args[2].signal.aborted).to.be.true;
        expect(repository.searchFragmentPages.secondCall.args[0]).to.include({ query: 'school' });
        expect(repository.searchFragmentPages.secondCall.args[0].tags).to.deep.equal(next.tags);
        expect(repository.searchFragmentPages.secondCall.args[0].status).to.deep.equal(next.statuses);
        resolveOld({ value: [fragments[1]], done: false });
        await oldSearch;
        expect(editor.searchResults.map(({ id }) => id)).to.deep.equal(['school']);

        const fetch = sinon.stub(window, 'fetch').resolves(
            new Response(JSON.stringify({ items: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        );
        repository = new MasRepository();
        repository.aem = new AEM('test-bucket', 'https://aem.example.com');
        editor.remove();
        await connect();
        editor.resultFilters = next;
        await submit('school');
        const { filter } = JSON.parse(new URL(fetch.firstCall.args[0]).searchParams.get('query'));
        expect(filter.tags).to.deep.equal(next.tags);
        expect(filter.status).to.deep.equal(next.statuses);
        expect(filter.fullText.text).to.equal('school');
    });

    it('supports locale search, select all, region collapse and partial region selection without a server fetch', async () => {
        await connect();
        await submit('school');
        await editor.updateComplete;
        const filters = editor.shadowRoot.querySelector('mas-bulk-edit-filters');
        await filters.updateComplete;
        const calls = repository.searchFragmentPages.callCount;
        expect(filters.allVisibleSelected).to.be.true;
        expect(filters.localeGroups.map(({ name }) => name)).to.include('JAPAC');
        filters.toggleRegion('JAPAC');
        await filters.updateComplete;
        expect(filters.localeGroups.find(({ name }) => name === 'JAPAC').expanded).to.be.false;
        const search = filters.shadowRoot.querySelector('sp-search');
        search.value = 'Australia';
        search.dispatchEvent(new Event('input'));
        await filters.updateComplete;
        expect(filters.visibleLocaleCodes).to.deep.equal(['en_AU']);
        expect(filters.localeGroups[0].expanded).to.be.true;
        filters.toggleLocales(filters.visibleLocaleCodes, false);
        await filters.updateComplete;
        expect(editor.resultFilters.locales).not.to.include('en_AU');
        search.value = '';
        search.dispatchEvent(new Event('input'));
        await filters.updateComplete;
        expect(filters.someVisibleSelected).to.be.true;
        expect(filters.localeGroups.find(({ name }) => name === 'JAPAC').indeterminate).to.be.true;
        filters.toggleLocales(filters.visibleLocaleCodes, false);
        await filters.updateComplete;
        expect(editor.resultFilters.locales).to.deep.equal([]);
        filters.toggleLocales(filters.visibleLocaleCodes, true);
        await filters.updateComplete;
        expect(editor.resultFilters.locales).to.equal(null);
        expect(repository.searchFragmentPages.callCount).to.equal(calls);
        search.value = 'not-a-locale';
        search.dispatchEvent(new Event('input'));
        await filters.updateComplete;
        expect(filters.localeGroups).to.have.lengthOf(0);
        expect(filters.shadowRoot.querySelector('sp-checkbox[value="all"]').disabled).to.be.true;
    });

    it('sends EDGES filtering to AEM and matches the full phrase locally instead of scanning the surface', async () => {
        const candidates = [
            rawFragment('matching', { callout: 'Back to high school' }, { title: 'School offer' }),
            rawFragment('wrong-order', { callout: 'school high' }, { title: 'School offer' }),
            rawFragment('wrong-field', { badge: 'high school' }, { title: 'School offer' }),
        ];
        const fetch = sinon.stub(window, 'fetch').resolves(
            new Response(JSON.stringify({ items: candidates }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }),
        );
        repository = new MasRepository();
        repository.aem = new AEM('test-bucket', 'https://aem.example.com');
        repository.processError = sinon.stub();
        await connect();
        editor.searchFields = ['callout'];
        await editor.updateComplete;
        await submit('high school');
        expect(fetch.calledOnce).to.be.true;
        const request = new URL(fetch.firstCall.args[0]);
        const { filter, sort } = JSON.parse(request.searchParams.get('query'));
        expect(filter.fullText).to.deep.equal({ text: 'school', queryMode: 'EDGES' });
        expect(filter.path).to.equal('/content/dam/mas/acom/en_US');
        expect(filter.modelIds).to.deep.equal(EDITABLE_FRAGMENT_MODEL_IDS);
        expect(sort).to.deep.equal([{ on: 'modifiedOrCreated', order: 'DESC' }]);
        expect(request.searchParams.get('limit')).to.equal('50');
        expect(editor.searchResults.map((row) => row.id)).to.deep.equal(['matching']);
        expect(editor.hasMoreResults).to.be.false;
    });

    it('keeps all 12 server matches in Everywhere even when only 7 have literal matches, and still narrows explicit fields and case', async () => {
        const literal = Array.from({ length: 7 }, (_, index) =>
            rawFragment(`literal-${index}`, { callout: 'school offer' }, { title: `school offer ${index}` }),
        );
        const indexed = Array.from({ length: 5 }, (_, index) =>
            rawFragment(`indexed-${index}`, { cardTitle: 'Education' }, { title: `Indexed offer ${index}` }),
        );
        const candidates = [...literal, ...indexed];
        const fetch = sinon.stub(window, 'fetch');
        fetch.callsFake(
            async () =>
                new Response(JSON.stringify({ items: candidates }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }),
        );
        repository = new MasRepository();
        repository.aem = new AEM('test-bucket', 'https://aem.example.com');
        repository.processError = sinon.stub();
        await connect();
        expect(findSearchRows(candidates.map(buildSearchRow), 'school', editor.searchFields, false)).to.have.lengthOf(7);
        await submit('school');
        expect(editor.searchResults.map(({ id }) => id)).to.deep.equal(candidates.map(({ id }) => id));
        expect(editor.searchResults).to.have.lengthOf(12);
        expect(editor.hasMoreResults).to.be.false;
        const request = new URL(fetch.firstCall.args[0]);
        expect(JSON.parse(request.searchParams.get('query')).filter.fullText).to.deep.equal({
            text: 'school',
            queryMode: 'EDGES',
        });
        editor.searchFields = ['callout'];
        await editor.updateComplete;
        await waitUntil(() => !editor.searching);
        expect(editor.searchResults.map(({ id }) => id)).to.deep.equal(literal.map(({ id }) => id));
        editor.searchFields = SEARCH_FIELDS.map(({ value }) => value);
        editor.matchCase = true;
        await editor.updateComplete;
        await waitUntil(() => !editor.searching);
        expect(editor.searchResults).to.have.lengthOf(7);
        editor.matchCase = false;
        await editor.updateComplete;
        await waitUntil(() => !editor.searching);
        expect(editor.searchResults).to.have.lengthOf(12);
        expect(fetch.calledOnce).to.be.true;
        await submit('school offer');
        expect(editor.searchResults).to.have.lengthOf(7);
        expect(fetch.calledTwice).to.be.true;
    });

    it('filters only cached pages on Search in changes and resumes paging only on explicit Load more', async () => {
        const next = sinon.stub();
        next.onFirstCall().resolves({ value: matchingPage(0), done: false });
        next.onSecondCall().resolves({
            value: [rawFragment('badge-match', { badge: 'school' })],
            done: false,
        });
        next.onThirdCall().resolves({ done: true });
        repository.searchFragmentPages.returns({ next });
        await connect();
        await submit('school');
        expect(next.calledOnce).to.be.true;
        editor.searchFields = ['badge'];
        await editor.updateComplete;
        expect(editor.searchResults).to.have.lengthOf(0);
        expect(editor.searchedQuery).to.equal('school');
        expect(editor.hasMoreResults).to.be.true;
        editor.handleSearchRangeChange({ last: 24 });
        expect(next.calledOnce).to.be.true;
        editor.searchFields = SEARCH_FIELDS.map(({ value }) => value);
        await editor.updateComplete;
        expect(editor.searchResults).to.have.lengthOf(25);
        expect(next.calledOnce).to.be.true;
        editor.searchFields = ['badge'];
        await editor.updateComplete;
        await editor.loadNextSearchPage();
        expect(editor.searchResults.map(({ id }) => id)).to.deep.equal(['badge-match']);
        expect(repository.searchFragmentPages.calledOnce).to.be.true;
        expect(next.callCount).to.equal(3);
        editor.searchFields = SEARCH_FIELDS.map(({ value }) => value);
        await editor.updateComplete;
        expect(editor.searchResults).to.have.lengthOf(26);
    });

    it('uses the latest local fields for an in-flight page without restarting or refilling the server query', async () => {
        let resolvePage;
        const next = sinon.stub();
        next.onFirstCall().returns(new Promise((resolve) => (resolvePage = resolve)));
        repository.searchFragmentPages.returns({ next });
        await connect();
        const search = submit('school');
        await waitUntil(() => resolvePage);
        editor.searchFields = ['badge'];
        await editor.updateComplete;
        expect(repository.searchFragmentPages.firstCall.args[2].signal.aborted).to.be.false;
        resolvePage({
            value: [fragments[0], rawFragment('badge-match', { badge: 'school' })],
            done: false,
        });
        await search;
        expect(editor.searchResults.map(({ id }) => id)).to.deep.equal(['badge-match']);
        expect(repository.searchFragmentPages.calledOnce).to.be.true;
        expect(next.calledOnce).to.be.true;
        expect(editor.hasMoreResults).to.be.true;
        editor.searchFields = SEARCH_FIELDS.map(({ value }) => value);
        await editor.updateComplete;
        expect(editor.searchResults.map(({ id }) => id)).to.deep.equal(['school', 'badge-match']);
        expect(next.calledOnce).to.be.true;
    });

    it('publishes a page while the next page is still loading', async () => {
        let resolveNext;
        repository.searchFragmentPages.callsFake(async function* () {
            yield [fragments[0]];
            yield await new Promise((resolve) => (resolveNext = resolve));
        });
        await connect();
        const search = submit('school');
        await waitUntil(() => resolveNext);
        expect(editor.searchResults.map((row) => row.id)).to.deep.equal(['school']);
        expect(editor.searching).to.be.true;
        resolveNext([]);
        await search;
        expect(editor.searching).to.be.false;
        expect(editor.hasMoreResults).to.be.false;
    });

    it('pauses at the visible match threshold and fetches the next page only on demand', async () => {
        const next = sinon.stub();
        next.onCall(0).resolves({ value: matchingPage(0), done: false });
        next.onCall(1).resolves({ value: matchingPage(25), done: false });
        next.onCall(2).resolves({ done: true });
        repository.searchFragmentPages.returns({ next });
        await connect();
        await submit('school');
        expect(next.calledOnce).to.be.true;
        expect(editor.searchResults).to.have.lengthOf(MasRepository.MIN_FILTERED_PAGE_RESULTS);
        expect(editor.hasMoreResults).to.be.true;
        await editor.loadNextSearchPage();
        expect(next.calledTwice).to.be.true;
        expect(editor.searchResults).to.have.lengthOf(50);
        await editor.loadNextSearchPage();
        expect(editor.hasMoreResults).to.be.false;
    });

    it('bounds sparse searches to 20 pages and keeps Load more available when there are no matches yet', async () => {
        const next = sinon.stub().resolves({ value: [fragments[1]], done: false });
        repository.searchFragmentPages.returns({ next });
        await connect();
        editor.searchFields = ['callout'];
        await editor.updateComplete;
        await submit('school');
        expect(next.callCount).to.equal(MasRepository.MAX_REFILL_ROUNDS);
        expect(editor.searchResults).to.have.lengthOf(0);
        expect(editor.hasMoreResults).to.be.true;
        await editor.updateComplete;
        expect(editor.shadowRoot.querySelector('sp-illustrated-message h2').textContent).to.equal('No matches in loaded pages');
        expect(editor.shadowRoot.querySelector('.search-pagination sp-button')).to.exist;
    });

    it('loads more near the end of the table and prevents concurrent page requests', async () => {
        let resolveNext;
        const next = sinon.stub();
        next.onFirstCall().resolves({ value: matchingPage(0), done: false });
        next.onSecondCall().returns(new Promise((resolve) => (resolveNext = resolve)));
        repository.searchFragmentPages.returns({ next });
        await connect();
        await submit('school');
        editor.handleSearchRangeChange({ last: 5 });
        expect(next.calledOnce).to.be.true;
        editor.handleSearchRangeChange({ last: 24 });
        editor.handleSearchRangeChange({ last: 24 });
        expect(next.calledTwice).to.be.true;
        resolveNext({ done: true });
        await waitUntil(() => !editor.searching);
        expect(editor.hasMoreResults).to.be.false;
    });

    it('ignores responses from an old search when a different query is submitted', async () => {
        let resolveOld;
        repository.searchFragmentPages.onFirstCall().returns({
            next: () => new Promise((resolve) => (resolveOld = resolve)),
        });
        await connect();
        const oldSearch = submit('school');
        await waitUntil(() => resolveOld);
        await submit('university');
        expect(repository.searchFragmentPages.firstCall.args[2].signal.aborted).to.be.true;
        resolveOld({ value: fragments, done: false });
        await oldSearch;
        expect(editor.searchResults.map((row) => row.id)).to.deep.equal(['university']);
        expect(editor.searchedQuery).to.equal('university');
    });

    it('clears results and aborts pending work when Find is cleared, without starting another fetch', async () => {
        let resolveLoad;
        repository.searchFragmentPages.returns({
            next: () => new Promise((resolve) => (resolveLoad = resolve)),
        });
        await connect();
        const search = submit('school');
        await waitUntil(() => resolveLoad);
        await type('');
        resolveLoad({ value: fragments, done: false });
        await search;
        expect(editor.searchResults).to.have.lengthOf(0);
        expect(editor.searchedQuery).to.equal('');
        expect(repository.searchFragmentPages.firstCall.args[2].signal.aborted).to.be.true;
        expect(repository.searchFragmentPages.calledOnce).to.be.true;
    });

    it('aborts on surface changes and requires Enter before searching the new surface', async () => {
        await connect();
        await submit('school');
        Store.search.set({ ...Store.search.get(), path: 'ccd' });
        await editor.updateComplete;
        expect(repository.searchFragmentPages.firstCall.args[2].signal.aborted).to.be.true;
        expect(repository.searchFragmentPages.calledOnce).to.be.true;
        expect(editor.searchResults).to.have.lengthOf(0);
        await submit('school');
        expect(repository.searchFragmentPages.secondCall.args[0].path).to.equal('/content/dam/mas/ccd/en_US');
    });

    it('uses the Fragments locale and discards an old locale response without starting a search automatically', async () => {
        let resolveOld;
        repository.searchFragmentPages.onFirstCall().returns({
            next: () => new Promise((resolve) => (resolveOld = resolve)),
        });
        const french = rawFragment(
            'french',
            { callout: 'School in France' },
            {
                path: '/content/dam/mas/acom/fr_FR/french',
            },
        );
        repository.searchFragmentPages.onSecondCall().callsFake(async function* () {
            yield [french];
        });
        await connect();
        const oldSearch = submit('school');
        await waitUntil(() => resolveOld);
        Store.filters.set({ ...Store.filters.get(), locale: 'fr_FR' });
        await editor.updateComplete;
        expect(repository.searchFragmentPages.firstCall.args[2].signal.aborted).to.be.true;
        expect(repository.searchFragmentPages.calledOnce).to.be.true;
        expect(editor.searchResults).to.have.lengthOf(0);
        expect(editor.searchedQuery).to.equal('');
        expect(editor.shadowRoot.querySelector('.preview-notice').textContent).to.include('fr_FR');
        await submit('school');
        expect(repository.searchFragmentPages.secondCall.args[0].path).to.equal('/content/dam/mas/acom/fr_FR');
        resolveOld({ value: fragments, done: false });
        await oldSearch;
        expect(editor.searchResults.map((row) => row.id)).to.deep.equal(['french']);
    });

    it('reports later-page errors without hiding partial results and supports Retry', async () => {
        const error = new Error('AEM unavailable');
        repository.searchFragmentPages.callsFake(async function* () {
            yield [fragments[0]];
            throw error;
        });
        await connect();
        await submit('school');
        expect(editor.fragmentsFailed).to.be.true;
        expect(editor.searchResults).to.have.lengthOf(1);
        expect(repository.processError.calledOnceWithExactly(error, 'Could not load fragments for text search.')).to.be.true;
        await editor.updateComplete;
        expect(editor.shadowRoot.querySelector('[role="alert"]')).to.exist;
        repository.searchFragmentPages.callsFake(async function* () {
            yield [fragments[0]];
        });
        await editor.retrySearch();
        expect(editor.fragmentsFailed).to.be.false;
        expect(editor.searchResults.map((row) => row.id)).to.deep.equal(['school']);
    });

    it('aborts pending pages on disconnect without reporting cancellation as an error', async () => {
        let rejectLoad;
        repository.searchFragmentPages.returns({
            next: () => new Promise((resolve, reject) => (rejectLoad = reject)),
        });
        await connect();
        const search = submit('school');
        await waitUntil(() => rejectLoad);
        editor.remove();
        rejectLoad(new DOMException('Aborted', 'AbortError'));
        await search;
        expect(editor.searchResults).to.have.lengthOf(0);
        expect(repository.searchFragmentPages.firstCall.args[2].signal.aborted).to.be.true;
        expect(repository.processError.called).to.be.false;
    });

    it('keeps server ordering and deduplicates across pages without listing variation copies as parents', async () => {
        const hidden = rawFragment('hidden', { badge: 'School' }, { path: '/content/dam/mas/acom/en_US/baselines/hidden' });
        const grouped = rawFragment('grouped', { badge: 'School' }, { path: '/content/dam/mas/acom/en_US/school/pzn/edu' });
        const promotion = rawFragment(
            'promotion',
            { badge: 'School' },
            {
                path: '/content/dam/mas/acom/en_US/promotions/sale/school',
            },
        );
        const taggedPromotion = rawFragment(
            'tagged-promotion',
            { badge: 'School' },
            {
                tags: [{ id: 'mas:promotion/sale' }],
            },
        );
        repository.searchFragmentPages.callsFake(async function* () {
            yield [fragments[0], hidden, grouped, promotion, taggedPromotion];
            yield [fragments[0], rawFragment('older', { cardTitle: 'Acrobat', callout: 'School' })];
        });
        await connect();
        await submit('school');
        expect(editor.searchResults.map((row) => row.id)).to.deep.equal(['school', 'older']);
        expect(editor.searchFields).to.have.lengthOf(SEARCH_FIELDS.length);
    });

    it('refills past promotion-only pages instead of counting those copies toward the visible parent target', async () => {
        let pages = 0;
        repository.searchFragmentPages.callsFake(async function* () {
            pages++;
            yield Array.from({ length: 25 }, (_, index) =>
                rawFragment(
                    `promo-${index}`,
                    { callout: 'School' },
                    {
                        path: `/content/dam/mas/acom/en_US/promotions/sale/card-${index}`,
                    },
                ),
            );
            pages++;
            yield matchingPage(0);
            pages++;
            yield matchingPage(25);
        });
        await connect();
        await submit('school');
        expect(pages).to.equal(2);
        expect(editor.searchResults).to.have.lengthOf(25);
        expect(editor.searchResults[0].id).to.equal('card-0');
        expect(editor.searchResults[24].id).to.equal('card-24');
        expect(editor.hasMoreResults).to.be.true;
    });

    it('loads variations only on expansion, reuses the loaded family, and keeps children outside the search filter', async () => {
        const family = stubVariations();
        await connect();
        await submit('school');
        expect(repository.aem.sites.cf.fragments.getById.called).to.be.false;
        const parent = editor.searchResults[0];
        await editor.toggleVariations(parent);
        await editor.updateComplete;
        expect(repository.aem.sites.cf.fragments.getById.calledOnce).to.be.true;
        const state = editor.variationStates.get(parent.id);
        expect(state.rows.locale.map((row) => row.id)).to.deep.equal([family.locale.id]);
        expect(state.rows.promotion.map((row) => row.id)).to.deep.equal([family.promotion.id]);
        expect(state.rows.grouped.map((row) => row.id)).to.deep.equal([family.grouped.id]);
        expect(state.rows.locale[0].text.callout).to.equal('Regional text');
        expect(state.rows.grouped[0].text.callout).to.equal('Back to School');
        expect(state.rows.grouped[0].fragment.fields).to.deep.equal(family.grouped.fields);
        expect(state.rows.locale[0].offer).to.equal('Photoshop GB (EN)');
        expect(state.rows.locale[0].icon).to.equal('');
        expect(editor.displayRows.map((row) => row.id)).to.deep.equal(['school', 'variations:school', 'locale']);
        expect(editor.displayRows[2].variationClass).to.equal('variation-cell variation-first variation-last');
        await editor.toggleVariations(parent);
        await editor.updateComplete;
        expect(editor.displayRows.map((row) => row.id)).to.deep.equal(['school']);
        await editor.toggleVariations(parent);
        expect(repository.aem.sites.cf.fragments.getById.calledOnce).to.be.true;
    });

    it('preserves expanded variations and hidden selections while Search in narrows and widens cached results', async () => {
        const family = stubVariations();
        await connect();
        await submit('school');
        const parent = editor.searchResults[0];
        await editor.toggleVariations(parent);
        await editor.updateComplete;
        editor.handleFragmentSelection({ target: { checked: true } }, parent);
        editor.handleFragmentSelection({ target: { checked: true } }, editor.displayRows[2]);
        const state = editor.variationStates.get(parent.id);
        const calls = repository.searchFragmentPages.callCount;
        editor.searchFields = ['badge'];
        await editor.updateComplete;
        expect(editor.searchResults).to.have.lengthOf(0);
        expect(editor.expandedRows.has(parent.id)).to.be.true;
        expect(editor.variationStates.get(parent.id)).to.equal(state);
        expect([...editor.selectedFragments.keys()]).to.deep.equal([parent.id, family.locale.id]);
        editor.searchFields = SEARCH_FIELDS.map(({ value }) => value);
        await editor.updateComplete;
        expect(editor.displayRows.map(({ id }) => id)).to.deep.equal(['school', 'variations:school', 'locale']);
        expect(editor.selectedDisplayedCount).to.equal(2);
        expect(repository.searchFragmentPages.callCount).to.equal(calls);
        expect(repository.aem.sites.cf.fragments.getById.calledOnce).to.be.true;
    });

    it('places each empty variation message below its tabs with the Fragments paragraph styling', async () => {
        const family = stubVariations();
        repository.aem.sites.cf.fragments.getById.resolves({
            ...family.parent,
            references: [],
            fields: family.parent.fields.filter(({ name }) => name !== 'variations'),
        });
        await connect();
        await submit('school');
        const parent = editor.searchResults[0];
        await editor.toggleVariations(parent);
        for (const tab of ['locale', 'promotion', 'grouped']) {
            editor.handleVariationTabChange({ target: { selected: tab } }, parent);
            await editor.updateComplete;
            await waitUntil(
                () => editor.shadowRoot.querySelector('.variation-empty')?.textContent === `No ${tab} variations found.`,
            );
            const message = editor.shadowRoot.querySelector('.variation-empty');
            const tabs = editor.shadowRoot.querySelector('.variation-toolbar sp-tabs');
            await tabs.updateComplete;
            expect(message.tagName).to.equal('P');
            expect(message.closest('.variation-toolbar')).to.equal(null);
            expect(getComputedStyle(message).fontSize).to.equal('14px');
            expect(getComputedStyle(message).fontWeight).to.equal('400');
            expect(message.getBoundingClientRect().left).to.be.closeTo(tabs.getBoundingClientRect().left, 1);
            expect(message.getBoundingClientRect().top - tabs.getBoundingClientRect().bottom).to.be.closeTo(14, 1);
            expect(message.parentElement.getBoundingClientRect().bottom - message.getBoundingClientRect().bottom).to.be.closeTo(
                38,
                1,
            );
        }
    });

    it('filters expanded locales and grouped targets without losing parents, cached families or hidden selections', async () => {
        const family = stubVariations();
        family.grouped.fields.push({ name: 'pznTags', values: ['mas:locale/en_GB'] });
        await connect();
        await submit('school');
        const parent = editor.searchResults[0];
        await editor.toggleVariations(parent);
        await editor.updateComplete;
        const locale = editor.variationStates.get(parent.id).rows.locale[0];
        editor.handleFragmentSelection({ target: { checked: true } }, locale);
        const calls = repository.searchFragmentPages.callCount;
        editor.handleResultFiltersChange({ detail: { ...editor.resultFilters, locales: ['en_US'] } });
        await editor.updateComplete;
        expect(editor.displayRows.map(({ id }) => id)).to.deep.equal(['school', 'variations:school']);
        expect(editor.displayRows[1].empty).to.be.true;
        expect(editor.selectableRows.map(({ id }) => id)).to.deep.equal(['school']);
        expect(editor.selectedFragments.has('locale')).to.be.true;
        editor.handleResultFiltersChange({ detail: { ...editor.resultFilters, locales: ['en_GB'] } });
        editor.handleVariationTabChange({ target: { selected: 'grouped' } }, parent);
        await editor.updateComplete;
        expect(editor.displayRows.map(({ id }) => id)).to.deep.equal(['school', 'variations:school', 'grouped']);
        expect(editor.variationStates.get(parent.id).rows.grouped[0].localeCodes).to.deep.equal(['en_GB']);
        editor.handleResultFiltersChange({ detail: { ...editor.resultFilters, locales: [] } });
        await editor.updateComplete;
        expect(editor.displayRows).to.have.lengthOf(2);
        editor.handleResultFiltersChange({ detail: { ...editor.resultFilters, locales: null } });
        editor.handleVariationTabChange({ target: { selected: 'locale' } }, parent);
        await editor.updateComplete;
        expect(editor.displayRows.map(({ id }) => id)).to.deep.equal(['school', 'variations:school', 'locale']);
        expect(editor.displayRows[2].variationClass).to.equal('variation-cell variation-first variation-last');
        expect(repository.searchFragmentPages.callCount).to.equal(calls);
        expect(repository.aem.sites.cf.fragments.getById.calledOnce).to.be.true;
    });

    it('selects parent and variation independently, preserving selections across tabs, collapse, and queries', async () => {
        const family = stubVariations();
        await connect();
        const selectionChanged = sinon.spy();
        editor.addEventListener('fragment-selection-change', selectionChanged);
        await submit('school');
        const parent = editor.searchResults[0];
        await editor.toggleVariations(parent);
        await editor.updateComplete;
        const locale = editor.variationStates.get(parent.id).rows.locale[0];
        editor.handleFragmentSelection({ target: { checked: true } }, locale);
        await editor.updateComplete;
        expect([...editor.selectedFragments.keys()]).to.deep.equal(['locale']);
        expect(selectionChanged.lastCall.args[0].detail.fragments).to.deep.equal([family.locale]);
        expect(editor.shadowRoot.querySelector('sp-table-head .selection sp-checkbox').indeterminate).to.be.true;
        editor.handleVariationTabChange({ target: { selected: 'grouped' } }, parent);
        await editor.updateComplete;
        const grouped = editor.variationStates.get(parent.id).rows.grouped[0];
        editor.handleFragmentSelection({ target: { checked: true } }, grouped);
        editor.handleFragmentSelection({ target: { checked: true } }, parent);
        editor.handleFragmentSelection({ target: { checked: false } }, parent);
        expect([...editor.selectedFragments.keys()]).to.deep.equal(['locale', 'grouped']);
        await editor.toggleVariations(parent);
        await submit('university');
        expect([...editor.selectedFragments.keys()]).to.deep.equal(['locale', 'grouped']);
        editor.updateSelection(new Map());
        expect(editor.selectedFragments.size).to.equal(0);
    });

    it('selects all displayed rows without selecting variations in other tabs and clears on a surface change', async () => {
        stubVariations();
        await connect();
        await submit('school');
        const parent = editor.searchResults[0];
        await editor.toggleVariations(parent);
        await editor.updateComplete;
        editor.handleSelectAll({ target: { checked: true } });
        await editor.updateComplete;
        expect([...editor.selectedFragments.keys()]).to.deep.equal(['school', 'locale']);
        expect(editor.shadowRoot.querySelector('sp-table-head .selection sp-checkbox').checked).to.be.true;
        editor.handleSelectAll({ target: { checked: false } });
        expect(editor.selectedFragments.size).to.equal(0);
        editor.handleSelectAll({ target: { checked: true } });
        Store.search.set({ ...Store.search.get(), path: 'ccd' });
        await editor.updateComplete;
        expect(editor.selectedFragments.size).to.equal(0);
    });

    it('reports variation loading errors and allows a retry', async () => {
        const family = stubVariations();
        const error = new Error('References unavailable');
        repository.aem.sites.cf.fragments.getById.rejects(error);
        await connect();
        await submit('school');
        const parent = editor.searchResults[0];
        await editor.toggleVariations(parent);
        expect(editor.variationStates.get(parent.id).error).to.be.true;
        expect(repository.processError.calledOnceWithExactly(error, 'Could not load fragment variations.')).to.be.true;
        repository.aem.sites.cf.fragments.getById.resolves(family.parent);
        await editor.loadVariations(parent);
        expect(editor.variationStates.get(parent.id).error).to.be.false;
        expect(editor.variationStates.get(parent.id).rows.locale).to.have.lengthOf(1);
    });

    it('ignores a variation load that finishes after Find is cleared', async () => {
        const family = stubVariations();
        let resolve;
        repository.aem.sites.cf.fragments.getById.returns(new Promise((done) => (resolve = done)));
        await connect();
        await submit('school');
        const expand = editor.toggleVariations(editor.searchResults[0]);
        expect(editor.variationStates.get('school').loading).to.be.true;
        await type('');
        resolve(family.parent);
        await expand;
        expect(repository.aem.sites.cf.fragments.getById.firstCall.args[1].signal.aborted).to.be.true;
        expect(editor.variationStates.size).to.equal(0);
        expect(editor.displayRows).to.have.lengthOf(0);
        expect(repository.processError.called).to.be.false;
    });
});
