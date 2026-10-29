// Client-side mirror of how MAS IO merges a variation onto its parent card.
// Mirrors `_deepMerge` in io/www/src/fragment/transformers/customize.js and
// the sentinel handling in io/www/src/fragment/utils/explicit-empty.js.
(() => {
    const EXPLICIT_EMPTY_SENTINEL = '<explicit_empty/>';
    const INTERNAL_FIELDS = ['variations', 'pznTags', 'tags', 'compatVersion'];
    const ARRAYS_TO_MERGE = { 'compare-chart-column': ['features'] };

    function isCleared(value) {
        return value === '' || value === null || value === EXPLICIT_EMPTY_SENTINEL;
    }

    function fieldContribution(value) {
        if (value === undefined) return 'inherit';
        if (isCleared(value)) return 'cleared';
        if (Array.isArray(value)) {
            if (value.length === 0) return 'inherit';
            return value.every(isCleared) ? 'cleared' : 'set';
        }
        if (typeof value === 'object') {
            if ('value' in value) return fieldContribution(value.value);
            const keys = Object.keys(value).filter((key) => key !== 'mimeType');
            return keys.some((key) => fieldContribution(value[key]) !== 'inherit') ? 'set' : 'inherit';
        }
        return 'set';
    }

    // IO concatenates parent + child for these arrays even when the child only carries [''].
    function attributeFields(variationFields, { variant } = {}) {
        const mergedArrays = ARRAYS_TO_MERGE[variant] || [];
        return Object.keys(variationFields || {})
            .filter((field) => !INTERNAL_FIELDS.includes(field))
            .map((field) => {
                const contribution = fieldContribution(variationFields[field]);
                const combined = mergedArrays.includes(field) && contribution !== 'inherit';
                return { field, contribution: combined ? 'combined' : contribution };
            });
    }

    const MASMergeMirror = { fieldContribution, attributeFields, INTERNAL_FIELDS, EXPLICIT_EMPTY_SENTINEL };

    if (typeof self !== 'undefined') {
        self.MASMergeMirror = MASMergeMirror;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MASMergeMirror;
    }
})();
