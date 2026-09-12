/**
 * Returns `desiredTitle` unchanged if it isn't in `existingTitles`, otherwise the
 * lowest-numbered free `${desiredTitle}-${n}` (n starting at 1, gaps filled, no
 * zero padding). Comparison is an exact string match; the input is never trimmed
 * or normalized.
 * @param {string} desiredTitle
 * @param {string[]} existingTitles
 * @returns {string}
 */
export function computeUniqueTitle(desiredTitle, existingTitles) {
    if (!existingTitles.includes(desiredTitle)) return desiredTitle;
    let n = 1;
    while (existingTitles.includes(`${desiredTitle}-${n}`)) n++;
    return `${desiredTitle}-${n}`;
}

/**
 * Scope key for title-uniqueness comparisons: the AEM folder containing the card,
 * i.e. `fragment.path` with the fragment's own name segment removed. This is the
 * same folder new siblings (created or cloned) are saved into.
 * @param {{ path?: string }} fragment
 * @returns {string|null}
 */
export function getFragmentTitleScope(fragment) {
    const path = fragment?.path;
    if (!path) return null;
    return path.split('/').slice(0, -1).join('/');
}
