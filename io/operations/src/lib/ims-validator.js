import { Ims } from '@adobe/aio-lib-ims';
import stateLib from '@adobe/aio-lib-state';

/**
 * MAS admin group — bypasses surface-scoped checks.
 */
const MAS_ADMIN_GROUP = 'GRP-ODIN-MAS-ADMINS';

/** The namespace-scoped cache key MerchAtScaleStudio/listMembers serves. */
const MAS_USERS_CACHE_KEY = 'mas-users';

const SURFACE_EDITOR_PREFIX = 'GRP-ODIN-MAS-';
const SURFACE_EDITOR_SUFFIX = '-EDITORS';

/**
 * The MAS surfaces this service governs — the single source of truth, kept in
 * step with studio/src/groups.js. Each surface's editor group is DERIVED from
 * the GRP-ODIN-MAS-{ABBREV}-EDITORS convention rather than spelled out, so a new
 * surface only needs its segment listed here and the two lists this file used to
 * keep (editable + searchable) can no longer drift apart (brand-concierge was
 * missing from both, silently denying its editors).
 *
 *   abbrev     — group-name segment when it differs from the surface (only
 *                adobe-home → AH today); defaults to the surface uppercased.
 *   adminOnly  — surface has no governed editor group; only admins may touch it.
 *   readParent — a sub-surface that folds into this top-level surface for
 *                cross-surface search read (acom-cc / acom-dc → acom).
 *
 * An unlisted surface is denied — see canEditSurface's defense-in-depth check.
 */
const SURFACES = {
    acom: {},
    'acom-cc': { readParent: 'acom' },
    'acom-dc': { readParent: 'acom' },
    'adobe-home': { abbrev: 'AH' },
    'brand-concierge': {},
    ccd: {},
    express: {},
    commerce: { adminOnly: true },
    sandbox: { adminOnly: true },
    docs: { adminOnly: true },
    nala: { adminOnly: true },
};

/**
 * The editor LDAP group that grants write access to a surface, or null when the
 * surface is unknown or admin-only (no governed editor group). Derived from the
 * GRP-ODIN-MAS-{ABBREV}-EDITORS naming convention.
 */
function editorGroupForSurface(surface) {
    const config = SURFACES[surface];
    if (!config || config.adminOnly) return null;
    const segment = config.abbrev ?? surface.toUpperCase();
    return `${SURFACE_EDITOR_PREFIX}${segment}${SURFACE_EDITOR_SUFFIX}`;
}

/**
 * Validates IMS token for the mas-studio client
 * @param {string} token - Bearer token from Authorization header
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateIMSToken(token) {
    try {
        const ims = new Ims('prod');
        // validateTokenAllowList restricts by client_id; validateToken(token, 'mas-studio')
        // only labels the check and accepts any Adobe app's token. Mirrors ai-chat + io/studio/utils.
        const validation = await ims.validateTokenAllowList(token, ['mas-studio']);

        if (!validation || !validation.valid) {
            return {
                valid: false,
                error: 'Invalid IMS token',
            };
        }

        return { valid: true };
    } catch (error) {
        console.error('IMS token validation error:', error);
        return {
            valid: false,
            error: error.message || 'Token validation failed',
        };
    }
}

/**
 * Extract the MAS surface segment from a fragment or parent path.
 * Accepts '/content/dam/mas/{surface}/...' and returns the surface, or null.
 *
 * @param {string} path
 * @returns {string|null}
 */
export function deriveSurfaceFromPath(path) {
    if (typeof path !== 'string' || !path) return null;
    // Reject traversal: '/content/dam/mas/acom/../ccd/...' would derive 'acom'
    // while AEM resolves it to 'ccd', letting an acom editor write to ccd.
    if (path.split('/').includes('..')) return null;
    const match = path.match(/^\/content\/dam\/mas\/([^/]+)/);
    if (!match) return null;
    return match[1].toLowerCase();
}

/**
 * Fetch the LDAP groups of the caller from Adobe's profile endpoint.
 * Groups come back uppercase-normalized for case-insensitive comparisons.
 *
 * @param {string} token - Bearer token (no 'Bearer ' prefix)
 * @returns {Promise<string[]>} - uppercase LDAP group names, or [] on failure
 */
/**
 * The MAS groups for a user, looked up by email in the mas-users list.
 * Case-insensitive on the email; returns uppercase group names, [] if unknown.
 *
 * @param {Array<{userPrincipalName?: string, groups?: string[]}>} users
 * @param {string} email
 * @returns {string[]}
 */
export function groupsForEmail(users, email) {
    if (!Array.isArray(users) || !email) return [];
    const normalized = String(email).toLowerCase();
    const user = users.find((entry) => entry?.userPrincipalName?.toLowerCase() === normalized);
    return (user?.groups ?? []).map((group) => String(group).toUpperCase());
}

/**
 * Resolve the caller's MAS groups from the shared `mas-users` cache — the same
 * source studio/src/groups.js uses — keyed by the caller's email.
 *
 * IMS profile/v1 does NOT carry the GRP-ODIN-MAS-* LDAP groups; only the
 * per-namespace mas-users cache does. Reading `profile.groups` therefore
 * returned nothing and denied every surface (create_release_cards, copy-card,
 * cross-surface). The cache is namespace-scoped, so this reads the same store
 * MerchAtScaleStudio/listMembers serves. Profile/v1 is still used, but only for
 * the caller's email.
 *
 * @param {string} token - Bearer token (no 'Bearer ' prefix)
 * @returns {Promise<string[]>} - uppercase LDAP group names, or [] on failure
 */
