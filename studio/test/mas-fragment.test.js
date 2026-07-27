import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../src/store.js';
import '../src/mas-fragment.js';

describe('MasFragment', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        Store.selecting.set(false);
        Store.selection.set([]);
        Store.fragments.expandedId.set(null);
    });

    const createFragmentStore = (overrides = {}) => {
        const store = {
            id: 'fragment-1',
            value: {
                id: 'fragment-1',
                path: '/test/path',
                model: { path: '/conf/mas/settings/dam/cfm/models/card' },
                references: null,
                getField: sandbox.stub().returns({ values: [] }),
                getFieldValue: sandbox.stub().returns(''),
                getTagTitle: sandbox.stub().returns(''),
                listLocaleVariations: sandbox.stub().returns([]),
                listPromoVariations: sandbox.stub().returns([]),
                listGroupedVariations: sandbox.stub().returns([]),
                ...overrides,
            },
            get() {
                return this.value;
            },
            subscribe: sandbox.stub().returns({ unsubscribe: sandbox.stub() }),
            unsubscribe: sandbox.stub(),
        };
        return store;
    };

    describe('toggleExpand', () => {
        it('toggles expanded state', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            expect(el.expanded).to.be.false;
            await el.toggleExpand();
            expect(el.expanded).to.be.true;
        });

        it('loads references when expanding without existing references', async () => {
            const fragmentStore = createFragmentStore();
            const mockReferences = [{ id: 'ref1' }];
            const mockRepo = {
                refreshFragment: sandbox.stub().callsFake(async (store) => {
                    store.value.references = mockReferences;
                }),
            };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            await el.toggleExpand();
            expect(mockRepo.refreshFragment.calledWith(fragmentStore)).to.be.true;
            expect(fragmentStore.value.references).to.deep.equal(mockReferences);
        });

        it('does not load references when already loaded and promo-probed', async () => {
            const fragmentStore = createFragmentStore({
                references: [{ id: 'existing' }],
                promoVariationsProbed: true,
            });
            const mockRepo = {
                refreshFragment: sandbox.stub().resolves([{ id: 'ref1' }]),
            };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            await el.toggleExpand();
            expect(mockRepo.refreshFragment.called).to.be.false;
        });

        it('reloads references when references exist but promo variations were never probed', async () => {
            const fragmentStore = createFragmentStore({
                references: [{ id: 'existing' }],
                promoVariationsProbed: false,
            });
            const mockRepo = {
                refreshFragment: sandbox.stub().callsFake(async (store) => {
                    store.value.promoVariationsProbed = true;
                }),
            };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            await el.toggleExpand();
            expect(mockRepo.refreshFragment.calledWith(fragmentStore)).to.be.true;
        });

        it('dispatches table-selection-refresh when expanding while selecting', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            const parent = document.createElement('div');
            parent.appendChild(el);
            const refreshSpy = sinon.spy();
            parent.addEventListener('table-selection-refresh', refreshSpy);

            Store.selecting.set(true);
            await el.toggleExpand();

            expect(refreshSpy.calledOnce).to.be.true;
            Store.selecting.set(false);
        });

        it('handles error when loading references', async () => {
            const fragmentStore = createFragmentStore();
            const consoleErrorStub = sandbox.stub(console, 'error');
            const mockRepo = {
                refreshFragment: sandbox.stub().rejects(new Error('Load failed')),
            };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            await el.toggleExpand();
            expect(consoleErrorStub.calledWithMatch('Failed to load references:', sinon.match.instanceOf(Error))).to.be.true;
            expect(el.expanded).to.be.true;
            expect(el.loadingReferences).to.be.false;
        });
    });

    describe('autoExpand', () => {
        it('does nothing when expandedId does not match this fragment', async () => {
            const fragmentStore = createFragmentStore();
            const mockRepo = { refreshFragment: sandbox.stub().resolves() };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            Store.fragments.expandedId.set('some-other-id');
            await el.autoExpand();
            expect(el.expanded).to.be.false;
            expect(mockRepo.refreshFragment.called).to.be.false;
        });

        it('does nothing when already expanded', async () => {
            const fragmentStore = createFragmentStore();
            const mockRepo = { refreshFragment: sandbox.stub().resolves() };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            el.expanded = true;
            Store.fragments.expandedId.set(fragmentStore.value.id);
            await el.autoExpand();
            expect(mockRepo.refreshFragment.called).to.be.false;
        });

        it('expands and loads references when expandedId matches and references are empty', async () => {
            const fragmentStore = createFragmentStore();
            const mockReferences = [{ id: 'ref1' }];
            const mockRepo = {
                refreshFragment: sandbox.stub().callsFake(async (store) => {
                    store.value.references = mockReferences;
                    store.value.promoVariationsProbed = true;
                }),
            };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            Store.fragments.expandedId.set(fragmentStore.value.id);
            await el.autoExpand();
            expect(el.expanded).to.be.true;
            expect(mockRepo.refreshFragment.calledWith(fragmentStore)).to.be.true;
            expect(fragmentStore.value.references).to.deep.equal(mockReferences);
        });

        it('does not reload when references exist and promo variations were already probed', async () => {
            const fragmentStore = createFragmentStore({
                references: [{ id: 'existing' }],
                promoVariationsProbed: true,
            });
            const mockRepo = { refreshFragment: sandbox.stub().resolves() };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            Store.fragments.expandedId.set(fragmentStore.value.id);
            await el.autoExpand();
            expect(el.expanded).to.be.true;
            expect(mockRepo.refreshFragment.called).to.be.false;
        });

        it('reloads when references exist but promo variations were never probed (regression)', async () => {
            const fragmentStore = createFragmentStore({
                references: [{ id: 'existing' }],
                promoVariationsProbed: false,
            });
            const mockRepo = {
                refreshFragment: sandbox.stub().callsFake(async (store) => {
                    store.value.promoVariationsProbed = true;
                }),
            };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            Store.fragments.expandedId.set(fragmentStore.value.id);
            await el.autoExpand();
            expect(mockRepo.refreshFragment.calledWith(fragmentStore)).to.be.true;
        });
    });

    describe('view rendering', () => {
        it('renders table view when view="table"', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            const tableView = el.querySelector('mas-fragment-table');
            const renderView = el.querySelector('mas-fragment-render');
            expect(tableView).to.exist;
            expect(renderView).to.not.exist;
        });

        it('renders render view when view="render"', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="render"></mas-fragment>`);
            const renderView = el.querySelector('mas-fragment-render');
            const tableView = el.querySelector('mas-fragment-table');
            expect(renderView).to.exist;
            expect(tableView).to.not.exist;
        });

        it('renders fragment variations when expanded', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            el.expanded = true;
            await el.updateComplete;
            const variations = el.querySelector('mas-fragment-variations');
            expect(variations).to.exist;
        });
    });
});
