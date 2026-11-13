import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { waitUntil } from '@open-wc/testing';
import '../src/swc.js';
import '../src/mas-chat.js';
import '../src/mas-chat-input.js';
import { MasaClientError } from '../src/mas-chat/masa-client.js';
import sessionManager from '../src/services/chat-session-manager.js';
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

    const pasteWith = (items) => {
        const clipboardData = new DataTransfer();
        for (const item of items) clipboardData.items.add(item);
        const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true, composed: true });
        input.querySelector('rte-field').dispatchEvent(event);
        return event;
    };

    it('attaches a pasted image', async () => {
        input.imagesEnabled = true;
        await input.updateComplete;
        const image = new File(['x'], 'shot.png', { type: 'image/png' });
        let detail;
        input.addEventListener('attach-images', (event) => {
            detail = event.detail;
        });
        const event = pasteWith([image]);
        expect(detail.files).to.deep.equal([image]);
        expect(event.defaultPrevented).to.equal(true);
    });

    it('ignores a pasted image when images are disabled', () => {
        let fired = false;
        input.addEventListener('attach-images', () => {
            fired = true;
        });
        pasteWith([new File(['x'], 'shot.png', { type: 'image/png' })]);
        expect(fired).to.equal(false);
    });

    it('leaves a pasted text alone when images are enabled', async () => {
        input.imagesEnabled = true;
        await input.updateComplete;
        let fired = false;
        input.addEventListener('attach-images', () => {
            fired = true;
        });
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', 'hello');
        const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true, composed: true });
        input.querySelector('rte-field').dispatchEvent(event);
        expect(fired).to.equal(false);
    });

    it('leaves a clipboard with text and an image to the text paste', async () => {
        input.imagesEnabled = true;
        await input.updateComplete;
        let fired = false;
        input.addEventListener('attach-images', () => {
            fired = true;
        });
        const clipboardData = new DataTransfer();
        clipboardData.items.add('cell text', 'text/plain');
        clipboardData.items.add(new File(['x'], 'cells.png', { type: 'image/png' }));
        const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true, composed: true });
        input.querySelector('rte-field').dispatchEvent(event);
        expect(fired).to.equal(false);
        expect(event.defaultPrevented).to.equal(false);
    });

    it('inserts pasted text that carries an image when images are disabled', async () => {
        const field = input.querySelector('rte-field');
        await waitUntil(() => field.editorView);
        const clipboardData = new DataTransfer();
        clipboardData.items.add(`<a href="https://x.test/a">label</a>`, 'text/html');
        clipboardData.items.add(new File(['x'], 'copy.png', { type: 'image/png' }));
        field.editorView.dom.dispatchEvent(
            new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true, composed: true }),
        );
        expect(input.plainText).to.contain('https://x.test/a');
    });

    it('offers no remove button on an image still uploading', async () => {
        input.imagesEnabled = true;
        input.images = [{ id: 'u1', name: 'card.png', status: 'uploading' }];
        await input.updateComplete;
        expect(input.querySelector('.image-preview sp-action-button')).to.equal(null);
    });

    it('disables the paperclip while an image is uploading', async () => {
        input.imagesEnabled = true;
        input.images = [{ id: 'u1', name: 'card.png', status: 'uploading' }];
        await input.updateComplete;
        expect(input.querySelector('sp-action-button[title="Attach image"]').hasAttribute('disabled')).to.equal(true);
    });

    it('shows an uploading indicator on an image still uploading', async () => {
        input.imagesEnabled = true;
        input.images = [{ id: 'u1', name: 'card.png', status: 'uploading' }];
        await input.updateComplete;
        expect(input.querySelector('.image-preview sp-progress-circle')).to.exist;
    });

    it('disables Send while an image is uploading', async () => {
        input.imagesEnabled = true;
        input.images = [{ id: 'u1', name: 'card.png', status: 'uploading' }];
        await input.updateComplete;
        expect(input.querySelector('sp-button[title="Send message"]').hasAttribute('disabled')).to.equal(true);
    });

    it('does not send while an image is uploading', async () => {
        input.images = [{ id: 'u1', name: 'card.png', status: 'uploading' }];
        input.selectedOsi = 'abc';
        let fired = false;
        input.addEventListener('send-message', () => {
            fired = true;
        });
        input.handleSend();
        expect(fired).to.equal(false);
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

    it('explains the session cap when an upload cannot get a MASA session', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        sinon.stub(session, 'addImage').callsFake(async () => {
            session.error = new MasaClientError('session-capacity', 'MASA is busy. Retry after the indicated delay.', 429, 60);
        });
        await el.handleAttachImages({ detail: { files: [file()] } });
        expect(el.imagesEnabled).to.equal(true);
        expect(el.messages.at(-1)).to.include({
            role: 'error',
            content:
                'MASA allows two active sessions per person. End the session in another conversation or tab, then try again.',
        });
    });

    it('leaves the welcome screen so an upload error on a fresh chat is visible', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        sinon.stub(session, 'addImage').callsFake(async () => {
            session.error = new MasaClientError('invalid-image', 'Choose up to three images.');
        });
        expect(el.showWelcomeScreen).to.equal(true);
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.updateComplete;
        expect(el.showWelcomeScreen).to.equal(false);
        expect(el.querySelector('.chat-page-container')).to.exist;
    });

    const dragEvent = (type, files = [file()]) => {
        const dataTransfer = new DataTransfer();
        for (const item of files) dataTransfer.items.add(item);
        return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
    };

    const overlay = () => el.querySelector('.chat-drop-overlay');

    it('shows the drop overlay while files are dragged over the conversation', async () => {
        el.dispatchEvent(dragEvent('dragenter'));
        await el.updateComplete;
        expect(overlay().textContent.trim()).to.equal('Drop images to ask MASA about them');
    });

    it('shows the drop overlay in the conversation view too', async () => {
        el.showWelcomeScreen = false;
        await el.updateComplete;
        el.dispatchEvent(dragEvent('dragenter'));
        await el.updateComplete;
        expect(el.querySelector('.chat-page-container .chat-drop-overlay')).to.exist;
    });

    it('keeps the overlay until the last dragleave of nested elements', async () => {
        el.dispatchEvent(dragEvent('dragenter'));
        el.dispatchEvent(dragEvent('dragenter'));
        el.dispatchEvent(dragEvent('dragleave'));
        await el.updateComplete;
        expect(overlay()).to.exist;
        el.dispatchEvent(dragEvent('dragleave'));
        await el.updateComplete;
        expect(overlay()).to.equal(null);
    });

    it('hides the overlay on drop', async () => {
        stubAttach();
        el.dispatchEvent(dragEvent('dragenter'));
        el.dispatchEvent(dragEvent('drop'));
        await el.updateComplete;
        expect(overlay()).to.equal(null);
    });

    it('hides the overlay on Escape', async () => {
        el.dispatchEvent(dragEvent('dragenter'));
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await el.updateComplete;
        expect(overlay()).to.equal(null);
    });

    it('shows no overlay for a drag that carries no files', async () => {
        el.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() }));
        await el.updateComplete;
        expect(overlay()).to.equal(null);
    });

    const stubAttach = () => sinon.stub(el, 'handleAttachImages').resolves();

    it('attaches dropped images the way the paperclip does', async () => {
        const attach = stubAttach();
        const dropped = file();
        el.dispatchEvent(dragEvent('drop', [dropped]));
        expect(attach.firstCall.args[0].detail.files).to.deep.equal([dropped]);
    });

    it('does nothing on drop when images are disabled and keeps the browser from opening the file', async () => {
        meta.content = '';
        const attach = stubAttach();
        el.dispatchEvent(dragEvent('dragenter'));
        await el.updateComplete;
        const drop = dragEvent('drop');
        el.dispatchEvent(drop);
        expect(overlay()).to.equal(null);
        expect(attach.called).to.equal(false);
        expect(drop.defaultPrevented).to.equal(true);
    });

    it('says only images can be attached for a non-image file', async () => {
        await el.handleAttachImages({ detail: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } });
        expect(el.messages.at(-1)).to.include({
            role: 'error',
            content: 'Only PNG, JPEG, GIF or WebP images can be attached.',
        });
    });

    it('says images must be 5 MB or smaller for a big image', async () => {
        const big = new File([new ArrayBuffer(5000001)], 'big.png', { type: 'image/png' });
        await el.handleAttachImages({ detail: { files: [big] } });
        expect(el.messages.at(-1)).to.include({ role: 'error', content: 'Images must be 5 MB or smaller.' });
    });

    it('says up to 3 images can be attached for a fourth', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        session.images = [1, 2, 3].map((n) => ({ id: `i${n}`, name: `${n}.png`, preview: 'blob:x' }));
        await el.handleAttachImages({ detail: { files: [file()] } });
        expect(el.messages.at(-1)).to.include({ role: 'error', content: 'You can attach up to 3 images.' });
    });

    const deferredAdd = (session) => {
        let finish;
        const stub = sinon.stub(session, 'addImage').callsFake(
            () =>
                new Promise((resolve) => {
                    finish = (change) => {
                        change?.();
                        resolve();
                    };
                }),
        );
        return { stub, finish: (change) => finish(change) };
    };

    const realUploads = (session) => {
        session.session = { id: 'sess', status: 'active', expiresAt: new Date(Date.now() + 600000).toISOString() };
        sinon.stub(session, 'ensureSession').resolves(session.session);
        const resolvers = [];
        const started = [];
        sinon.stub(session.client, 'upload').callsFake(
            (conversationId, sessionId, intent) =>
                new Promise((resolve) => {
                    started.push(intent.file.name);
                    resolvers.push(() => resolve({ id: `att-${started.length}` }));
                }),
        );
        return { started, finish: () => resolvers.shift()() };
    };

    const settle = () => new Promise((resolve) => queueMicrotask(() => queueMicrotask(resolve)));
    const named = (name) => new File(['x'], name, { type: 'image/png' });

    it('shows an uploading preview until the upload completes', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        const uploads = realUploads(session);
        const upload = el.handleAttachImages({ detail: { files: [file()] } });
        await el.updateComplete;
        const input = el.querySelector('mas-chat-input');
        expect(input.images.map(({ name, status }) => ({ name, status }))).to.deep.equal([
            { name: 'card.png', status: 'uploading' },
        ]);
        await settle();
        uploads.finish();
        await upload;
        await el.updateComplete;
        expect(input.images.map(({ status }) => status)).to.deep.equal(['ready']);
    });

    it('uploads two quick drops one after the other', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        const uploads = realUploads(session);
        const first = el.handleAttachImages({ detail: { files: [named('a.png')] } });
        const second = el.handleAttachImages({ detail: { files: [named('b.png')] } });
        await settle();
        expect(uploads.started).to.deep.equal(['a.png']);
        uploads.finish();
        await waitUntil(() => uploads.started.length === 2);
        expect(uploads.started).to.deep.equal(['a.png', 'b.png']);
        uploads.finish();
        await Promise.all([first, second]);
        expect(session.images.length).to.equal(2);
    });

    it('rejects a fourth image while three are uploading', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        realUploads(session);
        for (const name of ['a.png', 'b.png', 'c.png']) void el.handleAttachImages({ detail: { files: [named(name)] } });
        await el.handleAttachImages({ detail: { files: [named('d.png')] } });
        expect(el.messages.at(-1)).to.include({ role: 'error', content: 'You can attach up to 3 images.' });
    });

    it('shows the uploading preview and keeps Send disabled in a chat opened mid-upload', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        const uploads = realUploads(session);
        const upload = el.handleAttachImages({ detail: { files: [file()] } });
        el.remove();
        const reopened = document.createElement('mas-chat');
        document.body.appendChild(reopened);
        await reopened.updateComplete;
        const input = reopened.querySelector('mas-chat-input');
        expect(input.images.map(({ status }) => status)).to.deep.equal(['uploading']);
        expect(input.querySelector('sp-button[title="Send message"]').hasAttribute('disabled')).to.equal(true);
        await settle();
        uploads.finish();
        await upload;
        await reopened.updateComplete;
        expect(input.images.map(({ status }) => status)).to.deep.equal(['ready']);
        expect(input.querySelector('sp-button[title="Send message"]').hasAttribute('disabled')).to.equal(false);
        reopened.remove();
    });

    it('shows no drop overlay while an upload runs', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        const uploads = realUploads(session);
        const upload = el.handleAttachImages({ detail: { files: [file()] } });
        el.dispatchEvent(dragEvent('dragenter'));
        await el.updateComplete;
        expect(overlay()).to.equal(null);
        await settle();
        uploads.finish();
        await upload;
    });

    it('clears the images of every conversation when MASA becomes unavailable', async () => {
        const other = sessionManager.createSession('Other');
        const otherSession = getInvestigationSession(other.id);
        otherSession.images = [{ id: 'o1', name: 'o.png', preview: 'blob:y' }];
        sinon.stub(URL, 'revokeObjectURL');
        masa.rejects(new MasaClientError('connection-unavailable', 'down'));
        const session = getInvestigationSession(el.currentSessionId);
        addImageFake(session);
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.handleSendMessage({ detail: { message: QUESTION, context: {} } });
        await thread.returnValues[0];
        expect(otherSession.images).to.deep.equal([]);
    });

    it('clears the previews when MASA becomes unavailable', async () => {
        masa.rejects(new MasaClientError('connection-unavailable', 'down'));
        ai.resolves({ type: 'message', message: 'built-in' });
        const session = getInvestigationSession(el.currentSessionId);
        addImageFake(session);
        sinon.stub(URL, 'revokeObjectURL');
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.handleSendMessage({ detail: { message: QUESTION, context: {} } });
        await thread.returnValues[0];
        expect(session.images).to.deep.equal([]);
        expect(el.imagesEnabled).to.equal(false);
    });

    it('keeps the images attached when MASA fails in a way that may recover', async () => {
        masa.rejects(new MasaClientError('masa-timeout', 'slow'));
        const session = getInvestigationSession(el.currentSessionId);
        addImageFake(session);
        await el.handleAttachImages({ detail: { files: [file()] } });
        await el.handleSendMessage({ detail: { message: QUESTION, context: {} } });
        await thread.returnValues[0];
        expect(session.images.length).to.equal(1);
    });

    it('adds an upload error to the conversation that started the upload', async () => {
        const origin = el.currentSessionId;
        const session = getInvestigationSession(origin);
        const add = deferredAdd(session);
        const upload = el.handleAttachImages({ detail: { files: [file()] } });
        const other = sessionManager.createSession('Other');
        el.currentSessionId = other.id;
        el.messages = [];
        add.finish(() => {
            session.error = new MasaClientError('invalid-image', 'Images must be 5 MB or smaller.');
        });
        await upload;
        expect(el.messages).to.deep.equal([]);
        sessionManager.flushSession(origin);
        expect(sessionManager.getSession(origin).messages.at(-1)).to.include({
            role: 'error',
            content: 'Images must be 5 MB or smaller.',
        });
    });
});
