const { buildReplaceRowsFromFindResults } = require('./csv.js');
const { getValues } = require('../common.js');
const { SCOPE_FIELDS } = require('./search.js');

function resolveReplaceRows(findItems, userCsvRows, findParams = {}) {
    return buildReplaceRowsFromFindResults(findItems, userCsvRows, findParams);
}

function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceInValue(value, find, replace, matchCase) {
    if (typeof value !== 'string' || !find) return value;
    const replacement = () => replace;
    if (matchCase) return value.replaceAll(find, replacement);
    return value.replace(new RegExp(escapeRegExp(find), 'gi'), replacement);
}

function normalizeEtag(etag) {
    if (etag == null || etag === '') return '';
    const text = String(etag).trim();
    if (text.startsWith('"') && text.endsWith('"')) return text.slice(1, -1);
    return text;
}

function valuesMatch(current, expected, matchCase) {
    if (typeof current !== 'string' || typeof expected !== 'string') return false;
    if (matchCase) return current === expected;
    return current.toLowerCase() === expected.toLowerCase();
}

function resolveReplaceTargets(field) {
    if (field === 'tags' || field === 'key') return [];
    if (field === 'title' || field === 'fragmentTitle') return [{ kind: 'property', name: 'title' }];
    if (field === 'fragmentDescription') return [{ kind: 'property', name: 'description' }];
    if (field === 'description') {
        return [
            { kind: 'field', name: 'description' },
            { kind: 'property', name: 'description' },
        ];
    }
    const scope = SCOPE_FIELDS[field];
    if (scope) {
        if (scope.tags) return [];
        return [
            ...(scope.fields || []).map((name) => ({ kind: 'field', name })),
            ...(scope.properties || []).map((name) => ({ kind: 'property', name })),
        ];
    }
    return [{ kind: 'field', name: field }];
}

function applyCsvValuesToFragment(fragment, rows, { matchCase = false } = {}) {
    const fields = (fragment.fields || []).map((field) => ({ ...field, values: [...(field.values || [])] }));
    const fieldByName = new Map(fields.map((field) => [field.name, field]));
    let { title, description } = fragment;
    const rowStatuses = [];

    for (const row of rows) {
        const replace = row.replace ?? '';
        const targets = resolveReplaceTargets(row.field);
        if (!replace || !targets.length) {
            rowStatuses.push({
                fragment_id: row.fragment_id,
                field: row.field,
                find: row.find,
                status: 'SKIPPED',
            });
            continue;
        }
        let rowChanged = false;
        for (const target of targets) {
            if (target.kind === 'field') {
                const field = fieldByName.get(target.name);
                if (!field) continue;
                for (let i = 0; i < field.values.length; i += 1) {
                    if (!valuesMatch(field.values[i], row.find, matchCase)) continue;
                    if (field.values[i] !== replace) {
                        field.values[i] = replace;
                        rowChanged = true;
                    }
                }
            } else if (target.name === 'title') {
                if (valuesMatch(title, row.find, matchCase) && title !== replace) {
                    title = replace;
                    rowChanged = true;
                }
            } else if (target.name === 'description') {
                if (valuesMatch(description, row.find, matchCase) && description !== replace) {
                    description = replace;
                    rowChanged = true;
                }
            }
        }
        rowStatuses.push({
            fragment_id: row.fragment_id,
            field: row.field,
            find: row.find,
            status: rowChanged ? 'REPLACED' : 'SKIPPED',
        });
    }

    const patches = buildPatchBody(fragment, { fields, title, description });
    return { fields, title, description, patches, changed: patches.length > 0, rowStatuses };
}

function buildPatchBody(original, applied) {
    const ops = [];
    for (const field of applied.fields || []) {
        const orig = (original.fields || []).find((item) => item.name === field.name);
        const origValues = orig?.values || [];
        if (JSON.stringify(origValues) !== JSON.stringify(field.values)) {
            const located = getValues(original, field.name);
            if (located?.path) {
                ops.push({ op: 'replace', path: `${located.path}/values`, value: field.values });
            }
        }
    }
    if (original.title !== applied.title) {
        ops.push({ op: 'replace', path: '/title', value: applied.title ?? '' });
    }
    if (original.description !== applied.description) {
        ops.push({ op: 'replace', path: '/description', value: applied.description ?? '' });
    }
    return ops;
}

function buildWorkPlan(userRows) {
    const byFragment = new Map();
    for (const row of userRows || []) {
        const replace = row.replace ?? '';
        if (!replace || replace === row.find) continue;
        let item = byFragment.get(row.fragment_id);
        if (!item) {
            item = { id: row.fragment_id, path: row.path, locale: row.locale, etag: row.etag, rows: [] };
            byFragment.set(row.fragment_id, item);
        }
        item.rows.push({
            fragment_id: row.fragment_id,
            field: row.field,
            find: row.find,
            replace,
        });
    }
    return [...byFragment.values()].sort((a, b) => a.id.localeCompare(b.id));
}

module.exports = {
    escapeRegExp,
    replaceInValue,
    normalizeEtag,
    valuesMatch,
    resolveReplaceTargets,
    resolveReplaceRows,
    applyCsvValuesToFragment,
    applyReplacementsToFragment: applyCsvValuesToFragment,
    buildPatchBody,
    buildWorkPlan,
};
