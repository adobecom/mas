import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { FILTER_TYPE, PAGE_NAMES } from '../../src/constants.js';
import { stubAemTagQueryFetch } from '../helpers/aem-tag-fetch.js';
import { resetTagCache, seedTagCache } from '../helpers/tag-cache.js';
import '../../src/swc.js';
import '../../src/common/components/mas-search-and-filters.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';
const seedCustomTagTaxonomy = (titles = ['Accordion', 'Marquee', 'Test']) => {
    const entries = titles.map((title) => {
        const slug = title.toLowerCase().replace(/\s+/g, '-');
        const path = `/content/cq:tags/mas/custom/${slug}`;
        return [path, { path, title, name: slug }];
    });
    seedTagCache(MAS_TAG_NAMESPACE, entries);
};

describe('MasSearchAndFilters', () => {
    let sandbox;
    let originalSearch;
    let originalFilters;
    let originalPage;

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
        stubAemTagQueryFetch(sandbox);
        originalSearch = Store.search.get();
        originalFilters = Store.filters.get();
        originalPage = Store.page.get();
        setItemsSelectionStore(Store.translationProjects);
        Store.search.set({});
        Store.filters.set({ locale: 'en_US', tags: undefined, personalizationFilterEnabled: false });
        Store.translationProjects.search.set({});
        Store.translationProjects.filters.set({ locale: 'en_US', tags: undefined, personalizationFilterEnabled: false });
        Store.page.set(PAGE_NAMES.CONTENT);
        resetTagCache(MAS_TAG_NAMESPACE);
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
        resetTagCache(MAS_TAG_NAMESPACE);
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
        Store.search.set(originalSearch);
        Store.filters.set(originalFilters);
        Store.page.set(originalPage);
    });

    describe('selection store isolation', () => {
        it('persists card search to the bound slice and never writes the global hash store', async () => {
            setItemsSelectionStore(Store.promotions);
            Store.promotions.search.set({});
            Store.promotions.filters.set({ locale: 'en_US' });
            Store.promotions.allCards.set([]);
            Store.promotions.displayCards.set([]);
            const globalSearch = Store.search.get();
            const globalFilters = Store.filters.get();

            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${true}></mas-search-and-filters>`);
            el.searchQuery = 'creative cloud';
            await el.updateComplete;

            expect(Store.promotions.search.get().query).to.equal('creative cloud');
            expect(Store.search.get()).to.equal(globalSearch);
            expect(Store.filters.get()).to.equal(globalFilters);
        });
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

        it('should initialize card filters from Store.filters.tags and ignore content type tags', async () => {
            Store.translationProjects.filters.set({
                locale: 'en_US',
                tags: [
                    'mas:offer_type/base',
                    'mas:plan_type/abm',
                    'mas:studio/content-type/compare-chart',
                    'mas:market_segments/com',
                    'mas:customer_segment/team',
                    'mas:product_code/photoshop',
                    'mas:pzn/country/us',
                    'mas:status/published',
                    'mas:custom/foo',
                    'mas:variant/catalog',
                ].join(','),
                personalizationFilterEnabled: false,
            });
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            expect(el.templateFilter).to.deep.equal(['catalog']);
            expect(el.marketSegmentFilter).to.deep.equal(['mas:market_segments/com']);
            expect(el.customerSegmentFilter).to.deep.equal(['mas:customer_segment/team']);
            expect(el.productFilter).to.deep.equal(['mas:product_code/photoshop']);
            expect(Store.translationProjects.filters.get().tags).to.equal(
                [
                    'mas:offer_type/base',
                    'mas:plan_type/abm',
                    'mas:pzn/country/us',
                    'mas:status/published',
                    'mas:custom/foo',
                    'mas:market_segments/com',
                    'mas:customer_segment/team',
                    'mas:product_code/photoshop',
                    'mas:variant/catalog',
                ].join(','),
            );
        });

        it('should let lockedTemplateFilter override Store.filters variant tags', async () => {
            Store.translationProjects.filters.set({
                locale: 'en_US',
                tags: 'mas:market_segments/com,mas:variant/catalog',
                personalizationFilterEnabled: false,
            });
            const el = await fixture(
                html`<mas-search-and-filters
                    type="cards"
                    .searchOnly=${false}
                    .lockedTemplateFilter=${'compare-chart'}
                ></mas-search-and-filters>`,
            );
            expect(el.templateFilter).to.deep.equal(['compare-chart']);
            expect(el.marketSegmentFilter).to.deep.equal(['mas:market_segments/com']);
            expect(Store.translationProjects.filters.get().tags).to.equal('mas:market_segments/com,mas:variant/compare-chart');
        });

        it('should preselect defaultTemplateFilter when no template is selected', async () => {
            const el = await fixture(
                html`<mas-search-and-filters
                    type="cards"
                    .searchOnly=${false}
                    .defaultTemplateFilter=${'compare-chart-column'}
                ></mas-search-and-filters>`,
            );
            expect(el.templateFilter).to.deep.equal(['compare-chart-column']);
            expect(Store.translationProjects.filters.get().tags).to.equal('mas:variant/compare-chart-column');
        });

        it('should let defaultTemplateFilter stay changeable and deletable (not locked)', async () => {
            const el = await fixture(
                html`<mas-search-and-filters
                    type="cards"
                    .searchOnly=${false}
                    .defaultTemplateFilter=${'compare-chart-column'}
                ></mas-search-and-filters>`,
            );
            el.templateFilter = ['plans'];
            await el.updateComplete;
            expect(el.templateFilter).to.deep.equal(['plans']);
        });

        it('should not override an existing Store variant with defaultTemplateFilter', async () => {
            Store.translationProjects.filters.set({
                locale: 'en_US',
                tags: 'mas:variant/catalog',
                personalizationFilterEnabled: false,
            });
            const el = await fixture(
                html`<mas-search-and-filters
                    type="cards"
                    .searchOnly=${false}
                    .defaultTemplateFilter=${'compare-chart-column'}
                ></mas-search-and-filters>`,
            );
            expect(el.templateFilter).to.deep.equal(['catalog']);
        });

        it('should not re-apply defaultTemplateFilter after the user clears it and the component reconnects', async () => {
            const el = await fixture(
                html`<mas-search-and-filters
                    type="cards"
                    .searchOnly=${false}
                    .defaultTemplateFilter=${'compare-chart-column'}
                ></mas-search-and-filters>`,
            );
            expect(el.templateFilter).to.deep.equal(['compare-chart-column']);
            el.templateFilter = [];
            await el.updateComplete;
            const parent = el.parentNode;
            parent.removeChild(el);
            parent.appendChild(el);
            await el.updateComplete;
            expect(el.templateFilter).to.deep.equal([]);
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
            el.marketSegmentOptions = [{ id: 'mas:market_segments/com', title: 'Commercial' }];
            el.marketSegmentFilter = ['mas:market_segments/com'];
            await el.updateComplete;
            expect(el.appliedFilters).to.deep.equal([
                { type: FILTER_TYPE.MARKET_SEGMENT, id: 'mas:market_segments/com', label: 'Commercial' },
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
            el.marketSegmentOptions = [{ id: 'mas:market_segments/com', title: 'Commercial' }];
            el.templateFilter = ['plans'];
            el.marketSegmentFilter = ['mas:market_segments/com'];
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

        const fragmentWithEveryFilterTag = () =>
            createMockFragment({
                tags: [
                    { id: 'mas:market_segments/com', title: 'Commercial' },
                    { id: 'mas:customer_segment/individual', title: 'Individual' },
                    { id: 'mas:product_code/photoshop', title: 'Photoshop' },
                    { id: 'mas:offer_type/base', title: 'Base' },
                    { id: 'mas:plan_type/abm', title: 'ABM' },
                    { id: 'mas:custom/featured', title: 'Featured' },
                    { id: 'mas:pzn/country/us', title: 'US' },
                ],
            });

        it('should render the Template and Status triggers and AEM tag picker for every other filter', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const filterTriggers = el.shadowRoot.querySelectorAll('sp-action-button[slot="trigger"]');
            const tagPickers = el.shadowRoot.querySelectorAll('aem-tag-picker-field');
            expect(filterTriggers.length).to.equal(2);
            expect(tagPickers.length).to.equal(7);
            tagPickers.forEach((tagPicker) => {
                expect(tagPicker.multiple).to.be.true;
                expect(tagPicker.selection).to.equal('checkbox');
            });
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

        it('renders a tag picker for each AEM-sourced filter type', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const tops = [...el.shadowRoot.querySelectorAll('aem-tag-picker-field')].map((picker) => picker.top);
            expect(tops).to.deep.equal([
                'offer_type',
                'plan_type',
                'market_segments',
                'customer_segment',
                'product_code',
                'custom',
                'pzn',
            ]);
        });

        it('should render Template filter', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filters = el.shadowRoot.querySelector('.filters');
            expect(filters.textContent).to.include('Template');
        });

        it('should render Market Segment filter', async () => {
            Store.translationProjects.allCards.set([fragmentWithEveryFilterTag()]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const picker = el.shadowRoot.querySelector('aem-tag-picker-field[label="Market Segment"]');
            expect(picker).to.exist;
            expect(picker.top).to.equal('market_segments');
        });

        it('should render Customer Segment filter', async () => {
            Store.translationProjects.allCards.set([fragmentWithEveryFilterTag()]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const picker = el.shadowRoot.querySelector('aem-tag-picker-field[label="Customer Segment"]');
            expect(picker).to.exist;
            expect(picker.top).to.equal('customer_segment');
        });

        it('should render Product filter', async () => {
            Store.translationProjects.allCards.set([fragmentWithEveryFilterTag()]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const picker = el.shadowRoot.querySelector('aem-tag-picker-field[label="Product Code"]');
            expect(picker).to.exist;
            expect(picker.top).to.equal('product_code');
        });

        it('should render Tag filter', async () => {
            seedCustomTagTaxonomy(['Featured']);
            Store.translationProjects.allCards.set([fragmentWithEveryFilterTag()]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            const picker = el.shadowRoot.querySelector('aem-tag-picker-field[label="Tag"]');
            expect(picker).to.exist;
            expect(picker.top).to.equal('custom');
        });

        it('should show filter count in label when filters are selected', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans', 'catalog'];
            await el.updateComplete;
            const filterTriggers = el.shadowRoot.querySelectorAll('sp-action-button[slot="trigger"]');
            expect(filterTriggers[0].textContent).to.include('(2)');
        });

        it('should disable filter triggers when loading', async () => {
            Store.fragments.list.firstPageLoaded.set(false);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            const filterTriggers = el.shadowRoot.querySelectorAll('sp-action-button[slot="trigger"]');
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
        it('should mirror card searchQuery to Store.search.query', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = 'Photoshop';
            await el.updateComplete;
            expect(Store.translationProjects.search.get().query).to.equal('Photoshop');
        });

        it('should clear Store.search.query when card searchQuery is empty', async () => {
            Store.translationProjects.search.set({ path: 'acom', query: 'Photoshop' });
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = '';
            await el.updateComplete;
            expect(Store.translationProjects.search.get()).to.deep.equal({ path: 'acom' });
        });

        it('should not write Store.search when normalized card searchQuery is unchanged', async () => {
            Store.translationProjects.search.set({ path: 'acom', query: 'Photoshop' });
            const setSpy = sandbox.spy(Store.translationProjects.search, 'set');
            await fixture(html`<mas-search-and-filters type="cards" .searchQuery=${'Photoshop'}></mas-search-and-filters>`);
            expect(setSpy.called).to.be.false;
        });

        it('should not write Store.search for collections or placeholders', async () => {
            Store.translationProjects.search.set({ path: 'acom', query: 'original' });
            const collectionEl = await fixture(html`<mas-search-and-filters type="collections"></mas-search-and-filters>`);
            collectionEl.searchQuery = 'collection';
            await collectionEl.updateComplete;
            const placeholderEl = await fixture(html`<mas-search-and-filters type="placeholders"></mas-search-and-filters>`);
            placeholderEl.searchQuery = 'placeholder';
            await placeholderEl.updateComplete;
            expect(Store.translationProjects.search.get()).to.deep.equal({ path: 'acom', query: 'original' });
        });

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
                    tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:market_segments/edu', title: 'Education' }],
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

        it('should collapse child product tags to parent product options', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:product_code/photoshop/cc', title: 'Photoshop CC' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.productOptions).to.deep.equal([{ id: 'mas:product_code/photoshop', title: 'photoshop' }]);
        });

        it('should populate dropdown options from the cached MAS tag taxonomy', async () => {
            seedTagCache(MAS_TAG_NAMESPACE, [
                [
                    '/content/cq:tags/mas/market_segments/com',
                    { path: '/content/cq:tags/mas/market_segments/com', name: 'com', title: 'Commercial' },
                ],
                [
                    '/content/cq:tags/mas/market_segments/edu',
                    { path: '/content/cq:tags/mas/market_segments/edu', name: 'edu', title: 'Education' },
                ],
                [
                    '/content/cq:tags/mas/customer_segment/team',
                    { path: '/content/cq:tags/mas/customer_segment/team', name: 'team', title: 'Team' },
                ],
                [
                    '/content/cq:tags/mas/product_code/photoshop',
                    { path: '/content/cq:tags/mas/product_code/photoshop', name: 'photoshop', title: 'Photoshop' },
                ],
                [
                    '/content/cq:tags/mas/product_code/photoshop/cc',
                    { path: '/content/cq:tags/mas/product_code/photoshop/cc', name: 'cc', title: 'Photoshop CC' },
                ],
            ]);

            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            Store.translationProjects.allCards.set([]);
            await el.updateComplete;

            expect(el.marketSegmentOptions.map((option) => option.id)).to.deep.equal([
                'mas:market_segments/com',
                'mas:market_segments/edu',
            ]);
            expect(el.customerSegmentOptions.map((option) => option.id)).to.deep.equal(['mas:customer_segment/team']);
            expect(el.productOptions.map((option) => option.id)).to.deep.equal(['mas:product_code/photoshop']);
        });

        it('should deduplicate options', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(1);
        });

        it('should sort options alphabetically', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segments/zebra', title: 'Zebra' }],
                }),
                createMockFragment({
                    tags: [{ id: 'mas:market_segments/alpha', title: 'Alpha' }],
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
                    tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(1);
        });

        it('should extract title from tag id when title is missing', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segments/commercial' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions[0].title).to.equal('commercial');
        });

        it('should not extract filter options when searchOnly is true', async () => {
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }],
                }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${true}></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.marketSegmentOptions.length).to.equal(0);
        });
    });

    describe('filter application', () => {
        it('should mirror card templateFilter to Store.filters.tags', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans'];
            await el.updateComplete;
            expect(Store.translationProjects.filters.get().tags).to.equal('mas:variant/plans');
        });

        it('should preserve unrelated tags and replace stale variant tags', async () => {
            Store.translationProjects.filters.set({
                locale: 'en_US',
                tags: 'mas:studio/content-type/compare-chart,mas:market_segments/com,mas:variant/catalog,mas:product_code/photoshop',
                personalizationFilterEnabled: true,
            });
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['plans'];
            await el.updateComplete;
            expect(Store.translationProjects.filters.get()).to.deep.equal({
                locale: 'en_US',
                tags: 'mas:market_segments/com,mas:product_code/photoshop,mas:variant/plans',
                personalizationFilterEnabled: true,
            });
        });

        it('should initialize Store.filters.tags from lockedTemplateFilter', async () => {
            await fixture(
                html`<mas-search-and-filters
                    type="cards"
                    .searchOnly=${false}
                    .lockedTemplateFilter=${'plans'}
                ></mas-search-and-filters>`,
            );
            expect(Store.translationProjects.filters.get().tags).to.equal('mas:variant/plans');
        });

        it('should force repository search for locked template filters on fragment editor', async () => {
            Store.page.set(PAGE_NAMES.FRAGMENT_EDITOR);
            const repository = { searchFragments: sandbox.stub() };
            const originalQuerySelector = document.querySelector.bind(document);
            sandbox.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') return repository;
                return originalQuerySelector(selector);
            });
            await fixture(
                html`<mas-search-and-filters
                    type="cards"
                    .searchOnly=${false}
                    .lockedTemplateFilter=${'compare-chart'}
                ></mas-search-and-filters>`,
            );
            expect(Store.translationProjects.filters.get().tags).to.equal('mas:variant/compare-chart');
            expect(
                repository.searchFragments.calledOnceWithExactly({
                    force: true,
                    query: undefined,
                    tags: 'mas:variant/compare-chart',
                }),
            ).to.be.true;
        });

        it('uses the active selection store search/filters when present, leaving the globals untouched', async () => {
            Store.page.set(PAGE_NAMES.FRAGMENT_EDITOR);
            const repository = { searchFragments: sandbox.stub() };
            const originalQuerySelector = document.querySelector.bind(document);
            sandbox.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') return repository;
                return originalQuerySelector(selector);
            });
            Store.compareChart.filters.set({ locale: 'en_US' });
            setItemsSelectionStore(Store.compareChart);
            await fixture(
                html`<mas-search-and-filters
                    type="cards"
                    .searchOnly=${false}
                    .lockedTemplateFilter=${'compare-chart'}
                ></mas-search-and-filters>`,
            );
            expect(Store.compareChart.filters.get().tags).to.equal('mas:variant/compare-chart');
            expect(Store.filters.get().tags).to.be.undefined;
            expect(Store.search.get()).to.deep.equal({});
            expect(repository.searchFragments.calledOnce).to.be.true;
            Store.compareChart.filters.set({ locale: 'en_US' });
        });

        it('should not write Store.filters.tags for collections or placeholders', async () => {
            Store.translationProjects.filters.set({
                locale: 'en_US',
                tags: 'mas:variant/plans',
                personalizationFilterEnabled: false,
            });
            const collectionEl = await fixture(
                html`<mas-search-and-filters type="collections" .searchOnly=${false}></mas-search-and-filters>`,
            );
            collectionEl.templateFilter = ['catalog'];
            await collectionEl.updateComplete;
            const placeholderEl = await fixture(
                html`<mas-search-and-filters type="placeholders" .searchOnly=${false}></mas-search-and-filters>`,
            );
            placeholderEl.templateFilter = ['segment'];
            await placeholderEl.updateComplete;
            expect(Store.translationProjects.filters.get().tags).to.equal('mas:variant/plans');
        });

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

        it('should match stored bizpro cards when the Pro template is selected', async () => {
            const legacy = createMockFragment({
                path: '/content/dam/mas/acom/en_US/legacy-pro',
                fields: [{ name: 'variant', values: ['bizpro'] }],
            });
            Store.translationProjects.allCards.set([
                legacy,
                createMockFragment({ fields: [{ name: 'variant', values: ['catalog'] }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateFilter = ['pro'];
            await el.updateComplete;

            expect(Store.translationProjects.displayCards.get()).to.deep.equal([legacy]);
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
                createMockFragment({ tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }] }),
                createMockFragment({ tags: [{ id: 'mas:market_segments/edu', title: 'Education' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.marketSegmentFilter = ['mas:market_segments/com'];
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
                        { id: 'mas:market_segments/com', title: 'Commercial' },
                        { id: 'mas:product_code/photoshop', title: 'Photoshop' },
                    ],
                }),
                createMockFragment({ tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }] }),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.marketSegmentFilter = ['mas:market_segments/com'];
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
            el.marketSegmentOptions = [{ id: 'mas:market_segments/com', title: 'Commercial' }];
            el.marketSegmentFilter = ['mas:market_segments/com'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = { type: FILTER_TYPE.MARKET_SEGMENT, id: 'mas:market_segments/com' };
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.marketSegmentFilter).to.not.include('mas:market_segments/com');
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
            Store.translationProjects.filters.set({
                locale: 'en_US',
                tags: 'mas:status/published,mas:market_segments/com,mas:variant/plans,mas:product_code/photoshop',
                personalizationFilterEnabled: false,
            });
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            el.templateOptions = [{ id: 'plans', title: 'Plans' }];
            el.marketSegmentOptions = [{ id: 'mas:market_segments/com', title: 'Commercial' }];
            el.customerSegmentFilter = ['mas:customer_segment/individual'];
            await el.updateComplete;
            const clearButton = el.shadowRoot.querySelector('.applied-filters sp-action-button');
            clearButton.click();
            await el.updateComplete;
            expect(el.templateFilter).to.deep.equal([]);
            expect(el.marketSegmentFilter).to.deep.equal([]);
            expect(el.customerSegmentFilter).to.deep.equal([]);
            expect(el.productFilter).to.deep.equal([]);
            expect(Store.translationProjects.filters.get().tags).to.equal('mas:status/published');
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

        it('should restore saved Store.search and Store.filters on card disconnect', async () => {
            Store.translationProjects.search.set({ path: 'acom', query: 'original' });
            Store.translationProjects.filters.set({
                locale: 'en_US',
                tags: 'mas:product_code/photoshop',
                personalizationFilterEnabled: true,
            });
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            el.searchQuery = 'changed';
            el.templateFilter = ['plans'];
            await el.updateComplete;
            el.disconnectedCallback();
            expect(Store.translationProjects.search.get()).to.deep.equal({ path: 'acom', query: 'original' });
            expect(Store.translationProjects.filters.get()).to.deep.equal({
                locale: 'en_US',
                tags: 'mas:product_code/photoshop',
                personalizationFilterEnabled: true,
            });
        });
    });

    describe('reactivity', () => {
        it('should update when allCards store changes', async () => {
            const el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${false}></mas-search-and-filters>`);
            Store.translationProjects.allCards.set([
                createMockFragment({
                    tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }],
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
                    tags: [{ id: 'mas:market_segments/com', title: 'Commercial' }],
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
            expect(Store.translationProjects.search.get().query).to.be.undefined;
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
            expect(Store.translationProjects.search.get().query).to.be.undefined;
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

        it('extracts offer_type / plan_type / pzn options from fragment tags', async () => {
            Store.translationProjects.allCards.set([
                fragmentWithTags(['mas:offer_type/base', 'mas:plan_type/abm', 'mas:pzn/country/us']),
                fragmentWithTags(['mas:offer_type/trial', 'mas:plan_type/puf']),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            expect(el.offerTypeOptions.map((o) => o.id).sort()).to.deep.equal(['mas:offer_type/base', 'mas:offer_type/trial']);
            expect(el.planTypeOptions.map((o) => o.id).sort()).to.deep.equal(['mas:plan_type/abm', 'mas:plan_type/puf']);
            expect(el.pznOptions.map((o) => o.id)).to.deep.equal(['mas:pzn/country/us']);
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
            const a = fragmentWithTags(['mas:offer_type/base', 'mas:market_segments/com'], { title: 'a' });
            const b = fragmentWithTags(['mas:offer_type/base', 'mas:market_segments/edu'], { title: 'b' });
            const c = fragmentWithTags(['mas:offer_type/trial', 'mas:market_segments/com'], { title: 'c' });
            Store.translationProjects.allCards.set([a, b, c]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            el.offerTypeFilter = ['mas:offer_type/base'];
            el.marketSegmentFilter = ['mas:market_segments/com'];
            await el.updateComplete;
            const display = Store.translationProjects.displayCards.get();
            expect(display.map((f) => f.title)).to.deep.equal(['a']);
        });

        it('renders applied-filters chips for new filter types', async () => {
            Store.translationProjects.allCards.set([
                fragmentWithTags(['mas:offer_type/base', 'mas:plan_type/abm', 'mas:pzn/country/us']),
            ]);
            const el = await fixture(html`<mas-search-and-filters type="cards"></mas-search-and-filters>`);
            await el.updateComplete;
            el.offerTypeFilter = ['mas:offer_type/base'];
            el.planTypeFilter = ['mas:plan_type/abm'];
            el.pznFilter = ['mas:pzn/country/us'];
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
            seedTagCache(MAS_TAG_NAMESPACE, [
                [
                    '/content/cq:tags/mas/custom/milo-blocks',
                    { path: '/content/cq:tags/mas/custom/milo-blocks', title: 'Milo Blocks' },
                ],
                [
                    '/content/cq:tags/mas/custom/milo-blocks/marquee',
                    { path: '/content/cq:tags/mas/custom/milo-blocks/marquee', title: 'Marquee' },
                ],
                ['/content/cq:tags/mas/custom/test', { path: '/content/cq:tags/mas/custom/test', title: 'Test' }],
            ]);
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
            const picker = el.shadowRoot.querySelector('aem-tag-picker-field[label="Tag"]');
            expect(picker).to.exist;
            expect(picker.top).to.equal('custom');
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
