import { UserFriendlyError } from '../utils.js';
import { COLLECTION_MODEL_PATH } from '../constants.js';

const NETWORK_ERROR_MESSAGE = 'Network error';
const MAX_POLL_ATTEMPTS = 10;
const POLL_TIMEOUT = 250;
const MAX_NAME_ATTEMPTS = 10;
const COPY_WAIT_TIME = 1000;

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
    async *searchFragment({ path, query = '', tags = [], modelIds = [], sort, status, createdBy }, limit, abortController) {
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
        if (createdBy?.length > 0) {
            filter.created ??= {};
            filter.created.by = createdBy.reduce((acc, curr) => {
                acc.push(curr, curr.toUpperCase());
                return acc;
            }, []);
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
                body: JSON.stringify({ tags: newTags }),
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

        const isCollection = oldFragment.model?.path === COLLECTION_MODEL_PATH;
        const oldDefaultChild = isCollection
            ? oldFragment.fields?.find((f) => f.name === 'defaultchild')?.values?.[0]
            : undefined;

        while (attempts < MAX_POLL_ATTEMPTS) {
            attempts++;
            const newFragment = await this.sites.cf.fragments.getById(oldFragment.id);

            if (!newFragment) {
                await this.wait(POLL_TIMEOUT);
                continue;
            }

            const newDefaultChild = isCollection
                ? newFragment.fields?.find((f) => f.name === 'defaultchild')?.values?.[0]
                : undefined;
            const defaultChildChanged = isCollection && oldDefaultChild !== newDefaultChild;

            const wasModified = newFragment.modified !== oldFragment.modified;

            if (newFragment.etag !== oldFragment.etag || defaultChildChanged || wasModified) {
                return newFragment;
            }
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
     * Publish multiple fragments in a single request
     * @param {Array<Object>} fragments - Array of fragment objects
     * @param {Array<string>} publishReferencesWithStatus - Statuses to include references for
     * @returns {Promise<void>}
     */
    async publishFragments(fragments, publishReferencesWithStatus = ['DRAFT', 'UNPUBLISHED']) {
        if (!fragments || fragments.length === 0) {
            throw new Error('No fragments provided to publish');
        }

        // Use the first fragment's etag for the If-Match header
        const etag = fragments[0].etag;
        const paths = fragments.map((fragment) => fragment.path);

        const response = await fetch(this.cfPublishUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'If-Match': etag,
                ...this.headers,
            },
            body: JSON.stringify({
                paths,
                filterReferencesByStatus: publishReferencesWithStatus,
                workflowModelId: '/var/workflow/models/scheduled_activation_with_references',
            }),
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });
        if (!response.ok) {
            throw new Error(`Failed to publish fragments: ${response.status} ${response.statusText}`);
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

    /**
     * Validates that a fragment has the required properties for copying
     * @param {Object} fragment - The fragment to validate
     * @throws {Error} If fragment is invalid
     */
    validateFragmentForCopy(fragment) {
        if (!fragment?.path?.trim()) {
            throw new Error('Invalid fragment: missing or empty path');
        }
    }

    async ensureFolderExists(folderPath) {
        try {
            const response = await fetch(`${this.baseUrl}${folderPath}.json`, {
                method: 'GET',
                headers: this.headers,
            });

            if (response.ok) {
                return true;
            }

            if (response.status === 404) {
                const csrfToken = await this.getCsrfToken();
                const pathParts = folderPath.split('/').filter(Boolean);
                let currentPath = '';

                for (const part of pathParts) {
                    if (currentPath.startsWith('/content/dam/mas')) {
                        const testPath = `${currentPath}/${part}`;
                        const checkResponse = await fetch(`${this.baseUrl}${testPath}.json`, {
                            method: 'GET',
                            headers: this.headers,
                        });

                        if (!checkResponse.ok && checkResponse.status === 404) {
                            const formData = new FormData();
                            formData.append('jcr:primaryType', 'sling:Folder');
                            formData.append('jcr:title', part);

                            const createResponse = await fetch(`${this.baseUrl}${currentPath}/${part}`, {
                                method: 'POST',
                                headers: {
                                    ...this.headers,
                                    'CSRF-Token': csrfToken,
                                },
                                body: formData,
                            });

                            if (!createResponse.ok) {
                                throw new Error(`Failed to create folder ${part}: ${createResponse.statusText}`);
                            }
                        }
                    }
                    currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
                }
                return true;
            }

            throw new Error(`Failed to check folder: ${response.statusText}`);
        } catch (err) {
            throw new Error(`Error ensuring folder exists: ${err.message}`);
        }
    }

    /**
     * Generates a unique name by appending a number suffix if the name already exists
     * @param {string} basePath - The target directory path
     * @param {string} assetName - The desired asset name
     * @returns {Promise<{name: string, renamed: boolean}>} The final name and whether it was renamed
     */
    async generateUniqueName(basePath, assetName) {
        let finalName = assetName;
        let attempt = 0;

        while (attempt < MAX_NAME_ATTEMPTS) {
            try {
                await this.sites.cf.fragments.getByPath(`${basePath}/${finalName}`);
                // Name exists, generate new one
                attempt++;
                const dotIndex = assetName.lastIndexOf('.');
                const [base, ext] =
                    dotIndex > 0 ? [assetName.substring(0, dotIndex), assetName.substring(dotIndex)] : [assetName, ''];
                finalName = `${base}-${attempt}${ext}`;
            } catch {
                // Name available
                return { name: finalName, renamed: attempt > 0 };
            }
        }

        throw new Error(`Cannot create unique name after ${MAX_NAME_ATTEMPTS} attempts`);
    }

    /**
     * Creates a copy of a fragment in the specified location
     * @param {Object} fullFragment - The complete fragment data to copy
     * @param {string} targetPath - The destination path for the copy
     * @param {string} name - The name for the copied fragment
     * @param {string} csrfToken - CSRF token for authentication
     * @returns {Promise<Object>} The newly created fragment
     */
    async createFragmentCopy(fullFragment, targetPath, name, csrfToken) {
        const fields = fullFragment.fields.filter((field) => field.name !== 'originalId');

        const copyData = {
            title: fullFragment.title,
            description: fullFragment.description,
            modelId: fullFragment.model.id,
            parentPath: targetPath,
            name,
            fields,
        };

        const response = await fetch(this.cfFragmentsUrl, {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken,
            },
            body: JSON.stringify(copyData),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Copy failed: ${response.status} ${errorText}`);
        }

        return response.json();
    }

    /**
     * Copies tags from the original fragment to the copied fragment
     * @param {Object} copiedFragment - The newly copied fragment
     * @param {Array} tags - Array of tags to copy
     * @returns {Promise<void>}
     */
    async copyFragmentTags(copiedFragment, tags) {
        if (!tags?.length) return;

        try {
            const tagIds = tags.map((tag) => tag.id || tag);
            await this.saveTags({ ...copiedFragment, newTags: tagIds });
        } catch {
            // Silent fail - tags are not critical
        }
    }

    /**
     * Copies a fragment to a new folder location with optional renaming and locale support
     * The copied fragment is always created in draft status
     * @param {Object} fragment - The fragment to copy (must have path and id properties)
     * @param {string} targetPath - The destination folder path
     * @param {string} customName - Optional custom name for the copied fragment
     * @param {string} targetLocale - Target locale (defaults to 'en_US')
     * @returns {Promise<Object>} The copied fragment with metadata
     */
    async copyToFolder(fragment, targetPath, customName = null, targetLocale = 'en_US') {
        this.validateFragmentForCopy(fragment);

        const originalName = fragment.path.split('/').pop();
        const assetName = customName || originalName;
        const finalTargetPath = `${targetPath}/${targetLocale}`;

        const csrfToken = await this.getCsrfToken();

        try {
            await this.ensureFolderExists(finalTargetPath);

            const fullFragment = await this.sites.cf.fragments.getById(fragment.id);
            const { name: finalName, renamed } = await this.generateUniqueName(finalTargetPath, assetName);

            const copiedFragment = await this.createFragmentCopy(fullFragment, finalTargetPath, finalName, csrfToken);

            await this.wait(COPY_WAIT_TIME);
            await this.copyFragmentTags(copiedFragment, fullFragment.tags);

            const finalFragment = await this.sites.cf.fragments.getById(copiedFragment.id);

            if (renamed) {
                finalFragment.renamedTo = finalName;
            }

            return finalFragment;
        } catch (err) {
            throw new Error(`Failed to copy fragment: ${err.message}`);
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

    async createFolder(parentPath, name, title = name) {
        const payload = [
            {
                path: `${parentPath}/${name}`,
                title,
            },
        ];
        const response = await fetch(`${this.baseUrl}/adobe/folders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: this.headers.Authorization,
                'cache-control': 'no-cache',
                'x-api-key': 'mas-studio',
            },
            body: JSON.stringify(payload),
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (response.status === 409) {
            return null;
        }

        if (!response.ok) {
            let detail;
            try {
                const errorData = await response.json();
                detail = errorData?.detail;
                if (detail) throw new UserFriendlyError(detail);
            } catch (parseError) {}
            throw new Error(`Failed to create folder: ${response.status} ${response.statusText}`);
        }

        try {
            return await response.json();
        } catch (error) {
            return null;
        }
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

        const response = await fetch(`${this.cfFragmentsUrl}/${id}`, {
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

    /**
     * Get fragment versions following Adobe AEM API specification
     * @param {string} id - Fragment ID
     * @param {Object} options - Query options
     * @param {number} [options.limit] - Maximum number of versions to return
     * @param {number} [options.offset] - Number of versions to skip
     * @param {string} [options.sort] - Sort order (e.g., 'created:desc')
     * @returns {Promise<Object>} Versions response with items array
     */
    async getFragmentVersions(id, options = { limit: 50, sort: 'created:desc' }) {
        if (!id) {
            throw new Error('Fragment ID is required');
        }

        const queryParams = new URLSearchParams();
        if (options.limit) queryParams.append('limit', options.limit);
        if (options.offset) queryParams.append('offset', options.offset);
        if (options.sort) queryParams.append('sort', options.sort);

        const url = `${this.cfFragmentsUrl}/${id}/versions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: this.headers,
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (!response.ok) {
            throw new Error(`Failed to get fragment versions: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Get a specific fragment version by version ID
     * @param {string} fragmentId - Fragment ID
     * @param {string} versionId - Version ID
     * @returns {Promise<Object>} Version data
     */
    async getFragmentVersion(fragmentId, versionId) {
        if (!fragmentId || !versionId) {
            throw new Error('Fragment ID and Version ID are required');
        }

        const response = await fetch(`${this.cfFragmentsUrl}/${fragmentId}/versions/${versionId}`, {
            method: 'GET',
            headers: this.headers,
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (!response.ok) {
            throw new Error(`Failed to get fragment version: ${response.status} ${response.statusText}`);
        }

        return await this.getFragment(response);
    }

    /**
     * Create a new version of a fragment
     * @param {string} id - Fragment ID
     * @param {Object} versionData - Version data
     * @param {string} [versionData.label] - Version label
     * @param {string} [versionData.comment] - Version comment
     * @returns {Promise<Object>} Created version
     */
    async createFragmentVersion(id, versionData = {}) {
        if (!id) {
            throw new Error('Fragment ID is required');
        }

        const response = await fetch(`${this.cfFragmentsUrl}/${id}/versions`, {
            method: 'POST',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(versionData),
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (!response.ok) {
            throw new Error(`Failed to create fragment version: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Update version metadata (title and comment)
     * @param {string} fragmentId - Fragment ID
     * @param {string} versionId - Version ID
     * @param {Object} versionData - Updated version data (title, comment)
     * @returns {Promise<Object>} the updated version
     */
    async updateFragmentVersion(fragmentId, versionId, versionData = {}) {
        if (!fragmentId || !versionId) {
            throw new Error('Fragment ID and Version ID are required');
        }

        const response = await fetch(`${this.cfFragmentsUrl}/${fragmentId}/versions/${versionId}`, {
            method: 'PUT',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(versionData),
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (!response.ok) {
            throw new Error(`Failed to update fragment version: ${response.status} ${response.statusText}`);
        }

        return await response.json();
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
                 * @see AEM#publishFragments
                 */
                publishFragments: this.publishFragments.bind(this),
                /**
                 * @see AEM#deleteFragment
                 */
                delete: this.deleteFragment.bind(this),
                /**
                 * @see AEM#getFragmentVersions
                 */
                getVersions: this.getFragmentVersions.bind(this),
                /**
                 * @see AEM#getFragmentVersion
                 */
                getVersion: this.getFragmentVersion.bind(this),
                /**
                 * @see AEM#createFragmentVersion
                 */
                createVersion: this.createFragmentVersion.bind(this),
                /**
                 * @see AEM#updateFragmentVersion
                 */
                updateVersion: this.updateFragmentVersion.bind(this),
                /**
                 * @see AEM#copyToFolder
                 */
                copyToFolder: this.copyToFolder.bind(this),
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
        /**
         * @see AEM#createFolder
         */
        create: this.createFolder.bind(this),
    };
}

export { filterByTags, AEM };
