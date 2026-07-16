import { getRequestInfos } from '../utils/common.js';
import { logDebug } from '../utils/log.js';
const DATA_EXTRA_OPTIONS_REGEX = /data-extra-options="(\{[^}]*\})"/g;
const INLINE_PRICE_TAG_REGEX = /<(?<tag>[a-zA-Z][\w-]*)\b[^>]*\bdata-wcs-osi="(?<osi>[^"]+)"[^>]*>/g;
const OWN_PROMO_REGEX = /\bdata-promotion-code="[^"]+"/;
const PROMO_CODE_REGEX = /\bdata-promotion-code="(?<code>[^"]+)"/;

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
 * Copies a promo code onto same-osi inline-price tags that are missing one
 * @param {string} fieldValue - The field value to fix
 * @returns {string} - The fixed field value
 */
export function injectPromoCodeInValue(fieldValue) {
    if (typeof fieldValue !== 'string') return fieldValue;
    const tags = [...fieldValue.matchAll(INLINE_PRICE_TAG_REGEX)];
    if (tags.length === 0) return fieldValue;
    const osiToCode = {};
    for (const match of tags) {
        const { osi } = match.groups;
        const codeMatch = match[0].match(PROMO_CODE_REGEX);
        if (codeMatch && !(osi in osiToCode)) {
            osiToCode[osi] = codeMatch.groups.code;
        }
    }
    let result = '';
    let lastIndex = 0;
    for (const match of tags) {
        const { osi, tag } = match.groups;
        const start = match.index;
        const original = match[0];
        result += fieldValue.slice(lastIndex, start);
        lastIndex = start + original.length;
        const code = osiToCode[osi];
        if (code && !OWN_PROMO_REGEX.test(original)) {
            const isMatch = original.match(/^<[a-zA-Z][\w-]*\s+is="[^"]*"/);
            const insertAt = isMatch ? isMatch[0].length : `<${tag}`.length;
            result += `${original.slice(0, insertAt)} data-promotion-code="${code}"${original.slice(insertAt)}`;
        } else {
            result += original;
        }
    }
    result += fieldValue.slice(lastIndex);
    return result;
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
    return context;
}

export const transformer = {
    name: 'corrector',
    process: corrector,
};
