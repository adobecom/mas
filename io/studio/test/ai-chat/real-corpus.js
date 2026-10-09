/**
 * The real corpus the assistant retrieves from: its own chunks plus the mas-agent corpus. Suites that
 * test answers against it call requireRealCorpus first. In CI a missing mas-agent corpus fails (the
 * workflow fetches it with MAS_AGENT_KNOWLEDGE_TOKEN); locally without the token the suite is skipped
 * with a pointer, since there is nothing real to test against.
 */
async function loadRealCorpus() {
    const { ALL_KNOWLEDGE_CHUNKS, MASA_CHUNK_COUNT } = await import('../../src/ai-chat/knowledge-chunks.js');
    return { chunks: ALL_KNOWLEDGE_CHUNKS, masaChunks: MASA_CHUNK_COUNT };
}

async function requireRealCorpus(context) {
    const corpus = await loadRealCorpus();
    if (corpus.masaChunks > 0) return corpus.chunks;
    const why =
        'the mas-agent knowledge corpus is not fetched: run `npm run fetch:masa-knowledge` with MAS_AGENT_KNOWLEDGE_TOKEN set';
    if (process.env.CI) throw new Error(why);
    console.warn(`skipped: ${why}`);
    return context.skip();
}

module.exports = { loadRealCorpus, requireRealCorpus };
