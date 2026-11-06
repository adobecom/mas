import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import '../src/mas-chat-input.js';
import { MasaClientError } from '../src/mas-chat/masa-client.js';
import { getInvestigationSession } from '../src/mas-chat/investigation-session.js';
import { isMasaAvailable, resetMasaAvailability } from '../src/mas-chat/masa-availability.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp';
const QUESTION = 'What is wrong with this card?';

describe('mas-chat-input image attachments', () => {
    let input;

    beforeEach(async () => {
        input = document.createElement('mas-chat-input');
        document.body.appendChild(input);
        await input.updateComplete;
    });

    afterEach(() => input.remove());

    it('hides the paperclip unless images are enabled', async () => {
        expect(input.querySelector('input[type="file"]')).to.equal(null);
        input.imagesEnabled = true;
        await input.updateComplete;
        expect(input.querySelector('input[type="file"]')).to.exist;
    });

    it('accepts only png, jpeg, gif and webp', async () => {
        input.imagesEnabled = true;
        await input.updateComplete;
        const field = input.querySelector('input[type="file"]');
        expect(field.getAttribute('accept')).to.equal(ACCEPT);
        expect(field.multiple).to.equal(true);
    });

    it('emits attach-images with the chosen files', async () => {
        input.imagesEnabled = true;
        await input.updateComplete;
        const file = new File(['x'], 'card.png', { type: 'image/png' });
        const field = input.querySelector('input[type="file"]');
        const transfer = new DataTransfer();
        transfer.items.add(file);
        field.files = transfer.files;
        let detail;
        input.addEventListener('attach-images', (event) => {
            detail = event.detail;
        });
        field.dispatchEvent(new Event('change', { bubbles: false }));
        expect(detail.files).to.deep.equal([file]);
    });

    it('emits remove-image with the image id', async () => {
        input.imagesEnabled = true;
        input.images = [{ id: 'a1', name: 'card.png', status: 'ready' }];
        await input.updateComplete;
        let detail;
        input.addEventListener('remove-image', (event) => {
            detail = event.detail;
        });
        input.querySelector('.image-preview sp-action-button').click();
        expect(detail).to.deep.equal({ id: 'a1' });
    });
});

describe('mas-chat images', () => {
    let el;
    let storage;
    let ai;
    let masa;
    let thread;
    let meta;

    const addImageFake = (session) =>
        sinon.stub(session, 'addImage').callsFake(async (file) => {
            session.images.push({ id: `img-${session.images.length}`, name: file.name, preview: 'blob:x' });
            session.notify();
        });

    beforeEach(async () => {
        storage = useIsolatedChatSessionStorage();
        resetMasaAvailability();
        window.adobeIMS = { getAccessToken: () => ({ token: 't' }), adobeIdData: { client_id: 'c' } };
        meta = document.createElement('meta');
        meta.name = 'masa-media-origin';
        meta.content = 'https://media.example.com';
        document.head.appendChild(meta);
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        ai = sinon.stub(el, 'callAIChatAction').resolves({ type: 'message', message: 'built-in' });
        masa = sinon.stub(el, 'askMasa').returns(new Promise(() => {}));
        thread = sinon.spy(el, 'askMasaInThread');
    });

    afterEach(() => {
        el.remove();
        meta.remove();
        sinon.restore();
        storage.restore();
        resetMasaAvailability();
        delete window.adobeIMS;
    });

    const file = () => new File(['x'], 'card.png', { type: 'image/png' });

    it('enables images only with a media origin and MASA available', async () => {
        expect(el.imagesEnabled).to.equal(true);
        meta.content = '';
        expect(el.imagesEnabled).to.equal(false);
        meta.content = 'https://media.example.com';
        const session = getInvestigationSession(el.currentSessionId);
        sinon.stub(session, 'addImage').callsFake(async () => {
            session.error = new MasaClientError('connection-unavailable', 'down');
        });
        await el.handleAttachImages({ detail: { files: [file()] } });
        expect(isMasaAvailable()).to.equal(false);
        expect(el.imagesEnabled).to.equal(false);
    });

    it('passes the session images to the message box', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        addImageFake(session);
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.updateComplete;
        const input = el.querySelector('mas-chat-input');
        expect(input.imagesEnabled).to.equal(true);
        expect(input.images.map(({ id, name }) => ({ id, name }))).to.deep.equal([{ id: 'img-0', name: 'card.png' }]);
    });

    it('sends a message with images straight to MASA', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        addImageFake(session);
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.handleSendMessage({ detail: { message: QUESTION, context: {} } });
        expect(thread.calledOnceWithExactly(QUESTION, { images: true })).to.equal(true);
        expect(ai.called).to.equal(false);
        expect(masa.calledOnce).to.equal(true);
    });

    it('ends the turn when a message with images goes to MASA', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        addImageFake(session);
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.handleSendMessage({ detail: { message: QUESTION, context: {} } });
        expect(el.isLoading).to.equal(false);
    });

    it('answers a message with images from the built-in assistant, labelled, when MASA fails', async () => {
        masa.rejects(new MasaClientError('connection-unavailable', 'down'));
        const session = getInvestigationSession(el.currentSessionId);
        addImageFake(session);
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.handleSendMessage({ detail: { message: QUESTION, context: {} } });
        await thread.returnValues[0];
        const message = el.messages.find((item) => item.type === 'masa');
        expect(message.fallback.content).to.equal('built-in');
        expect(ai.firstCall.args[0].masa).to.equal(false);
    });

    it('removes the images from the box once MASA accepts the question', async () => {
        masa.callsFake(async ({ onRecord }) => {
            onRecord('rec-1');
            return new Promise(() => {});
        });
        const session = getInvestigationSession(el.currentSessionId);
        addImageFake(session);
        sinon.stub(URL, 'revokeObjectURL');
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.handleSendMessage({ detail: { message: QUESTION, context: {} } });
        expect(session.images).to.deep.equal([]);
    });

    it('removes an image on remove-image', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        addImageFake(session);
        sinon.stub(URL, 'revokeObjectURL');
        await el.handleAttachImages({ detail: { files: [file()] } });
        el.handleRemoveImage({ detail: { id: 'img-0' } });
        expect(session.images).to.deep.equal([]);
    });

    it('hides the paperclip and explains when an upload finds MASA unavailable', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        sinon.stub(session, 'addImage').callsFake(async () => {
            session.error = new MasaClientError('connection-unavailable', 'down');
        });
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.updateComplete;
        expect(el.querySelector('mas-chat-input').imagesEnabled).to.equal(false);
        const last = el.messages.at(-1);
        expect(last.role).to.equal('assistant');
        expect(last.content).to.contain('MASA');
        expect(last.content).to.match(/images/i);
    });

    it('shows an invalid image error without hiding the paperclip', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        sinon.stub(session, 'addImage').callsFake(async () => {
            session.error = new MasaClientError('invalid-image', 'Choose up to three images.');
        });
        await el.handleAttachImages({ detail: { files: [file()] } });
        expect(el.imagesEnabled).to.equal(true);
        expect(el.messages.at(-1)).to.include({ role: 'error', content: 'Choose up to three images.' });
    });
});
