/**
 * Knowledge Service Client
 *
 * Client for the MAS Knowledge Service (io/knowledge).
 * Retrieves relevant knowledge chunks via semantic search for RAG.
 */

const DEFAULT_KNOWLEDGE_SERVICE_URL = 'https://14257-merchatscale-axel.adobeioruntime.net/api/v1/web/MerchAtScaleKnowledge';

export class KnowledgeClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || DEFAULT_KNOWLEDGE_SERVICE_URL;
    }

    /**
     * Query the knowledge service for relevant chunks
     * @param {string} queryText - User query
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Query results
     */
    async query(queryText, options = {}) {
        const { topK = 3, minScore = 0.7 } = options;

        const response = await fetch(`${this.baseUrl}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryText, topK, minScore }),
        });

        if (!response.ok) {
            throw new Error(`Knowledge query failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Query and format as context string for RAG
     * @param {string} queryText - User query
     * @param {Object} options - Query options
     * @returns {Promise<string>} - Formatted knowledge context
     */
    async queryAsContext(queryText, options = {}) {
        try {
            const data = await this.query(queryText, options);
            const results = data.body?.results || data.results || [];

            if (results.length === 0) {
                return '';
            }

            const contextParts = results.map((result) => {
                const header = result.metadata?.parentSection
                    ? `${result.metadata.parentSection} > ${result.metadata.section}`
                    : result.metadata?.section || 'Knowledge';

                return `### ${header}\n${result.text}`;
            });

            return `=== RELEVANT KNOWLEDGE ===\n\n${contextParts.join('\n\n---\n\n')}`;
        } catch (error) {
            console.warn('[KnowledgeClient] Failed to query:', error.message);
            return '';
        }
    }

    /**
     * Check if knowledge service is healthy
     * @returns {Promise<boolean>} - True if service is healthy
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/index-docs?action=health`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}
