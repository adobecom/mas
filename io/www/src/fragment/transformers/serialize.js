import { parseFragment } from 'parse5';
import { CARD_MODEL_ID } from '../utils/common.js';
import { log, logError } from '../utils/log.js';

/**
 * MWPW-214943: text-bearing fields are parsed once into a sanitized tree, in the Odin (AEM GraphQL) multi-line `json`
 * format, which is then emitted in the requested `type`: `json` as is, `html` re-serialized, `text` flattened.
 * Fields are explicitly listed per model (rich text `text/html` fields of the model), `ctas` excepted: checkout links
 * are not rich text.
 */
const RICH_TEXT_FIELDS = {
    [CARD_MODEL_ID]: ['badge', 'trialBadge', 'prices', 'shortDescription', 'description', 'callout', 'customFields'],
};

const BLOCKS = {
    p: 'paragraph',
    ul: 'unordered-list',
    ol: 'ordered-list',
    li: 'list-item',
    h1: 'header',
    h2: 'header',
    h3: 'header',
    h4: 'header',
    h5: 'header',
    h6: 'header',
};
const VARIANTS = {
    strong: 'bold',
    b: 'bold',
    em: 'italic',
    i: 'italic',
    u: 'underline',
    s: 'strikethrough',
    del: 'strikethrough',
};
const STRIKETHROUGH_CLASSES = ['price-strikethrough', 'price-promo-strikethrough'];
const UNWRAPPED = new Set(['span', 'div', 'sup', 'sub', 'small']);
// silently dropped with their content
const DROPPED = new Set(['script', 'style', 'iframe', 'template', 'object', 'embed', 'noscript', 'sr-only']);
// not rich text: dropped with their content, and reported
const REJECTED = new Set(['img', 'button', 'merch-icon', 'mas-mnemonic', 'checkout-button']);
const LINK_SCHEMES = /^(https:|mailto:|tel:)/i;

const attributesOf = (node) => Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));
const normalizeSpaces = (value) => value.replace(/[ \t\n\r\f]+/g, ' ');
const isInline = (node) => node.nodeType === 'text' || node.nodeType === 'link' || node.nodeType === 'line-break';

/** sanitized text of a node (rejected and hidden elements excluded) */
function textOf(node, report) {
    const nodes = [];
    for (const child of node.childNodes) visit(child, nodes, [], report);
    return nodes.map(({ value = '' }) => value).join('');
}

function pushText(container, value, variants) {
    const last = container.at(-1);
    const format = variants.length ? { variants: [...new Set(variants)] } : undefined;
    if (last?.nodeType === 'text' && JSON.stringify(last.format) === JSON.stringify(format)) {
        last.value += value;
        return;
    }
    container.push({ nodeType: 'text', value, ...(format && { format }) });
}

function visit(node, container, variants, report) {
    if (node.nodeName === '#text') return pushText(container, normalizeSpaces(node.value), variants);
    if (node.nodeName === '#comment') return;
    const tag = node.tagName;
    const attributes = attributesOf(node);
    const classes = (attributes.class ?? '').split(/\s+/);
    if (DROPPED.has(tag) || classes.includes('disabled')) return;
    if (REJECTED.has(tag) || attributes.is === 'checkout-link' || (tag === 'a' && attributes['data-wcs-osi'])) {
        return report(`rejected <${tag}${attributes.is ? ` is="${attributes.is}"` : ''}>`, true);
    }
    const children = (target, childVariants = variants) => {
        for (const child of node.childNodes) visit(child, target, childVariants, report);
    };
    if (BLOCKS[tag]) {
        const block = { nodeType: BLOCKS[tag], ...(BLOCKS[tag] === 'header' && { style: tag }), content: [] };
        children(block.content);
        container.push(block);
        return;
    }
    if (tag === 'br') return container.push({ nodeType: 'line-break' });
    if (VARIANTS[tag]) return children(container, [...variants, VARIANTS[tag]]);
    if (tag === 'a') {
        const href = attributes.href?.trim();
        if (!LINK_SCHEMES.test(href ?? '')) {
            report(`unwrapped link with href "${href}"`);
            return children(container);
        }
        const data = { href, ...(attributes.target === '_blank' && { target: '_blank' }) };
        return container.push({ nodeType: 'link', data, value: textOf(node, report).trim() });
    }
    if (!UNWRAPPED.has(tag)) report(`unwrapped unknown <${tag}>`);
    const strikethrough = STRIKETHROUGH_CLASSES.some((name) => classes.includes(name));
    return children(container, strikethrough ? [...variants, 'strikethrough'] : variants);
}

