import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import MasPromotionsEditor from '../../src/promotions/mas-promotions-editor.js';
import { Promotion } from '../../src/aem/promotion.js';
import { CARD_MODEL_PATH, EVENT_OST_OFFER_SELECT, PAGE_NAMES, TABLE_TYPE, TAG_PROMOTION_PREFIX } from '../../src/constants.js';
import { normalizeKey, UserFriendlyError } from '../../src/utils.js';
import { buildPromotionTagPath, serializePromotionSurfacesForAem } from '../../src/promotions/promotion-editor-utils.js';
import { makeSearchStub as makeSharedSearchStub, stubAemTagQueryFetch } from '../helpers/aem-tag-fetch.js';
import { resetTagCache } from '../helpers/tag-cache.js';
import '@spectrum-web-components/tabs/sp-tab.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';

function makeFragmentData(overrides = {}) {
    return {
        id: overrides.id ?? null,
        title: overrides.title ?? '',
        path: overrides.path ?? '/content/dam/mas/promotions/test',
        fields: overrides.fields ?? [
            { name: 'title', type: 'text', values: [overrides.title ?? ''] },
            { name: 'promoCode', type: 'text', values: [''] },
            { name: 'startDate', values: [overrides.startDate ?? ''] },
            { name: 'endDate', values: [overrides.endDate ?? ''] },
            { name: 'tags', values: [] },
            { name: 'surfaces', type: 'text', multiple: false, values: overrides.surfaces ?? [] },
            { name: 'geos', type: 'tag', multiple: true, values: overrides.geos ?? [] },
            { name: 'fragments', type: 'content-fragment', multiple: true, values: overrides.fragments ?? [] },
        ],
        tags: overrides.tags ?? [],
        etag: '"etag"',
        status: overrides.status ?? 'DRAFT',
    };
}

function makePromotion(overrides = {}) {
    return new Promotion(makeFragmentData(overrides));
}

function getPromotionQuickActions(el) {
    return el.renderRoot.querySelector('mas-quick-actions');
}

function getPromotionQuickActionTitles(el) {
    const quickActions = getPromotionQuickActions(el);
    if (!quickActions) return [];
    return [...quickActions.shadowRoot.querySelectorAll('sp-action-button')].map((button) => button.title);
}

