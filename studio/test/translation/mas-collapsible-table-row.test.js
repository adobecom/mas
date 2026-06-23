import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { setCardVariationsByPaths, enrichPromoVariations } from '../../src/common/utils/items-loader.js';
import { Fragment } from '../../src/aem/fragment.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, DICTIONARY_MODEL_PATH, FRAGMENT_STATUS } from '../../src/constants.js';
import { renderFragmentStatusCell } from '../../src/translation/translation-utils.js';
import '../../src/swc.js';
import '../../src/translation/mas-collapsible-table-row.js';

describe('MasCollapsibleTableRow', () => {
    let sandbox;

    const createMockTopLevelCard = (options = {}) => ({
        path: options.path || '/content/dam/mas/acom/en_US/cards/test',
        title: options.title !== undefined ? options.title : 'Test Card',
        studioPath: options.studioPath !== undefined ? options.studioPath : 'merch-card: ACOM / Test Card',
        status: options.status || FRAGMENT_STATUS.PUBLISHED,
        model: { path: options.modelPath || CARD_MODEL_PATH },
        tags: options.tags || [{ id: 'mas:product_code/test', title: 'Test Offer' }],
        fields: options.fields ?? [{ name: 'variations', values: options.variationPaths || [] }],
        offerData: options.offerData,
    });

    const resetStore = () => {
        Store.translationProjects.selectedCards.set([]);
        setCardVariationsByPaths(new Map());
    };

    const setupCardVariationsInStore = (cardPath, variations) => {
        const existing = Store.translationProjects.groupedVariationsByParent.value || new Map();
        const merged = new Map(existing);
        merged.set(cardPath, new Map(variations.map((v) => [v.path, v])));
        setCardVariationsByPaths(merged);
    };

    const createMockRepository = () => {
        const repo = document.createElement('mas-repository');
        repo.setAttribute('base-url', 'http://test');
        document.body.appendChild(repo);
        return repo;
    };

    const removeMockRepository = () => {
        const repo = document.querySelector('mas-repository');
        if (repo) repo.remove();
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        setItemsSelectionStore(Store.translationProjects);
        resetStore();
        createMockRepository();
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        resetStore();
        removeMockRepository();
        setItemsSelectionStore(null);
    });

    describe('initialization', () => {
        it('should initialize with default values', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            expect(el.isTopLevelExpanded).to.be.false;
            expect(el.viewOnly).to.not.equal(true);
            expect(el.tabs).to.be.an('array');
            expect(el.tabs).to.have.lengthOf(3);
        });

        it('should have default tabs with Locale, Promotion and Grouped variation', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const localeTab = el.tabs.find((t) => t.key === 'locale');
            const promotionTab = el.tabs.find((t) => t.key === 'promotion');
            const groupedTab = el.tabs.find((t) => t.key === 'groupedVariation');
            expect(localeTab).to.exist;
            expect(localeTab.label).to.equal('Locale');
            expect(promotionTab).to.exist;
            expect(promotionTab.label).to.equal('Promotion');
            expect(groupedTab).to.exist;
            expect(groupedTab.label).to.equal('Grouped variation');
            expect(el.selectedTabKey).to.equal('locale');
        });

        it('should accept viewOnly property', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            expect(el.viewOnly).to.be.true;
        });

        it('should not render expand or variation tabs when disableCardExpansion', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .disableCardExpansion=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.expand-button')).to.be.null;
            expect(el.shadowRoot.querySelector('sp-tabs')).to.be.null;
            expect(el.shadowRoot.querySelector('sp-checkbox')).to.exist;
        });

        it('should initialize expandedVariationsPaths from topLevelCard variations field', async () => {
            const variationPaths = ['/path/v1', '/path/v2'];
            const topLevelCard = createMockTopLevelCard({
                variationPaths,
            });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            expect(el.expandedVariationsPaths).to.be.instanceOf(Set);
            expect([...el.expandedVariationsPaths]).to.deep.equal(variationPaths);
        });
    });

    describe('cells getter', () => {
        it('should return cells without ItemType when viewOnly is false', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            expect(el.cells).to.deep.equal(['OfferName', 'Title', 'OfferId', 'StudioPath', 'Status']);
        });

        it('should include ItemType when viewOnly is true', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            expect(el.cells).to.deep.equal(['OfferName', 'Title', 'OfferId', 'StudioPath', 'ItemType', 'Status']);
        });
    });

    describe('variationPaths getter', () => {
        it('should return empty array when topLevelCard has no variations field', async () => {
            const topLevelCard = createMockTopLevelCard({ fields: [] });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            expect(el.variationPaths).to.deep.equal([]);
        });

        it('should return variation paths from variations field', async () => {
            const variationPaths = ['/path/var1', '/path/var2'];
            const topLevelCard = createMockTopLevelCard({ variationPaths });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            expect(el.variationPaths).to.deep.equal(variationPaths);
        });
    });

    describe('rendering', () => {
        it('should render main table row with topLevelCard path', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const row = el.shadowRoot.querySelector('sp-table-row[value]');
            expect(row).to.exist;
            expect(row.getAttribute('value')).to.equal(topLevelCard.path);
        });

        it('should render expand button when not viewOnly', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const expandButton = el.shadowRoot.querySelector('.expand-button');
            expect(expandButton).to.exist;
        });

        it('should not render expand button when viewOnly', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            const expandButton = el.shadowRoot.querySelector('.expand-button');
            expect(expandButton).to.be.null;
        });

        it('should not render checkbox when viewOnly', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            const checkbox = el.shadowRoot.querySelector('sp-checkbox');
            expect(checkbox).to.be.null;
        });

        it('should render nested content when expanded', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const nestedContent = el.shadowRoot.querySelector('.nested-content');
            expect(nestedContent).to.exist;
        });

        it('should not render nested content when not expanded', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const nestedContent = el.shadowRoot.querySelector('.nested-content');
            expect(nestedContent).to.be.null;
        });

        it('should render sp-tabs when expanded', async () => {
            const topLevelCard = createMockTopLevelCard();
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const tabs = el.shadowRoot.querySelector('sp-tabs');
            expect(tabs).to.exist;
        });
    });

    describe('renderTitle', () => {
        it('should render item title', async () => {
            const topLevelCard = createMockTopLevelCard({ title: 'My Title' });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            const titleCell = [...cells].find((c) => c.textContent.trim() === 'My Title');
            expect(titleCell).to.exist;
        });

        it('should render "no title" when title is missing', async () => {
            const topLevelCard = createMockTopLevelCard({ title: null });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('no title');
        });
    });

    describe('renderOfferName', () => {
        it('should render offer name from product_code tag', async () => {
            const topLevelCard = createMockTopLevelCard({
                tags: [{ id: 'mas:product_code/my-offer', title: 'My Offer Name' }],
            });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            const offerCell = [...cells].find((c) => c.textContent.trim() === 'My Offer Name');
            expect(offerCell).to.exist;
        });

        it('should render "no offer name" when no product_code tag', async () => {
            const topLevelCard = createMockTopLevelCard({ tags: [] });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            const noOfferCell = [...cells].find((c) => c.textContent.includes('no offer name'));
            expect(noOfferCell).to.exist;
        });
    });

    describe('renderOfferId', () => {
        it('should render offer ID when offerData is present', async () => {
            const topLevelCard = createMockTopLevelCard({
                offerData: { offerId: 'ABC-123' },
            });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('ABC-123');
        });

        it('should render "no offer data" when offerData is missing', async () => {
            const topLevelCard = createMockTopLevelCard({ offerData: undefined });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('no offer data');
        });

        it('should copy offer ID to clipboard and dispatch show-toast when copy button is clicked', async () => {
            const topLevelCard = createMockTopLevelCard({
                offerData: { offerId: 'XYZ-456' },
            });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const copyBtn = el.shadowRoot.querySelector('sp-action-button[aria-label="Copy Offer ID to clipboard"]');
            expect(copyBtn).to.exist;

            const toastPromise = new Promise((resolve) => {
                el.addEventListener(
                    'show-toast',
                    (e) => {
                        resolve(e.detail);
                    },
                    { once: true },
                );
            });
            copyBtn.click();
            const detail = await toastPromise;
            expect(detail.text).to.equal('Offer ID copied to clipboard');
            expect(detail.variant).to.equal('positive');
            expect(writeTextStub.calledWith('XYZ-456')).to.be.true;
        });

        it('should dispatch negative toast when clipboard copy fails', async () => {
            const topLevelCard = createMockTopLevelCard({
                offerData: { offerId: 'FAIL-789' },
            });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            sandbox.stub(navigator.clipboard, 'writeText').rejects(new Error('Clipboard denied'));
            const copyBtn = el.shadowRoot.querySelector('sp-action-button[aria-label="Copy Offer ID to clipboard"]');
            expect(copyBtn).to.exist;

            const toastPromise = new Promise((resolve) => {
                el.addEventListener(
                    'show-toast',
                    (e) => {
                        resolve(e.detail);
                    },
                    { once: true },
                );
            });
            copyBtn.click();
            const detail = await toastPromise;
            expect(detail.text).to.equal('Failed to copy Offer ID');
            expect(detail.variant).to.equal('negative');
        });
    });

    describe('renderStudioPath', () => {
        it('should render studio path', async () => {
            const topLevelCard = createMockTopLevelCard({ studioPath: 'merch-card: ACOM / Custom' });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            const pathCell = [...cells].find((c) => c.textContent.includes('merch-card: ACOM / Custom'));
            expect(pathCell).to.exist;
        });

        it('should render "no path" when studioPath is missing', async () => {
            const topLevelCard = createMockTopLevelCard({ studioPath: null });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('no path');
        });
    });

    describe('renderStatus', () => {
        it('should render published status with green class', async () => {
            const topLevelCard = createMockTopLevelCard({ status: FRAGMENT_STATUS.PUBLISHED });
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .renderFragmentStatusCell=${renderFragmentStatusCell}
                ></mas-collapsible-table-row>`,
            );
            const statusDot = el.shadowRoot.querySelector('.status-dot.green');
            expect(statusDot).to.exist;
        });

        it('should render modified status with blue class', async () => {
            const topLevelCard = createMockTopLevelCard({ status: FRAGMENT_STATUS.MODIFIED });
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .renderFragmentStatusCell=${renderFragmentStatusCell}
                ></mas-collapsible-table-row>`,
            );
            const statusDot = el.shadowRoot.querySelector('.status-dot.blue');
            expect(statusDot).to.exist;
        });
    });

    describe('renderItemType', () => {
        it('should render "Default" for card model', async () => {
            const topLevelCard = createMockTopLevelCard({ modelPath: CARD_MODEL_PATH });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            const defaultCell = [...cells].find((c) => c.textContent.trim() === 'Default');
            expect(defaultCell).to.exist;
        });

        it('should render "Collection" for collection model', async () => {
            const topLevelCard = createMockTopLevelCard({ modelPath: COLLECTION_MODEL_PATH });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            const collectionCell = [...cells].find((c) => c.textContent.trim() === 'Collection');
            expect(collectionCell).to.exist;
        });

        it('should render "Placeholder" for dictionary path', async () => {
            const topLevelCard = createMockTopLevelCard({
                modelPath: `${DICTIONARY_MODEL_PATH}/other`,
                path: '/content/dam/mas/dictionary/item',
            });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            const placeholderCell = [...cells].find((c) => c.textContent.trim() === 'Placeholder');
            expect(placeholderCell).to.exist;
        });

        it('should render "Grouped variation" for grouped variation path', async () => {
            const groupedPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const topLevelCard = createMockTopLevelCard({
                path: groupedPath,
                modelPath: CARD_MODEL_PATH,
            });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            const cells = el.shadowRoot.querySelectorAll('sp-table-cell');
            const groupedCell = [...cells].find((c) => c.textContent.trim() === 'Grouped variation');
            expect(groupedCell).to.exist;
        });

        it('should render "Unknown" for unknown model path', async () => {
            const topLevelCard = createMockTopLevelCard({
                modelPath: '/conf/mas/settings/dam/cfm/models/unknown',
            });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('Unknown');
        });
    });

    describe('selected state', () => {
        it('should show row as selected when path is in selectedCards', async () => {
            const topLevelCard = createMockTopLevelCard();
            Store.translationProjects.selectedCards.set([topLevelCard.path]);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const row = el.shadowRoot.querySelector('sp-table-row');
            expect(row.selected).to.be.true;
        });

        it('should not show row as selected when path is not in selectedCards', async () => {
            const topLevelCard = createMockTopLevelCard();
            Store.translationProjects.selectedCards.set([]);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const row = el.shadowRoot.querySelector('sp-table-row');
            expect(row.selected).to.be.false;
        });
    });

    describe('expand toggle', () => {
        it('should toggle isTopLevelExpanded when expand button is clicked', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: [] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            expect(el.isTopLevelExpanded).to.be.false;

            const expandButton = el.shadowRoot.querySelector('.expand-button');
            expandButton.click();
            await el.updateComplete;
            expect(el.isTopLevelExpanded).to.be.true;

            expandButton.click();
            await el.updateComplete;
            expect(el.isTopLevelExpanded).to.be.false;
        });
    });

    describe('checkbox selection', () => {
        it('should add path to selectedCards when checkbox is checked', async () => {
            const topLevelCard = createMockTopLevelCard();
            Store.translationProjects.selectedCards.set([]);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const checkbox = el.shadowRoot.querySelector('sp-checkbox');
            checkbox.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.include(topLevelCard.path);
        });

        it('should remove path from selectedCards when checkbox is unchecked', async () => {
            const topLevelCard = createMockTopLevelCard();
            Store.translationProjects.selectedCards.set([topLevelCard.path]);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const checkbox = el.shadowRoot.querySelector('sp-checkbox');
            checkbox.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.not.include(topLevelCard.path);
        });

        it('should add path to selectedCards when row is clicked outside checkbox', async () => {
            const topLevelCard = createMockTopLevelCard();
            Store.translationProjects.selectedCards.set([]);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const row = el.shadowRoot.querySelector('sp-table-row');
            const titleCell = row.querySelector('sp-table-cell:nth-of-type(4)');
            titleCell.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.include(topLevelCard.path);
        });

        it('should not change selectedCards when expand button is clicked', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: [] });
            setupCardVariationsInStore(topLevelCard.path, []);
            Store.translationProjects.selectedCards.set([]);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const expandButton = el.shadowRoot.querySelector('.expand-button');
            expandButton.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.deep.equal([]);
        });

        it('should add the grouped variation path, not the parent, when a variation checkbox is checked', async () => {
            const parentPath = '/content/dam/mas/acom/en_US/cards/parent';
            const varPath = `${parentPath}/pzn/var1`;
            const topLevelCard = createMockTopLevelCard({ path: parentPath, variationPaths: [varPath] });
            setupCardVariationsInStore(parentPath, [{ path: varPath, title: 'Variation 1' }]);
            Store.translationProjects.selectedCards.set([]);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.selectedTabKey = 'groupedVariation';
            await el.updateComplete;
            const variationCheckbox = el.shadowRoot.querySelector(`sp-checkbox[value="${varPath}"]`);
            variationCheckbox.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.include(varPath);
            expect(Store.translationProjects.selectedCards.value).to.not.include(parentPath);
        });

        it('should add the grouped variation path, not the parent, when a variation row is clicked', async () => {
            const parentPath = '/content/dam/mas/acom/en_US/cards/parent';
            const varPath = `${parentPath}/pzn/var1`;
            const topLevelCard = createMockTopLevelCard({ path: parentPath, variationPaths: [varPath] });
            setupCardVariationsInStore(parentPath, [{ path: varPath, title: 'Variation 1' }]);
            Store.translationProjects.selectedCards.set([]);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.selectedTabKey = 'groupedVariation';
            await el.updateComplete;
            const variationRow = el.shadowRoot.querySelector(`sp-table-row[value="${varPath}"]`);
            variationRow.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.include(varPath);
            expect(Store.translationProjects.selectedCards.value).to.not.include(parentPath);
        });

        it('should select every grouped variation path when select all is checked', async () => {
            const parentPath = '/content/dam/mas/acom/en_US/cards/parent';
            const varPath1 = `${parentPath}/pzn/var1`;
            const varPath2 = `${parentPath}/pzn/var2`;
            const topLevelCard = createMockTopLevelCard({ path: parentPath, variationPaths: [varPath1, varPath2] });
            setupCardVariationsInStore(parentPath, [
                { path: varPath1, title: 'Variation 1' },
                { path: varPath2, title: 'Variation 2' },
            ]);
            Store.translationProjects.selectedCards.set([]);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.selectedTabKey = 'groupedVariation';
            await el.updateComplete;
            const selectAll = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            selectAll.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.include(varPath1);
            expect(Store.translationProjects.selectedCards.value).to.include(varPath2);
            expect(Store.translationProjects.selectedCards.value).to.not.include(parentPath);
        });

        it('should deselect every grouped variation path when select all is unchecked', async () => {
            const parentPath = '/content/dam/mas/acom/en_US/cards/parent';
            const varPath1 = `${parentPath}/pzn/var1`;
            const varPath2 = `${parentPath}/pzn/var2`;
            const topLevelCard = createMockTopLevelCard({ path: parentPath, variationPaths: [varPath1, varPath2] });
            setupCardVariationsInStore(parentPath, [
                { path: varPath1, title: 'Variation 1' },
                { path: varPath2, title: 'Variation 2' },
            ]);
            Store.translationProjects.selectedCards.set([varPath1, varPath2]);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.selectedTabKey = 'groupedVariation';
            await el.updateComplete;
            const selectAll = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            selectAll.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.not.include(varPath1);
            expect(Store.translationProjects.selectedCards.value).to.not.include(varPath2);
        });
    });

    describe('grouped variations tab', () => {
        it('should show loading state when isLoadingGroupedVariations', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: ['/path/v1'] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                    .isLoadingGroupedVariations=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(progressCircle).to.exist;
        });

        it('should show empty message when no grouped variations found', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: ['/path/v1'] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.selectedTabKey = 'groupedVariation';
            await el.updateComplete;
            const groupedVariationPanel = el.shadowRoot.querySelector('sp-tab-panel[value="groupedVariation"]');
            const emptyMsg = groupedVariationPanel?.querySelector('.empty-grouped-variations');
            expect(emptyMsg).to.exist;
            expect(emptyMsg.textContent).to.include('No grouped variations found');
        });

        it('should render variation rows when variations exist in store', async () => {
            const varPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const topLevelCard = createMockTopLevelCard({
                path: '/content/dam/mas/acom/en_US/cards/parent',
                variationPaths: [varPath],
            });
            const mockVariation = {
                path: varPath,
                title: 'Variation 1',
                fieldTags: [{ id: 't1', name: 'Tag1' }],
            };
            setupCardVariationsInStore(topLevelCard.path, [mockVariation]);

            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const variationRows = el.shadowRoot.querySelectorAll('sp-table-row[value]');
            const hasVariation = [...variationRows].some((r) => r.getAttribute('value') === varPath);
            expect(hasVariation).to.be.true;
        });
    });

    describe('hideLocaleTab', () => {
        const setup = async (hide) => {
            const topLevelCard = createMockTopLevelCard();
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                    .hideLocaleTab=${hide}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            return el;
        };

        it('should not render the locale tab when hideLocaleTab is set', async () => {
            const el = await setup(true);
            expect(el.shadowRoot.querySelector('sp-tab[value="locale"]')).to.be.null;
        });

        it('should still render the grouped variation tab when hideLocaleTab is set', async () => {
            const el = await setup(true);
            expect(el.shadowRoot.querySelector('sp-tab[value="groupedVariation"]')).to.exist;
        });

        it('should select the promotion variation tab by default when the locale tab is hidden', async () => {
            const el = await setup(true);
            expect(el.selectedTabKey).to.equal('promotion');
        });

        it('should render the locale tab by default', async () => {
            const el = await setup(false);
            expect(el.shadowRoot.querySelector('sp-tab[value="locale"]')).to.exist;
        });
    });

    describe('disableLocaleVariations', () => {
        it('should render an empty locale tab without listing variations when set', async () => {
            const listStub = sandbox.stub(Fragment.prototype, 'listLocaleVariations');
            const topLevelCard = createMockTopLevelCard();
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                    .disableLocaleVariations=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const localePanel = el.shadowRoot.querySelector('sp-tab-panel[value="locale"]');
            expect(localePanel?.querySelector('.empty-grouped-variations')).to.exist;
            expect(listStub.called).to.be.false;
        });

        it('should list locale variations by default', async () => {
            const listStub = sandbox.stub(Fragment.prototype, 'listLocaleVariations').returns([]);
            const topLevelCard = createMockTopLevelCard();
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            expect(listStub.called).to.be.true;
        });
    });

    describe('disableGroupedVariationSelection', () => {
        const varPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';

        const setup = async (disable) => {
            const topLevelCard = createMockTopLevelCard({
                path: '/content/dam/mas/acom/en_US/cards/parent',
                variationPaths: [varPath],
            });
            setupCardVariationsInStore(topLevelCard.path, [{ path: varPath, title: 'Variation 1', fieldTags: [] }]);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                    .disableGroupedVariationSelection=${disable}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            return el;
        };

        it('should disable the variation row checkbox when flag is set', async () => {
            const el = await setup(true);
            const checkbox = el.shadowRoot.querySelector(`sp-table-row[value="${varPath}"] sp-checkbox`);
            expect(checkbox).to.exist;
            expect(checkbox.disabled).to.be.true;
        });

        it('should disable the select all checkbox when flag is set', async () => {
            const el = await setup(true);
            const selectAll = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            expect(selectAll).to.exist;
            expect(selectAll.disabled).to.be.true;
        });

        it('should not change selectedCards when a disabled variation row is clicked', async () => {
            Store.translationProjects.selectedCards.set([]);
            const el = await setup(true);
            const row = el.shadowRoot.querySelector(`sp-table-row[value="${varPath}"]`);
            row.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.deep.equal([]);
        });

        it('should keep the variation row visible when flag is set', async () => {
            const el = await setup(true);
            const row = el.shadowRoot.querySelector(`sp-table-row[value="${varPath}"]`);
            expect(row).to.exist;
        });

        it('should keep the variation checkbox enabled by default', async () => {
            const el = await setup(false);
            const checkbox = el.shadowRoot.querySelector(`sp-table-row[value="${varPath}"] sp-checkbox`);
            expect(checkbox.disabled).to.not.be.true;
        });
    });

    describe('locale variations tab', () => {
        it('should show empty message when the card has no locale variations', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const localePanel = el.shadowRoot.querySelector('sp-tab-panel[value="locale"]');
            const emptyMsg = localePanel?.querySelector('.empty-grouped-variations');
            expect(emptyMsg).to.exist;
            expect(emptyMsg.textContent).to.include('No locale variations found');
        });

        it('should not fetch references when disableLocaleVariations is set', async () => {
            const topLevelCard = { ...createMockTopLevelCard(), id: 'frag-1' };
            const getById = sandbox.stub().resolves({ ...topLevelCard, references: [] });
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .disableLocaleVariations=${true}
                ></mas-collapsible-table-row>`,
            );
            el.repository = { aem: { sites: { cf: { fragments: { getById } } } } };
            el.shadowRoot.querySelector('.expand-button').click();
            await el.updateComplete;
            expect(getById.called).to.be.false;
        });

        it('should fetch hydrated references on first expand to populate locale variations', async () => {
            const topLevelCard = { ...createMockTopLevelCard(), id: 'frag-1' };
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const getById = sandbox.stub().resolves({ ...topLevelCard, references: [] });
            el.repository = { aem: { sites: { cf: { fragments: { getById } } } } };
            el.shadowRoot.querySelector('.expand-button').click();
            await el.updateComplete;
            expect(getById.calledOnceWith('frag-1')).to.be.true;
        });
    });

    describe('variation expand toggle', () => {
        it('should expand variation row when expand button is clicked', async () => {
            const varPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const topLevelCard = createMockTopLevelCard({
                path: '/content/dam/mas/acom/en_US/cards/parent',
                variationPaths: [varPath],
            });
            const mockVariation = {
                path: varPath,
                title: 'Variation 1',
                fieldTags: [{ id: 't1', name: 'Tag1' }],
            };
            setupCardVariationsInStore(topLevelCard.path, [mockVariation]);

            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;

            const variationExpandButtons = el.shadowRoot.querySelectorAll('sp-table-row .expand-button');
            const variationExpandBtn = [...variationExpandButtons].find((btn) => btn.closest('sp-table-row'));
            if (variationExpandBtn) {
                variationExpandBtn.click();
                await el.updateComplete;
                expect(el.expandedVariationsPaths.has(varPath)).to.be.true;
            }
        });

        it('should collapse variation row when expand button is clicked again', async () => {
            const varPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const topLevelCard = createMockTopLevelCard({
                path: '/content/dam/mas/acom/en_US/cards/parent',
                variationPaths: [varPath],
            });
            const mockVariation = {
                path: varPath,
                title: 'Variation 1',
                fieldTags: [{ id: 't1', name: 'Tag1' }],
            };
            setupCardVariationsInStore(topLevelCard.path, [mockVariation]);

            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.expandedVariationsPaths = new Set([varPath]);
            await el.updateComplete;

            const variationRow = el.shadowRoot.querySelector(`sp-table-row[value="${varPath}"]`);
            const variationBtn = variationRow?.querySelector('.expand-button');
            expect(variationBtn).to.exist;
            variationBtn.click(); // collapse (was expanded)
            await el.updateComplete;
            expect(el.expandedVariationsPaths.has(varPath)).to.be.false;
        });
    });

    describe('renderTags and renderPromoCode (grouped variation details)', () => {
        it('should render tags in grouped variation details row when expanded', async () => {
            const varPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const topLevelCard = createMockTopLevelCard({
                path: '/content/dam/mas/acom/en_US/cards/parent',
                variationPaths: [varPath],
            });
            const mockVariation = {
                path: varPath,
                title: 'Variation 1',
                fieldTags: [
                    { id: 't1', name: 'TagA' },
                    { id: 't2', name: 'TagB' },
                ],
                fields: [{ name: 'promoCode', values: ['PROMO123'] }],
            };
            setupCardVariationsInStore(topLevelCard.path, [mockVariation]);
            const flattened = new Map();
            flattened.set(varPath, mockVariation);
            Store.translationProjects.groupedVariationsData.set(flattened);

            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.expandedVariationsPaths = new Set([varPath]);
            await el.updateComplete;
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('TagA');
            expect(shadowText).to.include('TagB');
            expect(shadowText).to.include('PROMO123');
        });

        it('should render "no tags" when variation has no fieldTags', async () => {
            const varPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const topLevelCard = createMockTopLevelCard({
                path: '/content/dam/mas/acom/en_US/cards/parent',
                variationPaths: [varPath],
            });
            const mockVariation = {
                path: varPath,
                title: 'Variation 1',
                fieldTags: [],
                fields: [],
            };
            setupCardVariationsInStore(topLevelCard.path, [mockVariation]);

            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.expandedVariationsPaths = new Set([varPath]);
            await el.updateComplete;
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('no tags');
        });

        it('should render "no promo code" when variation has no promoCode field', async () => {
            const varPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const topLevelCard = createMockTopLevelCard({
                path: '/content/dam/mas/acom/en_US/cards/parent',
                variationPaths: [varPath],
            });
            const mockVariation = {
                path: varPath,
                title: 'Variation 1',
                fieldTags: [{ id: 't1', name: 'Tag1' }],
                fields: [],
            };
            setupCardVariationsInStore(topLevelCard.path, [mockVariation]);

            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.expandedVariationsPaths = new Set([varPath]);
            await el.updateComplete;
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('no promo code');
        });
    });

    describe('viewOnly mode', () => {
        it('should render expand button when viewOnly and isGroupedVariation', async () => {
            const groupedPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const topLevelCard = createMockTopLevelCard({
                path: groupedPath,
                variationPaths: [],
            });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            const expandButton = el.shadowRoot.querySelector('.expand-button');
            expect(expandButton).to.exist;
        });

        it('should render chevron placeholder when viewOnly and not grouped variation', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            const chevronCell = el.shadowRoot.querySelector('.table-icon-cell--chevron');
            expect(chevronCell).to.exist;
        });

        it('should show grouped variation details row when viewOnly, grouped variation, and expanded', async () => {
            const groupedPath = '/content/dam/mas/acom/en_US/cards/parent/pzn/var1';
            const topLevelCard = createMockTopLevelCard({
                path: groupedPath,
                variationPaths: [],
            });
            const mockData = { fieldTags: [{ name: 'Tag1' }], fields: [{ name: 'promoCode', values: ['CODE'] }] };
            const flattened = new Map();
            flattened.set(groupedPath, mockData);
            Store.translationProjects.groupedVariationsData.set(flattened);

            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .viewOnly=${true}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const detailsRow = el.shadowRoot.querySelector('.variation-details-row');
            expect(detailsRow).to.exist;
        });
    });

    describe('promotion tab', () => {
        it('should render empty message when no promo variations exist', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: [] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const promotionPanel = el.shadowRoot.querySelector('sp-tab-panel[value="promotion"]');
            expect(promotionPanel?.querySelector('.empty-promotion-variations')).to.exist;
        });

        it('should show loading spinner when isLoadingPromoVariations', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: [] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                    .isLoadingPromoVariations=${true}
                ></mas-collapsible-table-row>`,
            );
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const promotionPanel = el.shadowRoot.querySelector('sp-tab-panel[value="promotion"]');
            expect(promotionPanel?.querySelector('sp-progress-circle')).to.exist;
        });

        it('should render promo variation rows when promoVariations are set', async () => {
            const promoPath = '/content/dam/mas/acom/en_US/promotions/black-friday/promo-card';
            const topLevelCard = createMockTopLevelCard();
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.promoVariations = [
                { path: promoPath, title: 'Promo Card', studioPath: 'promo/path', tags: [], offerData: null },
            ];
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const row = el.shadowRoot.querySelector(`sp-table-row[value="${promoPath}"]`);
            expect(row).to.exist;
        });

        it('should render renderPromoVariationDetailsRow with promotion info when expanded', async () => {
            const promoPath = '/content/dam/mas/acom/en_US/promotions/black-friday/promo-card';
            const topLevelCard = createMockTopLevelCard();
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.promoVariations = [
                {
                    path: promoPath,
                    title: 'Promo Card',
                    studioPath: 'promo/path',
                    tags: [{ id: 'mas:promotion/black-friday', title: 'Black Friday' }],
                    offerData: null,
                },
            ];
            el.expandedVariationsPaths = new Set([promoPath]);
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('Black Friday');
            expect(shadowText).to.include('black-friday');
        });
    });

    describe('#loadPromoVariations filter behavior', () => {
        const localeRefPath = '/content/dam/mas/acom/fr_FR/cards/test';
        const promoRefPath = '/content/dam/mas/acom/en_US/promotions/black-friday/promo-card';

        const makeRef = (path, tags = []) => ({ id: path, path, tags, fields: [] });

        const setupWithRefs = async (references) => {
            const topLevelCard = {
                ...createMockTopLevelCard(),
                id: 'frag-load-promo',
                references,
            };
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            el.repository = {
                aem: {},
                loadPromotions: sandbox.stub().resolves(),
            };
            return el;
        };

        const triggerPromoLoad = async (el) => {
            el.selectedTabKey = 'promotion';
            el.shadowRoot.querySelector('.expand-button').click();
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 50));
            await el.updateComplete;
        };

        beforeEach(() => {
            sandbox.stub(window, 'fetch').resolves({
                ok: true,
                headers: { get: () => null },
                json: async () => ({ offers: [] }),
            });
        });

        it('excludes locale references from promoVariations when references contain mixed types', async () => {
            const el = await setupWithRefs([makeRef(localeRefPath), makeRef(promoRefPath)]);
            await triggerPromoLoad(el);
            const paths = el.promoVariations.map((v) => v.path);
            expect(paths).to.not.include(localeRefPath);
        });

        it('includes promo references in promoVariations when references contain mixed types', async () => {
            const el = await setupWithRefs([makeRef(localeRefPath), makeRef(promoRefPath)]);
            await triggerPromoLoad(el);
            const paths = el.promoVariations.map((v) => v.path);
            expect(paths).to.include(promoRefPath);
        });

        it('calls Fragment.listPromoVariations on the merged fragment data', async () => {
            const listPromoStub = sandbox.stub(Fragment.prototype, 'listPromoVariations').returns([]);
            const el = await setupWithRefs([makeRef(localeRefPath), makeRef(promoRefPath)]);
            await triggerPromoLoad(el);
            expect(listPromoStub.called).to.be.true;
        });

        it('results in empty promoVariations when references contain only locale refs', async () => {
            const el = await setupWithRefs([makeRef(localeRefPath)]);
            await triggerPromoLoad(el);
            expect(el.promoVariations).to.deep.equal([]);
        });
    });

    describe('promo variation selection', () => {
        const promoPath1 = '/content/dam/mas/acom/en_US/promotions/black-friday/card1';
        const promoPath2 = '/content/dam/mas/acom/en_US/promotions/black-friday/card2';

        const makePromoVariation = (path) => ({
            path,
            title: 'Promo',
            studioPath: path,
            tags: [{ id: 'mas:promotion/black-friday', title: 'Black Friday' }],
            offerData: null,
        });

        it('promoVariationPaths returns paths from promoVariations', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            el.promoVariations = [makePromoVariation(promoPath1), makePromoVariation(promoPath2)];
            await el.updateComplete;
            expect(el.promoVariationPaths).to.deep.equal([promoPath1, promoPath2]);
        });

        it('somePromoVariationsSelected is true when at least one promo path is selected', async () => {
            const topLevelCard = createMockTopLevelCard();
            Store.translationProjects.selectedCards.set([promoPath1]);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            el.promoVariations = [makePromoVariation(promoPath1), makePromoVariation(promoPath2)];
            await el.updateComplete;
            expect(el.somePromoVariationsSelected).to.be.true;
            expect(el.allPromoVariationsSelected).to.be.false;
        });

        it('allPromoVariationsSelected is true when all promo paths are selected', async () => {
            const topLevelCard = createMockTopLevelCard();
            Store.translationProjects.selectedCards.set([promoPath1, promoPath2]);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            el.promoVariations = [makePromoVariation(promoPath1), makePromoVariation(promoPath2)];
            await el.updateComplete;
            expect(el.allPromoVariationsSelected).to.be.true;
        });

        it('select-all promo checkbox selects all promo variations', async () => {
            const topLevelCard = createMockTopLevelCard();
            Store.translationProjects.selectedCards.set([]);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.promoVariations = [makePromoVariation(promoPath1), makePromoVariation(promoPath2)];
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const selectAllCheckbox = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            expect(selectAllCheckbox).to.exist;
            selectAllCheckbox.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.include(promoPath1);
            expect(Store.translationProjects.selectedCards.value).to.include(promoPath2);
        });

        it('select-all promo checkbox deselects all when all are already selected', async () => {
            const topLevelCard = createMockTopLevelCard();
            Store.translationProjects.selectedCards.set([promoPath1, promoPath2]);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.promoVariations = [makePromoVariation(promoPath1), makePromoVariation(promoPath2)];
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const selectAllCheckbox = el.shadowRoot.querySelector('.select-all-row sp-checkbox');
            selectAllCheckbox.click();
            await el.updateComplete;
            expect(Store.translationProjects.selectedCards.value).to.not.include(promoPath1);
            expect(Store.translationProjects.selectedCards.value).to.not.include(promoPath2);
        });
    });

    describe('renderPromoVariationDetailsRow', () => {
        const promoPath = '/content/dam/mas/acom/en_US/promotions/black-friday/promo-card';
        const promoTagId = 'mas:promotion/black-friday';
        const promoProjectId = 'promo-project-uuid-123';

        const makePromoVariation = (tagId) => ({
            path: promoPath,
            title: 'Promo Card',
            studioPath: 'promo/path',
            tags: tagId ? [{ id: tagId, title: 'Black Friday' }] : [],
            offerData: null,
        });

        const setupPromoProject = (id) => {
            Store.promotions.list.data.set([{ get: () => ({ id, tags: [{ id: promoTagId }] }) }]);
        };

        afterEach(() => {
            Store.promotions.list.data.set([]);
        });

        it('renders a clickable link when a matching promotion project is found in the store', async () => {
            setupPromoProject(promoProjectId);
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.promoVariations = [makePromoVariation(promoTagId)];
            el.expandedVariationsPaths = new Set([promoPath]);
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const link = el.shadowRoot.querySelector('.variation-details-row a');
            expect(link).to.exist;
            expect(link.getAttribute('href')).to.equal(
                `#page=promotions-editor&promotionId=${encodeURIComponent(promoProjectId)}`,
            );
            expect(link.getAttribute('target')).to.equal('_blank');
            expect(link.textContent.trim()).to.equal('black-friday');
        });

        it('renders plain text when the promotion project is not found in the store', async () => {
            Store.promotions.list.data.set([]);
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.promoVariations = [makePromoVariation(promoTagId)];
            el.expandedVariationsPaths = new Set([promoPath]);
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const link = el.shadowRoot.querySelector('.variation-details-row a');
            expect(link).to.be.null;
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('black-friday');
        });

        it('renders plain text when the variation has no promotion tag', async () => {
            setupPromoProject(promoProjectId);
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.promoVariations = [makePromoVariation(null)];
            el.expandedVariationsPaths = new Set([promoPath]);
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const link = el.shadowRoot.querySelector('.variation-details-row a');
            expect(link).to.be.null;
        });

        it('encodes special characters in promotionId in the link href', async () => {
            const specialId = 'id with spaces & symbols';
            setupPromoProject(specialId);
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            el.promoVariations = [makePromoVariation(promoTagId)];
            el.expandedVariationsPaths = new Set([promoPath]);
            el.selectedTabKey = 'promotion';
            await el.updateComplete;
            const link = el.shadowRoot.querySelector('.variation-details-row a');
            expect(link).to.exist;
            expect(link.getAttribute('href')).to.equal(`#page=promotions-editor&promotionId=${encodeURIComponent(specialId)}`);
        });
    });

    describe('lifecycle', () => {
        it('should set value attribute from topLevelCard path in connectedCallback', async () => {
            const topLevelCard = createMockTopLevelCard({ path: '/custom/path' });
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            expect(el.getAttribute('value')).to.equal('/custom/path');
        });

        it('should handle topLevelCard with null path', async () => {
            const topLevelCard = { ...createMockTopLevelCard(), path: null };
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            expect(el.getAttribute('value')).to.equal('');
        });
    });
});

