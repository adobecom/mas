/**
 * In-process lexical retriever over the in-repo knowledge corpus.
 *
 * Replaces the remote OpenSearch knowledge service: the corpus is small
 * (tens of pages), so idf-weighted query-term coverage over pre-tokenized
 * chunks retrieves comparably to embeddings at zero infrastructure cost.
 * Interface-compatible with the old KnowledgeClient — queryWithSources
 * returns { context, sources } and never throws.
 *
 * Scores are normalized 0..1 (share of the query's idf weight covered by
 * the chunk), so the existing minScore thresholds keep their meaning:
 * off-corpus queries (unseen terms carry high idf) score near zero and
 * inject nothing.
 */

const RAW_STOPWORDS = [
    'a',
    'an',
    'the',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'do',
    'does',
    'did',
    'how',
    'what',
    'when',
    'where',
    'which',
    'who',
    'why',
    'i',
    'me',
    'my',
    'we',
    'our',
    'you',
    'your',
    'it',
    'its',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'and',
    'or',
    'not',
    'no',
    'can',
    'could',
    'should',
    'would',
    'will',
    'shall',
    'may',
    'might',
    'about',
    'tell',
    'please',
    'help',
    'there',
    'this',
    'that',
    'these',
    'those',
    'from',
    'one',
    'ones',
    'use',
    'used',
    'using',
    'work',
    'working',
    'want',
    'need',
    'get',
    'also',
    'just',
    'like',
    'many',
    'much',
    'some',
    'any',
    'across',
    'between',
    'per',
    'each',
    'every',
    'both',
    'together',
    'without',
    'again',
];

const STOPWORDS = new Set(RAW_STOPWORDS.map((word) => normalize(word)));

/**
 * Light suffix stemming — enough to unify plural/-ing/-e verb and noun
 * forms across query and corpus ("publishing" ↔ "publish", "creates" ↔
 * "create") without a real stemmer.
 */
function normalize(token) {
    let base = token;
    if (base.length > 3 && base.endsWith('s')) base = base.slice(0, -1);
    if (base.length > 5 && base.endsWith('ing')) {
        base = base.slice(0, -3);
        if (base.length > 3 && base[base.length - 1] === base[base.length - 2]) base = base.slice(0, -1);
    }
    if (base.length > 4 && base.endsWith('e')) base = base.slice(0, -1);
    return base;
}

export function tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    const raw = text.toLowerCase().match(/[a-z0-9][a-z0-9_-]*/g) ?? [];
    return raw.map(normalize);
}

const HEADLINE_TERM_WEIGHT = 3;

export class LocalKnowledgeRetriever {
    constructor(chunks = []) {
        this.chunks = chunks.map((chunk) => {
            const termFrequency = new Map();
            const count = (text, weight) => {
                for (const token of tokenize(text)) {
                    termFrequency.set(token, (termFrequency.get(token) ?? 0) + weight);
                }
            };
            // Terms in the topic, titles, and keywords are stronger topical
            // signals than incidental mentions in body prose.
            count([chunk.topic, chunk.title, chunk.section, (chunk.keywords ?? []).join(' ')].join(' '), HEADLINE_TERM_WEIGHT);
            count(chunk.text, 1);
            return { ...chunk, termFrequency };
        });
        this.documentFrequency = new Map();
        for (const chunk of this.chunks) {
            for (const token of chunk.termFrequency.keys()) {
                this.documentFrequency.set(token, (this.documentFrequency.get(token) ?? 0) + 1);
            }
        }
    }

    #idf(term) {
        const df = this.documentFrequency.get(term) ?? 0.5;
        return Math.log(1 + this.chunks.length / df);
    }

    /**
     * coverage — share of the query's idf weight present in the chunk
     * (0..1, gates against minScore). rank — coverage plus tf-idf mass of
     * the matched terms, so single-term queries break ties toward the
     * chunk that is actually ABOUT the term rather than one mentioning it
     * in passing.
     */
    #score(queryTerms, chunk) {
        let matched = 0;
        let total = 0;
        let tfWeight = 0;
        for (const term of queryTerms) {
            const weight = this.#idf(term);
            total += weight;
            const tf = chunk.termFrequency.get(term) ?? 0;
            if (tf > 0) {
                matched += weight;
                tfWeight += weight * Math.log(1 + tf);
            }
        }
        const coverage = total > 0 ? matched / total : 0;
        return { coverage, rank: coverage + tfWeight };
    }

    async queryWithSources(query, options = {}) {
        const { topK = 3, minScore = 0.6 } = options;
        // Terms the corpus has never seen carry no discriminative signal for
        // retrieval within it, but their fallback idf is the largest weight
        // in the query — one novel word ("explain", "management") would sink
        // coverage below the gate for every chunk. Score over seen terms
        // only; a query with no seen terms is off-corpus and returns nothing.
        const queryTerms = [...new Set(tokenize(query))]
            .filter((t) => !STOPWORDS.has(t) && t.length > 1)
            .filter((t) => this.documentFrequency.has(t));
        if (queryTerms.length === 0 || this.chunks.length === 0) {
            return { context: '', sources: [] };
        }

        const hits = this.chunks
            .map((chunk) => ({ chunk, ...this.#score(queryTerms, chunk) }))
            .filter((hit) => hit.coverage >= minScore)
            .sort((first, second) => second.rank - first.rank)
            .slice(0, topK);

        if (hits.length === 0) {
            return { context: '', sources: [] };
        }

        const context = `=== RELEVANT KNOWLEDGE ===\n${hits
            .map(({ chunk }) => `### ${chunk.title} > ${chunk.section}\n${chunk.text}`)
            .join('\n---\n')}`;
        const sources = hits.map(({ chunk, coverage }) => ({
            id: chunk.id,
            topic: chunk.topic,
            title: `${chunk.title} — ${chunk.section}`,
            section: chunk.section,
            score: Number(coverage.toFixed(3)),
        }));
        return { context, sources };
    }
}
