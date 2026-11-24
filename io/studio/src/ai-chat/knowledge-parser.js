/**
 * Parser for the in-repo knowledge corpus (src/ai-chat/knowledge/*.md).
 *
 * Each markdown file has YAML-ish frontmatter (topic, keywords), one H1
 * title, and `## ` sections. Every section becomes one retrieval chunk —
 * sections are written to be self-contained so a chunk can be injected
 * into the prompt standalone.
 *
 * Shared by the build script (scripts/build-knowledge-corpus.mjs) and the
 * corpus sync test, so generation and verification can never drift apart.
 */

export function parseKnowledgeMarkdown(fileName, fileText) {
    const frontmatterMatch = fileText.match(/^---\n([\s\S]*?)\n---\n/);
    const frontmatter = {};
    if (frontmatterMatch) {
        for (const line of frontmatterMatch[1].split('\n')) {
            const idx = line.indexOf(':');
            if (idx === -1) continue;
            frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
    }
    const topic = frontmatter.topic ?? fileName.replace(/\.md$/, '');
    const keywords = frontmatter.keywords
        ? frontmatter.keywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
        : [];

    const body = frontmatterMatch ? fileText.slice(frontmatterMatch[0].length) : fileText;
    const titleMatch = body.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : topic;

    const chunks = [];
    const sections = body.split(/\n##\s+/).slice(1);
    for (const raw of sections) {
        const newlineIdx = raw.indexOf('\n');
        const section = (newlineIdx === -1 ? raw : raw.slice(0, newlineIdx)).trim();
        const text = (newlineIdx === -1 ? '' : raw.slice(newlineIdx + 1)).trim();
        if (!section || !text) continue;
        chunks.push({
            id: `${fileName}#${chunks.length}`,
            topic,
            title,
            section,
            keywords,
            text,
        });
    }
    return chunks;
}
