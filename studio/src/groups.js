import Store from './store.js';

const POWER_USER_GROUPS = new Set(['GRP-ODIN-MAS-POWERUSERS', 'GRP-ODIN-MAS-ADMINS']);
const SURFACE_EDITOR_PREFIX = 'GRP-ODIN-MAS-';
const SURFACE_EDITOR_SUFFIX = '-EDITORS';

function getCurrentUserGroups() {
    const { email } = Store.profile.get();
    if (!email) return [];
    const user = Store.users.get().find((user) => user.userPrincipalName === email);
    if (!user) return [];
    return user.groups?.map((group) => group.toUpperCase()) || [];
}

/**
 * Returns whether the current profile belongs to a MAS power user group.
 * Group values are normalized to uppercase to avoid case-based access regressions.
 *
 * @returns {boolean}
 */
export function isPowerUser() {
    return getCurrentUserGroups().some((group) => POWER_USER_GROUPS.has(group));
}

/**
 * Returns the surfaces the current user has editor access to.
 * Extracts surface names from IAM groups matching GRP-ODIN-MAS-{SURFACE}-EDITORS.
 * Power users and admins get access to all surfaces.
 *
 * @returns {string[]} Array of surface names (lowercase), e.g., ['acom', 'express']
 */
export function getUserSurfaces() {
    const groups = getCurrentUserGroups();
    if (groups.some((g) => POWER_USER_GROUPS.has(g))) {
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
