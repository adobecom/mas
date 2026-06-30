#!/usr/bin/env node
/**
 * Seed script — creates test fragment structure for bulk-publish snapshot/revert testing.
 *
 * Structure created:
 *   test-collection (collection)
 *   ├── card-1 (card)
 *   └── sub-collection (collection)
 *       ├── card-2 (card)
 *       └── card-3 (card)
 *           ├── card-3 [en_CA] (locale variation)
 *           └── card-3 [en_IE] (locale variation)
 *
 * Usage:
 *   AEM_BASE_URL=https://author-p22655-e59471.adobeaemcloud.com \
 *   IMS_TOKEN=<your_token> \
 *   node scripts/seed-test-data.mjs
 *
 * Get IMS token from browser DevTools:
 *   sessionStorage.getItem('imsToken') or check Studio network requests for Authorization header
 */

const AEM_BASE_URL = process.env.AEM_BASE_URL ?? 'https://author-p22655-e59433.adobeaemcloud.com';
const IMS_TOKEN = process.env.IMS_TOKEN;

if (!IMS_TOKEN) {
    console.error('❌  IMS_TOKEN env var is required');
    process.exit(1);
}

const CARD_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ';
const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';

const CF_URL = `${AEM_BASE_URL}/adobe/sites/cf/fragments`;
const TS = Date.now();
const UID = Math.random().toString(36).slice(2, 6).toUpperCase();
const BASE_PATH = `/content/dam/mas/sandbox/en_US/test-bulk-${TS}`;

const headers = {
    Authorization: `Bearer ${IMS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Adobe-Accept-Experimental': '1',
};

// ─── helpers ────────────────────────────────────────────────────────────────

async function getCsrfToken() {
    const res = await fetch(`${AEM_BASE_URL}/libs/granite/csrf/token.json`, { headers });
    if (!res.ok) throw new Error(`getCsrfToken: ${res.status}`);
    const { token } = await res.json();
    return token;
}

async function ensureFolder(folderPath) {
    const checkRes = await fetch(`${AEM_BASE_URL}${folderPath}.json`, { headers });
    if (checkRes.ok) return; // already exists

    const csrfToken = await getCsrfToken();
    const parts = folderPath.split('/').filter(Boolean);
    let current = '';
    for (const part of parts) {
        if (current.startsWith('/content/dam/mas')) {
            const testPath = `${current}/${part}`;
            const check = await fetch(`${AEM_BASE_URL}${testPath}.json`, { headers });
            if (!check.ok && check.status === 404) {
                const fd = new FormData();
                fd.append('jcr:primaryType', 'sling:Folder');
                fd.append('jcr:title', part);
                const create = await fetch(`${AEM_BASE_URL}${current}/${part}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${IMS_TOKEN}`, 'CSRF-Token': csrfToken },
                    body: fd,
                });
                if (!create.ok && create.status !== 409) throw new Error(`ensureFolder(${testPath}): ${create.status}`);
                console.log(`  ✓ folder   ${testPath}`);
            }
        }
        current = `${current}/${part}`;
    }
}

async function createFragment({ parentPath, title, name, modelId, fields = [] }) {
    const res = await fetch(CF_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ parentPath, title, name, modelId, fields }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`createFragment(${name}): ${res.status} ${text}`);
    }
    const etag = res.headers.get('ETag');
    const fragment = await res.json();
    console.log(`  ✓ created  ${fragment.path}`);
    return { ...fragment, etag };
}

async function getFragmentWithEtag(id) {
    const res = await fetch(`${CF_URL}/${id}`, { headers });
    if (!res.ok) throw new Error(`getFragment(${id}): ${res.status}`);
    const etag = res.headers.get('ETag');
    const fragment = await res.json();
    return { ...fragment, etag };
}

async function updateFields(fragment, updatedFields) {
    const { id, etag, fields: currentFields } = fragment;
    const merged = currentFields.map((f) => {
        const update = updatedFields.find((u) => u.name === f.name);
        return update ? { ...f, values: update.values } : f;
    });
    // add fields that don't exist yet
    for (const u of updatedFields) {
        if (!merged.find((f) => f.name === u.name)) merged.push(u);
    }

    const res = await fetch(`${CF_URL}/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'If-Match': etag },
        body: JSON.stringify({ title: fragment.title, fields: merged }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`updateFields(${id}): ${res.status} ${text}`);
    }
    const newEtag = res.headers.get('ETag');
    const updated = await res.json();
    console.log(`  ✓ updated  ${updated.path}`);
    return { ...updated, etag: newEtag };
}

