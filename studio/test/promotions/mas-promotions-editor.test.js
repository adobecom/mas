import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import MasPromotionsEditor from '../../src/mas-promotions-editor.js';
import { Promotion } from '../../src/aem/promotion.js';

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

function clickPromotionsFormButton(el, label) {
    const buttons = [...el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button')];
    const btn = buttons.find((b) => b.textContent.trim() === label);
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

describe('MasPromotionsEditor', () => {
    let sandbox;
    let originalInEdit;
    let originalSelectedCards;
    let originalSelectedCollections;
    let originalItemHydrateUnreachablePaths;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalInEdit = Store.promotions.inEdit.get();
        originalSelectedCards = [...Store.promotions.selectedCards.value];
        originalSelectedCollections = [...Store.promotions.selectedCollections.value];
        originalItemHydrateUnreachablePaths = [...Store.promotions.itemHydrateUnreachablePaths.value];
        Store.promotions.inEdit.set(null);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.itemHydrateUnreachablePaths.set([]);
        Store.promotions.promotionId.set(null);
        setItemsSelectionStore(Store.promotions);
    });

    afterEach(async () => {
        const editors = [...document.querySelectorAll('mas-promotions-editor')];
        for (const el of editors) {
            el.remove();
            await el.updateComplete;
        }
        await new Promise((resolve) => setTimeout(resolve, 350));
        sandbox.restore();
        Store.promotions.inEdit.set(originalInEdit);
        Store.promotions.selectedCards.set(originalSelectedCards);
        Store.promotions.selectedCollections.set(originalSelectedCollections);
        Store.promotions.itemHydrateUnreachablePaths.set(originalItemHydrateUnreachablePaths);
        Store.promotions.promotionId.set(null);
        setItemsSelectionStore(null);
    });

    async function mountEditor() {
        const el = new MasPromotionsEditor();
        sandbox.stub(el, 'repository').get(() => null);
        document.body.appendChild(el);
        await el.updateComplete;
        return el;
    }

    function makeRepo(overrides = {}) {
        return {
            getPromotionsPath: () => '/content/dam/mas/promotions',
            createFragment: sandbox.stub().resolves(makePromotion({ id: 'created-id', title: 'T' })),
            saveFragment: sandbox.stub().resolves(),
            publishFragment: sandbox.stub().resolves(true),
            getUnpublishedAttachedPromoVariations: sandbox.stub().resolves([]),
            unpublishFragment: sandbox.stub().resolves(true),
            searchFragments: sandbox.stub(),
            loadAllCollections: sandbox.stub(),
            aem: {
                sites: { cf: { fragments: { getById: sandbox.stub().resolves(null) } } },
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
        it('sums selected cards and collections from the promotions store', async () => {
            const el = await mountEditor();
            Store.promotions.selectedCards.set(['/c1']);
            Store.promotions.selectedCollections.set(['/col1', '/col2']);
            await el.updateComplete;
            expect(el.selectedItemsCount).to.equal(3);
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
            const el = await mountEditor();
            expect(Store.promotions.selectedCards.value).to.deep.equal([]);
            expect(el.showSelectedEmptyState).to.be.true;
        });

        it('does not preload fragment search until at least one surface is selected', async () => {
            const repo = makeRepo();
            const el = new MasPromotionsEditor();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await el.updateComplete;
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
            await el.updateComplete;
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
        it('shows Create button for new promotions', async () => {
            const el = await mountEditor();
            const buttons = el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button');
            const buttonTexts = Array.from(buttons).map((b) => b.textContent.trim());
            expect(buttonTexts).to.include('Create');
        });

        it('shows Update and Publish when promotion is not published', async () => {
            const el = await mountEditor();
            el.isNewPromotion = false;
            await el.updateComplete;
            const buttonTexts = Array.from(el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button')).map((b) =>
                b.textContent.trim(),
            );
            expect(buttonTexts).to.include('Update');
            expect(buttonTexts).to.include('Publish');
            expect(buttonTexts).to.not.include('Unpublish');
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
            const buttonTexts = Array.from(el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button')).map((b) =>
                b.textContent.trim(),
            );
            expect(buttonTexts).to.include('Publish');
            expect(buttonTexts).to.include('Unpublish');
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
            const publishFragment = sandbox.stub().resolves(true);
            const { el } = await mountEditorWithRepo({
                publishFragment,
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
                            },
                        },
                    },
                    getFragmentByPath: sandbox.stub().resolves(null),
                },
            });
            await el.updateComplete;
            clickPromotionsFormButton(el, 'Publish');
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(publishFragment.calledOnce).to.be.true;
        });

        it('shows Unpublish only when promotion is published', async () => {
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
            const buttonTexts = Array.from(el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button')).map((b) =>
                b.textContent.trim(),
            );
            expect(buttonTexts).to.include('Unpublish');
            expect(buttonTexts.filter((t) => t === 'Publish').length).to.equal(0);
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
            const publishBtn = [...el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button')].find(
                (b) => b.textContent.trim() === 'Publish',
            );
            expect(publishBtn).to.exist;
            expect(publishBtn.disabled === true || publishBtn.hasAttribute('disabled')).to.be.true;
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
            clickPromotionsFormButton(el, 'Create');
            await el.updateComplete;
            expect(repo.createFragment.called).to.be.false;
            expect(el.isCreated).to.be.false;
        });

        it('aborts create when surfaces are missing', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            el.fragmentStore.updateField('surfaces', []);
            await el.updateComplete;
            clickPromotionsFormButton(el, 'Create');
            await el.updateComplete;
            expect(repo.createFragment.called).to.be.false;
        });

        it('creates promotion when all required fields are valid', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            clickPromotionsFormButton(el, 'Create');
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            expect(el.isCreated).to.be.true;
        });

        it('handles create error gracefully without setting isCreated', async () => {
            const { el, repo } = await mountEditorWithRepo({
                createFragment: sandbox.stub().rejects(new Error('create failed')),
            });
            await fillValidFields(el);
            clickPromotionsFormButton(el, 'Create');
            await el.updateComplete;
            expect(el.isCreated).to.be.false;
        });
    });

    describe('update flow', () => {
        it('saves promotion when all required fields are valid', async () => {
            const { el, repo } = await mountEditorWithRepo();
            el.isNewPromotion = false;
            await fillValidFields(el);
            await el.updateComplete;
            clickPromotionsFormButton(el, 'Update');
            await el.updateComplete;
            expect(repo.saveFragment.calledOnce).to.be.true;
        });

        it('aborts save when required fields are missing', async () => {
            const { el, repo } = await mountEditorWithRepo();
            el.isNewPromotion = false;
            await el.updateComplete;
            clickPromotionsFormButton(el, 'Update');
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
            clickPromotionsFormButton(el, 'Update');
            await el.updateComplete;
            expect(repo.saveFragment.calledOnce).to.be.true;
        });
    });

    describe('publish reminder flow', () => {
        it('prompts before publish when attached promo variations are unpublished', async () => {
            const { el, repo } = await mountEditorWithRepo({
                getUnpublishedAttachedPromoVariations: sandbox.stub().resolves([{ path: '/promo-var-1', status: 'DRAFT' }]),
            });
            el.isNewPromotion = false;
            el.fragment.id = 'promo-1';
            await fillValidFields(el);
            el.fragmentStore.updateField('startDate', ['2030-01-01T00:00:00.000Z']);
            el.fragmentStore.updateField('endDate', ['2030-12-31T00:00:00.000Z']);
            el.fragment.hasChanges = false;
            Store.promotions.selectedCards.set([]);
            Store.promotions.selectedCollections.set([]);
            await el.updateComplete;

            clickPromotionsFormButton(el, 'Publish');
            await el.updateComplete;

            expect(repo.getUnpublishedAttachedPromoVariations.calledOnce).to.be.true;
            expect(repo.publishFragment.called).to.be.false;
        });
    });

    describe('cancel flow', () => {
        it('navigates to promotions page on cancel when no changes', async () => {
            const el = await mountEditor();
            const cancelBtn = el.renderRoot.querySelector('.promotions-form-buttons sp-button');
            cancelBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(Store.promotions.inEdit.get()).to.not.exist;
        });

        it('shows confirm dialog on cancel when fragment has unsaved changes', async () => {
            const el = await mountEditor();
            el.fragment.hasChanges = true;
            await el.updateComplete;
            const cancelBtn = el.renderRoot.querySelector('.promotions-form-buttons sp-button');
            cancelBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            el.renderRoot
                .querySelector('#promotion-unsaved-changes-dialog')
                .dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
            await el.updateComplete;
        });

        it('discards changes and navigates after confirmation', async () => {
            const el = await mountEditor();
            el.fragment.hasChanges = true;
            await el.updateComplete;
            const cancelBtn = el.renderRoot.querySelector('.promotions-form-buttons sp-button');
            cancelBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await el.updateComplete;
            el.renderRoot
                .querySelector('#promotion-unsaved-changes-dialog')
                .dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            await el.updateComplete;
            await Promise.resolve();
            await el.updateComplete;
            expect(Store.promotions.inEdit.get()).to.not.exist;
        });
    });

    describe('renderConfirmDialog', () => {
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
});
