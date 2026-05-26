import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { TABLE_TYPE, FILTER_TYPE } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/common/components/mas-search-and-filters.js';

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
        setItemsSelectionStore(Store.translationProjects);
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.displayCards.set([]);
        Store.translationProjects.allCollections.set([]);
        Store.translationProjects.displayCollections.set([]);
        Store.translationProjects.allPlaceholders.set([]);
        Store.translationProjects.displayPlaceholders.set([]);
        Store.fragments.list.loading.set(false);
        Store.fragments.list.firstPageLoaded.set(true);
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
        Store.fragments.list.firstPageLoaded.set(false);
        Store.placeholders.list.loading.set(false);
        Store.placeholders.list.data.set([]);
        setItemsSelectionStore(null);
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
        it('should return true for cards type when firstPageLoaded is false', async () => {
            Store.fragments.list.firstPageLoaded.set(false);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.isLoading).to.be.true;
        });

        it('should return true for collections type when firstPageLoaded is false', async () => {
            Store.fragments.list.firstPageLoaded.set(false);
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
        it('should render result count', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const resultCount = el.shadowRoot.querySelector('.result-count');
            expect(resultCount).to.exist;
        });

        it('should render progress circle when loading', async () => {
            Store.fragments.list.firstPageLoaded.set(false);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(progressCircle).to.exist;
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
            Store.fragments.list.firstPageLoaded.set(false);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filterTriggers = el.shadowRoot.querySelectorAll('.filter-trigger');
            filterTriggers.forEach((trigger) => {
                expect(trigger.disabled).to.be.true;
            });
        });

        it('should stop filter checkbox change events from bubbling to ancestors', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            await el.updateComplete;
            let ancestorSawChange = false;
            el.addEventListener('change', () => {
                ancestorSawChange = true;
            });
            const checkbox = el.shadowRoot.querySelector('sp-checkbox');
            checkbox.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
            expect(ancestorSawChange).to.be.false;
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
        it('should filter displayCards locally when searchQuery is set on cards', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ title: 'Photoshop', path: '/content/dam/mas/acom/en_US/photoshop' }),
                createMockFragment({ title: 'Illustrator', path: '/content/dam/mas/acom/en_US/illustrator' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = 'nomatch';
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(0);
        });

        it('should filter displayCards locally when searchQuery changes', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ title: 'Photoshop card' }),
                createMockFragment({ title: 'Illustrator card' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = '';
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(2);
        });

        it('should clear displayCards filter when searchQuery is empty', async () => {
            Store.translationProjects.allCards.set([createMockFragment({ title: 'test card' })]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = 'nomatch';
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(0);
            el.searchQuery = '';
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter placeholders by key', async () => {
            Store.translationProjects.allPlaceholders.set([
                createMockPlaceholder({ key: 'buy-now', value: 'Buy Now' }),
                createMockPlaceholder({ key: 'learn-more', value: 'Learn More' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            el.searchQuery = 'buy';
            await el.updateComplete;
            expect(Store.translationProjects.displayPlaceholders.get().length).to.equal(1);
        });

        it('should filter placeholders by value', async () => {
            Store.translationProjects.allPlaceholders.set([
                createMockPlaceholder({ key: 'cta-1', value: 'Buy Now' }),
                createMockPlaceholder({ key: 'cta-2', value: 'Learn More' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            el.searchQuery = 'Learn';
            await el.updateComplete;
            expect(Store.translationProjects.displayPlaceholders.get().length).to.equal(1);
        });

        it('should filter displayCollections by studioPath when searchQuery matches', async () => {
            Store.translationProjects.allCollections.set([
                createMockFragment({ title: '', studioPath: 'sandbox/promo-collection' }),
                createMockFragment({ title: '', studioPath: 'sandbox/other-collection' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            el.searchQuery = 'promo';
            await el.updateComplete;
            const result = Store.translationProjects.displayCollections.get();
            expect(result.length).to.equal(1);
            expect(result[0].studioPath).to.equal('sandbox/promo-collection');
        });

        it('should filter displayCollections by path when studioPath is missing', async () => {
            Store.translationProjects.allCollections.set([
                createMockFragment({
                    title: '',
                    path: '/content/dam/mas/acom/en_US/special-collection',
                }),
                createMockFragment({
                    title: '',
                    path: '/content/dam/mas/acom/en_US/regular-collection',
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            el.searchQuery = 'special';
            await el.updateComplete;
            const result = Store.translationProjects.displayCollections.get();
            expect(result.length).to.equal(1);
            expect(result[0].path).to.include('special-collection');
        });

        it('should filter displayPlaceholders by exact key value', async () => {
            Store.translationProjects.allPlaceholders.set([
                createMockPlaceholder({ key: 'cta-promo', value: 'Buy now' }),
                createMockPlaceholder({ key: 'cta-learn', value: 'Learn more' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            el.searchQuery = 'cta-promo';
            await el.updateComplete;
            const result = Store.translationProjects.displayPlaceholders.get();
            expect(result.length).to.equal(1);
            expect(result[0].key).to.equal('cta-promo');
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
        it('should filter by template variant — excludes non-matching cards', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ fields: [{ name: 'variant', values: ['plans'] }] }),
                createMockFragment({ fields: [{ name: 'variant', values: ['catalog'] }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by market segment tag', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }] }),
                createMockFragment({ tags: [{ id: 'mas:market_segment/edu', title: 'Education' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.marketSegmentFilter = ['mas:market_segment/com'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by customer segment tag', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: [{ id: 'mas:customer_segment/individual', title: 'Individual' }] }),
                createMockFragment({ tags: [{ id: 'mas:customer_segment/team', title: 'Team' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.customerSegmentFilter = ['mas:customer_segment/individual'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by product tag', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }] }),
                createMockFragment({ tags: [{ id: 'mas:product_code/illustrator', title: 'Illustrator' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.productFilter = ['mas:product_code/photoshop'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should combine multiple filters — only cards matching all appear', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [
                        { id: 'mas:market_segment/com', title: 'Commercial' },
                        { id: 'mas:product_code/photoshop', title: 'Photoshop' },
                    ],
                }),
                createMockFragment({ tags: [{ id: 'mas:market_segment/com', title: 'Commercial' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.marketSegmentFilter = ['mas:market_segment/com'];
            el.productFilter = ['mas:product_code/photoshop'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should include all cards matching any selected template id', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ fields: [{ name: 'variant', values: ['plans'] }] }),
                createMockFragment({ fields: [{ name: 'variant', values: ['catalog'] }] }),
                createMockFragment({ fields: [{ name: 'variant', values: ['other'] }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans', 'catalog'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(2);
        });

        it('should exclude fragment if variant field has no values', async () => {
            Store.translationProjects.allCards.set([createMockFragment({ fields: [{ name: 'variant', values: [] }] })]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(0);
        });

        it('should exclude fragment if variant field is missing', async () => {
            Store.translationProjects.allCards.set([createMockFragment({ fields: [{ name: 'other', values: ['value'] }] })]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans'];
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
            expect(el.shadowRoot.querySelector('.result-count')).to.exist;
        });

        it('re-applies search filter on cards when allCards grows mid-search', async () => {
            const el = await fixture(
                html`<mas-search-and-filters type="cards" .searchQuery=${'vip'}></mas-search-and-filters>`,
            );
            Store.translationProjects.allCards.set([createMockFragment({ title: 'VIP Plan' })]);
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.value).to.have.lengthOf(1);

            Store.translationProjects.allCards.set([
                createMockFragment({ title: 'VIP Plan' }),
                createMockFragment({ title: 'Other Plan' }),
                createMockFragment({ title: 'Free Trial' }),
            ]);
            await el.updateComplete;

            const result = Store.translationProjects.displayCards.value;
            expect(result).to.have.lengthOf(1);
            expect(result[0].title).to.equal('VIP Plan');
        });

        it('re-applies search filter on collections when allCollections grows mid-search', async () => {
            const el = await fixture(
                html`<mas-search-and-filters type="collections" .searchQuery=${'vip'}></mas-search-and-filters>`,
            );
            Store.translationProjects.allCollections.set([createMockFragment({ title: 'VIP Bundle' })]);
            await el.updateComplete;
            expect(Store.translationProjects.displayCollections.value).to.have.lengthOf(1);

            Store.translationProjects.allCollections.set([
                createMockFragment({ title: 'VIP Bundle' }),
                createMockFragment({ title: 'Standard Bundle' }),
            ]);
            await el.updateComplete;

            const result = Store.translationProjects.displayCollections.value;
            expect(result).to.have.lengthOf(1);
            expect(result[0].title).to.equal('VIP Bundle');
        });

        it('re-applies search filter on placeholders when allPlaceholders grows mid-search', async () => {
            const el = await fixture(
                html`<mas-search-and-filters type="placeholders" .searchQuery=${'price'}></mas-search-and-filters>`,
            );
            Store.translationProjects.allPlaceholders.set([createMockPlaceholder({ key: 'price-tag', value: 'foo' })]);
            await el.updateComplete;
            expect(Store.translationProjects.displayPlaceholders.value).to.have.lengthOf(1);

            Store.translationProjects.allPlaceholders.set([
                createMockPlaceholder({ key: 'price-tag', value: 'foo' }),
                createMockPlaceholder({ key: 'name', value: 'bar' }),
                createMockPlaceholder({ key: 'label', value: 'baz' }),
            ]);
            await el.updateComplete;

            const result = Store.translationProjects.displayPlaceholders.value;
            expect(result).to.have.lengthOf(1);
            expect(result[0].key).to.equal('price-tag');
        });
    });

    describe('edge cases', () => {
        it('should handle empty search query — clears Store.search.query', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = 'test';
            await el.updateComplete;
            el.searchQuery = '';
            await el.updateComplete;
            expect(Store.search.get().query).to.be.undefined;
        });

        it('should handle non-empty search query — filters displayCards locally', async () => {
            Store.translationProjects.allCards.set([createMockFragment({ title: 'no-match' })]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = 'Has';
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(0);
        });

        it('should handle placeholders without key or value', async () => {
            Store.translationProjects.allPlaceholders.set([
                createMockPlaceholder({ key: undefined, value: undefined }),
                createMockPlaceholder({ key: 'has-key', value: 'has-value' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            el.searchQuery = 'has';
            await el.updateComplete;
            expect(Store.translationProjects.displayPlaceholders.get().length).to.equal(1);
        });

        it('should handle non-empty search query — propagates to displayCards local filter', async () => {
            Store.translationProjects.allCards.set([createMockFragment({ title: 'no-match' })]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = 'ABC';
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(0);
        });

        it('should clear Store.search.query when empty search applied', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = '';
            await el.updateComplete;
            expect(Store.search.get().query).to.be.undefined;
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
        it('should filter displayCollections locally when searchQuery is set', async () => {
            Store.translationProjects.allCollections.set([
                createMockFragment({ title: 'photoshop collection' }),
                createMockFragment({ title: 'illustrator collection' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            el.searchQuery = 'photoshop';
            await el.updateComplete;
            expect(Store.translationProjects.displayCollections.get().length).to.equal(1);
        });
    });
});
