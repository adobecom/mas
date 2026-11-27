import Store from '../store.js';
import { TAG_MERCH_CARD, TAG_MERCH_CARD_COLLECTION, TAG_MODEL_ID_MAPPING } from '../constants.js';
import { getFragmentByPathOrNull } from '../common/utils/fragment-api.js';
import { processConcurrently } from '../common/utils/item-loading.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { buildBaselineTags, createBaseline, filterExistingTags } from './baseline-model.js';
import { fieldValues, getTrialOsi } from './baseline-cards-model.js';

export const ITEM_STATUS = {
    PENDING: 'pending',
    CREATING: 'creating',
    CREATED: 'created',
    EXISTS: 'exists',
    CONFLICT: 'conflict',
    FAILED: 'failed',
    BLOCKED: 'blocked',
};

const LOOKUP_CONCURRENCY = 4;
export const NOT_CREATED = new Set([ITEM_STATUS.CONFLICT, ITEM_STATUS.FAILED, ITEM_STATUS.BLOCKED]);
const MODEL_IDS = {
    baseline: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
    card: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
    collection: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION],
};
const DISCLAIMER_KEY_PATTERN = /\{\{([^}]+)\}\}/;
const readField = (name) => (fragment) => fieldValues(fragment, name);
const readDisclaimerKey = (fragment) => {
    const [callout] = fieldValues(fragment, 'callout');
    return [callout?.match(DISCLAIMER_KEY_PATTERN)?.[1] ?? callout ?? ''];
};
const readTrialOsi = (fragment) => [getTrialOsi(fragment) ?? ''];

/**
 * Identity readers by item type: `[readFragment, readItem = readFragment]`, each returning values to compare.
 */
const IDENTITY_READERS = {
    baseline: [[readField('variant'), (item) => [item.template]]],
    card: [[readField('osi')], [readField('variant')], [readField('enableBaselines')], [readTrialOsi], [readDisclaimerKey]],
    collection: [[readField('cards'), (item) => item.cards], [readField('enableBaselines')], [readField('label')]],
};

const readItemIdentity = (item) => IDENTITY_READERS[item.type].map(([read, readItem = read]) => readItem(item));

/**
 * What makes a fragment at an item path the item's fragment, see `reuse`; changes when the item would create another
 * fragment.
 * @returns {string}
 */
export const getItemIdentity = (item) => JSON.stringify([item.type, readItemIdentity(item)]);

const isConflictError = (error) => error.message?.includes(': 409');

const sameValues = (values, expected) =>
    values.length === expected.length && expected.every((value, index) => values[index] === value);

/**
 * Reuses the fragment at an item path only when it is the one the item creates: same model, and same `variant` for a
 * baseline, `osi`, `variant`, `enableBaselines`, free trial OSI & disclaimer key (else static callout) for a card or `cards`,
 * `enableBaselines` & `label` for a collection. Any other fragment is a conflict, left untouched.
 * @returns {ItemResult}
 */
export const reuse = (item, fragment) => {
    const expected = readItemIdentity(item);
    const identical = IDENTITY_READERS[item.type].every(([read], index) => sameValues(read(fragment), expected[index]));
    if (fragment.model?.id === MODEL_IDS[item.type] && identical) {
        return { status: ITEM_STATUS.EXISTS, fragment };
    }
    return { status: ITEM_STATUS.CONFLICT, error: 'A different fragment already exists at its path.' };
};

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
 * @returns {Promise<ItemResult & { validTags?: string[] }>} `validTags`: taxonomy tags of a created baseline
 */
