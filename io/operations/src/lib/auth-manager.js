/**
 * Authentication Manager
 * Handles Adobe IMS access-token management
 */
export class AuthManager {
    constructor() {
        this.accessToken = null;
        this.expiresAt = null;

        this.loadFromEnvironment();
    }

    /**
     * Load access token from environment variables
     */
    loadFromEnvironment() {
        if (process.env.MAS_ACCESS_TOKEN) {
            this.accessToken = process.env.MAS_ACCESS_TOKEN;
        }

        if (process.env.IMS_ACCESS_TOKEN) {
            this.accessToken = process.env.IMS_ACCESS_TOKEN;
        }
    }

    /**
     * Set access token manually
     */
    setAccessToken(token, expiresIn) {
        this.accessToken = token;
        if (expiresIn) {
            this.expiresAt = Date.now() + expiresIn * 1000;
        }
    }

    /**
     * Get current access token
     */
    async getAccessToken() {
        if (!this.accessToken) {
            throw new Error('No access token available. Please set MAS_ACCESS_TOKEN or IMS_ACCESS_TOKEN environment variable.');
        }

        if (this.expiresAt && Date.now() >= this.expiresAt) {
            throw new Error('Access token expired');
        }

        return this.accessToken;
    }

    /**
     * Get authorization header value
     */
    async getAuthHeader() {
        const token = await this.getAccessToken();
        return `Bearer ${token}`;
    }
}
