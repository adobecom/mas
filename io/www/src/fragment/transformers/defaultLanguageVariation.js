import { computeRegionLocale, getDefaultLanguageVariation } from './fetchFragment.js';

const TRANSFORMER_NAME = 'defaultLanguageVariation';

/**
 * Runs after `fetchFragment` init. Awaits `promises.fetchFragment` (phase 1), then default-language variation +
 * `computeRegionLocale`. Result is `promises.defaultLanguageVariation`.
 */
async function init(initContext) {
    const early = await initContext.promises?.fetchFragment;
    if (!early) {
        return { status: 400, message: 'fetchFragment init not available' };
    }
    if (early.status !== 200) {
        return early;
    }
    const { body: earlyBody, parsedLocale, surface, fragmentPath } = early;
    let context = { ...initContext, body: earlyBody, parsedLocale, surface, fragmentPath };
    const variationResult = await getDefaultLanguageVariation(context);
    /* c8 ignore next 3 — default-locale fetch errors covered via pipeline / customize tests */
    if (variationResult.status != 200) {
        return variationResult;
    }
    context = { ...context, body: variationResult.body };
    const defaultLocale = context.defaultLocale;
    const regionLocale = computeRegionLocale({ ...context, defaultLocale });
    return {
        ...initContext,
        status: 200,
        body: variationResult.body,
        parsedLocale,
        surface,
        fragmentPath,
        defaultLocale,
        locale: regionLocale,
        regionLocale,
    };
}

async function defaultLanguageVariation(context) {
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
        defaultLocale: response.defaultLocale,
        locale: response.locale,
        regionLocale: response.regionLocale,
    };
}

export const transformer = {
    name: TRANSFORMER_NAME,
    init,
    process: defaultLanguageVariation,
};
