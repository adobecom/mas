const { expect } = require('chai');
const { requireRealCorpus } = require('./real-corpus.js');

describe('ai-chat/knowledge corpus', () => {
    let chunks;

    before(async () => {
        chunks = await requireRealCorpus();
    });

    it('retrieves exclusively from the revisioned mas-agent export', async () => {
        const { MASA_KNOWLEDGE } = await import('../../src/ai-chat/masa-knowledge.js');
        expect(chunks).to.equal(MASA_KNOWLEDGE.chunks);
        expect(MASA_KNOWLEDGE.revision).to.be.a('string').and.not.equal('');
        expect(MASA_KNOWLEDGE.sha256).to.match(/^[a-f0-9]{64}$/);
        expect(chunks.every((chunk) => chunk.id.startsWith('masa:'))).to.equal(true);
    });

    it('retains authoring coverage without a Studio fallback corpus', () => {
        expect(chunks.length).to.be.greaterThan(100);
        const topics = new Set(chunks.map((chunk) => chunk.topic));
        for (const required of ['translation-workflow', 'promotions', 'create-card', 'manage-placeholders', 'studio-help']) {
            expect(topics.has(required), `missing topic ${required}`).to.equal(true);
        }
        expect(
            chunks
                .map((chunk) => chunk.text)
                .join(' ')
                .toLowerCase(),
        ).to.include('bulk publish');
    });

    it('keeps every chunk within the standalone-injection size band', () => {
        for (const chunk of chunks) {
            expect(chunk.text.length, `${chunk.id} too short`).to.be.at.least(150);
            expect(chunk.text.length, `${chunk.id} too long`).to.be.at.most(2000);
        }
    });
});
