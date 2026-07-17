import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import MasPromotionsEditor from '../../src/promotions/mas-promotions-editor.js';
import { Promotion } from '../../src/aem/promotion.js';
import { CARD_MODEL_PATH, EVENT_OST_OFFER_SELECT, PAGE_NAMES, TABLE_TYPE } from '../../src/constants.js';

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

    function makeRepo(overrides = {}) {
        return {
            getPromotionsPath: () => '/content/dam/mas/promotions',
            createFragment: sandbox.stub().resolves(makePromotion({ id: 'created-id', title: 'T' })),
            saveFragment: sandbox.stub().callsFake((store) => Promise.resolve(store.get())),
            publishFragment: sandbox.stub().resolves(true),
            unpublishFragment: sandbox.stub().resolves(true),
            searchFragments: sandbox.stub(),
            loadAllCollections: sandbox.stub(),
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
                            getByPath: sandbox.stub().resolves(null),
                        },
                    },
                },
                getFragmentByPath: null,
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
            const selector = el.renderRoot.querySelector('mas-promotions-items-selector');
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

        it('preloads fragment search when surfaces are already set', async () => {
            const { FragmentStore } = await import('../../src/reactivity/fragment-store.js');
            Store.promotions.inEdit.set(new FragmentStore(makePromotion({ surfaces: ['sandbox'] })));
            const repo = makeRepo();
            const el = new MasPromotionsEditor();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await waitForEditorConnect(el);
            expect(repo.searchFragments.calledOnce).to.be.true;
            expect(repo.loadAllCollections.calledOnce).to.be.true;
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
            expect(el.renderRoot.querySelector('sp-textfield[data-field="title"]').hasAttribute('disabled')).to.be.true;
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

        it('updates promotion tags via change on aem-tag-picker-field', async () => {
            const el = await mountEditor();
            const tagsPicker = el.renderRoot.querySelectorAll('aem-tag-picker-field')[0];
            expect(tagsPicker).to.not.be.null;
            tagsPicker.setAttribute('value', 'mas:promotion/back-to-school');
            tagsPicker.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            const tags = el.fragment.getFieldValues('tags');
            expect(tags).to.deep.equal(['mas:promotion/back-to-school']);
        });

        it('merges promotion tag change while retaining non-promotion tags', async () => {
            const el = await mountEditor();
            el.fragmentStore.updateField('tags', ['mas:status/published', 'mas:promotion/old']);
            await el.updateComplete;
            const tagsPicker = el.renderRoot.querySelectorAll('aem-tag-picker-field')[0];
            tagsPicker.setAttribute('value', 'mas:promotion/new');
            tagsPicker.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            expect(el.fragment.getFieldValues('tags')).to.deep.equal(['mas:status/published', 'mas:promotion/new']);
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
            expect(toastEmitStub.calledWith({ variant: 'negative', content: 'Project with this name already exists.' })).to.be
                .true;
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

        it('hydrates selectedCards from fragments field when getFragmentByPath is unavailable', async () => {
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
                                getByPath: sandbox.stub().resolves(null),
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
            const getByPath = sandbox.stub().resolves(null);
            getByPath.withArgs(promoVarPath).resolves({
                id: 'promo-var-id',
                path: promoVarPath,
                status: 'PUBLISHED',
                title: 'Published variation',
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
                                getByPath,
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

            expect(repo.aem.sites.cf.fragments.getByPath.calledWith(promoVarPath)).to.be.true;
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
            const getByPath = sandbox.stub().resolves(null);
            getByPath.withArgs(promoVarPath).resolves({
                id: 'promo-var-id',
                path: promoVarPath,
                status: 'DRAFT',
                title: 'Unpublished variation',
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
                                getByPath,
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

            expect(repo.aem.sites.cf.fragments.getByPath.calledWith(promoVarPath)).to.be.true;
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
            const getByPath = sandbox.stub().resolves(null);
            getByPath.withArgs(promoVarPath).resolves({ id: 'promo-var-id', path: promoVarPath, status: 'DRAFT' });
            const { el } = await mountEditorWithRepo({
                deleteFragment: sandbox.stub().resolves(true),
                aem: { sites: { cf: { fragments: { getByPath, getById: sandbox.stub().resolves(null) } } } },
            });
            await el.updateComplete;
            clickPromotionQuickAction(el, 'Delete');
            await new Promise((r) => setTimeout(r, 0));
            await el.updateComplete;
            expect(el.confirmDialogConfig?.message).to.equal(
                'Are you sure you want to delete the promotion project "To Delete"? This action cannot be undone. 1 promo variation(s) will also be deleted.',
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

        it('deletes attached promo variations before deleting the project', async () => {
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
            const getByPath = sandbox.stub().resolves(null);
            getByPath.withArgs(promoVarPath).resolves({ id: 'promo-var-id', path: promoVarPath, status: 'DRAFT' });
            const forceDelete = sandbox.stub().resolves();
            const deleteFragment = sandbox.stub().resolves(true);
            const { el, repo } = await mountEditorWithRepo({
                deleteFragment,
                aem: {
                    sites: { cf: { fragments: { getByPath, getById: sandbox.stub().resolves(null), forceDelete } } },
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
            expect(forceDelete.calledOnceWith({ path: promoVarPath })).to.be.true;
            expect(repo.deleteFragment.calledOnce).to.be.true;
            expect(forceDelete.calledBefore(repo.deleteFragment)).to.be.true;
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
            const variationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                getByPath: sandbox
                                    .stub()
                                    .withArgs(variationPath)
                                    .resolves({
                                        id: 'variation-id',
                                        path: variationPath,
                                        status: 'PUBLISHED',
                                        title: 'Variation',
                                        model: { path: CARD_MODEL_PATH },
                                        tags: [],
                                        fields: [],
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
            const variationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                getByPath: sandbox
                                    .stub()
                                    .withArgs(variationPath)
                                    .resolves({
                                        id: 'variation-id',
                                        path: variationPath,
                                        status: 'DRAFT',
                                        title: 'Variation',
                                        model: { path: CARD_MODEL_PATH },
                                        tags: [],
                                        fields: [],
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
            const variationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                // Simulates an AEM response missing `tags`/`fields`, which used to throw
                                // inside Fragment.getTagTitle() outside the try/catch.
                                getByPath: sandbox
                                    .stub()
                                    .withArgs(variationPath)
                                    .resolves({
                                        id: 'variation-id',
                                        path: variationPath,
                                        status: 'PUBLISHED',
                                        title: 'Variation',
                                        model: { path: CARD_MODEL_PATH },
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
            const supportedPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const unsupportedPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/other-card';
            const getByPath = sandbox.stub();
            getByPath.withArgs(supportedPath).resolves({
                id: 'variation-id',
                path: supportedPath,
                status: 'PUBLISHED',
                title: 'Variation',
                model: { path: CARD_MODEL_PATH },
                tags: [],
                fields: [],
            });
            getByPath.withArgs(unsupportedPath).resolves({
                id: 'variation-id-2',
                path: unsupportedPath,
                status: 'PUBLISHED',
                title: 'Variation 2',
                model: { path: '/conf/mas/settings/dam/cfm/models/unknown' },
                tags: [],
                fields: [],
            });
            const { el } = await mountEditorWithRepo({
                aem: { sites: { cf: { fragments: { getById: sandbox.stub().resolves(null), getByPath } } } },
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
            const variationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const { el } = await mountEditorWithRepo({
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getById: sandbox.stub().resolves(null),
                                getByPath: sandbox
                                    .stub()
                                    .withArgs(variationPath)
                                    .resolves({
                                        id: 'variation-id',
                                        path: variationPath,
                                        status: 'PUBLISHED',
                                        title: 'Variation',
                                        model: { path: '/conf/mas/settings/dam/cfm/models/unknown' },
                                        tags: [],
                                        fields: [],
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
});
