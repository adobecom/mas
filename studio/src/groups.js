import Store from './store.js';

const MAS_ADMIN_GROUP = 'GRP-ODIN-MAS-ADMINS';

const MAS_PROMO_EDITORS_GROUP = 'GRP-ODIN-MAS-PROMO-EDITORS';

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
    const normalizedEmail = email.toLowerCase();
    const user = Store.users.get().find((u) => u.userPrincipalName?.toLowerCase() === normalizedEmail);
    if (!user) return null;
    return user.groups?.map((group) => group.toUpperCase()) ?? [];
}

export function isMasAdmin() {
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return false;
    return groups.includes(MAS_ADMIN_GROUP.toUpperCase());
}

/** Promotions authoring is gated to a single global editors group (admins always allowed). */
export function canEditPromotions() {
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return false;
    return groups.includes(MAS_ADMIN_GROUP.toUpperCase()) || groups.includes(MAS_PROMO_EDITORS_GROUP.toUpperCase());
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

/** Masks authoring is an advanced, per-surface capability gated like settings. */
export function canAccessMasks(surface) {
    return canAccessSettings(surface);
}
