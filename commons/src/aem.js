import { Fragment } from '../../studio/src/store/Fragment.js';

/**
 * Search for content fragments
 * @param {Object} params - The search options
 * @param {string} [params.path] - The path to search in
 * @param {string} [params.query] - The search query
 * @returns {Promise<Array>} - A promise that resolves to an array of search results
 */
export async function searchFragment({ path, query }) {
    const filter = {};
    if (path) {
        filter.path = path;
    }
    if (query) {
        filter.fullText = {
            text: encodeURIComponent(query),
            queryMode: 'EXACT_WORDS',
        };
    }
    const accessToken = window.adobeid.authorize();
    const headers = {
        Authorization: `Bearer ${accessToken}`,
        pragma: 'no-cache',
        'cache-control': 'no-cache',
    };
    const searchParams = new URLSearchParams({
        query: JSON.stringify({ filter }),
    }).toString();
    return fetch(`${this.cfSearchUrl}?${searchParams}`, {
        headers,
    })
        .then((res) => res.json())
        .then(({ items }) => {
            return items.map((item) => {
                const data = item.fields.reduce(
                    (acc, { name, multiple, values }) => {
                        acc[name] = multiple ? values : values[0];
                        return acc;
                    },
                    {},
                );
                data.path = item.path;
                data.model = item.model;
                return data;
            });
        });
}

/**
 * @param {string} path fragment path
 * @returns the raw fragment item
 */
export async function getFragmentByPath(path) {
    return fetch(`${this.cfFragmentsUrl}?path=${path}`, {
        headers,
    })
        .then((res) => res.json())
        .then(({ items: [item] }) => item);
}

/**
 * Save given fragment
 * @param {Fragment} fragment
 */
export async function saveFragment(fragment) {}

class AEM {
    sites = {
        cf: {
            fragments: {
                search: searchFragment.bind(this),
                getCfByPath: getFragmentByPath.bind(this),
                save: saveFragment.bind(this),
            },
        },
    };

    constructor(bucket) {
        const baseUrl = `https://${bucket}.adobeaemcloud.com`;
        const sitesUrl = `${baseUrl}/adobe/sites`;
        this.cfFragmentsUrl = `${sitesUrl}/cf/fragments`;
        this.cfSearchUrl = `${this.cfFragmentsUrl}/search`;
    }
}

export { AEM };
