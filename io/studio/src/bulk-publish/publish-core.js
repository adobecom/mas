const { publishChunk } = require('./publisher.js');

const MAX_CHUNK_SIZE = 50;
const LOCALE_REGEX = /^\/content\/dam\/mas\/[\w-_]+\/(?<locale>[\w-_]+)\//;
const STATUS = { PUBLISHED: 'published', SKIPPED: 'skipped', FAILED: 'failed' };

function extractLocale(path) {
    if (typeof path !== 'string') return 'unknown';
    const match = path.match(LOCALE_REGEX);
    return match?.groups?.locale || 'unknown';
}

function groupAndChunk(paths, maxChunkSize) {
    const groups = new Map();
    for (const path of paths) {
        const locale = extractLocale(path);
        const list = groups.get(locale);
        if (list) list.push(path);
        else groups.set(locale, [path]);
    }
    const chunks = [];
    for (const [locale, list] of groups) {
        for (let i = 0; i < list.length; i += maxChunkSize) {
            chunks.push({ locale, paths: list.slice(i, i + maxChunkSize) });
        }
    }
    return chunks;
}

async function publishOneChunk({ locale, paths }, odinEndpoint, authToken, logger) {
    logger.info(JSON.stringify({ event: 'chunk-start', locale, size: paths.length }));
    const results = await publishChunk({ chunk: paths, odinEndpoint, authToken, logger });
    const counts = results.reduce(
        (acc, r) => {
            if (r.status === STATUS.PUBLISHED) acc.published += 1;
            else if (r.status === STATUS.FAILED) acc.failed += 1;
            return acc;
        },
        { published: 0, failed: 0 },
    );
    logger.info(JSON.stringify({ event: 'chunk-result', locale, size: paths.length, ...counts }));
    return results;
}

async function publishResolved(resolved, odinEndpoint, authToken, logger) {
    const chunks = groupAndChunk(resolved, MAX_CHUNK_SIZE);
    logger.info(JSON.stringify({ event: 'resolved', total: resolved.length, chunks: chunks.length }));
    const details = [];
    for (const chunk of chunks) {
        const chunkResults = await publishOneChunk(chunk, odinEndpoint, authToken, logger);
        details.push(...chunkResults);
    }
    return details;
}

module.exports = { publishResolved, extractLocale, groupAndChunk, STATUS, MAX_CHUNK_SIZE };
