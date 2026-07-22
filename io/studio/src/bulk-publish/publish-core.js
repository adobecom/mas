const { publishChunk } = require('./publisher.js');
const { fetchFragmentByPath, processBatchWithConcurrency } = require('../common.js');

const MAX_CHUNK_SIZE = 50;
const LOCALE_REGEX = /^\/content\/dam\/mas\/[\w-_]+\/(?<locale>[\w-_]+)\//;
const STATUS = { PUBLISHED: 'published', SKIPPED: 'skipped', FAILED: 'failed' };
const DICTIONARY_SEGMENT = '/dictionary/';
const INDEX_SUFFIX = `${DICTIONARY_SEGMENT}index`;
const FRAGMENT_STATUS_PUBLISHED = 'PUBLISHED';
const INDEX_STATUS_CONCURRENCY = 5;

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

async function publishOneChunk({ locale, paths }, odinEndpoint, authToken, logger, publishOptions = {}) {
    logger.info(JSON.stringify({ event: 'chunk-start', locale, size: paths.length }));
    const results = await publishChunk({ chunk: paths, odinEndpoint, authToken, logger, ...publishOptions });
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

function deriveIndexPaths(details) {
    const publishedPaths = new Set();
    for (const detail of details) {
        if (detail.status === STATUS.PUBLISHED) publishedPaths.add(detail.path);
    }
    const indexPaths = new Set();
    for (const path of publishedPaths) {
        const segmentIndex = path.indexOf(DICTIONARY_SEGMENT);
        if (segmentIndex === -1 || path.endsWith(INDEX_SUFFIX)) continue;
        const indexPath = path.slice(0, segmentIndex) + INDEX_SUFFIX;
        if (!publishedPaths.has(indexPath)) indexPaths.add(indexPath);
    }
    return Array.from(indexPaths);
}

async function partitionIndexesByPublishState(indexPaths, odinEndpoint, authToken) {
    const checks = await processBatchWithConcurrency(indexPaths, INDEX_STATUS_CONCURRENCY, async (path) => {
        const { fragment } = await fetchFragmentByPath(odinEndpoint, path, authToken);
        return { path, alreadyPublished: fragment?.status === FRAGMENT_STATUS_PUBLISHED };
    });
    const toPublish = [];
    const skipped = [];
    for (const { path, alreadyPublished } of checks) {
        if (alreadyPublished) skipped.push({ path, status: STATUS.SKIPPED, reason: 'already-published' });
        else toPublish.push(path);
    }
    return { toPublish, skipped };
}

async function publishDictionaryIndexes(details, odinEndpoint, authToken, logger) {
    const indexPaths = deriveIndexPaths(details);
    if (!indexPaths.length) return [];
    const { toPublish, skipped } = await partitionIndexesByPublishState(indexPaths, odinEndpoint, authToken);
    logger.info(JSON.stringify({ event: 'index-publish-start', total: indexPaths.length, skipped: skipped.length }));
    if (!toPublish.length) return skipped;
    const indexDetails = [...skipped];
    for (const chunk of groupAndChunk(toPublish, MAX_CHUNK_SIZE)) {
        const results = await publishOneChunk(chunk, odinEndpoint, authToken, logger, { filterReferencesByStatus: [] });
        indexDetails.push(...results);
    }
    return indexDetails;
}

module.exports = { publishResolved, publishDictionaryIndexes, extractLocale, groupAndChunk, STATUS, MAX_CHUNK_SIZE };
