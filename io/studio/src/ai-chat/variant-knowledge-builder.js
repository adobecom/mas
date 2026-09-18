/**
 * Variant Knowledge Builder
 *
 * Builds a RAG query for a variant's field details. The knowledge service
 * fills in slot/tag/size documentation from that query at retrieval time.
 */

/**
 * Build a RAG query for variant field details
 * @param {string} variantName - The variant to query
 * @returns {string} Query string optimized for RAG retrieval
 */
export function buildVariantRAGQuery(variantName) {
    return `${variantName} variant field mappings slots tags HTML structure`;
}
