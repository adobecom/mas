import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import '../src/mas-selection-panel.js';
import Events from '../src/events.js';
import Store from '../src/store.js';

const CARD_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

function makeSelectionStore(items = []) {
    let _items = items;
    const listeners = new Set();
    return {
        get() {
            return _items;
        },
        set(v) {
            _items = v;
        },
        subscribe(cb) {
            listeners.add(cb);
        },
        unsubscribe(cb) {
            listeners.delete(cb);
        },
    };
}

function makeFragmentStore(fragment) {
    return {
        id: fragment.id,
        get() {
            return fragment;
        },
        subscribe() {},
        unsubscribe() {},
    };
}

describe('MasSelectionPanel', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.search.set({ path: 'acom' });
        Store.fragments.list.data.value = [];
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        // Directly reset value to avoid structuredClone failing on function-containing
        // fragment store objects that tests may have placed here.
        Store.fragments.list.data.value = [];
    });

    async function createPanel(items = []) {
        const selectionStore = makeSelectionStore(items);
        return fixture(html`<mas-selection-panel open .selectionStore=${selectionStore}></mas-selection-panel>`);
    }

    describe('handleCopyFragmentUrls', () => {
        it('copies URL for a fragment store (item with get())', async () => {
            const fragment = { id: 'uuid-1', model: { path: CARD_MODEL_PATH } };
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeFragmentStore(fragment)]);
            await el.handleCopyFragmentUrls();

            expect(writeTextStub.calledOnce).to.be.true;
            const written = writeTextStub.firstCall.args[0];
            expect(written).to.include('content-type=merch-card');
            expect(written).to.include('page=content');
            expect(written).to.include('path=acom');
            expect(written).to.include('query=uuid-1');
            expect(toastStub.calledWith(sinon.match({ variant: 'positive' }))).to.be.true;
        });

        it('copies URLs for multiple fragment stores as newline-separated list', async () => {
            const fragment1 = { id: 'uuid-1', model: { path: CARD_MODEL_PATH } };
            const fragment2 = { id: 'uuid-2', model: { path: CARD_MODEL_PATH } };
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeFragmentStore(fragment1), makeFragmentStore(fragment2)]);
            await el.handleCopyFragmentUrls();

            const written = writeTextStub.firstCall.args[0];
            const urls = written.split('\n');
            expect(urls).to.have.length(2);
            expect(urls[0]).to.include('query=uuid-1');
            expect(urls[1]).to.include('query=uuid-2');
            expect(toastStub.calledWith(sinon.match({ variant: 'positive', content: sinon.match('2 fragment URLs') }))).to.be
                .true;
        });

        it('copies URL for a plain fragment object with id property', async () => {
            const fragment = { id: 'uuid-plain', model: { path: CARD_MODEL_PATH } };
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([fragment]);
            await el.handleCopyFragmentUrls();

            const written = writeTextStub.firstCall.args[0];
            expect(written).to.include('query=uuid-plain');
            expect(written).to.include('content-type=merch-card');
        });

        it('looks up fragment from Store when item is a string ID', async () => {
            const fragment = { id: 'uuid-lookup', model: { path: CARD_MODEL_PATH } };
            Store.fragments.list.data.set([makeFragmentStore(fragment)]);
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            sandbox.stub(Events.toast, 'emit');

            const el = await createPanel(['uuid-lookup']);
            await el.handleCopyFragmentUrls();

            const written = writeTextStub.firstCall.args[0];
            expect(written).to.include('query=uuid-lookup');
            expect(written).to.include('content-type=merch-card');
        });

        it('uses current path from Store.search in the URL', async () => {
            Store.search.set({ path: 'nala' });
            const fragment = { id: 'uuid-1', model: { path: CARD_MODEL_PATH } };
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeFragmentStore(fragment)]);
            await el.handleCopyFragmentUrls();

            const written = writeTextStub.firstCall.args[0];
            expect(written).to.include('path=nala');
        });

        it('does nothing when selection is empty', async () => {
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([]);
            await el.handleCopyFragmentUrls();

            expect(writeTextStub.called).to.be.false;
            expect(toastStub.called).to.be.false;
        });

        it('emits negative toast when clipboard write fails', async () => {
            const fragment = { id: 'uuid-1', model: { path: CARD_MODEL_PATH } };
            sandbox.stub(navigator.clipboard, 'writeText').rejects(new Error('Permission denied'));
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeFragmentStore(fragment)]);
            await el.handleCopyFragmentUrls();

            expect(toastStub.calledWith(sinon.match({ variant: 'negative' }))).to.be.true;
        });
    });

    describe('render', () => {
        it('shows Copy URLs button when items are selected', async () => {
            const fragment = { id: 'uuid-1', model: { path: CARD_MODEL_PATH } };
            const el = await createPanel([makeFragmentStore(fragment)]);
            await el.updateComplete;

            const buttons = [...el.shadowRoot.querySelectorAll('sp-action-button')];
            expect(buttons.some((b) => b.getAttribute('label') === 'Copy Code')).to.be.true;
        });

        it('does not show Copy URLs button when nothing is selected', async () => {
            const el = await createPanel([]);
            await el.updateComplete;

            const buttons = [...el.shadowRoot.querySelectorAll('sp-action-button')];
            expect(buttons.some((b) => b.getAttribute('label') === 'Copy Code')).to.be.false;
        });

        it('shows Copy URLs button for multi-selection', async () => {
            const f1 = { id: 'uuid-1', model: { path: CARD_MODEL_PATH } };
            const f2 = { id: 'uuid-2', model: { path: CARD_MODEL_PATH } };
            const el = await createPanel([makeFragmentStore(f1), makeFragmentStore(f2)]);
            await el.updateComplete;

            const buttons = [...el.shadowRoot.querySelectorAll('sp-action-button')];
            expect(buttons.some((b) => b.getAttribute('label') === 'Copy Code')).to.be.true;
        });
    });
});
