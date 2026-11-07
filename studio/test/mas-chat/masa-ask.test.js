import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import sessionManager from '../../src/services/chat-session-manager.js';
import { MasaClient, MasaClientError } from '../../src/mas-chat/masa-client.js';
import { getInvestigationSession, endConversationInvestigations } from '../../src/mas-chat/investigation-session.js';
import { askMasa, buildMasaContext } from '../../src/mas-chat/masa-ask.js';
import { useIsolatedChatSessionStorage } from '../helpers/chat-session-storage.js';

const sid = 'ses_11111111-1111-4111-8111-111111111111';
const iid = 'inv_22222222-2222-4222-8222-222222222222';
const lease = () => ({
    id: sid,
    status: 'active',
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    activeInvestigations: 0,
});
const job = (status, extra = {}) => ({
    id: iid,
    session: lease(),
    status,
    result: status === 'completed' ? { answer: { type: 'diagnose', answer: 'Offer differs.' }, artifacts: [] } : null,
    progress: {},
    ...extra,
});

describe('askMasa', () => {
    let storage;
    let sandbox;
    let control;
    let ids;

    const open = (name) => {
        const id = `${name}-${ids.length}`;
        ids.push(id);
        return id;
    };

    beforeEach(() => {
        storage = useIsolatedChatSessionStorage();
        sandbox = sinon.createSandbox();
        ids = [];
        control = sandbox.stub(MasaClient.prototype, 'control');
        sandbox.stub(document, 'hidden').get(() => true);
    });

    afterEach(async () => {
        for (const id of ids) await endConversationInvestigations(id).catch(() => {});
        sandbox.restore();
        storage.restore();
    });

    const respond = (finalStatus, extra) =>
        control.callsFake(async (conversation, operation) => {
            if (operation.startsWith('session.')) return { result: lease(), retryAfter: 10 };
            if (operation === 'investigation.submit') return { result: job('queued'), retryAfter: 10 };
            return { result: job(finalStatus, extra), retryAfter: 10 };
        });

    const complete = (conversationId) => {
        const session = getInvestigationSession(conversationId);
        session.addEventListener('change', function finish() {
            const running = session.records.find((item) => item.status === 'queued');
            if (!running) return;
            session.removeEventListener('change', finish);
            session.updateJob(job('completed'));
            session.notify();
        });
    };

    it('resolves with the completed record and reports its id', async () => {
        respond('completed');
        const conversationId = open('ask');
        complete(conversationId);
        const onRecord = sandbox.spy();
        const record = await askMasa({ conversationId, question: 'Why?', context: 'Page', onRecord });
        expect(record.status).to.equal('completed');
        expect(onRecord.calledOnceWith(iid)).to.be.true;
    });

    it('rejects a second question while the conversation is busy without submitting', async () => {
        respond('completed');
        const conversationId = open('busy');
        const session = getInvestigationSession(conversationId);
        session.records.push({ id: iid, sessionId: sid, question: 'q', text: '', files: [], status: 'running' });
        let error;
        await askMasa({ conversationId, question: 'Again', context: '' }).catch((e) => (error = e));
        expect(error.code).to.equal('masa-conversation-busy');
        expect(control.called).to.be.false;
    });

    it('rejects with the submission error', async () => {
        control.callsFake(async (conversation, operation) => {
            if (operation === 'session.create') return { result: lease(), retryAfter: 10 };
            throw new MasaClientError('caller-not-allowed', '', 403);
        });
        const conversationId = open('denied');
        let error;
        await askMasa({ conversationId, question: 'Why?', context: '' }).catch((e) => (error = e));
        expect(error).to.be.instanceOf(MasaClientError);
        expect(error.code).to.equal('caller-not-allowed');
    });

    it('leaves the session free after a retryable submission failure', async () => {
        control.callsFake(async (conversation, operation) => {
            if (operation === 'session.create') return { result: lease(), retryAfter: 10 };
            throw new MasaClientError('service-busy', '', 503, 5);
        });
        const conversationId = open('unavailable');
        let error;
        await askMasa({ conversationId, question: 'Why?', context: '' }).catch((e) => (error = e));
        const session = getInvestigationSession(conversationId);
        expect(error.code).to.equal('service-busy');
        expect(session.pending).to.be.null;
        expect(session.isBusy).to.be.false;
    });

    describe('ambiguous submission failure', () => {
        const keys = [];
        const failFirst = () => {
            let failed = false;
            control.callsFake(async (conversation, operation, fields) => {
                if (operation.startsWith('session.')) return { result: lease(), retryAfter: 10 };
                if (operation === 'investigation.submit') {
                    keys.push(fields.idempotencyKey);
                    if (!failed) {
                        failed = true;
                        throw new MasaClientError('connection-unavailable', '', 0, 0);
                    }
                }
                return { result: job('queued'), retryAfter: 10 };
            });
        };

        beforeEach(() => {
            keys.length = 0;
        });

        it('keeps the pending submission when the server may have accepted it', async () => {
            failFirst();
            const conversationId = open('ambiguous');
            let error;
            await askMasa({ conversationId, question: 'Why?', context: '' }).catch((e) => (error = e));
            expect(error.code).to.equal('connection-unavailable');
            expect(getInvestigationSession(conversationId).pending.idempotencyKey).to.equal(keys[0]);
        });

        it('resubmits the same question with the same idempotency key', async () => {
            failFirst();
            const conversationId = open('same');
            await askMasa({ conversationId, question: 'Why?', context: '' }).catch(() => {});
            complete(conversationId);
            const record = await askMasa({ conversationId, question: 'Why?', context: '' });
            expect(record.status).to.equal('completed');
            expect(keys).to.have.length(2);
            expect(keys[1]).to.equal(keys[0]);
        });

        it('discards the old submission when a different question is asked', async () => {
            failFirst();
            const conversationId = open('different');
            await askMasa({ conversationId, question: 'Why?', context: '' }).catch(() => {});
            complete(conversationId);
            await askMasa({ conversationId, question: 'Something else?', context: '' });
            expect(keys).to.have.length(2);
            expect(keys[1]).to.not.equal(keys[0]);
        });
    });

    it('rejects when the job fails', async () => {
        respond('failed', { error: { code: 'worker-unavailable' } });
        const conversationId = open('failed');
        const session = getInvestigationSession(conversationId);
        session.addEventListener('change', function finish() {
            if (!session.records.some((item) => item.status === 'queued')) return;
            session.removeEventListener('change', finish);
            session.updateJob(job('failed', { error: { code: 'worker-unavailable' } }));
            session.notify();
        });
        let error;
        await askMasa({ conversationId, question: 'Why?', context: '' }).catch((e) => (error = e));
        expect(error.code).to.equal('worker-unavailable');
    });

    describe('session capacity', () => {
        const capacity = () => new MasaClientError('session-capacity', 'Too many sessions', 429, 60);

        it('frees an idle session and retries once on session-capacity', async () => {
            const idle = open('idle');
            const working = open('working');
            const target = open('target');
            sandbox.stub(sessionManager, 'listSessions').returns([{ id: idle }, { id: working }, { id: target }]);
            getInvestigationSession(idle).session = lease();
            const other = getInvestigationSession(working);
            other.session = lease();
            other.records.push({ id: iid, sessionId: sid, question: 'q', text: '', files: [], status: 'running' });
            let creates = 0;
            control.callsFake(async (conversation, operation) => {
                if (operation === 'session.create' && conversation === target && creates++ === 0) throw capacity();
                if (operation.startsWith('session.')) return { result: lease(), retryAfter: 10 };
                return { result: job('queued'), retryAfter: 10 };
            });
            complete(target);
            const record = await askMasa({ conversationId: target, question: 'Why?', context: '' });
            const ended = control.getCalls().filter((call) => call.args[1] === 'session.end');
            expect(record.status).to.equal('completed');
            expect(ended.map((call) => call.args[0])).to.deep.equal([idle]);
        });

        const ended = () =>
            control
                .getCalls()
                .filter((call) => call.args[1] === 'session.end')
                .map((call) => call.args[2].sessionId);

        it('frees a lease known only from storage, as after a reload', async () => {
            const stored = sessionManager.createSession();
            ids.push(stored.id);
            sessionManager.updateSession(stored.id, { investigationState: { sessionId: 'ses_stored' } });
            const target = open('target');
            sandbox.stub(sessionManager, 'listSessions').returns([{ id: stored.id }, { id: target }]);
            let creates = 0;
            control.callsFake(async (conversation, operation) => {
                if (operation === 'session.create' && conversation === target && creates++ === 0) throw capacity();
                if (operation.startsWith('session.')) return { result: lease(), retryAfter: 10 };
                return { result: job('queued'), retryAfter: 10 };
            });
            complete(target);
            const record = await askMasa({ conversationId: target, question: 'Why?', context: '' });
            expect(record.status).to.equal('completed');
            expect(ended()).to.deep.equal(['ses_stored']);
        });

        it('keeps freeing idle sessions past one that fails to end', async () => {
            const failing = open('failing');
            const idle = open('idle');
            const target = open('target');
            sandbox.stub(sessionManager, 'listSessions').returns([{ id: failing }, { id: idle }, { id: target }]);
            getInvestigationSession(failing).session = { ...lease(), id: 'ses_failing' };
            getInvestigationSession(idle).session = { ...lease(), id: 'ses_idle' };
            let creates = 0;
            control.callsFake(async (conversation, operation, fields) => {
                if (operation === 'session.create' && conversation === target && creates++ === 0) throw capacity();
                if (operation === 'session.end' && fields.sessionId === 'ses_failing')
                    throw new MasaClientError('service-busy', '', 503, 5);
                if (operation.startsWith('session.')) return { result: lease(), retryAfter: 10 };
                return { result: job('queued'), retryAfter: 10 };
            });
            complete(target);
            const record = await askMasa({ conversationId: target, question: 'Why?', context: '' });
            expect(record.status).to.equal('completed');
            expect(ended()).to.deep.equal(['ses_failing', 'ses_idle']);
        });

        it('falls back after a second session-capacity', async () => {
            const target = open('target');
            sandbox.stub(sessionManager, 'listSessions').returns([{ id: target }]);
            control.callsFake(async (conversation, operation) => {
                if (operation === 'session.create') throw capacity();
                return { result: lease(), retryAfter: 10 };
            });
            let error;
            await askMasa({ conversationId: target, question: 'Why?', context: '' }).catch((e) => (error = e));
            expect(error.code).to.equal('session-capacity');
            expect(control.getCalls().some((call) => call.args[1] === 'session.end')).to.be.false;
        });
    });
});

