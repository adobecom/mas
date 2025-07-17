import { UserFriendlyError } from '../utils.js';

const NETWORK_ERROR_MESSAGE = 'Network error';
const MAX_POLL_ATTEMPTS = 10;
const POLL_TIMEOUT = 250;

const defaultSearchOptions = {
    sort: [{ on: 'created', order: 'ASC' }],
};

const filterByTags = (tags) => (item) => {
    if (!tags.length) return true;
    if (!item.tags || !item.tags.length) return false;
    // Group tags by their root namespace
    const tagsByRoot = {};
    for (const tag of tags) {
        const rootNamespace = tag.split('/')[0];
        if (!tagsByRoot[rootNamespace]) {
            tagsByRoot[rootNamespace] = [];
        }
        tagsByRoot[rootNamespace].push(tag);
    }

    // For each root namespace:
    // - Apply OR logic within the same root (at least one tag from this root must match)
    // - Apply AND logic between different roots (must have at least one match from each root)
    for (const rootTags of Object.values(tagsByRoot)) {
        // Check if at least one tag from this root matches (OR logic)
        let hasMatchFromThisRoot = false;
        for (const tag of rootTags) {
            if (item.tags.some((itemTag) => itemTag.id === tag)) {
                hasMatchFromThisRoot = true;
                break;
            }
        }
        // If no match from this root, return false (AND logic between roots)
        if (!hasMatchFromThisRoot) {
            return false;
        }
    }
    // All root namespaces have at least one matching tag
    return true;
};

class AEM {
    #author;
    constructor(bucket, baseUrlOverride) {
        this.#author = Boolean(bucket);
        const baseUrl = baseUrlOverride || `https://${bucket}.adobeaemcloud.com`;
        this.baseUrl = baseUrl;
        const sitesUrl = `${baseUrl}/adobe/sites`;
        this.cfFragmentsUrl = `${sitesUrl}/cf/fragments`;
        this.cfSearchUrl = `${this.cfFragmentsUrl}/search`;
        this.cfPublishUrl = `${this.cfFragmentsUrl}/publish`;
        this.wcmcommandUrl = `${baseUrl}/bin/wcmcommand`;
        this.csrfTokenUrl = `${baseUrl}/libs/granite/csrf/token.json`;

        this.headers = {
            // IMS users might not have all the permissions, token in the sessionStorage is a temporary workaround
            Authorization: `Bearer ${sessionStorage.getItem('masAccessToken') ?? window.adobeid?.authorize?.()}`,
            pragma: 'no-cache',
            'cache-control': 'no-cache',
            'x-aem-affinity-type': 'api',
        };
    }

    wait(ms = 1000) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async getCsrfToken() {
        const response = await fetch(this.csrfTokenUrl, {
            headers: this.headers,
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });
        if (!response.ok) {
            throw new Error(`Failed to get CSRF token: ${response.status} ${response.statusText}`);
        }
        const { token } = await response.json();
        return token;
    }

