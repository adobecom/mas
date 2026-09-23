import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import '../../src/promotions/mas-promotions.js';
import { Promotion } from '../../src/aem/promotion.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { makeSearchStub as makeSharedSearchStub } from '../helpers/aem-tag-fetch.js';
import { UserFriendlyError } from '../../src/utils.js';
import { STAGED } from '../../src/constants.js';
import '../../src/swc.js';

function makeFragmentData(overrides = {}) {
    return {
        id: overrides.id ?? null,
        title: overrides.title ?? '',
        path: overrides.path ?? '/content/dam/mas/promotions/test',
        fields: overrides.fields ?? [
            { name: 'title', type: 'text', values: [overrides.title ?? ''] },
            { name: 'promoCode', type: 'text', values: [''] },
            { name: 'startDate', values: [overrides.startDate ?? '2024-01-01T00:00:00.000Z'] },
            { name: 'endDate', values: [overrides.endDate ?? '2024-12-31T00:00:00.000Z'] },
            { name: 'tags', values: [] },
            { name: 'surfaces', type: 'text', multiple: false, values: overrides.surfaces ?? ['acom'] },
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

describe('MasPromotions', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.promotions.list.data.set([]);
        Store.promotions.list.data.removeMeta('listFetched');
        Store.promotions.list.loading.set(false);
        Store.promotions.list.filter.set('all');
        Store.promotions.list.search.set('');
        Store.profile.set({ email: 'editor@adobe.com' });
        Store.users.set([{ userPrincipalName: 'editor@adobe.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
    });

    afterEach(async () => {
        for (const el of [...document.querySelectorAll('mas-promotions')]) {
            el.remove();
        }
        sandbox.restore();
        Store.promotions.list.data.set([]);
        Store.promotions.list.data.removeMeta('listFetched');
        Store.promotions.list.loading.set(true);
        Store.promotions.list.filter.set('active');
        Store.promotions.list.search.set('');
        Store.profile.set(null);
        Store.users.set([]);
    });

    function makeRepo(overrides = {}) {
        return {
            getPromotionsPath: () => '/content/dam/mas/promotions',
            createFragment: sandbox.stub().resolves(makePromotion({ id: 'dup-2', title: 'Original copy' })),
            loadPromotions: sandbox.stub().callsFake(async () => {
                Store.promotions.list.loading.set(false);
            }),
            aem: {
                tags: {
                    create: sandbox.stub().resolves(),
                    delete: sandbox.stub().resolves(),
                },
            },
            ...overrides,
        };
    }

    async function mountWithRepo(promotion, repoOverrides = {}) {
        const repo = makeRepo(repoOverrides);
        Store.promotions.list.data.set([new FragmentStore(promotion)]);
        const el = document.createElement('mas-promotions');
        sandbox.stub(el, 'repository').get(() => repo);
        document.body.appendChild(el);
        await el.updateComplete;
        await el.loadPromotions();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await el.updateComplete;
        return { el, repo };
    }

    function clickDuplicateMenuItem(el) {
        const menuItem = [...el.shadowRoot.querySelectorAll('sp-menu-item')].find((item) =>
            item.textContent.includes('Duplicate'),
        );
        menuItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    }

    function dispatchDuplicateConfirmed(el, detail = { title: 'Original copy' }) {
        el.shadowRoot
            .querySelector('mas-promotion-duplicate-dialog')
            .dispatchEvent(new CustomEvent('duplicate-confirmed', { bubbles: true, composed: true, detail }));
    }

    function stagePromotion(promotion) {
        promotion.getField('tags').values = [STAGED.TAG];
        return promotion;
    }

    function findMenuItem(el, text) {
        return [...el.shadowRoot.querySelectorAll('sp-menu-item')].find((item) => item.textContent.includes(text));
    }

    describe('#handleDuplicatePromotionFromList', () => {
        it('proposes a title and sources existingTitles from the promotions list before opening the dialog', async () => {
            const promotion = makePromotion({ id: 'src-1', title: 'Original' });
            const other = makePromotion({ id: 'other-1', title: 'Another promo' });
            const { el } = await mountWithRepo(promotion);
            Store.promotions.list.data.set([new FragmentStore(promotion), new FragmentStore(other)]);
            await el.updateComplete;

            clickDuplicateMenuItem(el);
            await el.updateComplete;

            expect(el.duplicateDialogOpen).to.be.true;
            const dialog = el.shadowRoot.querySelector('mas-promotion-duplicate-dialog');
            expect(dialog.proposedTitle).to.equal('Original copy');
            expect(dialog.existingTitles).to.include.members(['Original', 'Another promo']);
        });
    });

    describe('rendering and guards', () => {
        it('sets an error when connected without a repository', async () => {
            const el = document.createElement('mas-promotions');
            sandbox.stub(el, 'repository').get(() => null);
            document.body.appendChild(el);
            await el.updateComplete;

            expect(el.error).to.equal('Repository component not found');
            expect(el.shadowRoot.querySelector('.error-message').textContent).to.include('Repository component not found');
        });

        it('ensures a repository and stores a custom error when it is unavailable', async () => {
            const el = document.createElement('mas-promotions');
            sandbox.stub(el, 'repository').get(() => null);
            document.body.appendChild(el);
            await el.updateComplete;

            expect(() => el.ensureRepository('Missing promotions repository')).to.throw('Missing promotions repository');
            expect(el.error).to.equal('Missing promotions repository');
        });

        it('renders the loading state and the empty state', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);

            Store.promotions.list.loading.set(true);
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.loading-container--flex')).to.exist;

            Store.promotions.list.loading.set(false);
            Store.promotions.list.data.set([]);
            await el.updateComplete;
            expect(el.shadowRoot.querySelector('.no-promotions-message')).to.exist;
        });

        it('renders view actions for users without promotion edit access', async () => {
            Store.users.set([{ userPrincipalName: 'editor@adobe.com', groups: [] }]);
            const promotion = makePromotion({ id: 'promo-1', title: 'View only' });
            const { el } = await mountWithRepo(promotion);
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');

            expect(menuItems).to.have.lengthOf(1);
            expect(menuItems[0].textContent).to.include('View');
        });

        it('handles environment checkbox, tag delete, and clear-all controls', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);
            const checkbox = el.shadowRoot.querySelector('sp-checkbox[value="test"]');

            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            expect(el.environmentFilter).to.include('test');

            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
            expect(el.environmentFilter).to.not.include('test');

            el.environmentFilter = ['production', 'test'];
            await el.updateComplete;
            const tag = el.shadowRoot.querySelector('sp-tag');
            tag.value = 'test';
            tag.dispatchEvent(new CustomEvent('delete', { bubbles: true }));
            await el.updateComplete;
            expect(el.environmentFilter).to.deep.equal(['production']);

            el.shadowRoot.querySelector('.applied-filters sp-action-button').click();
            await el.updateComplete;
            expect(el.environmentFilter).to.deep.equal([]);
        });

        it('resolves the rendered confirmation dialog', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);
            el.confirmDialogConfig = {
                title: 'Confirm',
                message: 'Continue?',
                confirmText: 'Yes',
                cancelText: 'No',
                variant: 'confirmation',
                onConfirm: sandbox.stub(),
                onCancel: sandbox.stub(),
            };
            el.isDialogOpen = true;
            await el.updateComplete;
            el.shadowRoot
                .querySelector('sp-dialog-wrapper')
                .dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            await el.updateComplete;

            expect(el.confirmDialogConfig).to.equal(null);
            expect(el.isDialogOpen).to.be.false;
        });

        it('cancels the rendered confirmation dialog', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);
            const onCancel = sandbox.stub();
            el.confirmDialogConfig = {
                title: 'Confirm',
                message: 'Continue?',
                onConfirm: sandbox.stub(),
                onCancel,
            };
            el.isDialogOpen = true;
            await el.updateComplete;
            el.shadowRoot
                .querySelector('sp-dialog-wrapper')
                .dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
            await el.updateComplete;

            expect(onCancel.calledOnce).to.be.true;
            expect(el.confirmDialogConfig).to.equal(null);
            expect(el.isDialogOpen).to.be.false;
        });

        it('navigates to the editor from create, edit, and row double-click actions', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);
            const createButton = el.shadowRoot.querySelector('.create-button');
            createButton.click();
            expect(Store.page.get()).to.equal('promotions-editor');

            Store.page.set('promotions');
            await el.updateComplete;
            const editItem = [...el.shadowRoot.querySelectorAll('sp-menu-item')].find((item) =>
                item.textContent.includes('Edit'),
            );
            editItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            expect(Store.promotions.inEdit.get().get().id).to.equal('promo-1');
            expect(Store.promotions.promotionId.get()).to.equal('promo-1');

            Store.page.set('promotions');
            const row = el.shadowRoot.querySelector('sp-table-row');
            row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
            expect(Store.page.get()).to.equal('promotions-editor');
        });

        it('deletes a promotion after confirmation and removes its tag', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original', tags: ['mas:promotion/original'] });
            const deleteFragment = sandbox.stub().resolves();
            const toastStub = sandbox.stub(Events.toast, 'emit');
            const { el, repo } = await mountWithRepo(promotion, { deleteFragment });

            const deleteItem = [...el.shadowRoot.querySelectorAll('sp-menu-item')].find((item) =>
                item.textContent.includes('Delete'),
            );
            deleteItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 0));
            await el.updateComplete;
            el.shadowRoot
                .querySelector('sp-dialog-wrapper')
                .dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 20));

            expect(deleteFragment.calledOnce).to.be.true;
            expect(repo.aem.tags.delete.calledOnce).to.be.true;
            expect(Store.promotions.list.data.get()).to.deep.equal([]);
            expect(toastStub.calledWith(sinon.match({ variant: 'positive' }))).to.be.true;
        });

        it('ignores unpublish requests for a promotion without an id', async () => {
            const promotion = makePromotion({ title: 'Unsaved', id: null, status: 'PUBLISHED' });
            const { el } = await mountWithRepo(promotion);
            await el.updateComplete;

            const unpublishItem = [...el.shadowRoot.querySelectorAll('sp-menu-item')].find((item) =>
                item.textContent.includes('Unpublish'),
            );
            if (unpublishItem) unpublishItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            expect(unpublishItem).to.exist;
        });

        it('resolves the repository from the DOM when the getter is not stubbed', async () => {
            sandbox.stub(globalThis, 'fetch').rejects(new Error('no network in test'));
            const repoEl = document.createElement('mas-repository');
            repoEl.setAttribute('bucket', 'test-bucket');
            document.body.appendChild(repoEl);
            const el = document.createElement('mas-promotions');
            document.body.appendChild(el);
            await el.updateComplete;

            expect(el.repository).to.equal(repoEl);
            repoEl.remove();
        });

        it('returns the repository from ensureRepository when it is available', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el, repo } = await mountWithRepo(promotion);

            expect(el.ensureRepository()).to.equal(repo);
        });

        it('derives promotionsData filtered by status and environment', async () => {
            const active = makePromotion({
                id: 'promo-1',
                title: 'Active',
                status: 'PUBLISHED',
                surfaces: ['acom'],
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2099-12-31T00:00:00.000Z',
            });
            const draftTest = makePromotion({ id: 'promo-2', title: 'Draft test', status: 'DRAFT', surfaces: ['sandbox'] });
            const { el } = await mountWithRepo(active);
            Store.promotions.list.data.set([new FragmentStore(active), new FragmentStore(draftTest)]);
            el.filter = 'active';
            el.environmentFilter = ['production'];
            await el.updateComplete;

            expect(el.promotionsData).to.have.lengthOf(1);
            expect(el.promotionsData[0].value.title).to.equal('Active');
        });

        it('closes the duplicate dialog when the dialog is cancelled', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);
            clickDuplicateMenuItem(el);
            await el.updateComplete;
            expect(el.duplicateDialogOpen).to.be.true;

            el.shadowRoot
                .querySelector('mas-promotion-duplicate-dialog')
                .dispatchEvent(new CustomEvent('duplicate-cancelled', { bubbles: true, composed: true }));
            await el.updateComplete;

            expect(el.duplicateDialogOpen).to.be.false;
        });

        it('does not navigate to the editor when a double-click originates from the action menu', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);
            Store.page.set('promotions');

            el.shadowRoot
                .querySelector('sp-action-menu')
                .dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));

            expect(Store.page.get()).to.equal('promotions');
        });

        it('ignores delete requests while a confirmation dialog is already open', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const deleteFragment = sandbox.stub().resolves();
            const { el, repo } = await mountWithRepo(promotion, { deleteFragment });
            el.isDialogOpen = true;
            await el.updateComplete;

            findMenuItem(el, 'Delete').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(repo.deleteFragment.called).to.be.false;
        });

        it('shows a failure toast and does not clear the list when deleting a promotion fails', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original', tags: ['mas:promotion/original'] });
            const deleteFragment = sandbox.stub().rejects(new Error('boom'));
            const toastStub = sandbox.stub(Events.toast, 'emit');
            const { el, repo } = await mountWithRepo(promotion, { deleteFragment });

            findMenuItem(el, 'Delete').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 0));
            await el.updateComplete;
            el.shadowRoot
                .querySelector('sp-dialog-wrapper')
                .dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 20));

            expect(deleteFragment.calledOnce).to.be.true;
            expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: 'Failed to delete promotion campaign.' })))
                .to.be.true;
        });

        it('ignores duplicate requests from the list while another duplicate is in progress', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);
            el.duplicating = true;
            await el.updateComplete;

            clickDuplicateMenuItem(el);

            expect(el.duplicateDialogOpen).to.be.false;
        });
    });

    describe('#handlePublishPromotionFromList', () => {
        function makePublishableRepo(overrides = {}) {
            return {
                operation: { set: sandbox.stub() },
                aem: {
                    sites: { cf: { fragments: { publish: sandbox.stub().resolves() } } },
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
                },
                ...overrides,
            };
        }

        it('publishes a promotion project and refreshes the list', async () => {
            const promotion = makePromotion({
                id: 'promo-1',
                title: 'Ready',
                status: 'DRAFT',
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2099-12-31T00:00:00.000Z',
            });
            const { el, repo } = await mountWithRepo(promotion, makePublishableRepo());

            findMenuItem(el, 'Publish').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(repo.aem.sites.cf.fragments.publish.calledOnce).to.be.true;
            expect(repo.loadPromotions.calledTwice).to.be.true;
        });

        it('shows the staged confirmation dialog before publishing and aborts when cancelled', async () => {
            const promotion = stagePromotion(
                makePromotion({
                    id: 'promo-1',
                    title: 'Staged',
                    status: 'DRAFT',
                    startDate: '2020-01-01T00:00:00.000Z',
                    endDate: '2099-12-31T00:00:00.000Z',
                }),
            );
            const { el, repo } = await mountWithRepo(promotion, makePublishableRepo());

            findMenuItem(el, 'Publish').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;

            el.shadowRoot
                .querySelector('sp-dialog-wrapper')
                .dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 20));

            expect(repo.aem.sites.cf.fragments.publish.called).to.be.false;
            expect(el.isDialogOpen).to.be.false;
        });

        it('skips publishing when a confirmation dialog is already open', async () => {
            const promotion = stagePromotion(
                makePromotion({
                    id: 'promo-1',
                    title: 'Staged',
                    status: 'DRAFT',
                    startDate: '2020-01-01T00:00:00.000Z',
                    endDate: '2099-12-31T00:00:00.000Z',
                }),
            );
            const { el, repo } = await mountWithRepo(promotion, makePublishableRepo());
            el.isDialogOpen = true;
            await el.updateComplete;

            findMenuItem(el, 'Publish').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 20));

            expect(repo.aem.sites.cf.fragments.publish.called).to.be.false;
        });
    });

    describe('#handleUnpublishPromotionFromList', () => {
        it('unpublishes a promotion project and refreshes the list', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Live', status: 'PUBLISHED' });
            const { el, repo } = await mountWithRepo(promotion, {
                operation: { set: sandbox.stub() },
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getWithEtag: sandbox.stub().resolves({ id: 'promo-1', etag: '"x"' }),
                                unpublish: sandbox.stub().resolves(),
                            },
                        },
                    },
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
                },
            });

            findMenuItem(el, 'Unpublish').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(repo.aem.sites.cf.fragments.unpublish.calledOnce).to.be.true;
            expect(repo.loadPromotions.calledTwice).to.be.true;
        });
    });

    describe('#onDuplicateConfirmed wiring (list-view duplication path)', () => {
        it('duplicates the source promotion, refreshes the list, and shows the success toast', async () => {
            const promotion = makePromotion({ id: 'src-1', title: 'Original' });
            const { el, repo } = await mountWithRepo(promotion);

            clickDuplicateMenuItem(el);
            await el.updateComplete;
            expect(el.duplicateDialogOpen).to.be.true;

            const toastStub = sandbox.stub(Events.toast, 'emit');
            dispatchDuplicateConfirmed(el);
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(repo.createFragment.calledOnce).to.be.true;
            expect(repo.loadPromotions.calledTwice).to.be.true;
            expect(toastStub.calledWith(sinon.match({ variant: 'positive', content: 'Project successfully duplicated.' }))).to
                .be.true;
            expect(el.duplicateDialogOpen).to.be.false;
            expect(el.duplicating).to.be.false;
        });

        it('shows a warning toast (not positive) when attached variations fail to clone', async () => {
            const promotion = makePromotion({
                id: 'src-1',
                title: 'Original',
                fields: [
                    { name: 'title', type: 'text', values: ['Original'] },
                    { name: 'promoCode', type: 'text', values: [''] },
                    { name: 'startDate', values: ['2024-01-01T00:00:00.000Z'] },
                    { name: 'endDate', values: ['2024-12-31T00:00:00.000Z'] },
                    { name: 'tags', values: ['mas:promotion/original'] },
                    { name: 'surfaces', type: 'text', multiple: false, values: ['acom'] },
                    { name: 'geos', type: 'tag', multiple: true, values: [] },
                    { name: 'fragments', type: 'content-fragment', multiple: true, values: ['/some/card'] },
                ],
            });
            const originalGetFieldValues = promotion.getFieldValues.bind(promotion);
            sandbox.stub(promotion, 'getFieldValues').callsFake((name) => {
                if (name === 'fragments') throw new Error('boom');
                return originalGetFieldValues(name);
            });
            const { el } = await mountWithRepo(promotion, {
                aem: {
                    sites: { cf: { fragments: { search: makeSharedSearchStub(sandbox) } } },
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
                },
            });

            clickDuplicateMenuItem(el);
            await el.updateComplete;

            const toastStub = sandbox.stub(Events.toast, 'emit');
            dispatchDuplicateConfirmed(el, { title: 'Original copy', duplicateVariations: true });
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(
                toastStub.calledWith(sinon.match({ variant: 'warning', content: 'Project duplicated, 1 variation failed.' })),
            ).to.be.true;
        });

        it('shows a failure toast and does not refresh the list when duplication fails', async () => {
            const promotion = makePromotion({ id: 'src-1', title: 'Original' });
            const { el, repo } = await mountWithRepo(promotion, {
                createFragment: sandbox.stub().rejects(new Error('boom')),
            });

            clickDuplicateMenuItem(el);
            await el.updateComplete;

            const toastStub = sandbox.stub(Events.toast, 'emit');
            dispatchDuplicateConfirmed(el);
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(repo.loadPromotions.calledOnce).to.be.true;
            expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: 'Failed to duplicate project.' }))).to.be
                .true;
            expect(el.duplicateDialogOpen).to.be.false;
            expect(el.duplicating).to.be.false;
        });

        it('shows the UserFriendlyError message when duplication fails with a friendly error', async () => {
            const promotion = makePromotion({ id: 'src-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion, {
                createFragment: sandbox.stub().rejects(new UserFriendlyError('Custom friendly message')),
            });

            clickDuplicateMenuItem(el);
            await el.updateComplete;

            const toastStub = sandbox.stub(Events.toast, 'emit');
            dispatchDuplicateConfirmed(el);
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: 'Custom friendly message' }))).to.be.true;
        });

        it('does nothing when fired without a pending duplicate fragment', async () => {
            const promotion = makePromotion({ id: 'src-1', title: 'Original' });
            const { el, repo } = await mountWithRepo(promotion);

            const toastStub = sandbox.stub(Events.toast, 'emit');
            dispatchDuplicateConfirmed(el);
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(repo.createFragment.called).to.be.false;
            expect(toastStub.called).to.be.false;
        });
    });

    describe('search', () => {
        it('filters promotions by the selected environment and shows both environments when cleared', async () => {
            const production = makePromotion({
                id: 'production-1',
                title: 'Production promotion',
                surfaces: ['acom'],
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2099-12-31T00:00:00.000Z',
            });
            const test = makePromotion({
                id: 'test-1',
                title: 'Test promotion',
                surfaces: ['sandbox'],
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2099-12-31T00:00:00.000Z',
            });
            const { el } = await mountWithRepo(production);
            Store.promotions.list.data.set([new FragmentStore(production), new FragmentStore(test)]);
            await el.updateComplete;

            expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(1);
            expect(el.shadowRoot.querySelector('sp-table-row').textContent).to.include('Production promotion');

            el.environmentFilter = [];
            await el.updateComplete;

            expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(2);
        });

        it('disables the search input while promotions are loading and enables it once they finish loading', async () => {
            let resolveLoad;
            const loadPromise = new Promise((resolve) => {
                resolveLoad = resolve;
            });
            const repo = makeRepo({
                loadPromotions: sandbox.stub().callsFake(async () => {
                    await loadPromise;
                    Store.promotions.list.loading.set(false);
                }),
            });
            const el = document.createElement('mas-promotions');
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await el.updateComplete;
            const componentLoadPromise = el.loadPromotions();

            const search = el.shadowRoot.querySelector('sp-search');
            expect(search.disabled).to.be.true;

            resolveLoad();
            await componentLoadPromise;
            await el.updateComplete;

            expect(search.disabled).to.be.false;
        });

        it('filters the visible rows live from an input event, without pressing Enter, and leaves the selected status filter unchanged', async () => {
            const first = makePromotion({ id: 'promo-1', title: 'Black Friday Sale' });
            const second = makePromotion({ id: 'promo-2', title: 'Holiday Bundle' });
            const { el } = await mountWithRepo(first);
            Store.promotions.list.data.set([new FragmentStore(first), new FragmentStore(second)]);
            await el.updateComplete;

            expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(2);

            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'black';
            search.dispatchEvent(new Event('input'));
            await el.updateComplete;

            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows).to.have.lengthOf(1);
            expect(rows[0].textContent).to.include('Black Friday Sale');
            expect(Store.promotions.list.filter.get()).to.equal('all');
        });

        it("persists the search term when switching status filters and reapplies it to the newly selected filter's list", async () => {
            const draftMatch = makePromotion({
                id: 'promo-1',
                title: 'Winter Draft Promo',
                status: 'DRAFT',
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2099-12-31T00:00:00.000Z',
            });
            const draftOther = makePromotion({
                id: 'promo-2',
                title: 'Spring Draft Promo',
                status: 'DRAFT',
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2099-12-31T00:00:00.000Z',
            });
            const { el } = await mountWithRepo(draftMatch);
            Store.promotions.list.data.set([new FragmentStore(draftMatch), new FragmentStore(draftOther)]);
            await el.updateComplete;

            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'winter';
            search.dispatchEvent(new Event('input'));
            await el.updateComplete;

            const draftTile = [...el.shadowRoot.querySelectorAll('.status-tile')].find(
                (tile) => tile.querySelector('.status-tile-label').textContent.trim() === 'Draft',
            );
            draftTile.click();
            await el.updateComplete;

            expect(Store.promotions.list.search.get()).to.equal('winter');
            expect(el.filter).to.equal('draft');
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows).to.have.lengthOf(1);
            expect(rows[0].textContent).to.include('Winter Draft Promo');
        });

        it('updates status tile counts live as the search term changes', async () => {
            const match = makePromotion({ id: 'promo-1', title: 'Matching Promo' });
            const other = makePromotion({ id: 'promo-2', title: 'Other Promo' });
            const { el } = await mountWithRepo(match);
            Store.promotions.list.data.set([new FragmentStore(match), new FragmentStore(other)]);
            await el.updateComplete;

            const allTileCount = () => {
                const tile = [...el.shadowRoot.querySelectorAll('.status-tile')].find(
                    (candidate) => candidate.querySelector('.status-tile-label').textContent.trim() === 'All',
                );
                return tile.querySelector('.status-tile-count').textContent.trim();
            };

            expect(allTileCount()).to.equal('2');

            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'matching';
            search.dispatchEvent(new Event('input'));
            await el.updateComplete;

            expect(allTileCount()).to.equal('1');
        });

        it('renders the result count next to the search field and removes it from the far right of the filter bar', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);
            await el.updateComplete;

            expect(el.shadowRoot.querySelector('.result-count-container')).to.not.exist;
            const searchRow = el.shadowRoot.querySelector('.promotions-search-row');
            expect(searchRow).to.exist;
            expect(searchRow.querySelector('sp-search')).to.exist;
            expect(searchRow.querySelector('.promotions-result-count')).to.exist;
        });
    });
});