/** attach() ticks at once in a visible tab, so a restore or renewal can be in flight when the question is submitted. */
describe('askMasa in a visible tab', () => {
    let storage;
    let sandbox;
    let control;
    let ids;

    beforeEach(() => {
        storage = useIsolatedChatSessionStorage();
        sandbox = sinon.createSandbox();
        ids = [];
        control = sandbox.stub(MasaClient.prototype, 'control').callsFake(async (conversation, operation) => {
            if (operation.startsWith('session.')) return { result: lease(), retryAfter: 10 };
            return { result: job('completed'), retryAfter: 10 };
        });
    });

    afterEach(async () => {
        for (const id of ids) await endConversationInvestigations(id).catch(() => {});
        sandbox.restore();
        storage.restore();
    });

    const reloaded = (investigationState) => {
        const { id } = sessionManager.createSession();
        ids.push(id);
        sessionManager.updateSession(id, { investigationState });
        return id;
    };
    const operations = () => control.getCalls().map((call) => call.args[1]);

    it('submits after the restore that attaching starts', async () => {
        const conversationId = reloaded({ sessionId: sid });
        const record = await askMasa({ conversationId, question: 'Why?', context: '' });
        expect(record.status).to.equal('completed');
        expect(operations()).to.include('investigation.submit');
    });

    it('submits after the renewal that attaching starts', async () => {
        const conversationId = reloaded({});
        const session = getInvestigationSession(conversationId);
        session.session = lease();
        session.renewedAt = Date.now() - 60000;
        const record = await askMasa({ conversationId, question: 'Why?', context: '' });
        expect(record.status).to.equal('completed');
        expect(operations()).to.deep.equal(['session.renew', 'investigation.submit']);
    });

    it('keeps a reload-saved submission when MASA asks Studio to wait', async () => {
        const conversationId = reloaded({
            sessionId: sid,
            pending: { sessionId: sid, idempotencyKey: 'saved-key', question: 'First?', context: '', attachmentIds: [] },
        });
        control.callsFake(async () => {
            throw new MasaClientError('request-rate-limit', 'Slow down', 429, 30);
        });
        let error;
        await askMasa({ conversationId, question: 'Something else?', context: '' }).catch((e) => (error = e));
        expect(error.code).to.equal('request-rate-limit');
        expect(getInvestigationSession(conversationId).pending.idempotencyKey).to.equal('saved-key');
    });
});

