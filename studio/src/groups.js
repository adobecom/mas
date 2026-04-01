import Store from './store.js';

const MAS_ADMIN_GROUP = 'GRP-ODIN-MAS-ADMINS';

/** Surface path segment → LDAP group required for Studio settings (non-admin). */
const SETTINGS_ACCESS_GROUP_BY_SURFACE = new Map([
    ['acom', 'GRP-ODIN-MAS-ACOM-POWERUSERS'],
    ['acom-cc', 'GRP-ODIN-MAS-ACOM-CC-POWERUSERS'],
    ['acom-dc', 'GRP-ODIN-MAS-ACOM-DC-POWERUSERS'],
    ['adobe-home', 'GRP-ODIN-MAS-AH-POWERUSERS'],
    ['ccd', 'GRP-ODIN-MAS-CCD-POWERUSERS'],
    ['express', 'GRP-ODIN-MAS-EXPRESS-POWERUSERS'],
]);

const ADMIN_ONLY_SETTINGS_SURFACES = new Set(['commerce', 'sandbox', 'nala']);

/**
 * @param {string} [surface]
 * @returns {string}
 */
function normalizeSurface(surface) {
    if (!surface) return '';
    return `${surface}`.split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
}

/**
 * @returns {string[]|null}
 */
function getCurrentUserNormalizedGroups() {
    const { email } = Store.profile.get();
    if (!email) return null;
    const user = Store.users.get().find((u) => u.userPrincipalName === email);
    if (!user) return null;
    return user.groups?.map((group) => group.toUpperCase()) ?? [];
}

/**
 * Whether the signed-in user is in the global MAS admins LDAP group.
 *
 * @returns {boolean}
 */
export function isMasAdmin() {
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return false;
    return groups.includes(MAS_ADMIN_GROUP.toUpperCase());
}

/**
 * Whether the signed-in user may use Studio settings for the given repository surface (path).
 * Admins may access any surface; commerce, sandbox, and nala are admin-only until per-surface groups exist.
 *
 * @param {string} [surface] - `Store.surface()` / `path` (e.g. `acom`, `sandbox`)
 * @returns {boolean}
 */
export function canAccessSettings(surface) {
    if (isMasAdmin()) return true;
    const key = normalizeSurface(surface);
    if (!key) return false;
    if (ADMIN_ONLY_SETTINGS_SURFACES.has(key)) return false;
    const requiredGroup = SETTINGS_ACCESS_GROUP_BY_SURFACE.get(key);
    if (!requiredGroup) return false;
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return false;
    return groups.includes(requiredGroup.toUpperCase());
}
