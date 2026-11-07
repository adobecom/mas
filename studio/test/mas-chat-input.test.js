import { expect } from '@esm-bundle/chai';
import { waitUntil } from '@open-wc/testing';
import '../src/swc.js';
import '../src/mas-chat-input.js';
import { EVENT_OST_OFFER_SELECT } from '../src/constants.js';

const HREF =
    'https://mas.adobe.com/studio.html#content-type=merch-card&page=content&query=dcb58302-f2dc-4f33-a501-9375fe4ec0bb';
const OFFER_ID = '0123456789abcdef0123456789abcdef';

describe('mas-chat-input message text', () => {
    let input;
    let view;

    const sent = () =>
        new Promise((resolve) => input.addEventListener('send-message', (event) => resolve(event.detail), { once: true }));

    beforeEach(async () => {
        input = document.createElement('mas-chat-input');
        document.body.appendChild(input);
        await input.updateComplete;
        const field = input.querySelector('rte-field');
        await waitUntil(() => field.editorView);
        view = field.editorView;
    });

    afterEach(() => input.remove());

    it('sends typed text as plain text', async () => {
        view.dispatch(view.state.tr.insertText('Why does https://x.test/a?b=1&c=2 fail?'));
        const detail = sent();
        input.handleSend();
        expect((await detail).message).to.equal('Why does https://x.test/a?b=1&c=2 fail?');
    });

    it('sends a line break as a newline', async () => {
        const { tr, schema } = view.state;
        view.dispatch(tr.insertText('line one').insert(8, schema.nodes.hard_break.create()).insertText('line two', 9));
        const detail = sent();
        input.handleSend();
        expect((await detail).message).to.equal('line one\nline two');
    });

    it('sends a pasted Studio link with its ampersands', async () => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/html', `<a href="${HREF}">Photoshop card</a>`);
        view.dom.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true, composed: true }));
        const detail = sent();
        input.handleSend();
        const { message } = await detail;
        expect(message).to.equal(HREF);
        expect(message).not.to.contain('&amp;');
    });

    it('sends a selected offer with the same message and context', async () => {
        const offer = { offer_id: OFFER_ID, name: 'Photoshop' };
        document.dispatchEvent(
            new CustomEvent(EVENT_OST_OFFER_SELECT, { detail: { offerSelectorId: 'osi-photoshop', offer } }),
        );
        const detail = sent();
        input.handleSend();
        expect(await detail).to.deep.equal({
            message: `Offer ID: ${OFFER_ID}`,
            context: { osi: 'osi-photoshop', trialOsi: null, trialOffer: null, offer, offerId: OFFER_ID },
        });
    });
});
