/**
 * Creates the offer baseline fragment (offer model) of a product arrangement from its MCS merchandising data (MWPW-186204):
 * /content/dam/mas/offers/<locale>/baselines/<productArrangementCode>/baseline
 * e.g: node create-offer-baseline.mjs author-p22655-e59433 phsp_direct_individual --locale=en_US --dry-run
 */

import { ROOT_PATH, createHeaders, fetchIndexFragment, parseArgs } from './common.js';

const OFFER_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL29mZmVy';
const AOS_URL = 'https://aos.adobe.io/offers';
const AOS_API_KEY = 'wcms-commerce-ims-user-prod';

const cli = parseArgs(process.argv);
const [bucket, productArrangementCode] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const locale = cli.getFlag('--locale') ?? 'en_US';
const dryRun = process.argv.includes('--dry-run');
const accessToken = process.env.MAS_ACCESS_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!bucket || !productArrangementCode || !accessToken || !apiKey) {
    console.error('Usage: node create-offer-baseline.mjs <bucket> <productArrangementCode> [--locale=en_US] [--dry-run]');
    console.error('Ensure MAS_ACCESS_TOKEN and MAS_API_KEY are set as environment variables.');
    process.exit(1);
}

const baseUrl = `https://${bucket}.adobeaemcloud.com`;
const headers = createHeaders(accessToken, apiKey);
const baselinesPath = `${ROOT_PATH}/offers/${locale}/baselines`;
const folderPath = `${baselinesPath}/${productArrangementCode}`;

async function fetchMerchandising() {
    const [, country] = locale.split('_');
    const params = new URLSearchParams({
        api_key: AOS_API_KEY,
        country,
        merchant: 'ADOBE',
        service_providers: 'MERCHANDISING',
        locale,
        landscape: 'PUBLISHED',
        arrangement_code: productArrangementCode,
        page_size: '1',
    });
    const response = await fetch(`${AOS_URL}?${params}`);
    if (!response.ok) throw new Error(`Failed to fetch MCS data: ${response.status} ${response.statusText}`);
    const [offer] = await response.json();
    if (!offer?.merchandising) throw new Error(`No merchandising data for ${productArrangementCode} in ${locale}`);
    return offer.merchandising;
}

const text = (name, value) => ({ name, type: 'text', multiple: false, values: value ? [value] : [] });
const texts = (name, values) => ({ name, type: 'text', multiple: true, values });
const longText = (name, value) => ({
    name,
    type: 'long-text',
    multiple: false,
    mimeType: 'text/plain',
    values: value ? [value] : [],
});

function buildFields({ copy, assets, links, fulfillable_items: fulfillableItems }) {
    // svg first, then raster renditions
    const icons = Object.entries(assets?.icons ?? {})
        .sort(([a], [b]) => (a === 'svg' ? -1 : b === 'svg' ? 1 : 0))
        .map(([, url]) => url);
    const linkValues = Object.entries(links ?? {}).flatMap(([type, entries]) =>
        entries.map((link) => JSON.stringify({ type, ...link })),
    );
    return [
        text('name', copy.name),
        text('shortName', copy.short_name),
        text('internalName', copy.internal_name),
        longText('description', copy.description),
        longText('shortDescription', copy.short_description),
        texts('icons', icons),
        texts('backgroundImages', Object.values(assets?.background_images ?? {})),
        { name: 'links', type: 'long-text', multiple: true, mimeType: 'text/plain', values: linkValues },
        texts(
            'includedApps',
            (fulfillableItems ?? []).map(({ code }) => code),
        ),
        text('paCode', productArrangementCode),
    ];
}

async function ensureFolder(path, title) {
    const response = await fetch(`${baseUrl}/adobe/folders`, {
        method: 'POST',
        headers,
        body: JSON.stringify([{ path, title }]),
    });
    if (!response.ok && response.status !== 409) {
        throw new Error(`Failed to create folder ${path}: ${response.status} ${response.statusText}`);
    }
}

async function run() {
    const merchandising = await fetchMerchandising();
    const payload = {
        parentPath: folderPath,
        modelId: OFFER_MODEL_ID,
        name: 'baseline',
        title: `${merchandising.copy.name} (${productArrangementCode})`,
        description: `MCS baseline for ${productArrangementCode}`,
        fields: buildFields(merchandising),
    };
    if (dryRun) {
        console.log(`[dry-run] would create ${folderPath}/baseline with:\n${JSON.stringify(payload, null, 2)}`);
        return;
    }
    const existing = await fetchIndexFragment(baseUrl, headers, `${folderPath}/baseline`);
    if (existing) {
        console.log(`offer baseline already exists: ${existing.path} (${existing.id})`);
        return;
    }
    await ensureFolder(baselinesPath, 'baselines');
    await ensureFolder(folderPath, productArrangementCode);
    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        throw new Error(`Failed to create offer baseline: ${response.status} ${await response.text()}`);
    }
    const { id, path } = await response.json();
    console.log(`offer baseline created: ${path} (${id})`);
}

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