function clickPromotionQuickAction(el, title) {
    const quickActions = getPromotionQuickActions(el);
    const button = [...quickActions.shadowRoot.querySelectorAll('sp-action-button')].find((b) => b.title === title);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

function isPromotionQuickActionDisabled(el, title) {
    const quickActions = getPromotionQuickActions(el);
    const button = [...quickActions.shadowRoot.querySelectorAll('sp-action-button')].find((b) => b.title === title);
    return button.disabled === true || button.hasAttribute('disabled');
}

describe('MasPromotionsEditor', () => {
    let sandbox;
    let originalInEdit;
    let originalSelectedCards;
    let originalSelectedOffers;
    let originalSelectedCollections;
    let originalProfile;
    let originalUsers;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalInEdit = Store.promotions.inEdit.get();
        originalSelectedCards = [...Store.promotions.selectedCards.value];
        originalSelectedOffers = [...Store.promotions.selectedOffers.value];
        originalSelectedCollections = [...Store.promotions.selectedCollections.value];
        originalProfile = structuredClone(Store.profile.get());
        originalUsers = structuredClone(Store.users.get());
        Store.promotions.inEdit.set(null);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedOffers.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.promotionId.set(null);
        // Default to a promotions editor so mutating UI renders; viewer cases override this.
        Store.profile.set({ email: 'editor@adobe.com' });
        Store.users.set([{ userPrincipalName: 'editor@adobe.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        setItemsSelectionStore(Store.promotions);
    });

    afterEach(async () => {
        const editors = [...document.querySelectorAll('mas-promotions-editor')];
        for (const el of editors) {
            el.remove();
            await el.updateComplete;
        }
        await flushPromises();
        sandbox.restore();
        Store.promotions.inEdit.set(originalInEdit);
        Store.promotions.selectedCards.set(originalSelectedCards);
        Store.promotions.selectedOffers.set(originalSelectedOffers);
        Store.promotions.selectedCollections.set(originalSelectedCollections);
        Store.promotions.promotionId.set(null);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        setItemsSelectionStore(null);
    });

    async function flushPromises() {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }

    async function waitForEditorConnect(el) {
        await el.updateComplete;
        await flushPromises();
        await flushPromises();
    }

    async function mountEditor() {
        const el = new MasPromotionsEditor();
        sandbox.stub(el, 'repository').get(() => null);
        document.body.appendChild(el);
        await waitForEditorConnect(el);
        return el;
    }

    function makeSearchStub(itemsByFolder = {}) {
        return makeSharedSearchStub(sandbox, itemsByFolder);
    }

    function makeRepo(overrides = {}) {
        return {
            getPromotionsPath: () => '/content/dam/mas/promotions',
            createFragment: sandbox.stub().resolves(makePromotion({ id: 'created-id', title: 'T' })),
            saveFragment: sandbox.stub().callsFake((store) => Promise.resolve(store.get())),
            publishFragment: sandbox.stub().resolves(true),
            unpublishFragment: sandbox.stub().resolves(true),
            searchFragments: sandbox.stub(),
            loadAllCollections: sandbox.stub(),
            getCollectionPathsForSurfaces: sandbox.stub().resolves(new Set()),
            operation: { set: sandbox.stub() },
            processError: sandbox.stub(),
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(null),
                            publish: sandbox.stub().resolves(),
                            publishFragments: sandbox.stub().resolves(),
                            getWithEtag: sandbox.stub(),
                            search: makeSearchStub(),
                        },
                    },
                },
                getFragmentByPath: null,
                tags: {
                    create: sandbox.stub().resolves(),
                },
            },
            ...overrides,
        };
    }

    async function mountEditorWithRepo(repoOverrides = {}) {
        const repo = makeRepo(repoOverrides);
        const el = new MasPromotionsEditor();
        sandbox.stub(el, 'repository').get(() => repo);
        document.body.appendChild(el);
        await el.updateComplete;
        return { el, repo };
    }

    async function fillValidFields(el) {
        el.fragmentStore.updateField('title', ['Test Promotion']);
        el.fragmentStore.updateField('promoCode', ['TEST-PROMO']);
        el.fragmentStore.updateField('startDate', ['2024-01-01T00:00:00.000Z']);
        el.fragmentStore.updateField('endDate', ['2024-12-31T00:00:00.000Z']);
        el.fragmentStore.updateField('tags', ['mas:promotion/code-test']);
        el.fragmentStore.updateField('geos', ['mas:locale/us']);
        el.fragmentStore.updateField('surfaces', ['sandbox']);
        Store.promotions.selectedCards.set(['/some/card']);
        await el.updateComplete;
    }

    describe('selectedItemsCount', () => {
        it('sums selected offers, cards and collections from the promotions store', async () => {
            const el = await mountEditor();
            Store.promotions.selectedOffers.set(['offer-1']);
            Store.promotions.selectedCards.set(['/c1']);
            Store.promotions.selectedCollections.set(['/col1', '/col2']);
            await el.updateComplete;
            expect(el.selectedItemsCount).to.equal(4);
        });
    });

    describe('promotion items empty state', () => {
        it('renders Offers and Fragments tabs with add product offers empty state by default', async () => {
            const el = await mountEditor();
            await el.updateComplete;
            expect(el.showSelectedEmptyState).to.be.true;
            expect(el.renderRoot.textContent).to.include('Add product offers');
            expect(el.renderRoot.textContent).to.include('Offers (0)');
            expect(el.renderRoot.textContent).to.include('Fragments (0)');
        });

        it('shows select offers first message on Fragments tab', async () => {
            const el = await mountEditor();
            el.promotionEmptyItemsTab = TABLE_TYPE.CARDS;
            await el.updateComplete;
            expect(el.renderRoot.textContent).to.include('Select offers first');
            expect(el.renderRoot.textContent).to.include('Fragments will be generated automatically once offers are selected.');
        });

        it('disables fragments edit and manage promo codes until an offer is selected', async () => {
            const el = await mountEditor();
            el.promotionEmptyItemsTab = TABLE_TYPE.CARDS;
            await el.updateComplete;
            expect(el.canEditPromotionItemsInEmptyState).to.be.false;
            expect(el.canManagePromoCodesInEmptyState).to.be.false;
            const editBtn = el.renderRoot.querySelector('.promotion-empty-actions sp-action-button');
            expect(editBtn?.hasAttribute('disabled')).to.be.true;
        });

        it('shows Add offer for offers on Offers tab and Edit for fragments on Fragments tab', async () => {
            const el = await mountEditor();
            Store.promotions.selectedOffers.set(['offer-1']);
            el.promotionEmptyItemsTab = TABLE_TYPE.OFFERS;
            await el.updateComplete;
            const offersToolbar = el.renderRoot.querySelector('.promotion-empty-actions');
            expect(offersToolbar.textContent).to.include('Add offer');
            expect(offersToolbar.textContent).to.not.include('Add fragments');
            el.promotionEmptyItemsTab = TABLE_TYPE.CARDS;
            await el.updateComplete;
            expect(el.renderRoot.querySelector('.promotion-empty-actions').textContent).to.include('Edit');
        });

        it('opens items picker overlay from dashed add fragments button when surfaces exist', async () => {
            const { el, repo } = await mountEditorWithRepo();
            el.fragmentStore.updateField('surfaces', ['sandbox']);
            Store.promotions.selectedOffers.set(['offer-1']);
            el.promotionEmptyItemsTab = TABLE_TYPE.CARDS;
            await el.updateComplete;
            const panelButton = el.renderRoot.querySelector('.promotion-empty-panel sp-button');
            panelButton.click();
            await el.updateComplete;
            expect(el.renderRoot.querySelector('#add-promotion-items-overlay').open).to.equal('click');
        });

        it('keeps empty state and picker open after selecting a fragment before confirm', async () => {
            const { el } = await mountEditorWithRepo();
            el.fragmentStore.updateField('surfaces', ['sandbox']);
            Store.promotions.selectedOffers.set(['offer-1']);
            el.promotionEmptyItemsTab = TABLE_TYPE.CARDS;
            await el.updateComplete;
            el.renderRoot.querySelector('.promotion-empty-panel sp-button').click();
            await el.updateComplete;
            Store.promotions.selectedCards.set(['/content/dam/mas/sandbox/en_US/card']);
            await el.updateComplete;
            expect(el.promotionItemsPickerOpen).to.be.true;
            expect(el.showSelectedEmptyState).to.be.true;
            expect(el.renderRoot.textContent).to.not.include('Selected items');
            expect(el.renderRoot.querySelector('#add-promotion-items-overlay').open).to.equal('click');
        });

        it('stays in empty state after an offer is selected until fragments are added', async () => {
            const el = await mountEditor();
            Store.promotions.selectedOffers.set(['offer-1']);
            await el.updateComplete;
            expect(el.showSelectedEmptyState).to.be.true;
            expect(el.renderRoot.textContent).to.not.include('Selected items');
        });

        it('shows add fragments dashed empty state on Fragments tab when offers exist', async () => {
            const el = await mountEditor();
            Store.promotions.selectedOffers.set(['offer-1']);
            el.promotionEmptyItemsTab = TABLE_TYPE.CARDS;
            await el.updateComplete;
            expect(el.renderRoot.textContent).to.include('Add fragments');
            expect(el.renderRoot.textContent).to.include('Select cards and collections this promotion applies to.');
            expect(el.renderRoot.textContent).to.not.include('Select offers first');
        });

        it('keeps selected fragments after confirming the item picker', async () => {
            const { el } = await mountEditorWithRepo();
            el.fragmentStore.updateField('surfaces', ['sandbox']);
            Store.promotions.selectedOffers.set(['offer-1']);
            el.promotionEmptyItemsTab = TABLE_TYPE.CARDS;
            await el.updateComplete;
            el.renderRoot.querySelector('.promotion-empty-panel sp-button').click();
            await el.updateComplete;
            const selectedPaths = ['/content/dam/mas/sandbox/en_US/card-a', '/content/dam/mas/sandbox/en_US/card-b'];
            Store.promotions.selectedCards.set(selectedPaths);
            const dialog = el.renderRoot.querySelector('.add-items-dialog');
            dialog.dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            dialog.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
            dialog.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(Store.promotions.selectedCards.value).to.deep.equal(selectedPaths);
            expect(el.showSelectedEmptyState).to.be.false;
            expect(el.renderRoot.textContent).to.include('Selected items');
            expect(el.selectedItemsViewTab).to.equal(TABLE_TYPE.CARDS);
            const selector = el.renderRoot.querySelector('mas-items-selector[view-only]');
            expect(selector?.selectedTab).to.equal(TABLE_TYPE.CARDS);
            expect(el.fragment.getFieldValues('fragments')).to.deep.equal(selectedPaths);
        });

        it('leaves empty state after fragments are confirmed outside the picker', async () => {
            const el = await mountEditor();
            Store.promotions.selectedOffers.set(['offer-1']);
            Store.promotions.selectedCards.set(['/content/dam/mas/sandbox/en_US/card']);
            await el.updateComplete;
            expect(el.promotionItemsPickerOpen).to.be.false;
            expect(el.showSelectedEmptyState).to.be.false;
            expect(el.renderRoot.textContent).to.include('Selected items');
        });

        it('adds offer from OST when items table is not mounted in empty state', async () => {
            const el = await mountEditor();
            await el.updateComplete;
            document.dispatchEvent(
                new CustomEvent(EVENT_OST_OFFER_SELECT, {
                    detail: { offerSelectorId: 'ffsa-osi', offer: { product_code: 'FFSA', offer_id: 'wcs-1' } },
                    bubbles: true,
                    composed: true,
                }),
            );
            await new Promise((resolve) => setTimeout(resolve, 50));
            await el.updateComplete;
            expect(Store.promotions.selectedOffers.value).to.include('ffsa-osi');
            expect(el.fragment.getFieldValues('offers')).to.include('ffsa-osi');
            expect(el.fragment.hasChanges).to.be.true;
            expect(el.showSelectedEmptyState).to.be.true;
            expect(el.promotionEmptyItemsTab).to.equal(TABLE_TYPE.OFFERS);
            const offersTable = el.renderRoot.querySelector('mas-promotions-items-table');
            expect(offersTable).to.exist;
            expect(offersTable.type).to.equal(TABLE_TYPE.OFFERS);
        });

        it('persists offer ids to fragment offers field via updateField', async () => {
            const { buildPromotionOffersFieldValues } = await import('../../src/promotions/promotion-editor-utils.js');
            const el = await mountEditor();
            await el.updateComplete;
            el.fragmentStore.updateField('offers', buildPromotionOffersFieldValues(el.fragment, ['ffsa-osi']));
            expect(el.fragment.getFieldValues('offers')).to.include('ffsa-osi');
        });
    });

    describe('connectedCallback - new promotion', () => {
        it('initializes a new promotion when no promotionId is set', async () => {
            const el = await mountEditor();
            expect(el.isNewPromotion).to.be.true;
            expect(el.fragment).to.not.be.null;
            expect(el.showSelectedEmptyState).to.be.true;
        });

        it('resets selection stores on connect regardless of prior state', async () => {
            Store.promotions.selectedCards.set(['/a', '/b']);
            Store.promotions.selectedOffers.set(['offer-a']);
            const el = await mountEditor();
            expect(Store.promotions.selectedCards.value).to.deep.equal([]);
            expect(Store.promotions.selectedOffers.value).to.deep.equal([]);
            expect(el.showSelectedEmptyState).to.be.true;
        });

        it('does not preload fragment search until at least one surface is selected', async () => {
            const repo = makeRepo();
            const el = new MasPromotionsEditor();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await waitForEditorConnect(el);
            expect(repo.searchFragments.called).to.be.false;
            expect(repo.loadAllCollections.called).to.be.false;
        });

        it('does not preload surface fragments/collections on connect even when surfaces are set (deferred to picker open)', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ surfaces: ['sandbox'] })));
            const repo = makeRepo();
            const el = new MasPromotionsEditor();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await waitForEditorConnect(el);
            expect(repo.searchFragments.called).to.be.false;
            expect(repo.loadAllCollections.called).to.be.false;
        });

        it('reuses existing fragmentStore when inEdit already holds one', async () => {
            const existing = makePromotion({ id: 'existing', title: 'Existing' });
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(existing));
            const el = await mountEditor();
            expect(el.fragment.id).to.equal('existing');
            expect(el.isNewPromotion).to.be.false;
        });
    });

    describe('connectedCallback - existing promotion', () => {
        it('loads and stores the promotion by id', async () => {
            const fragmentData = makeFragmentData({ id: 'promo-123', title: 'Loaded' });
            Store.promotions.promotionId.set('promo-123');
            const repo = makeRepo({
                aem: {
                    sites: { cf: { fragments: { getById: sandbox.stub().resolves(fragmentData) } } },
                    getFragmentByPath: null,
                },
            });
            const el = new MasPromotionsEditor();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await Promise.resolve();
            await el.updateComplete;
            expect(el.isNewPromotion).to.be.false;
            expect(el.fragment).to.not.be.null;
        });

        it('unpublishes when loaded promotion is expired and still published', async () => {
            const expiredPublished = makeFragmentData({
                id: 'promo-exp',
                title: 'Expired',
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2020-06-01T00:00:00.000Z',
                status: 'PUBLISHED',
            });
            const afterUnpublish = makeFragmentData({
                id: 'promo-exp',
                title: 'Expired',
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2020-06-01T00:00:00.000Z',
                status: 'DRAFT',
            });
            Store.promotions.promotionId.set('promo-exp');
            const getById = sandbox.stub().onFirstCall().resolves(expiredPublished).onSecondCall().resolves(afterUnpublish);
            const unpublishFragment = sandbox.stub().resolves(true);
            const repo = makeRepo({
                unpublishFragment,
                aem: {
                    sites: { cf: { fragments: { getById } } },
                    getFragmentByPath: null,
                },
            });
            const el = new MasPromotionsEditor();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await Promise.resolve();
            await el.updateComplete;
            expect(unpublishFragment.calledOnce).to.be.true;
        });

        it('handles load failure gracefully and shows empty state', async () => {
            Store.promotions.promotionId.set('bad-id');
            const repo = makeRepo({
                aem: {
                    sites: {
                        cf: { fragments: { getById: sandbox.stub().rejects(new Error('not found')) } },
                    },
                    getFragmentByPath: null,
                },
            });
            const el = new MasPromotionsEditor();
            const consoleError = sandbox.stub(console, 'error');
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            for (let i = 0; i < 40; i += 1) {
                await Promise.resolve();
                if (!el.loadingPromotion) break;
            }
            await el.updateComplete;
            expect(el.loadingPromotion).to.be.false;
            consoleError.restore();
        });
    });

    describe('disconnectedCallback', () => {
        it('restores the items selection store snapshot on removal', async () => {
            setItemsSelectionStore(null);
            const el = await mountEditor();
            const { getItemsSelectionStore: getStore } = await import('../../src/common/items-selection-store.js');
            el.remove();
            const restored = getStore({ allowUnset: true });
            expect(restored).to.be.null;
        });
    });

    describe('promptDiscardChanges', () => {
        it('returns true immediately when fragment has no changes and selection is clean', async () => {
            const el = await mountEditor();
            const result = await el.promptDiscardChanges();
            expect(result).to.be.true;
        });

        it('opens a confirmation dialog when fragment has unsaved changes', async () => {
            const el = await mountEditor();
            el.fragment.hasChanges = true;
            await el.updateComplete;
            const dialogPromise = el.promptDiscardChanges();
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            el.renderRoot
                .querySelector('#promotion-unsaved-changes-dialog')
                .dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
            const result = await dialogPromise;
            expect(result).to.be.false;
        });
    });

    describe('render', () => {
        it('renders mas-quick-actions with Save for new promotions', async () => {
            const el = await mountEditor();
            expect(getPromotionQuickActions(el)).to.exist;
            expect(getPromotionQuickActions(el).getAttribute('drag-handle-style')).to.equal('bar');
            expect(getPromotionQuickActionTitles(el)).to.include('Save');
        });

        it('shows all quick actions with correct disabled state when promotion is not published', async () => {
            const el = await mountEditor();
            el.isNewPromotion = false;
            await el.updateComplete;
            const titles = getPromotionQuickActionTitles(el);
            expect(titles).to.have.members([
                'Save',
                'Duplicate',
                'Publish',
                'Unpublish',
                'Copy link',
                'Copy variation links',
                'Lock project',
                'Delete',
            ]);
            expect(isPromotionQuickActionDisabled(el, 'Save')).to.be.true;
            expect(isPromotionQuickActionDisabled(el, 'Unpublish')).to.be.true;
        });

        it('disables every quick action for a non-editor (view-only)', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.profile.set({ email: 'viewer@adobe.com' });
            Store.users.set([{ userPrincipalName: 'viewer@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'promo-view',
                        title: 'View promo',
                        startDate: '2026-01-01T00:00:00.000Z',
                        endDate: '2027-07-20T23:59:59.000Z',
                        status: 'MODIFIED',
                    }),
                ),
            );
            const el = await mountEditor();
            el.isNewPromotion = false;
            await el.updateComplete;
            for (const title of getPromotionQuickActionTitles(el)) {
                expect(isPromotionQuickActionDisabled(el, title), title).to.be.true;
            }
        });

        it('disables general info fields and surface controls for a non-editor (view-only)', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.profile.set({ email: 'viewer@adobe.com' });
            Store.users.set([{ userPrincipalName: 'viewer@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-POWERUSERS'] }]);
            Store.promotions.inEdit.set(
                new FragmentStore(makePromotion({ id: 'promo-view', title: 'View promo', surfaces: ['sandbox'] })),
            );
            const el = await mountEditor();
            await el.updateComplete;
            expect(el.renderRoot.querySelector('sp-textfield[data-field="title"]')).to.be.null;
            expect(el.renderRoot.querySelector('sp-textfield[data-field="promoCode"]').hasAttribute('disabled')).to.be.true;
            expect(el.renderRoot.querySelector('input[data-field="startDate"]').disabled).to.be.true;
            expect(el.renderRoot.querySelector('input[data-field="endDate"]').disabled).to.be.true;
            for (const picker of el.renderRoot.querySelectorAll('aem-tag-picker-field')) {
                expect(picker.hasAttribute('disabled')).to.be.true;
            }
            expect(el.renderRoot.querySelector('sp-tag[deletable]')).to.be.null;
        });

        it('shows Publish and Unpublish when promotion is modified', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'promo-modified',
                        title: 'Modified promo',
                        startDate: '2026-01-01T00:00:00.000Z',
                        endDate: '2027-07-20T23:59:59.000Z',
                        status: 'MODIFIED',
                    }),
                ),
            );
            const el = await mountEditor();
            await el.updateComplete;
            const titles = getPromotionQuickActionTitles(el);
            expect(titles).to.include('Publish');
            expect(titles).to.include('Unpublish');
        });

        it('republishes when Publish is clicked on a modified promotion', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const promotion = makePromotion({
                id: 'promo-modified',
                title: 'Modified promo',
                startDate: '2026-01-01T00:00:00.000Z',
                endDate: '2027-07-20T23:59:59.000Z',
                status: 'MODIFIED',
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));
            const publish = sandbox.stub().resolves();
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(
                                    makeFragmentData({
                                        id: 'promo-modified',
                                        title: 'Modified promo',
                                        startDate: '2026-01-01T00:00:00.000Z',
                                        endDate: '2027-07-20T23:59:59.000Z',
                                        status: 'PUBLISHED',
                                    }),
                                ),
                                publish,
                            },
                        },
                    },
                    getFragmentByPath: sandbox.stub().resolves(null),
                },
            });
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Publish');
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(publish.calledOnce).to.be.true;
        });

        it('enables Unpublish and disables Publish when promotion is already published', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'promo-1',
                        title: 'Published promo',
                        startDate: '2024-01-01T00:00:00.000Z',
                        endDate: '2025-12-31T23:59:59.000Z',
                        status: 'PUBLISHED',
                    }),
                ),
            );
            const el = await mountEditor();
            await el.updateComplete;
            expect(getPromotionQuickActionTitles(el)).to.include('Unpublish');
            expect(isPromotionQuickActionDisabled(el, 'Unpublish')).to.be.false;
            expect(isPromotionQuickActionDisabled(el, 'Publish')).to.be.true;
        });

        it('disables Publish when promotion is expired and not published', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'promo-exp-draft',
                        title: 'Old',
                        startDate: '2020-01-01T00:00:00.000Z',
                        endDate: '2020-06-01T00:00:00.000Z',
                        status: 'DRAFT',
                    }),
                ),
            );
            const el = await mountEditor();
            await el.updateComplete;
            expect(isPromotionQuickActionDisabled(el, 'Publish')).to.be.true;
        });

        it('enables Publish when start date is in the future', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'future-promo',
                        title: 'Future promo',
                        startDate: '2030-01-01T00:00:00.000Z',
                        endDate: '2030-12-31T00:00:00.000Z',
                        status: 'DRAFT',
                    }),
                ),
            );
            const el = await mountEditor();
            await el.updateComplete;
            expect(isPromotionQuickActionDisabled(el, 'Publish')).to.be.false;
        });

        it('shows loading progress circle when loadingPromotion is true', async () => {
            Store.promotions.promotionId.set('loading-id');
            const deferred = {};
            const waitPromise = new Promise((r) => (deferred.resolve = r));
            const repo = makeRepo({
                aem: {
                    sites: { cf: { fragments: { getById: () => waitPromise } } },
                    getFragmentByPath: null,
                },
            });
            const el = new MasPromotionsEditor();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await el.updateComplete;
            expect(el.loadingPromotion).to.be.true;
            expect(el.renderRoot.querySelector('sp-progress-circle')).to.not.be.null;
            deferred.resolve(null);
            await el.updateComplete;
        });

        it('shows empty surfaces state when no surfaces are selected', async () => {
            const el = await mountEditor();
            const emptyState = el.renderRoot.querySelector('.surfaces-empty-state');
            expect(emptyState).to.not.be.null;
        });

        it('renders surfaces tags list when surfaces are selected', async () => {
            const el = await mountEditor();
            el.fragmentStore.updateField('surfaces', ['mas:studio/surface/acrobat']);
            await el.updateComplete;
            const surfacesList = el.renderRoot.querySelector('.surfaces-list');
            expect(surfacesList).to.not.be.null;
        });
    });

    describe('field event handlers', () => {
        it('updates title field via input event on textfield', async () => {
            const el = await mountEditor();
            const titleField = el.renderRoot.querySelector('sp-textfield[data-field="title"]');
            expect(titleField).to.not.be.null;
            titleField.value = 'My Campaign';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.fragment.getFieldValue('title')).to.equal('My Campaign');
        });

        it('updates startDate via change on datetime-local input', async () => {
            const el = await mountEditor();
            const dateField = el.renderRoot.querySelector('input[data-field="startDate"]');
            expect(dateField).to.not.be.null;
            dateField.value = '2024-06-15T12:00';
            dateField.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            const stored = el.fragment.getFieldValue('startDate');
            expect(stored).to.include('2024-06-15');
        });

        it('clears startDate in fragment when datetime-local is cleared', async () => {
            const el = await mountEditor();
            el.fragmentStore.updateField('startDate', ['2024-06-15T12:00:00.000Z']);
            await el.updateComplete;
            const dateField = el.renderRoot.querySelector('input[data-field="startDate"]');
            dateField.value = '';
            dateField.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            expect(el.fragment.getFieldValue('startDate')).to.equal('');
        });

        it('clears endDate in fragment when datetime-local is cleared', async () => {
            const el = await mountEditor();
            el.fragmentStore.updateField('endDate', ['2024-12-31T23:59:59.000Z']);
            await el.updateComplete;
            const dateField = el.renderRoot.querySelector('input[data-field="endDate"]');
            dateField.value = '';
            dateField.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            expect(el.fragment.getFieldValue('endDate')).to.equal('');
        });

        it('scopes promotion tags picker to promotion taxonomy', async () => {
            const el = await mountEditor();
            const tagsPicker = el.renderRoot.querySelectorAll('aem-tag-picker-field')[0];
            expect(tagsPicker.getAttribute('top')).to.equal('promotion');
        });

        it('auto-generates the promotion tag from the title on a new promotion', async () => {
            const el = await mountEditor();
            expect(el.isNewPromotion).to.be.true;
            const titleField = el.renderRoot.querySelector('sp-textfield[data-field="title"]');
            titleField.value = 'Back To School';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.fragment.getFieldValues('tags')).to.deep.equal(['mas:promotion/back-to-school']);
            expect(el.promotionTag).to.equal('mas:promotion/back-to-school');
        });

        it('trims leading/trailing whitespace from the title before deriving the promotion tag', async () => {
            const el = await mountEditor();
            const titleField = el.renderRoot.querySelector('sp-textfield[data-field="title"]');
            titleField.value = '  Back To School  ';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.fragment.getFieldValues('tags')).to.deep.equal(['mas:promotion/back-to-school']);
        });

        it('exposes the promotion tag to the readonly picker, ignoring non-promotion tags', async () => {
            const el = await mountEditor();
            el.fragmentStore.updateField('tags', ['mas:status/published', 'mas:promotion/new']);
            await el.updateComplete;
            expect(el.promotionTag).to.equal('mas:promotion/new');
            const tagsPicker = el.renderRoot.querySelectorAll('aem-tag-picker-field')[0];
            expect(tagsPicker.hasAttribute('readonly')).to.be.true;
            expect(tagsPicker.getAttribute('value')).to.equal('mas:promotion/new');
        });

        it('updates geos via change on geos tag-picker-field', async () => {
            const el = await mountEditor();
            const tagPickers = el.renderRoot.querySelectorAll('aem-tag-picker-field');
            const geosPicker = tagPickers[1];
            expect(geosPicker).to.not.be.null;
            geosPicker.setAttribute('value', 'mas:locale/us');
            geosPicker.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            const geos = el.fragment.getFieldValues('geos');
            expect(geos).to.deep.equal(['mas:locale/us']);
        });

        it('removes surface on delete event from sp-tag', async () => {
            const el = await mountEditor();
            el.fragmentStore.updateField('surfaces', ['mas:studio/surface/acrobat', 'mas:studio/surface/photoshop']);
            await el.updateComplete;
            const tags = el.renderRoot.querySelectorAll('sp-tag[deletable]');
            expect(tags.length).to.be.greaterThan(0);
            const firstTag = tags[0];
            const value = firstTag.getAttribute('value');
            firstTag.dispatchEvent(new Event('delete', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(el.fragment.getFieldValues('surfaces')).to.not.include(value);
        });
    });

    describe('create flow', () => {
        it('aborts create and does not call repository when required fields are missing', async () => {
            const { el, repo } = await mountEditorWithRepo();
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.called).to.be.false;
            expect(el.isCreated).to.be.false;
        });

        it('aborts create when surfaces are missing', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            el.fragmentStore.updateField('surfaces', []);
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.called).to.be.false;
        });

        it('creates promotion when all required fields are valid', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            await flushPromises();
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            expect(el.isCreated).to.be.true;
        });

        it('handles create error gracefully without setting isCreated', async () => {
            const { el, repo } = await mountEditorWithRepo({
                createFragment: sandbox.stub().rejects(new Error('create failed')),
            });
            await fillValidFields(el);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(el.isCreated).to.be.false;
        });

        it('shows generic error toast when create fails for a non-conflict reason', async () => {
            const toastEmitStub = sandbox.stub(Events.toast, 'emit');
            const { el } = await mountEditorWithRepo({
                createFragment: sandbox.stub().rejects(new Error('create failed')),
            });
            await fillValidFields(el);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            await flushPromises();
            expect(toastEmitStub.calledWith({ variant: 'negative', content: 'Failed to create project.' })).to.be.true;
        });

        it('shows a duplicate-name error toast when create fails with a 409 Conflict', async () => {
            const toastEmitStub = sandbox.stub(Events.toast, 'emit');
            const { el } = await mountEditorWithRepo({
                createFragment: sandbox.stub().rejects(new Error('Failed to create fragment: 409 Conflict')),
            });
            await fillValidFields(el);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            await flushPromises();
            expect(toastEmitStub.calledWith({ variant: 'negative', content: 'Project with this name already exists.' })).to.be
                .true;
        });
    });

    describe('promotion tag creation on create flow', () => {
        it('creates the promotion tag before creating the fragment', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            const title = el.fragment.getFieldValue('title');
            const tag = buildPromotionTagPath(title);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.aem.tags.create.calledOnce).to.be.true;
            expect(repo.aem.tags.create.firstCall.args).to.deep.equal([tag.tagPath, tag.slug]);
            expect(repo.createFragment.calledOnce).to.be.true;
            expect(repo.aem.tags.create.calledBefore(repo.createFragment)).to.be.true;
        });

        it('aborts creation and shows the user-friendly message when tag creation rejects with a UserFriendlyError', async () => {
            const message = 'Tag already exists.';
            const { el, repo } = await mountEditorWithRepo({
                aem: {
                    tags: { create: sandbox.stub().rejects(new UserFriendlyError(message)) },
                },
            });
            await fillValidFields(el);
            const toastStub = sandbox.stub(Events.toast, 'emit');
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.called).to.be.false;
            expect(el.isCreated).to.be.false;
            expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: message }))).to.be.true;
        });

        it('aborts creation and shows a generic message when tag creation rejects with a generic Error', async () => {
            const { el, repo } = await mountEditorWithRepo({
                aem: {
                    tags: { create: sandbox.stub().rejects(new Error('boom')) },
                },
            });
            await fillValidFields(el);
            const toastStub = sandbox.stub(Events.toast, 'emit');
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.called).to.be.false;
            expect(el.isCreated).to.be.false;
            expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: 'Failed to create promotion tag.' }))).to.be
                .true;
        });
    });

    describe('promotion tag cleanup after a failed create', () => {
        it('deletes the promotion tag when createFragment resolves falsy', async () => {
            const { el, repo } = await mountEditorWithRepo({
                createFragment: sandbox.stub().resolves(null),
                aem: { tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() } },
            });
            await fillValidFields(el);
            const title = el.fragment.getFieldValue('title');
            const tag = buildPromotionTagPath(title);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            await flushPromises();
            expect(repo.aem.tags.delete.calledOnceWith(tag.tagPath)).to.be.true;
            expect(el.isCreated).to.be.false;
        });

        it('deletes the promotion tag when createFragment rejects', async () => {
            const { el, repo } = await mountEditorWithRepo({
                createFragment: sandbox.stub().rejects(new Error('create failed')),
                aem: { tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() } },
            });
            await fillValidFields(el);
            const title = el.fragment.getFieldValue('title');
            const tag = buildPromotionTagPath(title);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            await flushPromises();
            expect(repo.aem.tags.delete.calledOnceWith(tag.tagPath)).to.be.true;
        });

        it('swallows tag cleanup errors without blocking the create-failure toast', async () => {
            const toastStub = sandbox.stub(Events.toast, 'emit');
            const { el } = await mountEditorWithRepo({
                createFragment: sandbox.stub().resolves(null),
                aem: {
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().rejects(new Error('delete failed')) },
                },
            });
            await fillValidFields(el);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            await flushPromises();
            expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: 'Failed to create project.' }))).to.be.true;
        });
    });

    describe('#getPayloadValues via create payload', () => {
        it('sets endDate to an empty array in the create payload when evergreen is enabled', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            el.evergreenEnabled = true;
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            const payload = repo.createFragment.firstCall.args[0];
            const endDateField = payload.fields.find((f) => f.name === 'endDate');
            expect(endDateField.values).to.deep.equal([]);
        });

        it('keeps endDate values unchanged in the create payload when evergreen is disabled', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            el.evergreenEnabled = false;
            await el.updateComplete;
            const expectedEndDate = el.fragment.getFieldValues('endDate');
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            const payload = repo.createFragment.firstCall.args[0];
            const endDateField = payload.fields.find((f) => f.name === 'endDate');
            expect(endDateField.values).to.deep.equal(expectedEndDate);
        });

        it('serializes surfaces field values for AEM in the create payload', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            const rawSurfaces = ['Sandbox, sandbox , CCD'];
            el.fragmentStore.updateField('surfaces', rawSurfaces);
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            const payload = repo.createFragment.firstCall.args[0];
            const surfacesField = payload.fields.find((f) => f.name === 'surfaces');
            expect(surfacesField.values).to.deep.equal(serializePromotionSurfacesForAem(rawSurfaces));
        });

        it('derives the promotion tag slug from the title in the create payload', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            const title = 'Summer Sale 2026';
            el.fragmentStore.updateField('title', [title]);
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            const payload = repo.createFragment.firstCall.args[0];
            const tagsField = payload.fields.find((f) => f.name === 'tags');
            expect(tagsField.values).to.deep.equal([`${TAG_PROMOTION_PREFIX}${normalizeKey(title)}`]);
        });

        it('trims leading/trailing whitespace from the title before deriving the promotion tag slug in the create payload', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            const title = '  Summer Sale 2026  ';
            el.fragmentStore.updateField('title', [title]);
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            const payload = repo.createFragment.firstCall.args[0];
            const tagsField = payload.fields.find((f) => f.name === 'tags');
            expect(tagsField.values).to.deep.equal([`${TAG_PROMOTION_PREFIX}${normalizeKey(title.trim())}`]);
        });

        it('blocks create with a validation toast when the title normalizes to an empty slug', async () => {
            const toastEmitStub = sandbox.stub(Events.toast, 'emit');
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            const title = '!!!';
            el.fragmentStore.updateField('title', [title]);
            await el.updateComplete;
            expect(normalizeKey(title)).to.equal('');
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.called).to.be.false;
            expect(toastEmitStub.calledWith({ variant: 'negative', content: 'Please enter a title.' })).to.be.true;
        });

        it('passes promoCode field values through unchanged in the create payload', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            const payload = repo.createFragment.firstCall.args[0];
            const promoCodeField = payload.fields.find((f) => f.name === 'promoCode');
            expect(promoCodeField.values).to.deep.equal(['TEST-PROMO']);
        });
    });

    describe('update flow', () => {
        it('saves promotion when all required fields are valid', async () => {
            const { el, repo } = await mountEditorWithRepo();
            el.isNewPromotion = false;
            await fillValidFields(el);
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.saveFragment.calledOnce).to.be.true;
        });

        it('writes selected fragment paths to fragment before save', async () => {
            const cardPath = '/content/dam/mas/sandbox/en_US/card-a';
            const { el, repo } = await mountEditorWithRepo();
            el.isNewPromotion = false;
            await fillValidFields(el);
            Store.promotions.selectedCards.set([cardPath]);
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(el.fragment.getFieldValues('fragments')).to.deep.equal([cardPath]);
            expect(el.fragment.getField('fragments')?.type).to.equal('content-fragment');
            expect(el.fragment.getField('fragments')?.multiple).to.be.true;
            expect(repo.saveFragment.calledOnce).to.be.true;
            const saved = repo.saveFragment.firstCall.args[0].get();
            expect(saved.getFieldValues('fragments')).to.deep.equal([cardPath]);
        });

        it('writes selected offer ids to fragment offers field before save', async () => {
            const { el, repo } = await mountEditorWithRepo();
            el.isNewPromotion = false;
            await fillValidFields(el);
            Store.promotions.selectedOffers.set(['osi-new']);
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(el.fragment.getFieldValues('offers')).to.include('osi-new');
            expect(el.fragment.getField('offers')?.multiple).to.be.true;
            expect(repo.saveFragment.calledOnce).to.be.true;
        });

        it('aborts save when required fields are missing', async () => {
            const { el, repo } = await mountEditorWithRepo();
            el.isNewPromotion = false;
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.saveFragment.called).to.be.false;
        });

        it('handles save error gracefully', async () => {
            const { el, repo } = await mountEditorWithRepo({
                saveFragment: sandbox.stub().rejects(new Error('save failed')),
            });
            el.isNewPromotion = false;
            await fillValidFields(el);
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.saveFragment.calledOnce).to.be.true;
        });

        it('writes offer ids to fragment before save even when saveFragment returns false', async () => {
            const { el, repo } = await mountEditorWithRepo({
                saveFragment: sandbox.stub().resolves(false),
            });
            el.isNewPromotion = false;
            await fillValidFields(el);
            Store.promotions.selectedOffers.set(['osi-new']);
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.saveFragment.calledOnce).to.be.true;
            expect(el.fragment.getFieldValues('offers')).to.include('osi-new');
        });
    });

    describe('offers persistence', () => {
        it('includes selected offer ids as bare lines in create payload offers field', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            Store.promotions.selectedOffers.set(['osi-abc', 'osi-def']);
            clickPromotionQuickAction(el, 'Save');
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            const payload = repo.createFragment.firstCall.args[0];
            const offersField = payload.fields.find((f) => f.name === 'offers');
            expect(offersField).to.exist;
            expect(offersField.values).to.include('osi-abc');
            expect(offersField.values).to.include('osi-def');
        });

        it('hydrates selectedOffers from bare offer id lines in the offers field', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const promo = makePromotion({
                fields: [
                    { name: 'title', type: 'text', values: ['T'] },
                    { name: 'promoCode', type: 'text', values: ['CODE'] },
                    { name: 'startDate', values: ['2024-01-01T00:00:00.000Z'] },
                    { name: 'endDate', values: ['2024-12-31T00:00:00.000Z'] },
                    { name: 'tags', values: [] },
                    { name: 'surfaces', type: 'text', multiple: false, values: [] },
                    { name: 'geos', type: 'tag', multiple: true, values: [] },
                    { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
                    { name: 'offers', type: 'text', multiple: true, values: ['osi-abc', 'osi-def', 'osi-abc:PROMO:US'] },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promo));
            const el = await mountEditorWithRepo().then(({ el }) => el);
            await el.updateComplete;
            expect(Store.promotions.selectedOffers.value).to.deep.equal(['osi-abc', 'osi-def']);
        });

        it('hydrates selectedCards from fragments-field paths not matched as collections', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const cardPath = '/content/dam/mas/sandbox/en_US/card-a';
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'promo-1',
                        fragments: [cardPath],
                    }),
                ),
            );
            const { el } = await mountEditorWithRepo();
            Store.promotions.promotionId.set('promo-1');
            el.disconnectedCallback();
            await el.connectedCallback();
            await el.updateComplete;
            expect(Store.promotions.selectedCards.value).to.deep.equal([cardPath]);
        });

        it('refines the card/collection split in the background from a surface collection search', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const cardPath = '/content/dam/mas/sandbox/en_US/card-a';
            const collectionPath = '/content/dam/mas/sandbox/en_US/collection-a';
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'promo-2',
                        surfaces: ['sandbox'],
                        fragments: [cardPath, collectionPath],
                    }),
                ),
            );
            const getCollectionPathsForSurfaces = sandbox.stub().resolves(new Set([collectionPath]));
            const { el } = await mountEditorWithRepo({ getCollectionPathsForSurfaces });
            Store.promotions.promotionId.set('promo-2');
            el.disconnectedCallback();
            await el.connectedCallback();
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 50));
            expect(getCollectionPathsForSurfaces.calledWith(['sandbox'])).to.be.true;
            expect(Store.promotions.selectedCards.value).to.deep.equal([cardPath]);
            expect(Store.promotions.selectedCollections.value).to.deep.equal([collectionPath]);
        });

        it('does not clobber a selection the user edited while the classification search was in flight', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const cardPath = '/content/dam/mas/sandbox/en_US/card-a';
            const collectionPath = '/content/dam/mas/sandbox/en_US/collection-a';
            const addedPath = '/content/dam/mas/sandbox/en_US/card-added';
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'promo-race',
                        surfaces: ['sandbox'],
                        fragments: [cardPath, collectionPath],
                    }),
                ),
            );
            let releaseSearch;
            const getCollectionPathsForSurfaces = sandbox
                .stub()
                .callsFake(() => new Promise((resolve) => (releaseSearch = () => resolve(new Set([collectionPath])))));
            const { el } = await mountEditorWithRepo({ getCollectionPathsForSurfaces });
            Store.promotions.promotionId.set('promo-race');
            el.disconnectedCallback();
            await el.connectedCallback();
            await el.updateComplete;
            // User adds a card while the surface search is still pending.
            Store.promotions.selectedCards.set([cardPath, collectionPath, addedPath]);
            releaseSearch();
            await new Promise((r) => setTimeout(r, 50));
            expect(Store.promotions.selectedCards.value).to.deep.equal([cardPath, addedPath]);
            expect(Store.promotions.selectedCollections.value).to.deep.equal([collectionPath]);
        });
    });

    describe('schedule and publish quick actions', () => {
        async function mountSavedPromotion(promoOverrides, repoOverrides = {}) {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion(promoOverrides)));
            const publish = sandbox.stub().resolves();
            const { el, repo } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                publish,
                                publishFragments: sandbox.stub().resolves(),
                                search: makeSearchStub(),
                            },
                        },
                    },
                    getFragmentByPath: sandbox.stub().resolves(null),
                },
                ...repoOverrides,
            });
            await el.updateComplete;
            return { el, repo, publish };
        }

        it('publishes when Publish is clicked with a future start date', async () => {
            const { el, publish } = await mountSavedPromotion({
                id: 'sched-promo',
                title: 'Scheduled promo',
                startDate: '2030-01-01T00:00:00.000Z',
                endDate: '2030-12-31T00:00:00.000Z',
                status: 'DRAFT',
            });
            clickPromotionQuickAction(el, 'Publish');
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(publish.calledOnce).to.be.true;
        });

        it('publishes when Publish is clicked with a start date in the past', async () => {
            const { el, publish } = await mountSavedPromotion({
                id: 'pub-promo',
                title: 'Publish promo',
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2030-12-31T00:00:00.000Z',
                status: 'DRAFT',
            });
            clickPromotionQuickAction(el, 'Publish');
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(publish.calledOnce).to.be.true;
        });

        it('does not publish when there are unsaved changes', async () => {
            const { el, publish } = await mountSavedPromotion({
                id: 'dirty-promo',
                title: 'Dirty promo',
                startDate: '2030-01-01T00:00:00.000Z',
                endDate: '2030-12-31T00:00:00.000Z',
                status: 'DRAFT',
            });
            el.fragment.hasChanges = true;
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Publish');
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(publish.called).to.be.false;
        });
    });

    describe('unpublish quick action', () => {
        it('unpublishes when Unpublish is clicked on a published promotion with no attached promo variations', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'pub-1',
                        title: 'Published promo',
                        startDate: '2020-01-01T00:00:00.000Z',
                        endDate: '2030-12-31T00:00:00.000Z',
                        status: 'PUBLISHED',
                    }),
                ),
            );
            const unpublish = sandbox.stub().resolves();
            const getWithEtag = sandbox.stub().withArgs('pub-1').resolves({ id: 'pub-1', etag: 'etag-promo' });
            const { el, repo } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(
                                    makeFragmentData({
                                        id: 'pub-1',
                                        status: 'PUBLISHED',
                                        startDate: '2020-01-01T00:00:00.000Z',
                                        endDate: '2030-12-31T00:00:00.000Z',
                                    }),
                                ),
                                getByPath: sandbox.stub().resolves(null),
                                getWithEtag,
                                unpublish,
                            },
                        },
                    },
                    getFragmentByPath: sandbox.stub().resolves(null),
                },
            });
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Unpublish');
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(unpublish.calledOnceWith({ id: 'pub-1', etag: 'etag-promo' })).to.be.true;
            expect(repo.operation.set.firstCall.args[0]).to.equal('unpublish');
        });
    });

    describe('unpublish reminder flow', () => {
        it('prompts before unpublish when attached promo variations are published', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoVarPath = '/content/dam/mas/sandbox/en_US/promotions/code-test/my-card';
            const promotion = makePromotion({
                id: 'promo-1',
                title: 'Test Promotion',
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2030-12-31T00:00:00.000Z',
                status: 'PUBLISHED',
                fields: [
                    { name: 'title', type: 'text', values: ['Test Promotion'] },
                    { name: 'promoCode', type: 'text', values: ['TEST'] },
                    { name: 'startDate', values: ['2020-01-01T00:00:00.000Z'] },
                    { name: 'endDate', values: ['2030-12-31T00:00:00.000Z'] },
                    { name: 'tags', values: ['mas:promotion/code-test'], multiple: true },
                    { name: 'surfaces', type: 'text', multiple: false, values: ['sandbox'] },
                    { name: 'geos', type: 'tag', multiple: true, values: ['mas:locale/us'] },
                    { name: 'fragments', type: 'content-fragment', multiple: true, values: [parentPath] },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/code-test';
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoVarPath, status: 'PUBLISHED', title: 'Published variation' }],
            });
            const unpublish = sandbox.stub().resolves();
            const { el, repo } = await mountEditorWithRepo({
                aem: {
                    getFragmentByPath: sandbox.stub().resolves({
                        path: parentPath,
                        model: { path: CARD_MODEL_PATH },
                    }),
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                getWithEtag: sandbox.stub(),
                                search,
                                unpublish,
                            },
                        },
                    },
                },
            });
            Store.promotions.selectedCollections.set([]);
            await el.updateComplete;

            clickPromotionQuickAction(el, 'Unpublish');
            await new Promise((resolve) => setTimeout(resolve, 0));
            await el.updateComplete;

            expect(repo.aem.sites.cf.fragments.search.calledWith({ path: promoFolder }, 50)).to.be.true;
            expect(repo.aem.sites.cf.fragments.unpublish.called).to.be.false;
        });
    });

    describe('publish reminder flow', () => {
        it('prompts before publish when attached promo variations are unpublished', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoVarPath = '/content/dam/mas/sandbox/en_US/promotions/code-test/my-card';
            const promotion = makePromotion({
                id: 'promo-1',
                title: 'Test Promotion',
                startDate: '2030-01-01T00:00:00.000Z',
                endDate: '2030-12-31T00:00:00.000Z',
                status: 'DRAFT',
                fragments: [parentPath],
                fields: [
                    { name: 'title', type: 'text', values: ['Test Promotion'] },
                    { name: 'promoCode', type: 'text', values: ['TEST'] },
                    { name: 'startDate', values: ['2030-01-01T00:00:00.000Z'] },
                    { name: 'endDate', values: ['2030-12-31T00:00:00.000Z'] },
                    { name: 'tags', values: ['mas:promotion/code-test'], multiple: true },
                    { name: 'surfaces', type: 'text', multiple: false, values: ['sandbox'] },
                    { name: 'geos', type: 'tag', multiple: true, values: ['mas:locale/us'] },
                    { name: 'fragments', type: 'content-fragment', multiple: true, values: [parentPath] },
                ],
            });
            Store.promotions.inEdit.set(new FragmentStore(promotion));
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/code-test';
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoVarPath, status: 'DRAFT', title: 'Unpublished variation' }],
            });
            const { el, repo } = await mountEditorWithRepo({
                aem: {
                    getFragmentByPath: sandbox.stub().resolves({
                        path: parentPath,
                        model: { path: CARD_MODEL_PATH },
                    }),
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                publish: sandbox.stub().resolves(),
                                publishFragments: sandbox.stub().resolves(),
                                getWithEtag: sandbox.stub(),
                                search,
                            },
                        },
                    },
                },
            });
            Store.promotions.selectedCollections.set([]);
            await el.updateComplete;

            clickPromotionQuickAction(el, 'Publish');
            await new Promise((resolve) => setTimeout(resolve, 0));
            await el.updateComplete;

            expect(repo.aem.sites.cf.fragments.search.calledWith({ path: promoFolder }, 50)).to.be.true;
            expect(repo.aem.sites.cf.fragments.publish.called).to.be.false;
            expect(repo.aem.sites.cf.fragments.publishFragments.called).to.be.false;
        });
    });

    describe('selected items edit button', () => {
        function getSelectedItemsEditButton(el) {
            const header = el.renderRoot.querySelector('.selected-items-header');
            return [...header.querySelectorAll('sp-action-button')].find(
                (button) => button.textContent.trim() === 'Edit' || button.textContent.trim() === 'Add offer',
            );
        }

        async function mountEditorWithSelectedItems() {
            const el = await mountEditor();
            Store.promotions.selectedOffers.set(['offer-1']);
            Store.promotions.selectedCards.set(['/content/dam/mas/sandbox/en_US/card']);
            el.isSelectedItemsOpen = true;
            await el.updateComplete;
            return el;
        }

        it('opens items picker overlay from Edit when Fragments tab is active', async () => {
            const { el, repo } = await mountEditorWithRepo();
            el.fragmentStore.updateField('surfaces', ['sandbox']);
            Store.promotions.selectedOffers.set(['offer-1']);
            Store.promotions.selectedCards.set(['/content/dam/mas/sandbox/en_US/card']);
            el.isSelectedItemsOpen = true;
            el.selectedItemsViewTab = TABLE_TYPE.CARDS;
            await el.updateComplete;
            getSelectedItemsEditButton(el).click();
            await el.updateComplete;
            expect(el.renderRoot.querySelector('#add-promotion-items-overlay').open).to.equal('click');
        });

        it('opens items picker overlay from Edit when Collections tab is active', async () => {
            const { el } = await mountEditorWithRepo();
            el.fragmentStore.updateField('surfaces', ['sandbox']);
            Store.promotions.selectedOffers.set(['offer-1']);
            Store.promotions.selectedCards.set(['/content/dam/mas/sandbox/en_US/card']);
            el.isSelectedItemsOpen = true;
            el.selectedItemsViewTab = TABLE_TYPE.COLLECTIONS;
            await el.updateComplete;
            getSelectedItemsEditButton(el).click();
            await el.updateComplete;
            expect(el.renderRoot.querySelector('#add-promotion-items-overlay').open).to.equal('click');
        });

        it('does not wrap Add offer in overlay-trigger when Offers tab is active', async () => {
            const el = await mountEditorWithSelectedItems();
            el.selectedItemsViewTab = TABLE_TYPE.OFFERS;
            await el.updateComplete;
            const editButton = getSelectedItemsEditButton(el);
            expect(editButton.closest('overlay-trigger')).to.be.null;
        });
    });

    describe('promo codes manager', () => {
        it('ignores a second open call while the first is still in flight', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'promo-1', title: 'T', geos: ['mas:geo/usa'] })));
            const el = await mountEditor();
            await el.updateComplete;
            Store.promotions.selectedOffers.set(['offer-1']);
            await el.updateComplete;

            const manageBtn = [...el.renderRoot.querySelectorAll('sp-action-button')].find((b) =>
                b.textContent.includes('Manage'),
            );
            expect(manageBtn).to.not.be.null;

            manageBtn.click();
            manageBtn.click();

            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 0));

            expect(el.promoCodesManagerOpen).to.be.true;
            expect(el.promoManagerOffers).to.have.length(1);
            expect(el.promoManagerOffers[0].path).to.equal('offer-1');
        });
    });

    describe('confirmDialog', () => {
        it('renders nothing when confirmDialogConfig is null', async () => {
            const el = await mountEditor();
            const overlay = el.renderRoot.querySelector('.confirm-dialog-overlay');
            expect(overlay).to.be.null;
        });

        it('renders the confirm dialog when config is set', async () => {
            const el = await mountEditor();
            el.fragment.hasChanges = true;
            await el.updateComplete;
            el.promptDiscardChanges();
            await el.updateComplete;
            const overlay = el.renderRoot.querySelector('.confirm-dialog-overlay');
            expect(overlay).to.not.be.null;
        });
    });

    describe('delete quick action', () => {
        it('opens confirmation dialog when Delete is clicked on a saved promotion', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'del-1', title: 'To Delete' })));
            const { el } = await mountEditorWithRepo({
                deleteFragment: sandbox.stub().resolves(true),
            });
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Delete');
            await new Promise((r) => setTimeout(r, 0));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            expect(el.confirmDialogConfig?.title).to.equal('Confirm Delete');
            expect(el.confirmDialogConfig?.message).to.equal(
                'Are you sure you want to delete the promotion project "To Delete"? This action cannot be undone.',
            );
        });

        it('mentions attached promo variations in the confirm message when the project has them', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoVarPath = '/content/dam/mas/sandbox/en_US/promotions/code-test/my-card';
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'del-1b',
                        title: 'To Delete',
                        fields: [
                            { name: 'title', type: 'text', values: ['To Delete'] },
                            { name: 'tags', values: ['mas:promotion/code-test'], multiple: true },
                            { name: 'fragments', type: 'content-fragment', multiple: true, values: [parentPath] },
                        ],
                    }),
                ),
            );
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/code-test';
            const search = makeSearchStub({ [promoFolder]: [{ id: 'promo-var-id', path: promoVarPath, status: 'DRAFT' }] });
            const { el } = await mountEditorWithRepo({
                deleteFragment: sandbox.stub().resolves(true),
                aem: { sites: { cf: { fragments: { search, getById: sandbox.stub().resolves(null) } } } },
            });
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Delete');
            await new Promise((r) => setTimeout(r, 0));
            await el.updateComplete;
            expect(el.confirmDialogConfig?.message).to.equal(
                'Are you sure you want to delete the promotion project "To Delete"? This action cannot be undone. 1 promo variation(s) will remain saved but will no longer be associated with this project.',
            );
        });

        it('calls deleteFragment when delete dialog is confirmed', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'del-2', title: 'Deletable' })));
            const deleteFragment = sandbox.stub().resolves(true);
            const { el, repo } = await mountEditorWithRepo({ deleteFragment });
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Delete');
            await new Promise((r) => setTimeout(r, 0));
            await el.updateComplete;
            el.renderRoot
                .querySelector('#promotion-unsaved-changes-dialog')
                .dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 0));
            expect(repo.deleteFragment.calledOnce).to.be.true;
        });

        it('does not delete attached promo variations when deleting the project', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoVarPath = '/content/dam/mas/sandbox/en_US/promotions/code-test/my-card';
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'del-3',
                        title: 'Deletable',
                        fields: [
                            { name: 'title', type: 'text', values: ['Deletable'] },
                            { name: 'tags', values: ['mas:promotion/code-test'], multiple: true },
                            { name: 'fragments', type: 'content-fragment', multiple: true, values: [parentPath] },
                        ],
                    }),
                ),
            );
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/code-test';
            const search = makeSearchStub({ [promoFolder]: [{ id: 'promo-var-id', path: promoVarPath, status: 'DRAFT' }] });
            const forceDelete = sandbox.stub().resolves();
            const deleteFragment = sandbox.stub().resolves(true);
            const { el, repo } = await mountEditorWithRepo({
                deleteFragment,
                aem: {
                    sites: { cf: { fragments: { search, getById: sandbox.stub().resolves(null), forceDelete } } },
                },
            });
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Delete');
            await new Promise((r) => setTimeout(r, 0));
            await el.updateComplete;
            el.renderRoot
                .querySelector('#promotion-unsaved-changes-dialog')
                .dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 20));
            expect(forceDelete.called).to.be.false;
            expect(repo.deleteFragment.calledOnce).to.be.true;
        });

        it('shows a negative toast but still completes deletion when the promotion tag fails to delete', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'del-4',
                        title: 'Deletable',
                        fields: [
                            { name: 'title', type: 'text', values: ['Deletable'] },
                            { name: 'tags', values: ['mas:promotion/code-test'], multiple: true },
                        ],
                    }),
                ),
            );
            const deleteFragment = sandbox.stub().resolves(true);
            const toastStub = sandbox.stub(Events.toast, 'emit');
            const { el, repo } = await mountEditorWithRepo({
                deleteFragment,
                aem: {
                    sites: {
                        cf: { fragments: { getByPath: sandbox.stub().resolves(null), getById: sandbox.stub().resolves(null) } },
                    },
                    tags: { delete: sandbox.stub().rejects(new Error('delete failed')) },
                },
            });
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Delete');
            await new Promise((r) => setTimeout(r, 0));
            await el.updateComplete;
            el.renderRoot
                .querySelector('#promotion-unsaved-changes-dialog')
                .dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 20));
            expect(repo.aem.tags.delete.calledOnce).to.be.true;
            expect(repo.deleteFragment.calledOnce).to.be.true;
            expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: 'Failed to delete promotion tag.' }))).to.be
                .true;
            expect(
                toastStub.calledWith(sinon.match({ variant: 'positive', content: 'Promotion campaign successfully deleted.' })),
            ).to.be.true;
        });
    });

    describe('duplicate quick action', () => {
        it('calls createFragment when duplicate-confirmed is dispatched on the dialog', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'dup-1', title: 'Original' })));
            const { el, repo } = await mountEditorWithRepo();
            await el.updateComplete;
            el.duplicateDialogOpen = true;
            await el.updateComplete;
            el.renderRoot.querySelector('mas-promotion-duplicate-dialog').dispatchEvent(
                new CustomEvent('duplicate-confirmed', {
                    bubbles: true,
                    composed: true,
                    detail: { title: 'Original copy' },
                }),
            );
            await new Promise((r) => setTimeout(r, 20));
            expect(repo.createFragment.calledOnce).to.be.true;
        });

        it('resets item selection store before hydrating the duplicated promotion', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const sourceCard = '/content/dam/mas/sandbox/en_US/source-card';
            const dupOffer = 'osi-dup';
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'dup-1',
                        title: 'Original',
                        fragments: [sourceCard],
                        fields: [
                            { name: 'title', type: 'text', values: ['Original'] },
                            { name: 'promoCode', type: 'text', values: ['CODE'] },
                            { name: 'startDate', values: ['2024-01-01T00:00:00.000Z'] },
                            { name: 'endDate', values: ['2024-12-31T00:00:00.000Z'] },
                            { name: 'tags', values: [] },
                            { name: 'surfaces', type: 'text', multiple: false, values: [] },
                            { name: 'geos', type: 'tag', multiple: true, values: [] },
                            { name: 'fragments', type: 'content-fragment', multiple: true, values: [sourceCard] },
                            { name: 'offers', type: 'text', multiple: true, values: ['source-offer'] },
                        ],
                    }),
                ),
            );
            const createFragment = sandbox.stub().resolves(
                makePromotion({
                    id: 'dup-2',
                    title: 'Original copy',
                    fragments: [],
                    fields: [
                        { name: 'title', type: 'text', values: ['Original copy'] },
                        { name: 'promoCode', type: 'text', values: ['CODE'] },
                        { name: 'startDate', values: ['2024-01-01T00:00:00.000Z'] },
                        { name: 'endDate', values: ['2024-12-31T00:00:00.000Z'] },
                        { name: 'tags', values: [] },
                        { name: 'surfaces', type: 'text', multiple: false, values: [] },
                        { name: 'geos', type: 'tag', multiple: true, values: [] },
                        { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'offers', type: 'text', multiple: true, values: [dupOffer] },
                    ],
                }),
            );
            const { el } = await mountEditorWithRepo({ createFragment });
            await waitForEditorConnect(el);
            Store.promotions.selectedCards.set(['/stale/card']);
            Store.promotions.selectedCollections.set(['/stale/collection']);
            Store.promotions.selectedOffers.set(['stale-offer']);
            el.duplicateDialogOpen = true;
            await el.updateComplete;
            el.renderRoot.querySelector('mas-promotion-duplicate-dialog').dispatchEvent(
                new CustomEvent('duplicate-confirmed', {
                    bubbles: true,
                    composed: true,
                    detail: { title: 'Original copy' },
                }),
            );
            await new Promise((r) => setTimeout(r, 50));
            expect(Store.promotions.selectedCards.value).to.deep.equal([]);
            expect(Store.promotions.selectedCollections.value).to.deep.equal([]);
            expect(Store.promotions.selectedOffers.value).to.deep.equal([dupOffer]);
        });

        it('preserves non-promotion tags and replaces the promotion tag when duplicating', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(
                new FragmentStore(
                    makePromotion({
                        id: 'dup-1',
                        title: 'Original',
                        fields: [
                            { name: 'title', type: 'text', values: ['Original'] },
                            { name: 'promoCode', type: 'text', values: ['CODE'] },
                            { name: 'startDate', values: ['2024-01-01T00:00:00.000Z'] },
                            { name: 'endDate', values: ['2024-12-31T00:00:00.000Z'] },
                            { name: 'tags', values: ['mas:status/published', 'mas:promotion/original'] },
                            { name: 'surfaces', type: 'text', multiple: false, values: [] },
                            { name: 'geos', type: 'tag', multiple: true, values: [] },
                            { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
                        ],
                    }),
                ),
            );
            const { el, repo } = await mountEditorWithRepo();
            await waitForEditorConnect(el);
            el.duplicateDialogOpen = true;
            await el.updateComplete;
            el.renderRoot.querySelector('mas-promotion-duplicate-dialog').dispatchEvent(
                new CustomEvent('duplicate-confirmed', {
                    bubbles: true,
                    composed: true,
                    detail: { title: 'Original copy' },
                }),
            );
            await new Promise((r) => setTimeout(r, 20));
            expect(repo.createFragment.calledOnce).to.be.true;
            const payload = repo.createFragment.firstCall.args[0];
            const tagsField = payload.fields.find((f) => f.name === 'tags');
            expect(tagsField.values).to.deep.equal([
                'mas:status/published',
                `${TAG_PROMOTION_PREFIX}${normalizeKey('Original copy')}`,
            ]);
        });
    });

    describe('copy link quick action', () => {
        it('copies promotion URL to clipboard when Copy link is clicked', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'link-id', title: 'Campaign' })));
            let copied = null;
            const origDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: (text) => {
                        copied = text;
                        return Promise.resolve();
                    },
                },
                configurable: true,
            });
            const { el } = await mountEditorWithRepo();
            await el.updateComplete;
            try {
                clickPromotionQuickAction(el, 'Copy link');
                await new Promise((r) => setTimeout(r, 0));
                expect(copied).to.include('link-id');
            } finally {
                if (origDescriptor) {
                    Object.defineProperty(navigator, 'clipboard', origDescriptor);
                }
            }
        });
    });

    describe('copy variation links quick action', () => {
        let originalClipboardItem;

        function stubClipboard({ rejects = false } = {}) {
            const origDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
            const write = rejects ? sandbox.stub().rejects(new Error('denied')) : sandbox.stub().resolves();
            Object.defineProperty(navigator, 'clipboard', {
                value: { write },
                configurable: true,
            });
            originalClipboardItem = globalThis.ClipboardItem;
            globalThis.ClipboardItem = class ClipboardItemMock {
                constructor(data) {
                    this.data = data;
                }
            };
            return {
                write,
                restore: () => {
                    if (origDescriptor) Object.defineProperty(navigator, 'clipboard', origDescriptor);
                    globalThis.ClipboardItem = originalClipboardItem;
                },
            };
        }

        it('copies a nice title and deep link for all attached variations, including published ones', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'promo-id', title: 'Campaign' })));
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const variationPath = `${promoFolder}/my-card`;
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                search: makeSearchStub({
                                    [promoFolder]: [
                                        {
                                            id: 'variation-id',
                                            path: variationPath,
                                            status: 'PUBLISHED',
                                            title: 'Variation',
                                            model: { path: CARD_MODEL_PATH },
                                            tags: [],
                                            fields: [],
                                        },
                                    ],
                                }),
                            },
                        },
                    },
                },
            });
            el.fragmentStore.updateField('tags', ['mas:promotion/black-friday']);
            el.fragmentStore.updateField('fragments', ['/content/dam/mas/sandbox/en_US/my-card']);
            await el.updateComplete;
            const clipboard = stubClipboard();
            try {
                clickPromotionQuickAction(el, 'Copy variation links');
                await new Promise((r) => setTimeout(r, 0));
                expect(clipboard.write.calledOnce).to.be.true;
                const [item] = clipboard.write.firstCall.args[0];
                const plainText = await item.data['text/plain'].text();
                const htmlText = await item.data['text/html'].text();
                expect(plainText).to.include('query=variation-id');
                expect(htmlText).to.include('<a href=');
                expect(htmlText).to.include('query=variation-id');
                expect(htmlText).to.include('merch-card: SANDBOX : Variation');
            } finally {
                clipboard.restore();
            }
        });

        it('shows an info toast and does not touch the clipboard when there are no variations', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'promo-id-empty', title: 'Campaign' })));
            const { el } = await mountEditorWithRepo();
            await el.updateComplete;
            const clipboard = stubClipboard();
            const toastStub = sandbox.stub(Events.toast, 'emit');
            try {
                clickPromotionQuickAction(el, 'Copy variation links');
                await new Promise((r) => setTimeout(r, 0));
                expect(clipboard.write.called).to.be.false;
                expect(
                    toastStub.calledWith(
                        sinon.match({ variant: 'info', content: 'No variations found for this promotion project.' }),
                    ),
                ).to.be.true;
            } finally {
                clipboard.restore();
            }
        });

        it('shows a negative toast when the clipboard write fails', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'promo-id-fail', title: 'Campaign' })));
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const variationPath = `${promoFolder}/my-card`;
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                search: makeSearchStub({
                                    [promoFolder]: [
                                        {
                                            id: 'variation-id',
                                            path: variationPath,
                                            status: 'DRAFT',
                                            title: 'Variation',
                                            model: { path: CARD_MODEL_PATH },
                                            tags: [],
                                            fields: [],
                                        },
                                    ],
                                }),
                            },
                        },
                    },
                },
            });
            el.fragmentStore.updateField('tags', ['mas:promotion/black-friday']);
            el.fragmentStore.updateField('fragments', ['/content/dam/mas/sandbox/en_US/my-card']);
            await el.updateComplete;
            const clipboard = stubClipboard({ rejects: true });
            const toastStub = sandbox.stub(Events.toast, 'emit');
            try {
                clickPromotionQuickAction(el, 'Copy variation links');
                await new Promise((r) => setTimeout(r, 0));
                expect(clipboard.write.calledOnce).to.be.true;
                expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: 'Failed to copy variation links.' })))
                    .to.be.true;
            } finally {
                clipboard.restore();
            }
        });

        it('shows a negative toast instead of crashing when a variation is missing tags/fields', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'promo-id-malformed', title: 'Campaign' })));
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const variationPath = `${promoFolder}/my-card`;
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                // Simulates an AEM response missing `tags`/`fields`, which used to throw
                                // inside Fragment.getTagTitle() outside the try/catch.
                                search: makeSearchStub({
                                    [promoFolder]: [
                                        {
                                            id: 'variation-id',
                                            path: variationPath,
                                            status: 'PUBLISHED',
                                            title: 'Variation',
                                            model: { path: CARD_MODEL_PATH },
                                        },
                                    ],
                                }),
                            },
                        },
                    },
                },
            });
            el.fragmentStore.updateField('tags', ['mas:promotion/black-friday']);
            el.fragmentStore.updateField('fragments', ['/content/dam/mas/sandbox/en_US/my-card']);
            await el.updateComplete;
            const clipboard = stubClipboard();
            const toastStub = sandbox.stub(Events.toast, 'emit');
            try {
                clickPromotionQuickAction(el, 'Copy variation links');
                await new Promise((r) => setTimeout(r, 0));
                expect(clipboard.write.called).to.be.false;
                expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: 'Failed to copy variation links.' })))
                    .to.be.true;
            } finally {
                clipboard.restore();
            }
        });

        it('copies only the supported variations and reports a partial count when some model paths are unsupported', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'promo-id-partial', title: 'Campaign' })));
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const supportedPath = `${promoFolder}/my-card`;
            const unsupportedPath = `${promoFolder}/other-card`;
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'variation-id',
                        path: supportedPath,
                        status: 'PUBLISHED',
                        title: 'Variation',
                        model: { path: CARD_MODEL_PATH },
                        tags: [],
                        fields: [],
                    },
                    {
                        id: 'variation-id-2',
                        path: unsupportedPath,
                        status: 'PUBLISHED',
                        title: 'Variation 2',
                        model: { path: '/conf/mas/settings/dam/cfm/models/unknown' },
                        tags: [],
                        fields: [],
                    },
                ],
            });
            const { el } = await mountEditorWithRepo({
                aem: { sites: { cf: { fragments: { getById: sandbox.stub().resolves(null), search } } } },
            });
            el.fragmentStore.updateField('tags', ['mas:promotion/black-friday']);
            el.fragmentStore.updateField('fragments', [
                '/content/dam/mas/sandbox/en_US/my-card',
                '/content/dam/mas/sandbox/en_US/other-card',
            ]);
            await el.updateComplete;
            const clipboard = stubClipboard();
            const toastStub = sandbox.stub(Events.toast, 'emit');
            try {
                clickPromotionQuickAction(el, 'Copy variation links');
                await new Promise((r) => setTimeout(r, 0));
                expect(clipboard.write.calledOnce).to.be.true;
                const [item] = clipboard.write.firstCall.args[0];
                const plainText = await item.data['text/plain'].text();
                expect(plainText).to.include('query=variation-id');
                expect(plainText).to.not.include('query=variation-id-2');
                expect(
                    toastStub.calledWith(
                        sinon.match({ variant: 'positive', content: 'Copied 1 of 2 variation links to clipboard.' }),
                    ),
                ).to.be.true;
            } finally {
                clipboard.restore();
            }
        });

        it('shows a distinct info toast when variations exist but none have a copyable model path', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ id: 'promo-id-unsupported', title: 'Campaign' })));
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const variationPath = `${promoFolder}/my-card`;
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                search: makeSearchStub({
                                    [promoFolder]: [
                                        {
                                            id: 'variation-id',
                                            path: variationPath,
                                            status: 'PUBLISHED',
                                            title: 'Variation',
                                            model: { path: '/conf/mas/settings/dam/cfm/models/unknown' },
                                            tags: [],
                                            fields: [],
                                        },
                                    ],
                                }),
                            },
                        },
                    },
                },
            });
            el.fragmentStore.updateField('tags', ['mas:promotion/black-friday']);
            el.fragmentStore.updateField('fragments', ['/content/dam/mas/sandbox/en_US/my-card']);
            await el.updateComplete;
            const clipboard = stubClipboard();
            const toastStub = sandbox.stub(Events.toast, 'emit');
            try {
                clickPromotionQuickAction(el, 'Copy variation links');
                await new Promise((r) => setTimeout(r, 0));
                expect(clipboard.write.called).to.be.false;
                expect(
                    toastStub.calledWith(
                        sinon.match({ variant: 'info', content: 'No links could be copied for these variations.' }),
                    ),
                ).to.be.true;
            } finally {
                clipboard.restore();
            }
        });
    });

    describe('reopening the add-items dialog', () => {
        it('clears the cards search cache on close so results reload next open, preserving the selection', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ surfaces: ['sandbox'] })));
            const { el, repo } = await mountEditorWithRepo();
            Store.page.set(PAGE_NAMES.PROMOTIONS_EDITOR);

            Store.promotions.selectedCards.set(['/card/a', '/card/b']);
            Store.promotions.allCards.set([{ path: '/card/a' }, { path: '/card/b' }]);
            Store.promotions.displayCards.set([{ path: '/card/a' }, { path: '/card/b' }]);
            Store.promotions.cardsByPaths.set(
                new Map([
                    ['/card/a', {}],
                    ['/card/b', {}],
                ]),
            );
            await el.updateComplete;
            expect(el.showSelectedEmptyState).to.be.false;
            repo.searchFragments.resetHistory();

            const dialog = el.renderRoot.querySelector('.add-items-dialog');
            dialog.dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            await el.updateComplete;

            expect(Store.promotions.allCards.value).to.deep.equal([]);
            expect(Store.promotions.displayCards.value).to.deep.equal([]);
            expect(Store.promotions.cardsByPaths.value.size).to.equal(0);
            expect(Store.promotions.selectedCards.value).to.deep.equal(['/card/a', '/card/b']);
            expect(repo.searchFragments.called).to.be.true;
        });
    });

    describe('validationStatus banner', () => {
        async function mountEditorWithValidation(validationStatus) {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const promotion = makePromotion({ id: 'p1', title: 'T' });
            promotion.validationStatus = validationStatus;
            Store.promotions.inEdit.set(new FragmentStore(promotion));
            const { el } = await mountEditorWithRepo();
            await el.updateComplete;
            return el;
        }

        it('renders a banner listing each validationStatus property and message', async () => {
            const el = await mountEditorWithValidation([{ property: 'fields.startDate.values[0]', message: 'is required' }]);
            const banner = el.renderRoot.querySelector('.fragment-validation-banner');
            expect(banner).to.exist;
            expect(banner.textContent).to.include('fields.startDate.values[0]');
            expect(banner.textContent).to.include('is required');
        });

        it('lists every message when validationStatus has multiple errors', async () => {
            const el = await mountEditorWithValidation([
                { property: 'fields.startDate.values[0]', message: 'is required' },
                { property: 'path', message: 'is not valid' },
            ]);
            const messages = el.renderRoot.querySelectorAll('.fragment-validation-banner-message');
            expect(messages.length).to.equal(2);
            expect(messages[0].textContent).to.include('is required');
            expect(messages[1].textContent).to.include('is not valid');
        });

        it('renders no banner when validationStatus is empty', async () => {
            const el = await mountEditorWithValidation(undefined);
            expect(el.renderRoot.querySelector('.fragment-validation-banner')).to.not.exist;
        });

        it('refreshes by id on open so errors show even when the list handed over a store without validationStatus', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            const listPayload = makePromotion({ id: 'promo-val', title: 'Invalid' });
            listPayload.validationStatus = [];
            Store.promotions.inEdit.set(new FragmentStore(listPayload));
            Store.promotions.promotionId.set('promo-val');

            const authoritative = makeFragmentData({ id: 'promo-val', title: 'Invalid' });
            authoritative.validationStatus = [
                { property: 'fields.fragments.values[0]', message: 'references a path that does not exist in JCR' },
            ];
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: { cf: { fragments: { getById: sandbox.stub().resolves(authoritative) } } },
                    getFragmentByPath: null,
                },
            });
            await waitForEditorConnect(el);
            await el.updateComplete;

            const banner = el.renderRoot.querySelector('.fragment-validation-banner');
            expect(banner).to.exist;
            expect(banner.textContent).to.include('references a path that does not exist in JCR');
        });
    });

    describe('items selector integration (mas-items-selector)', () => {
        beforeEach(() => {
            stubAemTagQueryFetch(sandbox);
            resetTagCache(MAS_TAG_NAMESPACE);
        });

        afterEach(() => {
            resetTagCache(MAS_TAG_NAMESPACE);
        });

        function pickerSelector(el) {
            return el.renderRoot.querySelector('.add-items-dialog mas-items-selector');
        }

        function viewSelector(el) {
            return el.renderRoot.querySelector('mas-items-selector[view-only]');
        }

        describe('picker (non-viewOnly) mas-items-selector', () => {
            it('renders exactly two picker tabs: fragments and collections', async () => {
                const { el } = await mountEditorWithRepo();
                await el.updateComplete;
                const selector = pickerSelector(el);
                expect(selector.shadowRoot.querySelectorAll('sp-tab').length).to.equal(2);
            });

            it('shows the Import via URL button', async () => {
                const { el } = await mountEditorWithRepo();
                await el.updateComplete;
                const selector = pickerSelector(el);
                expect(selector.shadowRoot.querySelector('.import-url-btn')).to.exist;
            });

            it('keeps the offer-based product filter active after leaving and returning from Import via URL', async () => {
                const { el } = await mountEditorWithRepo();
                Store.promotions.offerRecordsCache.set('offer-1', { tags: [{ id: 'mas:product_code/phsp' }] });
                Store.promotions.selectedOffers.set(['offer-1']);
                el.fragmentStore.updateField('surfaces', ['sandbox']);
                await el.updateComplete;
                const selector = pickerSelector(el);
                await selector.updateComplete;
                const cardsFilterBefore = [...selector.renderRoot.querySelectorAll('mas-search-and-filters')].find(
                    (f) => f.type === TABLE_TYPE.CARDS,
                );
                expect(cardsFilterBefore.productFilter).to.deep.equal(['mas:product_code/phsp']);

                selector.shadowRoot.querySelector('sp-button.import-url-btn').click();
                await selector.updateComplete;
                const importTabs = selector.shadowRoot.querySelector('.tabs-container.import-mode sp-tabs');
                importTabs.selected = TABLE_TYPE.CARDS;
                importTabs.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
                await selector.updateComplete;

                const cardsFilterAfter = [...selector.renderRoot.querySelectorAll('mas-search-and-filters')].find(
                    (f) => f.type === TABLE_TYPE.CARDS,
                );
                expect(cardsFilterAfter.productFilter).to.deep.equal(['mas:product_code/phsp']);
            });

            describe('Import via URL restrictions (surface + offer)', () => {
                const COPY_CODE_URL = (uuid) =>
                    `https://mas.adobe.com/studio.html#content-type=merch-card&page=content&path=sandbox&query=${uuid}`;

                const mockCard = (path, uuid, tags = []) => ({
                    id: uuid,
                    path,
                    title: 'Test Card',
                    model: { path: CARD_MODEL_PATH },
                    status: 'PUBLISHED',
                    tags,
                    fields: [],
                });

                const importViaUrl = async (selector, value) => {
                    const btn = selector.shadowRoot.querySelector('sp-button.import-url-btn');
                    btn.click();
                    await selector.updateComplete;
                    const textarea = selector.shadowRoot.querySelector('textarea.import-url-input');
                    const dt = new DataTransfer();
                    dt.setData('text/plain', value);
                    textarea.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: dt }));
                    await new Promise((resolve) => setTimeout(resolve, 0));
                    await selector.updateComplete;
                };

                const selectOfferWithProductTag = (offerId, productCode) => {
                    Store.promotions.offerRecordsCache.set(offerId, {
                        tags: [{ id: `mas:product_code/${productCode}` }],
                    });
                    Store.promotions.selectedOffers.set([offerId]);
                };

                let globalRepo;
                let originalQuerySelector;

                beforeEach(() => {
                    originalQuerySelector = document.querySelector.bind(document);
                    globalRepo = { aem: { sites: { cf: { fragments: { getById: sandbox.stub() } } } } };
                    sandbox.stub(document, 'querySelector').callsFake((selector) => {
                        if (selector === 'mas-repository') return globalRepo;
                        return originalQuerySelector(selector);
                    });
                });

                it('rejects a fragment from a surface not selected on the promotion', async () => {
                    const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
                    const card = mockCard('/content/dam/mas/acom/en_US/test-card', uuid, [{ id: 'mas:product_code/phsp' }]);
                    globalRepo.aem.sites.cf.fragments.getById.resolves(card);
                    const { el } = await mountEditorWithRepo();
                    selectOfferWithProductTag('offer-1', 'phsp');
                    el.fragmentStore.updateField('surfaces', ['sandbox']);
                    await el.updateComplete;
                    const selector = pickerSelector(el);
                    await importViaUrl(selector, COPY_CODE_URL(uuid));
                    expect(selector.importedUrls[0].status).to.equal('error');
                    expect(selector.importedUrls[0].errorMessage).to.match(/not allowed here/);
                    expect(Store.promotions.selectedCards.get()).to.not.include(card.path);
                });

                it('accepts a fragment whose surface is one of several surfaces selected on the promotion', async () => {
                    const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
                    const card = mockCard('/content/dam/mas/acom/en_US/test-card', uuid, [{ id: 'mas:product_code/phsp' }]);
                    globalRepo.aem.sites.cf.fragments.getById.resolves(card);
                    const { el } = await mountEditorWithRepo();
                    selectOfferWithProductTag('offer-1', 'phsp');
                    el.fragmentStore.updateField('surfaces', ['sandbox,acom']);
                    await el.updateComplete;
                    const selector = pickerSelector(el);
                    await importViaUrl(selector, COPY_CODE_URL(uuid));
                    expect(selector.importedUrls[0].status).to.equal('valid');
                    expect(Store.promotions.selectedCards.get()).to.include(card.path);
                });

                it('rejects a fragment that does not match any selected offer', async () => {
                    const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
                    const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid, [{ id: 'mas:product_code/ilst' }]);
                    globalRepo.aem.sites.cf.fragments.getById.resolves(card);
                    const { el } = await mountEditorWithRepo();
                    selectOfferWithProductTag('offer-1', 'phsp');
                    el.fragmentStore.updateField('surfaces', ['sandbox']);
                    await el.updateComplete;
                    const selector = pickerSelector(el);
                    await importViaUrl(selector, COPY_CODE_URL(uuid));
                    expect(selector.importedUrls[0].status).to.equal('error');
                    expect(selector.importedUrls[0].errorMessage).to.match(/does not match any selected offer/);
                    expect(Store.promotions.selectedCards.get()).to.not.include(card.path);
                });

                it('accepts a fragment matching one of several selected offers', async () => {
                    const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
                    const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid, [{ id: 'mas:product_code/ilst' }]);
                    globalRepo.aem.sites.cf.fragments.getById.resolves(card);
                    const { el } = await mountEditorWithRepo();
                    Store.promotions.offerRecordsCache.set('offer-1', { tags: [{ id: 'mas:product_code/phsp' }] });
                    Store.promotions.offerRecordsCache.set('offer-2', { tags: [{ id: 'mas:product_code/ilst' }] });
                    Store.promotions.selectedOffers.set(['offer-1', 'offer-2']);
                    el.fragmentStore.updateField('surfaces', ['sandbox']);
                    await el.updateComplete;
                    const selector = pickerSelector(el);
                    await importViaUrl(selector, COPY_CODE_URL(uuid));
                    expect(selector.importedUrls[0].status).to.equal('valid');
                    expect(Store.promotions.selectedCards.get()).to.include(card.path);
                });

                it('rejects when no offer is selected at all', async () => {
                    const uuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
                    const card = mockCard('/content/dam/mas/sandbox/en_US/test-card', uuid);
                    globalRepo.aem.sites.cf.fragments.getById.resolves(card);
                    const { el } = await mountEditorWithRepo();
                    el.fragmentStore.updateField('surfaces', ['sandbox']);
                    await el.updateComplete;
                    const selector = pickerSelector(el);
                    await importViaUrl(selector, COPY_CODE_URL(uuid));
                    expect(selector.importedUrls[0].status).to.equal('error');
                    expect(selector.importedUrls[0].errorMessage).to.match(/Select at least one offer/);
                });
            });

            it('forwards hidePromoVariations, hideGroupedVariations, variationTabs and selectableTabs to mas-select-items-table', async () => {
                const { el } = await mountEditorWithRepo();
                await el.updateComplete;
                const selector = pickerSelector(el);
                await selector.updateComplete;
                const table = selector.shadowRoot.querySelector('mas-select-items-table');
                expect(table.hidePromoVariations).to.be.true;
                expect(table.hideGroupedVariations).to.be.true;
                expect(table.tabs).to.deep.equal(['promotion', 'grouped']);
                expect(table.selectableTabs).to.deep.equal(['grouped']);
            });

            it('shows labeled surface picker options when multiple fragment surfaces are available', async () => {
                const { el } = await mountEditorWithRepo();
                el.fragmentStore.updateField('surfaces', ['sandbox,acom']);
                await el.updateComplete;
                const selector = pickerSelector(el);
                await selector.updateComplete;
                const cardsFilter = [...selector.renderRoot.querySelectorAll('mas-search-and-filters')].find(
                    (f) => f.type === TABLE_TYPE.CARDS,
                );
                expect(cardsFilter.promotionSurfaceOptions.map((o) => o.id)).to.deep.equal(['sandbox', 'acom']);
            });

            it('sets Store.search.query directly when the search input is a UUID', async () => {
                const { el } = await mountEditorWithRepo();
                await el.updateComplete;
                const selector = pickerSelector(el);
                const search = selector.shadowRoot.querySelector('sp-search');
                search.value = '12345678-1234-1234-1234-123456789012';
                search.dispatchEvent(new Event('submit', { bubbles: true, composed: true }));
                await selector.updateComplete;
                expect(Store.search.get().query).to.equal('12345678-1234-1234-1234-123456789012');
            });

            it('resetFilters delegates to the picker mas-items-selector', async () => {
                const { el } = await mountEditorWithRepo();
                el.fragmentStore.updateField('surfaces', ['sandbox']);
                await el.updateComplete;
                const selector = pickerSelector(el);
                await selector.updateComplete;
                const spy = sandbox.spy(selector, 'resetFilters');
                selector.resetFilters();
                expect(spy.called).to.be.true;
            });
        });

        describe('viewOnly mas-items-selector', () => {
            async function openWithSelection(el) {
                Store.promotions.selectedOffers.set(['offer-1']);
                Store.promotions.selectedCards.set(['/content/dam/mas/sandbox/en_US/card']);
                await el.updateComplete;
            }

            it('renders three view-only tabs for offers, fragments, and collections', async () => {
                const { el } = await mountEditorWithRepo();
                await openWithSelection(el);
                const selector = viewSelector(el);
                expect(selector.shadowRoot.querySelectorAll('sp-tab').length).to.equal(3);
            });

            it('renders mas-promotions-items-table for every tab', async () => {
                const { el } = await mountEditorWithRepo();
                await openWithSelection(el);
                const selector = viewSelector(el);
                expect(selector.shadowRoot.querySelectorAll('mas-promotions-items-table').length).to.equal(3);
            });

            it('includes selection counts in tab labels', async () => {
                const { el } = await mountEditorWithRepo();
                Store.promotions.selectedOffers.set(['offer-1', 'offer-2']);
                Store.promotions.selectedCards.set(['/a', '/b']);
                await el.updateComplete;
                const selector = viewSelector(el);
                const tabs = [...selector.shadowRoot.querySelectorAll('sp-tab')];
                const offersTab = tabs.find((t) => t.value === TABLE_TYPE.OFFERS);
                const cardsTab = tabs.find((t) => t.value === TABLE_TYPE.CARDS);
                expect(offersTab.textContent).to.include('(2)');
                expect(cardsTab.textContent).to.include('(2)');
            });

            it('re-dispatches promotion-offer-removed and resets to the offers tab', async () => {
                const { el } = await mountEditorWithRepo();
                await openWithSelection(el);
                el.selectedItemsViewTab = TABLE_TYPE.CARDS;
                await el.updateComplete;
                const selector = viewSelector(el);
                const table = selector.shadowRoot.querySelector('mas-promotions-items-table');
                table.dispatchEvent(new CustomEvent('promotion-offer-removed', { bubbles: true, composed: true }));
                await el.updateComplete;
                expect(el.selectedItemsViewTab).to.equal(TABLE_TYPE.OFFERS);
            });

            it('updates the toast when a child table dispatches show-toast', async () => {
                const { el } = await mountEditorWithRepo();
                await openWithSelection(el);
                const selector = viewSelector(el);
                const table = selector.shadowRoot.querySelector('mas-promotions-items-table');
                table.dispatchEvent(
                    new CustomEvent('show-toast', {
                        bubbles: true,
                        composed: true,
                        detail: { text: 'Toast text', variant: 'positive' },
                    }),
                );
                await el.updateComplete;
                const toast = selector.shadowRoot.querySelector('sp-toast');
                expect(toast.textContent).to.equal('Toast text');
                expect(toast.variant).to.equal('positive');
            });
        });
    });
});
