const { expect } = require('chai');
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { requireRealCorpus } = require('./real-corpus.js');

let parseKnowledgeMarkdown;
let KNOWLEDGE_CHUNKS;

const KNOWLEDGE_DIR = join(__dirname, '../../src/ai-chat/knowledge');

describe('ai-chat/knowledge corpus', () => {
    before(async () => {
        parseKnowledgeMarkdown = (await import('../../src/ai-chat/knowledge-parser.js')).parseKnowledgeMarkdown;
        KNOWLEDGE_CHUNKS = (await import('../../src/ai-chat/knowledge-corpus.js')).KNOWLEDGE_CHUNKS;
    });

    function chunksFromMarkdown() {
        const files = readdirSync(KNOWLEDGE_DIR)
            .filter((file) => file.endsWith('.md'))
            .sort();
        return files.flatMap((file) => parseKnowledgeMarkdown(file, readFileSync(join(KNOWLEDGE_DIR, file), 'utf8')));
    }

    it('generated corpus matches the markdown sources (run npm run build:knowledge if this fails)', () => {
        expect(KNOWLEDGE_CHUNKS).to.deep.equal(chunksFromMarkdown());
    });

    // Promotions and most MAS topics come from the mas-agent corpus, so coverage is checked on what the
    // assistant actually retrieves from: its own chunks plus that corpus.
    it('has substantive coverage including the newer features', async function () {
        const chunks = await requireRealCorpus(this);
        expect(chunks.length).to.be.greaterThan(20);
        const topics = new Set(chunks.map((chunk) => chunk.topic));
        for (const required of ['translations', 'promotions']) {
            expect([...topics].join(','), `missing topic ${required}`).to.include(required);
        }
        const allText = chunks.map((c) => `${c.section} ${c.text}`)
            .join(' ')
            .toLowerCase();
        expect(allText).to.include('bulk publish');
    });

    it('keeps every mas-agent chunk within the standalone-injection size band', async function () {
        await requireRealCorpus(this);
        const { MASA_KNOWLEDGE } = await import('../../src/ai-chat/masa-knowledge.js');
        for (const chunk of MASA_KNOWLEDGE.chunks) {
            expect(chunk.text.length, `${chunk.id} too short`).to.be.at.least(150);
            expect(chunk.text.length, `${chunk.id} too long`).to.be.at.most(2000);
        }
    });

    it('keeps every chunk within the standalone-injection size band', () => {
        for (const chunk of KNOWLEDGE_CHUNKS) {
            expect(chunk.text.length, `${chunk.id} too short`).to.be.at.least(150);
            expect(chunk.text.length, `${chunk.id} too long`).to.be.at.most(2000);
        }
    });
});
