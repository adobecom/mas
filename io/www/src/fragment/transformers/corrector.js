import { getRequestInfos } from '../utils/common.js';
import { promoProjectLabel } from './customize.js';
import { logDebug } from '../utils/log.js';
const DATA_EXTRA_OPTIONS_REGEX = /data-extra-options="(\{[^}]*\})"/g;

const SURFACES_TO_CORRECT = ['adobe-home', 'sandbox', 'ccd'];

/**
 * Checks if the corrector should be applied for the given surface
 * @param {string} surface - Surface name
 * @returns {boolean} - True if corrector should be applied
 */
export function shouldApplyCorrector(surface) {
    if (!surface) return false;
    const normalizedSurface = surface.toLowerCase();
    return SURFACES_TO_CORRECT.includes(normalizedSurface);
}

/**
 * Fixes data-extra-options attributes in a field value
 * @param {string} fieldValue - The field value to fix
 * @returns {string} - The fixed field value
 */
export function fixDataExtraOptionsInValue(fieldValue) {
    let fixedValue = fieldValue.replace(/&quot;/g, '\"'); // normalize &quot; entities to proper format
    fixedValue = fixedValue.replace(DATA_EXTRA_OPTIONS_REGEX, (match, jsonContent) => {
        // Replace both \" and literal " with &quot; inside the JSON object
        const fixedJson = jsonContent.replace(/\\"/g, '&quot;').replace(/"/g, '&quot;');
        return `data-extra-options="${fixedJson}"`;
    });
    return fixedValue;
}

/**
 * Fixes data-extra-options attributes in all relevant fields
 * @param {object} context - Context object with body.fields structure
 */
export function fixFieldsDataExtraOptions(context) {
    const fieldsToFix = ['ctas', 'description', 'shortDescription'];

    for (const fieldName of fieldsToFix) {
        const field = context.body?.fields?.[fieldName];
        const fieldValue = typeof field === 'string' ? field : field?.value;

        if (fieldValue) {
            const fixedValue = fixDataExtraOptionsInValue(fieldValue);
            if (typeof field === 'string') {
                context.body.fields[fieldName] = fixedValue;
            } else {
                context.body.fields[fieldName].value = fixedValue;
            }
        }
    }
    logDebug(() => `Fixed data-extra-options attributes for adobe-home surface`, context);
}

/**
 * A countdown timer is authored as a link whose text is `countdown-timer` in any rich text field
 * (e.g. `<a href="...">countdown-timer</a>`).
 */
const COUNTDOWN_TIMER_LINK_TEXT = 'countdown-timer';
const ANCHOR_REGEX = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Text content of an anchor, as a DOM `textContent` read would give it: the companion Milo
 * implementation matches the link that way, so formatting markup inside the link
 * (e.g. `<a href="#"><strong>countdown-timer</strong></a>`) must match here as well.
 * @param {string} innerHtml the anchor's inner html
 * @returns {string} normalized, lower-cased text content
 */
function anchorText(innerHtml) {
    return innerHtml
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function hasCountdownTimerLink(fields) {
    if (!fields) return false;
    for (const field of Object.values(fields)) {
        // text/html fields arrive as { mimeType, value } objects (odinSchemaTransform).
        const value = typeof field === 'string' ? field : field?.value;
        if (typeof value !== 'string') continue;
        for (const [, innerHtml] of value.matchAll(ANCHOR_REGEX)) {
            if (anchorText(innerHtml) === COUNTDOWN_TIMER_LINK_TEXT) return true;
        }
    }
    return false;
}

/**
 * Finds the first fragment rendering a countdown-timer link: the main body first, then its
 * references in document order (depth first). Search stops at the first match.
 * @param {Object} fragment
 * @param {Array} referencesTree
 * @param {Object} references
 * @returns {Object|null} the fragment, or null when no countdown timer is authored
 */
function findCountdownTimerFragment(fragment, referencesTree = [], references = {}) {
    if (hasCountdownTimerLink(fragment?.fields)) return fragment;
    for (const reference of referencesTree) {
        if (reference.fieldName !== 'cards' && reference.fieldName !== 'collections') continue;
        const child = references[reference.identifier]?.value;
        if (!child) continue;
        const found = findCountdownTimerFragment(child, reference.referencesTree, references);
        if (found) return found;
    }
    return null;
}

/**
 * Surfaces `cdtStart` / `cdtEnd` on the final payload: the first fragment rendering a
 * countdown-timer link gives, via the promo project it carries, the timer dates. Resolved here,
 * at the end of the pipeline, so a timer link supplied by a dictionary placeholder (expanded by
 * `replace`, which runs after `customize`) is seen too. Both dates are required: a lone start or
 * end is meaningless and ignored.
 * @param {Object} context
 */
export function resolveCountdownTimer(context) {
    const { body } = context;
    const countdownTimerFragment = findCountdownTimerFragment(body, body.referencesTree, body.references);
    if (!countdownTimerFragment) return;
    const timerProject = (context.promoProjects ?? []).find(
        ({ project }) => promoProjectLabel(project) === countdownTimerFragment.promoProject,
    )?.project;
    if (timerProject?.cdtStart && timerProject?.cdtEnd) {
        logDebug(() => `countdown timer dates taken from promo project ${timerProject.id}`, context);
        body.cdtStart = timerProject.cdtStart;
        body.cdtEnd = timerProject.cdtEnd;
    }
}

/**
 * checking and eventually fixing content we know is not correct
 * @param {} context
 */
async function corrector(context) {
    const { priceLiterals } = context.body;
    const { surface } = await getRequestInfos(context);
    for (const [key, value] of Object.entries(priceLiterals)) {
        if (typeof value === 'string' && /^(\{\{)?price-literal-/.test(value)) {
            logDebug(() => `no placeholder has been authored for ${key}`, context);
            delete context.body.priceLiterals[key];
        }
    }
    if (shouldApplyCorrector(surface)) {
        fixFieldsDataExtraOptions(context);
    }
    resolveCountdownTimer(context);
    return context;
}

export const transformer = {
    name: 'corrector',
    process: corrector,
};
