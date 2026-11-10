import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import sessionManager from '../src/services/chat-session-manager.js';
import { MasaClientError } from '../src/mas-chat/masa-client.js';
import { isMasaAvailable, rememberFailure, resetMasaAvailability } from '../src/mas-chat/masa-availability.js';
import { getInvestigationSession } from '../src/mas-chat/investigation-session.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

const QUESTION = 'Why does the Photoshop card show a different price after publishing?';
const BUSY = 'MASA is still answering the previous question.';
const iid = 'inv_22222222-2222-4222-8222-222222222222';
const askMasaEnvelope = {
    type: 'message',
    message: '',
    envelope: { intent: 'ASK_MASA', slots: {}, confidence: 0.9 },
    conversationHistory: [{ role: 'user', content: QUESTION }],
};
const searchEnvelope = {
    type: 'message',
    message: 'Searching cards',
    envelope: { intent: 'search_cards', slots: { query: 'photoshop' }, confidence: 0.9 },
};
const builtIn = { type: 'message', message: 'Built-in answer about prices.' };
const LABEL = "Answered from Studio's built-in knowledge, MASA unavailable";
const HOW_TO = 'How do I publish a card?';
const howToAnswer = 'Publish from the editor toolbar.';

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
};

describe('MasChat hands questions to MASA in one conversation', () => {
    let el;
    let storage;
    let ai;
    let masa;
    let thread;
    let extraChats;

    beforeEach(async () => {
        storage = useIsolatedChatSessionStorage();
        extraChats = [];
        resetMasaAvailability();
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'test-token' }),
            adobeIdData: { client_id: 'test-client' },
        };
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        ai = sinon.stub(el, 'callAIChatAction');
        ai.callsFake(async (params) => {
            if (params.requestType) return {};
            if (params.masa === false) return builtIn;
            return params.message === QUESTION ? askMasaEnvelope : searchEnvelope;
        });
        masa = sinon.stub(el, 'askMasa').returns(new Promise(() => {}));
        thread = sinon.spy(el, 'askMasaInThread');
    });

    afterEach(() => {
        el.remove();
        for (const chat of extraChats) chat.remove();
        sinon.restore();
        storage.restore();
        resetMasaAvailability();
        delete window.adobeIMS;
    });

    const send = (message, context = { skipDeterministicRouter: true }) =>
        el.handleSendMessage({ detail: { message, context } });
    const masaMessages = () => el.messages.filter((message) => message.type === 'masa');
    const chatCalls = () => ai.getCalls().filter((call) => !call.args[0].requestType);
    const mountChat = async () => {
        const chat = document.createElement('mas-chat');
        document.body.appendChild(chat);
        extraChats.push(chat);
        await chat.updateComplete;
        return chat;
    };
    const lastAnswerElement = async (chat) => {
        await chat.updateComplete;
        const answer = [...chat.querySelectorAll('mas-chat-masa-answer')].at(-1);
        await answer?.updateComplete;
        return answer;
    };

    it('offers MASA to ai-chat while it is available', async () => {
        ai.restore();
        const fetch = sinon
            .stub(window, 'fetch')
            .callsFake(async () => new Response(JSON.stringify({ type: 'message', message: 'ok' }), { status: 200 }));
        await el.callAIChatAction({ message: 'hi' });
        await el.callAIChatAction({ message: 'hi', masa: false });
        rememberFailure(new MasaClientError('connection-unavailable', 'Offline'));
        await el.callAIChatAction({ message: 'hi' });
        const offered = fetch.getCalls().map((call) => JSON.parse(call.args[1].body).masa);
        expect(offered).to.deep.equal([true, false, false]);
    });

    describe('earlier MASA hand-offs in the history', () => {
        const handOff = { role: 'assistant', content: JSON.stringify({ ...askMasaEnvelope.envelope, user_message: null }) };
        const history = [{ role: 'user', content: QUESTION }, handOff, { role: 'user', content: HOW_TO }];
        let fetch;

        beforeEach(() => {
            ai.restore();
            fetch = sinon
                .stub(window, 'fetch')
                .callsFake(async () => new Response(JSON.stringify({ type: 'message', message: 'ok' }), { status: 200 }));
        });

        const sentHistory = () => JSON.parse(fetch.lastCall.args[1].body).conversationHistory;

        it('are sent as they are while MASA is offered', async () => {
            await el.callAIChatAction({ message: 'hi', conversationHistory: history });
            expect(sentHistory()).to.deep.equal(history);
        });

        for (const [when, offMasa] of [
            ['for a built-in answer', () => el.callAIChatAction({ message: 'hi', conversationHistory: history, masa: false })],
            [
                'once MASA is remembered unavailable',
                () => {
                    rememberFailure(new MasaClientError('connection-unavailable', 'Offline'));
                    return el.callAIChatAction({ message: 'hi', conversationHistory: history });
                },
            ],
        ]) {
            it(`become plain notes ${when}, so the model cannot copy ASK_MASA`, async () => {
                await offMasa();
                const sent = sentHistory();
                expect(JSON.stringify(sent)).to.not.contain('ASK_MASA');
                expect(sent.map((turn) => turn.role)).to.deep.equal(['user', 'assistant', 'user']);
                expect(sent[1].content).to.be.a('string').that.is.not.empty;
                expect(sent[2]).to.deep.equal(history[2]);
            });
        }
    });

    it('does not let a new turn cancel a detached request', async () => {
        ai.restore();
        const signals = [];
        sinon.stub(window, 'fetch').callsFake(async (url, init) => {
            signals.push(init.signal);
            return new Response(JSON.stringify({ type: 'message', message: 'ok' }), { status: 200 });
        });
        el.beginTurn();
        await el.callAIChatAction({ message: 'turn' });
        await el.callAIChatAction({ message: 'fallback', masa: false }, { detached: true });
        el.beginTurn();
        expect(signals.map((signal) => signal.aborted)).to.deep.equal([true, false]);
    });

    it('runs the deterministic search router before offering MASA', async () => {
        const execute = sinon.stub(el, 'executeOperation').resolves();
        await send('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {});
        expect(execute.calledOnce).to.be.true;
        expect(chatCalls()).to.have.length(0);
        expect(masaMessages()).to.have.length(0);
    });

    it('hands an ASK_MASA turn to MASA and frees the input', async () => {
        await send(QUESTION);
        expect(masaMessages()).to.have.length(1);
        expect(masaMessages()[0]).to.include({
            role: 'assistant',
            conversationId: el.currentSessionId,
            question: QUESTION,
            recordId: null,
            fallback: null,
            failure: null,
        });
        expect(masa.calledOnce).to.be.true;
        expect(masa.firstCall.args[0]).to.include({ conversationId: el.currentSessionId, question: QUESTION });
        expect(el.isLoading).to.equal(false);
    });

    it('sends MASA the Studio page and earlier turns without repeating the question', async () => {
        el.messages = [
            { role: 'user', content: 'Find the Photoshop card' },
            { role: 'assistant', content: 'Found one Photoshop card.' },
        ];
        await send(QUESTION);
        const { context } = masa.firstCall.args[0];
        expect(context).to.match(/^Studio path: .*\nLocale: .*\nFragment ID: /);
        expect(context).to.contain('Earlier user: Find the Photoshop card');
        expect(context).not.to.contain(QUESTION);
    });

    it('keeps card actions working while MASA answers', async () => {
        const execute = sinon.stub(el, 'executeOperation').resolves();
        await send(QUESTION);
        await send('show photoshop cards');
        expect(execute.calledOnce).to.be.true;
        expect(execute.firstCall.args[0]).to.include({ operationName: 'search_cards' });
        expect(masaMessages()[0]).to.include({ recordId: null, fallback: null, failure: null });
    });

    it('falls back with a label when MASA cannot answer', async () => {
        masa.rejects(new MasaClientError('connection-unavailable', 'Offline'));
        await send(QUESTION);
        await thread.firstCall.returnValue;
        expect(chatCalls()).to.have.length(2);
        expect(chatCalls()[1].args[0]).to.include({ message: QUESTION, masa: false });
        expect(chatCalls()[1].args[1]).to.deep.equal({ detached: true });
        expect(masaMessages()[0].fallback).to.deep.equal({ content: builtIn.message });
        expect(isMasaAvailable()).to.equal(false);
    });

    for (const code of ['investigation-budget-exhausted', 'investigation-timeout', 'answer-unavailable']) {
        it(`stores that MASA could not finish after ${code} and keeps it through a reload`, async () => {
            masa.rejects(new MasaClientError(code, 'Ran out'));
            await send(QUESTION);
            await thread.firstCall.returnValue;
            expect(masaMessages()[0].fallback).to.deep.equal({ content: builtIn.message, reason: 'unfinished' });
            el.saveCurrentSession();
            sessionManager.flushSession(el.currentSessionId);
            const saved = sessionManager.getSession(el.currentSessionId).messages.find((message) => message.type === 'masa');
            expect(saved.fallback.reason).to.equal('unfinished');
            expect(isMasaAvailable()).to.equal(true);
        });
    }

    it('shows the could-not-finish label with Ask MASA again after the budget runs out', async () => {
        masa.rejects(new MasaClientError('investigation-budget-exhausted', 'Ran out'));
        await send(QUESTION);
        await thread.firstCall.returnValue;
        const answer = await lastAnswerElement(el);
        expect(answer.shadowRoot.textContent)
            .to.contain("MASA couldn't finish this answer · answered from Studio's built-in knowledge")
            .and.to.contain('Ask MASA again')
            .and.not.to.contain('MASA unavailable');
    });

    it('shows the guidance line after an unanswerable investigation and keeps MASA available', async () => {
        masa.rejects(new MasaClientError('answer-unavailable', 'No answer'));
        await send(QUESTION);
        await thread.firstCall.returnValue;
        const answer = await lastAnswerElement(el);
        expect(answer.shadowRoot.querySelector('.guidance').textContent).to.equal(
            'Ask again with the card ID or the page URL.',
        );
        expect(isMasaAvailable()).to.equal(true);
    });

    it('keeps the unavailable label without guidance when the model is unavailable', async () => {
        masa.rejects(new MasaClientError('model-unavailable', 'Model down'));
        await send(QUESTION);
        await thread.firstCall.returnValue;
        const answer = await lastAnswerElement(el);
        expect(answer.shadowRoot.textContent).to.contain(LABEL);
        expect(answer.shadowRoot.querySelector('.guidance')).to.be.null;
    });

    it('keeps the unavailable label when the connection is down', async () => {
        masa.rejects(new MasaClientError('connection-unavailable', 'Offline'));
        await send(QUESTION);
        await thread.firstCall.returnValue;
        const answer = await lastAnswerElement(el);
        expect(answer.shadowRoot.textContent).to.contain(LABEL);
    });

    it('places a late fallback under its MASA message', async () => {
        const answer = deferred();
        masa.returns(answer.promise);
        sinon.stub(el, 'executeOperation').resolves();
        await send(QUESTION);
        await send('show photoshop cards');
        await send('show illustrator cards');
        answer.reject(new MasaClientError('masa-timeout', 'Timed out'));
        await thread.firstCall.returnValue;
        const index = el.messages.findIndex((message) => message.type === 'masa');
        expect(el.messages[index].fallback).to.deep.equal({ content: builtIn.message, reason: 'unfinished' });
        expect(index).to.be.below(el.messages.length - 2);
        expect(el.messages.filter((message) => message.content === builtIn.message)).to.have.length(0);
    });

    for (const outcome of ['record id', 'fallback']) {
        it(`keeps a late answer in the original conversation (${outcome})`, async () => {
            const answer = deferred();
            let reportRecord;
            masa.callsFake(({ onRecord }) => {
                reportRecord = onRecord;
                return answer.promise;
            });
            await send(QUESTION);
            const originalId = el.currentSessionId;
            const other = sessionManager.createSession();
            sessionManager.updateSession(other.id, { messages: [{ role: 'user', content: 'another chat' }] });
            el.handleSessionChanged({ detail: { sessionId: other.id } });
            if (outcome === 'record id') {
                reportRecord(iid);
                answer.resolve({ id: iid, status: 'completed' });
            } else {
                answer.reject(new MasaClientError('connection-unavailable', 'Offline'));
            }
            await thread.firstCall.returnValue;
            expect(el.messages).to.deep.equal([{ role: 'user', content: 'another chat' }]);
            const saved = sessionManager.getSession(originalId).messages.find((message) => message.type === 'masa');
            if (outcome === 'record id') expect(saved.recordId).to.equal(iid);
            else expect(saved.fallback).to.deep.equal({ content: builtIn.message });
        });
    }

    for (const outcome of ['record id', 'fallback']) {
        it(`shows a late answer in a chat reopened on the same conversation (${outcome})`, async () => {
            const answer = deferred();
            let reportRecord;
            masa.callsFake(({ onRecord }) => {
                reportRecord = onRecord;
                return answer.promise;
            });
            await send(QUESTION);
            await el.updateComplete;
            const conversationId = el.currentSessionId;
            el.remove();
            const reopened = await mountChat();
            sinon.stub(reopened, 'callAIChatAction').resolves({});
            if (outcome === 'record id') {
                reportRecord(iid);
                answer.resolve({ id: iid, status: 'completed' });
            } else {
                answer.reject(new MasaClientError('connection-unavailable', 'Offline'));
            }
            await thread.firstCall.returnValue;
            const expectAnswer = (message) =>
                outcome === 'record id'
                    ? expect(message.recordId).to.equal(iid)
                    : expect(message.fallback).to.deep.equal({ content: builtIn.message });
            expectAnswer(reopened.messages.find((message) => message.type === 'masa'));
            reopened.saveCurrentSession();
            sessionManager.flushSession(conversationId);
            expectAnswer(sessionManager.getSession(conversationId).messages.find((message) => message.type === 'masa'));
        });
    }

    it('shows the typing indicator under the label while the built-in answer is on its way', async () => {
        const started = deferred();
        ai.callsFake(async (params) => {
            if (params.requestType) return {};
            if (params.masa !== false) return askMasaEnvelope;
            started.resolve();
            return new Promise(() => {});
        });
        masa.rejects(new MasaClientError('connection-unavailable', 'Offline'));
        await send(QUESTION);
        await started.promise;
        expect(masaMessages()[0].fallback).to.deep.equal({ pending: true });
        const answer = await lastAnswerElement(el);
        expect(answer.shadowRoot.textContent).to.contain(LABEL);
        const [slotted] = answer.shadowRoot.querySelector('slot[name="working"]').assignedElements();
        expect(slotted.querySelectorAll('.typing-indicator .typing-dot').length).to.equal(3);
    });

    it('offers to ask MASA again for an answer a reload interrupted', async () => {
        const stored = sessionManager.createSession();
        const unsettled = {
            role: 'assistant',
            type: 'masa',
            conversationId: stored.id,
            question: QUESTION,
            recordId: null,
            failure: null,
            timestamp: 1,
        };
        sessionManager.updateSession(stored.id, {
            messages: [
                { role: 'user', content: QUESTION },
                { ...unsettled, id: 'during-fallback', fallback: { pending: true } },
                { ...unsettled, id: 'during-submission', fallback: null },
            ],
        });
        const reloaded = await mountChat();
        const restored = reloaded.messages.filter((message) => message.type === 'masa');
        expect(restored.map((message) => message.fallback)).to.deep.equal([null, null]);
        expect(restored.every((message) => typeof message.failure === 'string' && message.failure)).to.equal(true);
        await reloaded.updateComplete;
        const answers = [...reloaded.querySelectorAll('mas-chat-masa-answer')];
        await Promise.all(answers.map((answer) => answer.updateComplete));
        expect(answers.map((answer) => answer.shadowRoot.textContent.includes('Ask MASA again'))).to.deep.equal([true, true]);
    });

    it('offers to ask MASA again when a reload cut off the fallback for a failed job', async () => {
        const stored = sessionManager.createSession();
        sessionManager.updateSession(stored.id, {
            messages: [
                { role: 'user', content: QUESTION },
                {
                    id: 'after-record',
                    role: 'assistant',
                    type: 'masa',
                    conversationId: stored.id,
                    question: QUESTION,
                    recordId: iid,
                    fallback: { pending: true },
                    failure: null,
                    timestamp: 1,
                },
            ],
            investigations: [{ id: iid, sessionId: 'ses_1', question: QUESTION, text: '', status: 'failed', files: [] }],
        });
        const reloaded = await mountChat();
        const restored = reloaded.messages.find((message) => message.type === 'masa');
        expect(restored).to.include({ recordId: iid, fallback: null });
        expect(restored.failure).to.be.a('string').that.is.not.empty;
        const answer = await lastAnswerElement(reloaded);
        expect(answer.shadowRoot.textContent).to.contain('Ask MASA again');
        expect(answer.shadowRoot.querySelectorAll('sp-progress-circle').length).to.equal(0);
    });

    for (const [kind, reply] of [
        ['plain answer', { type: 'message', message: howToAnswer }],
        [
            'ASK_USER answer',
            { type: 'message', message: '', envelope: { intent: 'ASK_USER', user_message: howToAnswer, slots: {} } },
        ],
        [
            'SHOW_HELP answer',
            { type: 'message', message: '', envelope: { intent: 'SHOW_HELP', user_message: howToAnswer, slots: {} } },
        ],
    ]) {
        it(`labels a ${kind} while MASA is unavailable`, async () => {
            rememberFailure(new MasaClientError('connection-unavailable', 'Offline'));
            ai.callsFake(async (params) => (params.requestType ? {} : reply));
            await send(HOW_TO);
            expect(el.messages.at(-1)).to.include({ role: 'assistant', content: howToAnswer });
            expect(el.messages.at(-1).builtIn).to.deep.equal({ conversationId: el.currentSessionId, question: HOW_TO });
            const notice = await lastAnswerElement(el);
            expect(notice.shadowRoot.textContent).to.contain(LABEL).and.to.contain('Ask MASA again');
        });
    }

    it('does not label clarifications or search results while MASA is unavailable', async () => {
        rememberFailure(new MasaClientError('connection-unavailable', 'Offline'));
        const clarify = {
            type: 'message',
            message: '',
            envelope: { intent: 'ASK_USER', clarification_question: 'Which card do you mean?', slots: {} },
        };
        ai.callsFake(async (params) => {
            if (params.requestType) return {};
            return params.message === 'that one' ? clarify : searchEnvelope;
        });
        sinon.stub(el, 'executeOperation').resolves();
        await send('that one');
        await send('show photoshop cards');
        expect(el.messages.filter((message) => message.builtIn)).to.have.length(0);
        await el.updateComplete;
        expect(el.querySelectorAll('mas-chat-masa-answer').length).to.equal(0);
    });

    it('does not label a missing-slot prompt while MASA is unavailable', async () => {
        rememberFailure(new MasaClientError('connection-unavailable', 'Offline'));
        const prompt = {
            type: 'message',
            message: '',
            envelope: { intent: 'ASK_USER', user_message: 'Which surface?', missing_slots: ['surface'], slots: {} },
        };
        ai.callsFake(async (params) => (params.requestType ? {} : prompt));
        await send(HOW_TO);
        expect(el.messages.at(-1)).to.include({ role: 'assistant', content: 'Which surface?' });
        expect(el.messages.at(-1).builtIn).to.equal(undefined);
    });

    it('asks MASA the previous question again from a labelled answer', async () => {
        rememberFailure(new MasaClientError('connection-unavailable', 'Offline'));
        ai.callsFake(async (params) => (params.requestType ? {} : { type: 'message', message: howToAnswer }));
        await send(HOW_TO);
        const notice = await lastAnswerElement(el);
        [...notice.shadowRoot.querySelectorAll('sp-button')].find((button) => button.textContent === 'Ask MASA again').click();
        expect(isMasaAvailable()).to.equal(true);
        expect(masa.firstCall.args[0]).to.include({ question: HOW_TO });
        expect(masaMessages().at(-1)).to.include({ question: HOW_TO });
    });

    it('shows the busy message instead of falling back', async () => {
        masa.rejects(new MasaClientError('masa-conversation-busy', BUSY));
        await send(QUESTION);
        await thread.firstCall.returnValue;
        const busy = el.messages.at(-1);
        expect(busy).to.include({ role: 'assistant', content: BUSY });
        expect(busy.buttonGroup.options.map((option) => option.label)).to.deep.equal(['Cancel it']);
        expect(masaMessages()).to.have.length(0);
        expect(chatCalls()).to.have.length(1);
    });

    it('cancels the running MASA question from the busy message', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        const running = { id: iid, sessionId: 'ses_1', question: 'First', text: '', files: [], status: 'running' };
        session.records.push(running);
        const cancel = sinon.stub(session, 'cancel').resolves();
        masa.rejects(new MasaClientError('masa-conversation-busy', BUSY));
        await send(QUESTION);
        await thread.firstCall.returnValue;
        await el.updateComplete;
        const option = [...el.querySelectorAll('.chat-option-pill')].find((pill) => pill.textContent.includes('Cancel it'));
        option.click();
        expect(cancel.calledOnceWith(running)).to.be.true;
    });

    for (const code of ['invalid-question', 'question-too-large']) {
        it(`shows input errors without falling back (${code})`, async () => {
            masa.rejects(new MasaClientError(code, 'Shorten the question and try again.'));
            await send(QUESTION);
            await thread.firstCall.returnValue;
            expect(masaMessages()[0].failure).to.equal('Shorten the question and try again.');
            expect(chatCalls()).to.have.length(1);
            expect(isMasaAvailable()).to.equal(true);
        });
    }

    it('does not fall back after the question is cancelled', async () => {
        masa.callsFake(async ({ conversationId, onRecord }) => {
            getInvestigationSession(conversationId).records.push({
                id: iid,
                sessionId: 'ses_1',
                question: QUESTION,
                text: '',
                files: [],
                status: 'cancelled',
            });
            onRecord(iid);
            throw new MasaClientError('investigation-failed', '');
        });
        await send(QUESTION);
        await thread.firstCall.returnValue;
        expect(chatCalls()).to.have.length(1);
        expect(masaMessages()[0]).to.include({ recordId: iid, fallback: null, failure: null });
    });

    it('asks MASA again on masa-retry', async () => {
        rememberFailure(new MasaClientError('connection-unavailable', 'Offline'));
        el.showWelcomeScreen = false;
        el.messages = [
            { role: 'user', content: QUESTION },
            {
                role: 'assistant',
                type: 'masa',
                conversationId: el.currentSessionId,
                question: QUESTION,
                recordId: null,
                fallback: { content: builtIn.message },
                failure: null,
                timestamp: 1,
            },
        ];
        await el.updateComplete;
        const answer = el.querySelector('mas-chat-masa-answer');
        await answer.updateComplete;
        [...answer.shadowRoot.querySelectorAll('sp-button')].find((button) => button.textContent === 'Ask MASA again').click();
        expect(isMasaAvailable()).to.equal(true);
        expect(masaMessages()).to.have.length(2);
        expect(masaMessages()[1]).to.include({ question: QUESTION, fallback: null });
        expect(masa.firstCall.args[0]).to.include({ question: QUESTION });
    });

    it('a follow-up chip asks MASA in the same conversation', async () => {
        el.dispatchEvent(
            new CustomEvent('masa-follow-up', { detail: { question: 'How do I publish it?' }, bubbles: true, composed: true }),
        );
        expect(thread.calledOnceWith('How do I publish it?')).to.equal(true);
    });

    it('leaves a running Studio turn loading when MASA is asked again', async () => {
        el.isLoading = true;
        el.dispatchEvent(new CustomEvent('masa-retry', { detail: { question: QUESTION } }));
        expect(masaMessages()).to.have.length(1);
        expect(el.isLoading).to.equal(true);
    });

    it('shows the MASA session above the message box only while the conversation has a lease', async () => {
        const session = getInvestigationSession(el.currentSessionId);
        sinon.stub(session, 'attach').returns(() => {});
        el.showWelcomeScreen = false;
        await el.updateComplete;
        expect(el.querySelector('.chat-input mas-chat-masa-session')).to.equal(null);
        session.session = {
            id: 'ses_1',
            status: 'active',
            expiresAt: new Date(Date.now() + 1800000).toISOString(),
            activeInvestigations: 0,
        };
        el.requestUpdate();
        await el.updateComplete;
        expect(el.querySelector('.chat-input mas-chat-masa-session').conversationId).to.equal(el.currentSessionId);
    });
});
