const { PATH_TOKENS, odinPath } = require('./paths.js');
const { fetch, log } = require('./common.js');

/**
 * we expect a body to already have been fetched, and a locale to be requested.
 * This transformer name is a bit abusive: it just fetches a translation if the locale is different from the source locale.
 */
async function translate(context) {
    const { body, locale } = context;
    let translatedBody;
    const match = body?.path?.match(PATH_TOKENS);
    if (!match) {
        return {
            status: 400,
            message: 'source path is either not here or invalid',
        };
    }
    const { surface, parsedLocale, fragmentPath } = match.groups;
    if (locale && parsedLocale !== locale) {
        const translatedPath = odinPath(surface, locale, fragmentPath);
        const response = await fetch(translatedPath, context);
        if (response.status != 200) {
            return {
                status: 500,
                message: 'translation search failed',
            };
        }
        const root = await response.json();
        if (root?.items?.length == 1) {
            translatedBody = root.items[0];
            context.translatedId = translatedBody.id;
        } else {
            return {
                status: 404,
                message: 'no translation found',
            };
        }
    } else {
        log('no translation needed', context);
    }
    return {
        ...context,
        status: 200,
        body: translatedBody || body,
        surface,
        parsedLocale,
        fragmentPath,
    };
}

module.exports = {
    translate,
};