async function createItem(repository, item, folders) {
    if (item.type === 'baseline') {
        const { exists, fragment, tags } = await createBaseline(repository, item, { withToast: false });
        if (exists) return reuse(item, await getFragmentByPathOrNull(repository.aem.sites.cf.fragments, item.path));
        if (!fragment) throw new Error('Failed to create fragment.');
        return { status: ITEM_STATUS.CREATED, fragment, validTags: tags };
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
 * Creates an item, reusing the fragment at its path when AEM answers 409 and it is the item's fragment.
 * @returns {Promise<ItemResult>}
 */
async function createOrReuse(repository, item, folders) {
    try {
        return await createItem(repository, item, folders);
    } catch (error) {
        const fragment =
            isConflictError(error) &&
            (await getFragmentByPathOrNull(repository.aem.sites.cf.fragments, item.path).catch(() => null));
        return fragment ? reuse(item, fragment) : { status: ITEM_STATUS.FAILED, error: error.message };
    }
}

/**
 * Sets the tags saved on an item fragment, keeping the tags it carries, on it and on its store in `Store.baselines.list`.
 * @param {string[]} tagIds - tag ids saved
 */
function setSavedTags(fragment, tagIds) {
    const tags = tagIds.map((id) => fragment.tags?.find((tag) => normalizeTagId(tag) === id) ?? { id });
    fragment.tags = tags;
    const store = Store.baselines.list.data.get().find(({ id }) => id === fragment.id);
    if (!store) return;
    store.get().tags = tags;
    Store.baselines.list.data.notify();
}

/**
 * Saves the tags an item's fragment misses, as tags are saved after the fragment is created and that can fail: a
 * fragment created or reused without its tags fails the item. Baseline tags missing from the taxonomy (e.g. a PA code
 * with no tag) are skipped, as when a baseline is created from the Baselines page.
 * @param {ItemResult} result - result with the item fragment
 * @param {string[]} [validTags] - tags already checked against the taxonomy, saved as is
 * @returns {Promise<ItemResult>} `result` when the fragment had all its tags, a new result once its missing tags are saved
 */
async function ensureTags(repository, item, result, validTags) {
    if (!result.fragment) return result;
    try {
        const current = (result.fragment.tags ?? []).map(normalizeTagId);
        const expected = validTags ?? (item.type === 'baseline' ? buildBaselineTags(item) : (item.tags ?? []));
        const absent = expected.filter((tag) => !current.includes(normalizeTagId(tag)));
        if (!absent.length) return result;
        const tags = item.type === 'baseline' && !validTags ? await filterExistingTags(repository.aem.tags, absent) : absent;
        const missing = tags.map(normalizeTagId);
        if (!missing.length) return result;
        const saved = await repository.aem.saveValidTags(result.fragment.id, [...current, ...missing]);
        setSavedTags(result.fragment, saved);
        const unsaved = missing.filter((tag) => !saved.includes(tag));
        if (!unsaved.length) return { ...result };
        return {
            status: ITEM_STATUS.FAILED,
            fragment: result.fragment,
            error: `Tags could not be saved: ${unsaved.join(', ')}.`,
        };
    } catch (error) {
        return { status: ITEM_STATUS.FAILED, fragment: result.fragment, error: error.message };
    }
}

/**
 * Why an item cannot be created: the baseline of a card or a planned card of a collection was not created. Free cards
 * of a collection are existing fragments, not items.
 * @param {Map<string, ItemResult>} results
 * @returns {string | undefined}
 */
function findBlocker({ baseline, cards = [] }, results) {
    if (baseline && NOT_CREATED.has(results.get(baseline).status)) return 'Its baseline could not be created.';
    const missingCards = cards.filter((path) => NOT_CREATED.has(results.get(path)?.status));
    if (missingCards.length) return `${missingCards.length} of its cards could not be created.`;
}

/**
 * Creates the baselines, plan cards & collections of a plan one at a time, in plan order (baselines → cards →
 * collections). Existing items are reused, with the tags they miss saved, so running the same plan again only creates
 * what is missing; a different fragment at an item path is a `conflict`, left untouched. A failed item does not stop the
 * run; a card whose baseline, or a collection with a card, was not created is `blocked`, even when it exists.
 * @param {object} repository - mas-repository element
 * @param {object[]} items - `buildBaselineCardsPlan` items
 * @param {{ existing?: Map<string, object>, onStatus?: (item: object, result: ItemResult) => void, signal?: AbortSignal }}
 * [options] - `existing`: `findExistingItems` result; `onStatus` is called on every status change, first with `pending`,
 * `exists` or `conflict` for every item; once `signal` is aborted, no other item is started
 * @returns {Promise<Map<string, ItemResult>>} final result by item path
 */
export async function runBaselineCardsPlan(repository, items, { existing = new Map(), onStatus = () => {}, signal } = {}) {
    const results = new Map();
    const report = (item, result) => {
        results.set(item.path, result);
        onStatus(item, result);
    };
    for (const item of items) {
        const fragment = existing.get(item.path);
        report(item, fragment ? reuse(item, fragment) : { status: ITEM_STATUS.PENDING });
    }
    const folders = new Set();
    for (const item of items) {
        if (signal?.aborted) break;
        let result = results.get(item.path);
        if (result.status === ITEM_STATUS.CONFLICT) continue;
        const blockedBy = findBlocker(item, results);
        if (blockedBy) {
            report(item, { status: ITEM_STATUS.BLOCKED, error: blockedBy });
            continue;
        }
        let validTags;
        if (result.status !== ITEM_STATUS.EXISTS) {
            report(item, { status: ITEM_STATUS.CREATING });
            ({ validTags, ...result } = await createOrReuse(repository, item, folders));
        }
        const complete = await ensureTags(repository, item, result, validTags);
        if (complete !== results.get(item.path)) report(item, complete);
    }
    return results;
}
