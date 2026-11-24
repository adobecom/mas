/**
 * Regenerates src/ai-chat/knowledge-corpus.js from src/ai-chat/knowledge/*.md.
 * Run via `npm run build:knowledge` after editing any knowledge markdown.
 * The corpus sync test (test/ai-chat/knowledge-corpus-sync.test.js) fails
 * CI when the generated module is out of date.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseKnowledgeMarkdown } from '../src/ai-chat/knowledge-parser.js';

const here = dirname(fileURLToPath(import.meta.url));
const knowledgeDir = join(here, '../src/ai-chat/knowledge');
const outPath = join(here, '../src/ai-chat/knowledge-corpus.js');

const files = readdirSync(knowledgeDir)
    .filter((file) => file.endsWith('.md'))
    .sort();
const chunks = files.flatMap((file) => parseKnowledgeMarkdown(file, readFileSync(join(knowledgeDir, file), 'utf8')));

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/ai-chat/knowledge/*.md — regenerate with \`npm run build:knowledge\`.
 * The corpus sync test fails when this file is out of date.
 */

`;
writeFileSync(outPath, `${header}export const KNOWLEDGE_CHUNKS = ${JSON.stringify(chunks, null, 4)};\n`);
console.log(`build-knowledge-corpus: ${files.length} files -> ${chunks.length} chunks -> ${outPath}`);
