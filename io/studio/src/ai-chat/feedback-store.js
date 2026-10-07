/**
 * Durable storage for chat feedback (thumbs up/down) in IO Runtime State.
 *
 * Activation logs only retain the structured feedback line for a few days;
 * State keeps entries for a year. Entries are bucketed per day under one
 * key (chat-feedback-YYYY-MM-DD) so a day's feedback is one read:
 *   aio app state get chat-feedback-2026-07-02
 */

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;
const CONTENT_SNIPPET_LIMIT = 500;

export function buildFeedbackEntry(params, now) {
    const { rating, messageId = null, sessionId = null, content = '', timestamp = null } = params;
    return {
        rating,
        messageId,
        sessionId,
        content: typeof content === 'string' ? content.slice(0, CONTENT_SNIPPET_LIMIT) : '',
        messageTimestamp: timestamp,
        recordedAt: new Date(now).toISOString(),
    };
}

export function feedbackDayKey(now) {
    return `chat-feedback-${new Date(now).toISOString().slice(0, 10)}`;
}

export async function appendFeedbackEntry(state, entry, now) {
    const key = feedbackDayKey(now);
    let entries = [];
    const existing = await state.get(key);
    if (existing?.value) {
        try {
            const parsed = JSON.parse(existing.value);
            if (Array.isArray(parsed)) entries = parsed;
        } catch {
            entries = [];
        }
    }
    entries.push(entry);
    await state.put(key, JSON.stringify(entries), { ttl: ONE_YEAR_SECONDS });
    return key;
}
