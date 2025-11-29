import { getJsonFromState, mark, measureTiming } from './common.js';
import { log } from './log.js';
const getRequestMetadataKey = (context) => `req-${context.id}-${context.locale}`;

async function getRequestMetadata(context) {
    const requestKey = getRequestMetadataKey(context);
    const { json: cachedMetadata, str: cachedMetadataStr } = await getJsonFromState(requestKey, context);
    if (cachedMetadata) {
        log(`found cached metadata for ${requestKey} -> ${cachedMetadataStr}`, context);
        return cachedMetadata;
    }
    return null;
}

function extractContextFromMetadata(cachedMetadata) {
    if (!cachedMetadata) {
        return {};
    }
    const { fragmentsIds, surface, parsedLocale, fragmentPath } = cachedMetadata;
    return {
        fragmentsIds,
        surface,
        parsedLocale,
        fragmentPath,
    };
}

async function storeRequestMetadata(context, metadata, hash) {
    // Calculate hash of response body
    const requestKey = getRequestMetadataKey(context);
    const updated = !metadata?.hash || metadata.hash !== hash;
    let lastModified = new Date(Date.now());
    if (updated || !metadata?.fragmentPath) {
        //we add fragment path to condition to ensure cache is updated
        const metadata = JSON.stringify({
            fragmentsIds: context.fragmentsIds,
            fragmentPath: context.fragmentPath,
            hash,
            lastModified: lastModified.toUTCString(),
            parsedLocale: context.parsedLocale,
            surface: context.surface,
        });
        log(`updating cache for ${requestKey} -> ${metadata}`, context);
        mark(context, 'req-state-put');
        await context.state.put(requestKey, metadata);
        measureTiming(context, 'req-state-put');
    } else if (metadata?.lastModified) {
        lastModified = new Date(metadata.lastModified);
    }
    return { lastModified, hash };
}

export { getRequestMetadata, extractContextFromMetadata, storeRequestMetadata };
