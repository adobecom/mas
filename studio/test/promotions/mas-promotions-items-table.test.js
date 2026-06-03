import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, TABLE_TYPE } from '../../src/constants.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Fragment } from '../../src/aem/fragment.js';
import Events from '../../src/events.js';
import '../../src/swc.js';
import MasPromotionsItemsTable from '../../src/promotions/mas-promotions-items-table.js';

describe('MasPromotionsItemsTable', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        setItemsSelectionStore(Store.promotions);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
    });

    afterEach(async () => {
        fixtureCleanup();
        await new Promise((resolve) => setTimeout(resolve, 350));
        sandbox.restore();
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
        setItemsSelectionStore(null);
    });

    it('exposes card column definitions when type is cards', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        expect(el.tableColumns.map((c) => c.key)).to.deep.equal([
            'offer',
            'fragmentTitle',
            'offerId',
            'path',
            'itemType',
            'status',
            'actions',
            'preview',
        ]);
    });

    it('exposes collection column definitions when type is collections', async () => {
        const el = await fixture(
            html`<mas-promotions-items-table .type=${TABLE_TYPE.COLLECTIONS}></mas-promotions-items-table>`,
        );
        expect(el.tableColumns.map((c) => c.key)).to.deep.equal(['collectionTitle', 'path', 'status', 'actions', 'preview']);
    });

    it('shows empty state when there is no repository and paths are selected', async () => {
        Store.promotions.selectedCards.set(['/some/path']);
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 0));
        await el.updateComplete;
        expect(el.shadowRoot.textContent).to.include('No items found');
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
        expect(el.shadowRoot.textContent).to.include('Collection title');
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

    it('shows skeleton rows while loading', async () => {
        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyLoading = true;
        await el.updateComplete;
        const skeletonRows = el.shadowRoot.querySelectorAll('sp-table-row.skeleton-row');
        expect(skeletonRows.length).to.equal(6);
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
        expect(el.shadowRoot.textContent).to.include('Model Card');
        expect(el.shadowRoot.textContent).to.include('offer-abc-123');
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
                getFieldValue: (name) => (name === 'mnemonicIcon' ? 'https://example.com/icon.svg' : null),
                tags: [{ id: 'mas:product_code/photoshop', title: 'Photoshop' }],
            },
        ];
        await el.updateComplete;
        const img = el.shadowRoot.querySelector('img.mnemonic-icon');
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
        const previewIcon = el.shadowRoot.querySelector('sp-icon-preview');
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
        expect(el.shadowRoot.textContent).to.include('No items found');
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
        const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
        const removeItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Remove from list'));
        expect(removeItem).to.not.be.null;
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
        const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
        const removeItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Remove from list'));
        expect(removeItem).to.not.be.null;
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
        const copyBtn = el.shadowRoot.querySelector('sp-action-button[aria-label="Copy Offer ID to clipboard"]');
        expect(copyBtn).to.not.be.null;
        copyBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await new Promise((r) => setTimeout(r, 10));
        expect(copiedText).to.equal('copy-offer-id-xyz');

        if (origClipboard) {
            Object.defineProperty(navigator, 'clipboard', origClipboard);
        }
    });

    it('navigates to fragment editor on Edit fragment click', async () => {
        const router = (await import('../../src/router.js')).default;
        const navStub = sandbox.stub(router, 'navigateToFragmentEditor').resolves();
        Store.promotions.promotionId.set('promo-to-clear');

        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        el.viewOnlyFragments = [
            {
                path: '/content/dam/mas/acom/en_US/card-nav',
                id: 'nav-id',
                title: 'Nav Card',
                studioPath: '/content/dam/mas/acom/en_US/card-nav',
                status: 'DRAFT',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
        const editItem = Array.from(menuItems).find((item) => item.textContent.trim().includes('Edit fragment'));
        expect(editItem).to.not.be.null;
        editItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await new Promise((r) => setTimeout(r, 10));
        expect(Store.promotions.promotionId.get()).to.equal('promo-to-clear');
        expect(navStub.calledOnce).to.be.true;
        expect(navStub.firstCall.args[0]).to.equal('nav-id');
    });

    it('opens promo variation editor when Edit fragment is clicked and variation exists for the project', async () => {
        const router = (await import('../../src/router.js')).default;
        const navStub = sandbox.stub(router, 'navigateToFragmentEditor').resolves();
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
        const promotion = new Fragment({
            path: '/content/dam/mas/promotions/black-friday',
            fields: [{ name: 'tags', values: ['mas:promotion/black-friday'], multiple: true }],
        });
        Store.promotions.inEdit.set(new FragmentStore(promotion));

        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        sandbox.stub(el, 'repository').get(() => ({
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().withArgs(promoVariationPath).resolves({
                                id: 'promo-var-id',
                                path: promoVariationPath,
                            }),
                        },
                    },
                },
            },
        }));
        el.viewOnlyFragments = [
            {
                path: defaultPath,
                id: 'default-card-id',
                title: 'Default Card',
                studioPath: defaultPath,
                status: 'PUBLISHED',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const editItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('Edit fragment'),
        );
        editItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await new Promise((r) => setTimeout(r, 10));
        expect(navStub.calledOnce).to.be.true;
        expect(navStub.firstCall.args[0]).to.equal('promo-var-id');
        Store.promotions.inEdit.set(null);
    });

    it('opens default fragment editor when no promo variation exists for the project', async () => {
        const router = (await import('../../src/router.js')).default;
        const navStub = sandbox.stub(router, 'navigateToFragmentEditor').resolves();
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
        const promotion = new Fragment({
            path: '/content/dam/mas/promotions/black-friday',
            fields: [{ name: 'tags', values: ['mas:promotion/black-friday'], multiple: true }],
        });
        Store.promotions.inEdit.set(new FragmentStore(promotion));

        const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
        sandbox.stub(el, 'repository').get(() => ({
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().withArgs(promoVariationPath).resolves(null),
                        },
                    },
                },
            },
        }));
        el.viewOnlyFragments = [
            {
                path: defaultPath,
                id: 'default-card-id',
                title: 'Default Card',
                studioPath: defaultPath,
                status: 'PUBLISHED',
                model: { path: CARD_MODEL_PATH },
                fields: [],
                tags: [],
            },
        ];
        await el.updateComplete;
        const editItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('Edit fragment'),
        );
        editItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await new Promise((r) => setTimeout(r, 10));
        expect(navStub.calledOnce).to.be.true;
        expect(navStub.firstCall.args[0]).to.equal('default-card-id');
        Store.promotions.inEdit.set(null);
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

    it('shows View promo variation instead of Create when a variation already exists for the project', async () => {
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
        const promotion = new Fragment({
            path: '/content/dam/mas/promotions/black-friday',
            fields: [{ name: 'tags', values: ['mas:promotion/black-friday'], multiple: true }],
        });
        Store.promotions.inEdit.set(new FragmentStore(promotion));
        Store.promotions.selectedCards.set([defaultPath]);

        const el = new MasPromotionsItemsTable();
        el.type = TABLE_TYPE.CARDS;
        const fragment = {
            path: defaultPath,
            id: 'card-promo-id',
            title: 'Promo Card',
            studioPath: defaultPath,
            status: 'DRAFT',
            model: { path: CARD_MODEL_PATH },
            fields: [],
            tags: [],
        };
        sandbox.stub(el, 'repository').get(() => ({
            aem: {
                getFragmentByPath: sandbox.stub().resolves(fragment),
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().withArgs(promoVariationPath).resolves({
                                id: 'promo-var-id',
                                path: promoVariationPath,
                            }),
                        },
                    },
                },
            },
        }));
        document.body.appendChild(el);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 80));
        await el.updateComplete;

        const menuItems = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item'));
        expect(menuItems.some((item) => item.textContent.trim().includes('Create promo variation'))).to.be.false;
        expect(menuItems.some((item) => item.textContent.trim().includes('View promo variation'))).to.be.true;
        el.remove();
        Store.promotions.inEdit.set(null);
        Store.promotions.selectedCards.set([]);
    });

    it('opens promo variation editor when View promo variation is clicked', async () => {
        const router = (await import('../../src/router.js')).default;
        const navStub = sandbox.stub(router, 'navigateToFragmentEditor').resolves();
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
        const promotion = new Fragment({
            path: '/content/dam/mas/promotions/black-friday',
            fields: [{ name: 'tags', values: ['mas:promotion/black-friday'], multiple: true }],
        });
        Store.promotions.inEdit.set(new FragmentStore(promotion));
        Store.promotions.selectedCards.set([defaultPath]);

        const el = new MasPromotionsItemsTable();
        el.type = TABLE_TYPE.CARDS;
        const fragment = {
            path: defaultPath,
            id: 'card-promo-id',
            title: 'Promo Card',
            studioPath: defaultPath,
            status: 'DRAFT',
            model: { path: CARD_MODEL_PATH },
            fields: [],
            tags: [],
        };
        sandbox.stub(el, 'repository').get(() => ({
            aem: {
                getFragmentByPath: sandbox.stub().resolves(fragment),
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().withArgs(promoVariationPath).resolves({
                                id: 'promo-var-id',
                                path: promoVariationPath,
                            }),
                        },
                    },
                },
            },
        }));
        document.body.appendChild(el);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 80));
        await el.updateComplete;

        const viewItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('View promo variation'),
        );
        viewItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await new Promise((r) => setTimeout(r, 10));
        expect(navStub.calledOnce).to.be.true;
        expect(navStub.firstCall.args[0]).to.equal('promo-var-id');
        el.remove();
        Store.promotions.inEdit.set(null);
        Store.promotions.selectedCards.set([]);
    });

    it('shows a missing-variation message when View promo variation is clicked but variation was removed', async () => {
        const toastStub = sandbox.stub(Events.toast, 'emit');
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
        const promotion = new Fragment({
            path: '/content/dam/mas/promotions/black-friday',
            fields: [{ name: 'tags', values: ['mas:promotion/black-friday'], multiple: true }],
        });
        Store.promotions.inEdit.set(new FragmentStore(promotion));
        Store.promotions.selectedCards.set([defaultPath]);

        const el = new MasPromotionsItemsTable();
        el.type = TABLE_TYPE.CARDS;
        const fragment = {
            path: defaultPath,
            id: 'card-promo-id',
            title: 'Promo Card',
            studioPath: defaultPath,
            status: 'DRAFT',
            model: { path: CARD_MODEL_PATH },
            fields: [],
            tags: [],
        };
        let promoPathLookupCount = 0;
        sandbox.stub(el, 'repository').get(() => ({
            aem: {
                getFragmentByPath: sandbox.stub().resolves(fragment),
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().callsFake((path) => {
                                if (path !== promoVariationPath) return Promise.resolve(null);
                                promoPathLookupCount += 1;
                                if (promoPathLookupCount === 1) {
                                    return Promise.resolve({ id: 'promo-var-id', path: promoVariationPath });
                                }
                                return Promise.resolve(null);
                            }),
                        },
                    },
                },
            },
        }));
        document.body.appendChild(el);
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 80));
        await el.updateComplete;

        const viewItem = Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
            item.textContent.trim().includes('View promo variation'),
        );
        viewItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await new Promise((r) => setTimeout(r, 10));
        expect(toastStub.calledOnce).to.be.true;
        expect(toastStub.firstCall.args[0].content).to.include('could not be found');
        el.remove();
        Store.promotions.inEdit.set(null);
        Store.promotions.selectedCards.set([]);
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

        const findCreateMenuItem = (el) =>
            Array.from(el.shadowRoot.querySelectorAll('sp-menu-item')).find((item) =>
                item.textContent.trim().includes('Create promo variation'),
            );

        const clickCreateAndWaitForDialog = async (el) => {
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

            const created = { id: 'new-promo-var-id', path: promoVariationPath };
            const createStub = sandbox.stub().resolves(created);
            const getByPathStub = sandbox.stub().resolves(null);

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                createPromoVariation: createStub,
                aem: { sites: { cf: { fragments: { getByPath: getByPathStub } } } },
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            expect(findCreateMenuItem(el)).to.not.be.undefined;
            await clickCreateAndWaitForDialog(el);
            expect(el.confirmDialogConfig).to.not.be.null;
            expect(el.confirmDialogConfig.title).to.equal('Create promo variation');

            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));

            expect(createStub.calledOnceWith('card-promo-id', promoTag)).to.be.true;
            expect(toastStub.called).to.be.true;
            expect(toastStub.getCalls().some((call) => call.args[0].content === 'Promo variation created')).to.be.true;
            expect(el.existingPromoVariationDefaultPaths.has(defaultPath)).to.be.true;
            expect(navStub.calledOnce).to.be.true;
            expect(navStub.firstCall.args[0]).to.equal('new-promo-var-id');
            expect(el.createPromoVariationLoading).to.be.false;
        });

        it('does not create promo variation when user cancels the dialog', async () => {
            setupPromotionInEdit();
            const createStub = sandbox.stub().resolves({ id: 'x', path: promoVariationPath });

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                createPromoVariation: createStub,
                aem: { sites: { cf: { fragments: { getByPath: sandbox.stub().resolves(null) } } } },
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);
            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));

            expect(createStub.called).to.be.false;
        });

        it('shows already-exists toast when variation is present at target path before confirm', async () => {
            const toastStub = sandbox.stub(Events.toast, 'emit');
            setupPromotionInEdit();
            const createStub = sandbox.stub().resolves({ id: 'x', path: promoVariationPath });

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                createPromoVariation: createStub,
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getByPath: sandbox.stub().withArgs(promoVariationPath).resolves({
                                    id: 'existing-var',
                                    path: promoVariationPath,
                                }),
                            },
                        },
                    },
                },
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);

            expect(createStub.called).to.be.false;
            expect(el.confirmDialogConfig).to.be.null;
            expect(toastStub.calledOnce).to.be.true;
            expect(toastStub.firstCall.args[0].content).to.include('already exists');
        });

        it('shows error toast when createPromoVariation fails', async () => {
            const toastStub = sandbox.stub(Events.toast, 'emit');
            setupPromotionInEdit();
            const createStub = sandbox.stub().rejects(new Error('AEM copy failed'));

            const el = await fixture(html`<mas-promotions-items-table .type=${TABLE_TYPE.CARDS}></mas-promotions-items-table>`);
            sandbox.stub(el, 'repository').get(() => ({
                createPromoVariation: createStub,
                aem: { sites: { cf: { fragments: { getByPath: sandbox.stub().resolves(null) } } } },
            }));
            el.viewOnlyFragments = [cardFragment];
            await el.updateComplete;

            await clickCreateAndWaitForDialog(el);
            el.shadowRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
            await new Promise((r) => setTimeout(r, 20));
            await el.updateComplete;

            expect(createStub.calledOnce).to.be.true;
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

            expect(el.existingPromoVariationDefaultPaths.size).to.equal(0);
            el.remove();
            Store.promotions.selectedCards.set([]);
        });
    });
});
