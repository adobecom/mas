/**
 * Everything the assistant retrieves from: its own Studio chunks (knowledge/*.md, built into
 * knowledge-corpus.js) and the mas-agent corpus fetched at deploy (masa-knowledge.js, generated and
 * gitignored; see scripts/fetch-masa-knowledge.mjs).
 */
import { KNOWLEDGE_CHUNKS } from './knowledge-corpus.js';
import { MASA_KNOWLEDGE } from './masa-knowledge.js';

export const MASA_KNOWLEDGE_REVISION = MASA_KNOWLEDGE.revision;
export const MASA_CHUNK_COUNT = MASA_KNOWLEDGE.chunks.length;
export const ALL_KNOWLEDGE_CHUNKS = [...KNOWLEDGE_CHUNKS, ...MASA_KNOWLEDGE.chunks];
