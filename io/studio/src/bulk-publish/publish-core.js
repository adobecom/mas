const { publishChunk } = require('./publisher.js');
const {
    fetchFragmentByPath,
    processBatchWithConcurrency,
    patchToOdin,
    fetchOdin,
    getValues,
    COLLECTION_MODEL_ID,
} = require('../common.js');

const STAGED_TAG = 'mas:studio/internal/staged';
const COLLECTION_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/collection';
const STAGED_CLEAR_CONCURRENCY = 5;
const STAGED_CLEAR_FAILED = 'staged-clear-failed';
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

function isCollection(fragment) {
    return fragment.model?.path === COLLECTION_MODEL_PATH || fragment.model?.id === COLLECTION_MODEL_ID;
}

async function clearCollectionStagedTag(fragment, odinEndpoint, authToken) {
    const tagIds = (fragment.tags || []).map((tag) => tag.id ?? tag);
    if (!tagIds.includes(STAGED_TAG)) return false;
    const remaining = tagIds.filter((tag) => tag !== STAGED_TAG);
    const uri = `/adobe/sites/cf/fragments/${fragment.id}/tags`;
    const current = await fetchOdin(odinEndpoint, uri, authToken);
    const etag = current.headers?.get('etag');
    if (remaining.length) {
        await fetchOdin(odinEndpoint, uri, authToken, { method: 'PUT', body: JSON.stringify({ tags: remaining }), etag });
    } else {
        await fetchOdin(odinEndpoint, uri, authToken, { method: 'DELETE', etag });
    }
    return true;
}

async function clearCardStagedTag(fragment, odinEndpoint, authToken) {
    const tags = getValues(fragment, 'tags');
    if (!tags?.values?.includes(STAGED_TAG)) return false;
    const value = tags.values.filter((tag) => tag !== STAGED_TAG);
    const { success, error } = await patchToOdin(
        odinEndpoint,
        fragment.id,
        authToken,
        [{ op: 'replace', path: `${tags.path}/values`, value }],
        fragment.etag,
    );
    if (!success) throw new Error(error);
    return true;
}

async function clearStagedTag(path, odinEndpoint, authToken) {
    const { fragment, status } = await fetchFragmentByPath(odinEndpoint, path, authToken);
    if (!fragment) throw new Error(`fetch ${status}`);
    return isCollection(fragment)
        ? clearCollectionStagedTag(fragment, odinEndpoint, authToken)
        : clearCardStagedTag(fragment, odinEndpoint, authToken);
}

/**
 * Removes the staged tag from every fragment that was published successfully. Runs after publishing so
 * a failed publish keeps its tag; a clearing failure is reported but never changes the publish outcome.
 * @returns {Promise<Array<{ path: string, reason: string, error: string }>>} clearing failures
 */
async function clearStagedTagsAfterPublish(details, odinEndpoint, authToken, logger) {
    const paths = details
        .filter((detail) => detail.status === STATUS.PUBLISHED && !detail.path.includes(DICTIONARY_SEGMENT))
        .map((detail) => detail.path);
    const results = await processBatchWithConcurrency(paths, STAGED_CLEAR_CONCURRENCY, async (path) => {
        try {
            return { path, cleared: await clearStagedTag(path, odinEndpoint, authToken) };
        } catch (error) {
            return { path, reason: STAGED_CLEAR_FAILED, error: error.message || String(error) };
        }
    });
    const failures = results.filter((r) => r.reason);
    const cleared = results.filter((r) => r.cleared).length;
    logger.info(JSON.stringify({ event: 'staged-clear', total: paths.length, cleared, failed: failures.length }));
    return failures;
}

module.exports = {
    publishResolved,
    publishDictionaryIndexes,
    clearStagedTagsAfterPublish,
    extractLocale,
    groupAndChunk,
    STATUS,
    MAX_CHUNK_SIZE,
};
