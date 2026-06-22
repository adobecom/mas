const { flattenResultsToRows } = require('./csv.js');
const { SCOPE_FIELDS } = require('./search.js');

function resolveReplaceRows(findItems, userCsvRows) {
    if (userCsvRows?.length) return userCsvRows;
    return flattenResultsToRows(findItems);
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

function resolveReplaceTargets(field) {
    if (field === 'tags' || field === 'key') return [];
    if (field === 'title' || field === 'fragmentTitle') return [{ kind: 'property', name: 'title' }];
    if (field === 'fragmentDescription') return [{ kind: 'property', name: 'description' }];
    // '*'-mode matches label both the product-description field and the CF description
    // property as 'description'; rewrite either wherever `find` occurs.
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

function applyReplacementsToFragment(fragment, rows, { matchCase = false, searchFind } = {}) {
    const fields = (fragment.fields || []).map((field) => ({ ...field, values: [...(field.values || [])] }));
    const fieldByName = new Map(fields.map((field) => [field.name, field]));
    let { title, description } = fragment;
    let changed = false;
    const rowStatuses = [];

    for (const row of rows) {
        const needle = searchFind ?? row.find;
        const replace = row.replace ?? '';
        let rowChanged = false;
        for (const target of resolveReplaceTargets(row.field)) {
            if (target.kind === 'field') {
                const field = fieldByName.get(target.name);
                if (!field) continue;
                for (let i = 0; i < field.values.length; i += 1) {
                    const next = replaceInValue(field.values[i], needle, replace, matchCase);
                    if (next !== field.values[i]) {
                        field.values[i] = next;
                        rowChanged = true;
                    }
                }
            } else if (target.name === 'title') {
                const next = replaceInValue(title, needle, replace, matchCase);
                if (next !== title) {
                    title = next;
                    rowChanged = true;
                }
            } else if (target.name === 'description') {
                const next = replaceInValue(description, needle, replace, matchCase);
                if (next !== description) {
                    description = next;
                    rowChanged = true;
                }
            }
        }
        if (rowChanged) changed = true;
        rowStatuses.push({
            fragment_id: row.fragment_id,
            field: row.field,
            find: row.find,
            status: rowChanged ? 'REPLACED' : 'SKIPPED',
        });
    }

    return { fields, title, description, changed, rowStatuses };
}

function buildWorkPlan(userRows, replaceValue, searchFind) {
    const replace = replaceValue ?? '';
    if (!replace || !searchFind || replace === searchFind) return [];
    const byFragment = new Map();
    for (const row of userRows || []) {
        let item = byFragment.get(row.fragment_id);
        if (!item) {
            item = { id: row.fragment_id, path: row.path, locale: row.locale, rows: [] };
            byFragment.set(row.fragment_id, item);
        }
        item.rows.push({ fragment_id: row.fragment_id, field: row.field, find: row.find, replace });
    }
    return [...byFragment.values()].sort((a, b) => a.id.localeCompare(b.id));
}

module.exports = {
    escapeRegExp,
    replaceInValue,
    resolveReplaceTargets,
    resolveReplaceRows,
    applyReplacementsToFragment,
    buildWorkPlan,
};