/** loose inline nodes at the root are grouped in paragraphs, blank ones dropped */
function groupRoot(nodes) {
    const root = [];
    let paragraph;
    for (const node of nodes) {
        if (!isInline(node)) {
            paragraph = undefined;
            root.push(node);
            continue;
        }
        if (!paragraph) {
            if (node.nodeType === 'text' && !node.value.trim()) continue;
            paragraph = { nodeType: 'paragraph', content: [] };
            root.push(paragraph);
        }
        paragraph.content.push(node);
    }
    return root;
}

/** trims the edges of the blocks' text, and drops the empty blocks */
function trimBlocks(nodes) {
    return nodes.filter((node) => {
        if (isInline(node)) return true;
        node.content = trimBlocks(node.content);
        // lists only hold list items
        if (node.nodeType.endsWith('-list')) node.content = node.content.filter((child) => !isInline(child));
        const inline = node.content.filter(isInline);
        if (inline[0]?.nodeType === 'text') inline[0].value = inline[0].value.trimStart();
        if (inline.at(-1)?.nodeType === 'text') inline.at(-1).value = inline.at(-1).value.trimEnd();
        node.content = node.content.filter((child) => child.nodeType !== 'text' || child.value);
        return node.content.length > 0;
    });
}

function toNodes(html, report) {
    const nodes = [];
    for (const child of parseFragment(html).childNodes) visit(child, nodes, [], report);
    return trimBlocks(groupRoot(nodes));
}

const escapeHtml = (value) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const HTML_VARIANTS = { bold: 'strong', italic: 'em', underline: 'u', strikethrough: 's' };
const HTML_BLOCKS = { paragraph: 'p', 'unordered-list': 'ul', 'ordered-list': 'ol', 'list-item': 'li' };

function toHtml(nodes) {
    return nodes
        .map((node) => {
            if (node.nodeType === 'text') {
                return (node.format?.variants ?? []).reduce(
                    (html, variant) => `<${HTML_VARIANTS[variant]}>${html}</${HTML_VARIANTS[variant]}>`,
                    escapeHtml(node.value),
                );
            }
            if (node.nodeType === 'line-break') return '<br>';
            if (node.nodeType === 'link') {
                const { href, target } = node.data;
                const targetAttributes = target ? ` target="${target}" rel="noopener noreferrer"` : '';
                return `<a href="${escapeHtml(href)}"${targetAttributes}>${escapeHtml(node.value)}</a>`;
            }
            const tag = node.style ?? HTML_BLOCKS[node.nodeType];
            return `<${tag}>${toHtml(node.content)}</${tag}>`;
        })
        .join('');
}

function toText(nodes) {
    return nodes
        .map((node) => {
            if (node.nodeType === 'line-break') return '\n';
            if (isInline(node)) return node.value;
            return `\n${toText(node.content)}\n`;
        })
        .join('');
}

const EMITTERS = {
    json: { format: (nodes) => nodes },
    html: { format: toHtml, mimeType: 'text/html' },
    text: {
        format: (nodes) =>
            toText(nodes)
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .join('\n'),
        mimeType: 'text/plain',
    },
};

function serializeField(field, { format, mimeType }, report) {
    const value = typeof field === 'string' || Array.isArray(field) ? field : (field.value ?? '');
    const serialized = Array.isArray(value)
        ? value.map((entry) => format(toNodes(entry, report)))
        : format(toNodes(value, report));
    return mimeType ? { value: serialized, mimeType } : { json: serialized };
}

async function serialize(context) {
    if (!context.type) return context;
    const emitter = EMITTERS[context.type];
    const fragments = new Set([context.body]);
    for (const reference of Object.values(context.body?.references ?? {})) {
        if (reference.value) fragments.add(reference.value);
    }
    for (const fragment of fragments) {
        for (const fieldName of RICH_TEXT_FIELDS[fragment.model?.id] ?? []) {
            if (fragment.fields?.[fieldName] === undefined) continue;
            const report = (message, isError) =>
                (isError ? logError : log)(`serialize ${fragment.id}.${fieldName}: ${message}`, context);
            fragment.fields[fieldName] = serializeField(fragment.fields[fieldName], emitter, report);
        }
    }
    return context;
}

export const transformer = { name: 'serialize', process: serialize };
