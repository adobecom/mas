import { PLACEHOLDER_PLAN_TYPE_TEXT } from './constants.js';

const SENTENCE_TERMINATORS = ['.', '!', '?'];

// Injected in both hosts (merch-card and mas-field import this module): keep the
// marker inline within its copy, and keep it visible over the consumer's
// `span[is='inline-price'] { visibility: hidden }` guard. Higher specificity
// wins regardless of stylesheet order.
const PLAN_TYPE_TEXT_STYLES = `
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;

if (
    typeof document !== 'undefined' &&
    !document.querySelector('style[data-plan-type-text]')
) {
    const style = document.createElement('style');
    style.setAttribute('data-plan-type-text', '');
    style.textContent = PLAN_TYPE_TEXT_STYLES;
    document.head.append(style);
}

const BLOCK_ANCESTOR =
    'p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote';

/**
 * Last non-space character rendered before `el` within its nearest block
 * ancestor, so inline wrappers (`<em>…`) don't hide the preceding copy.
 * Returns '' when nothing precedes it.
 */
export function precedingChar(el) {
    const block = el.closest(BLOCK_ANCESTOR) ?? el.parentNode;
    const range = document.createRange();
    range.setStart(block, 0);
    range.setEndBefore(el);
    return range.toString().replace(/\s+$/, '').slice(-1);
}

/**
 * Resolves the OSI for a card/field: the promo price OSI (a real promotion,
 * not the `cancel-context` sentinel), else the regular price OSI, else the
 * fragment's own `osi` field. Prices nested in a `<merch-addon>` are ignored.
 */
export function hostOsi(host) {
    const prices = [
        ...host.querySelectorAll('[is="inline-price"][data-template="price"]'),
    ].filter((price) => !price.closest('merch-addon'));
    const promo = prices.find(
        (price) =>
            price.dataset.promotionCode &&
            price.dataset.promotionCode !== 'cancel-context',
    );
    return (
        (promo ?? prices[0])?.dataset.wcsOsi ??
        host.aemFragment?.data?.fields?.osi
    );
}

/**
 * Sentence-boundary casing for the token: 'upper' at a sentence start,
 * 'lower' mid-sentence.
 */
export function planTypeCaseFor(element) {
    const char = precedingChar(element);
    return !char || SENTENCE_TERMINATORS.includes(char) ? 'upper' : 'lower';
}

/**
 * Price-options provider for the {{plan-type-text}} token — supplies the two
 * runtime-only values: the OSI from the surrounding card/field and the
 * sentence-boundary casing from the preceding copy. Display flags are static
 * and carried by the marker's data attributes.
 */
export function planTypeTextOptionsProvider(element, options) {
    if (element.dataset.placeholder !== PLACEHOLDER_PLAN_TYPE_TEXT) return;
    const osi = element.closest('merch-card, mas-field')?.osi;
    if (!osi) return;
    options.wcsOsi = osi;
    options.planTypeCase = planTypeCaseFor(element);
}
