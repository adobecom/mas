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

function makeCardFragment(id) {
    return {
        id,
        model: { path: CARD_MODEL_PATH },
        getField: () => null,
        getTagTitle: () => null,
        getCurrentTagTitle: () => null,
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
        let clipboardStub;
        let originalClipboardItem;

        beforeEach(() => {
            clipboardStub = { write: sandbox.stub().resolves() };
            Object.defineProperty(navigator, 'clipboard', { value: clipboardStub, configurable: true });
            originalClipboardItem = globalThis.ClipboardItem;
            globalThis.ClipboardItem = class ClipboardItemMock {
                constructor(data) {
                    this.data = data;
                }
            };
        });

        afterEach(() => {
            globalThis.ClipboardItem = originalClipboardItem;
        });

        it('copies code for a fragment store (item with get())', async () => {
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeFragmentStore(makeCardFragment('uuid-1'))]);
            await el.handleCopyFragmentUrls();

            expect(clipboardStub.write.calledOnce).to.be.true;
            const [item] = clipboardStub.write.firstCall.args[0];
            const plainText = await item.data['text/plain'].text();
            expect(plainText).to.include('content-type=merch-card');
            expect(plainText).to.include('page=content');
            expect(plainText).to.include('path=acom');
            expect(plainText).to.include('query=uuid-1');
            expect(toastStub.calledWith(sinon.match({ variant: 'positive' }))).to.be.true;
        });

        it('writes text/html with anchor links', async () => {
            sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeFragmentStore(makeCardFragment('uuid-1'))]);
            await el.handleCopyFragmentUrls();

            const [item] = clipboardStub.write.firstCall.args[0];
            const htmlText = await item.data['text/html'].text();
            expect(htmlText).to.include('<a href=');
            expect(htmlText).to.include('query=uuid-1');
        });

        it('copies code for multiple fragments with newline-separated plain text', async () => {
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([
                makeFragmentStore(makeCardFragment('uuid-1')),
                makeFragmentStore(makeCardFragment('uuid-2')),
            ]);
            await el.handleCopyFragmentUrls();

            const [item] = clipboardStub.write.firstCall.args[0];
            const plainText = await item.data['text/plain'].text();
            const urls = plainText.split('\n');
            expect(urls).to.have.length(2);
            expect(urls[0]).to.include('query=uuid-1');
            expect(urls[1]).to.include('query=uuid-2');
            expect(toastStub.calledWith(sinon.match({ variant: 'positive', content: sinon.match('2 code snippets') }))).to.be
                .true;
        });

        it('joins multiple html entries with <br>', async () => {
            sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([
                makeFragmentStore(makeCardFragment('uuid-1')),
                makeFragmentStore(makeCardFragment('uuid-2')),
            ]);
            await el.handleCopyFragmentUrls();

            const [item] = clipboardStub.write.firstCall.args[0];
            const htmlText = await item.data['text/html'].text();
            expect(htmlText).to.include('<br>');
        });

        it('copies code for a plain fragment object with id property', async () => {
            sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeCardFragment('uuid-plain')]);
            await el.handleCopyFragmentUrls();

            const [item] = clipboardStub.write.firstCall.args[0];
            const plainText = await item.data['text/plain'].text();
            expect(plainText).to.include('query=uuid-plain');
            expect(plainText).to.include('content-type=merch-card');
        });

        it('looks up variation fragment from parent references when item is a string ID', async () => {
            const variation = makeCardFragment('variation-1');
            Store.fragments.list.data.set([
                makeFragmentStore({
                    id: 'parent-1',
                    references: [variation],
                }),
            ]);
            sandbox.stub(Events.toast, 'emit');

            const el = await createPanel(['variation-1']);
            await el.handleCopyFragmentUrls();

            const [item] = clipboardStub.write.firstCall.args[0];
            const plainText = await item.data['text/plain'].text();
            expect(plainText).to.include('query=variation-1');
        });

        it('looks up fragment from Store when item is a string ID', async () => {
            Store.fragments.list.data.set([makeFragmentStore(makeCardFragment('uuid-lookup'))]);
            sandbox.stub(Events.toast, 'emit');

            const el = await createPanel(['uuid-lookup']);
            await el.handleCopyFragmentUrls();

            const [item] = clipboardStub.write.firstCall.args[0];
            const plainText = await item.data['text/plain'].text();
            expect(plainText).to.include('query=uuid-lookup');
            expect(plainText).to.include('content-type=merch-card');
        });

        it('uses current path from Store.search in the URL', async () => {
            Store.search.set({ path: 'nala' });
            sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeFragmentStore(makeCardFragment('uuid-1'))]);
            await el.handleCopyFragmentUrls();

            const [item] = clipboardStub.write.firstCall.args[0];
            const plainText = await item.data['text/plain'].text();
            expect(plainText).to.include('path=nala');
        });

        it('does nothing when selection is empty', async () => {
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([]);
            await el.handleCopyFragmentUrls();

            expect(clipboardStub.write.called).to.be.false;
            expect(toastStub.called).to.be.false;
        });

        it('does nothing when all fragments have unknown model paths', async () => {
            const fragment = { id: 'uuid-1', model: { path: '/models/unknown' } };
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeFragmentStore(fragment)]);
            await el.handleCopyFragmentUrls();

            expect(clipboardStub.write.called).to.be.false;
            expect(toastStub.called).to.be.false;
        });

        it('emits negative toast when clipboard write fails', async () => {
            clipboardStub.write.rejects(new Error('Permission denied'));
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const el = await createPanel([makeFragmentStore(makeCardFragment('uuid-1'))]);
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
