/**
 * Bulk-publishes content fragments by invoking the deployed bulk-publish IO Runtime action.
 *
 * Usage:
 *   export MAS_IMS_TOKEN="your-ims-token"    # copy(adobeid.authorize()) from MAS Studio devtools
 *   node bulk-publish.mjs \
 *       --paths-file paths.txt \
 *       --namespace <io-runtime-namespace> \
 *       --odin-endpoint https://<aem-author-host> \
 *       [--locales fr_FR,de_DE] \
 *       [--action-url https://<workspace>.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/bulk-publish] \
 *       [--concurrency 5] \
 *       [--dry-run]
 *
 * The action validates the token against the `mas-studio` allowedClientId, so the token
 * must come from an MAS Studio session (same token the UI uses).
 */

import { readFile } from 'node:fs/promises';
import { parseArgs } from './common.js';

const { getFlag, hasFlag } = parseArgs(process.argv);

const pathsFile = getFlag('--paths-file');
const namespace = getFlag('--namespace');
const odinEndpoint = getFlag('--odin-endpoint');
const actionUrlOverride = getFlag('--action-url');
const localesArg = getFlag('--locales');
const concurrencyArg = getFlag('--concurrency');
const dryRun = hasFlag('--dry-run');
const token = process.env.MAS_IMS_TOKEN;

if (!pathsFile || !odinEndpoint || (!namespace && !actionUrlOverride) || !token) {
    console.error('Usage:');
    console.error(
        '  MAS_IMS_TOKEN=<token> node bulk-publish.mjs --paths-file <file> --namespace <ns> --odin-endpoint <url> [--locales fr_FR,de_DE] [--concurrency 5] [--dry-run]',
    );
    console.error(
        '  MAS_IMS_TOKEN=<token> node bulk-publish.mjs --paths-file <file> --action-url <url> --odin-endpoint <url> ...',
    );
    process.exit(1);
}

const actionUrl = actionUrlOverride || `https://${namespace}.adobeioruntime.net/api/v1/web/MerchAtScaleStudio/bulk-publish`;

const paths = (await readFile(pathsFile, 'utf8'))
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

if (paths.length === 0) {
    console.error(`No paths found in ${pathsFile}.`);
    process.exit(1);
}

const acomEnUs = paths.filter((p) => p.includes('/acom/en_US/'));
if (acomEnUs.length > 0) {
    console.error(`FATAL: ${acomEnUs.length} /acom/en_US/ paths in ${pathsFile} — refusing to publish.`);
    acomEnUs.slice(0, 5).forEach((p) => console.error(`  ${p}`));
    process.exit(1);
}

const locales = localesArg
    ? localesArg
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
    : undefined;
const payload = {
    paths,
    aemOdinEndpoint: odinEndpoint,
    ...(locales?.length ? { locales } : {}),
    ...(concurrencyArg ? { concurrencyLimit: concurrencyArg } : {}),
};

console.log(`POST ${actionUrl}`);
console.log(`  paths:        ${paths.length} (from ${pathsFile})`);
console.log(`  locales:      ${locales?.join(', ') || '(none — source paths only)'}`);
console.log(`  odinEndpoint: ${odinEndpoint}`);
console.log(`  expansion:    ${paths.length * (locales ? locales.length + 1 : 1)} resolved paths expected`);

if (dryRun) {
    console.log('\n[dry-run] Not invoking action. Payload:');
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
}

const started = Date.now();
const response = await fetch(actionUrl, {
    method: 'POST',
    headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
});

const elapsed = ((Date.now() - started) / 1000).toFixed(2);
const text = await response.text();
let body;
try {
    body = JSON.parse(text);
} catch {
    body = text;
}

if (!response.ok) {
    console.error(`\n[${elapsed}s] HTTP ${response.status} ${response.statusText}`);
    console.error(typeof body === 'string' ? body : JSON.stringify(body, null, 2));
    process.exit(1);
}

const { summary, details } = body ?? {};
console.log(`\n[${elapsed}s] HTTP ${response.status}`);
if (summary) {
    console.log(
        `Summary: total=${summary.total} published=${summary.published} skipped=${summary.skipped} failed=${summary.failed}`,
    );
}

if (Array.isArray(details)) {
    const failed = details.filter((d) => d.status === 'failed');
    if (failed.length > 0) {
        console.log(`\nFailed (${failed.length}):`);
        for (const d of failed) {
            console.log(`  - ${d.path}  reason=${d.reason ?? 'n/a'}${d.retries ? `  retries=${d.retries}` : ''}`);
        }
        process.exit(2);
    }
}
