/**
 * Fragment Client Library
 * A reusable client-side library for working with content fragments
 */

// Import the modules
import { logError } from './fragment/common.js';
import { transformer as corrector } from './fragment/corrector.js';
import { transformer as fetchFragment } from './fragment/fetch.js';
import { transformer as replace } from './fragment/replace.js';
import { transformer as settings } from './fragment/settings.js';
import { transformer as translate } from './fragment/translate.js';

const PIPELINE = [fetchFragment, translate, settings, replace, corrector];

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

    for (const transformer of PIPELINE) {
        if (transformer.init) {
            context.loggedTransformer = `${transformer.name}-init`;
            context.promises = context.promises || {};
            context.promises[transformer.name] = transformer.init(context);
        }
    }
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

export { previewFragment };
