import { logDebug } from './common.js';
const DATA_EXTRA_OPTIONS_REGEX = /data-extra-options="(\{[^}]*\})"/g;

/**
 * Fixes data-extra-options attributes in all relevant fields for adobe-home surface
 * @param {object} context - Context object
 */
function fixAdobeHomeDataExtraOptions(context) {
    if (context.surface !== 'adobe-home') {
        return;
    }
    const ctasValue = context.body?.fields?.ctas?.value;
    if (ctasValue) {
        const fixedCtasValue = ctasValue.replace(DATA_EXTRA_OPTIONS_REGEX, (match, jsonContent) => {
            // Replace both \" and literal " with &quot; inside the JSON object
            const fixedJson = jsonContent.replace(/\\"/g, '&quot;').replace(/"/g, '&quot;');
            return `data-extra-options="${fixedJson}"`;
        });
        context.body.fields.ctas.value = fixedCtasValue;
    }
    logDebug(() => `Fixed data-extra-options attributes for adobe-home surface`, context);
}

/**
 * checking and eventually fixing content we know is not correct
 * @param {} context
 */
async function corrector(context) {
    const { priceLiterals } = context.body;
    for (const [key, value] of Object.entries(priceLiterals)) {
        if (typeof value === 'string' && /^(\{\{)?price-literal-/.test(value)) {
            logDebug(() => `no placeholder has been authored for ${key}`, context);
            delete context.body.priceLiterals[key];
        }
    }
    //fixAdobeHomeDataExtraOptions(context);
    return context;
}

export const transformer = {
    name: 'corrector',
    process: corrector,
};
