import Store from './store.js';

const POWER_USER_GROUPS = new Set(['GRP-ODIN-MAS-POWERUSERS', 'GRP-ODIN-MAS-ADMINS']);

/**
 * Returns whether the current profile belongs to a MAS power user group.
 * Group values are normalized to uppercase to avoid case-based access regressions.
 *
 * @returns {boolean}
 */
export function isPowerUser() {
    const { email } = Store.profile.get();
    if (!email) return false;
    const user = Store.users.get().find((user) => user.userPrincipalName === email);
    if (!user) return false;
    const normalizedGroups = user.groups?.map((group) => group.toUpperCase()) || [];
    return normalizedGroups.some((group) => POWER_USER_GROUPS.has(group));
}
