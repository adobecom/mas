const { expect } = require('chai');
const { execFileSync, spawnSync } = require('node:child_process');
const { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const corpus = {
    version: 1,
    profile: 'author',
    revision: 'abc123',
    generatedAt: '2026-10-16T00:00:00Z',
    chunks: [{ id: 'offers#catalog', topic: 'offers', title: 'Offers', section: 'Catalog', text: 'Product catalog guidance.' }],
};

describe('ai-chat/mas-agent knowledge import', () => {
    let validateCorpus;
    let directory;
    let script;
    let output;
    let env;

    before(async () => {
        ({ validateCorpus } = await import('../../scripts/fetch-masa-knowledge.mjs'));
    });

    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), 'studio-knowledge-'));
        mkdirSync(join(directory, 'scripts'));
        mkdirSync(join(directory, 'src/ai-chat'), { recursive: true });
        script = join(directory, 'scripts/fetch-masa-knowledge.mjs');
        output = join(directory, 'src/ai-chat/masa-knowledge.js');
        copyFileSync(join(__dirname, '../../scripts/fetch-masa-knowledge.mjs'), script);
        env = { ...process.env, CI: '', MAS_AGENT_KNOWLEDGE_TOKEN: '', MAS_AGENT_KNOWLEDGE_FILE: '' };
    });

    afterEach(() => rmSync(directory, { recursive: true, force: true }));

    it('namespaces imported chunks and rejects an incompatible or non-author corpus', () => {
        expect(validateCorpus(corpus)[0].id).to.equal('masa:offers#catalog');
        expect(() => validateCorpus({ ...corpus, version: 2 })).to.throw('format version');
        expect(() => validateCorpus({ ...corpus, profile: 'internal' })).to.throw('author knowledge profile');
        expect(() => validateCorpus({ ...corpus, chunks: [] })).to.throw('no chunks');
        expect(() => validateCorpus({ ...corpus, chunks: [{ ...corpus.chunks[0], text: '' }] })).to.throw('no text');
    });

    it('allows local Studio-only operation but requires knowledge for CI and deployment', () => {
        execFileSync(process.execPath, [script], { env, stdio: 'pipe' });
        expect(readFileSync(output, 'utf8')).to.include('"chunks": []');
        for (const [args, overrides] of [
            [['--required'], {}],
            [[], { CI: 'true' }],
        ]) {
            const result = spawnSync(process.execPath, [script, ...args], { env: { ...env, ...overrides }, encoding: 'utf8' });
            expect(result.status).to.equal(1);
            expect(result.stderr).to.include('this run needs the mas-agent knowledge corpus');
        }
    });

    it('loads a local export for pretest and preserves its revision in the generated module', () => {
        const file = join(directory, 'author.json');
        writeFileSync(file, JSON.stringify(corpus));
        execFileSync(process.execPath, [script], {
            env: { ...env, CI: 'true', MAS_AGENT_KNOWLEDGE_FILE: file },
            stdio: 'pipe',
        });
        const generated = readFileSync(output, 'utf8');
        expect(generated).to.include('"revision": "abc123"');
        expect(generated).to.include('"id": "masa:offers#catalog"');
    });
});
