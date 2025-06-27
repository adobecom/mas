const { PATH_TOKENS, odinPath, odinReferences } = require('./paths.js');
const { fetch, log } = require('./common.js');

const LANGUAGE_DEFAULTS = ['en_US', 'fr_FR', 'de_DE', 'es_ES', 'it_IT', 'pt_BR', 'nl_NL'];

getCorrespondingLocale = (locale) => {
    const [language] = locale.split('_');
    for (const defaultLocale of LANGUAGE_DEFAULTS) {
        if (defaultLocale.startsWith(language)) {
            return defaultLocale;
        }
    }
    return locale;
};

/**
 * @returns a translated body for a given surface, fragment path and locale, calling path
 * api then id search api
 */
async function getTranslatedBody(surface, fragmentPath, locale, context) {
    const { preview } = context;
    const translatedPath = odinPath(surface, locale, fragmentPath, preview);
    const response = await fetch(translatedPath, context);
    if (response.status != 200) {
        return {
            status: 500,
            message: 'translation search failed',
        };
    }
    const {
        items: [{ id } = {}],
    } = response.body;
    if (id) {
        const translatedPath = odinReferences(id, true, preview);
        const response = await fetch(translatedPath, context);
        if (response.status != 200) {
            return {
                status: 500,
                message: 'translation search failed',
            };
        }
        return {
            status: 200,
            body: response.body,
        };
    } else {
        return {
            status: 404,
            message: 'no translation found',
        };
    }
}
/**
 * we expect a body to already have been fetched, and a locale to be requested.
 * This transformer name is a bit abusive: it just fetches a translation if the locale is different from the source locale.
 */
async function translate(context) {
    const { body, locale } = context;
    let translatedBody;
    let translatedStatus;
    let translatedMessage;
    let fallback = false;
    const match = body?.path?.match(PATH_TOKENS);
    if (!match) {
        return {
            status: 400,
            message: 'source path is either not here or invalid',
        };
    }
    const { surface, parsedLocale, fragmentPath } = match.groups;
    if (locale && parsedLocale !== locale) {
        const { body, status, message } = await getTranslatedBody(surface, fragmentPath, locale, context);
        translatedBody = body;
        translatedStatus = status;
        translatedMessage = message;
        if (translatedStatus === 404) {
            const defaultLocale = getCorrespondingLocale(locale);
            if (defaultLocale !== locale && defaultLocale !== parsedLocale) {
                fallback = true;
                log(`no translation found for ${locale}, trying default locale ${defaultLocale}`, context);
                const { body, status, message } = await getTranslatedBody(surface, fragmentPath, defaultLocale, context);
                translatedBody = body;
                translatedStatus = status;
                translatedMessage = message;
            }
        }
        if (translatedStatus !== 200) {
            log(`translation failed: ${translatedMessage}`, context);
            return {
                status: translatedStatus,
                message: translatedMessage,
            };
        }
    } else {
        log('no translation needed', context);
    }
    if (translatedStatus === 200 && translatedBody && !fallback) {
        // we return requested translated id, lets save correspondancy and save us one call next time
        context.translatedId = translatedBody.id;
    }
    return {
        ...context,
        status: translatedStatus || 200,
        body: translatedBody || body,
        surface,
        parsedLocale,
        fragmentPath,
    };
}

module.exports = {
    getCorrespondingLocale,
    translate,
};
