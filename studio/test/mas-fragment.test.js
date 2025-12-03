import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-fragment.js';

describe('MasFragment', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createFragmentStore = (overrides = {}) => {
        const store = {
            id: 'fragment-1',
            value: {
                id: 'fragment-1',
                path: '/test/path',
                references: null,
                getFieldValue: sandbox.stub().returns(''),
                listLocaleVariations: sandbox.stub().returns([]),
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
            const mockRepo = {
                loadReferences: sandbox.stub().resolves([{ id: 'ref1' }]),
            };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            await el.toggleExpand();
            expect(mockRepo.loadReferences.calledWith('fragment-1')).to.be.true;
            expect(fragmentStore.value.references).to.deep.equal([{ id: 'ref1' }]);
        });

        it('does not load references when already loaded', async () => {
            const fragmentStore = createFragmentStore({ references: [{ id: 'existing' }] });
            const mockRepo = {
                loadReferences: sandbox.stub().resolves([{ id: 'ref1' }]),
            };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            await el.toggleExpand();
            expect(mockRepo.loadReferences.called).to.be.false;
        });

        it('handles error when loading references', async () => {
            const fragmentStore = createFragmentStore();
            const mockRepo = {
                loadReferences: sandbox.stub().rejects(new Error('Load failed')),
            };
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            sandbox.stub(el, 'repository').get(() => mockRepo);
            await el.toggleExpand();
            expect(el.expanded).to.be.true;
            expect(el.loadingReferences).to.be.false;
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

        it('renders variations when expanded', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`);
            el.expanded = true;
            await el.updateComplete;
            const variations = el.querySelector('mas-fragment-variations');
            expect(variations).to.exist;
        });
    });
});
