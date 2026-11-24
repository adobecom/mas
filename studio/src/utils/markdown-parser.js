import MarkdownIt from '../../libs/markdown.js';

const md = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
    typographer: true,
});

const CACHE_MAX = 200;
const cache = new Map();

export function parseMarkdown(text) {
    if (!text) return '';
    const cached = cache.get(text);
    if (cached !== undefined) return cached;
    const rendered = md.render(text);
    if (cache.size >= CACHE_MAX) {
        cache.delete(cache.keys().next().value);
    }
    cache.set(text, rendered);
    return rendered;
}
