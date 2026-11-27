import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import '../src/mas-top-nav.js';
import '../src/mas-confirm-dialog.js';
import sessionManager from '../src/services/chat-session-manager.js';
import { MasaClient } from '../src/mas-chat/masa-client.js';
import { resetMasaAvailability } from '../src/mas-chat/masa-availability.js';
import { endConversationInvestigations } from '../src/mas-chat/investigation-session.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

const QUESTION = 'Why does the Photoshop card show a different price after publishing?';
const FINDING = 'The published card uses a different offer.';
const sid = 'ses_11111111-1111-4111-8111-111111111111';
const iid = 'inv_22222222-2222-4222-8222-222222222222';
const lease = () => ({
    id: sid,
    status: 'active',
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    activeInvestigations: 0,
});
const completed = () => ({
    id: iid,
    session: lease(),
    status: 'completed',
    result: { answer: { type: 'diagnose', answer: FINDING }, artifacts: [] },
    progress: {},
});
const askMasaEnvelope = {
    type: 'message',
    message: '',
    envelope: { intent: 'ASK_MASA', slots: {}, confidence: 0.9 },
};
const builtIn = { type: 'message', message: 'Built-in answer about prices.' };

/** Studio chat → the real askMasa → InvestigationSession → MasaClient, with only the network stubbed. */
describe('MASA questions through the real session', () => {
    let storage;
    let chats;
    let conversations;

    beforeEach(() => {
        storage = useIsolatedChatSessionStorage();
        chats = [];
        conversations = [];
        resetMasaAvailability();
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'test-token' }),
            adobeIdData: { client_id: 'test-client' },
            signOut: sinon.spy(),
        };
    });

    afterEach(async () => {
        for (const chat of chats) chat.remove();
        for (const id of conversations) await endConversationInvestigations(id).catch(() => {});
        sinon.restore();
        storage.restore();
        resetMasaAvailability();
        delete window.adobeIMS;
    });

    const mountChat = async () => {
        const chat = document.createElement('mas-chat');
        document.body.appendChild(chat);
        chats.push(chat);
        await chat.updateComplete;
        conversations.push(chat.currentSessionId);
        sinon.stub(chat, 'callAIChatAction').callsFake(async (params) => {
            if (params.requestType) return {};
            return params.masa === false ? builtIn : askMasaEnvelope;
        });
        sinon.spy(chat, 'askMasaInThread');
        return chat;
    };
    const ask = async (chat) => {
        await chat.handleSendMessage({ detail: { message: QUESTION, context: { skipDeterministicRouter: true } } });
        await chat.askMasaInThread.lastCall.returnValue;
    };
    const lastAnswerText = async (chat) => {
        await chat.updateComplete;
        const answer = [...chat.querySelectorAll('mas-chat-masa-answer')].at(-1);
        await answer.updateComplete;
        return answer.shadowRoot.textContent;
    };

    describe('after a reload that left a saved session', () => {
        let control;

        beforeEach(() => {
            const stored = sessionManager.createSession();
            sessionManager.updateSession(stored.id, {
                messages: [
                    { role: 'user', content: 'An earlier question' },
                    {
                        id: 'interrupted',
                        role: 'assistant',
                        type: 'masa',
                        conversationId: stored.id,
                        question: 'An earlier question',
                        recordId: null,
                        fallback: null,
                        failure: null,
                        timestamp: 1,
                    },
                ],
                investigationState: { sessionId: sid },
            });
            control = sinon.stub(MasaClient.prototype, 'control').callsFake(async (conversation, operation) => {
                if (operation.startsWith('session.')) return { result: lease(), retryAfter: 10 };
                return { result: completed(), retryAfter: 10 };
            });
        });

        const submitted = () => control.getCalls().filter((call) => call.args[1] === 'investigation.submit');

        it('submits the first question instead of reporting MASA busy', async () => {
            expect(document.hidden).to.equal(false);
            const chat = await mountChat();
            await ask(chat);
            expect(submitted()).to.have.length(1);
            expect(await lastAnswerText(chat)).to.contain(FINDING);
        });

        it('submits "Ask MASA again" on an answer the reload interrupted', async () => {
            const chat = await mountChat();
            await chat.updateComplete;
            const interrupted = chat.querySelector('mas-chat-masa-answer');
            await interrupted.updateComplete;
            [...interrupted.shadowRoot.querySelectorAll('sp-button')]
                .find((button) => button.textContent === 'Ask MASA again')
                .click();
            await chat.askMasaInThread.lastCall.returnValue;
            expect(submitted()).to.have.length(1);
            expect(await lastAnswerText(chat)).to.contain(FINDING);
        });
    });

    describe('in prod, where masa-api is not deployed', () => {
        let chat;

        beforeEach(async () => {
            sinon.stub(window, 'fetch').rejects(new TypeError('Failed to fetch'));
            chat = await mountChat();
            await ask(chat);
        });

        it('answers from built-in knowledge', () => {
            const masa = chat.messages.find((message) => message.type === 'masa');
            expect(masa.fallback).to.deep.equal({ content: builtIn.message });
        });

        it('still signs out', async () => {
            await document.createElement('mas-top-nav').signOut();
            expect(window.adobeIMS.signOut.calledOnce).to.equal(true);
        });

        it('still deletes the conversation', async () => {
            const id = chat.currentSessionId;
            const selector = document.createElement('mas-chat-session-selector');
            const deleting = selector.handleDeleteSession(new Event('click'), id);
            document.createElement('mas-confirm-dialog').handleDialogAction(true);
            await deleting;
            expect(sessionManager.getSession(id)).to.equal(null);
        });

        it('still clears all conversations', async () => {
            const id = chat.currentSessionId;
            const selector = document.createElement('mas-chat-session-selector');
            selector.loadSessions();
            const clearing = selector.handleClearAllSessions();
            document.createElement('mas-confirm-dialog').handleDialogAction(true);
            await clearing;
            expect(sessionManager.getSession(id)).to.equal(null);
        });
    });
});
