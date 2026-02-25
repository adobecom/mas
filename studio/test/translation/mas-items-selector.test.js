import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { TABLE_TYPE } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/translation/mas-items-selector.js';
import { TABS } from '../../src/translation/mas-items-selector.js';

describe('MasItemsSelector', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.translationProjects.inEdit.set(null);
        Store.translationProjects.showSelected.set(false);
        Store.translationProjects.selectedCards.set([]);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.translationProjects.inEdit.set(null);
        Store.translationProjects.showSelected.set(false);
        Store.translationProjects.selectedCards.set([]);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);
    });

    describe('TABS constant', () => {
        it('should export TABS with correct values', () => {
            expect(TABS).to.be.an('array');
            expect(TABS).to.have.lengthOf(3);
        });

        it('should have cards tab', () => {
            const cardsTab = TABS.find((tab) => tab.value === TABLE_TYPE.CARDS);
            expect(cardsTab).to.exist;
            expect(cardsTab.label).to.equal('Fragments');
        });

        it('should have collections tab', () => {
            const collectionsTab = TABS.find((tab) => tab.value === TABLE_TYPE.COLLECTIONS);
            expect(collectionsTab).to.exist;
            expect(collectionsTab.label).to.equal('Collections');
        });

        it('should have placeholders tab', () => {
            const placeholdersTab = TABS.find((tab) => tab.value === TABLE_TYPE.PLACEHOLDERS);
            expect(placeholdersTab).to.exist;
            expect(placeholdersTab.label).to.equal('Placeholders');
        });
    });

    describe('initialization', () => {
        it('should initialize with default values', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.itemToRemove).to.be.null;
            expect(el.viewOnly).to.be.false;
        });

        it('should initialize storeController on connectedCallback', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.storeController).to.exist;
        });

        it('should accept viewOnly property', async () => {
            const el = await fixture(html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`);
            expect(el.viewOnly).to.be.true;
        });
    });

    describe('showSelected getter', () => {
        it('should return false when store value is false', async () => {
            Store.translationProjects.showSelected.set(false);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.showSelected).to.be.false;
        });

        it('should return true when store value is true', async () => {
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.showSelected).to.be.true;
        });
    });

    describe('selectedCount getter', () => {
        it('should return 0 when no items are selected', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.selectedCount).to.equal(0);
        });

        it('should return count of selected cards', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.selectedCount).to.equal(2);
        });

        it('should return count of selected collections', async () => {
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.selectedCount).to.equal(1);
        });

        it('should return count of selected placeholders', async () => {
            Store.translationProjects.selectedPlaceholders.set([
                '/path/placeholder1',
                '/path/placeholder2',
                '/path/placeholder3',
            ]);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.selectedCount).to.equal(3);
        });

        it('should return combined count of all selected items', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.selectedCount).to.equal(4);
        });
    });

    describe('rendering', () => {
        it('should render sp-tabs component', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const tabs = el.shadowRoot.querySelector('sp-tabs');
            expect(tabs).to.exist;
            expect(tabs.getAttribute('quiet')).to.not.be.null;
            expect(tabs.getAttribute('selected')).to.equal('cards');
        });

        it('should render three tabs', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const tabElements = el.shadowRoot.querySelectorAll('sp-tab');
            expect(tabElements.length).to.equal(3);
        });

        it('should render tab for cards with correct value', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const cardsTab = el.shadowRoot.querySelector('sp-tab[value="cards"]');
            expect(cardsTab).to.exist;
        });

        it('should render tab for collections with correct value', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const collectionsTab = el.shadowRoot.querySelector('sp-tab[value="collections"]');
            expect(collectionsTab).to.exist;
        });

        it('should render tab for placeholders with correct value', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const placeholdersTab = el.shadowRoot.querySelector('sp-tab[value="placeholders"]');
            expect(placeholdersTab).to.exist;
        });

        it('should render three tab panels', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const tabPanels = el.shadowRoot.querySelectorAll('sp-tab-panel');
            expect(tabPanels.length).to.equal(3);
        });

        it('should render mas-search-and-filters in each tab panel when not viewOnly', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const searchFilters = el.shadowRoot.querySelectorAll('mas-search-and-filters');
            expect(searchFilters.length).to.equal(3);
        });

        it('should render mas-select-items-table in each tab panel', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const tables = el.shadowRoot.querySelectorAll('mas-select-items-table');
            expect(tables.length).to.equal(3);
        });

        it('should render mas-selected-items in each tab panel when not viewOnly', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const selectedItems = el.shadowRoot.querySelectorAll('mas-selected-items');
            expect(selectedItems.length).to.equal(3);
        });

        it('should render sp-toast in each tab panel', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const toasts = el.shadowRoot.querySelectorAll('sp-toast');
            expect(toasts.length).to.equal(3);
        });

        it('should render selected items count button when not viewOnly', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const countButton = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(countButton).to.exist;
        });

        it('should display correct selected count in button', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const countButton = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(countButton.textContent).to.include('(2)');
        });
    });

    describe('viewOnly mode', () => {
        it('should not render mas-search-and-filters when viewOnly is true', async () => {
            const el = await fixture(html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`);
            const searchFilters = el.shadowRoot.querySelectorAll('mas-search-and-filters');
            expect(searchFilters.length).to.equal(0);
        });

        it('should not render mas-selected-items when viewOnly is true', async () => {
            const el = await fixture(html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`);
            const selectedItems = el.shadowRoot.querySelectorAll('mas-selected-items');
            expect(selectedItems.length).to.equal(0);
        });

        it('should not render selected items count button when viewOnly is true', async () => {
            const el = await fixture(html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`);
            const countButton = el.shadowRoot.querySelector('.selected-items-count');
            expect(countButton).to.be.null;
        });

        it('should add view-only class to tab panels when viewOnly is true', async () => {
            const el = await fixture(html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`);
            const viewOnlyPanels = el.shadowRoot.querySelectorAll('sp-tab-panel.view-only');
            expect(viewOnlyPanels.length).to.equal(3);
        });

        it('should add view-only class to container when viewOnly is true', async () => {
            const el = await fixture(html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`);
            const viewOnlyContainers = el.shadowRoot.querySelectorAll('.container.view-only');
            expect(viewOnlyContainers.length).to.equal(3);
        });

        it('should pass viewOnly to mas-select-items-table', async () => {
            const el = await fixture(html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`);
            const tables = el.shadowRoot.querySelectorAll('mas-select-items-table');
            tables.forEach((table) => {
                expect(table.viewOnly).to.be.true;
            });
        });

        it('should show item counts in tab labels when viewOnly is true', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            Store.translationProjects.selectedPlaceholders.set([
                '/path/placeholder1',
                '/path/placeholder2',
                '/path/placeholder3',
            ]);
            const el = await fixture(html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`);
            const cardsTab = el.shadowRoot.querySelector('sp-tab[value="cards"]');
            const collectionsTab = el.shadowRoot.querySelector('sp-tab[value="collections"]');
            const placeholdersTab = el.shadowRoot.querySelector('sp-tab[value="placeholders"]');
            expect(cardsTab.textContent).to.include('(2)');
            expect(collectionsTab.textContent).to.include('(1)');
            expect(placeholdersTab.textContent).to.include('(3)');
        });
    });

    describe('toggle show selected', () => {
        it('should have button disabled when no items selected', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.disabled).to.be.true;
        });

        it('should have button enabled when items are selected', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.disabled).to.be.false;
        });

        it('should toggle showSelected state when button is clicked', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(false);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            button.click();
            await el.updateComplete;
            expect(Store.translationProjects.showSelected.get()).to.be.true;
        });

        it('should toggle showSelected back to false on second click', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            button.click();
            await el.updateComplete;
            expect(Store.translationProjects.showSelected.get()).to.be.false;
        });

        it('should display "Hide selection" text when showSelected is true and items exist', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.textContent).to.include('Hide selection');
        });

        it('should display "Selected items" text when showSelected is false', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(false);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.textContent).to.include('Selected items');
        });

        it('should add flipped class to icon when showSelected is true and items exist', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(true);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const icon = el.shadowRoot.querySelector('sp-icon-export');
            expect(icon.classList.contains('flipped')).to.be.true;
        });

        it('should not have flipped class on icon when showSelected is false', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(false);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const icon = el.shadowRoot.querySelector('sp-icon-export');
            expect(icon.classList.contains('flipped')).to.be.false;
        });
    });

    describe('remove event handling', () => {
        it('should update itemToRemove when remove event is received', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const selectedItemsElement = el.shadowRoot.querySelector('mas-selected-items');
            selectedItemsElement.dispatchEvent(
                new CustomEvent('remove', {
                    detail: { path: '/path/to/remove' },
                    bubbles: true,
                    composed: true,
                }),
            );
            await el.updateComplete;
            expect(el.itemToRemove).to.equal('/path/to/remove');
        });

        it('should pass itemToRemove to mas-select-items-table', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            el.itemToRemove = '/path/to/remove';
            await el.updateComplete;
            const tables = el.shadowRoot.querySelectorAll('mas-select-items-table');
            tables.forEach((table) => {
                expect(table.itemToRemove).to.equal('/path/to/remove');
            });
        });
    });

    describe('toast notifications', () => {
        it('should show toast when show-toast event is dispatched', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const table = el.shadowRoot.querySelector('mas-select-items-table');
            table.dispatchEvent(
                new CustomEvent('show-toast', {
                    detail: { text: 'Test message', variant: 'positive' },
                    bubbles: true,
                    composed: true,
                }),
            );
            await el.updateComplete;
            const toast = el.shadowRoot.querySelector('sp-toast');
            expect(toast.textContent).to.equal('Test message');
            expect(toast.variant).to.equal('positive');
            expect(toast.open).to.be.true;
        });

        it('should set toast timeout to 6000ms', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const toast = el.shadowRoot.querySelector('sp-toast');
            expect(toast.getAttribute('timeout')).to.equal('6000');
        });

        it('should stop propagation on toast close event', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const toast = el.shadowRoot.querySelector('sp-toast');
            let propagated = false;
            el.addEventListener('close', () => {
                propagated = true;
            });
            toast.dispatchEvent(new CustomEvent('close', { bubbles: true }));
            expect(propagated).to.be.false;
        });
    });

    describe('search and filters configuration', () => {
        it('should set searchOnly to true for placeholders tab', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const searchFilters = el.shadowRoot.querySelectorAll('mas-search-and-filters');
            const placeholdersFilter = Array.from(searchFilters).find((sf) => sf.type === TABLE_TYPE.PLACEHOLDERS);
            expect(placeholdersFilter.searchOnly).to.be.true;
        });

        it('should set searchOnly to true for collections tab', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const searchFilters = el.shadowRoot.querySelectorAll('mas-search-and-filters');
            const collectionsFilter = Array.from(searchFilters).find((sf) => sf.type === TABLE_TYPE.COLLECTIONS);
            expect(collectionsFilter.searchOnly).to.be.true;
        });

        it('should set searchOnly to false for cards tab', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const searchFilters = el.shadowRoot.querySelectorAll('mas-search-and-filters');
            const cardsFilter = Array.from(searchFilters).find((sf) => sf.type === TABLE_TYPE.CARDS);
            expect(cardsFilter.searchOnly).to.be.false;
        });

        it('should pass correct type to mas-search-and-filters', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const searchFilters = el.shadowRoot.querySelectorAll('mas-search-and-filters');
            const types = Array.from(searchFilters).map((sf) => sf.type);
            expect(types).to.include(TABLE_TYPE.CARDS);
            expect(types).to.include(TABLE_TYPE.COLLECTIONS);
            expect(types).to.include(TABLE_TYPE.PLACEHOLDERS);
        });
    });

    describe('table configuration', () => {
        it('should pass correct type to mas-select-items-table', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const tables = el.shadowRoot.querySelectorAll('mas-select-items-table');
            const types = Array.from(tables).map((t) => t.type);
            expect(types).to.include(TABLE_TYPE.CARDS);
            expect(types).to.include(TABLE_TYPE.COLLECTIONS);
            expect(types).to.include(TABLE_TYPE.PLACEHOLDERS);
        });
    });

    describe('reactivity', () => {
        it('should update when showSelected store changes', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(false);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            let button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.textContent).to.include('Selected items');
            Store.translationProjects.showSelected.set(true);
            await el.updateComplete;
            button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.textContent).to.include('Hide selection');
        });

        it('should update count when selectedCards changes', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            let button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.textContent).to.include('(0)');
            Store.translationProjects.selectedCards.set(['/path/card1', '/path/card2']);
            await el.updateComplete;
            button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.textContent).to.include('(2)');
        });

        it('should update count when selectedCollections changes', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            Store.translationProjects.selectedCollections.set(['/path/collection1']);
            await el.updateComplete;
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.textContent).to.include('(1)');
        });

        it('should update count when selectedPlaceholders changes', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            Store.translationProjects.selectedPlaceholders.set(['/path/placeholder1']);
            await el.updateComplete;
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.textContent).to.include('(1)');
        });
    });

    describe('edge cases', () => {
        it('should handle empty selections gracefully', async () => {
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.selectedCount).to.equal(0);
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.disabled).to.be.true;
        });

        it('should handle large number of selections', async () => {
            const manyPaths = Array.from({ length: 100 }, (_, i) => `/path/card${i}`);
            Store.translationProjects.selectedCards.set(manyPaths);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.selectedCount).to.equal(100);
            const button = el.shadowRoot.querySelector('.selected-items-count sp-button');
            expect(button.textContent).to.include('(100)');
        });

        it('should handle switching between viewOnly modes', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            expect(el.shadowRoot.querySelectorAll('mas-search-and-filters').length).to.equal(3);
            el.viewOnly = true;
            await el.updateComplete;
            expect(el.shadowRoot.querySelectorAll('mas-search-and-filters').length).to.equal(0);
            el.viewOnly = false;
            await el.updateComplete;
            expect(el.shadowRoot.querySelectorAll('mas-search-and-filters').length).to.equal(3);
        });
    });
});
