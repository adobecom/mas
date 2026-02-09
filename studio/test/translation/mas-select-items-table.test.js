import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, TABLE_TYPE, FRAGMENT_STATUS } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/translation/mas-select-items-table.js';

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
        resetStore();
        mockCommerceService = createMockCommerceService();
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        resetStore();
        removeMockCommerceService();
    });

    describe('initialization', () => {
        it('should initialize with default values', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.selectedInTable).to.deep.equal([]);
            expect(el.viewOnly).to.be.undefined;
        });

        it('should accept type property for cards', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.type).to.equal('cards');
        });

        it('should accept type property for collections', async () => {
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            expect(el.type).to.equal('collections');
        });

        it('should accept type property for placeholders', async () => {
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            expect(el.type).to.equal('placeholders');
        });

        it('should accept viewOnly property', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            expect(el.viewOnly).to.be.true;
        });
    });

    describe('typeUppercased getter', () => {
        it('should return Cards for cards type', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.typeUppercased).to.equal('Cards');
        });

        it('should return Collections for collections type', async () => {
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            expect(el.typeUppercased).to.equal('Collections');
        });

        it('should return Placeholders for placeholders type', async () => {
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            expect(el.typeUppercased).to.equal('Placeholders');
        });
    });

    describe('isLoading getter', () => {
        it('should return true for cards when firstPageLoaded is false', async () => {
            Store.fragments.list.firstPageLoaded.set(false);
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.isLoading).to.be.true;
        });

        it('should return false for cards when firstPageLoaded is true', async () => {
            Store.fragments.list.firstPageLoaded.set(true);
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.isLoading).to.be.false;
        });

        it('should return true for collections when firstPageLoaded is false', async () => {
            Store.fragments.list.firstPageLoaded.set(false);
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            expect(el.isLoading).to.be.true;
        });

        it('should return true for placeholders when placeholders are loading', async () => {
            Store.placeholders.list.loading.set(true);
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            expect(el.isLoading).to.be.true;
        });

        it('should return false for placeholders when not loading', async () => {
            Store.placeholders.list.loading.set(false);
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            expect(el.isLoading).to.be.false;
        });
    });

    describe('columnsToShow getter', () => {
        it('should return correct columns for cards type', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const columns = Array.from(el.columnsToShow);
            expect(columns).to.have.lengthOf(5);
            expect(columns.map((c) => c.key)).to.deep.equal(['offer', 'fragmentTitle', 'offerId', 'path', 'status']);
        });

        it('should return correct columns for collections type', async () => {
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            const columns = Array.from(el.columnsToShow);
            expect(columns).to.have.lengthOf(3);
            expect(columns.map((c) => c.key)).to.deep.equal(['collectionTitle', 'path', 'status']);
        });

        it('should return correct columns for placeholders type', async () => {
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            const columns = Array.from(el.columnsToShow);
            expect(columns).to.have.lengthOf(3);
            expect(columns.map((c) => c.key)).to.deep.equal(['key', 'value', 'status']);
        });
    });

    describe('itemsToDisplay getter', () => {
        it('should return displayCards from store when not viewOnly', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.itemsToDisplay.length).to.equal(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/card1');
        });

        it('should return displayCollections from store when not viewOnly', async () => {
            const collections = [createMockCollection('/path/collection1', 'Collection 1')];
            setupCollectionsInStore(collections);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            expect(el.itemsToDisplay.length).to.equal(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/collection1');
        });

        it('should return displayPlaceholders from store when not viewOnly', async () => {
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key1', 'value1')];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            expect(el.itemsToDisplay.length).to.equal(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/placeholder1');
        });

        it('should return selected items mapped from paths when viewOnly is true', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            expect(el.itemsToDisplay).to.have.lengthOf(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/card1');
        });

        it('should filter out undefined items in viewOnly mode', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            Store.translationProjects.selectedCards.set(['/path/nonexistent']);
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            expect(el.itemsToDisplay).to.deep.equal([]);
        });
    });

    describe('rendering - loading state', () => {
        it('should render loading indicator when loading', async () => {
            Store.fragments.list.firstPageLoaded.set(false);
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const loadingContainer = el.shadowRoot.querySelector('.loading-container');
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(loadingContainer).to.exist;
            expect(progressCircle).to.exist;
        });

        it('should not render loading indicator when not loading', async () => {
            Store.fragments.list.firstPageLoaded.set(true);
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const loadingContainer = el.shadowRoot.querySelector('.loading-container');
            expect(loadingContainer).to.be.null;
        });
    });

    describe('rendering - empty state', () => {
        it('should render "No items found" when no items to display', async () => {
            setupCardsInStore([]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const emptyMessage = el.shadowRoot.querySelector('p');
            expect(emptyMessage).to.exist;
            expect(emptyMessage.textContent).to.equal('No items found.');
        });
    });

    describe('rendering - table structure', () => {
        it('should render table when items exist', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const table = el.shadowRoot.querySelector('sp-table');
            expect(table).to.exist;
        });

        it('should render table headers for cards', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const headers = el.shadowRoot.querySelectorAll('sp-table-head-cell');
            expect(headers.length).to.equal(5);
            expect(headers[0].textContent.trim()).to.include('Offer');
            expect(headers[1].textContent.trim()).to.include('Fragment title');
            expect(headers[2].textContent.trim()).to.include('Offer ID');
            expect(headers[3].textContent.trim()).to.include('Path');
            expect(headers[4].textContent.trim()).to.include('Status');
        });

        it('should render table headers for collections', async () => {
            const collections = [createMockCollection('/path/collection1', 'Collection 1')];
            setupCollectionsInStore(collections);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            const headers = el.shadowRoot.querySelectorAll('sp-table-head-cell');
            expect(headers.length).to.equal(3);
            expect(headers[0].textContent.trim()).to.include('Collection title');
            expect(headers[1].textContent.trim()).to.include('Path');
            expect(headers[2].textContent.trim()).to.include('Status');
        });

        it('should render table headers for placeholders', async () => {
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key1', 'value1')];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            const headers = el.shadowRoot.querySelectorAll('sp-table-head-cell');
            expect(headers.length).to.equal(3);
            expect(headers[0].textContent.trim()).to.include('Key');
            expect(headers[1].textContent.trim()).to.include('Value');
            expect(headers[2].textContent.trim()).to.include('Status');
        });
    });

    describe('rendering - cards table body', () => {
        it('should render card rows with correct data', async () => {
            const cards = [
                createMockCard('/path/card1', 'Test Card', {
                    tags: [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }],
                    offerData: { offerId: 'offer-123' },
                    studioPath: 'merch-card: ACOM / Plans',
                }),
            ];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(1);
            const cells = rows[0].querySelectorAll('sp-table-cell');
            expect(cells[0].textContent.trim()).to.equal('Photoshop');
            expect(cells[1].textContent.trim()).to.equal('Test Card');
        });

        it('should display "-" when no product tag exists', async () => {
            const cards = [createMockCard('/path/card1', 'Test Card')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[0].textContent.trim()).to.equal('-');
        });

        it('should render copy button when offer data exists', async () => {
            const cards = [
                createMockCard('/path/card1', 'Test Card', {
                    offerData: { offerId: 'offer-123' },
                }),
            ];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const copyButton = el.shadowRoot.querySelector('sp-action-button');
            expect(copyButton).to.exist;
        });

        it('should display "no offer data" when offerData is null', async () => {
            const cards = [createMockCard('/path/card1', 'Test Card')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const offerIdCell = el.shadowRoot.querySelectorAll('sp-table-cell')[2];
            expect(offerIdCell.textContent).to.include('no offer data');
        });
    });

    describe('rendering - collections table body', () => {
        it('should render collection rows with correct data', async () => {
            const collections = [
                createMockCollection('/path/collection1', 'Test Collection', {
                    studioPath: 'merch-card-collection: ACOM / Test Collection',
                }),
            ];
            setupCollectionsInStore(collections);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(1);
            const cells = rows[0].querySelectorAll('sp-table-cell');
            expect(cells[0].textContent.trim()).to.equal('Test Collection');
        });

        it('should display "-" for collection with no title', async () => {
            const collections = [createMockCollection('/path/collection1', null)];
            setupCollectionsInStore(collections);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[0].textContent.trim()).to.equal('-');
        });
    });

    describe('rendering - placeholders table body', () => {
        it('should render placeholder rows with correct data', async () => {
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'test-key', 'test-value')];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(1);
            const cells = rows[0].querySelectorAll('sp-table-cell');
            expect(cells[0].textContent.trim()).to.equal('test-key');
            expect(cells[1].textContent.trim()).to.equal('test-value');
        });

        it('should display "-" for placeholder with no key', async () => {
            const placeholders = [createMockPlaceholder('/path/placeholder1', null, 'test-value')];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[0].textContent.trim()).to.equal('-');
        });

        it('should truncate long placeholder values to 100 characters', async () => {
            const longValue = 'A'.repeat(150);
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key', longValue)];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[1].textContent.trim()).to.equal(`${'A'.repeat(100)}...`);
        });

        it('should display "-" for placeholder with no value', async () => {
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key', null)];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[1].textContent.trim()).to.equal('-');
        });
    });

    describe('rendering - status cell', () => {
        it('should render Published status with green dot', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1', { status: FRAGMENT_STATUS.PUBLISHED })];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const statusCell = el.shadowRoot.querySelector('.status-cell');
            const statusDot = statusCell.querySelector('.status-dot');
            expect(statusDot.classList.contains('green')).to.be.true;
            expect(statusCell.textContent).to.include('Published');
        });

        it('should render Modified status with blue dot', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1', { status: FRAGMENT_STATUS.MODIFIED })];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const statusCell = el.shadowRoot.querySelector('.status-cell');
            const statusDot = statusCell.querySelector('.status-dot');
            expect(statusDot.classList.contains('blue')).to.be.true;
            expect(statusCell.textContent).to.include('Modified');
        });

        it('should render Draft status without color class', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1', { status: FRAGMENT_STATUS.DRAFT })];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const statusCell = el.shadowRoot.querySelector('.status-cell');
            const statusDot = statusCell.querySelector('.status-dot');
            expect(statusDot.classList.contains('green')).to.be.false;
            expect(statusDot.classList.contains('blue')).to.be.false;
            expect(statusCell.textContent).to.include('Draft');
        });
    });

    describe('table selection behavior', () => {
        it('should set selects to multiple when not viewOnly', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const table = el.shadowRoot.querySelector('sp-table');
            expect(table.selects).to.equal('multiple');
        });

        it('should set selects to undefined when viewOnly', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            const table = el.shadowRoot.querySelector('sp-table');
            expect(table.selects).to.be.undefined;
        });

        it('should update selectedInTable when selection changes', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const table = el.shadowRoot.querySelector('sp-table');

            // Simulate selection change
            const mockEvent = new Event('change');
            Object.defineProperty(mockEvent, 'target', {
                value: { selected: ['/path/card1'] },
                writable: false,
            });
            table.dispatchEvent(mockEvent);
            await el.updateComplete;

            expect(el.selectedInTable).to.include('/path/card1');
        });
    });

    describe('selection preselection', () => {
        it('should preselect items that are in the store selection', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            expect(el.selectedInTable).to.include('/path/card1');
        });

        it('should only preselect visible items', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            expect(el.selectedInTable).to.include('/path/card1');
            expect(el.selectedInTable).to.not.include('/path/card2');
        });
    });

    describe('item removal', () => {
        it('should remove item from selection when itemToRemove is set', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;

            el.itemToRemove = '/path/card1';
            await el.updateComplete;

            expect(Store.translationProjects.selectedCards.get()).to.not.include('/path/card1');
            expect(Store.translationProjects.selectedCards.get()).to.include('/path/card2');
        });

        it('should not throw when removing non-existent item', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;

            el.itemToRemove = '/path/nonexistent';
            await el.updateComplete;

            expect(Store.translationProjects.selectedCards.get()).to.include('/path/card1');
        });
    });

    describe('copy to clipboard', () => {
        it('should dispatch show-toast event on successful copy', async () => {
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const cards = [
                createMockCard('/path/card1', 'Test Card', {
                    offerData: { offerId: 'offer-123' },
                }),
            ];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);

            let toastEvent = null;
            el.addEventListener('show-toast', (e) => {
                toastEvent = e;
            });

            const copyButton = el.shadowRoot.querySelector('sp-action-button');
            copyButton.click();
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(writeTextStub.calledWith('offer-123')).to.be.true;
            expect(toastEvent).to.not.be.null;
            expect(toastEvent.detail.variant).to.equal('positive');
        });

        it('should dispatch negative toast on copy failure', async () => {
            sandbox.stub(navigator.clipboard, 'writeText').rejects(new Error('Copy failed'));
            const cards = [
                createMockCard('/path/card1', 'Test Card', {
                    offerData: { offerId: 'offer-123' },
                }),
            ];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);

            let toastEvent = null;
            el.addEventListener('show-toast', (e) => {
                toastEvent = e;
            });

            const copyButton = el.shadowRoot.querySelector('sp-action-button');
            copyButton.click();
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(toastEvent).to.not.be.null;
            expect(toastEvent.detail.variant).to.equal('negative');
        });
    });

    describe('disconnectedCallback', () => {
        it('should unsubscribe from data subscription on disconnect', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const unsubscribeSpy = sandbox.spy();
            el.dataSubscription = { unsubscribe: unsubscribeSpy };

            el.disconnectedCallback();

            expect(unsubscribeSpy.calledOnce).to.be.true;
        });

        it('should abort process controller on disconnect', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const abortSpy = sandbox.spy();
            el.processAbortController = { abort: abortSpy };

            el.disconnectedCallback();

            expect(abortSpy.calledOnce).to.be.true;
        });

        it('should set processAbortController to null on disconnect', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            el.processAbortController = { abort: () => {} };

            el.disconnectedCallback();

            expect(el.processAbortController).to.be.null;
        });
    });

    describe('store controllers', () => {
        it('should initialize display store controller when not viewOnly', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.displayCardsStoreController).to.exist;
        });

        it('should initialize selected store controller for cards', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.selectedCardsStoreController).to.exist;
        });

        it('should initialize selected store controller for collections', async () => {
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            expect(el.selectedCollectionsStoreController).to.exist;
        });

        it('should initialize selected store controller for placeholders', async () => {
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            expect(el.selectedPlaceholdersStoreController).to.exist;
        });

        it('should not initialize display store controller when viewOnly', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            expect(el.displayCardsStoreController).to.be.null;
        });
    });

    describe('hidden selection preservation', () => {
        it('should preserve selections for hidden items when selection changes', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/hidden-card']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const table = el.shadowRoot.querySelector('sp-table');
            const mockEvent = new Event('change');
            Object.defineProperty(mockEvent, 'target', {
                value: { selected: ['/path/card1'] },
                writable: false,
            });
            table.dispatchEvent(mockEvent);
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.include('/path/hidden-card');
        });
    });

    describe('multiple rows rendering', () => {
        it('should render multiple card rows', async () => {
            const cards = [
                createMockCard('/path/card1', 'Card 1'),
                createMockCard('/path/card2', 'Card 2'),
                createMockCard('/path/card3', 'Card 3'),
            ];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(3);
        });

        it('should render multiple collection rows', async () => {
            const collections = [
                createMockCollection('/path/collection1', 'Collection 1'),
                createMockCollection('/path/collection2', 'Collection 2'),
            ];
            setupCollectionsInStore(collections);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(2);
        });

        it('should render multiple placeholder rows', async () => {
            const placeholders = [
                createMockPlaceholder('/path/placeholder1', 'key1', 'value1'),
                createMockPlaceholder('/path/placeholder2', 'key2', 'value2'),
            ];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(2);
        });
    });

    describe('row value attribute', () => {
        it('should set row value attribute to fragment path', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const row = el.shadowRoot.querySelector('sp-table-row');
            expect(row.getAttribute('value')).to.equal('/path/card1');
        });
    });

    describe('edge cases', () => {
        it('should handle empty value in placeholder gracefully', async () => {
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key', '')];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[1].textContent.trim()).to.equal('-');
        });

        it('should handle undefined status gracefully', async () => {
            const cards = [{ ...createMockCard('/path/card1', 'Card 1'), status: undefined }];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const statusCell = el.shadowRoot.querySelector('.status-cell');
            expect(statusCell).to.be.null;
        });

        it('should handle placeholder value exactly 100 characters', async () => {
            const exactValue = 'B'.repeat(100);
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key', exactValue)];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[1].textContent.trim()).to.equal(exactValue);
        });

        it('should handle card with only non-product tags', async () => {
            const cards = [
                createMockCard('/path/card1', 'Card 1', {
                    tags: [{ id: 'mas:other/tag', title: 'Other' }],
                }),
            ];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[0].textContent.trim()).to.equal('-');
        });

        it('should handle card with multiple tags including product code', async () => {
            const cards = [
                createMockCard('/path/card1', 'Card 1', {
                    tags: [
                        { id: 'mas:other/tag', title: 'Other' },
                        { id: 'mas:product_code/illustrator', title: 'Illustrator' },
                    ],
                }),
            ];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[0].textContent.trim()).to.equal('Illustrator');
        });
    });

    describe('viewOnly mode rendering', () => {
        it('should render table without selection checkboxes in viewOnly mode', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            const table = el.shadowRoot.querySelector('sp-table');
            expect(table).to.exist;
            expect(table.selected).to.deep.equal([]);
        });

        it('should render selected collection in viewOnly mode', async () => {
            const collection = createMockCollection('/path/collection1', 'Test Collection');
            setupCollectionsInStore([collection]);
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            const el = await fixture(
                html`<mas-select-items-table type="collections" .viewOnly=${true}></mas-select-items-table>`,
            );
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(1);
        });

        it('should render selected placeholders in viewOnly mode', async () => {
            const placeholder = createMockPlaceholder('/path/placeholder1', 'key1', 'value1');
            setupPlaceholdersInStore([placeholder]);
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            const el = await fixture(
                html`<mas-select-items-table type="placeholders" .viewOnly=${true}></mas-select-items-table>`,
            );
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows.length).to.equal(1);
        });
    });

    describe('studioPath display', () => {
        it('should display studioPath for cards', async () => {
            const cards = [
                createMockCard('/path/card1', 'Card 1', {
                    studioPath: 'merch-card: ACOM / Plans / Consumer',
                }),
            ];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[3].textContent.trim()).to.equal('merch-card: ACOM / Plans / Consumer');
        });

        it('should display studioPath for collections', async () => {
            const collections = [
                createMockCollection('/path/collection1', 'Collection 1', {
                    studioPath: 'merch-card-collection: ACOM / Collection 1',
                }),
            ];
            setupCollectionsInStore(collections);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            expect(cells[1].textContent.trim()).to.equal('merch-card-collection: ACOM / Collection 1');
        });
    });

    describe('data loading early returns', () => {
        it('should not create subscription when allPlaceholders already has data', async () => {
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key1', 'value1')];
            setupPlaceholdersInStore(placeholders);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            expect(el.dataSubscription).to.be.null;
        });

        it('should not create subscription when allCards already has data', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.dataSubscription).to.be.null;
        });

        it('should not create subscription when allCollections already has data', async () => {
            const collections = [createMockCollection('/path/collection1', 'Collection 1')];
            setupCollectionsInStore(collections);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            expect(el.dataSubscription).to.be.null;
        });
    });

    describe('preselection edge cases', () => {
        it('should handle preselection when selectedInTable equals visible selections', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            Store.translationProjects.displayCards.set([...cards]);
            await el.updateComplete;
            expect(el.selectedInTable).to.include('/path/card1');
        });

        it('should not update selectedInTable when already equal', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const initialSelected = el.selectedInTable;
            Store.translationProjects.displayCards.set([...cards]);
            await el.updateComplete;
            expect(el.selectedInTable).to.deep.equal(initialSelected);
        });
    });

    describe('removeItem edge cases', () => {
        it('should click row when removing last selected item', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('sp-table-row[value="/path/card1"]');
            const clickSpy = sandbox.spy(row, 'click');
            el.itemToRemove = '/path/card1';
            await el.updateComplete;
            expect(clickSpy.calledOnce).to.be.true;
        });

        it('should handle removal with empty itemToRemove', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            el.itemToRemove = '';
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.include('/path/card1');
        });

        it('should handle removal with null itemToRemove', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            el.itemToRemove = null;
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.include('/path/card1');
        });
    });

    describe('willUpdate behavior', () => {
        it('should call removeItem when itemToRemove property changes', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            el.itemToRemove = '/path/card1';
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.not.include('/path/card1');
            expect(Store.translationProjects.selectedCards.get()).to.include('/path/card2');
        });
    });

    describe('viewOnly mode data sources', () => {
        it('should use cardsByPaths to resolve selected items in viewOnly mode', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/nonexistent']);
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            expect(el.itemsToDisplay).to.have.lengthOf(1);
            expect(el.itemsToDisplay[0].path).to.equal('/path/card1');
        });

        it('should use collectionsByPaths to resolve selected collections in viewOnly mode', async () => {
            const collection = createMockCollection('/path/collection1', 'Collection 1');
            setupCollectionsInStore([collection]);
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            const el = await fixture(
                html`<mas-select-items-table type="collections" .viewOnly=${true}></mas-select-items-table>`,
            );
            expect(el.itemsToDisplay).to.have.lengthOf(1);
        });

        it('should use placeholdersByPaths to resolve selected placeholders in viewOnly mode', async () => {
            const placeholder = createMockPlaceholder('/path/placeholder1', 'key1', 'value1');
            setupPlaceholdersInStore([placeholder]);
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            const el = await fixture(
                html`<mas-select-items-table type="placeholders" .viewOnly=${true}></mas-select-items-table>`,
            );
            expect(el.itemsToDisplay).to.have.lengthOf(1);
        });
    });

    describe('updateSelected with hidden selections', () => {
        it('should merge visible and hidden selections correctly', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/hidden']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const table = el.shadowRoot.querySelector('sp-table');
            const mockEvent = new Event('change');
            Object.defineProperty(mockEvent, 'target', {
                value: { selected: ['/path/card1'] },
                writable: false,
            });
            table.dispatchEvent(mockEvent);
            await el.updateComplete;
            const selected = Store.translationProjects.selectedCards.get();
            expect(selected).to.include('/path/hidden');
            expect(selected).to.include('/path/card1');
        });

        it('should deduplicate selections when merging', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const table = el.shadowRoot.querySelector('sp-table');
            const mockEvent = new Event('change');
            Object.defineProperty(mockEvent, 'target', {
                value: { selected: ['/path/card1'] },
                writable: false,
            });
            table.dispatchEvent(mockEvent);
            await el.updateComplete;
            const selected = Store.translationProjects.selectedCards.get();
            expect(selected.filter((p) => p === '/path/card1')).to.have.lengthOf(1);
        });
    });

    describe('table key and display store controller', () => {
        it('should increment tableKey when display data changes', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const initialKey = el.tableKey;
            Store.translationProjects.displayCards.set([...cards, createMockCard('/path/card2', 'Card 2')]);
            await el.updateComplete;
            expect(el.tableKey).to.be.greaterThan(initialKey);
        });

        it('should initialize displayCardsStoreController when not viewOnly for cards', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.displayCardsStoreController).to.not.be.null;
        });

        it('should initialize displayCollectionsStoreController when not viewOnly for collections', async () => {
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            expect(el.displayCollectionsStoreController).to.not.be.null;
        });

        it('should initialize displayPlaceholdersStoreController when not viewOnly for placeholders', async () => {
            setupPlaceholdersInStore([createMockPlaceholder('/path/placeholder1', 'key1', 'value1')]);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            expect(el.displayPlaceholdersStoreController).to.not.be.null;
        });
    });

    describe('processAbortController state', () => {
        it('should have null processAbortController initially when data exists', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.processAbortController).to.be.null;
        });

        it('should set isProcessingCards to false by default', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.isProcessingCards).to.be.false;
        });
    });

    describe('rendering with different statuses', () => {
        it('should render null status gracefully', async () => {
            const cards = [{ ...createMockCard('/path/card1', 'Card 1'), status: null }];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const statusCell = el.shadowRoot.querySelector('.status-cell');
            expect(statusCell).to.be.null;
        });
    });

    describe('fallback value handling', () => {
        it('should handle null selectedCards store value', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(null);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            expect(el.selectedInTable).to.deep.equal([]);
        });

        it('should handle undefined selectedCollections store value', async () => {
            const collections = [createMockCollection('/path/collection1', 'Collection 1')];
            setupCollectionsInStore(collections);
            Store.translationProjects.selectedCollections.set(undefined);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            await el.updateComplete;
            expect(el.selectedInTable).to.deep.equal([]);
        });

        it('should handle null selectedPlaceholders store value', async () => {
            const placeholders = [createMockPlaceholder('/path/placeholder1', 'key1', 'value1')];
            setupPlaceholdersInStore(placeholders);
            Store.translationProjects.selectedPlaceholders.set(null);
            const el = await fixture(html`<mas-select-items-table type="placeholders"></mas-select-items-table>`);
            await el.updateComplete;
            expect(el.selectedInTable).to.deep.equal([]);
        });
    });

    describe('constructor default values', () => {
        it('should initialize with correct default values', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            expect(el.tableKey).to.be.a('number');
            expect(el.selectedInTable).to.be.an('array');
            expect(el.OFFER_DATA_CONCURRENCY_LIMIT).to.equal(5);
            expect(el.isProcessingCards).to.be.false;
        });
    });

    describe('multiple selection scenarios', () => {
        it('should select all visible items', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const table = el.shadowRoot.querySelector('sp-table');
            const mockEvent = new Event('change');
            Object.defineProperty(mockEvent, 'target', {
                value: { selected: ['/path/card1', '/path/card2'] },
                writable: false,
            });
            table.dispatchEvent(mockEvent);
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.have.lengthOf(2);
        });

        it('should deselect item when removed from selection', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1'), createMockCard('/path/card2', 'Card 2')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const table = el.shadowRoot.querySelector('sp-table');
            const mockEvent = new Event('change');
            Object.defineProperty(mockEvent, 'target', {
                value: { selected: ['/path/card1'] },
                writable: false,
            });
            table.dispatchEvent(mockEvent);
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.include('/path/card1');
            expect(Store.translationProjects.selectedCards.get()).to.not.include('/path/card2');
        });

        it('should deselect all visible items', async () => {
            const cards = [createMockCard('/path/card1', 'Card 1')];
            setupCardsInStore(cards);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            await el.updateComplete;
            const table = el.shadowRoot.querySelector('sp-table');
            const mockEvent = new Event('change');
            Object.defineProperty(mockEvent, 'target', {
                value: { selected: [] },
                writable: false,
            });
            table.dispatchEvent(mockEvent);
            await el.updateComplete;

            expect(Store.translationProjects.selectedCards.get()).to.not.include('/path/card1');
        });
    });

    describe('viewOnly preselection skipping', () => {
        it('should skip preselection logic in viewOnly mode', async () => {
            const card = createMockCard('/path/card1', 'Card 1');
            setupCardsInStore([card]);
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-select-items-table type="cards" .viewOnly=${true}></mas-select-items-table>`);
            await el.updateComplete;
            expect(el.selectedInTable).to.deep.equal([]);
        });
    });

    describe('yieldToMain', () => {
        it('should return a promise that resolves after yielding to event loop', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const result = el.yieldToMain();
            expect(result).to.be.instanceOf(Promise);
            await result;
        });

        it('should resolve without a value', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const result = await el.yieldToMain();
            expect(result).to.be.undefined;
        });

        it('should allow other code to execute between calls', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            let executed = false;
            setTimeout(() => {
                executed = true;
            }, 0);
            expect(executed).to.be.false;
            await el.yieldToMain();
            expect(executed).to.be.true;
        });
    });

    describe('processConcurrently', () => {
        it('should process items and return results in order', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const items = [1, 2, 3];
            const asyncFn = async (item) => item * 2;
            const results = await el.processConcurrently(items, asyncFn, 2);
            expect(results).to.deep.equal([2, 4, 6]);
        });

        it('should handle empty items array', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const results = await el.processConcurrently([], async (x) => x, 2);
            expect(results).to.deep.equal([]);
        });

        it('should respect concurrency limit', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            let maxConcurrent = 0;
            let currentConcurrent = 0;
            const items = [1, 2, 3, 4, 5];
            const asyncFn = async (item) => {
                currentConcurrent++;
                maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
                await new Promise((resolve) => setTimeout(resolve, 10));
                currentConcurrent--;
                return item;
            };
            await el.processConcurrently(items, asyncFn, 2);
            expect(maxConcurrent).to.be.at.most(2);
        });

        it('should pass item index to async function', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const items = ['a', 'b', 'c'];
            const results = await el.processConcurrently(items, async (item, index) => `${item}-${index}`, 2);
            expect(results).to.deep.equal(['a-0', 'b-1', 'c-2']);
        });

        it('should handle async functions that throw errors', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const items = [1, 2, 3];
            const asyncFn = async (item) => {
                if (item === 2) throw new Error('Test error');
                return item;
            };
            try {
                await el.processConcurrently(items, asyncFn, 2);
                expect.fail('Should have thrown an error');
            } catch (err) {
                expect(err.message).to.equal('Test error');
            }
        });

        it('should process all items when concurrency limit exceeds items length', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const items = [1, 2];
            const asyncFn = async (item) => item * 3;
            const results = await el.processConcurrently(items, asyncFn, 10);
            expect(results).to.deep.equal([3, 6]);
        });

        it('should yield to main periodically based on batchSize', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const yieldSpy = sandbox.spy(el, 'yieldToMain');
            const items = Array.from({ length: 25 }, (_, i) => i);
            const asyncFn = async (item) => item;
            await el.processConcurrently(items, asyncFn, 5, 10);
            expect(yieldSpy.callCount).to.be.at.least(1);
        });

        it('should handle single item', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const results = await el.processConcurrently([42], async (x) => x * 2, 2);
            expect(results).to.deep.equal([84]);
        });

        it('should process items with concurrency limit of 1 (sequential)', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const order = [];
            const items = [1, 2, 3];
            const asyncFn = async (item) => {
                order.push(`start-${item}`);
                await new Promise((resolve) => setTimeout(resolve, 5));
                order.push(`end-${item}`);
                return item;
            };
            await el.processConcurrently(items, asyncFn, 1);
            expect(order[0]).to.equal('start-1');
            expect(order[1]).to.equal('end-1');
        });
    });

    describe('loadOfferData', () => {
        it('should return null when fragment has no osi field', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const fragment = { fields: [] };
            const result = await el.loadOfferData(fragment);
            expect(result).to.be.null;
        });

        it('should return null when osi field has no values', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const fragment = { fields: [{ name: 'osi', values: [] }] };
            const result = await el.loadOfferData(fragment);
            expect(result).to.be.null;
        });

        it('should return cached offer data when available', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            Store.translationProjects.offerDataCache.set('cached-osi', { offerId: 'cached-offer' });
            const fragment = { fields: [{ name: 'osi', values: ['cached-osi'] }] };
            const result = await el.loadOfferData(fragment);
            expect(result).to.deep.equal({ offerId: 'cached-offer' });
            expect(mockCommerceService.collectPriceOptions.called).to.be.false;
        });

        it('should return null when signal is aborted before service call', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const fragment = { fields: [{ name: 'osi', values: ['test-osi'] }] };
            const abortController = new AbortController();
            abortController.abort();
            const result = await el.loadOfferData(fragment, abortController.signal);
            expect(result).to.be.null;
        });

        it('should call commerce service with correct osi', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const fragment = { fields: [{ name: 'osi', values: ['my-osi-value'] }] };
            await el.loadOfferData(fragment);
            expect(mockCommerceService.collectPriceOptions.calledWith({ wcsOsi: 'my-osi-value' })).to.be.true;
        });

        it('should return offer data from commerce service', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            mockCommerceService.resolveOfferSelectors.returns([
                Promise.resolve([{ offerId: 'resolved-offer-123', name: 'Test Offer' }]),
            ]);
            const fragment = { fields: [{ name: 'osi', values: ['new-osi'] }] };
            const result = await el.loadOfferData(fragment);
            expect(result).to.deep.equal({ offerId: 'resolved-offer-123', name: 'Test Offer' });
        });

        it('should cache the resolved offer data', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            mockCommerceService.resolveOfferSelectors.returns([Promise.resolve([{ offerId: 'to-cache' }])]);
            const fragment = { fields: [{ name: 'osi', values: ['cache-me'] }] };
            await el.loadOfferData(fragment);
            expect(Store.translationProjects.offerDataCache.get('cache-me')).to.deep.equal({ offerId: 'to-cache' });
        });

        it('should return null when offersPromise is null', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            mockCommerceService.resolveOfferSelectors.returns([null]);
            const fragment = { fields: [{ name: 'osi', values: ['null-promise-osi'] }] };
            const result = await el.loadOfferData(fragment);
            expect(result).to.be.null;
        });

        it('should return null and log warning on error', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const consoleWarnStub = sandbox.stub(console, 'warn');
            mockCommerceService.resolveOfferSelectors.returns([Promise.reject(new Error('Service error'))]);
            const fragment = { id: 'frag-123', fields: [{ name: 'osi', values: ['error-osi'] }] };
            const result = await el.loadOfferData(fragment);
            expect(result).to.be.null;
            expect(consoleWarnStub.called).to.be.true;
        });

        it('should cache null on error', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            sandbox.stub(console, 'warn');
            mockCommerceService.resolveOfferSelectors.returns([Promise.reject(new Error('Service error'))]);
            const fragment = { id: 'frag-123', fields: [{ name: 'osi', values: ['error-cache-osi'] }] };
            await el.loadOfferData(fragment);
            expect(Store.translationProjects.offerDataCache.get('error-cache-osi')).to.be.null;
        });

        it('should not cache on error when signal is aborted', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            sandbox.stub(console, 'warn');
            const abortController = new AbortController();
            mockCommerceService.resolveOfferSelectors.returns([
                new Promise((_, reject) => {
                    abortController.abort();
                    reject(new Error('Aborted'));
                }),
            ]);
            const fragment = { id: 'frag-123', fields: [{ name: 'osi', values: ['abort-error-osi'] }] };
            await el.loadOfferData(fragment, abortController.signal);
            expect(Store.translationProjects.offerDataCache.has('abort-error-osi')).to.be.false;
        });

        it('should return null when signal is aborted after service resolves', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const abortController = new AbortController();
            mockCommerceService.resolveOfferSelectors.returns([
                new Promise((resolve) => {
                    setTimeout(() => {
                        abortController.abort();
                        resolve([{ offerId: 'late-offer' }]);
                    }, 10);
                }),
            ]);
            const fragment = { fields: [{ name: 'osi', values: ['abort-after-osi'] }] };
            const result = await el.loadOfferData(fragment, abortController.signal);
            expect(result).to.be.null;
        });
    });

    describe('getFragmentName', () => {
        it('should return fragment name with web component prefix for cards', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const mockFragment = {
                model: { path: '/conf/mas/settings/dam/cfm/models/card' },
                getField: () => ({ values: ['Test Card'] }),
                getTagTitle: () => null,
            };
            const result = el.getFragmentName(mockFragment);
            expect(result).to.include('merch-card:');
        });

        it('should return fragment name with web component prefix for collections', async () => {
            setupCollectionsInStore([createMockCollection('/path/collection1', 'Collection 1')]);
            const el = await fixture(html`<mas-select-items-table type="collections"></mas-select-items-table>`);
            const mockFragment = {
                model: { path: '/conf/mas/settings/dam/cfm/models/collection' },
                title: 'Test Collection',
                getField: () => null,
                getTagTitle: () => null,
            };
            const result = el.getFragmentName(mockFragment);
            expect(result).to.include('merch-card-collection:');
        });

        it('should handle null data gracefully', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const result = el.getFragmentName(null);
            expect(result).to.include('undefined:');
        });

        it('should handle data with unknown model path', async () => {
            setupCardsInStore([createMockCard('/path/card1', 'Card 1')]);
            const el = await fixture(html`<mas-select-items-table type="cards"></mas-select-items-table>`);
            const mockFragment = {
                model: { path: '/unknown/model/path' },
                getField: () => null,
                getTagTitle: () => null,
            };
            const result = el.getFragmentName(mockFragment);
            expect(result).to.include('undefined:');
        });
    });
});
