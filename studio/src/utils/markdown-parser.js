import MarkdownIt from '../../libs/markdown.js';

/** Chat links open in a new tab, so following one never navigates away from Studio. */
function openLinksInNewTab(instance) {
    instance.renderer.rules.link_open = (tokens, index, options, env, self) => {
        tokens[index].attrSet('target', '_blank');
        tokens[index].attrSet('rel', 'noopener noreferrer');
        return self.renderToken(tokens, index, options);
    };
    return instance;
}

/** Tables sit in a wrapper that scrolls sideways, so a wide table never widens the narrow chat drawer. */
function scrollTables(instance) {
    const { rules } = instance.renderer;
    rules.table_open = (tokens, index, options, env, self) =>
        `<div class="table-wrap">${self.renderToken(tokens, index, options)}`;
    rules.table_close = (tokens, index, options, env, self) => `${self.renderToken(tokens, index, options)}</div>\n`;
    return instance;
}

const markdown = (typographer) =>
    scrollTables(
        openLinksInNewTab(
            new MarkdownIt({
                html: false,
                breaks: true,
                linkify: true,
                typographer,
            }),
        ),
    );

const md = markdown(true);

/** MASA answers quote code and flags, which typographic quotes and dashes would change. */
const answerMd = markdown(false);

/** Plain text: everything is escaped and kept literal; only URLs become links and line breaks are kept. */
const plain = openLinksInNewTab(new MarkdownIt('zero', { breaks: true, linkify: true }).enable(['linkify', 'newline']));

const CACHE_MAX = 200;

function cachedRender(render) {
    const cache = new Map();
    return (text) => {
        if (!text) return '';
        const cached = cache.get(text);
        if (cached !== undefined) return cached;
        const rendered = render(text);
        if (cache.size >= CACHE_MAX) {
            cache.delete(cache.keys().next().value);
        }
        cache.set(text, rendered);
        return rendered;
    };
}

export const parseMarkdown = cachedRender((text) => md.render(text));

export const parseAnswerMarkdown = cachedRender((text) => answerMd.render(text));

export const linkifyText = cachedRender((text) => plain.render(text));
