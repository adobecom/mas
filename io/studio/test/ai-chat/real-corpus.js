/**
 * The mas-agent author export is the assistant's only corpus. Coverage suites require it locally
 * and in CI; use MAS_AGENT_KNOWLEDGE_FILE for an unpublished export. Never skip missing coverage.
 */
async function loadRealCorpus() {
    const { ALL_KNOWLEDGE_CHUNKS, MASA_CHUNK_COUNT } = await import('../../src/ai-chat/knowledge-chunks.js');
    return { chunks: ALL_KNOWLEDGE_CHUNKS, masaChunks: MASA_CHUNK_COUNT };
}

async function requireRealCorpus() {
    const corpus = await loadRealCorpus();
    if (corpus.masaChunks > 0) return corpus.chunks;
    throw new Error('the mas-agent knowledge corpus is not fetched: set MAS_AGENT_KNOWLEDGE_TOKEN or MAS_AGENT_KNOWLEDGE_FILE');
}

module.exports = { loadRealCorpus, requireRealCorpus };
