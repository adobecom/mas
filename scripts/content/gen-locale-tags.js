#!/usr/bin/env node

/**
 * Script to create AEM locale tags.
 * See README.md for full documentation.
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import locale data from the source file
const localesPath = resolve(__dirname, '../../io/www/src/fragment/locales.js');
const { COUNTRY_DATA, LANG_TO_LANGUAGE, ACOM } = await import(localesPath);

const TAG_ROOT = '/content/cq:tags/mas/locale';

/**
 * Build a map of country -> [languages] from ACOM data
 */
function buildCountryToLanguagesMap() {
    const countryToLanguages = new Map();

    for (const entry of ACOM) {
        const { lang, country, regions } = entry;

        // Add primary country
        if (!countryToLanguages.has(country)) {
            countryToLanguages.set(country, new Set());
        }
        countryToLanguages.get(country).add(lang);

        // Add regions
        if (regions) {
            for (const region of regions) {
                if (!countryToLanguages.has(region)) {
                    countryToLanguages.set(region, new Set());
                }
                countryToLanguages.get(region).add(lang);
            }
        }
    }

    // Convert Sets to sorted arrays
    const result = new Map();
    for (const [country, languages] of countryToLanguages) {
        result.set(country, [...languages].sort());
    }

    return result;
}

/**
 * Generate tag definitions based on the locale structure
 */
function generateTagDefinitions() {
    const countryToLanguages = buildCountryToLanguagesMap();
    const tags = [];

    // Root locale tag
    tags.push({
        path: TAG_ROOT,
        name: 'locale',
        title: 'Locale',
    });

    // Sort countries alphabetically
    const sortedCountries = [...countryToLanguages.keys()].sort();

    for (const country of sortedCountries) {
        const languages = countryToLanguages.get(country);
        const countryName = COUNTRY_DATA[country]?.name || country;

        if (languages.length === 1) {
            // Single-locale country: flat tag
            const lang = languages[0];
            const langName = LANG_TO_LANGUAGE[lang] || lang;
            const localeCode = `${lang}_${country}`;

            tags.push({
                path: `${TAG_ROOT}/${localeCode}`,
                name: localeCode,
                title: `${langName} (${countryName})`,
            });
        } else {
            // Multi-locale country: country parent with locale children
            tags.push({
                path: `${TAG_ROOT}/${country}`,
                name: country,
                title: countryName,
            });

            for (const lang of languages) {
                const langName = LANG_TO_LANGUAGE[lang] || lang;
                const localeCode = `${lang}_${country}`;

                tags.push({
                    path: `${TAG_ROOT}/${country}/${localeCode}`,
                    name: localeCode,
                    title: `${langName} (${countryName})`,
                });
            }
        }
    }

    return tags;
}

/**
 * Fetch existing tags from AEM
 */
async function fetchExistingTags(host, token) {
    const url = `${host}/bin/querybuilder.json?path=/content/cq:tags/mas&type=cq:Tag&orderby=@jcr:path&p.limit=-1`;

    console.log(`curl -X GET "${url}" -H "Authorization: ${token}"`);

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: token,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch existing tags: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const existingPaths = new Set();

    if (data.hits) {
        for (const hit of data.hits) {
            existingPaths.add(hit.path);
        }
    }

    return existingPaths;
}

/**
 * Create a single tag via AEM API
 */
async function createTag(host, token, parentTagID, tagName, title) {
    const body = new URLSearchParams({
        'jcr:title': title,
        tag: tagName,
        'jcr:description': '',
        parentTagID: parentTagID,
        _charset_: 'utf-8',
        cmd: 'createTag',
    });

    const response = await fetch(`${host}/bin/tagcommand`, {
        method: 'POST',
        headers: {
            Authorization: token,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    return response;
}

/**
 * Create missing locale tags in AEM
 */
async function createMissingTags(host, token) {
    console.log(`Fetching existing tags from ${host}...`);

    const existingPaths = await fetchExistingTags(host, token);
    console.log(`Found ${existingPaths.size} existing tags.`);
    console.log('');

    const tags = generateTagDefinitions();
    const missingTags = tags.filter((tag) => !existingPaths.has(tag.path));

    if (missingTags.length === 0) {
        console.log('All locale tags already exist. Nothing to create.');
        return;
    }

    console.log(`Creating ${missingTags.length} missing tags (${tags.length - missingTags.length} already exist)...`);
    console.log('');

    let created = 0;
    let failed = 0;

    for (const tag of missingTags) {
        const parentPath = tag.path.substring(0, tag.path.lastIndexOf('/'));

        try {
            const response = await createTag(host, token, parentPath, tag.name, tag.title);

            if (response.ok) {
                console.log(`✓ Created: ${tag.path} (${tag.title})`);
                created++;
            } else {
                const text = await response.text();
                console.error(`✗ Failed: ${tag.path} - ${response.status} ${text}`);
                failed++;
            }
        } catch (error) {
            console.error(`✗ Error: ${tag.path} - ${error.message}`);
            failed++;
        }
    }

    console.log('');
    console.log(`Done. Created: ${created}, Failed: ${failed}`);
}

/**
 * Format output as JSON
 */
function formatAsJson(tags) {
    return JSON.stringify(tags, null, 2);
}

/**
 * Format output as CSV
 */
function formatAsCsv(tags) {
    const lines = ['path,name,title'];

    for (const tag of tags) {
        // Escape quotes in title
        const escapedTitle = tag.title.replace(/"/g, '""');
        lines.push(`"${tag.path}","${tag.name}","${escapedTitle}"`);
    }

    return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    let host = null;
    let format = null;

    for (const arg of args) {
        if (arg.startsWith('--host=')) {
            host = arg.split('=')[1];
        } else if (arg.startsWith('--format=')) {
            format = arg.split('=')[1];
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Usage: node scripts/content/gen-locale-tags.js [options]

Options:
  --host=<URL>     AEM host URL (required for tag creation)
  --format=json    Output JSON array of tag definitions (no creation)
  --format=csv     Output CSV for documentation/review (no creation)
  --help, -h       Show this help message

Environment variables:
  MAS_ACCESS_TOKEN  Authorization token, e.g., "Bearer eyJ..." (required for tag creation)

The script will:
  1. Fetch existing tags from AEM using the querybuilder API
  2. Compare with the required locale tags
  3. Create only the missing tags

Examples:
  # Create missing tags in AEM
  export MAS_ACCESS_TOKEN="Bearer eyJ..."
  node scripts/content/gen-locale-tags.js --host=https://author-p22655-e155390.adobeaemcloud.com

  # Export tag definitions
  node scripts/content/gen-locale-tags.js --format=json > locale-tags.json
  node scripts/content/gen-locale-tags.js --format=csv > locale-tags.csv
`);
            process.exit(0);
        }
    }

    // If format is specified, output and exit
    if (format) {
        const tags = generateTagDefinitions();
        let output;
        switch (format) {
            case 'json':
                output = formatAsJson(tags);
                break;
            case 'csv':
                output = formatAsCsv(tags);
                break;
            default:
                console.error(`Unknown format: ${format}`);
                process.exit(1);
        }
        console.log(output);
        return;
    }

    // Otherwise, create tags in AEM
    const accessToken = process.env.MAS_ACCESS_TOKEN;
    if (!host || !accessToken) {
        console.error('Error: --host and MAS_ACCESS_TOKEN environment variable are required for tag creation.');
        console.error('Use --help for usage information.');
        process.exit(1);
    }

    await createMissingTags(host, `Bearer ${accessToken}`);
}

main();
