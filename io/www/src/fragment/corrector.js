const { logDebug } = require('./common.js');
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

    return context;
}

exports.corrector = corrector;