async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\nAEM: ${AEM_BASE_URL}`);
    console.log(`UID: ${UID}`);
    console.log(`Base path: ${BASE_PATH}\n`);

    // 0. ensure folders exist
    console.log('Creating folders...');
    await ensureFolder(BASE_PATH);
    await ensureFolder(BASE_PATH.replace('/en_US/', '/en_CA/'));
    await ensureFolder(BASE_PATH.replace('/en_US/', '/en_IE/'));

    // 1. card-1 (no variations)
    console.log('Creating card-1...');
    const card1 = await createFragment({
        parentPath: BASE_PATH,
        title: `[${UID}] Test Card 1`,
        name: 'card-1',
        modelId: CARD_MODEL_ID,
    });

    await sleep(500);

    // 2. card-2 (no variations, inside sub-collection)
    console.log('Creating card-2...');
    const card2 = await createFragment({
        parentPath: BASE_PATH,
        title: `[${UID}] Test Card 2`,
        name: 'card-2',
        modelId: CARD_MODEL_ID,
    });

    await sleep(500);

    // 3. card-3 base fragment (en_US)
    console.log('Creating card-3 (en_US)...');
    const card3 = await createFragment({
        parentPath: BASE_PATH,
        title: `[${UID}] Test Card 3`,
        name: 'card-3',
        modelId: CARD_MODEL_ID,
    });

    await sleep(500);

    // 4. card-3 variation — en_CA
    const caPath = BASE_PATH.replace('/en_US/', '/en_CA/');
    console.log('Creating card-3 variation (en_CA)...');
    const card3VarCa = await createFragment({
        parentPath: caPath,
        title: `[${UID}] Test Card 3`,
        name: 'card-3',
        modelId: CARD_MODEL_ID,
    });

    await sleep(500);

    // 5. card-3 variation — en_IE
    const iePath = BASE_PATH.replace('/en_US/', '/en_IE/');
    console.log('Creating card-3 variation (en_IE)...');
    const card3VarIe = await createFragment({
        parentPath: iePath,
        title: `[${UID}] Test Card 3`,
        name: 'card-3',
        modelId: CARD_MODEL_ID,
    });

    await sleep(500);

    // 6. link variations to card-3
    console.log('Linking variations to card-3...');
    const card3Fresh = await getFragmentWithEtag(card3.id);
    await updateFields(card3Fresh, [{ name: 'variations', values: [card3VarCa.path, card3VarIe.path] }]);

    await sleep(500);

    // 7. sub-collection
    console.log('Creating sub-collection...');
    const subColl = await createFragment({
        parentPath: BASE_PATH,
        title: `[${UID}] Test Sub-Collection`,
        name: 'sub-collection',
        modelId: COLLECTION_MODEL_ID,
        fields: [
            { name: 'label', type: 'text', multiple: false, values: [`[${UID}] Test Sub-Collection`] },
            { name: 'cards', type: 'content-fragment', multiple: true, values: [card2.path, card3.path] },
        ],
    });

    await sleep(500);

    // 8. top-level test-collection
    console.log('Creating test-collection...');
    const testColl = await createFragment({
        parentPath: BASE_PATH,
        title: `[${UID}] Test Collection`,
        name: 'test-collection',
        modelId: COLLECTION_MODEL_ID,
        fields: [
            { name: 'label', type: 'text', multiple: false, values: [`[${UID}] Test Collection`] },
            { name: 'cards', type: 'content-fragment', multiple: true, values: [card1.path] },
            { name: 'collections', type: 'content-fragment', multiple: true, values: [subColl.path] },
        ],
    });

    await sleep(500);

    console.log('\n✅  Done!\n');
    console.log('Fragment paths:');
    console.log(`  collection:     ${testColl.path}`);
    console.log(`  card-1:         ${card1.path}`);
    console.log(`  sub-collection: ${subColl.path}`);
    console.log(`  card-2:         ${card2.path}`);
    console.log(`  card-3 (en_US): ${card3.path}`);
    console.log(`  card-3 (en_CA): ${card3VarCa.path}`);
    console.log(`  card-3 (en_IE): ${card3VarIe.path}`);
    console.log(`\nAdd this collection path to a bulk-publish project:\n  ${testColl.path}`);
}

main().catch((err) => {
    console.error('\n❌', err.message);
    process.exit(1);
});
