import { MasaClientError } from './masa-client.js';
import { endIdleSessions, getInvestigationSession, isRunning } from './investigation-session.js';

const CONTEXT_LIMIT = 4000;
export const MASA_BUSY_MESSAGE = 'MASA is still answering the previous question.';
const busyError = () => new MasaClientError('masa-conversation-busy', MASA_BUSY_MESSAGE);

/** Text of a thread message as MASA should see it, or null when it carries nothing to share. */
function turnLabel(message, conversationId) {
    if (message.hidden) return null;
    if (message.type === 'masa') {
        const record = getInvestigationSession(message.conversationId ?? conversationId).records.find(
            (item) => item.id === message.recordId,
        );
        return record?.text ? `Earlier answer: ${record.text}` : null;
    }
    if (typeof message.content !== 'string' || !message.content.trim()) return null;
    if (message.role === 'user') return `Earlier user: ${message.content}`;
    return message.role === 'assistant' ? `Earlier answer: ${message.content}` : null;
}

/** Page block plus the newest visible turns that fit, leaving room for the session's own earlier findings. */
export function buildMasaContext({ page, messages, conversationId }) {
    let context = page;
    let limited = false;
    for (const message of [...messages].reverse()) {
        const label = turnLabel(message, conversationId);
        if (!label) continue;
        const candidate = `${context}\n\n${label}`;
        if (candidate.length > CONTEXT_LIMIT) {
            limited = true;
            break;
        }
        context = candidate;
    }
    return { context, limited };
}

/** A server answer means the submission is dead; status 0 may have been accepted, so its key is kept for a retry. */
function discardIfAnswered(session, error) {
    if (error.status !== 0) session.discardPending();
}

/**
 * attach() starts a restore or renewal at once in a visible tab, and perform()
 * skips while busy, so wait it out; nothing may await between the wait and the
 * submission, or the tick's next task takes the session first. A submission
 * that cannot run keeps any saved pending one.
 */
async function submitOnce(session, question, context) {
    while (session.busy) await session.inFlight;
    if (session.blocked) throw session.error ?? busyError();
    const count = session.records.length;
    try {
        if (session.pending?.question === question) await session.retrySubmission();
        else {
            if (session.pending) session.discardPending();
            await session.submit(question, context);
        }
    } catch (error) {
        discardIfAnswered(session, error);
        throw error;
    }
    if (session.records.length > count) return session.records.at(-1);
    const error = session.error ?? busyError();
    discardIfAnswered(session, error);
    throw error;
}

function settled(session, id) {
    return new Promise((resolve) => {
        const check = () => {
            const current = session.records.find((item) => item.id === id);
            if (current && isRunning(current)) return;
            session.removeEventListener('change', check);
            resolve(current);
        };
        session.addEventListener('change', check);
        check();
    });
}

/** Submit one question to the conversation's MASA session and resolve with its completed record. */
export async function askMasa({ conversationId, question, context, onRecord }) {
    const session = getInvestigationSession(conversationId);
    if (session.records.some(isRunning)) throw busyError();
    const detach = session.attach();
    try {
        let accepted;
        try {
            accepted = await submitOnce(session, question, context);
        } catch (error) {
            if (error.code !== 'session-capacity' || !(await endIdleSessions(conversationId))) throw error;
            session.retryAt = 0;
            accepted = await submitOnce(session, question, context);
        }
        onRecord?.(accepted.id);
        const record = await settled(session, accepted.id);
        if (record?.status !== 'completed') throw new MasaClientError(record?.failure ?? 'investigation-failed', '');
        return record;
    } finally {
        detach();
    }
}
