/**
 * This script checks that all dictionary entry fragments in each locale's dictionary folder
 * are referenced in the dictionary index 'entries' field.
 * e.g: node repair-dictionary-entry.mjs author-*-* sandbox [locale]
 */

import {
    wait,
    createHeaders,
    getValidLocaleCodes,
    listLocaleFolders,
    fetchIndexFragment,
    listFolderFragments,
    isDictionaryEntry,
} from './common.js';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const bucket = positional[0];
const surface = positional[1];
const locale = positional[2];
const dryRun = args.includes('--dry-run');
const publish = args.includes('--publish');

const accessToken = process.env.MAS_ACCESS_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!bucket || !surface || !accessToken || !apiKey) {
    console.error('Usage: node repair-dictionary-entry.mjs <bucket> <surface> [locale] [--dry-run] [--publish]');
    console.error('Ensure MAS_ACCESS_TOKEN and MAS_API_KEY are set as environment variables.');
    process.exit(1);
}

const baseUrl = `https://${bucket}.adobeaemcloud.com`;
const headers = createHeaders(accessToken, apiKey);

async function publishFragment(fragment) {
    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/publish`, {
        method: 'POST',
        headers: { ...headers, 'If-Match': fragment.etag },
        body: JSON.stringify({ paths: [fragment.path], filterReferencesByStatus: [] }),
    });
    if (!response.ok) {
        throw new Error(`Failed to publish fragment: ${response.status} ${response.statusText}`);
    }
    await wait(1000);
}

async function addMissingEntries(index, missingPaths) {
    const updatedFields = index.fields.map((field) => {
        if (field.name !== 'entries') return field;
        return { ...field, values: [...(field.values ?? []), ...missingPaths] };
    });
    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/${index.id}`, {
        method: 'PUT',
        headers: { ...headers, 'If-Match': index.etag },
        body: JSON.stringify({ title: index.title, description: index.description, fields: updatedFields }),
    });
    if (!response.ok) {
        throw new Error(`Failed to update index: ${response.status} ${response.statusText}`);
    }
    const updated = await response.json();
    updated.etag = response.headers.get('Etag');
    await wait(1000);
    return updated;
}

async function run() {
    if (dryRun) console.log('[dry-run] No changes will be made.\n');

    const validLocaleCodes = getValidLocaleCodes(surface);
    const localeFolders = await listLocaleFolders(baseUrl, headers, surface);
    console.log(
        `Found ${localeFolders.length} folders for surface '${surface}'${locale ? `, processing locale '${locale}'` : ''}`,
    );

    for (const folder of localeFolders) {
        if (locale && folder.name !== locale) continue;
        if (!validLocaleCodes.has(folder.name)) {
            console.log(`[${folder.name}] not a locale folder, skipping`);
            continue;
        }
        const dictionaryPath = `${folder.path}/dictionary`;
        const indexPath = `${dictionaryPath}/index`;
        try {
            const index = await fetchIndexFragment(baseUrl, headers, indexPath);
            await wait(1000);
            if (!index) {
                console.log(`[${folder.name}] index not found, skipping`);
                continue;
            }

            const indexEntries = new Set(index.fields?.find((f) => f.name === 'entries')?.values ?? []);
            const children = await listFolderFragments(baseUrl, headers, dictionaryPath);
            await wait(1000);

            const missingPaths = [];
            for (const child of children) {
                if (child.path === indexPath) continue;
                if (!isDictionaryEntry(child)) continue;
                if (!indexEntries.has(child.path)) {
                    console.log(`[${folder.name}] missing from index entries: ${child.path}`);
                    missingPaths.push(child.path);
                }
            }

            if (missingPaths.length === 0) continue;

            if (dryRun) {
                console.log(`[dry-run] would add ${missingPaths.length} missing entries to index`);
            } else {
                const updated = await addMissingEntries(index, missingPaths);
                console.log(`[${folder.name}] added ${missingPaths.length} missing entries to index`);
                if (publish) {
                    await publishFragment(updated);
                    console.log(`[${folder.name}] published index`);
                }
            }
        } catch (error) {
            console.error(`[${folder.name}] error: ${error.message}`);
        }
    }

    console.log('Done.');
}

run();
