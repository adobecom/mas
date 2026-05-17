import { fetch } from '../utils/common.js';
import { getErrorContext } from '../utils/log.js';
import { PATH_TOKENS, odinReferences } from '../utils/paths.js';

const TRANSFORMER_NAME = 'fetchFragment';

/**
 * First fragment fetch + path parse only. Resolves as soon as surface / parsedLocale / fragmentPath / body are known,
 * without waiting on default-locale variation fetch. Shared via `promises.requestInfos` so dictionary/settings inits
 * can proceed in parallel with that work.
 */
async function fetchRequestInfosPhase1(initContext) {
    const { id, locale, fragmentsIds, preview } = initContext;
    if (!(id && locale)) {
        return { status: 400, message: 'requested parameters id & locale are not present' };
    }
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
        status: 200,
        body: response.body,
        parsedLocale,
        surface,
        fragmentPath,
    };
}

/**
 * Phase 1 only: first fragment fetch + path parse. Result is `promises.fetchFragment` (and `promises.requestInfos`).
 * Default-language variation + region locale run in the `defaultLanguage` transformer (before promotions).
 */
function init(initContext) {
    const { promises } = initContext;
    const phase1Promise = fetchRequestInfosPhase1(initContext);
    if (promises) {
        promises.requestInfos = phase1Promise;
    }
    return phase1Promise;
}

async function fetchFragment(context) {
    const response = await context.promises?.[TRANSFORMER_NAME];
    if (response?.status !== 200) {
        return response;
    }
    return {
        ...context,
        body: response.body,
        parsedLocale: response.parsedLocale,
        surface: response.surface,
        fragmentPath: response.fragmentPath,
    };
}

export const transformer = {
    init,
    name: TRANSFORMER_NAME,
    process: fetchFragment,
};
