import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-fragment-table.js';

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
});
