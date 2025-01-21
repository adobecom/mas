const fetch = require('node-fetch');

const PATH_TOKENS =
    /\/content\/dam\/mas\/(?<surface>[\w]+)\/(?<parsedLocale>[\w_]+)\/(?<fragmentPath>.*)/;

/**
 * we expect a body to already have been fetched, and a locale to be requested
 */
async function main({ status, message, body, locale }) {
    if (!status || status != 200 || !body || !locale) {
        return {
            status: 400,
            message:
                message || 'requested source is either not here or invalid',
        };
    }
    const match = body.path?.match(PATH_TOKENS);
    if (!match) {
        return {
            status: 400,
            message: 'source path is either not here or invalid',
        };
    }
    const { surface, parsedLocale, fragmentPath } = match.groups;
    if (parsedLocale !== locale) {
        const response = await fetch(
            `https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/${surface}/${locale}/${fragmentPath}`,
        );
        const root = await response.json();
        if (root?.items?.length == 1) {
            return {
                status: 200,
                body: root.items[0],
            };
        } else {
            return {
                status: 404,
                message: 'no translation found',
            };
        }
    }
    return {
        status: 200,
        body,
    };
}

exports.main = main;
