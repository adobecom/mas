import Store from './store.js';

const MAS_ADMIN_GROUP = 'GRP-ODIN-MAS-ADMINS';
const SURFACE_EDITOR_PREFIX = 'GRP-ODIN-MAS-';
const SURFACE_EDITOR_SUFFIX = '-EDITORS';

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

function normalizeSurface(surface) {
    if (!surface) return '';
    return `${surface}`.split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
}

function getCurrentUserNormalizedGroups() {
    const { email } = Store.profile.get();
    if (!email) return null;
    const user = Store.users.get().find((u) => u.userPrincipalName === email);
    if (!user) return null;
    return user.groups?.map((group) => group.toUpperCase()) ?? [];
}

export function isMasAdmin() {
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return false;
    return groups.includes(MAS_ADMIN_GROUP.toUpperCase());
}

export function canAccessSettings(surface) {
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return false;
    if (groups.includes(MAS_ADMIN_GROUP.toUpperCase())) return true;
    const key = normalizeSurface(surface);
    if (!key || ADMIN_ONLY_SETTINGS_SURFACES.has(key)) return false;
    const requiredGroup = SETTINGS_ACCESS_GROUP_BY_SURFACE.get(key);
    return !!requiredGroup && groups.includes(requiredGroup.toUpperCase());
}

/**
 * Returns the surfaces the current user has editor access to.
 * Extracts surface names from IAM groups matching GRP-ODIN-MAS-{SURFACE}-EDITORS.
 * Admins get access to all surfaces.
 *
 * @returns {string[]} Array of surface names (lowercase), e.g., ['acom', 'express']
 */
export function getUserSurfaces() {
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return Store.folders?.data?.value || [];
    if (groups.includes(MAS_ADMIN_GROUP.toUpperCase())) {
        return Store.folders?.data?.value || [];
    }
    const surfaces = [];
    for (const group of groups) {
        if (group.startsWith(SURFACE_EDITOR_PREFIX) && group.endsWith(SURFACE_EDITOR_SUFFIX)) {
            const surface = group.slice(SURFACE_EDITOR_PREFIX.length, -SURFACE_EDITOR_SUFFIX.length).toLowerCase();
            if (surface) surfaces.push(surface);
        }
    }
    return surfaces.length > 0 ? surfaces : Store.folders?.data?.value || [];
}
