import { Ims } from '@adobe/aio-lib-ims';

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
                error: 'Invalid IMS token'
            };
        }

        return { valid: true };
    } catch (error) {
        console.error('IMS token validation error:', error);
        return {
            valid: false,
            error: error.message || 'Token validation failed'
        };
    }
}

/**
 * Middleware-style function to validate auth in Runtime actions
 * Returns error response if invalid, null if valid
 * @param {Object} headers - Runtime __ow_headers object
 * @returns {Promise<Object|null>} Error response or null if valid
 */
export async function requireIMSAuth(headers) {
    const authHeader = headers?.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return {
            statusCode: 401,
            body: { error: 'Authorization required: Bearer token missing' }
        };
    }

    const token = authHeader.slice(7);
    const validation = await validateIMSToken(token);

    if (!validation.valid) {
        return {
            statusCode: 401,
            body: { error: `Unauthorized: ${validation.error}` }
        };
    }

    return null; // No error, auth is valid
}
