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
        status: 'DRAFT',
    };
}

function makePromotion(overrides = {}) {
    return new Promotion(makeFragmentData(overrides));
}

describe('MasPromotionsEditor', () => {
    let sandbox;
    let originalInEdit;
    let originalSelectedCards;
    let originalSelectedCollections;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalInEdit = Store.promotions.inEdit.get();
        originalSelectedCards = [...Store.promotions.selectedCards.value];
        originalSelectedCollections = [...Store.promotions.selectedCollections.value];
        Store.promotions.inEdit.set(null);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.promotionId.set(null);
        setItemsSelectionStore(Store.promotions);
    });

    afterEach(() => {
        sandbox.restore();
        Store.promotions.inEdit.set(originalInEdit);
        Store.promotions.selectedCards.set(originalSelectedCards);
        Store.promotions.selectedCollections.set(originalSelectedCollections);
        Store.promotions.promotionId.set(null);
        document.querySelectorAll('mas-promotions-editor').forEach((n) => n.remove());
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
        el.fragmentStore.updateField('startDate', ['2024-01-01T00:00:00.000Z']);
        el.fragmentStore.updateField('endDate', ['2024-12-31T00:00:00.000Z']);
        el.fragmentStore.updateField('geos', ['mas:locale/us']);
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

        it('calls searchFragments on repository when available', async () => {
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
            await new Promise((r) => setTimeout(r, 20));
            await el.updateComplete;
            expect(el.isNewPromotion).to.be.false;
            expect(el.fragment).to.not.be.null;
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
            await new Promise((r) => setTimeout(r, 20));
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

        it('shows Update button for existing promotions', async () => {
            const el = await mountEditor();
            el.isNewPromotion = false;
            await el.updateComplete;
            const buttons = el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button');
            const buttonTexts = Array.from(buttons).map((b) => b.textContent.trim());
            expect(buttonTexts).to.include('Update');
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
            await new Promise((r) => setTimeout(r, 10));
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

        it('updates tags via change on aem-tag-picker-field', async () => {
            const el = await mountEditor();
            const tagPickers = el.renderRoot.querySelectorAll('aem-tag-picker-field');
            const tagsPicker = tagPickers[0];
            expect(tagsPicker).to.not.be.null;
            tagsPicker.setAttribute('value', 'mas:plan_type/abm,mas:plan_type/m2m');
            tagsPicker.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            const tags = el.fragment.getFieldValues('tags');
            expect(tags).to.deep.equal(['mas:plan_type/abm', 'mas:plan_type/m2m']);
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
            const buttons = el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button');
            buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 20));
            expect(repo.createFragment.called).to.be.false;
            expect(el.isCreated).to.be.false;
        });

        it('creates promotion when all required fields are valid', async () => {
            const { el, repo } = await mountEditorWithRepo();
            await fillValidFields(el);
            const buttons = el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button');
            buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 50));
            await el.updateComplete;
            expect(repo.createFragment.calledOnce).to.be.true;
            expect(el.isCreated).to.be.true;
        });

        it('handles create error gracefully without setting isCreated', async () => {
            const { el, repo } = await mountEditorWithRepo({
                createFragment: sandbox.stub().rejects(new Error('create failed')),
            });
            await fillValidFields(el);
            const buttons = el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button');
            buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 50));
            expect(el.isCreated).to.be.false;
        });
    });

    describe('update flow', () => {
        it('saves promotion when all required fields are valid', async () => {
            const { el, repo } = await mountEditorWithRepo();
            el.isNewPromotion = false;
            await fillValidFields(el);
            await el.updateComplete;
            const buttons = el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button');
            buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 50));
            expect(repo.saveFragment.calledOnce).to.be.true;
        });

        it('aborts save when required fields are missing', async () => {
            const { el, repo } = await mountEditorWithRepo();
            el.isNewPromotion = false;
            await el.updateComplete;
            const buttons = el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button');
            buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 20));
            expect(repo.saveFragment.called).to.be.false;
        });

        it('handles save error gracefully', async () => {
            const { el, repo } = await mountEditorWithRepo({
                saveFragment: sandbox.stub().rejects(new Error('save failed')),
            });
            el.isNewPromotion = false;
            await fillValidFields(el);
            await el.updateComplete;
            const buttons = el.renderRoot.querySelectorAll('.promotions-form-buttons sp-button');
            buttons[1].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 50));
            expect(repo.saveFragment.calledOnce).to.be.true;
        });
    });

    describe('cancel flow', () => {
        it('navigates to promotions page on cancel when no changes', async () => {
            const el = await mountEditor();
            const cancelBtn = el.renderRoot.querySelector('.promotions-form-buttons sp-button');
            cancelBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((r) => setTimeout(r, 10));
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
            await new Promise((r) => setTimeout(r, 10));
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
            await new Promise((r) => setTimeout(r, 10));
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
