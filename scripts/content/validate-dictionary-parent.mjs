import { getDefaultLocaleCode, getSurfaceLocales, getLocaleCode } from '../../io/www/src/fragment/locales.js';

const ROOT_PATH = '/content/dam/mas';

const args = process.argv.slice(2);
const bucket = args[0];
const surface = args[1];
const dryRun = args.includes('--dry-run');
const live = args.includes('--live');

const accessToken = process.env.MAS_ACCESS_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!bucket || !surface || !accessToken || !apiKey) {
    console.error('Usage: node validate-dictionary-parent.mjs <bucket> <surface> [--dry-run] [--live]');
    console.error('Ensure MAS_ACCESS_TOKEN and MAS_API_KEY are set as environment variables.');
    process.exit(1);
}

const authorBaseUrl = `https://${bucket}.adobeaemcloud.com`;
const liveBaseUrl = 'https://odin.adobe.com';

const authorHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'x-api-key': apiKey,
};

function getExpectedParent(localeName) {
    const defaultLocaleCode = getDefaultLocaleCode(surface, localeName);
    if (!defaultLocaleCode || defaultLocaleCode === localeName) {
        if (surface !== 'acom') {
            return `${ROOT_PATH}/acom/${localeName}/dictionary/index`;
        }
        return null;
    }
    return `${ROOT_PATH}/${surface}/${defaultLocaleCode}/dictionary/index`;
}

async function listLocaleFolders(surfaceName) {
    const path = `${ROOT_PATH}/${surfaceName}`;
    const response = await fetch(
        `${authorBaseUrl}/bin/querybuilder.json?path=${path}&path.flat=true&type=sling:Folder&p.limit=-1`,
        { headers: authorHeaders },
    );
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
    if (live) {
        const response = await fetch(`${liveBaseUrl}/adobe/sites/cf/fragments?${params}`);
        if (response.status === 404) return null;
        if (!response.ok) {
            throw new Error(`Failed to get fragment at ${indexPath}: ${response.status} ${response.statusText}`);
        }
        const { items } = await response.json();
        return items?.length ? items[0] : null;
    }
    const response = await fetch(`${authorBaseUrl}/adobe/sites/cf/fragments?${params}`, { headers: authorHeaders });
    if (!response.ok) {
        throw new Error(`Failed to get fragment at ${indexPath}: ${response.status} ${response.statusText}`);
    }
    const { items } = await response.json();
    return items?.length ? items[0] : null;
}

async function run() {
    if (dryRun) console.log('[dry-run] Read-only validation — no changes will be made.\n');
    if (live) console.log(`[live] Fetching fragments from ${liveBaseUrl}\n`);

    const validLocaleCodes = new Set(getSurfaceLocales(surface).map(getLocaleCode));
    const localeFolders = await listLocaleFolders(surface);
    console.log(`Found ${localeFolders.length} folders for surface '${surface}'\n`);

    const results = { correct: [], wrong: [], missing: [], skipped: [] };

    for (const folder of localeFolders) {
        if (!validLocaleCodes.has(folder.name)) {
            results.skipped.push(folder.name);
            console.log(`[${folder.name}] not a locale folder, skipping`);
            continue;
        }

        const indexPath = `${folder.path}/dictionary/index`;
        const expectedParent = getExpectedParent(folder.name);

        try {
            const fragment = await fetchIndexFragment(indexPath);

            if (!fragment) {
                results.missing.push(folder.name);
                console.log(`[${folder.name}] MISSING — index fragment not found at ${indexPath}`);
                continue;
            }

            const currentParent = fragment.fields?.find((f) => f.name === 'parent')?.values?.[0] ?? null;

            if (currentParent === expectedParent) {
                results.correct.push(folder.name);
                console.log(`[${folder.name}] OK — parent is correct: ${currentParent ?? '(none)'}`);
            } else {
                results.wrong.push({
                    locale: folder.name,
                    current: currentParent ?? '(none)',
                    expected: expectedParent ?? '(none)',
                });
                console.log(`[${folder.name}] MISMATCH`);
                console.log(`  current:  ${currentParent ?? '(none)'}`);
                console.log(`  expected: ${expectedParent ?? '(none)'}`);
            }
        } catch (error) {
            console.error(`[${folder.name}] ERROR: ${error.message}`);
        }
    }

    console.log('\n─── Summary ───────────────────────────────────────');
    console.log(`  Correct:  ${results.correct.length}`);
    console.log(`  Mismatch: ${results.wrong.length}`);
    console.log(`  Missing:  ${results.missing.length}`);
    console.log(`  Skipped:  ${results.skipped.length}`);

    if (results.wrong.length) {
        console.log('\nMismatched locales:');
        for (const { locale, current, expected } of results.wrong) {
            console.log(`  [${locale}] current: ${current} → expected: ${expected}`);
        }
    }

    if (results.missing.length) {
        console.log('\nMissing index fragments:', results.missing.join(', '));
    }

    console.log('\nDone.');
}

run();
