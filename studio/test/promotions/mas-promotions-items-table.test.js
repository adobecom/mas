import { expect } from '@esm-bundle/chai';
import { html, LitElement } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, PAGE_NAMES, TABLE_TYPE } from '../../src/constants.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import Events from '../../src/events.js';
import '../../src/swc.js';
import MasPromotionsItemsTable from '../../src/promotions/mas-promotions-items-table.js';
import { buildPromotionOfferRecord } from '../../src/promotions/promotion-editor-utils.js';
import { buildPromoVariationPathForTag } from '../../src/promotions/promotion-model.js';

describe('MasPromotionsItemsTable', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        setItemsSelectionStore(Store.promotions);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedOffers.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.offerRecordsCache = new Map();
        // mas-select-items-table's showSkeleton calc factors in the global fragments list
        // loading state even in viewOnly mode, so it must reflect an already-settled list
        // (as it normally is by the time a promotion is opened) for viewOnly rendering to work.
        Store.fragments.list.loading.set(false);
        Store.fragments.list.firstPageLoaded.set(true);
    });

    afterEach(async () => {
        fixtureCleanup();
        await Promise.resolve();
        sandbox.restore();
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedOffers.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.offerRecordsCache = new Map();
        Store.fragments.list.loading.set(true);
        Store.fragments.list.firstPageLoaded.set(false);
        setItemsSelectionStore(null);
    });

    it('renders offer column headers when type is offers', async () => {
        Store.promotions.selectedOffers.set(['offer-header-test']);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const headerCells = el.shadowRoot.querySelectorAll('sp-table-head-cell');
        expect(Array.from(headerCells).map((c) => c.textContent.trim())).to.deep.equal([
            '',
            'Offer',
            'Product arrangement',
            'Offer type',
            'Plan type',
            'Customer segment',
            'Market segment',
            'Promo code',
            'Actions',
        ]);
    });

    it('shows empty state when there is no repository and paths are selected', async () => {
        Store.promotions.selectedCards.set(['/some/path']);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 0));
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        expect(selectItemsTable).to.not.be.null;
        await selectItemsTable.updateComplete;
        expect(selectItemsTable.shadowRoot.textContent).to.include('No items found.');
    });

    it('loads collection rows when repository resolves selected collection paths', async () => {
        Store.promotions.selectedCollections.set(['/content/dam/mas/col-one']);
        const el = new MasPromotionsItemsTable();
        el.type = TABLE_TYPE.COLLECTIONS;
        const fragment = {
            path: '/content/dam/mas/col-one',
            id: 'col-id',
            title: 'Collection title',
            studioPath: '/content/dam/mas/col-one',
            status: 'DRAFT',
            model: { path: COLLECTION_MODEL_PATH },
            fields: [],
            tags: [],
        };
        sandbox.stub(el, 'repository').get(() => ({
            aem: { getFragmentByPath: sandbox.stub().resolves(fragment) },
        }));
        document.body.appendChild(el);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 80));
        await el.updateComplete;
        expect(el.viewOnlyFragments.length).to.equal(1);
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        expect(selectItemsTable.shadowRoot.textContent).to.include('Collection title');
        el.remove();
    });

    it('typeUppercased returns capitalized type string', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${'cards'}></mas-promotions-items-table>`);
        expect(el.typeUppercased).to.equal('Cards');
    });

    it('typeUppercased works for collections', async () => {
        const el = await fixture(
            html`<mas-promotions-items-table .type=${TABLE_TYPE.COLLECTIONS}></mas-promotions-items-table>`,
        );
        expect(el.typeUppercased).to.equal('Collections');
    });

    it('selectedPaths returns paths from the promotions selection store', async () => {
        Store.promotions.selectedCards.set(['/path/a', '/path/b']);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        expect(el.selectedPaths).to.deep.equal(['/path/a', '/path/b']);
    });

    it('shows Add product offers empty state when offers selection is empty', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        expect(el.shadowRoot.textContent).to.include('Add product offers');
        expect(el.shadowRoot.querySelector('sp-table')).to.be.null;
    });

    it('opens the offer selector tool when the Add offers icon is clicked', async () => {
        const ostStub = sandbox.stub().returns(() => {});
        const previousOst = window.ost;
        window.ost = { openOfferSelectorTool: ostStub };
        const commerceService = document.createElement('mas-commerce-service');
        commerceService.settings = {};
        commerceService.featureFlags = {};
        document.body.appendChild(commerceService);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const addBtn = el.shadowRoot.querySelector('.offers-empty-state sp-button');
        expect(addBtn).to.not.be.null;
        addBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(ostStub.calledOnce).to.be.true;
        window.ost = previousOst;
        commerceService.remove();
    });

    it('shows skeleton rows for the offers table while loading', async () => {
        Store.promotions.selectedOffers.set(['offer-loading']);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        el.viewOnlyLoading = true;
        await el.updateComplete;
        const skeletonRows = el.shadowRoot.querySelectorAll('sp-table-row.skeleton-row');
        expect(skeletonRows.length).to.equal(6);
    });

    it('selectedPaths returns offer ids from the promotions selection store', async () => {
        Store.promotions.selectedOffers.set(['offer-a', 'offer-b']);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        expect(el.selectedPaths).to.deep.equal(['offer-a', 'offer-b']);
    });

    it('typeUppercased works for offers', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        expect(el.typeUppercased).to.equal('Offers');
    });

    it('renders offer metadata columns from cached OST offer tags', async () => {
        Store.promotions.selectedOffers.set(['ffsa-osi']);
        Store.promotions.offerRecordsCache.set(
            'ffsa-osi',
            buildPromotionOfferRecord(
                'ffsa-osi',
                {
                    product_code: 'FFSA',
                    offer_type: 'BASE',
                    planType: 'ABM',
                    customer_segment: 'INDIVIDUAL',
                    market_segments: 'COM',
                    offer_id: 'wcs-offer-1',
                },
                'PA-2511',
            ),
        );
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const rowText = el.shadowRoot.querySelector('.offer-row')?.textContent ?? '';
        expect(rowText).to.include('FFSA');
        expect(rowText).to.include('PA-2511');
        expect(rowText).to.include('BASE');
        expect(rowText).to.include('ABM');
        expect(rowText).to.include('INDIVIDUAL');
        expect(rowText).to.include('COM');
    });

    it('loads offer rows from selectedOffers and offerDataCache', async () => {
        Store.promotions.selectedOffers.set(['offer-cache-1']);
        Store.promotions.offerRecordsCache.set('offer-cache-1', {
            path: 'offer-cache-1',
            id: 'offer-cache-1',
            offerData: { offerId: 'offer-cache-1', product_arrangement_code: 'PA-1' },
            tags: [{ id: 'mas:product_code/cc', title: 'Creative Cloud' }],
            fields: [],
        });
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        expect(el.viewOnlyFragments.length).to.equal(1);
        expect(el.shadowRoot.textContent).to.include('Creative Cloud');
    });

    it('renders promo code count for offer rows', async () => {
        Store.promotions.selectedOffers.set(['offer-1']);
        Store.promotions.offerRecordsCache.set('offer-1', {
            path: 'offer-1',
            id: 'offer-1',
            offerData: { offerId: 'offer-1' },
            tags: [],
            fields: [],
        });
        const el = await fixture(html`
            <mas-promotions-items-table
                .type=${TABLE_TYPE.OFFERS}
                .defaultPromoCode=${'DEFAULT'}
                .geos=${['mas:locale/CA_en', 'mas:locale/US']}
                .promoCodeExceptions=${['offer-1|OVERRIDE|CA_en']}
            ></mas-promotions-items-table>
        `);
        await el.updateComplete;
        expect(el.shadowRoot.textContent).to.include('2');
    });

    it('expands offer row with promo codes grouped by country table', async () => {
        Store.promotions.selectedOffers.set(['offer-expand']);
        Store.promotions.offerRecordsCache.set(
            'offer-expand',
            buildPromotionOfferRecord('offer-expand', { product_code: 'PHSP', offer_id: 'offer-expand' }, 'PA-1'),
        );
        const el = await fixture(html`
            <mas-promotions-items-table
                .type=${TABLE_TYPE.OFFERS}
                .defaultPromoCode=${'DEFAULT-CODE'}
                .geos=${['mas:locale/US', 'mas:locale/CA_en']}
                .promoCodeExceptions=${['offer-expand|US-OVERRIDE|US', 'offer-expand|CA-OVERRIDE|CA_en']}
            ></mas-promotions-items-table>
        `);
        await el.updateComplete;
        const expandBtn = el.shadowRoot.querySelector('.expand-cell sp-action-button');
        expandBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        const detail = el.shadowRoot.querySelector('.detail-row');
        expect(detail.textContent).to.include('Offer ID:');
        expect(detail.textContent).to.include('offer-expand');
        expect(detail.querySelector('.offer-promo-codes-table')).to.not.be.null;
        expect(detail.textContent).to.include('Promo codes');
        expect(detail.textContent).to.include('Countries');
        expect(detail.textContent).to.include('US-OVERRIDE');
        expect(detail.textContent).to.include('CA-OVERRIDE');
        expect(detail.textContent).to.include('US');
        expect(detail.textContent).to.include('CA_en');
    });

    it('collapses an expanded offer row on second expand-toggle click', async () => {
        Store.promotions.selectedOffers.set(['offer-collapse']);
        Store.promotions.offerRecordsCache.set(
            'offer-collapse',
            buildPromotionOfferRecord('offer-collapse', { product_code: 'PHSP', offer_id: 'offer-collapse' }, 'PA-1'),
        );
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const expandBtn = el.shadowRoot.querySelector('.expand-cell sp-action-button');
        expandBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.detail-row')).to.not.be.null;

        expandBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.detail-row')).to.be.null;
    });

    it('toggles expand when clicking the offer row body directly', async () => {
        Store.promotions.selectedOffers.set(['offer-row-click']);
        Store.promotions.offerRecordsCache.set(
            'offer-row-click',
            buildPromotionOfferRecord('offer-row-click', { product_code: 'PHSP', offer_id: 'offer-row-click' }, 'PA-1'),
        );
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const row = el.shadowRoot.querySelector('sp-table-row.offer-row');
        row.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.detail-row')).to.not.be.null;
    });

    it('shows a dash and a substitute-offers table when there are substitutions but no promo code exceptions', async () => {
        Store.promotions.selectedOffers.set(['offer-sub']);
        Store.promotions.offerRecordsCache.set(
            'offer-sub',
            buildPromotionOfferRecord('offer-sub', { product_code: 'PHSP', offer_id: 'offer-sub' }, 'PA-1'),
        );
        Store.promotions.offerRecordsCache.set(
            'offer-sub-replacement',
            buildPromotionOfferRecord(
                'offer-sub-replacement',
                { product_code: 'ABCD', offer_id: 'offer-sub-replacement' },
                'PA-2',
            ),
        );
        const el = await fixture(html`
            <mas-promotions-items-table
                .type=${TABLE_TYPE.OFFERS}
                .geos=${['mas:locale/US']}
                .promoCodeExceptions=${['substitute|offer-sub|offer-sub-replacement|US']}
            ></mas-promotions-items-table>
        `);
        await el.updateComplete;
        const expandBtn = el.shadowRoot.querySelector('.expand-cell sp-action-button');
        expandBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        const detail = el.shadowRoot.querySelector('.detail-row');
        const promoCodesTable = detail.querySelector('.offer-promo-codes-table');
        expect(promoCodesTable.textContent.trim()).to.include('-');
        expect(detail.textContent).to.include('Substitute offers');
        expect(detail.textContent).to.include('US');
    });

    it('renders mnemonic icon for offers tab when cached entry has icon field', async () => {
        Store.promotions.selectedOffers.set(['icon-offer']);
        Store.promotions.offerRecordsCache.set(
            'icon-offer',
            buildPromotionOfferRecord('icon-offer', { product_code: 'PHSP', icon: 'https://example.com/phsp.svg' }, 'PA-1'),
        );
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const img = el.shadowRoot.querySelector('.offer-row img.mnemonic-icon');
        expect(img).to.not.be.null;
        expect(img.src).to.include('example.com/phsp.svg');
    });

    it('does not render Add offers header button when type is OFFERS and offers exist', async () => {
        Store.promotions.selectedOffers.set(['offer-1']);
        Store.promotions.offerRecordsCache.set('offer-1', {
            path: 'offer-1',
            id: 'offer-1',
            offerData: { offerId: 'offer-1' },
            tags: [],
            fields: [],
        });
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const addBtn = [...el.shadowRoot.querySelectorAll('sp-button')].find((b) =>
            b.textContent.trim().includes('Add offers'),
        );
        expect(addBtn).to.not.exist;
    });

    it('does not render Add offers header button for cards type', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const addBtn = [...el.shadowRoot.querySelectorAll('sp-button')].find((b) =>
            b.textContent.trim().includes('Add offers'),
        );
        expect(addBtn).to.not.exist;
    });

    it('removes offer from selectedOffers on Remove from list click', async () => {
        Store.promotions.selectedOffers.set(['offer-remove']);
        Store.promotions.offerRecordsCache.set('offer-remove', {
            path: 'offer-remove',
            id: 'offer-remove',
            offerData: { offerId: 'offer-remove' },
            tags: [],
            fields: [],
        });
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const removeItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('Remove from list'),
        );
        expect(removeItem).to.not.be.undefined;
        removeItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(Store.promotions.selectedOffers.value).to.not.include('offer-remove');
    });

    it('removes offer by OST selector id when offerData.offerId differs', async () => {
        Store.promotions.selectedOffers.set(['phsp-osi']);
        Store.promotions.offerRecordsCache.set('phsp-osi', {
            path: 'phsp-osi',
            id: 'phsp-osi',
            offerData: { offerId: 'wcs-offer-1' },
            tags: [],
            fields: [],
        });
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const removeItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('Remove from list'),
        );
        removeItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(Store.promotions.selectedOffers.value).to.not.include('phsp-osi');
        expect(Store.promotions.offerRecordsCache.has('phsp-osi')).to.be.false;
    });

    it('shows confirmation before pruning orphaned fragments when an offer is removed', async () => {
        const ffsaCard = '/content/dam/mas/ffsa-card';
        const phspCard = '/content/dam/mas/phsp-card';
        Store.promotions.selectedOffers.set(['ffsa-osi', 'phsp-osi']);
        Store.promotions.selectedCards.set([ffsaCard, phspCard]);
        Store.promotions.offerRecordsCache.set(
            'ffsa-osi',
            buildPromotionOfferRecord('ffsa-osi', { product_code: 'FFSA', offer_id: 'wcs-1' }),
        );
        Store.promotions.offerRecordsCache.set(
            'phsp-osi',
            buildPromotionOfferRecord('phsp-osi', { product_code: 'PHSP', offer_id: 'wcs-2' }),
        );
        Store.promotions.cardsByPaths.set(
            new Map([
                [ffsaCard, { path: ffsaCard, tags: [{ id: 'mas:product_code/ffsa', title: 'FFSA' }] }],
                [phspCard, { path: phspCard, tags: [{ id: 'mas:product_code/phsp', title: 'PHSP' }] }],
            ]),
        );
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const removeItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('Remove from list'),
        );
        removeItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.confirmDialogConfig).to.exist;
        expect(el.confirmDialogConfig.title).to.equal('Remove offer');
        expect(el.confirmDialogConfig.message).to.include('1 fragment was selected');
        el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
        await el.updateComplete;
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(Store.promotions.selectedOffers.value).to.deep.equal(['phsp-osi']);
        expect(Store.promotions.selectedCards.value).to.deep.equal([phspCard]);
    });

    it('does not remove offer when confirmation is cancelled', async () => {
        const ffsaCard = '/content/dam/mas/ffsa-card';
        Store.promotions.selectedOffers.set(['ffsa-osi']);
        Store.promotions.selectedCards.set([ffsaCard]);
        Store.promotions.offerRecordsCache.set(
            'ffsa-osi',
            buildPromotionOfferRecord('ffsa-osi', { product_code: 'FFSA', offer_id: 'wcs-1' }),
        );
        Store.promotions.cardsByPaths.set(
            new Map([[ffsaCard, { path: ffsaCard, tags: [{ id: 'mas:product_code/ffsa', title: 'FFSA' }] }]]),
        );
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const removeItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('Remove from list'),
        );
        removeItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('cancel'));
        await el.updateComplete;
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(Store.promotions.selectedOffers.value).to.deep.equal(['ffsa-osi']);
        expect(Store.promotions.selectedCards.value).to.deep.equal([ffsaCard]);
    });

    it('clears all fragments when the last offer is removed after confirmation', async () => {
        const ffsaCard = '/content/dam/mas/ffsa-card';
        Store.promotions.selectedOffers.set(['ffsa-osi']);
        Store.promotions.selectedCards.set([ffsaCard]);
        Store.promotions.selectedCollections.set(['/content/dam/mas/ffsa-col']);
        Store.promotions.offerRecordsCache.set(
            'ffsa-osi',
            buildPromotionOfferRecord('ffsa-osi', { product_code: 'FFSA', offer_id: 'wcs-1' }),
        );
        Store.promotions.cardsByPaths.set(
            new Map([[ffsaCard, { path: ffsaCard, tags: [{ id: 'mas:product_code/ffsa', title: 'FFSA' }] }]]),
        );
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const removeItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('Remove from list'),
        );
        removeItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
        await el.updateComplete;
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(Store.promotions.selectedOffers.value).to.deep.equal([]);
        expect(Store.promotions.selectedCards.value).to.deep.equal([]);
        expect(Store.promotions.selectedCollections.value).to.deep.equal([]);
    });

    it('dispatches promotion-offer-removed after deleting an offer', async () => {
        Store.promotions.selectedOffers.set(['offer-remove']);
        Store.promotions.offerRecordsCache.set('offer-remove', {
            path: 'offer-remove',
            id: 'offer-remove',
            offerData: { offerId: 'offer-remove' },
            tags: [],
            fields: [],
        });
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`);
        await el.updateComplete;
        const removed = sinon.spy();
        el.addEventListener('promotion-offer-removed', removed);
        const removeItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('Remove from list'),
        );
        removeItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(removed.calledOnce).to.be.true;
    });

    it('registers only one selection reactive controller when reparented', async () => {
        const addControllerSpy = sandbox.spy(LitElement.prototype, 'addController');
        const ownControllerCount = () => addControllerSpy.getCalls().filter((call) => call.thisValue === el).length;
        const el = document.createElement('mas-promotions-items-table');
        el.type = TABLE_TYPE.CARDS;
        document.body.appendChild(el);
        await el.updateComplete;
        expect(ownControllerCount()).to.equal(1);
        el.remove();
        document.body.appendChild(el);
        await el.updateComplete;
        expect(ownControllerCount()).to.equal(1);
        el.remove();
        addControllerSpy.restore();
    });

    it('shows skeleton rows while loading', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyLoading = true;
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const skeletonRows = selectItemsTable.shadowRoot.querySelectorAll('sp-table-row.skeleton-row');
        expect(skeletonRows.length).to.equal(8);
    });

    it('renders card rows with title and offer id', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/card-one',
                id: 'card-id',
                title: 'Model Card',
                studioPath: '/content/dam/mas/card-one',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
                offerData: { offerId: 'offer-abc-123' },
            },
        ];
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
        expect(row).to.not.be.null;
        await row.updateComplete;
        expect(row.shadowRoot.textContent).to.include('Model Card');
        expect(row.shadowRoot.textContent).to.include('offer-abc-123');
    });

    it('renders offer cell with mnemonic icon when mnemonicIcon field present', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/card-icon',
                id: 'card-icon-id',
                title: 'Icon Card',
                studioPath: '/content/dam/mas/card-icon',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [{ name: 'mnemonicIcon', values: ['https://example.com/icon.svg'] }],
                tags: [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }],
            },
        ];
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
        await row.updateComplete;
        const img = row.shadowRoot.querySelector('img.mnemonic-icon');
        expect(img).to.not.be.null;
        expect(img.src).to.include('example.com/icon.svg');
    });

    it('renders preview icon for cards with CARD_MODEL_PATH', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/card-preview',
                id: 'preview-card-id',
                title: 'Previewable',
                studioPath: '/content/dam/mas/card-preview',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
        await row.updateComplete;
        const previewIcon = row.shadowRoot.querySelector('sp-icon-preview');
        expect(previewIcon).to.not.be.null;
    });

    it('does not render preview icon for collections', async () => {
        const el = await fixture(
            html`<mas-promotions-items-table .type=${TABLE_TYPE.COLLECTIONS}></mas-promotions-items-table>`,
        );
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/col-noprev',
                id: 'col-noprev-id',
                title: 'No Preview Collection',
                studioPath: '/content/dam/mas/col-noprev',
                status: 'DRAFT',
                model: { path: COLLECTION_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const previewIcon = el.shadowRoot.querySelector('sp-icon-preview');
        expect(previewIcon).to.be.null;
    });

    it('renders No items found when viewOnlyFragments is empty and not loading', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [];
        el.viewOnlyLoading = false;
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        expect(selectItemsTable.shadowRoot.textContent).to.include('No items found.');
    });

    it('removes card from selection store on Remove from list click', async () => {
        Store.promotions.selectedCards.set(['/content/dam/mas/card-remove']);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/card-remove',
                id: 'remove-id',
                title: 'To Remove',
                studioPath: '/content/dam/mas/card-remove',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
        await row.updateComplete;
        const menuItems = row.shadowRoot.querySelectorAll('sp-menu-item');
        const removeItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Remove from list'));
        expect(removeItem).to.not.be.undefined;
        removeItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(Store.promotions.selectedCards.value).to.not.include('/content/dam/mas/card-remove');
    });

    it('removes collection from selection store on Remove from list click', async () => {
        Store.promotions.selectedCollections.set(['/content/dam/mas/col-remove']);
        const el = await fixture(
            html`<mas-promotions-items-table .type=${TABLE_TYPE.COLLECTIONS}></mas-promotions-items-table>`,
        );
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/col-remove',
                id: 'col-remove-id',
                title: 'Col To Remove',
                studioPath: '/content/dam/mas/col-remove',
                status: 'DRAFT',
                model: { path: COLLECTION_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const menuItems = selectItemsTable.shadowRoot.querySelectorAll('sp-menu-item');
        const removeItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Remove from list'));
        expect(removeItem).to.not.be.undefined;
        removeItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(Store.promotions.selectedCollections.value).to.not.include('/content/dam/mas/col-remove');
    });

    it('copies offer id to clipboard on copy button click', async () => {
        let copiedText = null;
        const origClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: (text) => {
                    copiedText = text;
                    return Promise.resolve();
                },
            },
            configurable: true,
        });

        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/card-copy',
                id: 'copy-id',
                title: 'Copy Card',
                studioPath: '/content/dam/mas/card-copy',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
                offerData: { offerId: 'copy-offer-id-xyz' },
            },
        ];
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
        await row.updateComplete;
        const copyBtn = row.shadowRoot.querySelector('sp-action-button[aria-label="Copy Offer ID to clipboard"]');
        expect(copyBtn).to.not.be.null;
        copyBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await new Promise((r) => setTimeout(r, 10));
        expect(copiedText).to.equal('copy-offer-id-xyz');

        if (origClipboard) {
            Object.defineProperty(navigator, 'clipboard', origClipboard);
        }
    });

    it('aborts loading when disconnected before fetch completes', async () => {
        Store.promotions.selectedCards.set(['/content/dam/mas/card-abort']);
        const abortSpy = sandbox.spy(AbortController.prototype, 'abort');
        const el = new MasPromotionsItemsTable();
        el.type = TABLE_TYPE.CARDS;
        sandbox.stub(el, 'repository').get(() => ({
            aem: {
                getFragmentByPath: () =>
                    new Promise((resolve) => {
                        setTimeout(() => resolve(null), 500);
                    }),
            },
        }));
        document.body.appendChild(el);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 5));
        expect(el.viewOnlyLoading).to.be.true;
        el.remove();
        expect(abortSpy.called, 'disconnect should abort the load AbortController').to.be.true;
        expect(el.viewOnlyLoading).to.be.false;
        await new Promise((r) => setTimeout(r, 550));
        expect(el.viewOnlyLoading).to.be.false;
    });

    it('shows Create promo variation when promotion project has a promotion tag', async () => {
        const promotion = new Fragment({
            path: '/content/dam/mas/promotions/black-friday',
            fields: [{ name: 'tags', values: ['mas:promotion/black-friday'], multiple: true }],
        });
        Store.promotions.inEdit.set(new FragmentStore(promotion));

        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/sandbox/en_US/my-card',
                id: 'card-promo-id',
                title: 'Promo Card',
                studioPath: '/content/dam/mas/sandbox/en_US/my-card',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
        const createItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Create promo variation'));
        expect(createItem).to.not.be.null;
        Store.promotions.inEdit.set(null);
    });

    it('hides Create promo variation for paths that are already promo variations', async () => {
        const promotion = new Fragment({
            path: '/content/dam/mas/promotions/black-friday',
            fields: [{ name: 'tags', values: ['mas:promotion/black-friday'], multiple: true }],
        });
        Store.promotions.inEdit.set(new FragmentStore(promotion));

        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card',
                id: 'promo-var-id',
                title: 'Promo Variation',
                studioPath: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [{ id: 'mas:promotion/black-friday' }],
            },
        ];
        await el.updateComplete;
        const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
        const createItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Create promo variation'));
        expect(createItem).to.be.undefined;
        Store.promotions.inEdit.set(null);
    });

    it('builds a search url with surface, default locale and no region when locale is already the default', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/acom/en_US/card-search',
                id: 'search-id',
                title: 'Search Card',
                studioPath: '/content/dam/mas/acom/en_US/card-search',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
        await row.updateComplete;
        const link = Array.from(row.shadowRoot.querySelectorAll('sp-link')).find((l) =>
            l.textContent.trim().includes('View default fragment'),
        );
        expect(link).to.not.be.undefined;
        const hash = link.getAttribute('href').split('#')[1];
        const params = new URLSearchParams(hash);
        expect(params.get('page')).to.equal(PAGE_NAMES.CONTENT);
        expect(params.get('query')).to.equal('search-id');
        expect(params.get('path')).to.equal('acom');
        expect(params.get('locale')).to.equal('en_US');
        expect(params.has('region')).to.be.false;
    });

    it('builds a search url with a region param when the fragment locale differs from the surface default', async () => {
        const el = await fixture(
            html`<mas-promotions-items-table .type=${TABLE_TYPE.COLLECTIONS}></mas-promotions-items-table>`,
        );
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/acom/en_CA/col-search',
                id: 'search-col-id',
                title: 'Search Collection',
                studioPath: '/content/dam/mas/acom/en_CA/col-search',
                status: 'DRAFT',
                model: { path: COLLECTION_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const link = Array.from(selectItemsTable.shadowRoot.querySelectorAll('sp-link')).find((l) =>
            l.textContent.trim().includes('View default collection'),
        );
        expect(link).to.not.be.undefined;
        const hash = link.getAttribute('href').split('#')[1];
        const params = new URLSearchParams(hash);
        expect(params.get('path')).to.equal('acom');
        expect(params.get('locale')).to.equal('en_US');
        expect(params.get('region')).to.equal('en_CA');
    });

    it('returns an empty search url when the item has no id or path', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '',
                id: '',
                title: 'No Id Card',
                studioPath: '',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        await selectItemsTable.updateComplete;
        const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
        await row.updateComplete;
        const link = Array.from(row.shadowRoot.querySelectorAll('sp-link')).find((l) =>
            l.textContent.trim().includes('View default fragment'),
        );
        expect(link).to.not.be.undefined;
        expect(link.getAttribute('href')).to.equal('');
    });

    it('skips reload when selected paths have not changed', async () => {
        Store.promotions.selectedCards.set(['/content/dam/mas/stable']);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/stable',
                id: 'stable',
                title: 'Stable',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        const fragsBefore = el.viewOnlyFragments;
        el.requestUpdate();
        await el.updateComplete;
        expect(el.viewOnlyFragments).to.equal(fragsBefore);
    });

    describe('promo variation create flow', () => {
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
        const promoTag = 'mas:promotion/black-friday';
        const cardFragment = {
            path: defaultPath,
            id: 'card-promo-id',
            title: 'Promo Card',
            studioPath: defaultPath,
            status: 'DRAFT',
            model: { path: CARD_MODEL_PATH },
            fields: [],
            tags: [],
        };

        const setupPromotionInEdit = () => {
            const promotion = new Fragment({
                path: '/content/dam/mas/promotions/black-friday',
                id: 'promo-project-id',
                fields: [{ name: 'tags', values: [promoTag], multiple: true }],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));
        };

        const createPromoVariationAem = (overrides = {}) => {
            const parentFragment = {
                id: 'card-promo-id',
                path: defaultPath,
                title: 'Promo Card',
                model: { id: 'model-1' },
                fields: [{ name: 'title', values: ['Promo Card'] }],
                tags: [{ id: 'mas:product_code/cc' }],
            };
            const createdFragment = { id: 'new-promo-var-id', path: promoVariationPath };
            return {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(parentFragment),
                            getByPath: sandbox.stub().resolves(null),
                            ensureFolderExists: sandbox.stub().resolves(),
                            pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                            ...overrides.fragments,
                        },
                    },
                },
                getCsrfToken: sandbox.stub().resolves('csrf-token'),
                createFragmentCopy: overrides.createFragmentCopy || sandbox.stub().resolves({ id: 'new-promo-var-id' }),
                wait: sandbox.stub().resolves(),
                saveTags: sandbox.stub().resolves(),
            };
        };

        const findCreateMenuItem = (el) => {
            const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
            const row = selectItemsTable?.shadowRoot.querySelector('mas-collapsible-table-row');
            if (!row) return undefined;
            return Array.from(row.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
                item.textContent.trim().includes('Create promo variation'),
            );
        };

        const clickCreateAndWaitForDialog = async (el) => {
            const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
            await selectItemsTable.updateComplete;
            const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
            await row.updateComplete;
            findCreateMenuItem(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 20));
            await el.updateComplete;
        };

        afterEach(() => {
            Store.promotions.inEdit.set(null);
        });

        it('creates promo variation and navigates to editor when user confirms', async () => {
            const router = (await import('../../src/router.js')).default;
            const navStub = sandbox.stub(router, 'navigateToFragmentEditor').resolves();
            const toastStub = sandbox.stub(Events.toast, 'emit');
            setupPromotionInEdit();

            const aem = createPromoVariationAem();
            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem,
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;
            const selectItemsTableEl = el.shadowRoot.querySelector('mas-select-items-table');
            await selectItemsTableEl.updateComplete;
            const rowEl = selectItemsTableEl.shadowRoot.querySelector('mas-collapsible-table-row');
            await rowEl.updateComplete;

            expect(findCreateMenuItem(el)).to.not.be.undefined;
            await clickCreateAndWaitForDialog(el);
            expect(el.promoVariationGeosDialogItem).to.not.be.null;

            el.promoVariationSelectedGeos = ['mas:pzn/country/ar'];
            await el.updateComplete;

            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));

            expect(aem.createFragmentCopy.called).to.be.false;
            expect(el.confirmDialogConfig).to.not.be.null;
            expect(el.confirmDialogConfig.title).to.equal('Create promo variation');

            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));

            expect(aem.createFragmentCopy.calledOnce).to.be.true;
            expect(toastStub.called).to.be.true;
            expect(toastStub.getCalls().some((call) => call.args[0].content === 'Promo variation created')).to.be.true;
            expect(el.existingPromoVariationGeosByPath.has(defaultPath)).to.be.true;
            expect(navStub.calledOnce).to.be.true;
            expect(navStub.firstCall.args[0]).to.equal('new-promo-var-id');
            expect(el.createPromoVariationLoading).to.be.false;
        });

        it('does not create promo variation when user cancels the second confirmation dialog', async () => {
            setupPromotionInEdit();
            const aem = createPromoVariationAem();
            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem,
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);
            el.promoVariationSelectedGeos = ['mas:pzn/country/ar'];
            await el.updateComplete;

            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));

            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));

            expect(aem.createFragmentCopy.called).to.be.false;
        });

        it('does not create promo variation when user cancels the dialog', async () => {
            setupPromotionInEdit();
            const aem = createPromoVariationAem();

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem,
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);
            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));

            expect(aem.createFragmentCopy.called).to.be.false;
            expect(el.promoVariationGeosDialogItem).to.be.null;
        });

        it('opens the geos dialog (not blocked) when a sibling variation already exists, with its geos disabled', async () => {
            setupPromotionInEdit();

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getByPath: sandbox.stub().callsFake((path) =>
                                    path === promoVariationPath
                                        ? Promise.resolve({
                                              id: 'existing-var',
                                              path: promoVariationPath,
                                              fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                                          })
                                        : Promise.resolve(null),
                                ),
                            },
                        },
                    },
                },
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);

            expect(el.promoVariationGeosDialogItem).to.not.be.null;
            expect(el.promoVariationDisabledGeos).to.deep.equal(['mas:pzn/country/ar']);
        });

        it('does not disable any geo because of a sibling with no pznTags (legacy fallback variation)', async () => {
            const promotion = new Fragment({
                path: '/content/dam/mas/promotions/black-friday',
                fields: [
                    { name: 'tags', values: [promoTag], multiple: true },
                    { name: 'geos', values: ['mas:locale/de_AT', 'mas:locale/en_NG'], multiple: true },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getByPath: sandbox
                                    .stub()
                                    .callsFake((path) =>
                                        path === promoVariationPath
                                            ? Promise.resolve({ id: 'existing-var', path: promoVariationPath, fields: [] })
                                            : Promise.resolve(null),
                                    ),
                            },
                        },
                    },
                },
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);

            expect(el.promoVariationDisabledGeos).to.deep.equal([]);
        });

        it('shows Create promo variation when a sibling with no pznTags (legacy variation) already exists', async () => {
            const promotion = new Fragment({
                path: '/content/dam/mas/promotions/black-friday',
                fields: [
                    { name: 'tags', values: [promoTag], multiple: true },
                    { name: 'geos', values: ['mas:locale/de_AT', 'mas:locale/en_NG'], multiple: true },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));
            Store.promotions.selectedCards.set([defaultPath]);

            const el = new MasPromotionsItemsTable();
            el.type = TABLE_TYPE.CARDS;
            sandbox.stub(el, 'repository').get(() => ({
                aem: {
                    getFragmentByPath: sandbox.stub().resolves(cardFragment),
                    sites: {
                        cf: {
                            fragments: {
                                getByPath: sandbox
                                    .stub()
                                    .callsFake((path) =>
                                        path === promoVariationPath
                                            ? Promise.resolve({ id: 'existing-var', path: promoVariationPath, fields: [] })
                                            : Promise.resolve(null),
                                    ),
                            },
                        },
                    },
                },
            }));
            document.body.appendChild(el);
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 80));
            await el.updateComplete;
            const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
            await selectItemsTable.updateComplete;
            const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
            await row.updateComplete;

            const menuItems = Array.from(row.shadowRoot.querySelectorAll('sp-menu-item'));
            expect(menuItems.some((item) => item.textContent.trim().includes('Create promo variation'))).to.be.true;
            el.remove();
            Store.promotions.selectedCards.set([]);
        });

        it('shows Create promo variation when the project still has an unused geo', async () => {
            const promotion = new Fragment({
                path: '/content/dam/mas/promotions/black-friday',
                fields: [
                    { name: 'tags', values: [promoTag], multiple: true },
                    { name: 'geos', values: ['mas:locale/de_AT', 'mas:locale/en_NG'], multiple: true },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            el.existingPromoVariationGeosByPath = new Map([[defaultPath, ['mas:locale/de_AT']]]);
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;
            const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
            await selectItemsTable.updateComplete;
            const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
            await row.updateComplete;

            expect(findCreateMenuItem(el)).to.not.be.undefined;
        });

        it('hides Create promo variation when every project geo and the geo-less slot are already used', async () => {
            const promotion = new Fragment({
                path: '/content/dam/mas/promotions/black-friday',
                fields: [
                    { name: 'tags', values: [promoTag], multiple: true },
                    { name: 'geos', values: ['mas:locale/de_AT', 'mas:locale/en_NG'], multiple: true },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            el.existingPromoVariationGeosByPath = new Map([[defaultPath, ['mas:locale/de_AT', 'mas:locale/en_NG']]]);
            el.existingPromoVariationEmptyGeoPaths = new Set([defaultPath]);
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            expect(findCreateMenuItem(el)).to.be.undefined;
        });

        it('shows Create promo variation for the geo-less slot when every project geo is used but no geo-less variation exists yet', async () => {
            const promotion = new Fragment({
                path: '/content/dam/mas/promotions/black-friday',
                fields: [
                    { name: 'tags', values: [promoTag], multiple: true },
                    { name: 'geos', values: ['mas:locale/de_AT', 'mas:locale/en_NG'], multiple: true },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            el.existingPromoVariationGeosByPath = new Map([[defaultPath, ['mas:locale/de_AT', 'mas:locale/en_NG']]]);
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;
            const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
            await selectItemsTable.updateComplete;
            const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
            await row.updateComplete;

            expect(findCreateMenuItem(el)).to.not.be.undefined;
        });

        it('shows Create promo variation when the only recorded geos are from a legacy variation (empty pznTags)', async () => {
            const promotion = new Fragment({
                path: '/content/dam/mas/promotions/black-friday',
                fields: [
                    { name: 'tags', values: [promoTag], multiple: true },
                    { name: 'geos', values: ['mas:locale/de_AT', 'mas:locale/en_NG'], multiple: true },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            el.existingPromoVariationGeosByPath = new Map([[defaultPath, []]]);
            el.existingPromoVariationEmptyGeoPaths = new Set([defaultPath]);
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;
            const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
            await selectItemsTable.updateComplete;
            const row = selectItemsTable.shadowRoot.querySelector('mas-collapsible-table-row');
            await row.updateComplete;

            expect(findCreateMenuItem(el)).to.not.be.undefined;
        });

        it('creates a geo-less promo variation when nothing is checked and no empty-geo sibling exists', async () => {
            const router = (await import('../../src/router.js')).default;
            const navStub = sandbox.stub(router, 'navigateToFragmentEditor').resolves();
            const toastStub = sandbox.stub(Events.toast, 'emit');
            const promotion = new Fragment({
                path: '/content/dam/mas/promotions/black-friday',
                id: 'promo-project-id',
                fields: [
                    { name: 'tags', values: [promoTag], multiple: true },
                    { name: 'geos', values: ['mas:locale/de_AT', 'mas:locale/en_NG'], multiple: true },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));

            const aem = createPromoVariationAem({
                fragments: {
                    getByPath: sandbox.stub().callsFake((path) =>
                        path === promoVariationPath
                            ? Promise.resolve({
                                  id: 'existing-var',
                                  path: promoVariationPath,
                                  fields: [{ name: 'pznTags', values: ['mas:locale/de_AT'] }],
                              })
                            : Promise.resolve(null),
                    ),
                },
            });
            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem,
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);
            expect(el.promoVariationDisabledGeos).to.deep.equal(['mas:locale/de_AT']);
            expect(el.promoVariationSelectedGeos).to.deep.equal([]);
            expect(el.fragmentHasEmptyGeosVariation).to.be.false;

            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));
            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));

            expect(toastStub.getCalls().some((call) => call.args[0].content?.includes('Select at least one geo'))).to.be.false;
            expect(aem.createFragmentCopy.calledOnce).to.be.true;
            const [fragmentForCopy] = aem.createFragmentCopy.firstCall.args;
            expect(fragmentForCopy.fields.find((field) => field.name === 'pznTags')).to.be.undefined;
            expect(el.existingPromoVariationGeosByPath.get(defaultPath)).to.deep.equal([]);
            expect(navStub.calledOnce).to.be.true;
        });

        it('blocks with a toast when nothing is checked and a geo-less sibling variation already exists', async () => {
            const toastStub = sandbox.stub(Events.toast, 'emit');
            setupPromotionInEdit();

            const aem = createPromoVariationAem({
                fragments: {
                    getByPath: sandbox.stub().callsFake((path) =>
                        path === promoVariationPath
                            ? Promise.resolve({
                                  id: 'existing-var',
                                  path: promoVariationPath,
                                  fields: [{ name: 'title', values: ['Promo Card'] }],
                              })
                            : Promise.resolve(null),
                    ),
                },
            });
            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem,
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);
            expect(el.promoVariationDisabledGeos).to.deep.equal([]);
            expect(el.fragmentHasEmptyGeosVariation).to.be.true;

            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
            await new Promise((r) => setTimeout(r, 20));
            await el.updateComplete;

            expect(aem.createFragmentCopy.called).to.be.false;
            expect(toastStub.getCalls().some((call) => call.args[0].content?.includes('already exists'))).to.be.true;
        });

        it('disables Continue until a geo is checked when a geo-less sibling variation already exists', async () => {
            setupPromotionInEdit();

            const aem = createPromoVariationAem({
                fragments: {
                    getByPath: sandbox.stub().callsFake((path) =>
                        path === promoVariationPath
                            ? Promise.resolve({
                                  id: 'existing-var',
                                  path: promoVariationPath,
                                  fields: [{ name: 'title', values: ['Promo Card'] }],
                              })
                            : Promise.resolve(null),
                    ),
                },
            });
            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem,
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);
            expect(el.fragmentHasEmptyGeosVariation).to.be.true;

            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper.promo-variation-geos-dialog');
            await dialogWrapper.updateComplete;
            const confirmButton = dialogWrapper.shadowRoot.querySelector('sp-button[variant="accent"][slot="button"]');
            expect(confirmButton.disabled).to.be.true;

            el.promoVariationSelectedGeos = ['mas:pzn/country/ar'];
            await el.updateComplete;
            await dialogWrapper.updateComplete;
            expect(confirmButton.disabled).to.be.false;

            el.promoVariationSelectedGeos = [];
            await el.updateComplete;
            await dialogWrapper.updateComplete;
            expect(confirmButton.disabled).to.be.true;
        });

        it('leaves Continue enabled when nothing is checked and there is no geo-less sibling', async () => {
            setupPromotionInEdit();
            const aem = createPromoVariationAem();
            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem,
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);
            expect(el.fragmentHasEmptyGeosVariation).to.be.false;

            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper.promo-variation-geos-dialog');
            await dialogWrapper.updateComplete;
            const confirmButton = dialogWrapper.shadowRoot.querySelector('sp-button[variant="accent"][slot="button"]');
            expect(confirmButton.disabled).to.be.false;
        });

        it('shows lookup-failed toast when checking for an existing promo variation throws', async () => {
            const toastStub = sandbox.stub(Events.toast, 'emit');
            setupPromotionInEdit();

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getByPath: sandbox.stub().rejects(new Error('network down')),
                            },
                        },
                    },
                },
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);

            expect(el.confirmDialogConfig).to.be.null;
            expect(toastStub.calledOnce).to.be.true;
            expect(toastStub.firstCall.args[0].content).to.include('Could not verify');
        });

        it('populates existingPromoVariationsByPath when the repository resolves a promo variation', async () => {
            setupPromotionInEdit();
            Store.promotions.selectedCards.set([defaultPath]);

            const el = new MasPromotionsItemsTable();
            el.type = TABLE_TYPE.CARDS;
            sandbox.stub(el, 'repository').get(() => ({
                aem: {
                    getFragmentByPath: sandbox.stub().resolves({ ...cardFragment }),
                    sites: {
                        cf: {
                            fragments: {
                                getByPath: sandbox.stub().resolves({ id: 'existing-var-id', path: promoVariationPath }),
                            },
                        },
                    },
                },
            }));
            document.body.appendChild(el);
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 80));
            await el.updateComplete;

            expect(el.existingPromoVariationsByPath.get(defaultPath)?.[0]?.id).to.equal('existing-var-id');
            el.remove();
            Store.promotions.selectedCards.set([]);
        });

        it('keeps the previously known promo variation when a re-sync lookup fails transiently', async () => {
            setupPromotionInEdit();
            const otherPath = '/content/dam/mas/sandbox/en_US/other-card';
            const otherFragment = { ...cardFragment, path: otherPath, id: 'other-card-id' };
            const otherTargetPath = buildPromoVariationPathForTag(otherPath, promoTag);
            Store.promotions.selectedCards.set([defaultPath]);

            const el = new MasPromotionsItemsTable();
            el.type = TABLE_TYPE.CARDS;
            let promoVariationLookupCount = 0;
            const getByPathStub = sandbox.stub().callsFake((path) => {
                if (path === promoVariationPath) {
                    promoVariationLookupCount += 1;
                    if (promoVariationLookupCount === 1) {
                        return Promise.resolve({ id: 'existing-var-id', path: promoVariationPath });
                    }
                    return Promise.reject(new Error('network blip'));
                }
                return Promise.resolve(null);
            });
            sandbox.stub(el, 'repository').get(() => ({
                aem: {
                    getFragmentByPath: sandbox
                        .stub()
                        .callsFake((path) => Promise.resolve(path === defaultPath ? { ...cardFragment } : otherFragment)),
                    sites: {
                        cf: {
                            fragments: { getByPath: getByPathStub },
                        },
                    },
                },
            }));
            document.body.appendChild(el);
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 80));
            await el.updateComplete;
            expect(el.existingPromoVariationsByPath.get(defaultPath)?.[0]?.id).to.equal('existing-var-id');

            Store.promotions.selectedCards.set([defaultPath, otherPath]);
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 80));
            await el.updateComplete;

            expect(el.existingPromoVariationsByPath.get(defaultPath)?.[0]?.id).to.equal('existing-var-id');
            el.remove();
            Store.promotions.selectedCards.set([]);
        });

        it('shows error toast when createPromoVariation fails', async () => {
            const toastStub = sandbox.stub(Events.toast, 'emit');
            setupPromotionInEdit();
            const aem = createPromoVariationAem({
                createFragmentCopy: sandbox.stub().rejects(new Error('AEM copy failed')),
            });
            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                refreshFragment: sandbox.stub().resolves(),
                aem,
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);
            el.promoVariationSelectedGeos = ['mas:pzn/country/ar'];
            await el.updateComplete;
            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
            await new Promise((r) => setTimeout(r, 20));
            await el.updateComplete;
            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
            await new Promise((r) => setTimeout(r, 20));
            await el.updateComplete;

            expect(aem.createFragmentCopy.calledOnce).to.be.true;
            expect(toastStub.getCalls().some((call) => call.args[0].content === 'AEM copy failed')).to.be.true;
            expect(el.createPromoVariationLoading).to.be.false;
        });

        it('clears existing promo paths when promotion project has no promotion tag', async () => {
            const promotion = new Fragment({
                path: '/content/dam/mas/promotions/no-tag',
                fields: [{ name: 'tags', values: [], multiple: true }],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));
            Store.promotions.selectedCards.set([defaultPath]);

            const el = new MasPromotionsItemsTable();
            el.type = TABLE_TYPE.CARDS;
            const fragment = { ...cardFragment };
            sandbox.stub(el, 'repository').get(() => ({
                aem: { getFragmentByPath: sandbox.stub().resolves(fragment) },
            }));
            document.body.appendChild(el);
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 80));
            await el.updateComplete;

            expect(el.existingPromoVariationGeosByPath.size).to.equal(0);
            el.remove();
            Store.promotions.selectedCards.set([]);
        });
    });

    describe('disconnectedCallback cleanup', () => {
        it('resolves pending offer-removal dialog promise with false when component disconnects', async () => {
            const ffsaCard = '/content/dam/mas/ffsa-card';
            Store.promotions.selectedOffers.set(['ffsa-osi']);
            Store.promotions.selectedCards.set([ffsaCard]);
            Store.promotions.offerRecordsCache.set(
                'ffsa-osi',
                buildPromotionOfferRecord('ffsa-osi', { product_code: 'FFSA', offer_id: 'wcs-1' }),
            );
            Store.promotions.cardsByPaths.set(
                new Map([[ffsaCard, { path: ffsaCard, tags: [{ id: 'mas:product_code/ffsa', title: 'FFSA' }] }]]),
            );
            const el = await fixture(
                html`<mas-promotions-items-table .type=${TABLE_TYPE.OFFERS}></mas-promotions-items-table>`,
            );
            await el.updateComplete;

            const removeItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
                item.textContent.trim().includes('Remove from list'),
            );
            removeItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(el.confirmDialogConfig).to.exist;

            el.disconnectedCallback();

            expect(el.confirmDialogConfig).to.be.null;
            expect(el.offerRemovalDialogOpen).to.be.false;
            expect(Store.promotions.selectedOffers.value).to.deep.equal(['ffsa-osi']);
        });
    });
});
