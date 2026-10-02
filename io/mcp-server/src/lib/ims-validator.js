import { Ims } from '@adobe/aio-lib-ims';

/**
 * MAS admin group — bypasses surface-scoped checks.
 */
const MAS_ADMIN_GROUP = 'GRP-ODIN-MAS-ADMINS';

/**
 * Surface path segment → LDAP group required to mutate fragments in that surface.
 * Mirrors studio/src/groups.js::SETTINGS_ACCESS_GROUP_BY_SURFACE but for editor
 * permission on fragment content (not just settings).
 */
const EDITOR_ACCESS_GROUP_BY_SURFACE = new Map([
    ['acom', 'GRP-ODIN-MAS-ACOM-EDITORS'],
    ['acom-cc', 'GRP-ODIN-MAS-ACOM-CC-EDITORS'],
    ['acom-dc', 'GRP-ODIN-MAS-ACOM-DC-EDITORS'],
    ['adobe-home', 'GRP-ODIN-MAS-AH-EDITORS'],
    ['ccd', 'GRP-ODIN-MAS-CCD-EDITORS'],
    ['express', 'GRP-ODIN-MAS-EXPRESS-EDITORS'],
]);

/**
 * Validates IMS token for the mas-studio client
 * @param {string} token - Bearer token from Authorization header
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateIMSToken(token) {
    try {
        const ims = new Ims('prod');
        const validation = await ims.validateToken(token, 'mas-studio');

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
export async function fetchUserGroups(token) {
    try {
        const response = await fetch('https://ims-na1.adobelogin.com/ims/profile/v1', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return [];
        const profile = await response.json();
        const groups = Array.isArray(profile?.groups) ? profile.groups : [];
        return groups.map((g) => String(g).toUpperCase());
    } catch (error) {
        console.error('Failed to fetch user groups from IMS profile:', error.message);
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
    const required = EDITOR_ACCESS_GROUP_BY_SURFACE.get(surface);
    return !!required && groups.includes(required.toUpperCase());
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
export function resolveAemBaseUrl(params) {
    const url = params._aemBaseUrl || params.AEM_BASE_URL;
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
