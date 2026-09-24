/**
 * Authentication Manager
 * Handles Adobe IMS authentication and token management
 */
export class AuthManager {
    constructor(clientId, clientSecret) {
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = null;
        this.clientId = clientId;
        this.clientSecret = clientSecret;

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
     * Set tokens from OAuth response
     */
    setTokens(tokens) {
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken || null;
        this.expiresAt = tokens.expiresAt || null;
    }

    /**
     * Get current access token
     */
    async getAccessToken() {
        if (!this.accessToken) {
            throw new Error('No access token available. Please set MAS_ACCESS_TOKEN or IMS_ACCESS_TOKEN environment variable.');
        }

        if (this.expiresAt && Date.now() >= this.expiresAt) {
            if (this.refreshToken) {
                await this.refreshAccessToken();
            } else {
                throw new Error('Access token expired and no refresh token available');
            }
        }

        return this.accessToken;
    }

    /**
     * Refresh the access token using refresh token
     */
    async refreshAccessToken() {
        throw new Error('Token refresh not implemented. Please provide a valid access token.');
    }

    /**
     * Validate that authentication is configured
     */
    async validateAuth() {
        try {
            await this.getAccessToken();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get authorization header value
     */
    async getAuthHeader() {
        const token = await this.getAccessToken();
        return `Bearer ${token}`;
    }
}
