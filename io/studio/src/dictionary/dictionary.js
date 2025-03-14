const { Ims } = require('@adobe/aio-lib-ims');

const DICTIONARY_ID_PATH = 'dictionary/index';
const {
    MAS_ROOT,
    FRAGMENT_AUTHOR_URL_PREFIX,
    PATH_TOKENS,
} = require('../fragment/paths');

const authorize = async (__ow_headers) => {
    const authHeader = __ow_headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const imsValidation = await new Ims('prod').validateToken(token);
            if (imsValidation.valid) {
                return token;
            }
        } catch (error) {
            console.error('IMS Token validation failed:', error);
        }
    }
    return null;
};

const extractValue = (field) => {
    const richText = field?.richTextValue?.values?.[0];
    if (richText) {
        return richText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    }
    return field?.values?.[0] || '';
};
const getDictionaryID = async (surface, locale, token) => {
    const dictionaryPath = `${FRAGMENT_AUTHOR_URL_PREFIX}?path=${MAS_ROOT}/${surface}/${locale}/${DICTIONARY_ID_PATH}`;
    const response = await fetch(dictionaryPath, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 200) {
        const { items } = await response.json();
        return items?.length === 1 ? items[0].id : null;
    }

    return null;
};

const extractSurfaceFromPath = (path) => {
    const match = path.match(PATH_TOKENS);
    if (!match?.groups?.surface) {
        return null;
    }
    return match.groups.surface;
};

const getDictionary = async (context) => {
    let { body, locale, token } = context;

    if (!token && context.__ow_headers) {
        token = await authorize(context.__ow_headers);
    }

    if (!token) {
        return {
            statusCode: 401,
            body: 'Unauthorized: Bearer token is missing or invalid',
        };
    }

    if (!body?.path) {
        return null;
    }

    const surface = extractSurfaceFromPath(body.path);
    if (!surface) {
        return null;
    }

    const dictionaryID = await getDictionaryID(surface, locale, token);
    if (!dictionaryID) {
        return null;
    }

    const dictionary = {};
    const dictionaryURL = `${FRAGMENT_AUTHOR_URL_PREFIX}/search?query=%7B"filter":%7B"path":"/content/dam/mas/${surface}/${locale}/dictionary"%7D%7D&limit=50`;

    const response = await fetch(dictionaryURL, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200) return null;

    const raw = await response.json();
    raw.items.forEach((item) => {
        const fields = item.fields;

        const keyField = fields.find((field) => field.name === 'key');
        const valueField = fields.find((field) => field.name === 'value');
        const richTextValueField = fields.find(
            (field) => field.name === 'richTextValue',
        );

        if (keyField?.values?.length) {
            const key = keyField.values[0];
            let value = extractValue(valueField);
            if (!value && richTextValueField) {
                value = extractValue(richTextValueField);
            }
            if (value) {
                dictionary[key] = value;
            }
        }
    });

    return dictionary;
};

async function main(params) {
    const { id, locale, __ow_headers } = params;
    if (!id) {
        return {
            statusCode: 400,
            body: 'Missing required parameter: id',
        };
    }

    const token = await authorize(__ow_headers);
    if (!token) {
        return {
            statusCode: 401,
            body: 'Unauthorized: Bearer token is missing or invalid',
        };
    }
    const fragmentPath = `${FRAGMENT_AUTHOR_URL_PREFIX}/${id}`;
    const response = await fetch(fragmentPath, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200) {
        return {
            statusCode: response.status,
            body: 'Failed to fetch fragment',
        };
    }

    const body = await response.json();
    const context = { body, locale, token };

    const dictionary = await getDictionary(context);
    if (!dictionary) {
        return {
            statusCode: 404,
            body: 'Dictionary not found or failed to retrieve entries',
        };
    }

    return {
        statusCode: 200,
        body: dictionary,
    };
}

module.exports = { main, getDictionary, extractSurfaceFromPath };
