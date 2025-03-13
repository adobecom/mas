const { PATH_TOKENS, odinPath } = require('./paths.js');
const { fetch, log } = require('./common.js');

const NO_TRANSLATION_FOUND = {
    status: 404,
    message: 'no translation found',
};

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
    if (!surface || !parsedLocale || !fragmentPath) {
        return {
            status: 400,
            message: 'source path is either not here or invalid',
        };
    }
    if (locale && parsedLocale !== locale) {
        const translatedPath = odinPath(surface, locale, fragmentPath);
        const response = await fetch(translatedPath, context);
        if (response.status != 200) {
            return NO_TRANSLATION_FOUND;
        }
        const root = await response.json();
        if (root?.items?.length == 1) {
            translatedBody = root.items[0];
        } else {
            return NO_TRANSLATION_FOUND;
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
