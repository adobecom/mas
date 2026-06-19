const HEADERS = ['fragment_id', 'path', 'locale', 'field', 'find', 'replace', 'etag', 'status'];

function escape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function parseJobIdParam(raw) {
    if (raw == null || raw === '') return { jobId: raw, wantsCsv: false };
    const text = String(raw);
    if (text.endsWith('.csv')) {
        return { jobId: text.slice(0, -4), wantsCsv: true };
    }
    return { jobId: text, wantsCsv: false };
}

function rowKey({ fragment_id, field, find }) {
    return `${fragment_id}|${field}|${find}`;
}

function matchRowKey(fragmentId, match) {
    return rowKey({ fragment_id: fragmentId, field: match.field, find: match.value });
}

function flattenResultsToRows(results) {
    const rows = [];
    for (const item of results || []) {
        for (const match of item.matches || []) {
            rows.push({
                fragment_id: item.id,
                path: item.path,
                locale: item.locale,
                field: match.field,
                find: match.value,
                replace: '',
                etag: item.etag,
                status: item.status,
            });
        }
    }
    return rows;
}

function filterResultsByUserCsv(results, userRows) {
    if (!userRows?.length) return results || [];
    const allowed = new Set(userRows.map((row) => rowKey(row)));
    const filtered = [];
    for (const item of results || []) {
        const matches = (item.matches || []).filter((match) => allowed.has(matchRowKey(item.id, match)));
        if (matches.length) {
            filtered.push({ ...item, matches });
        }
    }
    return filtered;
}

function buildResultRowKeys(results) {
    const keys = new Set();
    for (const item of results || []) {
        for (const match of item.matches || []) {
            keys.add(matchRowKey(item.id, match));
        }
    }
    return keys;
}

function toCsv(rows) {
    const header = HEADERS.join(',');
    const body = (rows || []).map((row) => HEADERS.map((name) => escape(row[name])).join(','));
    return `${[header, ...body].join('\n')}\n`;
}

function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            values.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    values.push(current);
    return values;
}

function fromCsv(text) {
    const lines = String(text)
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .filter((line) => line.length > 0);
    if (!lines.length) throw new Error('CSV is empty');
    const header = parseCsvLine(lines[0]);
    if (header.join(',') !== HEADERS.join(',')) {
        throw new Error(`invalid CSV header: expected ${HEADERS.join(',')}`);
    }
    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row = {};
        for (let i = 0; i < HEADERS.length; i++) {
            row[HEADERS[i]] = values[i] ?? '';
        }
        return row;
    });
}

module.exports = {
    HEADERS,
    parseJobIdParam,
    rowKey,
    flattenResultsToRows,
    filterResultsByUserCsv,
    buildResultRowKeys,
    toCsv,
    fromCsv,
};
