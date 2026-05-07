import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { setCardVariationsByPaths } from '../../src/common/utils/items-loader.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, FRAGMENT_STATUS } from '../../src/constants.js';
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
            expect(el.tabs).to.have.lengthOf(2);
        });

        it('should have default tabs with Promotion and Grouped variation', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            const promotionTab = el.tabs.find((t) => t.key === 'promotion');
            const groupedTab = el.tabs.find((t) => t.key === 'groupedVariation');
            expect(promotionTab).to.exist;
            expect(promotionTab.label).to.equal('Promotion');
            expect(promotionTab.disabled).to.be.true;
            expect(groupedTab).to.exist;
            expect(groupedTab.label).to.equal('Grouped variation');
            expect(groupedTab.selected).to.be.true;
        });

        it('should accept viewOnly property', async () => {
            const topLevelCard = createMockTopLevelCard();
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard} .viewOnly=${true}></mas-collapsible-table-row>`,
            );
            expect(el.viewOnly).to.be.true;
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

    describe('connector visibility', () => {
        it('should not add has-connector class when tab is not groupedVariation', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: ['/path/v1'] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                    .tabs=${[{ key: 'promotion', selected: true }, { key: 'groupedVariation' }]}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const nestedContent = el.shadowRoot.querySelector('.nested-content');
            expect(nestedContent?.classList.contains('has-connector')).to.be.false;
        });

        it('should not add has-connector class when tab is groupedVariation but no variation paths', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: [] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const nestedContent = el.shadowRoot.querySelector('.nested-content');
            expect(nestedContent?.classList.contains('has-connector')).to.be.false;
        });

        it('should add has-connector class when groupedVariation tab is selected and has variation paths', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: ['/path/v1'] });
            const mockVariation = { path: '/path/v1', title: 'Var 1' };
            setupCardVariationsInStore(topLevelCard.path, [mockVariation]);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const nestedContent = el.shadowRoot.querySelector('.nested-content');
            expect(nestedContent?.classList.contains('has-connector')).to.be.true;
        });

        it('should not add has-connector class when groupedVariation tab is selected and has no variation paths', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: [] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const nestedContent = el.shadowRoot.querySelector('.nested-content');
            expect(nestedContent?.classList.contains('has-connector')).to.be.false;
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
                modelPath: '/something/dictionary/other',
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
    });

    describe('grouped variations tab', () => {
        it('should show loading state when isLoadingVariations', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: ['/path/v1'] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                    .isLoadingVariations=${true}
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
            await el.updateComplete;
            const emptyMsg = el.shadowRoot.querySelector('.empty-grouped-variations');
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
        it('should render "To be implemented" for promotion tab content', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: [] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row
                    .topLevelCard=${topLevelCard}
                    .isTopLevelExpanded=${true}
                    .tabs=${[{ key: 'promotion', selected: true }, { key: 'groupedVariation' }]}
                ></mas-collapsible-table-row>`,
            );
            await el.updateComplete;
            const shadowText = el.shadowRoot?.textContent || '';
            expect(shadowText).to.include('To be implemented');
        });
    });

    describe('lifecycle', () => {
        it('should remove the resize observer on disconnect', async () => {
            const topLevelCard = createMockTopLevelCard({ variationPaths: [] });
            setupCardVariationsInStore(topLevelCard.path, []);
            const el = await fixture(
                html`<mas-collapsible-table-row .topLevelCard=${topLevelCard}></mas-collapsible-table-row>`,
            );
            el.remove();
            expect(el.resizeObserver).to.be.null;
        });

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
