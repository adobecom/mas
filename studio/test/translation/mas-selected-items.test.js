import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { setCardVariationsByPaths } from '../../src/common/utils/items-loader.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/common/components/mas-selected-items.js';

describe('MasSelectedItems', () => {
    let sandbox;

    const createMockCard = (path, title, studioPath = '/studio/path') => ({
        path,
        title,
        studioPath,
        model: { path: CARD_MODEL_PATH },
    });

    const createMockCollection = (path, title, studioPath = '/studio/collection/path') => ({
        path,
        title,
        studioPath,
        model: { path: COLLECTION_MODEL_PATH },
    });

    const createMockPlaceholder = (path, key, value) => ({
        path,
        key,
        placeholderValue: value,
        model: { path: '/content/dam/mas/' },
        getFieldValue(field) {
            if (field === 'key') return this.key;
            if (field === 'value') return this.placeholderValue;
            return null;
        },
    });

    const resetMaps = () => {
        Store.translationProjects.cardsByPaths.value = new Map();
        Store.translationProjects.collectionsByPaths.value = new Map();
        Store.translationProjects.placeholdersByPaths.value = new Map();
        setCardVariationsByPaths(new Map());
    };

    const setCardsByPaths = (map) => {
        Store.translationProjects.cardsByPaths.value = map;
    };

    const setCollectionsByPaths = (map) => {
        Store.translationProjects.collectionsByPaths.value = map;
    };

    const setPlaceholdersByPaths = (map) => {
        Store.translationProjects.placeholdersByPaths.value = map;
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        setItemsSelectionStore(Store.translationProjects);
        Store.translationProjects.showSelected.set(false);
        Store.translationProjects.selectedCards.set([]);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);
        resetMaps();
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.translationProjects.showSelected.set(false);
        Store.translationProjects.selectedCards.set([]);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);
        resetMaps();
        setItemsSelectionStore(null);
    });

    describe('initialization', () => {
        it('should initialize with reactive controller', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.storeController).to.exist;
        });

        it('should render nothing when showSelected is false', async () => {
            Store.translationProjects.showSelected.set(false);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const list = el.shadowRoot.querySelector('.selected-items');
            expect(list).to.be.null;
        });

        it('should render nothing when showSelected is true but no items selected', async () => {
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const list = el.shadowRoot.querySelector('.selected-items');
            expect(list).to.be.null;
        });
    });

    describe('showSelected getter', () => {
        it('should return false when store value is false', async () => {
            Store.translationProjects.showSelected.set(false);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.showSelected).to.be.false;
        });

        it('should return true when store value is true', async () => {
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.showSelected).to.be.true;
        });
    });

    describe('isLoadingItems getter', () => {
        it('should return false when neither fragments nor placeholders are loading', async () => {
            Store.fragments.list.loading.set(false);
            Store.placeholders.list.loading.set(false);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.isLoadingItems).to.be.false;
        });

        it('should return true when fragments are loading', async () => {
            Store.fragments.list.loading.set(true);
            Store.placeholders.list.loading.set(false);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.isLoadingItems).to.be.true;
        });

        it('should return true when placeholders are loading', async () => {
            Store.fragments.list.loading.set(false);
            Store.placeholders.list.loading.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.isLoadingItems).to.be.true;
        });

        it('should return true when both fragments and placeholders are loading', async () => {
            Store.fragments.list.loading.set(true);
            Store.placeholders.list.loading.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.isLoadingItems).to.be.true;
        });
    });

    describe('selectedItems getter', () => {
        it('should return empty array when no items selected', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.selectedItems).to.deep.equal([]);
        });

        it('should return selected cards', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.selectedItems).to.have.lengthOf(1);
            expect(el.selectedItems[0]).to.equal(card);
        });

        it('should return selected collections', async () => {
            const collection = createMockCollection('/path/collection1', 'Test Collection');
            setCollectionsByPaths(new Map([['/path/collection1', collection]]));
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.selectedItems).to.have.lengthOf(1);
            expect(el.selectedItems[0]).to.equal(collection);
        });

        it('should return selected placeholders', async () => {
            const placeholder = createMockPlaceholder('/path/placeholder1', 'testKey', 'testValue');
            setPlaceholdersByPaths(new Map([['/path/placeholder1', placeholder]]));
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.selectedItems).to.have.lengthOf(1);
            expect(el.selectedItems[0]).to.equal(placeholder);
        });

        it('should return all selected items combined', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            const collection = createMockCollection('/path/collection1', 'Test Collection');
            const placeholder = createMockPlaceholder('/path/placeholder1', 'testKey', 'testValue');
            setCardsByPaths(new Map([['/path/card1', card]]));
            setCollectionsByPaths(new Map([['/path/collection1', collection]]));
            setPlaceholdersByPaths(new Map([['/path/placeholder1', placeholder]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.selectedItems).to.have.lengthOf(3);
        });

        it('should filter out undefined items when path not found in map', async () => {
            Store.translationProjects.selectedCards.set(['/path/nonexistent']);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.selectedItems).to.deep.equal([]);
        });
    });

    describe('getTitle method', () => {
        it('should return "-" for null item', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.getTitle(null)).to.equal('-');
        });

        it('should return card title', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const card = createMockCard('/path/card1', 'My Card Title');
            expect(el.getTitle(card)).to.equal('My Card Title');
        });

        it('should truncate long card title to 54 characters', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const longTitle = 'A'.repeat(60);
            const card = createMockCard('/path/card1', longTitle);
            expect(el.getTitle(card)).to.equal(`${'A'.repeat(54)}...`);
        });

        it('should return "-" for card with no title', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const card = createMockCard('/path/card1', null);
            expect(el.getTitle(card)).to.equal('-');
        });

        it('should return collection title', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const collection = createMockCollection('/path/collection1', 'My Collection');
            expect(el.getTitle(collection)).to.equal('My Collection');
        });

        it('should truncate long collection title to 54 characters', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const longTitle = 'B'.repeat(60);
            const collection = createMockCollection('/path/collection1', longTitle);
            expect(el.getTitle(collection)).to.equal(`${'B'.repeat(54)}...`);
        });

        it('should return "-" for collection with no title', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const collection = createMockCollection('/path/collection1', null);
            expect(el.getTitle(collection)).to.equal('-');
        });

        it('should return placeholder key', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const placeholder = createMockPlaceholder('/path/placeholder1', 'myPlaceholderKey', 'value');
            expect(el.getTitle(placeholder)).to.equal('myPlaceholderKey');
        });

        it('should return "-" for placeholder with no key', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const placeholder = createMockPlaceholder('/path/placeholder1', null, 'value');
            expect(el.getTitle(placeholder)).to.equal('-');
        });
    });

    describe('removeItem method', () => {
        it('should remove card from Store when called with card item', async () => {
            const card = createMockCard('/path/to/remove', 'Card Title');
            setCardsByPaths(new Map([['/path/to/remove', card]]));
            Store.translationProjects.selectedCards.set(['/path/to/remove']);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            el.removeItem(card);
            expect(Store.translationProjects.selectedCards.get()).to.deep.equal([]);
        });

        it('should remove collection from Store when called with collection item', async () => {
            const collection = createMockCollection('/path/collection1', 'Collection Title');
            setCollectionsByPaths(new Map([['/path/collection1', collection]]));
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            el.removeItem(collection);
            expect(Store.translationProjects.selectedCollections.get()).to.deep.equal([]);
        });

        it('should remove placeholder from Store when called with placeholder item', async () => {
            const placeholder = createMockPlaceholder('/path/placeholder1', 'key', 'value');
            setPlaceholdersByPaths(new Map([['/path/placeholder1', placeholder]]));
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            el.removeItem(placeholder);
            expect(Store.translationProjects.selectedPlaceholders.get()).to.deep.equal([]);
        });

        it('should do nothing when called with null', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            el.removeItem(null);
            expect(Store.translationProjects.selectedCards.get()).to.deep.equal(['/path/card1']);
        });
    });

    describe('rendering', () => {
        it('should render selected items list when showSelected is true and items exist', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const list = el.shadowRoot.querySelector('.selected-items');
            expect(list).to.exist;
        });

        it('should render item elements for each selected item', async () => {
            const card1 = createMockCard('/path/card1', 'Card 1');
            const card2 = createMockCard('/path/card2', 'Card 2');
            setCardsByPaths(
                new Map([
                    ['/path/card1', card1],
                    ['/path/card2', card2],
                ]),
            );
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const items = el.shadowRoot.querySelectorAll('.item');
            expect(items.length).to.equal(2);
        });

        it('should render title for each item', async () => {
            const card = createMockCard('/path/card1', 'My Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const title = el.shadowRoot.querySelector('.title');
            expect(title).to.exist;
            expect(title.textContent).to.equal('My Test Card');
        });

        it('should render type for each item', async () => {
            const card = createMockCard('/path/card1', 'Card', '/studio/details/path');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const typeEl = el.shadowRoot.querySelector('.type');
            expect(typeEl).to.exist;
            expect(typeEl.textContent.trim()).to.equal('Default');
        });

        it('should render remove button for each item', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const removeButton = el.shadowRoot.querySelector('.remove-button');
            expect(removeButton).to.exist;
        });

        it('should render close icon in remove button', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const closeIcon = el.shadowRoot.querySelector('sp-icon-close');
            expect(closeIcon).to.exist;
        });

        it('should set correct margin-left when items are visible', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const list = el.shadowRoot.querySelector('.selected-items');
            expect(list.style.marginLeft).to.equal('12px');
        });
    });

    describe('remove button interaction', () => {
        it('should remove item from Store when remove button is clicked', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            Store.fragments.list.loading.set(false);
            Store.placeholders.list.loading.set(false);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const removeButton = el.shadowRoot.querySelector('.remove-button');
            removeButton.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.deep.equal([]);
        });

        it('should remove correct item from Store when multiple items exist', async () => {
            const card1 = createMockCard('/path/card1', 'Card 1');
            const card2 = createMockCard('/path/card2', 'Card 2');
            setCardsByPaths(
                new Map([
                    ['/path/card1', card1],
                    ['/path/card2', card2],
                ]),
            );
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const removeButtons = el.shadowRoot.querySelectorAll('.remove-button');
            removeButtons[1].click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.get()).to.deep.equal(['/path/card1']);
        });

        it('should disable remove button when items are loading', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            Store.fragments.list.loading.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const removeButton = el.shadowRoot.querySelector('.remove-button');
            expect(removeButton.disabled).to.be.true;
        });

        it('should enable remove button when items are not loading', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            Store.fragments.list.loading.set(false);
            Store.placeholders.list.loading.set(false);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const removeButton = el.shadowRoot.querySelector('.remove-button');
            expect(removeButton.disabled).to.be.false;
        });
    });

    describe('reactivity', () => {
        it('should update when showSelected changes', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(false);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.shadowRoot.querySelector('.selected-items')).to.be.null;
            Store.translationProjects.showSelected.set(true);
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.selected-items')).to.exist;
        });

        it('should update when selectedCards changes', async () => {
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.shadowRoot.querySelector('.selected-items')).to.be.null;
            const card = createMockCard('/path/card1', 'Test Card');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.selected-items')).to.exist;
        });

        it('should update when selectedCollections changes', async () => {
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.shadowRoot.querySelector('.selected-items')).to.be.null;
            const collection = createMockCollection('/path/collection1', 'Test Collection');
            setCollectionsByPaths(new Map([['/path/collection1', collection]]));
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.selected-items')).to.exist;
        });

        it('should update when selectedPlaceholders changes', async () => {
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.shadowRoot.querySelector('.selected-items')).to.be.null;
            const placeholder = createMockPlaceholder('/path/placeholder1', 'key', 'value');
            setPlaceholdersByPaths(new Map([['/path/placeholder1', placeholder]]));
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.selected-items')).to.exist;
        });
    });

    describe('mixed item types', () => {
        it('should render cards, collections, and placeholders together', async () => {
            const card = createMockCard('/path/card1', 'Test Card');
            const collection = createMockCollection('/path/collection1', 'Test Collection');
            const placeholder = createMockPlaceholder('/path/placeholder1', 'key', 'value');
            setCardsByPaths(new Map([['/path/card1', card]]));
            setCollectionsByPaths(new Map([['/path/collection1', collection]]));
            setPlaceholdersByPaths(new Map([['/path/placeholder1', placeholder]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const items = el.shadowRoot.querySelectorAll('.item');
            expect(items.length).to.equal(3);
            const titles = el.shadowRoot.querySelectorAll('.title');
            const titleTexts = Array.from(titles).map((t) => t.textContent);
            expect(titleTexts).to.include('Test Card');
            expect(titleTexts).to.include('Test Collection');
            expect(titleTexts).to.include('key');
        });
    });

    describe('edge cases', () => {
        it('should handle empty title gracefully', async () => {
            const card = createMockCard('/path/card1', '');
            setCardsByPaths(new Map([['/path/card1', card]]));
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const title = el.shadowRoot.querySelector('.title');
            expect(title.textContent).to.equal('-');
        });

        it('should handle title exactly 54 characters', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            const exactTitle = 'A'.repeat(54);
            const card = createMockCard('/path/card1', exactTitle);
            expect(el.getTitle(card)).to.equal(exactTitle);
        });

        it('should handle undefined item gracefully in getTitle', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.getTitle(undefined)).to.equal('-');
        });

        it('should handle undefined item gracefully in getType', async () => {
            const el = await fixture(html`<mas-selected-items></mas-selected-items>`);
            expect(el.getType(undefined)).to.equal('Unknown');
        });
    });
});
