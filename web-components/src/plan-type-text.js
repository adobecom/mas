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

/**
 * Last non-space character rendered immediately before `el` within its block
 * parent. Returns '' when nothing precedes it.
 */
export function precedingChar(el) {
    const range = document.createRange();
    range.setStart(el.parentNode, 0);
    range.setEndBefore(el);
    return range.toString().replace(/\s+$/, '').slice(-1);
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
 * Price-options provider for the {{plan-type-text}} token: renders the plan
 * type only, sourcing the OSI from the surrounding card/field, and cases the
 * label from the preceding copy (sentence-boundary).
 */
export function planTypeTextOptionsProvider(element, options) {
    if (element.dataset.placeholder === PLACEHOLDER_PLAN_TYPE_TEXT) {
        const osi = element.closest('merch-card, mas-field')?.osi;
        if (osi) {
            options.wcsOsi = osi;
            options.displayPlanType = true;
            options.displayPerUnit = false;
            options.displayTax = false;
            options.displayRecurrence = false;
            options.displayOldPrice = false;
            options.displayAnnual = false;
            options.forceTaxExclusive = false;
            options.displayDot = false;
            options.planTypeCase = planTypeCaseFor(element);
        }
    }
}