export async function fetchUserGroups(token) {
    try {
        const response = await fetch('https://ims-na1.adobelogin.com/ims/profile/v1', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return [];
        const profile = await response.json();
        const email = String(profile?.email ?? '').toLowerCase();
        if (!email) return [];

        const state = await stateLib.init();
        const cached = await state.get(MAS_USERS_CACHE_KEY);
        if (!cached?.value) return [];
        const users = JSON.parse(cached.value);
        return groupsForEmail(users, email);
    } catch (error) {
        console.error('Failed to resolve user groups from mas-users:', error.message);
        return [];
    }
}

/**
 * Returns true if the caller is allowed to mutate fragments in the given surface.
 * Admin group bypasses the check. Otherwise the caller must be in the per-surface
 * EDITORS group.
 *
 * @param {string[]} groups - uppercase LDAP group names
 * @param {string|null} surface - surface segment (lowercase), e.g. 'acom'
 * @returns {boolean}
 */
export function canEditSurface(groups, surface) {
    if (!Array.isArray(groups) || groups.length === 0) return false;
    if (groups.includes(MAS_ADMIN_GROUP.toUpperCase())) return true;
    if (!surface) return false;
    const required = editorGroupForSurface(surface);
    return !!required && groups.includes(required.toUpperCase());
}

/**
 * The searchable surfaces a caller may read in a cross-surface search. An admin
 * sees every top-level surface; everyone else sees the top-level surface behind
 * each editor group they hold — a sub-surface folds into its readParent
 * (acom-cc / acom-dc → acom). Empty for a caller in no governing group. Derived
 * from SURFACES, so a surface can no longer be editable-but-not-searchable (or
 * vice versa) by accident; StudioOperations.getSurfacePath resolves any of these
 * generically.
 *
 * @param {string[]} groups - uppercase LDAP group names
 * @returns {string[]} entitled top-level surface segments
 */
export function entitledSurfaces(groups) {
    const owned = Array.isArray(groups) ? groups.map((group) => group.toUpperCase()) : [];
    const topLevelSurfaces = Object.keys(SURFACES).filter((surface) => !SURFACES[surface].readParent);
    if (owned.includes(MAS_ADMIN_GROUP.toUpperCase())) return topLevelSurfaces;

    const readable = new Set();
    for (const surface of Object.keys(SURFACES)) {
        const group = editorGroupForSurface(surface);
        if (group && owned.includes(group.toUpperCase())) {
            readable.add(SURFACES[surface].readParent ?? surface);
        }
    }
    return [...readable];
}

/**
 * Middleware-style gate for mutating Runtime actions. Validates IMS token,
 * derives the surface from params, fetches user groups, and returns a 403 if
 * the caller lacks editor access for that surface.
 *
 * @param {Object} headers - __ow_headers
 * @param {Object} params - Runtime params (must contain parentPath or path)
 * @returns {Promise<Object|null>} - error response or null if authorized
 */
export async function requireSurfaceAccess(headers, params) {
    const authError = await requireIMSAuth(headers);
    if (authError) return authError;

    const pathForSurface = params?.parentPath || params?.path;
    const surface = deriveSurfaceFromPath(pathForSurface);
    if (!surface) {
        return {
            statusCode: 400,
            body: {
                error: 'parentPath or path (under /content/dam/mas/{surface}/...) is required to authorize this operation',
            },
        };
    }

    const token = headers.authorization.replace('Bearer ', '');
    const groups = await fetchUserGroups(token);
    if (!canEditSurface(groups, surface)) {
        return {
            statusCode: 403,
            body: {
                error: `Forbidden: caller does not have editor access to surface "${surface}"`,
            },
        };
    }

    return null;
}

/**
 * Middleware-style function to validate auth in Runtime actions
 * Returns error response if invalid, null if valid
 * @param {Object} headers - Runtime __ow_headers object
 * @returns {Promise<Object|null>} Error response or null if valid
 */
/**
 * Resolves AEM base URL from action params
 * Returns error response if not configured, null if valid
 * @param {Object} params - Runtime action params
 * @returns {{url: string, error?: Object}}
 */
/**
 * The caller-supplied `_aemBaseUrl` override is honored only for AEM Cloud hosts
 * or local dev. Without this gate any mas-studio token holder could point the
 * runtime — which attaches the caller's bearer token — at an arbitrary host (SSRF).
 * @param {string} rawUrl
 * @returns {boolean}
 */
export function isAllowedAemHost(rawUrl) {
    try {
        const { hostname } = new URL(rawUrl);
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.adobeaemcloud.com');
    } catch {
        return false;
    }
}

export function resolveAemBaseUrl(params) {
    const override = params._aemBaseUrl;
    const url = override && isAllowedAemHost(override) ? override : params.AEM_BASE_URL;
    if (!url) {
        return { url: null, error: { statusCode: 500, body: { error: 'AEM_BASE_URL is not configured' } } };
    }
    return { url, error: null };
}

export async function requireIMSAuth(headers) {
    const authHeader = headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            body: { error: 'Authorization required: Bearer token missing' },
        };
    }

    const token = authHeader.slice(7);
    const validation = await validateIMSToken(token);

    if (!validation.valid) {
        return {
            statusCode: 401,
            body: { error: `Unauthorized: ${validation.error}` },
        };
    }

    return null; // No error, auth is valid
}
