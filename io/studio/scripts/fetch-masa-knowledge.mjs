/**
 * Writes src/ai-chat/masa-knowledge.js from the knowledge corpus mas-agent publishes, so the assistant
 * searches that corpus in process instead of keeping a ported copy of it. The corpus lives in the
 * private adobecom/mas-agent repo as the `knowledge-author.json` asset of its `knowledge-latest`
 * release (rebuilt on every knowledge change there); the generated module is gitignored, so the
 * corpus never lands in this public repo.
 *
 *   node scripts/fetch-masa-knowledge.mjs [--required] [--file <knowledge-author.json>]
 *
 * MAS_AGENT_KNOWLEDGE_TOKEN: a token that can read adobecom/mas-agent releases. Without it (local
 * work, fork PRs) the module is written empty and the assistant answers from its own chunks only;
 * --required makes that an error, as deploys and CI tests need the real corpus. --file reads a local
 * export instead (npm run knowledge:export in mas-agent).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
    if (corpus?.version !== FORMAT_VERSION) throw new Error(`unsupported knowledge format version ${corpus?.version}; this script reads ${FORMAT_VERSION}`);
    if (!Array.isArray(corpus.chunks) || corpus.chunks.length === 0) throw new Error('the knowledge export has no chunks');
    return corpus.chunks.map((chunk, index) => {
        for (const field of CHUNK_FIELDS) {
            if (typeof chunk?.[field] !== 'string' || !chunk[field]) throw new Error(`chunk ${index} has no ${field}`);
        }
        return { id: `masa:${chunk.id}`, topic: chunk.topic, title: chunk.title, section: chunk.section, keywords: Array.isArray(chunk.keywords) ? chunk.keywords : [], text: chunk.text };
    });
}

export function moduleSource({ revision = null, generatedAt = null, chunks = [] } = {}) {
    return [
        '/**',
        ' * GENERATED FILE — do not edit or commit (it is gitignored).',
        ' * The mas-agent knowledge corpus, written by `npm run fetch:masa-knowledge`.',
        ' */',
        '',
        `export const MASA_KNOWLEDGE = ${JSON.stringify({ revision, generatedAt, chunks }, null, 4)};`,
        '',
    ].join('\n');
}

async function download(token) {
    const headers = { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'mas-studio-knowledge' };
    const release = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${TAG}`, { headers: { ...headers, Accept: 'application/vnd.github+json' } });
    if (!release.ok) throw new Error(`could not read the ${TAG} release of ${REPO}: HTTP ${release.status}`);
    const asset = (await release.json()).assets?.find((item) => item.name === ASSET);
    if (!asset) throw new Error(`the ${TAG} release of ${REPO} has no ${ASSET}`);
    const file = await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`, { headers: { ...headers, Accept: 'application/octet-stream' } });
    if (!file.ok) throw new Error(`could not download ${ASSET}: HTTP ${file.status}`);
    return file.json();
}

async function main() {
    const { values } = parseArgs({ options: { required: { type: 'boolean', default: false }, file: { type: 'string' } } });
    const token = process.env.MAS_AGENT_KNOWLEDGE_TOKEN;
    if (!values.file && !token) {
        if (values.required) throw new Error('MAS_AGENT_KNOWLEDGE_TOKEN is not set, and this run needs the mas-agent knowledge corpus');
        writeFileSync(OUT_FILE, moduleSource());
        console.warn('MAS_AGENT_KNOWLEDGE_TOKEN is not set: wrote an empty mas-agent knowledge module; the assistant answers from its own chunks only.');
        return;
    }
    const corpus = values.file ? JSON.parse(readFileSync(values.file, 'utf8')) : await download(token);
    const chunks = validateCorpus(corpus);
    writeFileSync(OUT_FILE, moduleSource({ revision: corpus.revision ?? null, generatedAt: corpus.generatedAt ?? null, chunks }));
    console.log(`wrote ${chunks.length} mas-agent knowledge chunks (revision ${corpus.revision ?? 'unknown'}) to src/ai-chat/masa-knowledge.js`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
