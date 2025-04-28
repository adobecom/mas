/**
 * Fragment Client Library
 * A reusable client-side library for working with content fragments
 */

// Import the modules
import { fetchFragment } from './fragment/fetch.js';
import { replace } from './fragment/replace.js';
import { settings } from './fragment/settings.js';
import { logError } from './fragment/common.js';

export async function previewFragment(id, options) {
    const {
        surface,
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
        api_key: 'n/a',
        translatedId: id,
        //caching need path API to work on preview
        dictionaryId: {
            acom: '412fda08-7b73-4a01-a04f-1953e183bad2',
            sandbox: '4218bdb3-8d25-4706-974d-21b1f0f13aa9',
            nala: '1cdf7301-3d14-46e6-8ee8-0f06841ad5af',
        }[surface],
        locale,
    };
    for (const transformer of [fetchFragment, settings, replace]) {
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
