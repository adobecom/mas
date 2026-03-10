import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-chat-input.js';

function createMockRteField() {
    return {
        editorView: {
            state: {
                tr: { delete: sinon.stub().returns({}) },
                doc: { content: { size: 0 } },
            },
            dispatch: sinon.stub(),
        },
    };
}

describe('MasChatInput', () => {
    let el;

    beforeEach(async () => {
        el = await fixture(html`<mas-chat-input></mas-chat-input>`);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('handleSend', () => {
        it('dispatches send-message event with message text', () => {
            const mockRteField = createMockRteField();
            sinon.stub(el, 'querySelector').returns(mockRteField);
            el.message = 'Create a fries card';

            const handler = sinon.stub();
            el.addEventListener('send-message', handler);
            el.handleSend();

            expect(handler.calledOnce).to.be.true;
            const detail = handler.firstCall.args[0].detail;
            expect(detail.message).to.equal('Create a fries card');
            expect(detail.context).to.deep.equal({});
        });

        it('includes osi in context when selectedOsi is set', () => {
            const mockRteField = createMockRteField();
            sinon.stub(el, 'querySelector').returns(mockRteField);
            el.message = 'Update card';
            el.selectedOsi = 'osi-abc-123';

            const handler = sinon.stub();
            el.addEventListener('send-message', handler);
            el.handleSend();

            expect(handler.firstCall.args[0].detail.context.osi).to.equal('osi-abc-123');
        });

        it('includes offer in context when selectedOffer is set', () => {
            const mockRteField = createMockRteField();
            sinon.stub(el, 'querySelector').returns(mockRteField);
            el.message = 'Update card';
            el.selectedOffer = { offerId: 'offer-1' };

            const handler = sinon.stub();
            el.addEventListener('send-message', handler);
            el.handleSend();

            expect(handler.firstCall.args[0].detail.context.offer).to.deep.equal({ offerId: 'offer-1' });
        });

        it('does nothing when message is empty', () => {
            el.message = '   ';

            const handler = sinon.stub();
            el.addEventListener('send-message', handler);
            el.handleSend();

            expect(handler.called).to.be.false;
        });
    });

    describe('handleRteKeyDown', () => {
        it('triggers send on Enter without Shift', () => {
            const spy = sinon.spy(el, 'handleSend');
            const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false, cancelable: true });
            el.handleRteKeyDown(event);

            expect(spy.calledOnce).to.be.true;
        });

        it('does not trigger send on Shift+Enter', () => {
            const spy = sinon.spy(el, 'handleSend');
            const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, cancelable: true });
            el.handleRteKeyDown(event);

            expect(spy.called).to.be.false;
        });
    });

    describe('handleRemoveOffer', () => {
        it('clears selectedOsi and selectedOffer', () => {
            el.selectedOsi = 'osi-abc-123';
            el.selectedOffer = { offerId: 'offer-1' };
            el.handleRemoveOffer();

            expect(el.selectedOsi).to.be.null;
            expect(el.selectedOffer).to.be.null;
        });
    });

    describe('handleRemoveCard', () => {
        it('removes card by ID from selectedCards', () => {
            el.selectedCards = [
                { id: 'card-1', osi: 'osi-1' },
                { id: 'card-2', osi: 'osi-2' },
            ];
            el.handleRemoveCard('card-1');

            expect(el.selectedCards).to.have.lengthOf(1);
            expect(el.selectedCards[0].id).to.equal('card-2');
        });

        it('does not error when card is not in list', () => {
            el.selectedCards = [{ id: 'card-1', osi: 'osi-1' }];
            el.handleRemoveCard('nonexistent');

            expect(el.selectedCards).to.have.lengthOf(1);
        });
    });

    describe('handleOstSelect', () => {
        it('sets selectedOsi from event detail', () => {
            const event = new CustomEvent('ost-select', {
                detail: { 'data-wcs-osi': 'osi-xyz', offer: { offerId: 'o1' } },
            });
            el.handleOstSelect(event);

            expect(el.selectedOsi).to.equal('osi-xyz');
            expect(el.selectedOffer).to.deep.equal({ offerId: 'o1' });
        });

        it('does nothing when data-wcs-osi is missing', () => {
            el.selectedOsi = null;
            const event = new CustomEvent('ost-select', {
                detail: { offer: { offerId: 'o1' } },
            });
            el.handleOstSelect(event);

            expect(el.selectedOsi).to.be.null;
        });
    });

    describe('handleOfferSelect', () => {
        it('sets selectedOsi and selectedOffer from event detail', () => {
            const event = new CustomEvent('ost-offer-select', {
                detail: { offerSelectorId: 'osi-456', offer: { offerId: 'o2' } },
            });
            el.handleOfferSelect(event);

            expect(el.selectedOsi).to.equal('osi-456');
            expect(el.selectedOffer).to.deep.equal({ offerId: 'o2' });
        });
    });
});
