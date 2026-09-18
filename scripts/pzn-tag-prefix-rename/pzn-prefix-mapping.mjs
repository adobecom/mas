/**
 * Pure mapping table and transform for the `pzn-` prefix rename of MAS Studio personalization
 * tags (MWPW-208044).
 *
 * The personalization tag dropdown lists the children of `mas:pzn/` (excluding the
 * `mas:pzn/country/<cc>` geo subtree — see `studio/src/common/utils/personalization-utils.js`).
 * Seven of those leaf tags are renamed to carry a `pzn-` prefix so they can no longer be confused
 * with the 2-letter country codes in the same pulldown (e.g. `dc` for "document cloud" vs. the
 * `DC` country code). Two new leaves are added. `general`, `site-pivot` and `logged-in` are
 * deliberately left alone, and the `country/` subtree is never touched.
 *
 * Independent of, and never imported by, `scripts/pzn-tags-locale-to-country/pzn-tag-mapping.mjs`
 * (the locale→country / umbrella-expansion migration) — separate tables, no shared state, so the
 * two migrations can never contend with each other.
 */

export const TAG_ROOT = '/content/cq:tags/mas/pzn';
export const PZN_TAG_ID_PREFIX = 'mas:pzn/';

/** Old leaf id → new `pzn-` prefixed leaf id. The seven renames the ticket asks for. */
export const PREFIX_RENAMES = {
    'mas:pzn/cart-abandoner': 'mas:pzn/pzn-cart-abandoner',
    'mas:pzn/cpro': 'mas:pzn/pzn-cpro',
    'mas:pzn/edu': 'mas:pzn/pzn-edu',
    'mas:pzn/entry': 'mas:pzn/pzn-entry',
    'mas:pzn/smb': 'mas:pzn/pzn-smb',
    'mas:pzn/new-visitor': 'mas:pzn/pzn-new-visitor',
    'mas:pzn/return-visitor': 'mas:pzn/pzn-return-visitor',
};

/** New leaf tags the ticket asks to add, with no rename source. */
export const ADDED_TAGS = ['mas:pzn/pzn-dc', 'mas:pzn/pzn-cc-lapsed'];

/** Leaf tags explicitly left unchanged by this migration. */
export const PRESERVED_TAGS = ['mas:pzn/general', 'mas:pzn/site-pivot', 'mas:pzn/logged-in'];

export const FLAGS = {
    TAG_MISSING: 'TAG_MISSING',
    TAG_DRIFT: 'TAG_DRIFT',
};

/** Flags that block unattended application. */
export const BLOCKING_FLAGS = [FLAGS.TAG_MISSING, FLAGS.TAG_DRIFT];

/** The only author hosts this migration is allowed to point at (prod, stage, QA). */
export const ALLOWED_AUTHOR_HOSTS = [
    'author-p22655-e59433.adobeaemcloud.com',
    'author-p22655-e59471.adobeaemcloud.com',
    'author-p22655-e155390.adobeaemcloud.com',
];

export const RULES = {
    PREFIX_RENAME: 'PREFIX_RENAME',
    NOOP: 'NOOP',
};

/** `mas:pzn/<leaf>` id → its `/content/cq:tags/mas/pzn/<leaf>` path, or undefined outside the pzn namespace. */
export function tagIdToPath(tagId) {
    if (typeof tagId !== 'string' || !tagId.startsWith(PZN_TAG_ID_PREFIX)) return undefined;
    return `${TAG_ROOT}/${tagId.slice(PZN_TAG_ID_PREFIX.length)}`;
}

/** `/content/cq:tags/mas/pzn/<leaf>` path → its `mas:pzn/<leaf>` id, or undefined outside the pzn namespace. */
export function pathToTagId(path) {
    if (typeof path !== 'string' || !path.startsWith(`${TAG_ROOT}/`)) return undefined;
    return `${PZN_TAG_ID_PREFIX}${path.slice(TAG_ROOT.length + 1)}`;
}

const dedupe = (tags) => [...new Set(tags)];

/**
 * Idempotent set transform over a fragment's tag value array: rewrites each old leaf id in
 * `PREFIX_RENAMES` to its `pzn-` prefixed target. Every other tag — `general`/`site-pivot`/
 * `logged-in`, the `country/` subtree, and anything outside the `mas:pzn/` namespace — passes
 * through unchanged, since it is simply not a key in the rename table.
 *
 * @param {string[]} tags - current tag ids
 * @returns {{ tags: string[], mapped: {from: string, to: string}[], rule: string }}
 */
export function applyPrefixRename(tags) {
    const source = Array.isArray(tags) ? tags.filter(Boolean) : [];
    const mapped = [];

    const next = source.map((tag) => {
        const target = PREFIX_RENAMES[tag];
        if (!target) return tag;
        mapped.push({ from: tag, to: target });
        return target;
    });

    return { tags: dedupe(next), mapped, rule: mapped.length ? RULES.PREFIX_RENAME : RULES.NOOP };
}

/** Every tag id this migration requires to already exist in the taxonomy before it runs. */
export function requiredTargetTags() {
    return dedupe([...Object.values(PREFIX_RENAMES), ...ADDED_TAGS, ...PRESERVED_TAGS]).sort();
}
