const { fetch, getErrorContext } = require('./common.js');
const { odinReferences } = require('./paths.js');
async function fetchFragment(context) {
    const { id, locale, translatedId, preview } = context;
    if (id && locale) {
        //either we have a translatedId that we can fetch directly or we use the id
        const toFetchId = translatedId || id;
        const path = odinReferences(toFetchId, true, preview);
        const response = await fetch(path, context);
        if (response.status == 200) {
            const body = await response.json();
            return {
                ...context,
                body,
            };
        }
        return getErrorContext(response);
    }
    return {
        ...context,
        status: 400,
        message: 'requested parameters are not present',
    };
}

exports.fetchFragment = fetchFragment;
