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
    'want',
    'need',
    'work',
    'working',
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
    'available',
];

/**
 * "help" and "get" were on this list and are content words in THIS corpus, not
 * filler: "help" heads 8 sections (idf 2.04) and "get" is the single most
 * discriminative term measured (df 1, idf 4.32). Stopping them reduced
 * "Where do I get help?" to no query terms at all, so it retrieved nothing
 * while being, verbatim, the section heading of troubleshooting.md.
 *
 * "work" was removed with them and put back. It scores like a topic (df 12,
 * heads 5 sections) but reads like one only by accident: headline terms carry
 * 3x weight, so as a query term it drags any "...how does X work?" heading to
 * the top. It sent "how do collections work" to a promo-exceptions chunk and
 * "how does the offer selector work" from OST to OSI. It is a framing verb.
 *
 * Deriving the whole list from the corpus instead was tried and is wrong: in a
 * small corpus an auxiliary like "does" looks rare enough to pass any idf
 * test, and promoting it to a content word breaks queries that worked. Closed
 * class function words are filler however they score, so the list stays hand
 * written and entries come off it one at a time, with evidence.
 *
 * "available" went on it: it frames a question ("what variants are available?")
 * and rarely names what is being asked about. Left in, it only matches chunks
 * that happen to say "available", which sank the section actually about the topic.
 */
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

/**
 * Complementary-chunk selection (RETRIEVER_V2). The v1 gate asks every chunk to
 * cover minScore of the query alone, so a compound question whose answer spans
 * two sections (each covering about 60% of the terms) retrieves neither. v2
 * keeps v1's result whenever v1 finds anything, so nothing that worked changes,
 * and only when v1 finds nothing builds a set greedily: each pick must cover
 * at least COMPLEMENT_FLOOR of the query by itself, and the set counts once the
 * terms it covers together reach the gate. When v1 does find something, the
 * remaining slots go to chunks that cover query terms the v1 hits leave
 * uncovered (a spurious hit that matches only the rare words of a question
 * would otherwise crowd out the chunk about its actual topic).
 */
export const COMPLEMENT_FLOOR = 0.4;
export const COMPLEMENT_MIN_GAIN = 0.15;

/**
 * Trust bar (RETRIEVER_V2). Retrieval can clear the gate with a plausible but
 * marginal chunk, and the model then asserts from it. When the best chunk
 * returned covers less than this share of the query, the result is flagged
 * `lowConfidence` (the chunks are still returned) and the action prepends a note
 * telling the model the matches are weak and to say so instead of guessing.
 * Emptying the context instead backfires: with no context the model answers
 * from general knowledge, confidently. Over-marking is the safe direction, so the
 * bar sits just under the weakest retrieval that answers well (placeholders on a
 * non-English page, 0.62) and above the marginal-wrong promo-price one (0.50).
 */
export const TRUST_BAR = 0.6;

export class LocalKnowledgeRetriever {
    constructor(chunks = [], { complementary = false, trust = complementary ? TRUST_BAR : 0, floor = COMPLEMENT_FLOOR, minGain = COMPLEMENT_MIN_GAIN } = {}) {
        this.complementary = complementary;
        this.trust = trust;
        this.floor = floor;
        this.minGain = minGain;
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

    /**
     * Greedy cover: repeatedly take the chunk that adds the most not-yet-covered
     * query weight (rank breaks ties), until the union reaches minScore or no
     * candidate adds minGain. With no v1 hits the union must reach minScore or
     * nothing is returned, so off-corpus queries still inject nothing. With v1
     * hits as the seed they are kept as they are and only extended.
     */
    #complementarySet(queryTerms, scored, topK, minScore, seed) {
        const weights = new Map(queryTerms.map((term) => [term, this.#idf(term)]));
        const total = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
        const covered = new Set();
        const cover = (hit) => queryTerms.filter((term) => hit.chunk.termFrequency.has(term)).forEach((term) => covered.add(term));
        const picked = [...seed];
        picked.forEach(cover);
        const candidates = seed.length ? scored : scored.filter((hit) => hit.coverage >= this.floor);
        while (picked.length < topK) {
            let best = null;
            for (const hit of candidates) {
                if (picked.includes(hit)) continue;
                const gain = queryTerms.filter((term) => !covered.has(term) && hit.chunk.termFrequency.has(term)).reduce((sum, term) => sum + weights.get(term), 0) / total;
                if (gain >= this.minGain && (!best || gain > best.gain || (gain === best.gain && hit.rank > best.hit.rank))) best = { hit, gain };
            }
            if (!best) break;
            picked.push(best.hit);
            cover(best.hit);
        }
        if (seed.length) return picked;
        const unionCoverage = queryTerms.filter((term) => covered.has(term)).reduce((sum, term) => sum + weights.get(term), 0) / total;
        return unionCoverage >= minScore ? picked : [];
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

        const scored = this.chunks.map((chunk) => ({ chunk, ...this.#score(queryTerms, chunk) }));
        let hits = scored
            .filter((hit) => hit.coverage >= minScore)
            .sort((first, second) => second.rank - first.rank)
            .slice(0, topK);
        if (this.complementary) hits = this.#complementarySet(queryTerms, scored, topK, minScore, hits);

        if (hits.length === 0) {
            return { context: '', sources: [] };
        }
        const lowConfidence = Math.max(...hits.map((hit) => hit.coverage)) < this.trust;

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
        return { context, sources, lowConfidence };
    }
}
