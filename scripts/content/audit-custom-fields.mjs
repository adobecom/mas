/**
 * Audits custom field name consistency between default card fragments and their PROMO
 * variations (MWPW-205018). A custom field is addressed downstream by its label
 * (customFieldLabels), so a promo variation whose labels diverge from its default
 * fragment's labels silently breaks any content that references the field by name.
 *
 * For every default card fragment with custom fields under a surface/locale, this finds its
 * promo variations (same path/tag resolution as studio/src/promotions/promotion-model.js) and
 * reports, per pair:
 *   - labels present on the default but missing from the promo variation
 *   - labels present at the same position in both but with a different name
 *
 * READ-ONLY: this script performs no save, publish or delete call — it only lists and compares.
 *
 * Auth: author API needs an IMS token + api key.
 *   export MAS_IMS_TOKEN=<token>   # copy(adobeid.authorize()) from MAS Studio devtools
 *   export MAS_API_KEY=mas-studio  # optional, defaults to mas-studio
 *
 * Usage:
 *   node audit-custom-fields.mjs --surface acom --locale en_US
 *   node audit-custom-fields.mjs --surface acom --locale en_US --bucket author-p22655-e59433
 */

import { createHeaders, parseArgs, listFolderFragments, ROOT_PATH, CARD_MODEL_ID } from './common.js';
import {
    getPromotionTagFromFragment,
    getPromoNameFromTag,
    resolveDefaultPathFromPromoVariation,
    isPromoVariationPath,
} from '../../studio/src/promotions/promotion-model.js';

const DEFAULT_AUTHOR_HOST = 'author-p22655-e59433.adobeaemcloud.com';

const { getFlag } = parseArgs(process.argv);

const surface = getFlag('--surface');
const locale = getFlag('--locale');
const bucket = getFlag('--bucket');
const authorHost = bucket ? `${bucket}.adobeaemcloud.com` : DEFAULT_AUTHOR_HOST;
const token = process.env.MAS_IMS_TOKEN;
const apiKey = process.env.MAS_API_KEY || 'mas-studio';

if (!surface || !locale || !token) {
    console.error(
        'Usage: MAS_IMS_TOKEN=<token> node audit-custom-fields.mjs --surface <surface> --locale <locale> [--bucket author-p22655-e59433]',
    );
    process.exit(1);
}

const baseUrl = `https://${authorHost}`;
const headers = createHeaders(token, apiKey);
const localeRoot = `${ROOT_PATH}/${surface}/${locale}`;

function customFieldLabels(fragment) {
    return (fragment.fields?.find((field) => field.name === 'customFieldLabels')?.values || []).filter(Boolean);
}

// Resolves a promo variation's owning default path by probing each candidate against the
// known default fragment paths (same candidate order used by studio's own resolution).
function resolveDefaultPath(promoVariation, defaultPathsByPath) {
    const promoTagId = getPromotionTagFromFragment(promoVariation);
    const promoName = promoTagId ? getPromoNameFromTag(promoTagId) : null;
    if (!promoName) return null;
    const candidates = resolveDefaultPathFromPromoVariation(promoVariation.path, promoName);
    return candidates.find((candidate) => defaultPathsByPath.has(candidate)) ?? null;
}

console.log(`Author:   ${authorHost}`);
console.log(`Scope:    ${localeRoot}\n`);

const allFragments = await listFolderFragments(baseUrl, headers, localeRoot);
const defaultFragments = allFragments.filter(
    (fragment) => fragment.model?.id === CARD_MODEL_ID && !isPromoVariationPath(fragment.path),
);
const promoVariations = allFragments.filter((fragment) => isPromoVariationPath(fragment.path));

const defaultFragmentsWithCustomFields = defaultFragments.filter((fragment) => customFieldLabels(fragment).length);
const defaultPathsByPath = new Map(defaultFragments.map((fragment) => [fragment.path, fragment]));

console.log(`Default card fragments scanned: ${defaultFragments.length}`);
console.log(`  with custom fields:           ${defaultFragmentsWithCustomFields.length}`);
console.log(`Promo variations scanned:        ${promoVariations.length}\n`);

const variationsByDefaultPath = new Map();
for (const variation of promoVariations) {
    const defaultPath = resolveDefaultPath(variation, defaultPathsByPath);
    if (!defaultPath) continue;
    if (!variationsByDefaultPath.has(defaultPath)) variationsByDefaultPath.set(defaultPath, []);
    variationsByDefaultPath.get(defaultPath).push(variation);
}

let pairsWithMismatch = 0;

for (const defaultFragment of defaultFragmentsWithCustomFields) {
    const defaultLabels = customFieldLabels(defaultFragment);
    const variations = variationsByDefaultPath.get(defaultFragment.path) || [];
    if (!variations.length) continue;

    for (const variation of variations) {
        const promoLabels = customFieldLabels(variation);
        const promoLabelSet = new Set(promoLabels);
        const missingOnPromo = defaultLabels.filter((label) => !promoLabelSet.has(label));

        const positionalDiffs = [];
        const maxLength = Math.max(defaultLabels.length, promoLabels.length);
        for (let i = 0; i < maxLength; i += 1) {
            const defaultLabel = defaultLabels[i];
            const promoLabel = promoLabels[i];
            if (defaultLabel && promoLabel && defaultLabel !== promoLabel) {
                positionalDiffs.push({ index: i, defaultLabel, promoLabel });
            }
        }

        if (!missingOnPromo.length && !positionalDiffs.length) continue;

        pairsWithMismatch += 1;
        console.log(`${defaultFragment.path}`);
        console.log(`  -> ${variation.path}`);
        if (missingOnPromo.length) {
            console.log(`     missing on promo variation: ${missingOnPromo.join(', ')}`);
        }
        for (const diff of positionalDiffs) {
            console.log(`     name differs at index ${diff.index}: default="${diff.defaultLabel}" promo="${diff.promoLabel}"`);
        }
    }
}

console.log(`\n${pairsWithMismatch} default/promo pair(s) with a custom field name mismatch.`);
process.exit(pairsWithMismatch > 0 ? 2 : 0);
