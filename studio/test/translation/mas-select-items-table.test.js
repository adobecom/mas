import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, TABLE_TYPE, FRAGMENT_STATUS } from '../../src/constants.js';
import { renderFragmentStatusCell } from '../../src/translation/translation-utils.js';
import '../../src/swc.js';
import '../../src/translation/mas-collapsible-table-row.js';
import '../../src/common/components/mas-select-items-table.js';

describe('MasSelectItemsTable', () => {
    let sandbox;

    const createMockCard = (path, title, options = {}) => ({
        path,
        title,
        studioPath: options.studioPath || `merch-card: ACOM / ${title}`,
        status: options.status || FRAGMENT_STATUS.PUBLISHED,
        model: { path: CARD_MODEL_PATH },
        tags: options.tags || [],
        fields: options.fields || [],
        offerData: options.offerData !== undefined ? options.offerData : null,
    });

    const createMockCollection = (path, title, options = {}) => ({
        path,
        title,
        studioPath: options.studioPath || `merch-card-collection: ACOM / ${title}`,
        status: options.status || FRAGMENT_STATUS.PUBLISHED,
        model: { path: COLLECTION_MODEL_PATH },
    });

    const createMockPlaceholder = (path, key, value, options = {}) => ({
        path,
        key,
        value,
        status: options.status || FRAGMENT_STATUS.PUBLISHED,
    });

    /**
     * Sets up cards in all stores needed for testing.
     * This prevents the component from subscribing to fragments.list.data
     */
    const setupCardsInStore = (cards) => {
        Store.translationProjects.allCards.set(cards);
        Store.translationProjects.cardsByPaths.set(new Map(cards.map((c) => [c.path, c])));
        Store.translationProjects.displayCards.set([...cards]);
    };

    /**
     * Sets up collections in all stores needed for testing.
     * This prevents the component from subscribing to fragments.list.data
     */
    const setupCollectionsInStore = (collections) => {
        Store.translationProjects.allCollections.set(collections);
        Store.translationProjects.collectionsByPaths.set(new Map(collections.map((c) => [c.path, c])));
        Store.translationProjects.displayCollections.set([...collections]);
    };

    /**
     * Sets up placeholders in all stores needed for testing.
     * This prevents the component from subscribing to placeholders.list.data
     */
    const setupPlaceholdersInStore = (placeholders) => {
        Store.translationProjects.allPlaceholders.set(placeholders);
        Store.translationProjects.placeholdersByPaths.set(new Map(placeholders.map((p) => [p.path, p])));
        Store.translationProjects.displayPlaceholders.set([...placeholders]);
    };

    const resetStore = () => {
        Store.translationProjects.allCards.set([]);
        Store.translationProjects.cardsByPaths.set(new Map());
        Store.translationProjects.displayCards.set([]);
        Store.translationProjects.selectedCards.set([]);
        Store.translationProjects.offerDataCache.clear();

        Store.translationProjects.allCollections.set([]);
        Store.translationProjects.collectionsByPaths.set(new Map());
        Store.translationProjects.displayCollections.set([]);
        Store.translationProjects.selectedCollections.set([]);

        Store.translationProjects.allPlaceholders.set([]);
        Store.translationProjects.placeholdersByPaths.set(new Map());
        Store.translationProjects.displayPlaceholders.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);

        Store.fragments.list.data.set([]);
        Store.fragments.list.firstPageLoaded.set(true);
        Store.fragments.list.loading.set(false);
        Store.placeholders.list.data.set([]);
        Store.placeholders.list.loading.set(false);
    };

    let mockCommerceService;

    const createMockCommerceService = () => {
        const service = document.createElement('mas-commerce-service');
        service.collectPriceOptions = sinon.stub().returns({});
        service.resolveOfferSelectors = sinon.stub().returns([Promise.resolve([{ offerId: 'test-offer-id' }])]);
        document.body.appendChild(service);
        return service;
    };

    const removeMockCommerceService = () => {
        const service = document.querySelector('mas-commerce-service');
        if (service) {
            service.remove();
        }
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        setItemsSelectionStore(Store.translationProjects);
        resetStore();
        mockCommerceService = createMockCommerceService();
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        resetStore();
        removeMockCommerceService();
        setItemsSelectionStore(null);
    });

    describe('initialization', () => {
        it('should initialize with default values', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.selectedInTable).to.deep.equal(new Set());
            expect(el.viewOnly).to.not.equal(true);
        });

        it('should accept type property for cards', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.type).to.equal('cards');
        });

        it('should accept type property for collections', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            await el.updateComplete;
            expect(el.type).to.equal('collections');
        });

        it('should accept type property for placeholders', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            await el.updateComplete;
            expect(el.type).to.equal('placeholders');
        });

        it('should accept viewOnly property', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            await el.updateComplete;
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            expect(el.viewOnly).to.be.true;
        });
    });

    describe('typeUppercased getter', () => {
        it('should return Cards for cards type', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.typeUppercased).to.equal('Cards');
        });

        it('should return Collections for collections type', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            await el.updateComplete;
            expect(el.typeUppercased).to.equal('Collections');
        });

        it('should return Placeholders for placeholders type', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            await el.updateComplete;
            expect(el.typeUppercased).to.equal('Placeholders');
        });
    });

    describe('isLoading getter', () => {
        it('should return true for cards when firstPageLoaded is false', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            Store.fragments.list.firstPageLoaded.set(false);
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.isLoading).to.be.true;
        });

        it('should return false for cards when firstPageLoaded is true', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            Store.fragments.list.firstPageLoaded.set(true);
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.isLoading).to.be.false;
        });

        it('should return true for collections when firstPageLoaded is false', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            Store.fragments.list.firstPageLoaded.set(false);
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            await el.updateComplete;
            expect(el.isLoading).to.be.true;
        });

        it('should return true for placeholders when placeholders are loading', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            Store.placeholders.list.loading.set(true);
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            await el.updateComplete;
            expect(el.isLoading).to.be.true;
        });

        it('should return false for placeholders when not loading', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            Store.placeholders.list.loading.set(false);
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            await el.updateComplete;
            expect(el.isLoading).to.be.false;
        });

        it('should return viewOnlyLoading for cards when viewOnly is true', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            await el.updateComplete;
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            el.viewOnlyLoading = true;
            expect(el.isLoading).to.be.true;
            el.viewOnlyLoading = false;
            expect(el.isLoading).to.be.false;
        });

        it('should return viewOnlyLoading for collections when viewOnly is true', async () => {
            const el = await fixture(
                html`<mas-select-items-table type="collections" .viewOnly=${true}></mas-select-items-table>`,
            );
            await el.updateComplete;
            const collection = createMockCollection('/path/collection1', 'Collection 1');
            setupCollectionsInStore([collection]);
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            await el.updateComplete;
            el.viewOnlyLoading = true;
            expect(el.isLoading).to.be.true;
        });
    });

    describe('itemsToDisplay getter', () => {
        it('should return displayCards from store when not viewOnly', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            await el.updateComplete;
            expect(el.itemsToDisplay.length).to.equal(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/card1');
        });

        it('should return displayCollections from store when not viewOnly', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            const collections = [createMockCollection('/path/collection1', 'Collection 1')];
            setupCollectionsInStore(collections);
            await el.updateComplete;
            expect(el.itemsToDisplay.length).to.equal(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/collection1');
        });

        it('should return displayPlaceholders from store when not viewOnly', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key1', 'value1')];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            expect(el.itemsToDisplay.length).to.equal(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/placeholder1');
        });

        it('should return viewOnlyFragments when viewOnly is true', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            el.viewOnlyFragments = [card];
            await el.updateComplete;
            expect(el.itemsToDisplay).to.have.lengthOf(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/card1');
        });

        it('should return empty array when viewOnlyFragments is empty', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            el.viewOnlyFragments = [];
            await el.updateComplete;
            expect(el.itemsToDisplay).to.deep.equal([]);
        });
    });

    describe('rendering - loading state', () => {
        it('should render loading indicator when loading', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            Store.fragments.list.firstPageLoaded.set(false);
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            const loadingContainer = el.shadowRoot.querySelector('.loading-container--flex');
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(loadingContainer).to.exist;
            expect(progressCircle).to.exist;
        });

        it('should not render loading indicator when not loading', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            Store.fragments.list.firstPageLoaded.set(true);
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            const loadingContainer = el.shadowRoot.querySelector('.loading-container--flex');
            expect(loadingContainer).to.be.null;
        });
    });

    describe('rendering - empty state', () => {
        it('should render "No items found" when no items to display', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([]);
            await el.updateComplete;
            const emptyMessage = el.shadowRoot.querySelector('p');
            expect(emptyMessage).to.exist;
            expect(emptyMessage.textContent).to.equal('No items found.');
        });
    });

    describe('rendering - table structure', () => {
        it('should render table when items exist', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            await el.updateComplete;
            const table = el.shadowRoot.querySelector('sp-table');
            expect(table).to.exist;
        });

        it('should render table headers for cards', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            await el.updateComplete;
            const headers = el.shadowRoot.querySelectorAll('sp-table-head-cell');
            expect(headers.length).to.equal(7);
            expect(headers[2].textContent.trim()).to.include('Offer');
            expect(headers[3].textContent.trim()).to.include('Fragment title');
            expect(headers[4].textContent.trim()).to.include('Offer ID');
            expect(headers[5].textContent.trim()).to.include('Path');
            expect(headers[6].textContent.trim()).to.include('Status');
        });

        it('should render table headers for collections', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            const collections = [createMockCollection('/path/collection1', 'Collection 1')];
            setupCollectionsInStore(collections);
            await el.updateComplete;
            const headers = el.shadowRoot.querySelectorAll('sp-table-head-cell');
            expect(headers.length).to.equal(4);
            expect(headers[1].textContent.trim()).to.include('Collection title');
            expect(headers[2].textContent.trim()).to.include('Path');
            expect(headers[3].textContent.trim()).to.include('Status');
        });

        it('should render table headers for placeholders', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key1', 'value1')];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            const headers = el.shadowRoot.querySelectorAll('sp-table-head-cell');
            expect(headers.length).to.equal(4);
            expect(headers[1].textContent.trim()).to.include('Key');
            expect(headers[2].textContent.trim()).to.include('Value');
            expect(headers[3].textContent.trim()).to.include('Status');
        });
    });

    describe('rendering - cards table body', () => {
        it('should render card rows with correct data', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [
                createMockCard('/path/card1', 'Test Card', {
                    tags: [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }],
                    offerData: { offerId: 'offer-123' },
                    studioPath: 'merch-card: ACOM / Plans',
                }),
            ];
            setupCardsInStore(cards);
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            expect(collapsibleRow).to.exist;
            const cells = collapsibleRow.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[2].textContent.trim()).to.equal('Photoshop');
            expect(cells[3].textContent.trim()).to.equal('Test Card');
        });

        it('should display placeholder when no product tag exists', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Test Card')];
            setupCardsInStore(cards);
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const cells = collapsibleRow.shadowRoot.querySelectorAll('sp-table-cell');
            const offerCell = cells[2]?.textContent?.trim() || '';
            expect(offerCell === '-' || offerCell === 'no offer name').to.be.true;
        });

        it('should render copy button when offer data exists', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [
                createMockCard('/path/card1', 'Test Card', {
                    offerData: { offerId: 'offer-123' },
                }),
            ];
            setupCardsInStore(cards);
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const copyButton = collapsibleRow.shadowRoot.querySelector('sp-action-button');
            expect(copyButton).to.exist;
        });

        it('should display "no offer data" when offerData is null', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Test Card')];
            setupCardsInStore(cards);
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const cells = collapsibleRow.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[4].textContent).to.include('no offer data');
        });
    });

    describe('rendering - collections table body', () => {
        it('should render collection rows with correct data', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            const collections = [
                createMockCollection('/path/collection1', 'Test Collection', {
                    studioPath: 'merch-card-collection: ACOM / Test Collection',
                }),
            ];
            setupCollectionsInStore(collections);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(1);
            const cells = rows[0].querySelectorAll('sp-table-cell');
            expect(cells[1].textContent.trim()).to.equal('Test Collection');
        });

        it('should display "-" for collection with no title', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            const collections = [createMockCollection('/path/collection1', null)];
            setupCollectionsInStore(collections);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            const cells = rows[0].querySelectorAll('sp-table-cell');
            expect(cells[1].textContent.trim()).to.equal('-');
        });
    });

    describe('rendering - placeholders table body', () => {
        it('should render placeholder rows with correct data', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'test-key', 'test-value')];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(1);
            const cells = rows[0].querySelectorAll('sp-table-cell');
            expect(cells[1].textContent.trim()).to.equal('test-key');
            expect(cells[2].textContent.trim()).to.equal('test-value');
        });

        it('should display "-" for placeholder with no key', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const placeholders = [createMockPlaceholder('/path/placeholder1', null, 'test-value')];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            const cells = rows[0].querySelectorAll('sp-table-cell');
            expect(cells[1].textContent.trim()).to.equal('-');
        });

        it('should truncate long placeholder values to 100 characters', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const longValue = 'A'.repeat(150);
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key', longValue)];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            const cells = rows[0].querySelectorAll('sp-table-cell');
            expect(cells[2].textContent.trim()).to.equal(`${'A'.repeat(100)}...`);
        });

        it('should display "-" for placeholder with no value', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key', null)];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            const cells = rows[0].querySelectorAll('sp-table-cell');
            expect(cells[2].textContent.trim()).to.equal('-');
        });
    });

    describe('rendering - status cell', () => {
        it('should render Published status with green dot', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1', { status: FRAGMENT_STATUS.PUBLISHED })];
            setupCardsInStore(cards);
            const el = await fixture(
                html`<mas-select-items-table
                    type="cards"
                    .renderFragmentStatusCell=${renderFragmentStatusCell}
                ></mas-select-items-table>`,
            );
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const statusCell = collapsibleRow.shadowRoot.querySelector('.status-cell');
            const statusDot = statusCell.querySelector('.status-dot');
            expect(statusDot.classList.contains('green')).to.be.true;
            expect(statusCell.textContent).to.include('Published');
        });

        it('should render Modified status with blue dot', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1', { status: FRAGMENT_STATUS.MODIFIED })];
            setupCardsInStore(cards);
            const el = await fixture(
                html`<mas-select-items-table
                    type="cards"
                    .renderFragmentStatusCell=${renderFragmentStatusCell}
                ></mas-select-items-table>`,
            );
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const statusCell = collapsibleRow.shadowRoot.querySelector('.status-cell');
            const statusDot = statusCell.querySelector('.status-dot');
            expect(statusDot.classList.contains('blue')).to.be.true;
            expect(statusCell.textContent).to.include('Modified');
        });

        it('should render Draft status without color class', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1', { status: FRAGMENT_STATUS.DRAFT })];
            setupCardsInStore(cards);
            const el = await fixture(
                html`<mas-select-items-table
                    type="cards"
                    .renderFragmentStatusCell=${renderFragmentStatusCell}
                ></mas-select-items-table>`,
            );
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const statusCell = collapsibleRow.shadowRoot.querySelector('.status-cell');
            const statusDot = statusCell.querySelector('.status-dot');
            expect(statusDot.classList.contains('green')).to.be.false;
            expect(statusDot.classList.contains('blue')).to.be.false;
            expect(statusCell.textContent).to.include('Draft');
        });
    });

    describe('table selection behavior', () => {
        it('should render checkboxes when not viewOnly', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const checkbox = row?.shadowRoot?.querySelector('sp-checkbox');
            expect(checkbox).to.exist;
        });

        it('should not render checkboxes when viewOnly', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            await el.updateComplete;
            const card = createMockCard('/path/card1', 'Card 1');
            el.viewOnlyFragments = [card];
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const checkbox = row?.shadowRoot?.querySelector('sp-checkbox');
            expect(checkbox).to.be.null;
        });

        it('should reflect store selection in selectedInTable', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            expect(el.selectedInTable).to.include('/path/card1');
        });
    });

    describe('selection preselection', () => {
        it('should preselect items that are in the store selection', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            expect(el.selectedInTable).to.include('/path/card1');
        });

        it('should reflect store selection in selectedInTable', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            await el.updateComplete;
            expect(el.selectedInTable).to.include('/path/card1');
            expect(el.selectedInTable).to.include('/path/card2');
        });
    });

    describe('selection updates', () => {
        it('should update store when checkbox selection changes', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('mas-collapsible-table-row');
            await row?.updateComplete;
            const checkbox = row?.shadowRoot?.querySelector('sp-checkbox');
            if (checkbox) {
                checkbox.click();
                await el.updateComplete;
                expect(Store.translationProjects.selectedCards.get()).to.not.include('/path/card1');
            }
        });
    });

    describe('copy to clipboard', () => {
        it('should dispatch show-toast event on successful copy', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const cards = [
                createMockCard('/path/card1', 'Test Card', {
                    offerData: { offerId: 'offer-123' },
                }),
            ];
            setupCardsInStore(cards);
            await el.updateComplete;

            let toastEvent = null;
            el.addEventListener('show-toast', (e) => {
                toastEvent = e;
            });

            const row = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const copyButton = row?.shadowRoot?.querySelector('sp-action-button');
            copyButton?.click();
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(writeTextStub.calledWith('offer-123')).to.be.true;
            expect(toastEvent).to.not.be.null;
            expect(toastEvent.detail.variant).to.equal('positive');
        });

        it('should dispatch negative toast on copy failure', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            sandbox.stub(navigator.clipboard, 'writeText').rejects(new Error('Copy failed'));
            const cards = [
                createMockCard('/path/card1', 'Test Card', {
                    offerData: { offerId: 'offer-123' },
                }),
            ];
            setupCardsInStore(cards);
            await el.updateComplete;

            let toastEvent = null;
            el.addEventListener('show-toast', (e) => {
                toastEvent = e;
            });

            const row = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const copyButton = row?.shadowRoot?.querySelector('sp-action-button');
            copyButton?.click();
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(toastEvent).to.not.be.null;
            expect(toastEvent.detail.variant).to.equal('negative');
        });
    });

    describe('disconnectedCallback', () => {
        it('should unsubscribe from data subscription on disconnect', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            const unsubscribeSpy = sandbox.spy();
            el.dataSubscription = { unsubscribe: unsubscribeSpy };

            el.disconnectedCallback();

            expect(unsubscribeSpy.calledOnce).to.be.true;
        });

        it('should abort process controller on disconnect', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            const abortSpy = sandbox.spy();
            el.processAbortController = { abort: abortSpy };

            el.disconnectedCallback();

            expect(abortSpy.calledOnce).to.be.true;
        });

        it('should set processAbortController to null on disconnect', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            el.processAbortController = { abort: () => {} };

            el.disconnectedCallback();

            expect(el.processAbortController).to.be.null;
        });
    });

    describe('store controllers', () => {
        it('should initialize display store controller when not viewOnly', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.displayCardsStoreController).to.exist;
        });

        it('should initialize selected store controller for cards', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.selectedCardsStoreController).to.exist;
        });

        it('should initialize selected store controller for collections', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            await el.updateComplete;
            expect(el.selectedCollectionsStoreController).to.exist;
        });

        it('should initialize selected store controller for placeholders', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            await el.updateComplete;
            expect(el.selectedPlaceholdersStoreController).to.exist;
        });

        it('should initialize display store controller when viewOnly (for consistent reactivity)', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            await el.updateComplete;
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            expect(el.displayCardsStoreController).to.exist;
        });
    });

    describe('hidden selection preservation', () => {
        it('should preserve hidden selections when deselecting visible item', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/hidden-card']);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('mas-collapsible-table-row');
            await row?.updateComplete;
            const checkbox = row?.shadowRoot?.querySelector('sp-checkbox');
            checkbox?.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.include('/path/hidden-card');
            expect(Store.translationProjects.selectedCards.get()).to.not.include('/path/card1');
        });
    });

    describe('multiple rows rendering', () => {
        it('should render multiple card rows', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [
                createMockCard('/path/card1', 'Card 1'),
                createMockCard('/path/card2', 'Card 2'),
                createMockCard('/path/card3', 'Card 3'),
            ];
            setupCardsInStore(cards);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('mas-collapsible-table-row');
            expect(rows.length).to.equal(3);
        });

        it('should render multiple collection rows', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            const collections = [
                createMockCollection('/path/collection1', 'Collection 1'),
                createMockCollection('/path/collection2', 'Collection 2'),
            ];
            setupCollectionsInStore(collections);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(2);
        });

        it('should render multiple placeholder rows', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const placeholders = [
                createMockPlaceholder('/path/placeholder1', 'key1', 'value1'),
                createMockPlaceholder('/path/placeholder2', 'key2', 'value2'),
            ];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(2);
        });
    });

    describe('row value attribute', () => {
        it('should set row value attribute to fragment path for cards', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const row = collapsibleRow?.shadowRoot?.querySelector('sp-table-row');
            expect(row?.getAttribute('value')).to.equal('/path/card1');
        });

        it('should set row value attribute to fragment path for placeholders', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key1', 'value1')];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('sp-table-row');
            expect(row.getAttribute('value')).to.equal('/path/placeholder1');
        });
    });

    describe('edge cases', () => {
        it('should handle empty value in placeholder gracefully', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key', '')];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('sp-table-row');
            const cells = row?.querySelectorAll('sp-table-cell');
            expect(cells?.[2]?.textContent.trim()).to.equal('-');
        });

        it('should handle undefined status gracefully', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [{ ...createMockCard('/path/card1', 'Card 1'), status: undefined }];
            setupCardsInStore(cards);
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            expect(collapsibleRow).to.exist;
        });

        it('should handle placeholder value exactly 100 characters', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const exactValue = 'B'.repeat(100);
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key', exactValue)];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('sp-table-row');
            const cells = row?.querySelectorAll('sp-table-cell');
            expect(cells?.[2]?.textContent.trim()).to.equal(exactValue);
        });

        it('should handle card with only non-product tags', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [
                createMockCard('/path/card1', 'Card 1', {
                    tags: [{ id: 'mas:other/tag', title: 'Other' }],
                }),
            ];
            setupCardsInStore(cards);
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const cells = collapsibleRow?.shadowRoot?.querySelectorAll('sp-table-cell');
            const offerCell = Array.from(cells || []).find((c) => c.textContent.includes('no offer') || c.textContent === '-');
            expect(offerCell).to.exist;
        });

        it('should handle card with multiple tags including product code', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [
                createMockCard('/path/card1', 'Card 1', {
                    tags: [
                        { id: 'mas:other/tag', title: 'Other' },
                        { id: 'mas:product_code/illustrator', title: 'Illustrator' },
                    ],
                }),
            ];
            setupCardsInStore(cards);
            await el.updateComplete;
            const collapsibleRow = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const cells = collapsibleRow?.shadowRoot?.querySelectorAll('sp-table-cell');
            expect(cells?.[2]?.textContent.trim()).to.equal('Illustrator');
        });
    });

    describe('viewOnly mode rendering', () => {
        it('should render table when viewOnlyFragments has items', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            el.viewOnlyFragments = [card];
            await el.updateComplete;
            const table = el.shadowRoot.querySelector('sp-table');
            expect(table).to.exist;
        });

        it('should render selected collection in viewOnly mode', async () => {
            const collection = createMockCollection('/path/collection1', 'Test Collection');
            const el = await fixture(
                html`<mas-select-items-table type="collections" .viewOnly=${true}></mas-select-items-table>`,
            );
            el.viewOnlyFragments = [collection];
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(1);
        });

        it('should render selected placeholders in viewOnly mode', async () => {
            const placeholder = createMockPlaceholder('/path/placeholder1', 'key1', 'value1');
            const el = await fixture(
                html`<mas-select-items-table type="placeholders" .viewOnly=${true}></mas-select-items-table>`,
            );
            el.viewOnlyFragments = [placeholder];
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(1);
        });
    });

    describe('studioPath display', () => {
        it('should display studioPath for cards', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [
                createMockCard('/path/card1', 'Card 1', {
                    studioPath: 'merch-card: ACOM / Plans / Consumer',
                }),
            ];
            setupCardsInStore(cards);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const cells = row?.shadowRoot?.querySelectorAll('sp-table-cell');
            const pathCell = Array.from(cells || []).find((c) => c.textContent.includes('merch-card: ACOM'));
            expect(pathCell?.textContent.trim()).to.include('merch-card: ACOM / Plans / Consumer');
        });

        it('should display studioPath for collections', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            const collections = [
                createMockCollection('/path/collection1', 'Collection 1', {
                    studioPath: 'merch-card-collection: ACOM / Collection 1',
                }),
            ];
            setupCollectionsInStore(collections);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('sp-table-row');
            const cells = row?.querySelectorAll('sp-table-cell');
            expect(cells?.[2]?.textContent.trim()).to.equal('merch-card-collection: ACOM / Collection 1');
        });
    });

    describe('data loading early returns', () => {
        it('should not create real subscription when allPlaceholders already has data', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key1', 'value1')];
            setupPlaceholdersInStore(placeholders);
            await el.updateComplete;
            expect(el.dataSubscription).to.exist;
            expect(el.dataSubscription.unsubscribe).to.be.a('function');
        });

        it('should not create real subscription when allCards already has data', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            await el.updateComplete;
            expect(el.dataSubscription).to.exist;
            expect(el.dataSubscription.unsubscribe).to.be.a('function');
        });

        it('should not create real subscription when allCollections already has data', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            const collections = [createMockCollection('/path/collection1', 'Collection 1')];
            setupCollectionsInStore(collections);
            await el.updateComplete;
            expect(el.dataSubscription).to.exist;
            expect(el.dataSubscription.unsubscribe).to.be.a('function');
        });
    });

    describe('data subscription and processing', () => {
        it('should create subscription and process placeholders when store is empty', async () => {
            Store.translationProjects.allPlaceholders.set([]);
            const mockPlaceholder = {
                value: {
                    path: '/path/placeholder1',
                    key: 'test-key',
                    value: 'test-value',
                    status: FRAGMENT_STATUS.PUBLISHED,
                },
            };
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            Store.placeholders.list.data.set([mockPlaceholder]);
            await el.updateComplete;
            expect(el.dataSubscription).to.exist;
            expect(Store.translationProjects.allPlaceholders.get()).to.have.lengthOf(1);
            expect(Store.translationProjects.displayPlaceholders.get()).to.have.lengthOf(1);
        });
    });

    describe('preselection edge cases', () => {
        it('should handle preselection when selectedInTable equals visible selections', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            Store.translationProjects.displayCards.set([...cards]);
            await el.updateComplete;
            expect(el.selectedInTable).to.include('/path/card1');
        });

        it('should not update selectedInTable when already equal', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            const initialSelected = el.selectedInTable;
            Store.translationProjects.displayCards.set([...cards]);
            await el.updateComplete;
            expect(el.selectedInTable).to.deep.equal(initialSelected);
        });
    });

    describe('viewOnly mode data sources', () => {
        it('should display viewOnlyFragments as itemsToDisplay for cards', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            el.viewOnlyFragments = [card];
            await el.updateComplete;
            expect(el.itemsToDisplay).to.have.lengthOf(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/card1');
        });

        it('should display viewOnlyFragments as itemsToDisplay for collections', async () => {
            const collection = createMockCollection('/path/collection1', 'Collection 1');
            const el = await fixture(
                html`<mas-select-items-table type="collections" .viewOnly=${true}></mas-select-items-table>`,
            );
            el.viewOnlyFragments = [collection];
            await el.updateComplete;
            expect(el.itemsToDisplay).to.have.lengthOf(1);
        });

        it('should display viewOnlyFragments as itemsToDisplay for placeholders', async () => {
            const placeholder = createMockPlaceholder('/path/placeholder1', 'key1', 'value1');
            const el = await fixture(
                html`<mas-select-items-table type="placeholders" .viewOnly=${true}></mas-select-items-table>`,
            );
            el.viewOnlyFragments = [placeholder];
            await el.updateComplete;
            expect(el.itemsToDisplay).to.have.lengthOf(1);
        });
    });

    describe('display store controller', () => {
        it('should initialize displayCardsStoreController when not viewOnly for cards', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.displayCardsStoreController).to.not.be.null;
        });

        it('should initialize displayCollectionsStoreController when not viewOnly for collections', async () => {
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            await el.updateComplete;
            expect(el.displayCollectionsStoreController).to.not.be.null;
        });

        it('should initialize displayPlaceholdersStoreController when not viewOnly for placeholders', async () => {
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            await el.updateComplete;
            expect(el.displayPlaceholdersStoreController).to.not.be.null;
        });
    });

    describe('dataState', () => {
        it('should have dataState with isProcessingCards false by default', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            await el.updateComplete;
            expect(el.dataState?.isProcessingCards).to.be.false;
        });
    });

    describe('rendering with different statuses', () => {
        it('should render null status gracefully', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [{ ...createMockCard('/path/card1', 'Card 1'), status: null }];
            setupCardsInStore(cards);
            await el.updateComplete;
            const statusCell = el.shadowRoot.querySelector('.status-cell');
            expect(statusCell).to.be.null;
        });
    });

    describe('fallback value handling', () => {
        it('should render without error when selectedCards is empty array', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set([]);
            await el.updateComplete;
            expect(el.selectedInTable).to.deep.equal(new Set());
        });
    });

    describe('constructor default values', () => {
        it('should initialize with correct default values', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.selectedInTable).to.be.an('Set');
            expect(el.dataState).to.exist;
        });
    });

    describe('multiple selection scenarios', () => {
        it('should add item to selection when checkbox is clicked', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('mas-collapsible-table-row');
            await row?.updateComplete;
            const checkbox = row?.shadowRoot?.querySelector('sp-checkbox');
            if (checkbox && !Store.translationProjects.selectedCards.get().includes('/path/card1')) {
                checkbox.click();
                await el.updateComplete;
            }
            expect(Store.translationProjects.selectedCards.get()).to.include('/path/card1');
        });

        it('should remove item from selection when checkbox is clicked', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            await el.updateComplete;
            const rows = el.shadowRoot.querySelectorAll('mas-collapsible-table-row');
            const card2Row = Array.from(rows).find((row) => row.getAttribute('value') === '/path/card2');
            await card2Row?.updateComplete;
            const checkbox = card2Row?.shadowRoot?.querySelector('sp-checkbox');
            checkbox?.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.not.include('/path/card2');
        });
    });

    describe('viewOnly preselection skipping', () => {
        it('should not render checkboxes in viewOnly mode', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            el.viewOnlyFragments = [card];
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('mas-collapsible-table-row');
            const checkbox = row?.shadowRoot?.querySelector('sp-checkbox');
            expect(checkbox).to.be.null;
        });
    });

    describe('repository getter', () => {
        it('should return null when mas-repository does not exist', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.repository).to.be.null;
        });
    });

    describe('fetchSelectedFragments early returns', () => {
        it('should return early when repository is not available', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            await el.updateComplete;
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            // Since repository is null, it returns early and viewOnlyLoading stays false
            expect(el.viewOnlyLoading).to.be.false;
        });

        it('should not fetch for placeholders in viewOnly mode', async () => {
            const el = await fixture(
                html`<mas-select-items-table type="placeholders" .viewOnly=${true}></mas-select-items-table>`,
            );
            await el.updateComplete;
            const placeholder = createMockPlaceholder('/path/placeholder1', 'key1', 'value1');
            setupPlaceholdersInStore([placeholder]);
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            await el.updateComplete;
            // Placeholders don't trigger fetchSelectedFragments
            expect(el.viewOnlyLoading).to.be.false;
        });
    });

    describe('viewOnlyLoading property', () => {
        it('should initialize viewOnlyLoading to false', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            await el.updateComplete;
            expect(el.viewOnlyLoading).to.be.false;
        });

        it('should affect isLoading in viewOnly mode', async () => {
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            await el.updateComplete;
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            expect(el.isLoading).to.equal(el.viewOnlyLoading);
        });
    });

    describe('scroll sentinel', () => {
        it('should not render sentinel when items list is empty even if hasMore is true', async () => {
            Store.fragments.list.hasMore.set(true);
            Store.fragments.list.firstPageLoaded.set(true);
            Store.translationProjects.displayCards.set([]);

            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;

            const sentinel = el.renderRoot.querySelector('.scroll-sentinel');
            expect(sentinel).to.be.null;
        });

        it('should render sentinel when items are present and hasMore is true', async () => {
            Store.fragments.list.hasMore.set(true);
            Store.fragments.list.firstPageLoaded.set(true);

            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;

            // Set displayCards after initial subscription fires (which overwrites with empty data)
            setupCardsInStore([createMockCard('/card/1', 'Card 1')]);
            await el.updateComplete;

            const sentinel = el.renderRoot.querySelector('.scroll-sentinel');
            expect(sentinel).to.not.be.null;
        });

        it('should not render sentinel when hasMore is false even if items are present', async () => {
            Store.fragments.list.hasMore.set(false);
            Store.fragments.list.firstPageLoaded.set(true);
            setupCardsInStore([createMockCard('/card/1', 'Card 1')]);

            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;

            const sentinel = el.renderRoot.querySelector('.scroll-sentinel');
            expect(sentinel).to.be.null;
        });
    });
});
