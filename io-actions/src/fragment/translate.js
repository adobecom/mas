const fetch = require('node-fetch');
const { PATH_TOKENS, odinPath } = require('./paths.js');
/**
 * we expect a body to already have been fetched, and a locale to be requested
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
        try {
            const response = await fetch(translatedPath);
            const root = await response.json();
            if (root?.items?.length == 1) {
                translatedBody = root.items[0];
            } else {
                return {
                    status: 404,
                    message: 'no translation found',
                };
            }
        } catch (e) {
            console.error(`error fetching ${translatedPath}`, e);
        }
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

exports.translate = translate;
