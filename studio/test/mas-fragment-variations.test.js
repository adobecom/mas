import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../src/store.js';
import '../src/mas-fragment-variations.js';
import { getGroupedVariationTagsValue, getPromotionCode } from '../src/editors/variation-utils.js';

describe('MasFragmentVariations', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createVariationFragment = (overrides = {}) => ({
        id: 'variation-1',
        path: '/content/dam/mas/sandbox/en_US/pac/pzn/variation-1',
        title: 'Variation title',
        fields: [
            { name: 'pznTags', values: ['mas:pzn/tag-a', 'mas:pzn/tag-b'] },
            { name: 'promoCode', values: ['SAVE20'] },
        ],
        tags: [],
        ...overrides,
    });

    const createFragmentMock = () => ({
        listLocaleVariations: () => [],
        listPromoVariations: () => [],
        listGroupedVariations: () => [],
    });

    describe('getGroupedVariationTagsValue', () => {
        it('returns comma-separated pznTags from fragment fields', () => {
            const variation = createVariationFragment();
            expect(getGroupedVariationTagsValue(variation)).to.equal('mas:pzn/tag-a,mas:pzn/tag-b');
        });

        it('returns empty string when pznTags field is missing', () => {
            const variation = createVariationFragment({ fields: [] });
            expect(getGroupedVariationTagsValue(variation)).to.equal('');
        });

        it('returns empty string when pznTags values are empty', () => {
            const variation = createVariationFragment({
                fields: [{ name: 'pznTags', values: [] }],
            });
            expect(getGroupedVariationTagsValue(variation)).to.equal('');
        });
    });

    describe('getPromoCode', () => {
        it('returns first promoCode value from fragment fields', () => {
            const variation = createVariationFragment();
            expect(getPromotionCode(variation)).to.equal('SAVE20');
        });

        it('returns empty string when promoCode field is missing', () => {
            const variation = createVariationFragment({ fields: [] });
            expect(getPromotionCode(variation)).to.equal('');
        });
    });

    describe('openDuplicateDialog', () => {
        it('sets duplicateSource and pre-populates duplicatePznTags from source tags', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();

            el.openDuplicateDialog(variation);

            expect(el.duplicateSource).to.deep.equal(variation);
            expect(el.duplicatePznTags).to.deep.equal(['mas:pzn/tag-a', 'mas:pzn/tag-b']);
        });

        it('sets duplicatePznTags to empty array when source has no pznTags', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment({ fields: [] });

            el.openDuplicateDialog(variation);

            expect(el.duplicatePznTags).to.deep.equal([]);
        });
    });

    describe('closeDuplicateDialog', () => {
        it('resets duplicateSource and duplicatePznTags', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);

            el.closeDuplicateDialog();

            expect(el.duplicateSource).to.be.null;
            expect(el.duplicatePznTags).to.deep.equal([]);
        });

        it('does not reset state when duplicateLoading is true', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);
            el.duplicateLoading = true;

            el.closeDuplicateDialog();

            expect(el.duplicateSource).to.deep.equal(variation);
            expect(el.duplicatePznTags).to.deep.equal(['mas:pzn/tag-a', 'mas:pzn/tag-b']);
        });
    });

    describe('canSubmitDuplicate', () => {
        it('returns false when duplicateLoading is true', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicateLoading = true;
            el.duplicatePznTags = ['mas:pzn/tag-a'];
            expect(el.canSubmitDuplicate).to.be.false;
        });

        it('returns false when duplicatePznTags is empty', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicateLoading = false;
            el.duplicatePznTags = [];
            expect(el.canSubmitDuplicate).to.be.false;
        });

        it('returns true when not loading and tags are present', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicateLoading = false;
            el.duplicatePznTags = ['mas:pzn/tag-a'];
            expect(el.canSubmitDuplicate).to.be.true;
        });
    });

    describe('handleDuplicatePznTagsChange', () => {
        it('updates duplicatePznTags from event target value', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const newTags = ['mas:pzn/new-tag'];

            el.handleDuplicatePznTagsChange({ target: { value: newTags } });

            expect(el.duplicatePznTags).to.deep.equal(newTags);
        });

        it('sets duplicatePznTags to empty array when event value is falsy', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicatePznTags = ['mas:pzn/tag-a'];

            el.handleDuplicatePznTagsChange({ target: { value: null } });

            expect(el.duplicatePznTags).to.deep.equal([]);
        });
    });

    describe('handleDuplicateSubmit', () => {
        it('calls duplicateGroupedVariation and closes dialog on success', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);

            const mockRepository = document.createElement('mas-repository');
            mockRepository.duplicateGroupedVariation = sandbox.stub().resolves({ id: 'new-fragment' });
            sandbox.stub(document, 'querySelector').withArgs('mas-repository').returns(mockRepository);

            await el.handleDuplicateSubmit();

            expect(mockRepository.duplicateGroupedVariation.calledOnceWith('variation-1', ['mas:pzn/tag-a', 'mas:pzn/tag-b']))
                .to.be.true;
            expect(el.duplicateLoading).to.be.false;
            expect(el.duplicateSource).to.be.null;
        });

        it('resets duplicateLoading and keeps dialog open on error', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);

            const mockRepository = document.createElement('mas-repository');
            mockRepository.duplicateGroupedVariation = sandbox.stub().rejects(new Error('AEM error'));
            sandbox.stub(document, 'querySelector').withArgs('mas-repository').returns(mockRepository);

            await el.handleDuplicateSubmit();

            expect(el.duplicateLoading).to.be.false;
            expect(el.duplicateSource).to.deep.equal(variation);
        });

        it('does nothing when no repository element is found', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const variation = createVariationFragment();
            el.openDuplicateDialog(variation);
            sandbox.stub(document, 'querySelector').withArgs('mas-repository').returns(null);

            await el.handleDuplicateSubmit();

            expect(el.duplicateLoading).to.be.false;
        });

        it('does nothing when duplicateSource has no id', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            el.duplicateSource = { fields: [] };

            const mockRepository = document.createElement('mas-repository');
            mockRepository.duplicateGroupedVariation = sandbox.stub().resolves();
            sandbox.stub(document, 'querySelector').withArgs('mas-repository').returns(mockRepository);

            await el.handleDuplicateSubmit();

            expect(mockRepository.duplicateGroupedVariation.called).to.be.false;
        });
    });

    describe('duplicateDialogTemplate', () => {
        it('returns nothing when duplicateSource is null', async () => {
            const el = await fixture(html`<mas-fragment-variations></mas-fragment-variations>`);
            const { nothing } = await import('lit');
            expect(el.duplicateDialogTemplate).to.equal(nothing);
        });

        it('renders dialog when duplicateSource is set', async () => {
            const variation = createVariationFragment();
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            el.openDuplicateDialog(variation);
            await el.updateComplete;

            const dialog = el.querySelector('sp-dialog');
            expect(dialog).to.exist;
        });

        it('passes reactive duplicatePznTags to tag picker on rerender', async () => {
            const variation = createVariationFragment();
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            el.openDuplicateDialog(variation);
            await el.updateComplete;

            const newTags = ['mas:locale/en-US', 'mas:pzn/tag-c'];
            el.handleDuplicatePznTagsChange({ target: { value: newTags } });
            await el.updateComplete;

            const picker = el.querySelector('aem-tag-picker-field');
            expect(picker.value).to.deep.equal(newTags);
        });

        it('disables the tag picker while duplicateLoading is true', async () => {
            const variation = createVariationFragment();
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            el.openDuplicateDialog(variation);
            el.duplicateLoading = true;
            await el.updateComplete;

            const picker = el.querySelector('aem-tag-picker-field');
            expect(picker.disabled).to.be.true;

            el.duplicateLoading = false;
            await el.updateComplete;
            expect(picker.disabled).to.be.false;
        });
    });

    describe('fragmentStore subscription', () => {
        function createSubscribableStore() {
            const listeners = [];
            return {
                subscribe(fn) {
                    listeners.push(fn);
                },
                unsubscribe(fn) {
                    const i = listeners.indexOf(fn);
                    if (i >= 0) listeners.splice(i, 1);
                },
                notify() {
                    listeners.forEach((fn) => fn());
                },
            };
        }

        it('subscribes when fragmentStore is set and requestUpdate runs on notify', async () => {
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            const requestUpdateSpy = sandbox.spy(el, 'requestUpdate');
            const store = createSubscribableStore();
            el.fragmentStore = store;
            await el.updateComplete;
            requestUpdateSpy.resetHistory();
            store.notify();
            expect(requestUpdateSpy.calledOnce).to.be.true;
        });

        it('unsubscribes previous fragmentStore when fragmentStore changes', async () => {
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            const storeA = createSubscribableStore();
            const unsubSpy = sandbox.spy(storeA, 'unsubscribe');
            el.fragmentStore = storeA;
            await el.updateComplete;
            const storeB = createSubscribableStore();
            el.fragmentStore = storeB;
            await el.updateComplete;
            expect(unsubSpy.calledOnce).to.be.true;
        });

        it('unsubscribes on disconnect', async () => {
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            const store = createSubscribableStore();
            const unsubSpy = sandbox.spy(store, 'unsubscribe');
            el.fragmentStore = store;
            await el.updateComplete;
            el.remove();
            expect(unsubSpy.calledOnce).to.be.true;
        });
    });

    describe('editing grouped and locale variations', () => {
        it('passes editFragmentStore to router when handleEdit is called', async () => {
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            const editStore = {
                value: {
                    id: 'variation-1',
                    path: '/content/dam/mas/sandbox/fr_FR/pac/pzn/variation-1',
                },
            };
            const routerModule = await import('../src/router.js');
            const navigateSpy = sandbox.stub(routerModule.default, 'navigateToFragmentEditor').resolves();

            await el.handleEdit(editStore);

            expect(
                navigateSpy.calledOnceWith('variation-1', {
                    locale: 'fr_FR',
                    fragmentStore: editStore,
                }),
            ).to.be.true;
        });

        it('builds locale variation rows with a dedicated editFragmentStore', async () => {
            const variation = createVariationFragment();
            const fragment = {
                listLocaleVariations: () => [variation],
                listPromoVariations: () => [],
                listGroupedVariations: () => [],
            };
            const el = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);

            const row = el.querySelector('mas-fragment-table');
            expect(row).to.exist;
            expect(row.editFragmentStore).to.exist;
            expect(row.editFragmentStore).to.not.equal(row.fragmentStore);
        });

        it('builds expanded grouped variation rows with a dedicated editFragmentStore', async () => {
            const variation = createVariationFragment();
            const fragment = {
                listLocaleVariations: () => [],
                listPromoVariations: () => [],
                listGroupedVariations: () => [variation],
            };
            const el = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);
            el.toggleGroupedVariation('variation-1');
            await el.updateComplete;

            const row = el.querySelector('mas-fragment-table');
            expect(row).to.exist;
            expect(row.editFragmentStore).to.exist;
            expect(row.editFragmentStore).to.not.equal(row.fragmentStore);
            expect(el.textContent).to.include('Duplicate');
        });
    });

    describe('variation search highlight and tab', () => {
        it('syncs selectedTab from variationSearchTab store', async () => {
            Store.fragments.variationSearchTab.set('grouped');
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            await el.updateComplete;
            expect(el.selectedTab).to.equal('grouped');
            Store.fragments.variationSearchTab.set(null);
        });

        it('applies variation-search-highlight class to matching variation row', async () => {
            const variation = createVariationFragment({ id: 'highlight-var-1' });
            const fragment = {
                listLocaleVariations: () => [variation],
                listPromoVariations: () => [],
                listGroupedVariations: () => [],
            };
            Store.fragments.highlightedVariationId.set('highlight-var-1');
            const el = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);
            await el.updateComplete;

            const row = el.querySelector('mas-fragment-table');
            expect(row.classList.contains('variation-search-highlight')).to.be.true;
            Store.fragments.highlightedVariationId.set(null);
        });

        it('clears variationSearchTab when user changes tab manually', async () => {
            Store.fragments.variationSearchTab.set('promotion');
            const el = await fixture(
                html`<mas-fragment-variations .fragment=${createFragmentMock()}></mas-fragment-variations>`,
            );
            await el.updateComplete;

            el.handleTabChange({ target: { selected: 'locale' } });

            expect(el.selectedTab).to.equal('locale');
            expect(Store.fragments.variationSearchTab.get()).to.be.null;
        });
    });

    describe('promotion variations tab', () => {
        it('renders promotion details for promo variations', async () => {
            const promoVariation = createVariationFragment({
                id: 'promo-var-1',
                path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card',
                tags: [{ id: 'mas:promotion/back-to-school', title: 'Back to School' }],
            });
            const fragment = {
                listLocaleVariations: () => [],
                listPromoVariations: () => [promoVariation],
                listGroupedVariations: () => [],
            };

            const el = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);
            el.togglePromoVariation('promo-var-1');
            await el.updateComplete;

            expect(el.textContent).to.include('Promotion');
            expect(el.textContent).to.include('Back to School');
            expect(el.textContent).to.include('Geos variation tags');
            const picker = el.querySelector('aem-tag-picker-field');
            expect(picker.getAttribute('value')).to.equal(getGroupedVariationTagsValue(promoVariation));
        });

        it('falls back to the promotion project geos when a promo variation has no pznTags of its own', async () => {
            const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoVariation = createVariationFragment({
                id: 'promo-var-legacy',
                path: '/content/dam/mas/sandbox/en_US/promotions/cyber-monday/my-card',
                tags: [{ id: 'mas:promotion/cyber-monday', title: 'Cyber Monday' }],
                fields: [],
            });
            const fragment = {
                path: parentPath,
                listLocaleVariations: () => [],
                listPromoVariations: () => [promoVariation],
                listGroupedVariations: () => [],
            };
            const loadPromotions = sandbox.stub().callsFake(async () => {
                Store.promotions.list.data.set([
                    {
                        get: () => ({
                            id: 'promo-project-1',
                            getFieldValues: (name) =>
                                name === 'tags'
                                    ? ['mas:promotion/cyber-monday']
                                    : name === 'geos'
                                      ? ['mas:locale/de_AT', 'mas:locale/en_NG']
                                      : name === 'fragments'
                                        ? [parentPath]
                                        : [],
                        }),
                    },
                ]);
                Store.promotions.list.loading.set(false);
            });

            const el = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);
            sandbox.stub(el, 'repository').get(() => ({ loadPromotions }));
            el.togglePromoVariation('promo-var-legacy');
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));
            await el.updateComplete;

            const picker = el.querySelector('aem-tag-picker-field');
            expect(picker.getAttribute('value')).to.equal('mas:locale/de_AT,mas:locale/en_NG');
            Store.promotions.list.data.set([]);
        });

        it('disambiguates same-tag promotion projects by matching the fragment attached to the project', async () => {
            const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoVariation = createVariationFragment({
                id: 'promo-var-legacy',
                path: '/content/dam/mas/sandbox/en_US/promotions/cyber-monday/my-card',
                tags: [{ id: 'mas:promotion/cyber-monday', title: 'Cyber Monday' }],
                fields: [],
            });
            const fragment = {
                path: parentPath,
                listLocaleVariations: () => [],
                listPromoVariations: () => [promoVariation],
                listGroupedVariations: () => [],
            };
            const loadPromotions = sandbox.stub().callsFake(async () => {
                Store.promotions.list.data.set([
                    {
                        get: () => ({
                            id: 'wrong-project-same-tag',
                            getFieldValues: (name) =>
                                name === 'tags'
                                    ? ['mas:promotion/cyber-monday']
                                    : name === 'geos'
                                      ? ['mas:locale/ja_JP']
                                      : name === 'fragments'
                                        ? ['/content/dam/mas/sandbox/en_US/some-other-card']
                                        : [],
                        }),
                    },
                    {
                        get: () => ({
                            id: 'correct-project-same-tag',
                            getFieldValues: (name) =>
                                name === 'tags'
                                    ? ['mas:promotion/cyber-monday']
                                    : name === 'geos'
                                      ? ['mas:locale/de_AT', 'mas:locale/en_NG']
                                      : name === 'fragments'
                                        ? [parentPath]
                                        : [],
                        }),
                    },
                ]);
                Store.promotions.list.loading.set(false);
            });

            const el = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);
            sandbox.stub(el, 'repository').get(() => ({ loadPromotions }));
            el.togglePromoVariation('promo-var-legacy');
            await el.updateComplete;
            await new Promise((r) => setTimeout(r, 10));
            await el.updateComplete;

            const picker = el.querySelector('aem-tag-picker-field');
            expect(picker.getAttribute('value')).to.equal('mas:locale/de_AT,mas:locale/en_NG');
            Store.promotions.list.data.set([]);
        });

        it('sets promotionId when opening a promo variation from the promotion tab', async () => {
            const promoVariation = createVariationFragment({
                id: 'promo-var-1',
                path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card',
                tags: [{ id: 'mas:promotion/back-to-school', title: 'Back to School' }],
            });
            const fragment = {
                listLocaleVariations: () => [],
                listPromoVariations: () => [promoVariation],
                listGroupedVariations: () => [],
            };
            const el = await fixture(html`<mas-fragment-variations .fragment=${fragment}></mas-fragment-variations>`);
            const editStore = {
                value: {
                    id: 'promo-var-1',
                    path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card',
                    tags: [{ id: 'mas:promotion/back-to-school' }],
                },
            };
            const loadPromotions = sandbox.stub().callsFake(async () => {
                Store.promotions.list.data.set([
                    {
                        get: () => ({
                            id: 'promo-project-1',
                            tags: [{ id: 'mas:promotion/back-to-school' }],
                        }),
                    },
                ]);
                Store.promotions.list.loading.set(false);
            });
            sandbox.stub(el, 'repository').get(() => ({ loadPromotions }));
            const routerModule = await import('../src/router.js');
            const navigateSpy = sandbox.stub(routerModule.default, 'navigateToFragmentEditor').resolves();
            Store.promotions.promotionId.set(null);
            loadPromotions.resetHistory();

            await el.handleEdit(editStore);

            expect(loadPromotions.calledOnce).to.be.true;
            expect(Store.promotions.promotionId.get()).to.equal('promo-project-1');
            expect(navigateSpy.calledOnce).to.be.true;
            Store.promotions.promotionId.set(null);
        });
    });
});
