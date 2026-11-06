import { expect } from '@esm-bundle/chai';
import { fixture, html, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/mas-chat-message.js';
import '../../src/mas-chat-masa-answer.js';
import '../../src/mas-chat-masa-session.js';
import { InvestigationSession, findingText } from '../../src/mas-chat/investigation-session.js';
import { spTheme } from '../utils.js';

const sid = 'ses_11111111-1111-4111-8111-111111111111';
const iid = 'inv_22222222-2222-4222-8222-222222222222';
const cardId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const now = Date.now();
const lease = (expiresIn = 1800000) => ({
    id: sid,
    status: 'active',
    expiresAt: new Date(now + expiresIn).toISOString(),
    activeInvestigations: 0,
});
const result = () => ({
    answer: { type: 'diagnose', answer: 'The published card has a different offer.' },
    evidence: [],
    artifacts: [],
    lists: [{ heading: 'Related card', items: [{ id: cardId, title: 'Photoshop' }] }],
    limitations: [],
});
const record = (status = 'completed') => ({
    id: iid,
    sessionId: sid,
    question: 'Why is the card different?',
    text: status === 'completed' ? findingText(result()) : '',
    status,
    files: [],
});
const job = (status) => ({
    id: iid,
    session: lease(),
    status,
    result: status === 'completed' ? result() : null,
    progress: { probeResults: 2 },
});

describe('MASA answer in the thread', () => {
    let control;
    let controllers;

    const makeController = (options = {}) => {
        const instance = new InvestigationSession({
            conversationId: 'masa-answer-fixture',
            client: {
                control: (...args) => control(...args),
                upload: async () => ({}),
                download: async () => new Blob(['x']),
            },
            now: () => now,
            ...options,
        });
        controllers.push(instance);
        return instance;
    };

    beforeEach(() => {
        controllers = [];
        control = sinon.stub().callsFake(async (conversation, operation) => ({
            result: operation.startsWith('session.') ? lease() : job('running'),
            retryAfter: 10,
        }));
    });

    afterEach(() => {
        for (const instance of controllers) {
            clearInterval(instance.timer);
            clearTimeout(instance.expiryTimer);
        }
        sinon.restore();
    });

    const mountAnswer = (controller, props = {}) =>
        fixture(
            html`<mas-chat-masa-answer
                .controller=${controller}
                .recordId=${props.recordId ?? iid}
                .question=${props.question ?? 'Why is the card different?'}
                .fallback=${props.fallback ?? null}
                .failure=${props.failure ?? null}
            ></mas-chat-masa-answer>`,
            { parentNode: spTheme() },
        );

    it('shows progress and cancels a running job', async () => {
        const controller = makeController({ history: [record('running')] });
        controller.session = lease();
        controller.cancel = sinon.stub().resolves();
        const el = await mountAnswer(controller);
        const text = el.shadowRoot.textContent;
        expect(text).to.contain('MASA is working on it').and.to.contain('2 checks completed');
        expect(el.shadowRoot.querySelector('sp-progress-circle')).to.exist;
        el.shadowRoot.querySelector('.status sp-button').click();
        expect(controller.cancel.calledOnceWith(controller.records[0])).to.equal(true);
    });

    it('shows that MASA is working while the question is being submitted', async () => {
        const controller = makeController();
        controller.busy = true;
        const el = await mountAnswer(controller);
        expect(el.shadowRoot.textContent).to.contain('MASA is working on it');
        expect(el.shadowRoot.querySelector('sp-progress-circle')).to.exist;
    });

    it('shows progress under the label while the built-in answer is pending', async () => {
        const el = await mountAnswer(makeController(), { fallback: { pending: true } });
        expect(el.shadowRoot.textContent).to.contain("Answered from Studio's built-in knowledge, MASA unavailable");
        expect(el.shadowRoot.querySelector('sp-progress-circle')).to.exist;
        expect(el.shadowRoot.textContent).not.to.contain('Ask MASA again');
    });

    it('adds only the label and Ask MASA again when the message shows the answer itself', async () => {
        const el = await mountAnswer(makeController(), { fallback: { content: '' } });
        expect(el.shadowRoot.textContent)
            .to.contain("Answered from Studio's built-in knowledge, MASA unavailable")
            .and.to.contain('Ask MASA again');
        expect(el.shadowRoot.querySelectorAll('.fallback').length).to.equal(0);
    });

    it('renders a completed finding with card links that open the editor', async () => {
        const controller = makeController({ history: [record()] });
        controller.session = lease();
        controller.records[0].lists = result().lists;
        const el = await mountAnswer(controller);
        expect(el.shadowRoot.querySelector('.finding').textContent).to.contain('different offer');
        const opened = new Promise((resolve) => el.addEventListener('open-card', resolve, { once: true }));
        el.shadowRoot.querySelector('li sp-action-button').click();
        const event = await opened;
        expect(event.detail.fragment.id).to.equal(cardId);
        expect(event.bubbles && event.composed).to.equal(true);
    });

    it('shows the labelled fallback and asks again', async () => {
        const controller = makeController();
        const el = await mountAnswer(controller, {
            recordId: null,
            fallback: { content: 'Use the offer selector.' },
        });
        expect(el.shadowRoot.textContent)
            .to.contain("Answered from Studio's built-in knowledge, MASA unavailable")
            .and.to.contain('Use the offer selector.');
        const retried = new Promise((resolve) => el.addEventListener('masa-retry', resolve, { once: true }));
        const again = [...el.shadowRoot.querySelectorAll('sp-button')].find((b) => b.textContent.includes('Ask MASA again'));
        again.click();
        const event = await retried;
        expect(event.detail).to.deep.equal({ question: 'Why is the card different?' });
        expect(event.bubbles && event.composed).to.equal(true);
    });

    it('rehydrates a running job after reload', async () => {
        const controller = makeController({ history: [record('running')], state: { sessionId: sid } });
        const el = await mountAnswer(controller);
        await waitUntil(() => control.calledWith('masa-answer-fixture', 'investigation.get'));
        expect(controller.foreground).to.equal(1);
        expect(el.shadowRoot.textContent).to.contain('MASA is working on it');
    });

    it('stops polling when the answer is removed', async () => {
        const controller = makeController({ history: [record('running')] });
        const el = await mountAnswer(controller);
        await waitUntil(() => controller.foreground === 1);
        el.remove();
        expect(controller.foreground).to.equal(0);
    });

    it('shows the expiry warning with renewal', async () => {
        const controller = makeController();
        controller.session = lease(60000);
        const el = await fixture(html`<mas-chat-masa-session .controller=${controller}></mas-chat-masa-session>`, {
            parentNode: spTheme(),
        });
        expect(el.shadowRoot.textContent).to.contain('about to expire').and.to.contain('Keep session active');
        controller.renew = sinon.stub().resolves();
        [...el.shadowRoot.querySelectorAll('sp-button')].find((b) => b.textContent.includes('Keep session active')).click();
        expect(controller.renew.calledOnce).to.equal(true);
    });

    it('does not poll the session element without a lease', async () => {
        const controller = makeController();
        const el = await fixture(html`<mas-chat-masa-session .controller=${controller}></mas-chat-masa-session>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;
        await Promise.resolve();
        expect(controller.foreground).to.equal(0);
        expect(control.called).to.equal(false);
    });

    it('polls the session element while the lease is active and stops after it ends', async () => {
        const controller = makeController();
        controller.session = lease();
        const el = await fixture(html`<mas-chat-masa-session .controller=${controller}></mas-chat-masa-session>`, {
            parentNode: spTheme(),
        });
        await waitUntil(() => controller.foreground === 1);
        controller.session = { ...lease(), status: 'ended' };
        controller.notify();
        await waitUntil(() => controller.foreground === 0);
        expect(el.shadowRoot.textContent).to.contain('Session ended');
    });

    it('renders a masa message through mas-chat-message', async () => {
        const el = await fixture(
            html`<mas-chat-message
                .message=${{
                    role: 'assistant',
                    type: 'masa',
                    conversationId: 'masa-answer-fixture',
                    question: 'Q',
                    recordId: null,
                    fallback: { content: 'Built-in answer.' },
                    failure: null,
                    timestamp: 1,
                }}
            ></mas-chat-message>`,
            { parentNode: spTheme() },
        );
        const answer = el.querySelector('mas-chat-masa-answer');
        expect(answer).to.exist;
        expect(answer.conversationId).to.equal('masa-answer-fixture');
        expect(answer.question).to.equal('Q');
    });
});