describe('enrichPromoVariations', () => {
    let enrichSandbox;

    beforeEach(() => {
        enrichSandbox = sinon.createSandbox();
    });

    afterEach(() => {
        enrichSandbox.restore();
    });

    it('returns empty array when promoVariations is empty', async () => {
        const result = await enrichPromoVariations([], { path: '/some/card' });
        expect(result).to.deep.equal([]);
    });

    it('returns empty array when promoVariations is null', async () => {
        const result = await enrichPromoVariations(null, { path: '/some/card' });
        expect(result).to.deep.equal([]);
    });

    it('returns empty array when parentCard is null', async () => {
        const result = await enrichPromoVariations([{ path: '/promo/card' }], null);
        expect(result).to.deep.equal([]);
    });

    it('maps each variation with studioPath from getDisplayName', async () => {
        const variations = [{ path: '/content/dam/mas/acom/en_US/promotions/bf/card', title: 'BF Card', fields: [] }];
        const parentCard = { path: '/content/dam/mas/acom/en_US/cards/card', fields: [] };
        const getDisplayName = () => 'Custom Label';
        enrichSandbox.stub(window, 'fetch').resolves({
            ok: true,
            headers: { get: () => null },
            json: async () => ({ offers: [] }),
        });
        const result = await enrichPromoVariations(variations, parentCard, { getDisplayName });
        expect(result).to.have.lengthOf(1);
        expect(result[0].path).to.equal(variations[0].path);
        expect(result[0].studioPath).to.equal('Custom Label');
    });
});
