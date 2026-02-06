import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { TABLE_TYPE, FILTER_TYPE } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/translation/mas-search-and-filters.js';

describe('MasSearchAndFilters', () => {
    let sandbox;

    const createMockFragment = (overrides = {}) => ({
        title: 'Test Fragment',
        path: '/content/dam/mas/acom/en_US/test-fragment',
        tags: [],
        fields: [],
        ...overrides,
    });

    const createMockPlaceholder = (overrides = {}) => ({
        key: 'test-key',
        value: 'test-value',
        path: '/content/dam/mas/acom/en_US/placeholders/test',
        ...overrides,
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.displayCards.set([]);
        Store.translationProjects.allCollections.set([]);
        Store.translationProjects.displayCollections.set([]);
        Store.translationProjects.allPlaceholders.set([]);
        Store.translationProjects.displayPlaceholders.set([]);
        Store.fragments.list.loading.set(false);
        Store.placeholders.list.loading.set(false);
        Store.placeholders.list.data.set([]);
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.displayCards.set([]);
        Store.translationProjects.allCollections.set([]);
        Store.translationProjects.displayCollections.set([]);
        Store.translationProjects.allPlaceholders.set([]);
        Store.translationProjects.displayPlaceholders.set([]);
        Store.fragments.list.loading.set(false);
        Store.placeholders.list.loading.set(false);
        Store.placeholders.list.data.set([]);
    });

    describe('initialization', () => {
        it('should initialize with default filter values', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.searchQuery).to.equal('');
            expect(el.templateFilter).to.deep.equal([]);
            expect(el.marketSegmentFilter).to.deep.equal([]);
            expect(el.customerSegmentFilter).to.deep.equal([]);
            expect(el.productFilter).to.deep.equal([]);
        });

        it('should accept type property for cards', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.type).to.equal('cards');
        });

        it('should accept type property for collections', async () => {
            const el = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            expect(el.type).to.equal('collections');
        });

        it('should accept type property for placeholders', async () => {
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            expect(el.type).to.equal('placeholders');
        });

        it('should accept searchOnly property', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${true}></mas-search-and-filters>`);
            expect(el.searchOnly).to.be.true;
        });

        it('should have templateOptions populated from VARIANTS when not searchOnly', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            expect(el.templateOptions.length).to.be.greaterThan(0);
        });
    });

    describe('typeUppercased getter', () => {
        it('should return Cards for cards type', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.typeUppercased).to.equal('Cards');
        });

        it('should return Collections for collections type', async () => {
            const el = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            expect(el.typeUppercased).to.equal('Collections');
        });

        it('should return Placeholders for placeholders type', async () => {
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            expect(el.typeUppercased).to.equal('Placeholders');
        });
    });

    describe('isLoading getter', () => {
        it('should return fragments loading state for cards type', async () => {
            Store.fragments.list.loading.set(true);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.isLoading).to.be.true;
        });

        it('should return fragments loading state for collections type', async () => {
            Store.fragments.list.loading.set(true);
            const el = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            expect(el.isLoading).to.be.true;
        });

        it('should return placeholders loading state for placeholders type', async () => {
            Store.placeholders.list.loading.set(true);
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            expect(el.isLoading).to.be.true;
        });

        it('should return false when not loading', async () => {
            Store.fragments.list.loading.set(false);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.isLoading).to.be.false;
        });
    });

    describe('appliedFilters getter', () => {
        it('should return empty array when no filters applied', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.appliedFilters).to.deep.equal([]);
        });

        it('should return template filters with correct format', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.templateFilter = ['plans'];
            await el.updateComplete;
            expect(el.appliedFilters).to.deep.equal([{ type: FILTER_TYPE.TEMPLATE, id: 'plans', label: 'Plans' }]);
        });

        it('should return market segment filters with correct format', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.marketSegmentOptions = [{ id: 'mas:market_segment/com', title: 'Commercial' }];
            el.marketSegmentFilter = ['mas:market_segment/com'];
            await el.updateComplete;
            expect(el.appliedFilters).to.deep.equal([
                { type: FILTER_TYPE.MARKET_SEGMENT, id: 'mas:market_segment/com', label: 'Commercial' },
            ]);
        });

        it('should return customer segment filters with correct format', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.customerSegmentOptions = [{ id: 'mas:customer_segment/individual', title: 'Individual' }];
            el.customerSegmentFilter = ['mas:customer_segment/individual'];
            await el.updateComplete;
            expect(el.appliedFilters).to.deep.equal([
                { type: FILTER_TYPE.CUSTOMER_SEGMENT, id: 'mas:customer_segment/individual', label: 'Individual' },
            ]);
        });

        it('should return product filters with correct format', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.productOptions = [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }];
            el.productFilter = ['mas:product_code/photoshop'];
            await el.updateComplete;
            expect(el.appliedFilters).to.deep.equal([
                { type: FILTER_TYPE.PRODUCT, id: 'mas:product_code/photoshop', label: 'Photoshop' },
            ]);
        });

        it('should return combined filters from all types', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.marketSegmentOptions = [{ id: 'mas:market_segment/com', title: 'Commercial' }];
            el.templateFilter = ['plans'];
            el.marketSegmentFilter = ['mas:market_segment/com'];
            await el.updateComplete;
            expect(el.appliedFilters.length).to.equal(2);
        });

        it('should use label property when title is not available', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.templateOptions = [{ value: 'plans', label: 'Plans Label' }];
            el.templateFilter = ['plans'];
            await el.updateComplete;
            expect(el.appliedFilters[0].label).to.equal('Plans Label');
        });

        it('should skip filters without matching option', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.templateFilter = ['nonexistent'];
            await el.updateComplete;
            expect(el.appliedFilters).to.deep.equal([]);
        });
    });

    describe('rendering', () => {
        it('should render search input', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            expect(search).to.exist;
            expect(search.placeholder).to.equal('Search fragments...');
        });

        it('should render result count', async () => {
            Store.translationProjects.displayCards.set([createMockFragment(), createMockFragment()]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const resultCount = el.shadowRoot.querySelector('.result-count');
            expect(resultCount).to.exist;
            expect(resultCount.textContent).to.include('2');
            expect(resultCount.textContent).to.include('results');
        });

        it('should render singular result for 1 item', async () => {
            Store.translationProjects.displayCards.set([createMockFragment()]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const resultCount = el.shadowRoot.querySelector('.result-count');
            expect(resultCount.textContent).to.include('1');
            expect(resultCount.textContent).to.include('result');
            expect(resultCount.textContent).to.not.include('results');
        });

        it('should render progress circle when loading', async () => {
            Store.fragments.list.loading.set(true);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(progressCircle).to.exist;
        });

        it('should disable search when loading', async () => {
            Store.fragments.list.loading.set(true);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            expect(search.disabled).to.be.true;
        });
    });

    describe('filters rendering', () => {
        it('should render filter dropdowns when searchOnly is false', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters).to.exist;
        });

        it('should not render filter dropdowns when searchOnly is true', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${true}></mas-search-and-filters>`);
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters).to.be.null;
        });

        it('should render four filter triggers', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filterTriggers = el.shadowRoot.querySelectorAll('.filter-trigger');
            expect(filterTriggers.length).to.equal(4);
        });

        it('should render Template filter', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Template');
        });

        it('should render Market Segment filter', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Market Segment');
        });

        it('should render Customer Segment filter', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Customer Segment');
        });

        it('should render Product filter', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Product');
        });

        it('should show filter count in label when filters are selected', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans', 'catalog'];
            await el.updateComplete;
            const filterTriggers = el.shadowRoot.querySelectorAll('.filter-trigger');
            expect(filterTriggers[0].textContent).to.include('(2)');
        });

        it('should disable filter triggers when loading', async () => {
            Store.fragments.list.loading.set(true);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filterTriggers = el.shadowRoot.querySelectorAll('.filter-trigger');
            filterTriggers.forEach((trigger) => {
                expect(trigger.disabled).to.be.true;
            });
        });
    });

    describe('applied filters rendering', () => {
        it('should not render applied filters section when no filters applied', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const appliedFilters = el.shadowRoot.querySelector('.applied-filters');
            expect(appliedFilters).to.be.null;
        });

        it('should render applied filters section when filters are applied', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.templateFilter = ['plans'];
            await el.updateComplete;
            const appliedFilters = el.shadowRoot.querySelector('.applied-filters');
            expect(appliedFilters).to.exist;
        });

        it('should render sp-tags for applied filters', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.templateFilter = ['plans'];
            await el.updateComplete;
            const tags = el.shadowRoot.querySelector('sp-tags');
            expect(tags).to.exist;
        });

        it('should render individual sp-tag for each filter', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [
                { id: 'plans', title: 'Plans' },
                { id: 'catalog', title: 'Catalog' },
            ];
            el.templateFilter = ['plans', 'catalog'];
            await el.updateComplete;
            const tagElements = el.shadowRoot.querySelectorAll('sp-tag');
            expect(tagElements.length).to.equal(2);
        });

        it('should render Clear all button', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.templateFilter = ['plans'];
            await el.updateComplete;
            const clearButton = el.shadowRoot.querySelector('.applied-filters sp-action-button');
            expect(clearButton).to.exist;
            expect(clearButton.textContent).to.include('Clear all');
        });
    });

    describe('search functionality', () => {
        it('should update searchQuery on input', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'test query';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.searchQuery).to.equal('test query');
        });

        it('should filter cards by title', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ title: 'Photoshop Card' }),
                createMockFragment({ title: 'Illustrator Card' }),
                createMockFragment({ title: 'Another Photoshop' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'photoshop';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(2);
        });

        it('should filter cards case-insensitively', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ title: 'PHOTOSHOP Card' }),
                createMockFragment({ title: 'photoshop Card' }),
                createMockFragment({ title: 'Illustrator Card' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'Photoshop';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(2);
        });

        it('should filter cards by product tag title', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    title: 'Card 1',
                    tags: [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }],
                }),
                createMockFragment({ title: 'Card 2', tags: [] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'photoshop';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter cards by offerId', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    title: 'Card 1',
                    offerData: { offerId: '12345ABCDE' },
                }),
                createMockFragment({ title: 'Card 2' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = '12345';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter placeholders by key', async () => {
            Store.translationProjects.allPlaceholders.set([
                createMockPlaceholder({ key: 'buy-now', value: 'Buy Now' }),
                createMockPlaceholder({ key: 'learn-more', value: 'Learn More' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'buy';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayPlaceholders.get().length).to.equal(1);
        });

        it('should filter placeholders by value', async () => {
            Store.translationProjects.allPlaceholders.set([
                createMockPlaceholder({ key: 'cta-1', value: 'Buy Now' }),
                createMockPlaceholder({ key: 'cta-2', value: 'Learn More' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'Learn';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayPlaceholders.get().length).to.equal(1);
        });

        it('should handle search submit event', async () => {
            Store.translationProjects.allCards.set([createMockFragment({ title: 'Test Card' })]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = 'test';
            const search = el.shadowRoot.querySelector('sp-search');
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            search.dispatchEvent(submitEvent);
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });
    });

    describe('filter extraction', () => {
        it('should extract market segment options from fragments', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/edu', title: 'Education' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(2);
        });

        it('should extract market segment options with alternate prefix', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(1);
        });

        it('should extract customer segment options from fragments', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:customer_segment/individual', title: 'Individual' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.customerSegmentOptions.length).to.equal(1);
        });

        it('should extract product options from fragments', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.productOptions.length).to.equal(1);
        });

        it('should deduplicate options', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(1);
        });

        it('should sort options alphabetically', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/zebra', title: 'Zebra' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/alpha', title: 'Alpha' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions[0].title).to.equal('Alpha');
            expect(el.marketSegmentOptions[1].title).to.equal('Zebra');
        });

        it('should skip fragments without tags', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: null }),
                createMockFragment({ tags: undefined }),
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(1);
        });

        it('should extract title from tag id when title is missing', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/commercial' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions[0].title).to.equal('commercial');
        });

        it('should not extract filter options when searchOnly is true', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${true}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(0);
        });
    });

    describe('filter application', () => {
        it('should filter by template variant', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    fields: [{ name: 'variant', values: ['plans'] }],
                }),
                createMockFragment({
                    fields: [{ name: 'variant', values: ['catalog'] }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans'];
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by market segment tag', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/edu', title: 'Education' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.marketSegmentFilter = ['mas:market_segment/com'];
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by customer segment tag', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:customer_segment/individual', title: 'Individual' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:customer_segment/team', title: 'Team' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.customerSegmentFilter = ['mas:customer_segment/individual'];
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by product tag', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:product_code/illustrator', title: 'Illustrator' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.productFilter = ['mas:product_code/photoshop'];
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should combine multiple filters with AND logic', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [
                        { id: 'mas:market_segment/com', title: 'Commercial' },
                        { id: 'mas:product_code/photoshop', title: 'Photoshop' },
                    ],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.marketSegmentFilter = ['mas:market_segment/com'];
            el.productFilter = ['mas:product_code/photoshop'];
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should return fragment if any of selected template values match', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    fields: [{ name: 'variant', values: ['plans', 'catalog'] }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans'];
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should exclude fragment if variant field has no values', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    fields: [{ name: 'variant', values: [] }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans'];
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(0);
        });

        it('should exclude fragment if variant field is missing', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    fields: [{ name: 'other', values: ['value'] }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans'];
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(0);
        });
    });

    describe('checkbox change handling', () => {
        it('should add filter when checkbox is checked', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            await el.updateComplete;
            const checkbox = el.shadowRoot.querySelector('sp-checkbox');
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            expect(el.templateFilter).to.include('plans');
        });

        it('should remove filter when checkbox is unchecked', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.templateFilter = ['plans'];
            await el.updateComplete;
            const checkbox = el.shadowRoot.querySelector('sp-checkbox');
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            expect(el.templateFilter).to.not.include('plans');
        });

        it('should not duplicate filter when already present', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.templateFilter = ['plans'];
            await el.updateComplete;
            const checkbox = el.shadowRoot.querySelector('sp-checkbox');
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            expect(el.templateFilter.filter((f) => f === 'plans').length).to.equal(1);
        });
    });

    describe('tag deletion', () => {
        it('should remove template filter on tag delete', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.templateFilter = ['plans'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.TEMPLATE, id: 'plans' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.templateFilter).to.not.include('plans');
        });

        it('should remove market segment filter on tag delete', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.marketSegmentOptions = [{ id: 'mas:market_segment/com', title: 'Commercial' }];
            el.marketSegmentFilter = ['mas:market_segment/com'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.MARKET_SEGMENT, id: 'mas:market_segment/com' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.marketSegmentFilter).to.not.include('mas:market_segment/com');
        });

        it('should remove customer segment filter on tag delete', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.customerSegmentOptions = [{ id: 'mas:customer_segment/individual', title: 'Individual' }];
            el.customerSegmentFilter = ['mas:customer_segment/individual'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.CUSTOMER_SEGMENT, id: 'mas:customer_segment/individual' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.customerSegmentFilter).to.not.include('mas:customer_segment/individual');
        });

        it('should remove product filter on tag delete', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.productOptions = [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }];
            el.productFilter = ['mas:product_code/photoshop'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.PRODUCT, id: 'mas:product_code/photoshop' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.productFilter).to.not.include('mas:product_code/photoshop');
        });
    });

    describe('clear all filters', () => {
        it('should clear all filters when clear button is clicked', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.marketSegmentOptions = [{ id: 'mas:market_segment/com', title: 'Commercial' }];
            el.templateFilter = ['plans'];
            el.marketSegmentFilter = ['mas:market_segment/com'];
            el.customerSegmentFilter = ['mas:customer_segment/individual'];
            el.productFilter = ['mas:product_code/photoshop'];
            await el.updateComplete;
            const clearButton = el.shadowRoot.querySelector('.applied-filters sp-action-button');
            clearButton.click();
            await el.updateComplete;
            expect(el.templateFilter).to.deep.equal([]);
            expect(el.marketSegmentFilter).to.deep.equal([]);
            expect(el.customerSegmentFilter).to.deep.equal([]);
            expect(el.productFilter).to.deep.equal([]);
        });
    });

    describe('disconnectedCallback', () => {
        it('should reset displayCards to allCards on disconnect for cards type', async () => {
            Store.translationProjects.allCards.set([createMockFragment()]);
            Store.translationProjects.displayCards.set([]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.disconnectedCallback();
            expect(Store.translationProjects.displayCards.get()).to.deep.equal(Store.translationProjects.allCards.get());
        });

        it('should reset displayCollections to allCollections on disconnect for collections type', async () => {
            Store.translationProjects.allCollections.set([createMockFragment()]);
            Store.translationProjects.displayCollections.set([]);
            const el = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            el.disconnectedCallback();
            expect(Store.translationProjects.displayCollections.get()).to.deep.equal(
                Store.translationProjects.allCollections.get(),
            );
        });

        it('should reset displayPlaceholders to allPlaceholders on disconnect for placeholders type', async () => {
            Store.translationProjects.allPlaceholders.set([createMockPlaceholder()]);
            Store.translationProjects.displayPlaceholders.set([]);
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            el.disconnectedCallback();
            expect(Store.translationProjects.displayPlaceholders.get()).to.deep.equal(
                Store.translationProjects.allPlaceholders.get(),
            );
        });

        it('should handle disconnect gracefully', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            let error = null;
            try {
                el.disconnectedCallback();
            } catch (e) {
                error = e;
            }
            expect(error).to.be.null;
        });
    });

    describe('reactivity', () => {
        it('should update when allCards store changes', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }],
                }),
            ]);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(1);
        });

        it('should update when allCollections store changes', async () => {
            const el = await fixture(
                html`<mas-search-and-filters type="collections" .searchOnly=${false}></mas-search-and-filters>`,
            );
            Store.translationProjects.allCollections.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }],
                }),
            ]);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(1);
        });

        it('should update when placeholders list data changes', async () => {
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            Store.placeholders.list.data.set([createMockPlaceholder()]);
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('sp-search')).to.exist;
        });
    });

    describe('edge cases', () => {
        it('should handle empty search query', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ title: 'Card 1' }),
                createMockFragment({ title: 'Card 2' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = '';
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(2);
        });

        it('should handle fragments without title', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ title: undefined }),
                createMockFragment({ title: 'Has Title' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'Has';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should handle placeholders without key or value', async () => {
            Store.translationProjects.allPlaceholders.set([
                createMockPlaceholder({ key: undefined, value: undefined }),
                createMockPlaceholder({ key: 'has-key', value: 'has-value' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'has';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayPlaceholders.get().length).to.equal(1);
        });

        it('should handle fragments without offerData', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ offerData: undefined }),
                createMockFragment({ offerData: { offerId: 'ABC123' } }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'ABC';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should handle empty source array', async () => {
            Store.translationProjects.allCards.set([]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = 'test';
            const search = el.shadowRoot.querySelector('sp-search');
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get()).to.deep.equal([]);
        });

        it('should handle tag with empty id', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: '', title: 'Empty ID' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(0);
        });

        it('should stop propagation on sp-closed event from overlay', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            let propagated = false;
            el.addEventListener('sp-closed', () => {
                propagated = true;
            });
            const overlayTrigger = el.shadowRoot.querySelector('overlay-trigger');
            const closedEvent = new CustomEvent('sp-closed', { bubbles: true });
            overlayTrigger.dispatchEvent(closedEvent);
            expect(propagated).to.be.false;
        });
    });

    describe('template options', () => {
        it('should populate templateOptions excluding "All" variant', async () => {
            Store.translationProjects.allCards.set([createMockFragment()]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const allOption = el.templateOptions.find((opt) => opt.title.toLowerCase() === 'all');
            expect(allOption).to.be.undefined;
        });

        it('should have templateOptions with id and title from VARIANTS', async () => {
            Store.translationProjects.allCards.set([createMockFragment()]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.templateOptions.length).to.be.greaterThan(0);
            el.templateOptions.forEach((opt) => {
                expect(opt).to.have.property('id');
                expect(opt).to.have.property('title');
            });
        });
    });

    describe('collections type', () => {
        it('should filter collections by title', async () => {
            Store.translationProjects.allCollections.set([
                createMockFragment({ title: 'Photoshop Collection' }),
                createMockFragment({ title: 'Illustrator Collection' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'photoshop';
            search.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await el.updateComplete;
            expect(Store.translationProjects.displayCollections.get().length).to.equal(1);
        });

        it('should render result count for collections', async () => {
            Store.translationProjects.displayCollections.set([createMockFragment(), createMockFragment()]);
            const el = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            const resultCount = el.shadowRoot.querySelector('.result-count');
            expect(resultCount.textContent).to.include('2');
        });
    });
});
