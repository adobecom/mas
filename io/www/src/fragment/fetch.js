const { fetch, getErrorContext } = require('./common.js');
const { odinId } = require('./paths.js');
async function fetchFragment(context) {
    const { id, locale, translatedId } = context;
    if (id && locale) {
        const toFetchId = translatedId || id;
        const path = odinId(toFetchId);
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
