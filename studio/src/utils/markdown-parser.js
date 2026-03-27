import MarkdownIt from '../../libs/markdown.js';

const md = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: true,
    typographer: true,
});

export function parseMarkdown(text) {
    if (!text) return '';
    return md.render(text);
}
