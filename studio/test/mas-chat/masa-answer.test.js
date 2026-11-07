import { expect } from '@esm-bundle/chai';
import { fixture, html, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/swc.js';
import '../../src/mas-chat-message.js';
import '../../src/mas-chat-masa-answer.js';
import '../../src/mas-chat-masa-session.js';
import { InvestigationSession, findingText, getInvestigationSession } from '../../src/mas-chat/investigation-session.js';
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
const WIDE_TABLE = [
    '| Card | Offer | Plan type | Market segment | Customer segment | Offer selector |',
    '| --- | --- | --- | --- | --- | --- |',
    '| Photoshop | photoshop-individual | annual-commitment | commercial-education | individual-team | osi-photoshop-individual |',
].join('\n');
const LONG_CODE = `\`\`\`js\nconst selectors = ['${'osi-photoshop-individual-annual-'.repeat(8)}'];\n\`\`\``;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
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

    it('cancels a running job', async () => {
        const controller = makeController({ history: [record('running')] });
        controller.session = lease();
        controller.cancel = sinon.stub().resolves();
        const el = await mountAnswer(controller);
        el.shadowRoot.querySelector('.status sp-button').click();
        expect(controller.cancel.calledOnceWith(controller.records[0])).to.equal(true);
    });

    it('names a running job for assistive technology instead of showing progress text', async () => {
        const controller = makeController({ history: [record('running')] });
        controller.session = lease();
        const el = await mountAnswer(controller);
        expect(el.shadowRoot.querySelector('[aria-live]').textContent).to.equal('MASA is working on it');
        expect(el.shadowRoot.textContent).not.to.contain('checks completed');
        expect(el.shadowRoot.querySelectorAll('sp-progress-circle').length).to.equal(0);
    });

    it('shows neither evidence nor investigation limits for a completed answer', async () => {
        const controller = makeController({ history: [{ ...record('running'), limitedContext: true }] });
        controller.updateJob({
            ...job('completed'),
            result: { ...result(), evidence: [{ id: 'E1', summary: 'Snapshots differ.' }], limitations: ['partial-evidence'] },
        });
        const el = await mountAnswer(controller);
        expect(el.shadowRoot.querySelectorAll('details').length).to.equal(0);
        expect(el.shadowRoot.textContent).not.to.contain('Evidence').and.not.to.contain('Investigation limits');
    });

    it('marks the answer pending only while MASA works', async () => {
        const controller = makeController({ history: [record('running')] });
        const el = await mountAnswer(controller);
        expect(el.hasAttribute('pending')).to.equal(true);
        Object.assign(controller.records[0], { status: 'completed', text: 'Done.' });
        controller.notify();
        await el.updateComplete;
        expect(el.hasAttribute('pending')).to.equal(false);
    });

    it('announces a status change in the same live region', async () => {
        const controller = makeController({ history: [record('running')] });
        const el = await mountAnswer(controller);
        const region = el.shadowRoot.querySelector('[aria-live]');
        controller.records[0].status = 'cancelled';
        controller.notify();
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('[aria-live]').length).to.equal(1);
        expect(el.shadowRoot.querySelector('[aria-live]')).to.equal(region);
        expect(region.textContent).to.equal('cancelled');
    });

    it('shows no status for a completed answer', async () => {
        const el = await mountAnswer(makeController({ history: [record()] }));
        expect(el.shadowRoot.querySelectorAll('.status, sp-badge').length).to.equal(0);
    });

    it('keeps the status of a cancelled answer', async () => {
        const el = await mountAnswer(makeController({ history: [record('cancelled')] }));
        expect(el.shadowRoot.querySelector('.status sp-badge').textContent).to.equal('cancelled');
    });

    it('shows that MASA is working while the question is being submitted', async () => {
        const controller = makeController();
        controller.busy = true;
        const el = await mountAnswer(controller);
        expect(el.shadowRoot.querySelector('[aria-live]').textContent).to.equal('MASA is working on it');
        expect(el.shadowRoot.querySelectorAll('.status slot[name="working"]').length).to.equal(1);
    });

    it('shows the working indicator under the label while the built-in answer is pending', async () => {
        const el = await mountAnswer(makeController(), { fallback: { pending: true } });
        expect(el.shadowRoot.textContent).to.contain("Answered from Studio's built-in knowledge, MASA unavailable");
        expect(el.shadowRoot.querySelector('[aria-live]').textContent).to.equal('Answer in progress');
        expect(el.shadowRoot.querySelectorAll('.status slot[name="working"]').length).to.equal(1);
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

    it('renders a markdown link in the finding that opens in a new tab', async () => {
        const controller = makeController({
            history: [{ ...record(), text: 'Open [the card](https://mas.adobe.com/studio.html#page=content).' }],
        });
        const el = await mountAnswer(controller);
        const link = el.shadowRoot.querySelector('.finding a');
        expect(link.getAttribute('href')).to.equal('https://mas.adobe.com/studio.html#page=content');
        expect(link.getAttribute('target')).to.equal('_blank');
        expect(link.getAttribute('rel')).to.equal('noopener noreferrer');
    });

    it('keeps straight quotes and double hyphens in the finding', async () => {
        const line = `this.setAttribute('data-promotion-code', "value"); run --flag`;
        const controller = makeController({ history: [{ ...record(), text: line }] });
        const el = await mountAnswer(controller);
        expect(el.shadowRoot.querySelector('.finding').textContent).to.contain(line);
    });

    it('keeps straight quotes and double hyphens in the fallback answer', async () => {
        const line = `Set 'data-promotion-code' with --flag`;
        const el = await mountAnswer(makeController(), { recordId: null, fallback: { content: line } });
        expect(el.shadowRoot.querySelector('.fallback').textContent).to.contain(line);
    });

    describe('code and tables', () => {
        let style;

        before(() => {
            style = document.createElement('style');
            style.textContent = '.narrow-drawer { display: block; width: 240px; }';
            document.head.append(style);
        });

        after(() => style.remove());

        const mountFinding = (text) => {
            const controller = makeController({ history: [{ ...record(), text }] });
            const theme = spTheme();
            theme.classList.add('narrow-drawer');
            return fixture(html`<mas-chat-masa-answer .controller=${controller} .recordId=${iid}></mas-chat-masa-answer>`, {
                parentNode: theme,
            });
        };

        it('scrolls a wide finding table inside the answer instead of widening it', async () => {
            const el = await mountFinding(WIDE_TABLE);
            const wrap = el.shadowRoot.querySelector('.finding div.table-wrap');
            expect(wrap.querySelectorAll('table thead th').length).to.equal(6);
            expect(getComputedStyle(wrap).overflowX).to.equal('auto');
            expect(wrap.scrollWidth).to.be.greaterThan(wrap.clientWidth);
            expect(el.getBoundingClientRect().width).to.be.at.most(240);
        });

        it('draws finding table cells with borders, padding and a header background', async () => {
            const el = await mountFinding(WIDE_TABLE);
            const header = getComputedStyle(el.shadowRoot.querySelector('.finding th'));
            const cell = getComputedStyle(el.shadowRoot.querySelector('.finding td'));
            expect(cell.borderTopStyle).to.equal('solid');
            expect(parseFloat(cell.paddingLeft)).to.be.greaterThan(0);
            expect(header.backgroundColor).not.to.equal(TRANSPARENT);
        });

        it('keeps a fenced block on its lines and scrolls it inside the answer', async () => {
            const el = await mountFinding(LONG_CODE);
            const pre = el.shadowRoot.querySelector('.finding pre');
            expect(pre.querySelector('code.language-js')).to.exist;
            const preStyle = getComputedStyle(pre);
            expect(preStyle.whiteSpace).to.equal('pre');
            expect(preStyle.overflowX).to.equal('auto');
            expect(preStyle.backgroundColor).not.to.equal(TRANSPARENT);
            expect(pre.scrollWidth).to.be.greaterThan(pre.clientWidth);
            expect(el.getBoundingClientRect().width).to.be.at.most(240);
        });

        it('formats inline code in the finding', async () => {
            const el = await mountFinding('Check `data-wcs-osi` first.');
            const code = getComputedStyle(el.shadowRoot.querySelector('.finding code'));
            expect(code.fontFamily).to.contain('monospace');
            expect(code.backgroundColor).not.to.equal(TRANSPARENT);
            expect(parseFloat(code.paddingLeft)).to.be.greaterThan(0);
            expect(parseFloat(code.borderTopLeftRadius)).to.be.greaterThan(0);
        });
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

    const mountMessage = (message) =>
        fixture(html`<mas-chat-message .message=${message}></mas-chat-message>`, { parentNode: spTheme() });
    const masaMessage = (props = {}) => ({
        role: 'assistant',
        type: 'masa',
        conversationId: 'masa-answer-fixture',
        question: 'Q',
        recordId: null,
        fallback: { content: 'Built-in answer.' },
        failure: null,
        timestamp: 1,
        ...props,
    });
    const assistantMessage = (props = {}) => ({
        role: 'assistant',
        content: 'Answer.',
        type: 'message',
        timestamp: 1,
        ...props,
    });

    it('renders a masa message in the assistant bubble with the mascot', async () => {
        const assistant = await mountMessage(assistantMessage());
        const masa = await mountMessage(masaMessage());
        const root = masa.querySelector(':scope > .chat-message');
        expect(root.className).to.equal(assistant.querySelector(':scope > .chat-message').className);
        const avatar = root.querySelector(':scope > .message-card > .message-avatar > img.masa-avatar-img');
        expect(avatar.getAttribute('src')).to.equal(assistant.querySelector('.message-avatar img').getAttribute('src'));
        expect(root.querySelector(':scope > .message-card > .message-content > mas-chat-masa-answer')).to.exist;
    });

    it('shows the glowing typing dots in a running masa message', async () => {
        const session = getInvestigationSession('masa-answer-running');
        session.records = [record('running')];
        session.attach = () => () => {};
        const el = await mountMessage(masaMessage({ conversationId: 'masa-answer-running', recordId: iid, fallback: null }));
        const answer = el.querySelector('mas-chat-masa-answer');
        const [slotted] = answer.shadowRoot.querySelector('.status slot[name="working"]').assignedElements();
        expect(slotted.querySelectorAll(':scope > .typing-indicator > .typing-dot').length).to.equal(3);
    });

    describe('in the chat drawer', () => {
        let style;

        before(async () => {
            const chatStyles = await (await fetch(new URL('../../src/styles/chat.css', import.meta.url))).text();
            style = document.createElement('style');
            style.textContent = chatStyles;
            document.head.append(style);
        });

        after(() => style.remove());

        const mountInDrawer = async (status) => {
            const conversationId = `masa-answer-drawer-${status}`;
            const session = getInvestigationSession(conversationId);
            session.records = [record(status)];
            session.attach = () => () => {};
            const drawer = document.createElement('div');
            drawer.className = 'mas-feature';
            const el = await fixture(
                html`<mas-chat-message
                    .message=${masaMessage({ conversationId, recordId: iid, fallback: null })}
                ></mas-chat-message>`,
                { parentNode: drawer },
            );
            await el.querySelector('mas-chat-masa-answer').updateComplete;
            return el;
        };

        it('lays out a pending masa message like the ordinary typing row', async () => {
            const el = await mountInDrawer('running');
            const row = document.createElement('div');
            row.className = 'typing-indicator-row';
            el.parentNode.append(row);
            const card = getComputedStyle(el.querySelector('.message-card'));
            const typingRow = getComputedStyle(row);
            expect([card.display, card.alignItems, card.gap]).to.deep.equal([
                typingRow.display,
                typingRow.alignItems,
                typingRow.gap,
            ]);
        });

        it('shows a pending masa message without the assistant card', async () => {
            const el = await mountInDrawer('running');
            const card = getComputedStyle(el.querySelector('.message-card'));
            expect(card.borderTopStyle).to.equal('none');
            expect(card.boxShadow).to.equal('none');
            expect(card.backgroundColor).to.equal(TRANSPARENT);
            expect(card.paddingLeft).to.equal('0px');
        });

        it('puts the glowing dots beside the mascot while MASA works', async () => {
            const el = await mountInDrawer('running');
            const avatar = el.querySelector('.message-avatar').getBoundingClientRect();
            const dots = el.querySelector('.typing-indicator').getBoundingClientRect();
            expect(dots.left).to.be.at.least(avatar.right);
        });

        it('shows a completed masa answer in the assistant card', async () => {
            const el = await mountInDrawer('completed');
            const card = getComputedStyle(el.querySelector('.message-card'));
            expect(card.borderTopStyle).to.equal('solid');
            expect(card.boxShadow).not.to.equal('none');
        });
    });

    it('brings a fresh masa message in like a fresh assistant message', async () => {
        const assistant = await mountMessage(assistantMessage({ fresh: true }));
        const masa = await mountMessage(masaMessage({ fresh: true }));
        expect(masa.querySelector(':scope > .chat-message').className).to.equal(
            assistant.querySelector(':scope > .chat-message').className,
        );
    });
});
