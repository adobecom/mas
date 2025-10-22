import { AuthManager } from './auth-manager.js';

/**
 * AEM Client
 * Wrapper for AEM Sites Content Fragment APIs
 */
export class AEMClient {
    constructor(baseUrl, authManager) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.authManager = authManager;
    }

    /**
     * Search for fragments with filters
     */
    async searchFragments(params) {
        const { path = '/content/dam/mas', query, tags, limit = 100, offset = 0 } = params;

        const authHeader = await this.authManager.getAuthHeader();

        const searchParams = new URLSearchParams({
            path,
            limit: String(limit),
            offset: String(offset),
        });

        if (query) {
            searchParams.set('fulltext', query);
        }

        if (tags && tags.length > 0) {
            searchParams.set('tags', tags.join(','));
        }

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/search?${searchParams}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`AEM search failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.items || [];
    }

    /**
     * Get fragment by ID
     */
    async getFragment(id) {
        const authHeader = await this.authManager.getAuthHeader();

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/${encodeURIComponent(id)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get fragment: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Get fragment by path
     */
    async getFragmentByPath(path) {
        const authHeader = await this.authManager.getAuthHeader();

        const url = `${this.baseUrl}/adobe/sites/cf/fragments?path=${encodeURIComponent(path)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get fragment by path: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Create a new fragment
     */
    async createFragment(data) {
        const authHeader = await this.authManager.getAuthHeader();
        const csrfToken = await this.getCsrfToken();

        const url = `${this.baseUrl}/adobe/sites/cf/fragments`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Failed to create fragment: ${error.message || response.statusText}`);
        }

        const fragment = await response.json();

        await this.waitForFragment(fragment.id);

        return fragment;
    }

    /**
     * Update a fragment
     */
    async updateFragment(id, fields, etag) {
        const authHeader = await this.authManager.getAuthHeader();
        const csrfToken = await this.getCsrfToken();

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/${encodeURIComponent(id)}`;

        const headers = {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken,
        };

        if (etag) {
            headers['If-Match'] = etag;
        }

        const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ fields }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Failed to update fragment: ${error.message || response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Delete a fragment
     */
    async deleteFragment(id) {
        const authHeader = await this.authManager.getAuthHeader();
        const csrfToken = await this.getCsrfToken();

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/${encodeURIComponent(id)}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: authHeader,
                'CSRF-Token': csrfToken,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to delete fragment: ${response.statusText}`);
        }
    }

    /**
     * Publish a fragment
     */
    async publishFragment(id) {
        const authHeader = await this.authManager.getAuthHeader();
        const csrfToken = await this.getCsrfToken();

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/${encodeURIComponent(id)}/publish`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`Failed to publish fragment: ${response.statusText}`);
        }
    }

    /**
     * Unpublish a fragment
     */
    async unpublishFragment(id) {
        const authHeader = await this.authManager.getAuthHeader();
        const csrfToken = await this.getCsrfToken();

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/${encodeURIComponent(id)}/unpublish`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error(`Failed to unpublish fragment: ${response.statusText}`);
        }
    }

    /**
     * Copy/duplicate a fragment
     */
    async copyFragment(params) {
        const { id, parentPath, newTitle } = params;

        const fragment = await this.getFragment(id);

        if (!fragment) {
            throw new Error(`Fragment ${id} not found`);
        }

        const copyData = {
            title: newTitle || `${fragment.title} (Copy)`,
            description: fragment.description,
            model: fragment.model?.id || fragment.model,
            parentPath: parentPath || fragment.parentPath,
            fields: fragment.fields,
            tags: fragment.tags || [],
        };

        return await this.createFragment(copyData);
    }

    /**
     * Get CSRF token for write operations
     */
    async getCsrfToken() {
        const authHeader = await this.authManager.getAuthHeader();

        const url = `${this.baseUrl}/libs/granite/csrf/token.json`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get CSRF token');
        }

        const data = await response.json();
        return data.token;
    }

    /**
     * Wait for fragment to be fully created/updated (polling)
     */
    async waitForFragment(id, maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const fragment = await this.getFragment(id);
                if (fragment && fragment.id) {
                    return fragment;
                }
            } catch {
                // Fragment not ready yet
            }

            await new Promise((resolve) => setTimeout(resolve, 250));
        }

        throw new Error(`Fragment ${id} not available after ${maxAttempts} attempts`);
    }

    /**
     * List folders in a path
     */
    async listFolders(path) {
        const authHeader = await this.authManager.getAuthHeader();

        const url = `${this.baseUrl}/api/assets${path}.json`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to list folders: ${response.statusText}`);
        }

        const data = await response.json();
        const folders = data.entities?.filter((e) => e.class?.includes('folder')) || [];

        return folders.map((f) => ({
            path: f.properties?.path || '',
            name: f.properties?.name || f.properties?.['jcr:title'] || '',
        }));
    }
}
