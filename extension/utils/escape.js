function escapeHtmlText(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtmlAttr(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const HTML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

// Rich-text fields such as cardTitle arrive as HTML; a label needs their text without the markup.
function plainText(html) {
    if (html === null || html === undefined) return '';
    return String(html)
        .replace(/<[^>]*>/g, '')
        .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity, name) => HTML_ENTITIES[name])
        .trim();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHtmlText, escapeHtmlAttr, plainText };
}

if (typeof window !== 'undefined') {
    window.MASEscape = { escapeHtmlText, escapeHtmlAttr, plainText };
}
