import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-fragment-table.js';
import Events from '../src/events.js';
import Store from '../src/store.js';

const CARD_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

describe('MasFragmentTable', () => {
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
                title: 'Test Fragment',
                status: 'PUBLISHED',
                model: { path: '/models/card' },
                getFieldValue: sandbox.stub().returns(''),
                getField: sandbox.stub().returns(null),
                getTagTitle: sandbox.stub().returns(null),
                getCurrentTagTitle: sandbox.stub().returns(null),
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

    describe('getTruncatedOfferId', () => {
        it('returns full offerId when 5 chars or less', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            el.offerData = { offerId: '12345' };
            expect(el.getTruncatedOfferId()).to.equal('12345');
        });

        it('truncates offerId when longer than 5 chars', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            el.offerData = { offerId: '1234567890' };
            expect(el.getTruncatedOfferId()).to.equal('...67890');
        });

        it('returns undefined when no offerData', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            expect(el.getTruncatedOfferId()).to.be.undefined;
        });
    });

    describe('copyOfferIdToClipboard', () => {
        it('copies offerId to clipboard', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            el.offerData = { offerId: '1234567890' };
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const event = { stopPropagation: sandbox.stub() };
            await el.copyOfferIdToClipboard(event);
            expect(writeTextStub.calledWith('1234567890')).to.be.true;
            expect(event.stopPropagation.called).to.be.true;
        });

        it('does nothing when no offerId', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            const writeTextStub = sandbox.stub(navigator.clipboard, 'writeText').resolves();
            const event = { stopPropagation: sandbox.stub() };
            await el.copyOfferIdToClipboard(event);
            expect(writeTextStub.called).to.be.false;
        });
    });

    describe('handleEditFragment', () => {
        it('stops propagation and calls editFragment', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            const event = { stopPropagation: sandbox.stub(), clientX: 100 };
            el.handleEditFragment(event);
            expect(event.stopPropagation.called).to.be.true;
        });

        it('navigates with editFragmentStore when provided', async () => {
            const fragmentStore = createFragmentStore();
            const editFragmentStore = {
                get: sandbox.stub().returns({
                    id: 'edit-fragment-1',
                    path: '/content/dam/mas/sandbox/fr_FR/path',
                }),
            };
            const el = await fixture(
                html`<mas-fragment-table
                    .fragmentStore=${fragmentStore}
                    .editFragmentStore=${editFragmentStore}
                ></mas-fragment-table>`,
            );
            const event = { stopPropagation: sandbox.stub() };
            const routerModule = await import('../src/router.js');
            const navigateSpy = sandbox.stub(routerModule.default, 'navigateToFragmentEditor');

            el.handleEditFragment(event);

            expect(navigateSpy.calledOnceWith('edit-fragment-1', { locale: 'fr_FR', fragmentStore: editFragmentStore })).to.be
                .true;
        });
    });

    describe('handleCreateVariation', () => {
        it('stops propagation', async () => {
            const fragmentStore = createFragmentStore();
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            const event = { stopPropagation: sandbox.stub() };
            el.handleCreateVariation(event);
            expect(event.stopPropagation.called).to.be.true;
        });
    });

    describe('copyCode', () => {
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
            sandbox.stub(Store.search, 'get').returns({ path: '/acom' });
            sandbox.stub(Store.page, 'get').returns('content');
        });

        afterEach(() => {
            globalThis.ClipboardItem = originalClipboardItem;
        });

        it('stops propagation', async () => {
            const fragmentStore = createFragmentStore({ model: { path: CARD_MODEL_PATH } });
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            sandbox.stub(Events.toast, 'emit');
            const event = { stopPropagation: sandbox.stub() };
            await el.copyCode(event);
            expect(event.stopPropagation.called).to.be.true;
        });

        it('writes both text/plain and text/html to clipboard', async () => {
            const fragmentStore = createFragmentStore({ id: 'frag-1', model: { path: CARD_MODEL_PATH } });
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            sandbox.stub(Events.toast, 'emit');
            await el.copyCode({ stopPropagation: sandbox.stub() });
            expect(clipboardStub.write.calledOnce).to.be.true;
            const [item] = clipboardStub.write.firstCall.args[0];
            const plainText = await item.data['text/plain'].text();
            const htmlText = await item.data['text/html'].text();
            expect(plainText).to.include('query=frag-1');
            expect(htmlText).to.include('<a href=');
            expect(htmlText).to.include('query=frag-1');
        });

        it('shows positive toast on success', async () => {
            const fragmentStore = createFragmentStore({ model: { path: CARD_MODEL_PATH } });
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            const toastStub = sandbox.stub(Events.toast, 'emit');
            await el.copyCode({ stopPropagation: sandbox.stub() });
            expect(toastStub.calledWith(sinon.match({ variant: 'positive' }))).to.be.true;
        });

        it('shows negative toast when clipboard write fails', async () => {
            clipboardStub.write.rejects(new Error('denied'));
            const fragmentStore = createFragmentStore({ model: { path: CARD_MODEL_PATH } });
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            const toastStub = sandbox.stub(Events.toast, 'emit');
            await el.copyCode({ stopPropagation: sandbox.stub() });
            expect(toastStub.calledWith(sinon.match({ variant: 'negative' }))).to.be.true;
        });

        it('does not write to clipboard when fragment has unknown model path', async () => {
            const fragmentStore = createFragmentStore({ model: { path: '/models/unknown' } });
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            await el.copyCode({ stopPropagation: sandbox.stub() });
            expect(clipboardStub.write.called).to.be.false;
        });
    });
});
