import { PLACEHOLDER_PLAN_TYPE_TEXT } from './constants.js';

const SENTENCE_TERMINATORS = ['.', '!', '?'];

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
 * Price-options provider covering two opt-in behaviors on legal inline-prices:
 * - the {{plan-type-text}} token (`data-placeholder`) renders the plan type
 *   only, sourcing the OSI from the surrounding card/field;
 * - `data-legal-case` opts any legal price into sentence-boundary casing.
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
        }
    }
    if ('legalCase' in element.dataset) {
        options.planTypeCase = planTypeCaseFor(element);
    }
}
