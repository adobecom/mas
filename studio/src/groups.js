import Store from './store.js';

const MAS_ADMIN_GROUP = 'GRP-ODIN-MAS-ADMINS';
const SURFACE_EDITOR_PREFIX = 'GRP-ODIN-MAS-';
const SURFACE_EDITOR_SUFFIX = '-EDITORS';

const MAS_CCDAH_CURATORS_GROUP = 'GRP-ODIN-MAS-CCDAH-CURATORS';
const CURATOR_SURFACES_BY_GROUP = new Map([
    [MAS_ADMIN_GROUP, null],
    ['GRP-ODIN-MAS-ACOM-CURATORS', null],
    [MAS_CCDAH_CURATORS_GROUP, new Set(['ccd', 'adobe-home'])],
]);

const MAS_PROMO_EDITORS_GROUP = 'GRP-ODIN-MAS-PROMO-EDITORS';
const MAS_PROMO_POWERUSERS_GROUP = 'GRP-ODIN-MAS-PROMO-POWERUSERS';

/** Surface path segment → LDAP group required for Studio settings (non-admin). */
const SETTINGS_ACCESS_GROUP_BY_SURFACE = new Map([
    ['acom', 'GRP-ODIN-MAS-ACOM-POWERUSERS'],
    ['acom-cc', 'GRP-ODIN-MAS-ACOM-CC-POWERUSERS'],
    ['acom-dc', 'GRP-ODIN-MAS-ACOM-DC-POWERUSERS'],
    ['adobe-home', 'GRP-ODIN-MAS-AH-POWERUSERS'],
    ['brand-concierge', 'GRP-ODIN-MAS-BRAND-CONCIERGE-POWERUSERS'],
    ['ccd', 'GRP-ODIN-MAS-CCD-POWERUSERS'],
    ['express', 'GRP-ODIN-MAS-EXPRESS-POWERUSERS'],
]);

const ADMIN_ONLY_SETTINGS_SURFACES = new Set(['commerce', 'sandbox', 'nala']);

function normalizeSurface(surface) {
    if (!surface) return '';
    return `${surface}`.split('/').filter(Boolean)[0]?.toLowerCase() ?? '';
}

function getCurrentUserNormalizedGroups() {
    const email = Store.profile.get()?.email;
    if (!email) return null;
    const normalizedEmail = email.toLowerCase();
    const user = Store.users.get().find((u) => u.userPrincipalName?.toLowerCase() === normalizedEmail);
    if (!user) return null;
    return user.groups?.map((group) => group.toUpperCase()) ?? [];
}

export function isMasAdmin() {
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return false;
    return groups.includes(MAS_ADMIN_GROUP);
}

function hasCuratorAccess(surface, groups = getCurrentUserNormalizedGroups()) {
    if (!groups) return false;
    for (const [group, surfaces] of CURATOR_SURFACES_BY_GROUP) {
        if (groups.includes(group) && (!surfaces || surfaces.has(normalizeSurface(surface)))) return true;
    }
    return false;
}

/** Curator UI access for the selected surface; Odin controls effective publish permissions. */
export function canAccessBulkPublish(surface = Store.surface()) {
    const email = Store.profile.get()?.email?.toLowerCase();
    if (email?.endsWith('@adobetest.com')) {
        const access = Store.users.getMeta('imsBulkPublishAccess');
        return (
            access?.email === email &&
            access.allowed === true &&
            (!access.surfaces || access.surfaces.includes(normalizeSurface(surface)))
        );
    }
    return hasCuratorAccess(surface);
}

/** Global promo editors, powerusers and admins can perform basic promotion authoring. */
export function canEditPromotions() {
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return false;
    return (
        groups.includes(MAS_ADMIN_GROUP) ||
        groups.includes(MAS_PROMO_EDITORS_GROUP) ||
        groups.includes(MAS_PROMO_POWERUSERS_GROUP)
    );
}

/** Whether the current user can make advanced promotion project changes. */
export function canManagePromotions() {
    const groups = getCurrentUserNormalizedGroups();
    if (!groups) return false;
    return groups.includes(MAS_ADMIN_GROUP) || groups.includes(MAS_PROMO_POWERUSERS_GROUP);
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

/** Masks can be edited by surface powerusers and the scoped CCD/AH curators. */
export function canAccessMasks(surface) {
    const groups = getCurrentUserNormalizedGroups();
    return (
        canAccessSettings(surface) ||
        !!(
            groups?.includes(MAS_CCDAH_CURATORS_GROUP) &&
            CURATOR_SURFACES_BY_GROUP.get(MAS_CCDAH_CURATORS_GROUP).has(normalizeSurface(surface))
        )
    );
}

/** Limits CCDAH curators while preserving existing Odin-controlled dictionary editing. */
export function canEditPlaceholders(surface) {
    const groups = getCurrentUserNormalizedGroups();
    const editorGroup = `${SURFACE_EDITOR_PREFIX}${normalizeSurface(surface).toUpperCase()}${SURFACE_EDITOR_SUFFIX}`;
    return (
        !groups?.includes(MAS_CCDAH_CURATORS_GROUP) ||
        hasCuratorAccess(surface, groups) ||
        groups.includes(editorGroup) ||
        canAccessSettings(surface)
    );
}

/** Offer mapping is an advanced, per-surface capability gated like settings (for now). */
export function canAccessOfferMapping(surface) {
    return canAccessSettings(surface);
}
