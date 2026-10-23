/**
 * Writes src/ai-chat/masa-knowledge.js from the knowledge corpus mas-agent publishes, so the assistant
 * searches that corpus in process instead of keeping a second copy of it. The corpus lives in the
 * private adobecom/mas-agent repo as the `knowledge-author.json` asset of its `knowledge-latest`
 * release (rebuilt on every knowledge change there); the generated module is gitignored, so the
 * corpus never lands in this public repo.
 *
 *   node scripts/fetch-masa-knowledge.mjs [--file <knowledge-author.json>] [--expected-sha256 <hash>]
 *
 * MAS_AGENT_KNOWLEDGE_TOKEN reads adobecom/mas-agent releases. --file or MAS_AGENT_KNOWLEDGE_FILE
 * reads a local author export instead. A valid, nonempty source is always required. Failed
 * refreshes leave the previous module intact. The optional digest pins deployment to the exact
 * export that passed tests, even if knowledge-latest changes.
 */

import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
export const OUT_FILE = join(here, '../src/ai-chat/masa-knowledge.js');
const REPO = 'adobecom/mas-agent';
const TAG = 'knowledge-latest';
const ASSET = 'knowledge-author.json';
export const FORMAT_VERSION = 1;
const CHUNK_FIELDS = ['id', 'topic', 'title', 'section', 'text'];

// Only the fields the retriever reads leave the file; anything else in the export is ignored.
export function validateCorpus(corpus) {
    if (corpus?.version !== FORMAT_VERSION)
        throw new Error(`unsupported knowledge format version ${corpus?.version}; this script reads ${FORMAT_VERSION}`);
    if (corpus.profile !== 'author') throw new Error('Studio requires the author knowledge profile');
    if (typeof corpus.revision !== 'string' || !corpus.revision.trim()) throw new Error('the knowledge export has no revision');
    if (typeof corpus.generatedAt !== 'string' || !Number.isFinite(Date.parse(corpus.generatedAt)))
        throw new Error('the knowledge export has no valid generation date');
    if (!Array.isArray(corpus.chunks) || corpus.chunks.length === 0) throw new Error('the knowledge export has no chunks');
    const ids = new Set();
    return corpus.chunks.map((chunk, index) => {
        for (const field of CHUNK_FIELDS) {
            if (typeof chunk?.[field] !== 'string' || !chunk[field].trim()) throw new Error(`chunk ${index} has no ${field}`);
        }
        if (ids.has(chunk.id)) throw new Error(`duplicate knowledge chunk id: ${chunk.id}`);
        ids.add(chunk.id);
        const keywords = chunk.keywords ?? [];
        if (!Array.isArray(keywords) || keywords.some((keyword) => typeof keyword !== 'string' || !keyword.trim()))
            throw new Error(`chunk ${index} has invalid keywords`);
        return {
            id: `masa:${chunk.id}`,
            topic: chunk.topic,
            title: chunk.title,
            section: chunk.section,
            keywords,
            text: chunk.text,
        };
    });
}

export function moduleSource({ revision, generatedAt, sha256, chunks }) {
    return [
        '/**',
        ' * GENERATED FILE — do not edit or commit (it is gitignored).',
        ' * The mas-agent knowledge corpus, written by `npm run fetch:masa-knowledge`.',
        ' */',
        '',
        `export const MASA_KNOWLEDGE = ${JSON.stringify({ revision, generatedAt, sha256, chunks }, null, 4)};`,
        '',
    ].join('\n');
}

async function download(token) {
    const signal = AbortSignal.timeout(30000);
    const headers = {
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'mas-studio-knowledge',
    };
    const release = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${TAG}`, {
        headers: { ...headers, Accept: 'application/vnd.github+json' },
        signal,
    });
    if (!release.ok) throw new Error(`could not read the ${TAG} release of ${REPO}: HTTP ${release.status}`);
    const asset = (await release.json()).assets?.find((item) => item.name === ASSET);
    if (!asset) throw new Error(`the ${TAG} release of ${REPO} has no ${ASSET}`);
    const file = await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`, {
        headers: { ...headers, Accept: 'application/octet-stream' },
        signal,
    });
    if (!file.ok) throw new Error(`could not download ${ASSET}: HTTP ${file.status}`);
    return file.text();
}

async function main() {
    const { values } = parseArgs({
        options: {
            file: { type: 'string' },
            'expected-sha256': { type: 'string' },
        },
    });
    const token = process.env.MAS_AGENT_KNOWLEDGE_TOKEN;
    const file = values.file || process.env.MAS_AGENT_KNOWLEDGE_FILE;
    if (!file && !token) {
        throw new Error(
            'A mas-agent author export is required: set MAS_AGENT_KNOWLEDGE_TOKEN or MAS_AGENT_KNOWLEDGE_FILE, or pass --file. The previous snapshot has not been changed.',
        );
    }
    const source = file ? readFileSync(file, 'utf8') : await download(token);
    const sha256 = createHash('sha256').update(source).digest('hex');
    const expected = values['expected-sha256'];
    if (expected && expected !== sha256) throw new Error('the knowledge export changed since validation; rerun the refresh');
    const corpus = JSON.parse(source);
    const chunks = validateCorpus(corpus);
    const temporary = `${OUT_FILE}.${process.pid}.tmp`;
    try {
        writeFileSync(temporary, moduleSource({ revision: corpus.revision, generatedAt: corpus.generatedAt, sha256, chunks }));
        renameSync(temporary, OUT_FILE);
    } finally {
        rmSync(temporary, { force: true });
    }
    console.log(
        `wrote ${chunks.length} mas-agent knowledge chunks (revision ${corpus.revision ?? 'unknown'}) to src/ai-chat/masa-knowledge.js`,
    );
}

// Node resolves symlinks in import.meta.url but not in argv, e.g. macOS /var -> /private/var.
if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) {
    main().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
