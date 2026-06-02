import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { TABLE_TYPE, FILTER_TYPE } from '../../src/constants.js';
import { setNamespaceCache } from '../../src/aem/tag-cache.js';
import '../../src/swc.js';
import '../../src/common/components/mas-search-and-filters.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';

// Seed the shared taxonomy cache with tags under one or more roots.
// seedTaxonomy({ custom: ['Accordion'], pzn: [['edu', 'EDU']] }) — value is a title (slug derived)
// or a [slug, title] pair, or a full cq path string.
const seedTaxonomy = (byRoot) => {
    const entries = [];
    for (const [root, values] of Object.entries(byRoot)) {
        for (const value of values) {
            let path, title, slug;
            if (typeof value === 'string' && value.startsWith('/content/cq:tags/')) {
                path = value;
                slug = path.split('/').pop();
                title = slug;
            } else {
                [slug, title] = Array.isArray(value) ? value : [value.toLowerCase().replace(/\s+/g, '-'), value];
                path = `/content/cq:tags/mas/${root}/${slug}`;
            }
            entries.push([path, { path, title, name: slug }]);
        }
    }
    setNamespaceCache(MAS_TAG_NAMESPACE, new Map(entries));
};
const seedCustomTagTaxonomy = (titles = ['Accordion', 'Marquee', 'Test']) => seedTaxonomy({ custom: titles });

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
        setNamespaceCache(MAS_TAG_NAMESPACE, new Map());
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
        setNamespaceCache(MAS_TAG_NAMESPACE, undefined);
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

        it('should initialize statusFilter as empty', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.statusFilter).to.deep.equal([]);
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

        it('should return status filters with correct format', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.statusOptions = [{ id: 'PUBLISHED', title: 'Published' }];
            el.statusFilter = ['PUBLISHED'];
            await el.updateComplete;
            expect(el.appliedFilters).to.deep.equal([{ type: FILTER_TYPE.STATUS, id: 'PUBLISHED', label: 'Published' }]);
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

        const seedEveryFilterTaxonomy = () =>
            seedTaxonomy({
                market_segments: [['com', 'Commercial']],
                customer_segment: [['individual', 'Individual']],
                product_code: [['photoshop', 'Photoshop']],
                offer_type: [['base', 'Base']],
                plan_type: [['abm', 'ABM']],
                custom: ['Featured'],
                pzn: [['edu', 'EDU']],
            });

        it('should render all nine filter triggers when every bucket has options', async () => {
            seedEveryFilterTaxonomy();
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const filterTriggers = el.shadowRoot.querySelectorAll('.filter-trigger');
            expect(filterTriggers.length).to.equal(9);
        });

        it('should not render a filter trigger when its bucket has no options', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.not.include('Personalization');
        });

        it('should render Template filter', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Template');
        });

        it('should render Market Segment filter', async () => {
            seedEveryFilterTaxonomy();
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Market Segment');
        });

        it('should render Customer Segment filter', async () => {
            seedEveryFilterTaxonomy();
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Customer Segment');
        });

        it('should render Product filter', async () => {
            seedEveryFilterTaxonomy();
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Product');
        });

        it('labels the product filter "Product Code"', async () => {
            seedTaxonomy({ product_code: [['ccsn', 'Creative Cloud']] });
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Product Code');
        });

        it('should render Tag filter', async () => {
            seedEveryFilterTaxonomy();
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Tag');
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

    describe('filter options from taxonomy', () => {
        it('populates every tag-based filter from the AEM taxonomy, not loaded fragments', async () => {
            seedTaxonomy({
                market_segments: [
                    ['com', 'Commercial'],
                    ['edu', 'Education'],
                ],
                customer_segment: [['individual', 'Individual']],
                product_code: [['photoshop', 'Photoshop']],
                offer_type: [['base', 'Base']],
                plan_type: [['abm', 'ABM']],
                custom: ['Featured'],
            });
            Store.translationProjects.allCards.set([createMockFragment({ tags: [] })]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.map((o) => o.id)).to.have.members([
                'mas:market_segments/com',
                'mas:market_segments/edu',
            ]);
            expect(el.customerSegmentOptions.map((o) => o.id)).to.deep.equal(['mas:customer_segment/individual']);
            expect(el.productOptions.map((o) => o.id)).to.deep.equal(['mas:product_code/photoshop']);
            expect(el.offerTypeOptions.map((o) => o.id)).to.deep.equal(['mas:offer_type/base']);
            expect(el.planTypeOptions.map((o) => o.id)).to.deep.equal(['mas:plan_type/abm']);
            expect(el.tagOptions.map((o) => o.id)).to.deep.equal(['mas:custom/featured']);
        });

        it('renders tag-based filters even when no loaded fragment carries those tags', async () => {
            seedTaxonomy({ market_segments: [['com', 'Commercial']], offer_type: [['base', 'Base']] });
            Store.translationProjects.allCards.set([createMockFragment({ tags: [{ id: 'mas:plan_type/abm' }] })]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Market Segment');
            expect(filters.textContent).to.include('Offer Type');
        });

        it('sorts options alphabetically by title', async () => {
            seedTaxonomy({
                market_segments: [
                    ['zebra', 'Zebra'],
                    ['alpha', 'Alpha'],
                ],
            });
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.map((o) => o.title)).to.deep.equal(['Alpha', 'Zebra']);
        });

        it('excludes pzn country tags from the Personalization options', async () => {
            seedTaxonomy({
                pzn: [
                    ['edu', 'EDU'],
                    ['general', 'General'],
                    '/content/cq:tags/mas/pzn/country/fr_FR',
                    '/content/cq:tags/mas/pzn/country',
                ],
            });
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const ids = el.pznOptions.map((o) => o.id);
            expect(ids).to.have.members(['mas:pzn/edu', 'mas:pzn/general']);
            expect(ids.some((id) => id.startsWith('mas:pzn/country'))).to.be.false;
        });

        it('collapses product_code options to parent-level products', async () => {
            seedTaxonomy({
                product_code: [
                    ['ccsn', 'Creative Cloud'],
                    '/content/cq:tags/mas/product_code/ccsn/photoshop',
                    '/content/cq:tags/mas/product_code/ccsn/illustrator',
                    ['phsp', 'Photoshop Single App'],
                ],
            });
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const ids = el.productOptions.map((o) => o.id);
            expect(ids).to.have.members(['mas:product_code/ccsn', 'mas:product_code/phsp']);
            expect(ids.some((id) => id.includes('/photoshop') || id.includes('/illustrator'))).to.be.false;
        });

        it('does not load taxonomy filter options when searchOnly is true', async () => {
            seedTaxonomy({ market_segments: [['com', 'Commercial']] });
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${true}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(0);
        });

        it('renders a Status filter with Published/Draft/Modified options', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.statusOptions.map((o) => o.id)).to.have.members(['PUBLISHED', 'DRAFT', 'MODIFIED']);
            expect(el.statusOptions.map((o) => o.title)).to.have.members(['Published', 'Draft', 'Modified']);
        });

        it('does not populate Status options when searchOnly is true', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${true}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.statusOptions.length).to.equal(0);
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

        it('should filter by status', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ status: 'PUBLISHED' }),
                createMockFragment({ status: 'DRAFT' }),
                createMockFragment({ status: 'MODIFIED' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.statusFilter = ['PUBLISHED'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by multiple statuses (OR within the filter)', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ status: 'PUBLISHED' }),
                createMockFragment({ status: 'DRAFT' }),
                createMockFragment({ status: 'MODIFIED' }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.statusFilter = ['PUBLISHED', 'MODIFIED'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(2);
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

        it('should filter by offer type tag', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: [{ id: 'mas:offer_type/base', title: 'Base' }] }),
                createMockFragment({ tags: [{ id: 'mas:offer_type/trial', title: 'Trial' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.offerTypeFilter = ['mas:offer_type/base'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by plan type tag', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: [{ id: 'mas:plan_type/abm', title: 'ABM' }] }),
                createMockFragment({ tags: [{ id: 'mas:plan_type/puf', title: 'PUF' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.planTypeFilter = ['mas:plan_type/abm'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by tag (custom)', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: [{ id: 'mas:custom/featured', title: 'Featured' }] }),
                createMockFragment({ tags: [{ id: 'mas:custom/legacy', title: 'Legacy' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.tagFilter = ['mas:custom/featured'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should filter by personalization tag', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: [{ id: 'mas:pzn/edu', title: 'EDU' }] }),
                createMockFragment({ tags: [{ id: 'mas:pzn/general', title: 'General' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.pznFilter = ['mas:pzn/edu'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('matches a descendant product when its parent product code is selected (end-to-end)', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: [{ id: 'mas:product_code/ccsn/photoshop', title: 'Photoshop' }] }),
                createMockFragment({ tags: [{ id: 'mas:product_code/other', title: 'Other' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.productFilter = ['mas:product_code/ccsn'];
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
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
        it('should update displayed cards when allCards store changes', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            Store.translationProjects.allCards.set([
                createMockFragment({ tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }] }),
            ]);
            await el.updateComplete;
            expect(Store.translationProjects.displayCards.get().length).to.equal(1);
        });

        it('should update displayed collections when allCollections store changes', async () => {
            const el = await fixture(
                html`<mas-search-and-filters type="collections" .searchOnly=${false}></mas-search-and-filters>`,
            );
            Store.translationProjects.allCollections.set([
                createMockFragment({ tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }] }),
            ]);
            await el.updateComplete;
            expect(Store.translationProjects.displayCollections.get().length).to.equal(1);
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

    describe('resetFilters', () => {
        it('clears template, market, customer, and product filter arrays', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['a'];
            el.marketSegmentFilter = ['b'];
            el.customerSegmentFilter = ['c'];
            el.productFilter = ['d'];
            await el.updateComplete;
            el.resetFilters();
            expect(el.templateFilter).to.deep.equal([]);
            expect(el.marketSegmentFilter).to.deep.equal([]);
            expect(el.customerSegmentFilter).to.deep.equal([]);
            expect(el.productFilter).to.deep.equal([]);
        });
    });

    describe('offer_type / plan_type / pzn tag filters', () => {
        const fragmentWithTags = (tags, extras = {}) =>
            createMockFragment({ tags: tags.map((id) => ({ id, title: id.split('/').pop() })), ...extras });

        it('initializes new filter arrays as empty', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.offerTypeFilter).to.deep.equal([]);
            expect(el.planTypeFilter).to.deep.equal([]);
            expect(el.pznFilter).to.deep.equal([]);
        });

        it('populates offer_type / plan_type / pzn options from the taxonomy', async () => {
            seedTaxonomy({
                offer_type: [
                    ['base', 'Base'],
                    ['trial', 'Trial'],
                ],
                plan_type: [
                    ['abm', 'ABM'],
                    ['puf', 'PUF'],
                ],
                pzn: [['general', 'General']],
            });
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.offerTypeOptions.map((o) => o.id).sort()).to.deep.equal(['mas:offer_type/base', 'mas:offer_type/trial']);
            expect(el.planTypeOptions.map((o) => o.id).sort()).to.deep.equal(['mas:plan_type/abm', 'mas:plan_type/puf']);
            expect(el.pznOptions.map((o) => o.id)).to.deep.equal(['mas:pzn/general']);
        });

        it('filters cards by offer_type', async () => {
            const a = fragmentWithTags(['mas:offer_type/base'], { title: 'a' });
            const b = fragmentWithTags(['mas:offer_type/trial'], { title: 'b' });
            Store.translationProjects.allCards.set([a, b]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            el.offerTypeFilter = ['mas:offer_type/base'];
            await el.updateComplete;
            const display = Store.translationProjects.displayCards.get();
            expect(display.map((f) => f.title)).to.deep.equal(['a']);
        });

        it('filters cards by plan_type', async () => {
            const a = fragmentWithTags(['mas:plan_type/abm'], { title: 'a' });
            const b = fragmentWithTags(['mas:plan_type/puf'], { title: 'b' });
            Store.translationProjects.allCards.set([a, b]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            el.planTypeFilter = ['mas:plan_type/puf'];
            await el.updateComplete;
            const display = Store.translationProjects.displayCards.get();
            expect(display.map((f) => f.title)).to.deep.equal(['b']);
        });

        it('filters cards by pzn', async () => {
            const a = fragmentWithTags(['mas:pzn/country/us'], { title: 'a' });
            const b = fragmentWithTags(['mas:pzn/country/de'], { title: 'b' });
            Store.translationProjects.allCards.set([a, b]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            el.pznFilter = ['mas:pzn/country/us'];
            await el.updateComplete;
            const display = Store.translationProjects.displayCards.get();
            expect(display.map((f) => f.title)).to.deep.equal(['a']);
        });

        it('combines new filters with existing market segment filter (intersection)', async () => {
            const a = fragmentWithTags(['mas:offer_type/base', 'mas:market_segment/com'], { title: 'a' });
            const b = fragmentWithTags(['mas:offer_type/base', 'mas:market_segment/edu'], { title: 'b' });
            const c = fragmentWithTags(['mas:offer_type/trial', 'mas:market_segment/com'], { title: 'c' });
            Store.translationProjects.allCards.set([a, b, c]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            el.offerTypeFilter = ['mas:offer_type/base'];
            el.marketSegmentFilter = ['mas:market_segment/com'];
            await el.updateComplete;
            const display = Store.translationProjects.displayCards.get();
            expect(display.map((f) => f.title)).to.deep.equal(['a']);
        });

        it('renders applied-filters chips for new filter types', async () => {
            seedTaxonomy({
                offer_type: [['base', 'Base']],
                plan_type: [['abm', 'ABM']],
                pzn: [['general', 'General']],
            });
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            el.offerTypeFilter = ['mas:offer_type/base'];
            el.planTypeFilter = ['mas:plan_type/abm'];
            el.pznFilter = ['mas:pzn/general'];
            await el.updateComplete;
            const types = el.appliedFilters.map((f) => f.type).sort();
            expect(types).to.deep.equal([FILTER_TYPE.OFFER_TYPE, FILTER_TYPE.PLAN_TYPE, FILTER_TYPE.PZN].sort());
        });

        it('clearAllFilters resets the new filter arrays', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.offerTypeOptions = [{ id: 'mas:offer_type/base', title: 'Base' }];
            el.planTypeOptions = [{ id: 'mas:plan_type/abm', title: 'ABM' }];
            el.pznOptions = [{ id: 'mas:pzn/country/us', title: 'US' }];
            el.offerTypeFilter = ['mas:offer_type/base'];
            el.planTypeFilter = ['mas:plan_type/abm'];
            el.pznFilter = ['mas:pzn/country/us'];
            await el.updateComplete;
            const clearButton = el.shadowRoot.querySelector('.applied-filters sp-action-button');
            clearButton.click();
            await el.updateComplete;
            expect(el.offerTypeFilter).to.deep.equal([]);
            expect(el.planTypeFilter).to.deep.equal([]);
            expect(el.pznFilter).to.deep.equal([]);
        });

        it('removes offer_type chip on sp-tag delete', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.offerTypeOptions = [{ id: 'mas:offer_type/base', title: 'Base' }];
            el.offerTypeFilter = ['mas:offer_type/base'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.OFFER_TYPE, id: 'mas:offer_type/base' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.offerTypeFilter).to.not.include('mas:offer_type/base');
        });

        it('removes plan_type chip on sp-tag delete', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.planTypeOptions = [{ id: 'mas:plan_type/abm', title: 'ABM' }];
            el.planTypeFilter = ['mas:plan_type/abm'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.PLAN_TYPE, id: 'mas:plan_type/abm' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.planTypeFilter).to.not.include('mas:plan_type/abm');
        });

        it('removes pzn chip on sp-tag delete', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.pznOptions = [{ id: 'mas:pzn/country/us', title: 'US' }];
            el.pznFilter = ['mas:pzn/country/us'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.PZN, id: 'mas:pzn/country/us' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.pznFilter).to.not.include('mas:pzn/country/us');
        });

        it('removes status chip on sp-tag delete', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.statusOptions = [{ id: 'PUBLISHED', title: 'Published' }];
            el.statusFilter = ['PUBLISHED'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.STATUS, id: 'PUBLISHED' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.statusFilter).to.not.include('PUBLISHED');
        });
    });

    describe('custom Tag filter', () => {
        const fragmentWithTags = (tags, extras = {}) =>
            createMockFragment({ tags: tags.map((id) => ({ id, title: id.split('/').pop() })), ...extras });

        it('initializes tagFilter as empty', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            expect(el.tagFilter).to.deep.equal([]);
        });

        it('populates tag options from the AEM taxonomy, not loaded fragments', async () => {
            seedCustomTagTaxonomy(['Accordion', 'Marquee']);
            Store.translationProjects.allCards.set([createMockFragment({ tags: [] })]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.tagOptions.map((o) => o.id).sort()).to.deep.equal(['mas:custom/accordion', 'mas:custom/marquee']);
        });

        it('keeps parent tags alongside their children (matches the content page)', async () => {
            setNamespaceCache(
                MAS_TAG_NAMESPACE,
                new Map([
                    [
                        '/content/cq:tags/mas/custom/milo-blocks',
                        { path: '/content/cq:tags/mas/custom/milo-blocks', title: 'Milo Blocks' },
                    ],
                    [
                        '/content/cq:tags/mas/custom/milo-blocks/marquee',
                        { path: '/content/cq:tags/mas/custom/milo-blocks/marquee', title: 'Marquee' },
                    ],
                    ['/content/cq:tags/mas/custom/test', { path: '/content/cq:tags/mas/custom/test', title: 'Test' }],
                ]),
            );
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const ids = el.tagOptions.map((o) => o.id);
            expect(ids).to.include('mas:custom/milo-blocks');
            expect(ids).to.include('mas:custom/milo-blocks/marquee');
            expect(ids).to.include('mas:custom/test');
        });

        it('renders the Tag filter even when no loaded fragment carries a custom tag', async () => {
            seedCustomTagTaxonomy(['Accordion']);
            Store.translationProjects.allCards.set([createMockFragment({ tags: [{ id: 'mas:product_code/photoshop' }] })]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Tag');
        });

        it('filters cards by custom tag', async () => {
            seedCustomTagTaxonomy(['Featured', 'Seasonal']);
            const a = fragmentWithTags(['mas:custom/featured'], { title: 'a' });
            const b = fragmentWithTags(['mas:custom/seasonal'], { title: 'b' });
            Store.translationProjects.allCards.set([a, b]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            el.tagFilter = ['mas:custom/featured'];
            await el.updateComplete;
            const display = Store.translationProjects.displayCards.get();
            expect(display.map((f) => f.title)).to.deep.equal(['a']);
        });

        it('renders applied-filters chip for the Tag filter type', async () => {
            seedCustomTagTaxonomy(['Featured']);
            Store.translationProjects.allCards.set([fragmentWithTags(['mas:custom/featured'])]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            el.tagFilter = ['mas:custom/featured'];
            await el.updateComplete;
            expect(el.appliedFilters.map((f) => f.type)).to.deep.equal([FILTER_TYPE.TAG]);
        });

        it('clearAllFilters resets tagFilter', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.tagOptions = [{ id: 'mas:custom/featured', title: 'Featured' }];
            el.tagFilter = ['mas:custom/featured'];
            await el.updateComplete;
            const clearButton = el.shadowRoot.querySelector('.applied-filters sp-action-button');
            clearButton.click();
            await el.updateComplete;
            expect(el.tagFilter).to.deep.equal([]);
        });

        it('removes Tag chip on sp-tag delete', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.tagOptions = [{ id: 'mas:custom/featured', title: 'Featured' }];
            el.tagFilter = ['mas:custom/featured'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.TAG, id: 'mas:custom/featured' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.tagFilter).to.not.include('mas:custom/featured');
        });
    });
});

describe('prefix-match filtering', () => {
    let sandbox;
    const fragmentWith = (tagIds) => ({
        title: 'F',
        path: '/content/dam/mas/acom/en_US/f',
        tags: tagIds.map((id) => ({ id, title: id.split('/').pop() })),
        fields: [],
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        setItemsSelectionStore(Store.translationProjects);
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.displayCards.set([]);
        Store.fragments.list.loading.set(false);
        Store.fragments.list.firstPageLoaded.set(true);
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.displayCards.set([]);
        setItemsSelectionStore(null);
    });

    it('matches a fragment carrying the exact selected product code', async () => {
        const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
        Store.translationProjects.allCards.set([fragmentWith(['mas:product_code/ccsn'])]);
        el.productFilter = ['mas:product_code/ccsn'];
        await el.updateComplete;
        expect(Store.translationProjects.displayCards.value.length).to.equal(1);
    });

    it('matches a descendant when a parent product code is selected', async () => {
        const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
        Store.translationProjects.allCards.set([fragmentWith(['mas:product_code/ccsn/photoshop'])]);
        el.productFilter = ['mas:product_code/ccsn'];
        await el.updateComplete;
        expect(Store.translationProjects.displayCards.value.length).to.equal(1);
    });

    it('does NOT match a sibling whose id shares a prefix without a slash boundary', async () => {
        const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
        Store.translationProjects.allCards.set([fragmentWith(['mas:product_code/ccx'])]);
        el.productFilter = ['mas:product_code/cc'];
        await el.updateComplete;
        expect(Store.translationProjects.displayCards.value.length).to.equal(0);
    });

    it('returns zero results when no loaded fragment carries the selected tag', async () => {
        const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
        Store.translationProjects.allCards.set([fragmentWith(['mas:product_code/other'])]);
        el.productFilter = ['mas:product_code/ccsn'];
        await el.updateComplete;
        expect(Store.translationProjects.displayCards.value.length).to.equal(0);
    });

    it('applies the same prefix rule to market and customer segment', async () => {
        const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
        Store.translationProjects.allCards.set([
            fragmentWith(['mas:market_segments/com/edu']),
            fragmentWith(['mas:customer_segment/individual']),
        ]);
        el.marketSegmentFilter = ['mas:market_segments/com'];
        await el.updateComplete;
        expect(Store.translationProjects.displayCards.value.length).to.equal(1);
    });
});
