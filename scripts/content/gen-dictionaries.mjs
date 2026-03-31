/**
 * This script creates dictionary index fragments for all locale folders under a given surface.
 * e.g: node gen-dictionaries.mjs author-*-* sandbox L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25hcnk
 */

import { getDefaultLocaleCode, getSurfaceLocales, getLocaleCode } from '../../io/www/src/fragment/locales.js';

const ROOT_PATH = '/content/dam/mas';

const args = process.argv.slice(2);
const bucket = args[0];
const surface = args[1];
const modelId = args[2];
const dryRun = args.includes('--dry-run');

const accessToken = process.env.MAS_ACCESS_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!bucket || !surface || !modelId || !accessToken || !apiKey) {
    console.error('Usage: node gen-dictionaries.mjs <bucket> <surface> <modelId> [--dry-run]');
    console.error('Ensure MAS_ACCESS_TOKEN and MAS_API_KEY are set as environment variables.');
    process.exit(1);
}

const baseUrl = `https://${bucket}.adobeaemcloud.com`;
const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'x-api-key': apiKey,
};

function getParentReference(localeName) {
    const defaultLocaleCode = getDefaultLocaleCode(surface, localeName);
    if (!defaultLocaleCode || defaultLocaleCode === localeName) return null;
    return `${ROOT_PATH}/${surface}/${defaultLocaleCode}/dictionary/index`;
}

async function listLocaleFolders(surfaceName) {
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

async function fetchIndexFragment(indexPath) {
    const params = new URLSearchParams({ path: indexPath });
    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments?${params}`, { headers });
    if (!response.ok) {
        throw new Error(`Failed to get fragment at ${indexPath}: ${response.status} ${response.statusText}`);
    }
    const { items } = await response.json();
    return items?.length ? items[0] : null;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkFolderExists(folderPath) {
    const parentPath = folderPath.slice(0, folderPath.lastIndexOf('/'));
    const folderName = folderPath.slice(parentPath.length + 1);
    const response = await fetch(
        `${baseUrl}/bin/querybuilder.json?path=${parentPath}&path.flat=true&type=sling:Folder&p.limit=-1`,
        { headers },
    );
    if (!response.ok) return false;
    const { hits } = await response.json();
    return hits?.some((h) => h.name === folderName) ?? false;
}

async function ensureDictionaryFolder(dictionaryPath) {
    const exists = await checkFolderExists(dictionaryPath);

    if (dryRun) {
        console.log(`[dry-run] dictionary folder ${exists ? 'already exists' : 'will be created'}: ${dictionaryPath}`);
        return;
    }

    if (exists) {
        console.log(`dictionary folder already exists: ${dictionaryPath}`);
        return;
    }

    const response = await fetch(`${baseUrl}/adobe/folders`, {
        method: 'POST',
        headers,
        body: JSON.stringify([{ path: dictionaryPath, title: 'dictionary' }]),
    });

    if (!response.ok && response.status !== 409) {
        throw new Error(`Failed to create folder: ${response.status} ${response.statusText}`);
    }
    console.log(`dictionary folder created: ${dictionaryPath}`);
    await wait(5000);
}

async function createIndexFragment(parentPath, parentReference = null) {
    const fields = [
        {
            name: 'parent',
            type: 'content-fragment',
            multiple: false,
            locked: false,
            values: parentReference ? [parentReference] : [],
        },
        {
            name: 'entries',
            type: 'content-fragment',
            multiple: true,
            values: [],
        },
    ];

    const payload = {
        parentPath,
        modelId,
        name: 'index',
        title: 'Dictionary Index',
        description: 'Index of dictionary placeholders',
        fields,
    };

    if (dryRun) {
        console.log(
            `[dry-run] would create index at ${parentPath}/index${parentReference ? ` (parent: ${parentReference})` : ''}`,
        );
        return null;
    }

    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create fragment: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    await wait(5000);
    return result;
}

async function updateFragmentParent(fragment, parentReference) {
    const updatedFields = fragment.fields.map((field) =>
        field.name === 'parent' ? { ...field, values: parentReference ? [parentReference] : [] } : field,
    );

    if (dryRun) {
        console.log(`[dry-run] would update parent to: ${parentReference ?? '(none)'}`);
        return;
    }

    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/${fragment.id}`, {
        method: 'PUT',
        headers: { ...headers, 'If-Match': fragment.etag },
        body: JSON.stringify({ title: fragment.title, description: fragment.description, fields: updatedFields }),
    });

    if (!response.ok) {
        throw new Error(`Failed to update fragment: ${response.status} ${response.statusText}`);
    }
    await wait(5000);
}

async function publishFragment(fragment) {
    const payload = {
        paths: [fragment.path],
        filterReferencesByStatus: [],
    };

    if (dryRun) {
        console.log(`[dry-run] would publish ${fragment.path}`);
        return;
    }

    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/publish`, {
        method: 'POST',
        headers: {
            ...headers,
            'If-Match': fragment.etag,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Failed to publish fragment: ${response.status} ${response.statusText}`);
    }
    await wait(5000);
}

async function run() {
    if (dryRun) console.log('[dry-run] No POST requests will be made.\n');

    const validLocaleCodes = new Set(getSurfaceLocales(surface).map(getLocaleCode));
    const localeFolders = await listLocaleFolders(surface);
    console.log(`Found ${localeFolders.length} folders for surface '${surface}'`);

    const existingIndexes = [];
    const missingIndexes = [];
    const updatedIndexes = [];

    for (const folder of localeFolders) {
        if (!validLocaleCodes.has(folder.name)) {
            console.log(`[${folder.name}] not a locale folder, skipping`);
            continue;
        }
        const dictionaryPath = `${folder.path}/dictionary`;
        const indexPath = `${dictionaryPath}/index`;
        try {
            const existing = await fetchIndexFragment(indexPath);
            const parentReference = getParentReference(folder.name);
            if (existing) {
                existingIndexes.push(indexPath);
                const currentParent = existing.fields?.find((f) => f.name === 'parent')?.values?.[0] ?? null;
                if (currentParent === parentReference) {
                    console.log(`[${folder.name}] index exists, parent is correct, skipping`);
                    continue;
                }
                console.log(`[${folder.name}] current parent: ${currentParent ?? '(none)'}`);
                console.log(`[${folder.name}] new parent:     ${parentReference ?? '(none)'}`);
                updatedIndexes.push(
                    `[${folder.name}] current parent: ${currentParent ?? '(none)'}, new parent: ${parentReference ?? '(none)'}`,
                );
                await updateFragmentParent(existing, parentReference);
                if (!dryRun) console.log(`[${folder.name}] parent updated`);
                continue;
            } else {
                missingIndexes.push(indexPath);
                console.log(`[${folder.name}] index not found`);
            }
            await ensureDictionaryFolder(dictionaryPath);
            const created = await createIndexFragment(dictionaryPath, parentReference);
            if (created) {
                console.log(`[${folder.name}] created index fragment`);
                await publishFragment(created);
                console.log(`[${folder.name}] published index fragment`);
            }
        } catch (error) {
            console.error(`[${folder.name}] error: ${error.message}`);
        }
    }

    console.log('\nExisting indexes:', JSON.stringify(existingIndexes, null, 2));
    console.log('\nMissing indexes (to be created):', JSON.stringify(missingIndexes, null, 2));
    console.log('\nUpdated indexes (parent changed):', JSON.stringify(updatedIndexes, null, 2));
    console.log('Done.');
}

run();
