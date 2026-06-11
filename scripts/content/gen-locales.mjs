/**
 * This script creates locale tree for a given surface, bucket(env) in Odin.
 * Locales are sourced from locales.js for the given surface.
 * e.g: node gen-locales.mjs author-p22655-e155390 ccd [--dry-run]
 */

import { fileURLToPath } from 'url';
import { getSurfaceLocales, getLocaleCode } from '../../io/www/src/fragment/locales.js';

const ROOT_PATH = '/content/dam/mas';

async function listExistingFolders(baseUrl, headers, surface) {
    const path = `${ROOT_PATH}/${surface}`;
    const response = await fetch(`${baseUrl}/bin/querybuilder.json?path=${path}&path.flat=true&type=sling:Folder&p.limit=-1`, {
        headers,
    });
    if (!response.ok) throw new Error(`Failed to list folders: ${response.status} ${response.statusText}`);
    const { hits } = await response.json();
    return new Set(hits.map(({ name }) => name));
}

export async function run({ bucket, surface, dryRun = false, accessToken, apiKey }) {
    const locales = getSurfaceLocales(surface).map(getLocaleCode);
    if (!locales.length) throw new Error(`No locales found for surface '${surface}'`);

    const baseUrl = `https://${bucket}.adobeaemcloud.com`;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-api-key': apiKey,
    };

    if (dryRun) console.log('[dry-run] No POST requests will be made.\n');

    const existingNames = await listExistingFolders(baseUrl, headers, surface);
    const existing = [];
    const toCreate = [];

    for (const locale of locales) {
        if (existingNames.has(locale)) {
            existing.push(`${ROOT_PATH}/${surface}/${locale}`);
        } else {
            toCreate.push(locale);
        }
    }

    console.log(`Found ${existing.length} existing, ${toCreate.length} to create for surface '${surface}'`);

    const batchSize = 5;
    for (let i = 0; i < toCreate.length; i += batchSize) {
        const batch = toCreate.slice(i, i + batchSize).map((locale) => ({
            path: `${ROOT_PATH}/${surface}/${locale}`,
            title: locale,
        }));

        if (dryRun) {
            console.log(`[dry-run] would create folders: ${batch.map((b) => b.path).join(', ')}`);
            continue;
        }

        const response = await fetch(`${baseUrl}/adobe/folders/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(batch),
        });

        if (response.ok) {
            console.log(`Batch processed successfully: ${batch.map((b) => b.path).join(', ')}`);
        } else {
            const errorText = await response.text();
            console.error(`Failed to process batch: ${JSON.stringify(batch)}`, response.status, errorText);
            throw new Error(`Failed to process batch: ${response.status}`);
        }
    }

    console.log('\nExisting folders:', JSON.stringify(existing, null, 2));
    console.log(
        '\nFolders to create:',
        JSON.stringify(
            toCreate.map((l) => `${ROOT_PATH}/${surface}/${l}`),
            null,
            2,
        ),
    );
    console.log('\nDone.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const positional = args.filter((a) => !a.startsWith('--'));
    const [bucket, surface] = positional;
    const dryRun = args.includes('--dry-run');
    const accessToken = process.env.MAS_ACCESS_TOKEN;
    const apiKey = process.env.MAS_API_KEY;

    if (!bucket || !surface || !accessToken || !apiKey) {
        console.error('Usage: node gen-locales.mjs <bucket> <surface> [--dry-run]');
        console.error('Ensure MAS_ACCESS_TOKEN and MAS_API_KEY are set as environment variables.');
        process.exit(1);
    }

    run({ bucket, surface, dryRun, accessToken, apiKey });
}
