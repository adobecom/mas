/**
 * Fragment Client Library
 * A reusable client-side library for working with content fragments
 */

// Import the modules
import { logError } from '../../io/www/src/fragment/utils/log.js';
import { transformer as corrector } from '../../io/www/src/fragment/transformers/corrector.js';
import { transformer as fetchFragment } from '../../io/www/src/fragment/transformers/fetchFragment.js';
import { getDictionary, transformer as replace } from '../../io/www/src/fragment/transformers/replace.js';
import { transformer as settings } from '../../io/www/src/fragment/transformers/settings.js';
import { transformer as customize, LOCALE_DEFAULTS } from '../../io/www/src/fragment/transformers/customize.js';
import { transformer as promotions } from '../../io/www/src/fragment/transformers/promotions.js';

const PIPELINE = [fetchFragment, promotions, customize, settings, replace, corrector];

async function previewFragment(id, options) {
    const {
        locale = 'en_US',
        preview = {
            url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
        },
    } = options;
    let context = {
        id,
        status: 200,
        preview,
        requestId: 'preview',
        networkConfig: {
            mainTimeout: 15000,
            fetchTimeout: 10000,
            retries: 3,
        },
        api_key: 'n/a',
        locale,
    };
    const initPromises = {};
    context.fragmentsIds = context.fragmentsIds || {};
    for (const transformer of PIPELINE) {
        if (transformer.init) {
            //we fork context to avoid init to override any context property
            const initContext = {
                ...structuredClone(context),
                promises: initPromises,
                fragmentsIds: context.fragmentsIds,
            };
            initContext.loggedTransformer = `${transformer.name}-init`;
            initPromises[transformer.name] = transformer.init(initContext);
        }
    }
    context.promises = initPromises;
    for (const transformer of PIPELINE) {
        if (context.status != 200) {
            logError(context.message, context);
            break;
        }
        context.loggedTransformer = transformer.name;
        context = await transformer.process(context);
    }
    if (context.status != 200) {
        logError(context.message, context);
    }
    return context.body;
}

/* c8 ignore next 38 */
async function previewStudioFragment(body, options) {
    const {
        locale = 'en_US',
        preview = {
            url: 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments',
        },
        dictionary,
        ...rest
    } = options;
    let context = {
        body,
        status: 200,
        preview,
        requestId: 'preview',
        networkConfig: {
            mainTimeout: 15000,
            fetchTimeout: 10000,
            retries: 3,
        },
        api_key: 'n/a',
        locale,
        dictionary,
        hasExternalDictionary: Boolean(dictionary),
        ...rest,
    };
    for (const transformer of [settings, replace, corrector]) {
        if (context.status != 200) {
            logError(context.message, context);
            break;
        }
        context.transformer = transformer.name;
        context = await transformer.process(context);
    }
    if (context.status != 200) {
        logError(context.message, context);
    }
    return context.body;
}

export { previewFragment, previewStudioFragment, customize, settings, replace, getDictionary, corrector, LOCALE_DEFAULTS };
