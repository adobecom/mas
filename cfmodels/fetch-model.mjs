/**
 * Fetches a Content Fragment Model definition from AEM and writes a simplified
 * field summary (fieldLabel/type/options) into cfmodels/<technicalName>.model.json.
 *
 * Usage:
 *   node fetch-model.mjs <bucket> <modelPath> [--raw]
 *
 * Example:
 *   node fetch-model.mjs author-p22655-e59433 /conf/mas/settings/dam/cfm/models/promotion
 *
 * Env vars (see cfmodels/README.md):
 *   MAS_ACCESS_TOKEN, MAS_API_KEY
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const bucket = args[0];
const modelPath = args[1];
const dumpRaw = args.includes('--raw');

const accessToken = process.env.MAS_ACCESS_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!bucket || !modelPath || !accessToken || !apiKey) {
    console.error('Usage: node fetch-model.mjs <bucket> <modelPath> [--raw]');
    console.error('Example: node fetch-model.mjs author-p22655-e59433 /conf/mas/settings/dam/cfm/models/promotion');
    console.error('Ensure MAS_ACCESS_TOKEN and MAS_API_KEY are set as environment variables.');
    process.exit(1);
}

const baseUrl = `https://${bucket}.adobeaemcloud.com`;
const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'x-api-key': apiKey,
};

// Content Fragment Models are stored as a Granite dialog (cq:dialog/content/items/<nodeId>),
// one child per field, keyed by an arbitrary node name (not the field name). Each field node
// carries the real field name in `name`, its display text in `fieldLabel`, and its type in
// `valueType` (e.g. "string", "string[]", "calendar/datetime", "string/tags[]",
// "string/content-fragment[]", "string/multiline", "string/reference", "string/enum").
// Enum options live under `optionsmultifield.item0..N.{fieldValue,fieldLabel}`.
const VALUE_TYPE_MAP = {
    string: 'string',
    'calendar/datetime': 'datetime',
    'string/tags': 'tag',
    'string/content-fragment': 'content-fragment',
    'string/multiline': 'long-text',
    'string/reference': 'content-reference',
    boolean: 'boolean',
    long: 'number',
    double: 'number',
    decimal: 'number',
};

// Most widgets carry their display text in `fieldLabel`, but a few widget types don't:
// checkboxes (booleans) use `text`, and the RTE multieditor widget uses `cfm-element`.
function fieldLabelOf(field) {
    return field.fieldLabel ?? field.text ?? field['cfm-element'] ?? field.name;
}

function simplifyField(field) {
    const fieldLabel = fieldLabelOf(field);

    if (field.valueType === 'string/enum') {
        const optionNodes = Object.values(field.optionsmultifield ?? {}).filter((node) => node?.fieldValue !== undefined);
        return {
            fieldLabel,
            type: 'enum',
            options: optionNodes.map((node) => ({ label: node.fieldLabel, value: node.fieldValue })),
        };
    }

    const multiple = field.valueType?.endsWith('[]') ?? false;
    const baseValueType = multiple ? field.valueType.slice(0, -2) : field.valueType;
    const baseType = VALUE_TYPE_MAP[baseValueType] ?? baseValueType;

    return {
        fieldLabel,
        type: multiple ? `${baseType}[]` : baseType,
    };
}

async function fetchModel() {
    const response = await fetch(`${baseUrl}${modelPath}/jcr:content/model.infinity.json`, { headers });
    if (!response.ok) {
        throw new Error(`Failed to fetch model ${modelPath}: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

async function run() {
    const raw = await fetchModel();
    const items = raw?.['cq:dialog']?.content?.items ?? {};
    const fields = Object.values(items).filter((node) => typeof node === 'object' && typeof node?.name === 'string');

    if (fields.length === 0) {
        console.warn(`No fields found in response for ${modelPath}. Check --raw output if this looks wrong.`);
    }

    const simplified = {};
    for (const field of fields) {
        simplified[field.name] = simplifyField(field);
    }

    const technicalName = modelPath.split('/').pop();
    const outPath = join(__dirname, `${technicalName}.model.json`);
    await writeFile(outPath, `${JSON.stringify(simplified, null, 4)}\n`);
    console.log(`Wrote ${outPath}`);

    if (dumpRaw) {
        const rawPath = join(__dirname, `${technicalName}.model.raw.json`);
        await writeFile(rawPath, `${JSON.stringify(raw, null, 4)}\n`);
        console.log(`Wrote ${rawPath}`);
    }
}

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
