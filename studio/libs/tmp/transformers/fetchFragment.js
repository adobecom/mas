import { fetch } from '../utils/common.js';
import { getErrorContext } from '../utils/log.js';
import { PATH_TOKENS, odinReferences } from '../utils/paths.js';
const TRANSFORMER_NAME = 'fetchFragment';

async function init(initContext) {
    const { id, locale, fragmentsIds, preview } = initContext;
    if (id && locale) {
        //either we have a default locale id that we can fetch directly or we use the id
        const toFetchId = fragmentsIds?.['default-locale-id'] || id;
        const path = odinReferences(toFetchId, true, preview);
        const response = await fetch(path, initContext, 'fragment');
        if (response?.status != 200) {
            return await getErrorContext(response);
        }
        const match = response?.body?.path?.match(PATH_TOKENS);
        if (!match) {
            return {
                status: 400,
                message: 'source path is either not here or invalid',
            };
        }

        const { parsedLocale, surface, fragmentPath } = match.groups;
        return {
            ...initContext,
            status: 200,
            body: response.body,
            parsedLocale,
            surface,
            fragmentPath,
        };
    } else {
        return {
            status: 400,
            message: 'requested parameters id & locale are not present',
        };
    }
}

async function fetchFragment(context) {
    const response = await context.promises?.[TRANSFORMER_NAME];
    if (response?.status !== 200) {
        return response;
    }
    return {
        ...context,
        body: response?.body,
    };
}

export const transformer = {
    init,
    name: TRANSFORMER_NAME,
    process: fetchFragment,
};
