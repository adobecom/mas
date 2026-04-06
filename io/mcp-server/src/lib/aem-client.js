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
        const { path = '/content/dam/mas', query, tags, modelIds, limit = 50, offset = 0, searchMode = 'EDGES' } = params;

        const authHeader = await this.authManager.getAuthHeader();
        console.log('[AEMClient] Auth header:', authHeader ? 'present' : 'MISSING');

        const filter = { path };

        if (query && query.trim()) {
            const trimmedQuery = query.trim();

            // Auto-detect if we should use EXACT_PHRASE mode for special characters
            let resolvedMode = searchMode;
            const hasSpecialChars = /[+\-()]/.test(trimmedQuery);
            const isQuoted = trimmedQuery.startsWith('"') && trimmedQuery.endsWith('"');

            if ((hasSpecialChars || isQuoted) && searchMode === 'EDGES') {
                resolvedMode = 'EXACT_PHRASE';
                console.log(`[AEMClient] Auto-detected special characters/quoted phrase, switching to EXACT_PHRASE mode`);
            }

            // Strip quotes for EXACT_PHRASE mode (the mode itself indicates phrase matching)
            let queryText = trimmedQuery;
            if (resolvedMode === 'EXACT_PHRASE' && isQuoted) {
                queryText = trimmedQuery.slice(1, -1);
                console.log(`[AEMClient] Stripped quotes for EXACT_PHRASE: "${trimmedQuery}" → "${queryText}"`);
            }

            filter.fullText = {
                text: queryText,
                queryMode: resolvedMode,
            };

            console.log(`[AEMClient] Full text search: query="${queryText}" mode="${resolvedMode}"`);
        }

        if (tags && tags.length > 0) {
            filter.tags = tags;
        }

        if (modelIds && modelIds.length > 0) {
            filter.modelIds = modelIds;
        }

        const searchQuery = {
            filter,
        };

        console.log('[AEMClient] Search query structure:', JSON.stringify(searchQuery, null, 2));

        const searchParams = new URLSearchParams({
            query: JSON.stringify(searchQuery),
        });

        if (limit) {
            searchParams.set('limit', String(limit));
        }

        if (offset) {
            searchParams.set('offset', String(offset));
        }

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/search?${searchParams}`;

        console.log('[AEMClient] Request URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'x-aem-affinity-type': 'api',
            },
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('[AEMClient] Search failed!');
            console.error('[AEMClient] Response status:', response.status, response.statusText);
            console.error('[AEMClient] Response headers:', Object.fromEntries(response.headers.entries()));
            console.error('[AEMClient] Response body:', errorText);
            console.error('[AEMClient] Search params:', { path, query, tags, limit, offset });
            throw new Error(`AEM search failed: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
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
                Accept: 'application/json',
                'Content-Type': 'application/json',
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'x-aem-affinity-type': 'api',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get fragment: ${response.statusText}`);
        }

        // Extract ETag from response headers (required for updates)
        const etag = response.headers.get('Etag');
        const fragment = await response.json();
        fragment.etag = etag;

        return fragment;
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
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'x-aem-affinity-type': 'api',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get fragment by path: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Create a tag in AEM's taxonomy if it doesn't exist.
     * Tag ID format: "mas:category/value" → path: /content/cq:tags/mas/category/value
     */
    async createTag(tagId, title) {
        const authHeader = await this.authManager.getAuthHeader();
        const csrfToken = await this.getCsrfToken();

        const tagPath = `/content/cq:tags/${tagId.replace(':', '/')}`;
        const url = `${this.baseUrl}${tagPath}`;

        const body = new URLSearchParams();
        body.append('jcr:primaryType', 'cq:Tag');
        body.append('jcr:title', title || tagId.split('/').pop());

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'CSRF-Token': csrfToken,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        if (response.status === 201 || response.status === 200 || response.status === 409) {
            return true;
        }
        console.error(`[AEMClient] createTag failed for ${tagId}: ${response.status}`);
        return false;
    }

    /**
     * Ensure all tags exist in AEM taxonomy, creating missing ones.
     */
    async ensureTags(tagIds) {
        const results = [];
        for (const tagId of tagIds) {
            const created = await this.createTag(tagId);
            results.push({ tagId, created });
        }
        return results;
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
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'x-aem-affinity-type': 'api',
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
     * Save a fragment with complete fields array (PUT method)
     * Mirrors frontend approach for consistency
     */
    async saveFragment(id, title, description, fields, etag) {
        const authHeader = await this.authManager.getAuthHeader();
        const csrfToken = await this.getCsrfToken();

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/${encodeURIComponent(id)}`;

        const headers = {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken,
            pragma: 'no-cache',
            'cache-control': 'no-cache',
            'x-aem-affinity-type': 'api',
        };

        if (etag) {
            headers['If-Match'] = etag;
        }

        const body = {
            title,
            description,
            fields,
        };

        console.log('[AEMClient] saveFragment called with:', {
            id,
            title,
            description,
            fieldsCount: Array.isArray(fields) ? fields.length : 0,
            etag: etag ? 'present' : 'missing',
        });

        console.log('[AEMClient] PUT request body to be sent:', JSON.stringify(body, null, 2));

        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const responseText = await response.text();
            let error;
            try {
                error = JSON.parse(responseText);
            } catch {
                error = { message: response.statusText, body: responseText };
            }

            console.error('[AEMClient] Save failed:', {
                status: response.status,
                statusText: response.statusText,
                errorMessage: error.message,
                responseBody: responseText.substring(0, 500),
                requestBody: JSON.stringify(body, null, 2),
                requestHeaders: headers,
            });
            throw new Error(`Failed to save fragment (${response.status}): ${error.message || response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Update a fragment
     */
    async updateFragment(id, fields, etag, title, tags) {
        const authHeader = await this.authManager.getAuthHeader();
        const csrfToken = await this.getCsrfToken();

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/${encodeURIComponent(id)}`;

        const currentFragment = await this.getFragment(id);
        if (!currentFragment) throw new Error(`Fragment not found: ${id}`);

        const currentEtag = etag || currentFragment.etag;

        const currentFields = Array.isArray(currentFragment.fields)
            ? currentFragment.fields
            : [];

        const mergedFields = currentFields.map((field) => {
            if (fields && field.name in fields) {
                const newValue = fields[field.name];
                return {
                    ...field,
                    values: Array.isArray(newValue) ? newValue : [newValue],
                };
            }
            return field;
        });

        if (fields) {
            const existingNames = new Set(currentFields.map((f) => f.name));
            for (const [key, value] of Object.entries(fields)) {
                if (!existingNames.has(key)) {
                    mergedFields.push({
                        name: key,
                        values: Array.isArray(value) ? value : [value],
                    });
                }
            }
        }

        const body = {
            title: title !== undefined ? title : currentFragment.title,
            fields: mergedFields,
        };

        const headers = {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken,
            pragma: 'no-cache',
            'cache-control': 'no-cache',
            'x-aem-affinity-type': 'api',
        };

        if (currentEtag) {
            headers['If-Match'] = currentEtag;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const responseText = await response.text();
            let error;
            try {
                error = JSON.parse(responseText);
            } catch {
                error = { message: response.statusText, body: responseText };
            }

            console.error('[AEMClient] Update failed:', {
                status: response.status,
                statusText: response.statusText,
                errorMessage: error.message,
                responseBody: responseText.substring(0, 500),
            });
            throw new Error(`Failed to update fragment (${response.status}): ${error.message || response.statusText}`);
        }

        const result = await response.json();

        if (tags !== undefined) {
            await this.applyValidTags(id, tags);
        }

        return result;
    }

    /**
     * Apply tags to a fragment, skipping any that don't exist in AEM taxonomy.
     */
    async applyValidTags(id, tags) {
        try {
            await this.updateFragmentTags(id, tags);
        } catch (error) {
            const match = error.message?.match(/Tag id\(s\) not valid: \[([^\]]+)\]/);
            if (match) {
                const invalidTags = match[1].split(',').map((t) => t.trim());
                const validTags = tags.filter((t) => !invalidTags.includes(t));
                if (validTags.length > 0) {
                    console.log(
                        `[AEMClient] Retrying with ${validTags.length} valid tags (skipped ${invalidTags.length} invalid)`,
                    );
                    await this.updateFragmentTags(id, validTags);
                } else {
                    console.log('[AEMClient] No valid tags to apply');
                }
            } else {
                throw error;
            }
        }
    }

    /**
     * Update fragment tags via dedicated tags endpoint
     */
    async updateFragmentTags(id, tags) {
        const authHeader = await this.authManager.getAuthHeader();

        const tagsUrl = `${this.baseUrl}/adobe/sites/cf/fragments/${encodeURIComponent(id)}/tags`;

        let getResp = await fetch(tagsUrl, { method: 'GET', headers: { Authorization: authHeader } });
        if (getResp.status === 404) {
            await new Promise((r) => setTimeout(r, 3000));
            getResp = await fetch(tagsUrl, { method: 'GET', headers: { Authorization: authHeader } });
        }
        if (!getResp.ok) {
            throw new Error(`Failed to get tags for fragment (${getResp.status})`);
        }
        const etag = getResp.headers.get('Etag');

        let response = await fetch(tagsUrl, {
            method: 'PUT',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                'If-Match': etag,
            },
            body: JSON.stringify({ tags }),
        });

        if (response.status === 404) {
            await new Promise((r) => setTimeout(r, 3000));
            getResp = await fetch(tagsUrl, { method: 'GET', headers: { Authorization: authHeader } });
            if (!getResp.ok) throw new Error(`Failed to get tags for fragment (${getResp.status})`);
            const freshEtag = getResp.headers.get('Etag');
            response = await fetch(tagsUrl, {
                method: 'PUT',
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json',
                    'If-Match': freshEtag,
                },
                body: JSON.stringify({ tags }),
            });
        }

        if (!response.ok) {
            const responseText = await response.text();
            console.error('[AEMClient] updateFragmentTags failed:', { status: response.status, responseText });
            throw new Error(`Failed to update tags (${response.status}): ${responseText}`);
        }
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
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'x-aem-affinity-type': 'api',
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

        const fragment = await this.getFragment(id);
        if (!fragment) throw new Error(`Fragment not found: ${id}`);

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/publish`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
                'If-Match': fragment.etag,
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'x-aem-affinity-type': 'api',
            },
            body: JSON.stringify({
                paths: [fragment.path],
                filterReferencesByStatus: ['DRAFT', 'UNPUBLISHED'],
                workflowModelId: '/var/workflow/models/scheduled_activation_with_references',
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to publish fragment (${response.status}): ${text.substring(0, 200) || response.statusText}`);
        }

        if (response.status === 204) return { success: true };
        return await response.json();
    }

    /**
     * Unpublish a fragment
     */
    async unpublishFragment(id) {
        const authHeader = await this.authManager.getAuthHeader();
        const csrfToken = await this.getCsrfToken();

        const fragment = await this.getFragment(id);
        if (!fragment) throw new Error(`Fragment not found: ${id}`);

        const url = `${this.baseUrl}/adobe/sites/cf/fragments/publish`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
                'If-Match': fragment.etag,
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'x-aem-affinity-type': 'api',
            },
            body: JSON.stringify({
                paths: [fragment.path],
                workflowModelId: '/var/workflow/models/scheduled_deactivation',
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to unpublish fragment (${response.status}): ${text.substring(0, 200) || response.statusText}`);
        }

        if (response.status === 204) return { success: true };
        return await response.json();
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
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'x-aem-affinity-type': 'api',
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
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'x-aem-affinity-type': 'api',
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
