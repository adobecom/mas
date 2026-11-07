const { expect } = require('chai');
const { createHash } = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } = require('node:fs');
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

    it('requires knowledge locally and in CI without replacing a previous snapshot', () => {
        writeFileSync(output, 'previous validated snapshot');
        for (const overrides of [{}, { CI: 'true' }]) {
            const result = spawnSync(process.execPath, [script], { env: { ...env, ...overrides }, encoding: 'utf8' });
            expect(result.status).to.equal(1);
            expect(result.stderr).to.include('A mas-agent author export is required');
            expect(readFileSync(output, 'utf8')).to.equal('previous validated snapshot');
        }
    });

    it('rejects invalid metadata, duplicate chunks and whitespace-only content', () => {
        expect(() => validateCorpus({ ...corpus, revision: '' })).to.throw('no revision');
        expect(() => validateCorpus({ ...corpus, generatedAt: 'yesterday' })).to.throw('generation date');
        expect(() => validateCorpus({ ...corpus, chunks: [...corpus.chunks, ...corpus.chunks] })).to.throw('duplicate');
        expect(() => validateCorpus({ ...corpus, chunks: [{ ...corpus.chunks[0], text: '  ' }] })).to.throw('no text');
    });

    it('rejects keywords that are not nonempty strings', () => {
        for (const keywords of ['catalog', ['catalog', 7], ['catalog', ' ']]) {
            expect(() => validateCorpus({ ...corpus, chunks: [{ ...corpus.chunks[0], keywords }] })).to.throw(
                'invalid keywords',
            );
        }
    });

    it('runs when invoked through a symlinked path', () => {
        const linked = join(directory, 'linked');
        symlinkSync(directory, linked);
        const result = spawnSync(process.execPath, [join(linked, 'scripts/fetch-masa-knowledge.mjs')], {
            env,
            encoding: 'utf8',
        });
        expect(result.status).to.equal(1);
        expect(result.stderr).to.include('A mas-agent author export is required');
    });

    it('keeps the previous snapshot when an export is malformed, empty, or not the tested version', () => {
        writeFileSync(output, 'previous validated snapshot');
        const file = join(directory, 'author.json');
        for (const source of ['not json', JSON.stringify({ ...corpus, chunks: [] }), JSON.stringify(corpus)]) {
            writeFileSync(file, source);
            const args = [script, '--file', file];
            if (source === JSON.stringify(corpus)) args.push('--expected-sha256', '0'.repeat(64));
            const result = spawnSync(process.execPath, args, { env, encoding: 'utf8' });
            expect(result.status).to.equal(1);
            expect(readFileSync(output, 'utf8')).to.equal('previous validated snapshot');
        }
    });

    it('loads a local export for pretest and preserves its revision in the generated module', () => {
        const file = join(directory, 'author.json');
        writeFileSync(file, JSON.stringify(corpus));
        const hash = createHash('sha256').update(JSON.stringify(corpus)).digest('hex');
        execFileSync(process.execPath, [script, '--expected-sha256', hash], {
            env: { ...env, CI: 'true', MAS_AGENT_KNOWLEDGE_FILE: file },
            stdio: 'pipe',
        });
        const generated = readFileSync(output, 'utf8');
        expect(generated).to.include('"revision": "abc123"');
        expect(generated).to.include('"id": "masa:offers#catalog"');
        expect(generated).to.include(`"sha256": "${hash}"`);
    });

    it('keeps the previous snapshot when GitHub is unavailable', () => {
        writeFileSync(output, 'previous validated snapshot');
        const mock = join(directory, 'github-unavailable.mjs');
        writeFileSync(mock, 'globalThis.fetch = async () => new Response("", { status: 503 });');
        const result = spawnSync(process.execPath, ['--import', mock, script], {
            env: { ...env, MAS_AGENT_KNOWLEDGE_TOKEN: 'test-token' },
            encoding: 'utf8',
        });
        expect(result.status).to.equal(1);
        expect(result.stderr).to.include('HTTP 503');
        expect(readFileSync(output, 'utf8')).to.equal('previous validated snapshot');
    });

    it('rejects an accidentally bundled empty module at runtime', () => {
        writeFileSync(output, 'export const MASA_KNOWLEDGE = { chunks: [] };');
        const entry = join(directory, 'src/ai-chat/knowledge-chunks.js');
        copyFileSync(join(__dirname, '../../src/ai-chat/knowledge-chunks.js'), entry);
        writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
        const result = spawnSync(process.execPath, [entry], { env, encoding: 'utf8' });
        expect(result.status).to.equal(1);
        expect(result.stderr).to.include('knowledge snapshot is empty');
    });
});
