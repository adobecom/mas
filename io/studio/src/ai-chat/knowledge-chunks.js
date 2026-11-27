/**
 * The assistant's sole knowledge source is mas-agent's author export. The local module is generated
 * and gitignored; edit knowledge in mas-agent, then refresh this snapshot.
 */
import { MASA_KNOWLEDGE } from './masa-knowledge.js';

if (!Array.isArray(MASA_KNOWLEDGE.chunks) || MASA_KNOWLEDGE.chunks.length === 0) {
    throw new Error('The mas-agent knowledge snapshot is empty. Run npm run fetch:masa-knowledge with an author export.');
}

export const MASA_KNOWLEDGE_REVISION = MASA_KNOWLEDGE.revision;
export const MASA_CHUNK_COUNT = MASA_KNOWLEDGE.chunks.length;
export const ALL_KNOWLEDGE_CHUNKS = MASA_KNOWLEDGE.chunks;
