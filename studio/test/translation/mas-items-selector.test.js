import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { stubAemTagQueryFetch } from '../helpers/aem-tag-fetch.js';
import { resetTagCache } from '../helpers/tag-cache.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, FRAGMENT_STATUS, TABLE_TYPE } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/common/components/mas-items-selector.js';
import { TABS } from '../../src/common/components/mas-items-selector.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';

describe('MasItemsSelector', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        stubAemTagQueryFetch(sandbox);
        setItemsSelectionStore(Store.translationProjects);
        resetTagCache(MAS_TAG_NAMESPACE);
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
        setItemsSelectionStore(null);
        resetTagCache(MAS_TAG_NAMESPACE);
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
            const icon = el.shadowRoot.querySelector('.selected-items-count sp-icon');
            expect(icon.classList.contains('flipped')).to.be.true;
        });

        it('should not have flipped class on icon when showSelected is false', async () => {
            Store.translationProjects.selectedCards.set(['/path/card1']);
            Store.translationProjects.showSelected.set(false);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const icon = el.shadowRoot.querySelector('.selected-items-count sp-icon');
            expect(icon.classList.contains('flipped')).to.be.false;
        });
    });

    describe('mas-selected-items integration', () => {
        it('should render mas-selected-items when not viewOnly', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            const selectedItems = el.shadowRoot.querySelector('mas-selected-items');
            expect(selectedItems).to.exist;
        });

        it('should not render mas-selected-items when viewOnly', async () => {
            const el = await fixture(html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`);
            const selectedItems = el.shadowRoot.querySelector('mas-selected-items');
            expect(selectedItems).to.be.null;
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

    describe('URL paste handling', () => {
        let mockRepository;
        let originalQuerySelector;

        const COPY_CODE_URL = (uuid) =>
            `https://mas.adobe.com/studio.html#content-type=merch-card&page=content&path=sandbox&query=${uuid}`;

        const mockCard = (path, uuid) => ({
            id: uuid,
            path,
            title: 'Test Card',
            model: { path: CARD_MODEL_PATH },
            status: FRAGMENT_STATUS.PUBLISHED,
            tags: [],
            fields: [],
            offerData: null,
        });

        beforeEach(() => {
            originalQuerySelector = document.querySelector.bind(document);
            mockRepository = {
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub(),
                            },
                        },
                    },
                },
                searchFragments: sandbox.stub().resolves({ items: [] }),
                loadPlaceholders: sandbox.stub().resolves([]),
                loadAllCollections: sandbox.stub().resolves([]),
            };
            sandbox.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
        });

        const importViaUrl = async (el, value) => {
            const btn = el.shadowRoot.querySelector('sp-button.import-url-btn');
            btn.click();
            await el.updateComplete;
            const textarea = el.shadowRoot.querySelector('textarea.import-url-input');
            const dt = new DataTransfer();
            dt.setData('text/plain', value);
            textarea.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: dt }));
            await new Promise((resolve) => setTimeout(resolve, 0));
            await el.updateComplete;
        };

        const getToast = (el) => el.shadowRoot.querySelector('.import-url-view sp-toast');

        it('shows a positive toast when a copy-code URL is pasted and fragment is found', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            const toast = getToast(el);
            expect(toast.open).to.be.true;
            expect(toast.variant).to.equal('positive');
            expect(toast.textContent).to.match(/fragment added/i);
        });

        it('adds the fragment path to selectedCards when a copy-code URL is pasted', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            expect(Store.translationProjects.selectedCards.get()).to.include(card.path);
        });

        it('shows URL item with valid status after fragment is added', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            expect(el.importedUrls).to.have.length(1);
            expect(el.importedUrls[0].status).to.equal('valid');
        });

        it('shows a negative toast when a copy-code URL is pasted but fragment is not found', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            mockRepository.aem.sites.cf.fragments.getById.rejects(
                Object.assign(new Error('Not found'), { response: { status: 404 } }),
            );

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            const toast = getToast(el);
            expect(toast.open).to.be.true;
            expect(toast.variant).to.equal('negative');
        });

        it('shows a "Fragment not found." message when a fragment is not found', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            mockRepository.aem.sites.cf.fragments.getById.rejects(
                Object.assign(new Error('Not found'), { response: { status: 404 } }),
            );

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            const status = el.shadowRoot.querySelector('.import-item-status.status-error');
            expect(status.textContent).to.match(/Fragment not found\./);
        });

        it('shows a warning suggesting to cancel or proceed with valid items only when some items are invalid', async () => {
            const validUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const invalidUuid = '11111111-2222-3333-4444-555555555555';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', validUuid);
            mockRepository.aem.sites.cf.fragments.getById
                .withArgs(validUuid)
                .resolves(card)
                .withArgs(invalidUuid)
                .rejects(Object.assign(new Error('Not found'), { response: { status: 404 } }));

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, `${COPY_CODE_URL(validUuid)} ${COPY_CODE_URL(invalidUuid)}`);

            const warning = el.shadowRoot.querySelector('.import-invalid-warning');
            expect(warning).to.exist;
            expect(warning.textContent).to.match(/1.*invalid/i);
            expect(warning.textContent).to.match(/cancel/i);
            expect(warning.textContent).to.match(/valid/i);
        });

        it('does not show the invalid-items warning when every pasted item is valid', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            expect(el.shadowRoot.querySelector('.import-invalid-warning')).to.not.exist;
        });

        it('adds all fragments when multiple copy-code URLs are pasted (space-separated)', async () => {
            const uuid1 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const uuid2 = '11111111-2222-3333-4444-555555555555';
            const card1 = mockCard('/content/dam/mas/sandbox/en_US/card-1', uuid1);
            const card2 = mockCard('/content/dam/mas/sandbox/en_US/card-2', uuid2);
            mockRepository.aem.sites.cf.fragments.getById.withArgs(uuid1).resolves(card1).withArgs(uuid2).resolves(card2);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, `${COPY_CODE_URL(uuid1)} ${COPY_CODE_URL(uuid2)}`);

            const selected = Store.translationProjects.selectedCards.get();
            expect(selected).to.include(card1.path);
            expect(selected).to.include(card2.path);
        });

        it('shows a summary toast with count when multiple URLs are pasted', async () => {
            const uuid1 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const uuid2 = '11111111-2222-3333-4444-555555555555';
            const card1 = mockCard('/content/dam/mas/sandbox/en_US/card-1', uuid1);
            const card2 = mockCard('/content/dam/mas/sandbox/en_US/card-2', uuid2);
            mockRepository.aem.sites.cf.fragments.getById.withArgs(uuid1).resolves(card1).withArgs(uuid2).resolves(card2);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, `${COPY_CODE_URL(uuid1)} ${COPY_CODE_URL(uuid2)}`);

            const toast = getToast(el);
            expect(toast.open).to.be.true;
            expect(toast.variant).to.equal('positive');
            expect(toast.textContent).to.match(/2.*fragment/i);
        });

        it('marks the item invalid and does not select it when the fragment surface does not match the project surface', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/nala/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector restrict-import-surface="sandbox"></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            expect(el.importedUrls[0].status).to.equal('error');
            expect(Store.translationProjects.selectedCards.get()).to.not.include(card.path);

            const status = el.shadowRoot.querySelector('.import-item-status.status-error');
            expect(status.textContent).to.match(/Nala not allowed here\./);

            const link = el.shadowRoot.querySelector('.import-item-row a');
            expect(el.importedUrls[0].path).to.equal(card.path);
            expect(link.textContent.trim()).to.not.equal(COPY_CODE_URL(uuid));
        });

        it('allows a fragment whose surface matches the project surface', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector restrict-import-surface="sandbox"></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            expect(el.importedUrls[0].status).to.equal('valid');
            expect(Store.translationProjects.selectedCards.get()).to.include(card.path);
        });

        it('adds a collection when a merch-card-collection URL is pasted', async () => {
            const uuid = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
            const collection = {
                id: uuid,
                path: '/content/dam/mas/sandbox/en_US/test-collection',
                title: 'Test Collection',
                model: { path: COLLECTION_MODEL_PATH },
                status: FRAGMENT_STATUS.PUBLISHED,
                tags: [],
                fields: [],
            };
            mockRepository.aem.sites.cf.fragments.getById.resolves(collection);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(
                el,
                `https://mas.adobe.com/studio.html#content-type=merch-card-collection&page=content&path=sandbox&query=${uuid}`,
            );

            expect(Store.translationProjects.selectedCollections.get()).to.include(collection.path);
        });

        it('adds a compare chart when a mas-compare-chart URL is pasted', async () => {
            const uuid = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
            const compareChart = {
                id: uuid,
                path: '/content/dam/mas/sandbox/en_US/test-compare-chart',
                title: 'Test Compare Chart',
                model: { path: COLLECTION_MODEL_PATH },
                status: FRAGMENT_STATUS.PUBLISHED,
                tags: [],
                fields: [],
            };
            mockRepository.aem.sites.cf.fragments.getById.resolves(compareChart);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(
                el,
                `https://mas.adobe.com/studio.html#content-type=mas-compare-chart&page=content&path=sandbox&query=${uuid}`,
            );

            expect(Store.translationProjects.selectedCollections.get()).to.include(compareChart.path);
        });

        it('routes mixed URLs: cards to selectedCards and collections to selectedCollections', async () => {
            const cardUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const collectionUuid = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
            const card = mockCard('/content/dam/mas/sandbox/en_US/card-1', cardUuid);
            const collection = {
                id: collectionUuid,
                path: '/content/dam/mas/sandbox/en_US/collection-1',
                title: 'Test Collection',
                model: { path: COLLECTION_MODEL_PATH },
                status: FRAGMENT_STATUS.PUBLISHED,
                tags: [],
                fields: [],
            };
            mockRepository.aem.sites.cf.fragments.getById
                .withArgs(cardUuid)
                .resolves(card)
                .withArgs(collectionUuid)
                .resolves(collection);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(
                el,
                `${COPY_CODE_URL(cardUuid)} https://mas.adobe.com/studio.html#content-type=merch-card-collection&page=content&path=sandbox&query=${collectionUuid}`,
            );

            expect(Store.translationProjects.selectedCards.get()).to.include(card.path);
            expect(Store.translationProjects.selectedCollections.get()).to.include(collection.path);
        });

        it('imports fragments when Import via URL is opened from the Collections tab', async () => {
            const uuid = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
            const collection = {
                id: uuid,
                path: '/content/dam/mas/sandbox/en_US/test-collection',
                title: 'Test Collection',
                model: { path: COLLECTION_MODEL_PATH },
                status: FRAGMENT_STATUS.PUBLISHED,
                tags: [],
                fields: [],
            };
            mockRepository.aem.sites.cf.fragments.getById.resolves(collection);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            el.shadowRoot.querySelector('sp-tab[value="collections"]').click();
            await el.updateComplete;

            await importViaUrl(
                el,
                `https://mas.adobe.com/studio.html#content-type=merch-card-collection&page=content&path=sandbox&query=${uuid}`,
            );

            expect(Store.translationProjects.selectedCollections.get()).to.include(collection.path);
        });

        it('shows toast in the import panel when a collection URL is added', async () => {
            const uuid = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
            const collection = {
                id: uuid,
                path: '/content/dam/mas/sandbox/en_US/test-collection',
                title: 'Test Collection',
                model: { path: COLLECTION_MODEL_PATH },
                status: FRAGMENT_STATUS.PUBLISHED,
                tags: [],
                fields: [],
            };
            mockRepository.aem.sites.cf.fragments.getById.resolves(collection);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(
                el,
                `https://mas.adobe.com/studio.html#content-type=merch-card-collection&page=content&path=sandbox&query=${uuid}`,
            );

            const toast = getToast(el);
            expect(toast.open).to.be.true;
            expect(toast.variant).to.equal('positive');
        });

        it('shows a combined negative toast when some URLs succeed and some fail', async () => {
            const goodUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const badUuid = '11111111-2222-3333-4444-555555555555';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', goodUuid);
            mockRepository.aem.sites.cf.fragments.getById
                .withArgs(goodUuid)
                .resolves(card)
                .withArgs(badUuid)
                .rejects(Object.assign(new Error('Not found'), { response: { status: 404 } }));

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, `${COPY_CODE_URL(goodUuid)} ${COPY_CODE_URL(badUuid)}`);

            const toast = getToast(el);
            expect(toast.open).to.be.true;
            expect(toast.variant).to.equal('negative');
            expect(toast.textContent).to.match(/1 added/i);
            expect(toast.textContent).to.match(/1 not found/i);
        });

        it('shows a negative toast when all pasted URLs are filtered by allowedTypes', async () => {
            const uuid = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
            const el = await fixture(html`<mas-items-selector .allowedTypes=${[TABLE_TYPE.CARDS]}></mas-items-selector>`);
            await importViaUrl(
                el,
                `https://mas.adobe.com/studio.html#content-type=merch-card-collection&page=content&path=sandbox&query=${uuid}`,
            );

            const toast = getToast(el);
            expect(toast.open).to.be.true;
            expect(toast.variant).to.equal('negative');
        });

        it('does not add a duplicate URL that was already imported', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            const textarea = el.shadowRoot.querySelector('textarea.import-url-input');
            const dt = new DataTransfer();
            dt.setData('text/plain', COPY_CODE_URL(uuid));
            textarea.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: dt }));
            await new Promise((resolve) => setTimeout(resolve, 0));
            await el.updateComplete;

            expect(el.importedUrls).to.have.length(1);
            expect(Store.translationProjects.selectedCards.get()).to.have.length(1);
        });

        it('shows an "Already added" toast when pasting a URL that was already imported', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));
            await importViaUrl(el, COPY_CODE_URL(uuid));

            const toast = getToast(el);
            expect(toast.open).to.be.true;
            expect(toast.textContent).to.match(/already added/i);
        });

        it('shows a "Type not allowed here." message and the formatted path when the content type is filtered by allowedTypes', async () => {
            const uuid = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
            const collection = {
                id: uuid,
                path: '/content/dam/mas/sandbox/en_US/test-collection',
                title: 'Test Collection',
                model: { path: COLLECTION_MODEL_PATH },
                status: FRAGMENT_STATUS.PUBLISHED,
                tags: [],
                fields: [],
            };
            mockRepository.aem.sites.cf.fragments.getById.resolves(collection);

            const el = await fixture(html`<mas-items-selector .allowedTypes=${[TABLE_TYPE.CARDS]}></mas-items-selector>`);
            const url = `https://mas.adobe.com/studio.html#content-type=merch-card-collection&page=content&path=sandbox&query=${uuid}`;
            await importViaUrl(el, url);

            const status = el.shadowRoot.querySelector('.import-item-status.status-error');
            expect(status.textContent).to.match(/Type not allowed here\./);

            const link = el.shadowRoot.querySelector('.import-item-row a');
            expect(link.textContent.trim()).to.not.equal(url);
            expect(el.importedUrls[0].path).to.equal(collection.path);
        });

        it('shows an "Unsupported fragment type." message when the fetched fragment model does not match', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            mockRepository.aem.sites.cf.fragments.getById.resolves({
                id: uuid,
                path: '/content/dam/mas/sandbox/en_US/test-card',
                title: 'Test Card',
                model: { path: '/some/other/model' },
                status: FRAGMENT_STATUS.PUBLISHED,
                tags: [],
                fields: [],
            });

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            const status = el.shadowRoot.querySelector('.import-item-status.status-error');
            expect(status.textContent).to.match(/Unsupported fragment type\./);

            const link = el.shadowRoot.querySelector('.import-item-row a');
            expect(el.importedUrls[0].path).to.equal('/content/dam/mas/sandbox/en_US/test-card');
            expect(link.textContent.trim()).to.not.equal(COPY_CODE_URL(uuid));
        });

        it('only marks the first maxSelectedCards fragments valid and flags the rest with a limit message', async () => {
            const uuids = [
                'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                '11111111-2222-3333-4444-555555555555',
                '22222222-3333-4444-5555-666666666666',
                '33333333-4444-5555-6666-777777777777',
                '44444444-5555-6666-7777-888888888888',
            ];
            const cardsById = Object.fromEntries(
                uuids.map((uuid, i) => [uuid, mockCard(`/content/dam/mas/sandbox/en_US/card-${i}`, uuid)]),
            );
            mockRepository.aem.sites.cf.fragments.getById.callsFake((id) => Promise.resolve(cardsById[id]));

            const el = await fixture(html`<mas-items-selector .maxSelectedCards=${4}></mas-items-selector>`);
            await importViaUrl(el, uuids.map(COPY_CODE_URL).join(' '));

            const statuses = el.importedUrls.map((i) => i.status);
            expect(statuses.filter((s) => s === 'valid')).to.have.length(4);
            expect(statuses.filter((s) => s === 'error')).to.have.length(1);
            expect(Store.translationProjects.selectedCards.get()).to.have.length(4);

            const rejected = el.importedUrls[4];
            expect(rejected.status).to.equal('error');
            expect(rejected.errorMessage).to.match(/4/);
            expect(rejected.path).to.equal(cardsById[uuids[4]].path);
        });

        it('does not reject fragments when the selection is already below maxSelectedCards from a previous batch', async () => {
            const first = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const second = '11111111-2222-3333-4444-555555555555';
            mockRepository.aem.sites.cf.fragments.getById
                .withArgs(first)
                .resolves(mockCard('/content/dam/mas/sandbox/en_US/card-0', first))
                .withArgs(second)
                .resolves(mockCard('/content/dam/mas/sandbox/en_US/card-1', second));

            const el = await fixture(html`<mas-items-selector .maxSelectedCards=${4}></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(first));
            await importViaUrl(el, COPY_CODE_URL(second));

            expect(el.importedUrls.map((i) => i.status)).to.deep.equal(['valid', 'valid']);
            expect(Store.translationProjects.selectedCards.get()).to.have.length(2);
        });

        it('shows URL item with error status when fragment is not found', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            mockRepository.aem.sites.cf.fragments.getById.rejects(
                Object.assign(new Error('Not found'), { response: { status: 404 } }),
            );

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            expect(el.importedUrls).to.have.length(1);
            expect(el.importedUrls[0].status).to.equal('error');
        });

        it('adds fragment to store when Enter key is pressed in the textarea', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            el.shadowRoot.querySelector('sp-button.import-url-btn').click();
            await el.updateComplete;

            const textarea = el.shadowRoot.querySelector('textarea.import-url-input');
            textarea.value = COPY_CODE_URL(uuid);
            textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await new Promise((resolve) => setTimeout(resolve, 0));
            await el.updateComplete;

            expect(Store.translationProjects.selectedCards.get()).to.include(card.path);
        });

        it('removes a URL item and deselects its fragment when the remove button is clicked', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            expect(el.importedUrls).to.have.length(1);
            expect(Store.translationProjects.selectedCards.get()).to.include(card.path);

            const removeBtn = el.shadowRoot.querySelector('.import-item-row sp-action-button');
            removeBtn.click();
            await el.updateComplete;

            expect(el.importedUrls).to.have.length(0);
            expect(Store.translationProjects.selectedCards.get()).to.not.include(card.path);
        });

        it('shows the fragment path in the URL list row instead of the raw MAS URL', async () => {
            const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
            mockRepository.aem.sites.cf.fragments.getById.resolves(card);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, COPY_CODE_URL(uuid));

            const link = el.shadowRoot.querySelector('.import-item-row a');
            expect(link).to.exist;
            expect(el.importedUrls[0].path).to.equal(card.path);
            expect(link.textContent.trim()).to.not.equal(COPY_CODE_URL(uuid));
        });

        it('shows the count of imported URLs in the footer row', async () => {
            const uuid1 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const uuid2 = '11111111-2222-3333-4444-555555555555';
            const card1 = mockCard('/content/dam/mas/sandbox/en_US/card-1', uuid1);
            const card2 = mockCard('/content/dam/mas/sandbox/en_US/card-2', uuid2);
            mockRepository.aem.sites.cf.fragments.getById.withArgs(uuid1).resolves(card1).withArgs(uuid2).resolves(card2);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, `${COPY_CODE_URL(uuid1)} ${COPY_CODE_URL(uuid2)}`);

            const footerCount = el.shadowRoot.querySelector('.import-footer-row .footer-count');
            expect(footerCount).to.exist;
            expect(footerCount.textContent.trim()).to.include('2');
        });

        it('removes all imported URLs and deselects their fragments when Remove All is clicked', async () => {
            const uuid1 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
            const uuid2 = '11111111-2222-3333-4444-555555555555';
            const card1 = mockCard('/content/dam/mas/sandbox/en_US/card-1', uuid1);
            const card2 = mockCard('/content/dam/mas/sandbox/en_US/card-2', uuid2);
            mockRepository.aem.sites.cf.fragments.getById.withArgs(uuid1).resolves(card1).withArgs(uuid2).resolves(card2);

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(el, `${COPY_CODE_URL(uuid1)} ${COPY_CODE_URL(uuid2)}`);

            expect(el.importedUrls).to.have.length(2);

            const removeAllBtn = el.shadowRoot.querySelector('.import-footer-row sp-action-button');
            removeAllBtn.click();
            await el.updateComplete;

            expect(el.importedUrls).to.have.length(0);
            expect(Store.translationProjects.selectedCards.get()).to.not.include(card1.path);
            expect(Store.translationProjects.selectedCards.get()).to.not.include(card2.path);
        });

        it('removes all imported collection URLs and clears selectedCollections when Remove All is clicked', async () => {
            const uuid1 = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
            const uuid2 = 'dddddddd-eeee-ffff-0000-bbbbbbbbbbbb';
            const makeCollection = (path, id) => ({
                id,
                path,
                title: 'Test Collection',
                model: { path: COLLECTION_MODEL_PATH },
                status: FRAGMENT_STATUS.PUBLISHED,
                tags: [],
                fields: [],
            });
            mockRepository.aem.sites.cf.fragments.getById
                .withArgs(uuid1)
                .resolves(makeCollection('/content/dam/mas/sandbox/en_US/col-1', uuid1))
                .withArgs(uuid2)
                .resolves(makeCollection('/content/dam/mas/sandbox/en_US/col-2', uuid2));

            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await importViaUrl(
                el,
                `https://mas.adobe.com/studio.html#content-type=merch-card-collection&page=content&path=sandbox&query=${uuid1} https://mas.adobe.com/studio.html#content-type=merch-card-collection&page=content&path=sandbox&query=${uuid2}`,
            );

            expect(el.importedUrls).to.have.length(2);
            expect(Store.translationProjects.selectedCollections.get()).to.have.length(2);

            const removeAllBtn = el.shadowRoot.querySelector('.import-footer-row sp-action-button');
            removeAllBtn.click();
            await el.updateComplete;

            expect(el.importedUrls).to.have.length(0);
            expect(Store.translationProjects.selectedCollections.get()).to.have.length(0);
        });

        it('ignores collection URLs when allowedTypes restricts to cards only', async () => {
            const uuid = 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa';
            mockRepository.aem.sites.cf.fragments.getById.resolves({
                id: uuid,
                path: '/content/dam/mas/sandbox/en_US/test-collection',
                title: 'Test Collection',
                model: { path: COLLECTION_MODEL_PATH },
                status: FRAGMENT_STATUS.PUBLISHED,
                tags: [],
                fields: [],
            });

            const el = await fixture(html`<mas-items-selector .allowedTypes=${[TABLE_TYPE.CARDS]}></mas-items-selector>`);
            await importViaUrl(
                el,
                `https://mas.adobe.com/studio.html#content-type=merch-card-collection&page=content&path=sandbox&query=${uuid}`,
            );

            expect(Store.translationProjects.selectedCollections.get()).to.have.length(0);
            expect(mockRepository.aem.sites.cf.fragments.getById.called).to.be.true;
        });
    });

    describe('import mode tab-switch', () => {
        it('clears importedUrls and exits import mode when a tab is clicked while in import mode', async () => {
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            el.shadowRoot.querySelector('sp-button.import-url-btn').click();
            await el.updateComplete;
            expect(el.importMode).to.be.true;

            el.shadowRoot.querySelector('sp-tab[value="collections"]').click();
            await el.updateComplete;

            expect(el.importMode).to.be.false;
            expect(el.importedUrls).to.have.length(0);
            expect(el.selectedTab).to.equal('collections');
        });
    });

    describe('Select All integration', () => {
        it('selecting all on cards tab updates the dialog selected count', async () => {
            const cards = [
                {
                    path: '/p/a',
                    title: 'A',
                    studioPath: 'merch-card: ACOM / A',
                    status: FRAGMENT_STATUS.PUBLISHED,
                    model: { path: CARD_MODEL_PATH },
                    tags: [],
                    fields: [],
                    offerData: null,
                },
                {
                    path: '/p/b',
                    title: 'B',
                    studioPath: 'merch-card: ACOM / B',
                    status: FRAGMENT_STATUS.PUBLISHED,
                    model: { path: CARD_MODEL_PATH },
                    tags: [],
                    fields: [],
                    offerData: null,
                },
            ];
            Store.translationProjects.allCards.set(cards);
            Store.translationProjects.cardsByPaths.set(new Map(cards.map((c) => [c.path, c])));
            Store.translationProjects.displayCards.set([...cards]);
            Store.translationProjects.selectedCards.set([]);
            Store.fragments.list.firstPageLoaded.set(true);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await el.updateComplete;

            const tablePanels = el.shadowRoot.querySelectorAll('mas-select-items-table');
            const cardsTable = Array.from(tablePanels).find((t) => t.type === TABLE_TYPE.CARDS);
            cardsTable.dataReady = true;
            await cardsTable.updateComplete;

            const cb = cardsTable.shadowRoot.querySelector(
                'sp-table-head-cell sp-checkbox[aria-label="Select all loaded items"]',
            );
            expect(cb, 'header checkbox must exist').to.not.equal(null);
            cb.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            await el.updateComplete;

            expect(el.selectedCount).to.equal(2);
        });

        it('selections in one tab do not affect another tab', async () => {
            const cards = [
                {
                    path: '/p/a',
                    title: 'A',
                    studioPath: 'merch-card: ACOM / A',
                    status: FRAGMENT_STATUS.PUBLISHED,
                    model: { path: CARD_MODEL_PATH },
                    tags: [],
                    fields: [],
                    offerData: null,
                },
            ];
            const placeholders = [{ path: '/ph/a', key: 'KEY_A', value: 'v', status: FRAGMENT_STATUS.PUBLISHED }];
            Store.translationProjects.allCards.set(cards);
            Store.translationProjects.cardsByPaths.set(new Map(cards.map((c) => [c.path, c])));
            Store.translationProjects.displayCards.set([...cards]);
            Store.translationProjects.allPlaceholders.set(placeholders);
            Store.translationProjects.placeholdersByPaths.set(new Map(placeholders.map((p) => [p.path, p])));
            Store.translationProjects.displayPlaceholders.set([...placeholders]);
            Store.translationProjects.selectedCards.set(['/p/a']);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.fragments.list.firstPageLoaded.set(true);
            const el = await fixture(html`<mas-items-selector></mas-items-selector>`);
            await el.updateComplete;

            expect(Store.translationProjects.selectedCards.get()).to.deep.equal(['/p/a']);
            expect(Store.translationProjects.selectedPlaceholders.get()).to.deep.equal([]);
        });
    });
});
