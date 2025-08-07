/**
 * Fragment Client Library
 * A reusable client-side library for working with content fragments
 */

// Import the modules
import { logError } from './fragment/common.js';
import { corrector } from './fragment/corrector.js';
import { fetchFragment } from './fragment/fetch.js';
import { replace } from './fragment/replace.js';
import { settings } from './fragment/settings.js';
import { translate } from './fragment/translate.js';

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
    for (const transformer of [fetchFragment, translate, settings, replace, corrector]) {
        if (context.status != 200) {
            logError(context.message, context);
            break;
        }
        context.transformer = transformer.name;
        context = await transformer(context);
    }
    if (context.status != 200) {
        logError(context.message, context);
    }
    return context.body;
}

export { previewFragment };
