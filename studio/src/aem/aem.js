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
        const baseUrl =
            baseUrlOverride || `https://${bucket}.adobeaemcloud.com`;
        this.baseUrl = baseUrl;
        const sitesUrl = `${baseUrl}/adobe/sites`;
        this.cfFragmentsUrl = `${sitesUrl}/cf/fragments`;
        this.cfSearchUrl = `${this.cfFragmentsUrl}/search`;
        this.cfPublishUrl = `${this.cfFragmentsUrl}/publish`;
        this.wcmcommandUrl = `${baseUrl}/bin/wcmcommand`;
        this.csrfTokenUrl = `${baseUrl}/libs/granite/csrf/token.json`;
        this.foldersUrl = `${baseUrl}/adobe/folders`;
        this.foldersClassicUrl = `${baseUrl}/api/assets`;

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
            throw new Error(
                `Failed to get CSRF token: ${response.status} ${response.statusText}`,
            );
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
    async *searchFragment(
        { path, query = '', tags = [], modelIds = [], sort, status },
        limit,
        abortController,
    ) {
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
            const response = await fetch(
                `${this.cfSearchUrl}?${searchParams}`,
                {
                    headers: this.headers,
                    signal: abortController?.signal,
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Search failed: ${response.status} ${response.statusText}`,
                );
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
        const response = await fetch(
            `${baseUrl}/adobe/sites/cf/fragments/${id}?references=direct-hydrated`,
            {
                headers,
                signal: abortController?.signal,
            },
        );
        if (!response.ok) {
            throw new Error(
                `Failed to get fragment: ${response.status} ${response.statusText}`,
            );
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
            throw new Error(
                `Failed to get fragment: ${response.status} ${response.statusText}`,
            );
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
        if (!fragment || !fragment.id) {
            throw new Error('Invalid fragment data for save operation');
        }

        const latestFragment = await this.getFragmentWithEtag(fragment.id);
        if (!latestFragment) {
            throw new Error('Failed to retrieve fragment for update');
        }

        const { title, description, fields } = fragment;
        const isDictionaryFragment = fragment.path?.includes('/dictionary/');

        const payload = isDictionaryFragment
            ? {
                  title: fragment.title || latestFragment.title,
                  description:
                      fragment.description || latestFragment.description || '',
                  fields: fragment.fields || latestFragment.fields || [],
              }
            : { title, description, fields };

        const response = await fetch(`${this.cfFragmentsUrl}/${fragment.id}`, {
            method: 'PUT',
            headers: {
                ...this.headers,
                'Content-Type': 'application/json',
                'If-Match': latestFragment.etag,
            },
            body: JSON.stringify(payload),
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (!response.ok) {
            throw new Error(
                `Failed to save fragment: ${response.status} ${response.statusText}`,
            );
        }

        if (!isDictionaryFragment) {
            await this.saveTags(fragment);
        }

        return isDictionaryFragment
            ? this.getFragment(response)
            : this.pollUpdatedFragment(fragment);
    }

    async saveTags(fragment) {
        const { newTags } = fragment;
        if (!newTags) return;
        // we need this to get the Etag
        const fragmentTags = await fetch(
            `${this.cfFragmentsUrl}/${fragment.id}/tags`,
            {
                method: 'GET',
                headers: this.headers,
            },
        ).catch((err) => {
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

    async pollUpdatedFragment(oldFragment) {
        let attempts = 0;
        while (attempts < MAX_POLL_ATTEMPTS) {
            attempts++;
            const newFragment = await this.sites.cf.fragments.getById(
                oldFragment.id,
            );
            if (newFragment.etag !== oldFragment.etag) return newFragment;
            await this.wait(POLL_TIMEOUT);
        }
        throw new UserFriendlyError(
            'Save completed but the updated fragment could not be retrieved.',
        );
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
            throw new Error(
                `Failed to copy fragment: ${res.status} ${res.statusText}`,
            );
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
        newFragment = await this.sites.cf.fragments.getById(newFragment.id);
        if (newFragment) {
            fragment.updateField(
                'tags',
                fragment.tags.concat(['mas:status/draft']),
            );
            newFragment = await window.aem.sites.cf.fragments.save(fragment);
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
        const modelId =
            fragment.modelId || (fragment.model && fragment.model.id);

        if (!parentPath || !title || !modelId) {
            throw new Error(
                `Missing data to create a fragment: ${parentPath}, ${title}, ${modelId}`,
            );
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

            throw new Error(
                `Failed to create fragment: ${response.status} ${response.statusText}`,
            );
        }

        return await this.getFragment(response);
    }

    /**
     * Publish a fragment
     * @param {Object} fragment
     * @returns {Promise<void>}
     */
    async publishFragment(fragment) {
        const response = await fetch(this.cfPublishUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'If-Match': fragment.etag,
                ...this.headers,
            },
            body: JSON.stringify({
                paths: [fragment.path],
                filterReferencesByStatus: ['DRAFT', 'UNPUBLISHED'],
                workflowModelId:
                    '/var/workflow/models/scheduled_activation_with_references',
            }),
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });
        if (!response.ok) {
            throw new Error(
                `Failed to publish fragment: ${response.status} ${response.statusText}`,
            );
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
            throw new Error(
                `Failed to delete fragment: ${response.status} ${response.statusText}`,
            );
        }
        return response; //204 No Content
    }

    /**
     * @param {*} path
     */
    async listFolders(path) {
        const query = new URLSearchParams({
            path,
        }).toString();

        const response = await fetch(`${this.foldersUrl}/?${query}`, {
            method: 'GET',
            headers: {
                ...this.headers,
                'X-Adobe-Accept-Experimental': '1',
            },
        }).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });
        if (!response.ok) {
            throw new Error(
                `Failed to list folders: ${response.status} ${response.statusText}`,
            );
        }
        return await response.json();
    }

    /**
     * @param {*} path
     */
    async listFoldersClassic(path) {
        const relativePath = path?.replace(/^\/content\/dam/, '');

        const response = await fetch(
            `${this.foldersClassicUrl}${relativePath}.json?limit=1000`, // TODO: this is a workaround until Folders API is fixed.
            {
                method: 'GET',
                headers: { ...this.headers },
            },
        ).catch((err) => {
            throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
        });

        if (!response.ok) {
            throw new Error(
                `Failed to list folders: ${response.status} ${response.statusText}`,
            );
        }
        const {
            properties: { name },
            entities = [],
        } = await response.json();
        return {
            self: { name, path },
            children: entities
                .filter(({ class: [firstClass] }) => /folder/.test(firstClass))
                .map(({ properties: { name, title } }) => ({
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
            throw new Error(
                `Failed to list tags: ${response.status} ${response.statusText}`,
            );
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
            throw new Error(
                `Failed to get fragment: ${response.status} ${response.statusText}`,
            );
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
                getById: (id, abortController) =>
                    this.getFragmentById(
                        this.baseUrl,
                        id,
                        this.headers,
                        abortController,
                    ),
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
        list: this.listFoldersClassic.bind(this),
    };
}

export { filterByTags, AEM };
