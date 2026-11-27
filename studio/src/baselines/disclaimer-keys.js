import { BASELINE_SOURCE_LOCALE, ROOT_PATH } from '../constants.js';

const DISCLAIMER_KEY_PART = 'legal-disclaimer';
const DICTIONARY_LIMIT = 50;

/**
 * @typedef {{ key: string, status?: string }} DisclaimerKey - placeholder key & status of its dictionary entry
 */

const keyParts = (key) => key.toLowerCase().split(/[^a-z0-9]+/);

/**
 * Placeholder keys of the en_US dictionary of a surface, sorted. Does not touch `Store.placeholders`.
 * @param {object} repository - mas-repository element
 * @param {string} surface
 * @param {AbortController} [abortController]
 * @returns {Promise<DisclaimerKey[]>}
 */
export async function loadDisclaimerKeys(repository, surface, abortController) {
    const path = `${ROOT_PATH}/${surface}/${BASELINE_SOURCE_LOCALE}/dictionary`;
    const fragments = await repository.searchFragmentList({ path }, DICTIONARY_LIMIT, abortController);
    return fragments
        .filter((fragment) => !fragment.path.endsWith('/index'))
        .map((fragment) => ({
            key: fragment.fields.find(({ name }) => name === 'key')?.values?.[0],
            status: fragment.status,
        }))
        .filter(({ key }) => key)
        .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Default disclaimer key of a plan: the shortest key containing "legal-disclaimer" and the plan code as a key part,
 * e.g. "cc-pricing-legal-disclaimer-abm" for ABM; '' when none matches.
 * @param {DisclaimerKey[]} keys
 * @param {string} plan
 * @returns {string}
 */
export function findDisclaimerKey(keys, plan) {
    const [match] = keys
        .map(({ key }) => key)
        .filter((key) => key.toLowerCase().includes(DISCLAIMER_KEY_PART) && keyParts(key).includes(plan))
        .sort((a, b) => a.length - b.length || a.localeCompare(b));
    return match ?? '';
}

/**
 * Keys containing the typed text, case insensitive; all keys for an empty text.
 * @param {DisclaimerKey[]} keys
 * @param {string} text
 * @returns {DisclaimerKey[]}
 */
export function filterDisclaimerKeys(keys, text) {
    const query = text.trim().toLowerCase();
    if (!query) return keys;
    return keys.filter(({ key }) => key.toLowerCase().includes(query));
}
