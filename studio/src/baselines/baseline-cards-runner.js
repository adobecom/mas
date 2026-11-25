import { TAG_MERCH_CARD, TAG_MERCH_CARD_COLLECTION, TAG_MODEL_ID_MAPPING } from '../constants.js';
import { getFragmentByPathOrNull } from '../common/utils/fragment-api.js';
import { processConcurrently } from '../common/utils/item-loading.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { buildBaselineTags, createBaseline } from './baseline-model.js';

export const ITEM_STATUS = {
    PENDING: 'pending',
    CREATING: 'creating',
    CREATED: 'created',
    EXISTS: 'exists',
    FAILED: 'failed',
    BLOCKED: 'blocked',
};

const LOOKUP_CONCURRENCY = 4;
const NOT_CREATED = new Set([ITEM_STATUS.FAILED, ITEM_STATUS.BLOCKED]);
const MODEL_IDS = {
    card: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
    collection: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION],
};

const isConflictError = (error) => error.message?.includes(': 409');

/**
 * @typedef {{ status: string, fragment?: object, error?: string }} ItemResult
 */

/**
 * Fragments already at the fixed path of plan items, looked up in parallel, at most 4 at a time.
 * @param {object} fragmentsApi - `aem.sites.cf.fragments`
 * @param {object[]} items - `buildBaselineCardsPlan` items
 * @returns {Promise<Map<string, object>>} existing fragments by item path
 */
export async function findExistingItems(fragmentsApi, items) {
    const fragments = await processConcurrently(
        items,
        ({ path }) => getFragmentByPathOrNull(fragmentsApi, path),
        LOOKUP_CONCURRENCY,
    );
    return new Map(items.flatMap(({ path }, index) => (fragments[index] ? [[path, fragments[index]]] : [])));
}

/**
 * Creates one item; baselines through `createBaseline`, which also prepares their folder and lists them in
 * `Store.baselines.list`. The folder of cards & collections is ensured once per run.
 * @param {Set<string>} folders - folders ensured during the run
 * @returns {Promise<ItemResult>}
 */
async function createItem(repository, item, folders) {
    if (item.type === 'baseline') {
        const { exists, fragment } = await createBaseline(repository, item, { withToast: false });
        if (exists) {
            return {
                status: ITEM_STATUS.EXISTS,
                fragment: await getFragmentByPathOrNull(repository.aem.sites.cf.fragments, item.path),
            };
        }
        if (!fragment) throw new Error('Failed to create fragment.');
        return { status: ITEM_STATUS.CREATED, fragment };
    }
    if (!folders.has(item.parentPath)) {
        await repository.aem.sites.cf.fragments.ensureFolderExists(item.parentPath);
        folders.add(item.parentPath);
    }
    const { title, name, parentPath, fields, tags } = item;
    const fragment = await repository.createFragment(
        { modelId: MODEL_IDS[item.type], title, name, parentPath, fields, tags },
        false,
    );
    if (!fragment) throw new Error('Failed to create fragment.');
    return { status: ITEM_STATUS.CREATED, fragment };
}

/**
 * Creates an item, reusing the fragment at its path when AEM answers 409.
 * @returns {Promise<ItemResult>}
 */
async function createOrReuse(repository, item, folders) {
    try {
        return await createItem(repository, item, folders);
    } catch (error) {
        const fragment =
            isConflictError(error) &&
            (await getFragmentByPathOrNull(repository.aem.sites.cf.fragments, item.path).catch(() => null));
        return fragment ? { status: ITEM_STATUS.EXISTS, fragment } : { status: ITEM_STATUS.FAILED, error: error.message };
    }
}

/**
 * Saves the tags an item's fragment misses, as tags are saved after the fragment is created and that can fail: a
 * fragment created or reused without its tags fails the item.
 * @param {ItemResult} result - result with the item fragment
 * @returns {Promise<ItemResult>} `result` when the fragment has all its tags
 */
async function ensureTags(repository, item, result) {
    if (!result.fragment) return result;
    const current = (result.fragment.tags ?? []).map(normalizeTagId);
    const expected = (item.type === 'baseline' ? buildBaselineTags(item) : (item.tags ?? [])).map(normalizeTagId);
    const missing = expected.filter((tag) => !current.includes(tag));
    if (!missing.length) return result;
    try {
        await repository.aem.saveValidTags(result.fragment.id, [...current, ...missing]);
        return result;
    } catch (error) {
        return { status: ITEM_STATUS.FAILED, fragment: result.fragment, error: error.message };
    }
}

/**
 * Why an item cannot be created: the baseline of a card or a card of a collection was not created.
 * @param {Map<string, ItemResult>} results
 * @returns {string | undefined}
 */
function findBlocker({ baseline, cards = [] }, results) {
    if (baseline && NOT_CREATED.has(results.get(baseline).status)) return 'Its baseline could not be created.';
    const missingCards = cards.filter((path) => NOT_CREATED.has(results.get(path).status));
    if (missingCards.length) return `${missingCards.length} of its cards could not be created.`;
}

/**
 * Creates the baselines, plan cards & collections of a plan one at a time, in plan order (baselines → cards →
 * collections). Existing items are reused, with the tags they miss saved, so running the same plan again only creates
 * what is missing. A failed item does not stop the run; a card whose baseline, or a collection with a card, was not
 * created is `blocked`, even when it exists.
 * @param {object} repository - mas-repository element
 * @param {object[]} items - `buildBaselineCardsPlan` items
 * @param {{ existing?: Map<string, object>, onStatus?: (item: object, result: ItemResult) => void }} [options] -
 * `existing`: `findExistingItems` result; `onStatus` is called on every status change, first with `pending` or `exists`
 * for every item
 * @returns {Promise<Map<string, ItemResult>>} final result by item path
 */
export async function runBaselineCardsPlan(repository, items, { existing = new Map(), onStatus = () => {} } = {}) {
    const results = new Map();
    const report = (item, result) => {
        results.set(item.path, result);
        onStatus(item, result);
    };
    for (const item of items) {
        const fragment = existing.get(item.path);
        report(item, fragment ? { status: ITEM_STATUS.EXISTS, fragment } : { status: ITEM_STATUS.PENDING });
    }
    const folders = new Set();
    for (const item of items) {
        const blockedBy = findBlocker(item, results);
        if (blockedBy) {
            report(item, { status: ITEM_STATUS.BLOCKED, error: blockedBy });
            continue;
        }
        let result = results.get(item.path);
        if (result.status !== ITEM_STATUS.EXISTS) {
            report(item, { status: ITEM_STATUS.CREATING });
            result = await createOrReuse(repository, item, folders);
        }
        const complete = await ensureTags(repository, item, result);
        if (complete !== results.get(item.path)) report(item, complete);
    }
    return results;
}
