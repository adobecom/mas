const { expect } = require('chai');

let buildFeedbackEntry;
let feedbackDayKey;
let appendFeedbackEntry;

const NOW = Date.UTC(2026, 6, 2, 15, 30, 0);

function fakeState(initial = {}) {
    const store = new Map(Object.entries(initial));
    return {
        puts: [],
        async get(key) {
            return store.has(key) ? { value: store.get(key) } : undefined;
        },
        async put(key, value, options) {
            store.set(key, value);
            this.puts.push({ key, value, options });
        },
    };
}

describe('ai-chat/feedback-store', () => {
    before(async () => {
        const mod = await import('../../src/ai-chat/feedback-store.js');
        buildFeedbackEntry = mod.buildFeedbackEntry;
        feedbackDayKey = mod.feedbackDayKey;
        appendFeedbackEntry = mod.appendFeedbackEntry;
    });

    describe('feedbackDayKey', () => {
        it('buckets by UTC day', () => {
            expect(feedbackDayKey(NOW)).to.equal('chat-feedback-2026-07-02');
        });
    });

    describe('buildFeedbackEntry', () => {
        it('captures rating, ids, a capped content snippet, and the timestamp', () => {
            const entry = buildFeedbackEntry(
                {
                    rating: 'down',
                    messageId: 'm-1',
                    sessionId: 's-1',
                    content: 'x'.repeat(600),
                    timestamp: 123,
                },
                NOW,
            );
            expect(entry.rating).to.equal('down');
            expect(entry.messageId).to.equal('m-1');
            expect(entry.sessionId).to.equal('s-1');
            expect(entry.content).to.have.length(500);
            expect(entry.messageTimestamp).to.equal(123);
            expect(entry.recordedAt).to.equal(new Date(NOW).toISOString());
        });

        it('defaults missing fields safely', () => {
            const entry = buildFeedbackEntry({ rating: 'up' }, NOW);
            expect(entry).to.deep.include({ rating: 'up', messageId: null, sessionId: null, content: '' });
        });
    });

    describe('appendFeedbackEntry', () => {
        it('creates the day bucket on first write with a one-year ttl', async () => {
            const state = fakeState();
            await appendFeedbackEntry(state, { rating: 'up' }, NOW);
            expect(state.puts).to.have.length(1);
            expect(state.puts[0].key).to.equal('chat-feedback-2026-07-02');
            expect(JSON.parse(state.puts[0].value)).to.deep.equal([{ rating: 'up' }]);
            expect(state.puts[0].options.ttl).to.be.greaterThan(31000000);
        });

        it('appends to an existing day bucket', async () => {
            const state = fakeState({
                'chat-feedback-2026-07-02': JSON.stringify([{ rating: 'down' }]),
            });
            await appendFeedbackEntry(state, { rating: 'up' }, NOW);
            expect(JSON.parse(state.puts[0].value)).to.deep.equal([{ rating: 'down' }, { rating: 'up' }]);
        });

        it('recovers from a corrupt bucket by starting a fresh list', async () => {
            const state = fakeState({ 'chat-feedback-2026-07-02': 'not-json' });
            await appendFeedbackEntry(state, { rating: 'up' }, NOW);
            expect(JSON.parse(state.puts[0].value)).to.deep.equal([{ rating: 'up' }]);
        });
    });
});
