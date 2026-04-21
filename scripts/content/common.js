import { DICTIONARY_ENTRY_MODEL_ID } from '../../studio/src/constants.js';
import { getSurfaceLocales, getLocaleCode } from '../../io/www/src/fragment/locales.js';

export const ROOT_PATH = '/content/dam/mas';

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function getValidLocaleCodes(surface) {
    return new Set(getSurfaceLocales(surface).map(getLocaleCode));
}

export function isDictionaryEntry(fragment) {
    return fragment?.model?.id === DICTIONARY_ENTRY_MODEL_ID;
}

export function createHeaders(accessToken, apiKey) {
    return {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-api-key': apiKey,
    };
}

export async function listLocaleFolders(baseUrl, headers, surfaceName) {
    const path = `${ROOT_PATH}/${surfaceName}`;
    const response = await fetch(`${baseUrl}/bin/querybuilder.json?path=${path}&path.flat=true&type=sling:Folder&p.limit=-1`, {
        headers,
    });
    if (!response.ok) {
        throw new Error(`Failed to list folders: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    return result.hits.map(({ name }) => ({
        name,
        path: `${path}/${name}`,
    }));
}

export async function fetchIndexFragment(baseUrl, headers, indexPath) {
    const params = new URLSearchParams({ path: indexPath });
    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments?${params}`, { headers });
    if (!response.ok) {
        throw new Error(`Failed to get fragment at ${indexPath}: ${response.status} ${response.statusText}`);
    }
    const { items } = await response.json();
    return items?.length ? items[0] : null;
}

// Reference implementation: AEM#searchFragment in studio/src/aem/aem.js
// Uses GET with query serialized as JSON string in 'query' URL param.
export async function listFolderFragments(baseUrl, headers, folderPath) {
    const fragments = [];
    const query = JSON.stringify({ filter: { path: folderPath }, sort: [{ on: 'created', order: 'ASC' }] });
    let cursor = null;
    do {
        const params = new URLSearchParams({ query });
        if (cursor) params.set('cursor', cursor);
        const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/search?${params}`, { headers });
        if (response.status === 404) return fragments;
        if (!response.ok) {
            throw new Error(`Failed to list fragments at ${folderPath}: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        fragments.push(...(result.items ?? []));
        cursor = result.cursor ?? null;
        if (cursor) await wait(1000);
    } while (cursor);
    return fragments;
}