    /**
     * Search for content fragments.
     * @param {Object} params - The search options
     * @param {string} [params.path] - The path to search in
     * @param {Array} [params.tags] - The tags
     * @param {Array} [params.modelIds] - The model ids
     * @param {string} [params.query] - The search query
     * @param {AbortController} abortController used for cancellation
     * @returns A generator function that fetches all the matching data using a cursor that is returned by the search API
     */
    async *searchFragment({ path, query = '', tags = [], modelIds = [], sort, status }, limit, abortController) {
        const filter = {
            path,
        };
        if (query) {
            filter.fullText = {
                text: encodeURIComponent(query),
                // For info about modes: https://adobe-sites.redoc.ly/tag/Search#operation/fragments/search!path=query/filter/fullText/queryMode&t=request
                queryMode: 'EDGES',
            };
        }
        const searchQuery = { ...defaultSearchOptions, filter };
        if (sort) {
            searchQuery.sort = sort;
        }
        if (tags.length > 0) {
            filter.tags = tags;
        }
        if (modelIds.length > 0) {
            filter.modelIds = modelIds;
        }
        if (status) {
            filter.status = [status];
        }
        const params = {
            query: JSON.stringify(searchQuery),
        };

        if (limit) {
            params.limit = limit;
        }

        let cursor;
        while (true) {
            if (cursor) {
                params.cursor = cursor;
            }
            const searchParams = new URLSearchParams(params).toString();
            const response = await fetch(`${this.cfSearchUrl}?${searchParams}`, {
                headers: this.headers,
                signal: abortController?.signal,
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status} ${response.statusText}`);
            }
            let items;
            ({ items, cursor } = await response.json());
            if (tags.length > 0) {
                // filter items by tags
                items = items.filter(filterByTags(tags));
            }

            yield items;
            if (!cursor) break;
        }
    }

    /**
     * @param {Response} res
     * @returns Fragment json
     */
    async getFragment(res) {
        const etag = res.headers.get('Etag');
        const fragment = await res.json();
        fragment.etag = etag;
        return fragment;
    }

    /**
     * Get fragment by ID
     * @param {string} baseUrl the aem base url
     * @param {string} id fragment id
     * @param {Object} headers optional request headers
     * @param {AbortController} abortController used for cancellation
     * @returns {Promise<Object>} the raw fragment item
     */
    async getFragmentById(baseUrl, id, headers, abortController) {
        const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/${id}?references=direct-hydrated`, {
            headers,
            signal: abortController?.signal,
        });
        if (!response.ok) {
            throw new Error(`Failed to get fragment: ${response.status} ${response.statusText}`);
        }
        return await this.getFragment(response);
    }

    /**
     * Get fragment by path
     * @param {string} path fragment path
     * @returns {Promise<Object>} the raw fragment item
     */
    async getFragmentByPath(path) {
        const headers = this.#author ? this.headers : {};
        const response = await fetch(`${this.cfFragmentsUrl}?path=${path}`, {
            headers,
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });
        if (!response.ok) {
            throw new Error(`Failed to get fragment: ${response.status} ${response.statusText}`);
        }
        const { items } = await response.json();
        if (!items || items.length === 0) {
            throw new Error('Fragment not found');
        }
        return items[0];
    }

    /**
     * Save given fragment
     * @param {Object} fragment
     * @returns {Promise<Object>} the updated fragment
     */
    async saveFragment(fragment) {
        if (!fragment?.id) {
            throw new Error('Invalid fragment data for save operation');
        }

        const latestFragment = await this.getFragmentWithEtag(fragment.id);
        if (!latestFragment) {
            throw new Error('Failed to retrieve fragment for update');
        }

        const { title, description, fields } = fragment;

        const response = await fetch(`${this.cfFragmentsUrl}/${fragment.id}`, {
            method: 'PUT',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'If-Match': latestFragment.etag,
            },
            body: JSON.stringify({
                title,
                description,
                fields,
            }),
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (!response.ok) {
            throw new Error(`Failed to save fragment: ${response.status} ${response.statusText}`);
        }

        await this.saveTags(fragment);

        return this.pollUpdatedFragment(fragment);
    }

    async saveTags(fragment) {
        const { newTags } = fragment;
        if (!newTags) return;
        // we need this to get the Etag
        const fragmentTags = await fetch(`${this.cfFragmentsUrl}/${fragment.id}/tags`, {
            method: 'GET',
            headers: this.headers,
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        const etag = fragmentTags.headers.get('Etag');
        const headers = {
            ...this.headers,
            'Content-Type': 'application/json',
            'If-Match': etag,
        };

        if (newTags?.length === 0) {
            await fetch(`${this.cfFragmentsUrl}/${fragment.id}/tags`, {
                method: 'DELETE',
                headers,
            }).catch((err) => {
                throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
            });
        } else {
            await fetch(`${this.cfFragmentsUrl}/${fragment.id}/tags`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    tags: newTags,
                }),
            }).catch((err) => {
                throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
            });
        }
    }

    async pollCreatedFragment(newFragment) {
        let attempts = 0;
        while (attempts < MAX_POLL_ATTEMPTS) {
            attempts++;
            const fragment = await this.sites.cf.fragments.getById(newFragment.id);
            if (fragment) return fragment;
            await this.wait(POLL_TIMEOUT);
        }
        throw new UserFriendlyError('Creation completed but the created fragment could not be retrieved.');
    }

    async pollUpdatedFragment(oldFragment) {
        let attempts = 0;
        while (attempts < MAX_POLL_ATTEMPTS) {
            attempts++;
            const newFragment = await this.sites.cf.fragments.getById(oldFragment.id);
            if (newFragment.etag !== oldFragment.etag) return newFragment;
            await this.wait(POLL_TIMEOUT);
        }
        throw new UserFriendlyError('Save completed but the updated fragment could not be retrieved.');
    }

    /**
     * Copy a content fragment using the AEM classic API
     * @param {Object} fragment
     * @returns {Promise<Object>} the copied fragment
     */
    async copyFragmentClassic(fragment) {
        const csrfToken = await this.getCsrfToken();
        let parentPath = fragment.path.split('/').slice(0, -1).join('/');
        const formData = new FormData();
        formData.append('cmd', 'copyPage');
        formData.append('srcPath', fragment.path);
        formData.append('destParentPath', parentPath);
        formData.append('shallow', 'false');
        formData.append('_charset_', 'UTF-8');

        const res = await fetch(this.wcmcommandUrl, {
            method: 'POST',
            headers: {
                ...this.headers,
                'csrf-token': csrfToken,
            },
            body: formData,
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });
        if (!res.ok) {
            throw new Error(`Failed to copy fragment: ${res.status} ${res.statusText}`);
        }
        const responseText = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(responseText, 'text/html');
        const message = doc.getElementById('Message');
        const newPath = message?.textContent.trim();
        if (!newPath) {
            throw new Error('Failed to extract new path from copy response');
        }
        await this.wait(2000); // give AEM time to process the copy
        let newFragment = await this.getFragmentByPath(newPath);
        if (newFragment) {
            newFragment = await this.sites.cf.fragments.getById(newFragment.id);
        }
        return newFragment;
    }

    /**
     * Create a new fragment in a given folder
     * @param {*} fragment sample fragment with minimum req fields for creation
     */
    async createFragment(fragment) {
        const { title, name, description, fields } = fragment;
        const parentPath = fragment.parentPath;
        const modelId = fragment.modelId || (fragment.model && fragment.model.id);

        if (!parentPath || !title || !modelId) {
            throw new Error(`Missing data to create a fragment: ${parentPath}, ${title}, ${modelId}`);
        }

        const response = await fetch(`${this.cfFragmentsUrl}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.headers,
            },
            body: JSON.stringify({
                title,
                name,
                modelId,
                parentPath,
                description,
                fields,
            }),
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    throw new UserFriendlyError(errorData.detail);
                }
            } catch (parseError) {}

            throw new Error(`Failed to create fragment: ${response.status} ${response.statusText}`);
        }

        const newFragment = await this.getFragment(response);
        return this.pollCreatedFragment(newFragment);
    }

    /**
     * Publish a fragment
     * @param {Object} fragment
     * @returns {Promise<void>}
     */
    async publishFragment(fragment, publishReferencesWithStatus = ['DRAFT', 'UNPUBLISHED']) {
        const response = await fetch(this.cfPublishUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'If-Match': fragment.etag,
                ...this.headers,
            },
            body: JSON.stringify({
                paths: [fragment.path],
                filterReferencesByStatus: publishReferencesWithStatus,
                workflowModelId: '/var/workflow/models/scheduled_activation_with_references',
            }),
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });
        if (!response.ok) {
            throw new Error(`Failed to publish fragment: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Delete a fragment
     * @param {Object} fragment
     * @returns {Promise<void>}
     */
    async deleteFragment(fragment) {
        const response = await fetch(`${this.cfFragmentsUrl}/${fragment.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'If-Match': fragment.etag,
                ...this.headers,
            },
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });
        if (!response.ok) {
            throw new Error(`Failed to delete fragment: ${response.status} ${response.statusText}`);
        }
        return response; //204 No Content
    }

    async moveFragment(fragment, newParentPath) {
        if (!fragment || !fragment.path || fragment.path.trim() === '') {
            throw new Error('Invalid fragment: missing or empty path');
        }
        
        // Extract the asset name and locale from the path
        const pathParts = fragment.path.split('/');
        const assetName = pathParts.pop();
        
        // Check if the parent folder is a locale folder (e.g., en_US, fr_FR)
        const localePattern = /^[a-z]{2}_[A-Z]{2}$/;
        let locale = '';
        
        if (pathParts.length > 0 && localePattern.test(pathParts[pathParts.length - 1])) {
            locale = pathParts[pathParts.length - 1];
        }
        
        // Build the new path with locale if present
        let finalNewPath = newParentPath;
        if (locale) {
            finalNewPath = `${newParentPath}/${locale}`;
        }
        
        const oldAssetPath = fragment.path.replace('/content/dam/', '');
        const newAssetPath = finalNewPath.replace('/content/dam/', '') + '/' + assetName;
        const url = `${this.baseUrl}/api/assets/${oldAssetPath}`;
        const destination = `/api/assets/${newAssetPath}`;
        
        // Get CSRF token
        const csrfToken = await this.getCsrfToken();
        
        try {
            // First attempt: Try the standard MOVE operation
            const response = await fetch(url, {
                method: 'MOVE',
                headers: {
                    ...this.headers,
                    'Destination': destination,
                    'CSRF-Token': csrfToken,
                },
            }).catch((err) => {
                // If MOVE fails due to CORS, we'll catch it here
                if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
                    throw new Error('CORS_ERROR');
                }
                throw err;
            });
            
            if (!response.ok) {
                throw new Error(`Move failed: ${response.status} ${response.statusText}`);
            }
            
        } catch (err) {
            if (err.message === 'CORS_ERROR' || err.message.includes('Failed to fetch')) {
                // CORS issue detected, try copy + delete approach
                console.log('MOVE blocked by CORS, attempting copy + delete approach');
                
                // Copy the fragment using the create API
                try {
                    // First, get the full fragment data
                    const fullFragment = await this.sites.cf.fragments.getById(fragment.id);
                    
                    // Check if a fragment with the same name already exists and generate unique name
                    let finalAssetName = assetName;
                    let nameAttempt = 0;
                    const maxAttempts = 10;
                    
                    while (nameAttempt < maxAttempts) {
                        try {
                            const checkPath = `${finalNewPath}/${finalAssetName}`;
                            await this.sites.cf.fragments.getByPath(checkPath);
                            // If we get here, the fragment exists, so we need a new name
                            nameAttempt++;
                            
                            // Extract base name and extension if present
                            const lastDotIndex = assetName.lastIndexOf('.');
                            let baseName = assetName;
                            let extension = '';
                            
                            if (lastDotIndex > 0) {
                                baseName = assetName.substring(0, lastDotIndex);
                                extension = assetName.substring(lastDotIndex);
                            }
                            
                            // Generate new name with number suffix
                            finalAssetName = `${baseName}-${nameAttempt}${extension}`;
                            console.warn(`Fragment '${assetName}' already exists. Trying '${finalAssetName}'`);
                        } catch (err) {
                            // Fragment doesn't exist, we can use this name
                            break;
                        }
                    }
                    
                    if (nameAttempt >= maxAttempts) {
                        throw new Error(`Cannot create unique name for fragment after ${maxAttempts} attempts`);
                    }
                    
                    if (nameAttempt > 0) {
                        console.log(`Fragment will be renamed from '${assetName}' to '${finalAssetName}' to avoid conflicts`);
                    }
                    
                    // Create a copy in the new location
                    const copyData = {
                        title: fullFragment.title,
                        description: fullFragment.description,
                        modelId: fullFragment.model.id,
                        parentPath: finalNewPath,
                        name: finalAssetName,
                        fields: fullFragment.fields,
                    };
                    
                    const copyResponse = await fetch(this.cfFragmentsUrl, {
                        method: 'POST',
                        headers: {
                            ...this.headers,
                            'Content-Type': 'application/json',
                            'CSRF-Token': csrfToken,
                        },
                        body: JSON.stringify(copyData),
                    });
                    
                    if (!copyResponse.ok) {
                        const errorText = await copyResponse.text().catch(() => '');
                        throw new Error(`Copy failed: ${copyResponse.status} ${errorText}`);
                    }
                    
                    const copiedFragment = await copyResponse.json();
                    
                    // Wait a bit for the copy to be fully created
                    await this.wait(1000);
                    
                    // Add tags if the original had any
                    if (fullFragment.tags && fullFragment.tags.length > 0) {
                        try {
                            await this.saveTags({ ...copiedFragment, newTags: fullFragment.tags });
                        } catch (tagErr) {
                            console.warn('Failed to copy tags to new fragment:', tagErr);
                            // Don't fail the operation if tags couldn't be copied
                        }
                    }
                    
                    // Now delete the original with fresh ETag
                    try {
                        // Get fresh fragment data with current ETag
                        const freshFragment = await this.getFragmentWithEtag(fragment.id);
                        if (freshFragment) {
                            await this.deleteFragment(freshFragment);
                        } else {
                            console.error('Could not get fresh fragment data for deletion');
                            throw new Error('Could not get fragment data for deletion');
                        }
                    } catch (deleteErr) {
                        console.error('Failed to delete original after copy:', deleteErr);
                        
                        // Try one more time with a delay in case of timing issues
                        await this.wait(1000);
                        try {
                            const retryFragment = await this.getFragmentWithEtag(fragment.id);
                            if (retryFragment) {
                                await this.deleteFragment(retryFragment);
                                console.log('Successfully deleted original on retry');
                            }
                        } catch (retryErr) {
                            console.error('Failed to delete original on retry:', retryErr);
                            // The copy succeeded, so we have a duplicate now
                            // Check if it's a reference error
                            let warningMessage;
                            if (retryErr.message && retryErr.message.includes('referencing it')) {
                                warningMessage = nameAttempt > 0 
                                    ? `Fragment was copied and renamed to '${finalAssetName}'. The original could not be deleted because other content is referencing it. You now have both fragments.`
                                    : `Fragment was copied successfully. The original could not be deleted because other content is referencing it. You now have a duplicate.`;
                            } else {
                                warningMessage = nameAttempt > 0 
                                    ? `Fragment was copied and renamed to '${finalAssetName}' but the original could not be deleted. You now have both fragments.`
                                    : `Fragment was copied but the original could not be deleted. You now have a duplicate.`;
                            }
                            
                            // Store warning to show to user
                            copiedFragment._moveWarning = warningMessage;
                            copiedFragment._renamedTo = finalAssetName; // Store the new name
                        }
                    }
                    
                    // Return the copied fragment with metadata
                    const finalFragment = await this.sites.cf.fragments.getById(copiedFragment.id);
                    if (nameAttempt > 0) {
                        finalFragment._renamedTo = finalAssetName;
                    }
                    if (copiedFragment._moveWarning) {
                        finalFragment._moveWarning = copiedFragment._moveWarning;
                    }
                    return finalFragment;
                    
                } catch (copyErr) {
                    throw new Error(`Alternative move approach failed: ${copyErr.message}`);
                }
            } else {
                throw new Error(`Failed to move fragment: ${err.message}`);
            }
        }
        
        // Wait for move operation to complete
        await this.wait(1000);
        
        // Get the moved fragment
        const newPath = `${finalNewPath}/${assetName}`;
        try {
            const moved = await this.sites.cf.fragments.getByPath(newPath);
            return await this.sites.cf.fragments.getById(moved.id);
        } catch (err) {
            // If we can't find it by path, try searching for it
            console.warn('Could not find moved fragment by path, searching...');
            const searchResults = this.searchFragment({ path: finalNewPath, query: assetName });
            for await (const result of searchResults) {
                if (result.items && result.items.length > 0) {
                    const movedFragment = result.items.find(item => item.name === assetName);
                    if (movedFragment) {
                        return await this.sites.cf.fragments.getById(movedFragment.id);
                    }
                }
            }
            throw new Error('Move operation completed but could not retrieve moved fragment');
        }
    }

    async listFolders(path) {
        const name = path?.replace(/^\/content\/dam/, '');
        const response = await fetch(
            `${this.baseUrl}/bin/querybuilder.json?path=${path}&path.flat=true&type=sling:Folder&p.limit=-1`,
            {
                method: 'GET',
                headers: this.headers,
            },
        ).catch((error) => console.error('Error:', error));
        if (!response.ok) {
            throw new Error(`Failed to list folders: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return {
            self: { name, path },
            children: result.hits.map(({ name, title }) => ({
                name,
                title,
                folderId: `${path}/${name}`,
                path: `${path}/${name}`,
            })),
        };
    }

    async listTags(root) {
        const response = await fetch(
            `${this.baseUrl}/bin/querybuilder.json?path=${root}&type=cq:Tag&orderby=@jcr:path&p.limit=-1`,
            {
                method: 'GET',
                headers: this.headers,
            },
        ).catch((error) => console.error('Error:', error));
        if (!response.ok) {
            throw new Error(`Failed to list tags: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Get fragment by ID with its ETag in a single operation
     * @param {string} id - Fragment ID
     * @returns {Promise<Object>} - Fragment with its etag
     */
    async getFragmentWithEtag(id) {
        if (!id) {
            throw new Error('Fragment ID is required');
        }

        const response = await fetch(`${this.cfFragmentsUrl}/${id}?references=direct-hydrated`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...this.headers,
            },
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (!response.ok) {
            throw new Error(`Failed to get fragment: ${response.status} ${response.statusText}`);
        }

        return await this.getFragment(response);
    }

    sites = {
        cf: {
            fragments: {
                /**
                 * @see AEM#searchFragment
                 */
                search: this.searchFragment.bind(this),
                /**
                 * @see AEM#getFragmentByPath
                 */
                getByPath: this.getFragmentByPath.bind(this),
                /**
                 * @see AEM#getFragmentById
                 */
                getById: (id, abortController) => this.getFragmentById(this.baseUrl, id, this.headers, abortController),
                /**
                 * @see AEM#getFragmentWithEtag
                 */
                getWithEtag: this.getFragmentWithEtag.bind(this),
                /**
                 * @see AEM#saveFragment
                 */
                save: this.saveFragment.bind(this),
                /**
                 * @see AEM#copyFragmentClassic
                 */
                copy: this.copyFragmentClassic.bind(this),
                /**
                 * @see AEM#createFragment
                 */
                create: this.createFragment.bind(this),
                /**
                 * @see AEM#publishFragment
                 */
                publish: this.publishFragment.bind(this),
                /**
                 * @see AEM#deleteFragment
                 */
                delete: this.deleteFragment.bind(this),
                /**
                 * @see AEM#moveFragment
                 */
                move: this.moveFragment.bind(this),
            },
        },
    };
    tags = {
        /**
         * @see AEM#listTags
         */
        list: this.listTags.bind(this),
    };
    folders = {
        /**
         * @see AEM#listFolders
         */
        list: this.listFolders.bind(this),
    };
}

export { filterByTags, AEM };
