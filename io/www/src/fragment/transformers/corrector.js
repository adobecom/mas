import { getRequestInfos } from '../utils/common.js';
import { logDebug } from '../utils/log.js';
import { isCountdownLinkText } from '../../../../../web-components/src/countdown.js';
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

const ANCHOR_REGEX = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;

/**
 * Text content of an anchor, as a DOM `textContent` read would give it: the companion Milo
 * implementation matches the link that way, so formatting markup inside the link
 * (e.g. `<a href="#"><strong>countdown-timer</strong></a>`) must match here as well.
 * @param {string} innerHtml the anchor's inner html
 * @returns {string} text content
 */
function anchorText(innerHtml) {
    return innerHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ');
}

/** True when a rich-text field contains the fixed countdown sentinel link. */
export function hasCountdownTimerLink(fields) {
    if (!fields) return false;
    for (const field of Object.values(fields)) {
        // text/html fields arrive as { mimeType, value } objects (odinSchemaTransform).
        const value = typeof field === 'string' ? field : field?.value;
        if (typeof value !== 'string') continue;
        for (const [, innerHtml] of value.matchAll(ANCHOR_REGEX)) {
            if (isCountdownLinkText(anchorText(innerHtml))) return true;
        }
    }
    return false;
}

/** Fragments rendering a countdown-timer link: the body first, then its cards and collections, depth first. */
function findCountdownTimerFragments(fragment, referencesTree = [], references = {}) {
    const found = hasCountdownTimerLink(fragment?.fields) ? [fragment] : [];
    for (const reference of referencesTree) {
        if (reference.fieldName !== 'cards' && reference.fieldName !== 'collections') continue;
        const child = references[reference.identifier]?.value;
        if (!child) continue;
        found.push(...findCountdownTimerFragments(child, reference.referencesTree, references));
    }
    return found;
}

/** Dates of the promo project `fragment` carries, or null. A lone start or end is ignored. */
function timerDates(fragment, context) {
    const project = (context.promoProjects ?? []).find(({ label }) => label === fragment.promoProject)?.project;
    if (!project?.cdtStart || !project?.cdtEnd) return null;
    logDebug(() => `countdown timer dates taken from promo project ${project.id}`, context);
    return { cdtStart: project.cdtStart, cdtEnd: project.cdtEnd };
}

/**
 * Stamps `cdtStart` / `cdtEnd` from each timer fragment's own promo project (collection cards can differ).
 * The first timer fragment also stamps the root. Dates are computed first, then applied in one pass,
 * which also clears stale ones. Runs last so a timer link expanded by `replace` is seen.
 * @param {Object} context
 */
export function resolveCountdownTimer(context) {
    const { body } = context;
    const timers = findCountdownTimerFragments(body, body.referencesTree, body.references);
    const dates = new Map(timers.map((fragment) => [fragment, timerDates(fragment, context)]));
    if (timers.length) dates.set(body, dates.get(timers[0]));
    for (const fragment of [body, ...Object.values(body.references ?? {}).map(({ value }) => value)]) {
        const stamp = dates.get(fragment);
        if (stamp) Object.assign(fragment, stamp);
        else if (fragment) {
            delete fragment.cdtStart;
            delete fragment.cdtEnd;
        }
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