describe('buildMasaContext', () => {
    const turns = [
        { role: 'user', content: 'first question' },
        { role: 'assistant', content: 'first reply' },
        { role: 'user', content: 'second question' },
    ];

    it('adds recent turns to the context, newest first', () => {
        const { context, limited } = buildMasaContext({ page: 'Studio path: /x', messages: turns });
        expect(context).to.equal(
            'Studio path: /x\n\nEarlier user: second question\n\nEarlier answer: first reply\n\nEarlier user: first question',
        );
        expect(limited).to.be.false;
    });

    it('leaves turns out and marks the context limited at 4,000 characters', () => {
        const page = 'p'.repeat(3900);
        const { context, limited } = buildMasaContext({
            page,
            messages: [{ role: 'user', content: 'x'.repeat(200) }],
        });
        expect(context.length).to.equal(page.length);
        expect(limited).to.be.true;
    });

    it('adds a MASA finding by its record text, using the given conversation', () => {
        const conversationId = 'masa-context-conversation';
        const session = getInvestigationSession(conversationId);
        session.records.push({
            id: iid,
            sessionId: sid,
            question: 'q',
            text: 'Offer differs.',
            files: [],
            status: 'completed',
        });
        const { context } = buildMasaContext({
            page: 'Page',
            conversationId,
            messages: [{ role: 'assistant', type: 'masa', recordId: iid, content: '' }],
        });
        expect(context).to.equal('Page\n\nEarlier answer: Offer differs.');
    });

    it('skips hidden messages', () => {
        const { context } = buildMasaContext({
            page: 'Page',
            messages: [{ role: 'user', content: 'secret routing', hidden: true }, ...turns],
        });
        expect(context).to.not.include('secret routing');
    });
});
