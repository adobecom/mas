import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../src/store.js';
import '../src/mas-fragment.js';
import '../src/mas-toolbar.js';

const SELECTION_CLICK_DELAY = 300;

describe('MasFragment click selection', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        Store.selecting.set(false);
        Store.selection.set([]);
    });

    const createFragmentStore = (id = 'fragment-1', overrides = {}) => {
        const store = {
            id,
            value: {
                id,
                path: '/test/path',
                model: { path: '/conf/mas/settings/dam/cfm/models/card' },
                getField: sandbox.stub().returns({ values: [] }),
                getFieldValue: sandbox.stub().returns(''),
                getTagTitle: sandbox.stub().returns(''),
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

    const click = (target, detail = 1) => {
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, detail }));
    };

    describe('grid view', () => {
        it('toggles the fragment into Store.selection on a single click, without navigating', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="render"></mas-fragment>`);
            const routerModule = await import('../src/router.js');
            const navigateSpy = sandbox.stub(routerModule.default, 'navigateToFragmentEditor').resolves();
            const clock = sandbox.useFakeTimers();

            click(el.querySelector('mas-fragment-render'));
            clock.tick(SELECTION_CLICK_DELAY);

            expect(Store.selection.get()).to.deep.equal(['fragment-1']);
            expect(navigateSpy.called).to.be.false;
        });

        it('removes the fragment on a second click (cumulative toggle)', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="render"></mas-fragment>`);
            const clock = sandbox.useFakeTimers();
            const target = el.querySelector('mas-fragment-render');

            click(target);
            clock.tick(SELECTION_CLICK_DELAY);
            expect(Store.selection.get()).to.deep.equal(['fragment-1']);

            click(target);
            clock.tick(SELECTION_CLICK_DELAY);
            expect(Store.selection.get()).to.deep.equal([]);
        });

        it('accumulates selection across two different fragments', async () => {
            const fragmentStoreA = createFragmentStore('fragment-a');
            const fragmentStoreB = createFragmentStore('fragment-b');
            const elA = await fixture(html`<mas-fragment .fragmentStore=${fragmentStoreA} view="render"></mas-fragment>`);
            const elB = await fixture(html`<mas-fragment .fragmentStore=${fragmentStoreB} view="render"></mas-fragment>`);
            const clock = sandbox.useFakeTimers();

            click(elA.querySelector('mas-fragment-render'));
            clock.tick(SELECTION_CLICK_DELAY);
            click(elB.querySelector('mas-fragment-render'));
            clock.tick(SELECTION_CLICK_DELAY);

            expect(Store.selection.get().slice().sort()).to.deep.equal(['fragment-a', 'fragment-b']);
        });

        it('opens the editor on double click and leaves no queued selection toggle', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="render"></mas-fragment>`);
            const routerModule = await import('../src/router.js');
            const navigateSpy = sandbox.stub(routerModule.default, 'navigateToFragmentEditor').resolves();
            const clock = sandbox.useFakeTimers();
            const target = el.querySelector('mas-fragment-render');

            click(target, 1);
            click(target, 2);
            target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
            clock.tick(SELECTION_CLICK_DELAY);

            expect(navigateSpy.calledOnceWith('fragment-1')).to.be.true;
            expect(Store.selection.get()).to.deep.equal([]);
        });

        it('ignores clicks on interactive controls inside the fragment', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment .fragmentStore=${fragmentStore} view="render"></mas-fragment>`);
            const clock = sandbox.useFakeTimers();
            const target = el.querySelector('mas-fragment-render');
            const checkbox = document.createElement('sp-checkbox');
            target.appendChild(checkbox);

            click(checkbox);
            clock.tick(SELECTION_CLICK_DELAY);

            expect(Store.selection.get()).to.deep.equal([]);
        });
    });

    describe('toolbar visibility', () => {
        it('opens mas-selection-panel when Store.selection is non-empty and Store.selecting is false', async () => {
            const el = await fixture(html`<mas-toolbar></mas-toolbar>`);
            Store.selection.set(['fragment-1']);
            await el.updateComplete;

            const panel = el.shadowRoot.querySelector('mas-selection-panel');
            expect(panel.open).to.be.true;
        });

        it('does not open mas-selection-panel when selection is empty and not selecting', async () => {
            const el = await fixture(html`<mas-toolbar></mas-toolbar>`);
            await el.updateComplete;

            const panel = el.shadowRoot.querySelector('mas-selection-panel');
            expect(panel.open).to.be.false;
        });

        it('closes the panel and clears Store.selection when the panel close handler runs', async () => {
            const el = await fixture(html`<mas-toolbar></mas-toolbar>`);
            Store.selection.set(['fragment-1']);
            await el.updateComplete;

            const panel = el.shadowRoot.querySelector('mas-selection-panel');
            panel.close();
            await el.updateComplete;

            expect(Store.selection.get()).to.deep.equal([]);
            expect(panel.open).to.be.false;
        });
    });
});
