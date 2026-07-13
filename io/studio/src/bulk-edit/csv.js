const { SCOPE_FIELDS } = require('./search.js');

const HEADERS = ['fragment_id', 'path', 'locale', 'field', 'find', 'etag', 'status'];
const CSV_MARKER = HEADERS[0];

const FIELD_TO_SCOPE = new Map();
for (const [scope, config] of Object.entries(SCOPE_FIELDS)) {
    for (const fieldName of config.fields || []) {
        FIELD_TO_SCOPE.set(fieldName, scope);
    }
}

const FORMULA_LEAD = /^['=+\-@\t\r]/;

function escape(value) {
    if (value === null || value === undefined) return '';
    let str = String(value);
    // Spreadsheet apps execute cells starting with =,+,-,@ as formulas. Prefix a quote to
    // neutralize; unescape() reverses it so the find-key round-trip stays exact.
    if (FORMULA_LEAD.test(str)) str = `'${str}`;
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function unescape(value) {
    if (typeof value === 'string' && /^'['=+\-@\t\r]/.test(value)) {
        return value.slice(1);
    }
    return value;
}

function parseJobIdParam(raw) {
    if (raw == null || raw === '') return { jobId: raw, wantsCsv: false, wantsJson: false };
    const text = String(raw);
    if (text.endsWith('.json')) {
        return { jobId: text.slice(0, -5), wantsCsv: false, wantsJson: true };
    }
    if (text.endsWith('.csv')) {
        return { jobId: text.slice(0, -4), wantsCsv: true, wantsJson: false };
    }
    return { jobId: text, wantsCsv: false, wantsJson: false };
}

function rowKey({ fragment_id, field, find }) {
    return `${fragment_id}|${field}|${find}`;
}

function rowKeyAliases(fragmentId, field, find) {
    const aliases = new Set([rowKey({ fragment_id: fragmentId, field, find })]);
    const scope = FIELD_TO_SCOPE.get(field);
    if (scope) {
        aliases.add(rowKey({ fragment_id: fragmentId, field: scope, find }));
    }
    const scopeConfig = SCOPE_FIELDS[field];
    if (scopeConfig?.fields) {
        for (const fieldName of scopeConfig.fields) {
            aliases.add(rowKey({ fragment_id: fragmentId, field: fieldName, find }));
        }
    }
    return aliases;
}

function uploadRowMatchesMatch(fragmentId, match, userRow) {
    if (userRow.fragment_id !== fragmentId) return false;
    const matchKeys = rowKeyAliases(fragmentId, match.field, match.value);
    const userKeys = rowKeyAliases(userRow.fragment_id, userRow.field, userRow.find);
    for (const key of matchKeys) {
        if (userKeys.has(key)) return true;
    }
    return false;
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
                etag: item.etag,
                status: item.status,
            });
        }
    }
    return rows;
}

function filterResultsByUserCsv(results, userRows) {
    if (!userRows?.length) return results || [];
    const filtered = [];
    for (const item of results || []) {
        const matches = (item.matches || []).filter((match) =>
            userRows.some((userRow) => uploadRowMatchesMatch(item.id, match, userRow)),
        );
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
            for (const alias of rowKeyAliases(item.id, match.field, match.value)) {
                keys.add(alias);
            }
        }
    }
    return keys;
}

function buildCsvRowsFromFindResults(items, userRows) {
    const filtered = userRows?.length ? filterResultsByUserCsv(items, userRows) : items;
    return flattenResultsToRows(filtered);
}

function buildReplaceRowsFromFindResults(items, userRows, { find, replace, matchCase } = {}) {
    const rows = buildCsvRowsFromFindResults(items, userRows);
    if (find && replace && replace !== find) {
        const { replaceInValue } = require('./replace.js');
        for (const row of rows) {
            row.replace = replaceInValue(row.find, find, replace, !!matchCase);
        }
    }
    return rows;
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
            row[HEADERS[i]] = unescape(values[i] ?? '');
        }
        return row;
    });
}

function contentType(params) {
    return (params.__ow_headers?.['content-type'] || '').split(';')[0].trim().toLowerCase();
}

function readOwBodyString(params) {
    if (params.__ow_body == null) return '';
    const body = params.__ow_body;
    if (Buffer.isBuffer(body)) return body.toString('utf8');
    if (typeof body !== 'string') return String(body);
    return body;
}

function tryDecodeBase64(body, isValid) {
    try {
        const decoded = Buffer.from(body, 'base64').toString('utf8');
        if (isValid(decoded)) return decoded;
    } catch {}
    return body;
}

function parseRawBody(params) {
    const body = readOwBodyString(params);
    if (!body) return '';
    const trimmed = body.trim();
    if (trimmed.startsWith('\uFEFF') || trimmed.startsWith(CSV_MARKER)) return body;
    return tryDecodeBase64(body, (decoded) => decoded.includes(CSV_MARKER));
}

function isCsvContentType(params) {
    return contentType(params) === 'text/csv';
}

function isMultipartContentType(params) {
    return contentType(params) === 'multipart/form-data';
}

function parseMultipartBoundary(contentType) {
    const match = /boundary=([^;]+)/i.exec(contentType || '');
    if (!match) return null;
    return match[1].trim().replace(/^"|"$/g, '');
}

function parseMultipartRawBody(params) {
    const body = readOwBodyString(params);
    if (!body) return '';
    if (body.trimStart().startsWith('--')) return body;
    return tryDecodeBase64(body, (decoded) => decoded.trimStart().startsWith('--'));
}

function extractCsvFromMultipart(body, contentType) {
    const boundary = parseMultipartBoundary(contentType);
    if (!boundary) return '';
    const delimiter = `--${boundary}`;
    for (const section of body.split(delimiter)) {
        const trimmed = section.replace(/^\r?\n/, '').replace(/\r?\n--?\s*$/, '');
        if (!trimmed || trimmed === '--') continue;
        const splitAt = trimmed.indexOf('\r\n\r\n');
        let content;
        if (splitAt >= 0) {
            content = trimmed.slice(splitAt + 4);
        } else {
            const lfSplit = trimmed.indexOf('\n\n');
            content = lfSplit >= 0 ? trimmed.slice(lfSplit + 2) : trimmed;
        }
        content = content.replace(/\r?\n--\s*$/, '').trim();
        if (content.includes(CSV_MARKER)) return content;
    }
    return '';
}

function parseCsvUploadBody(params) {
    const ct = params.__ow_headers?.['content-type'] || '';
    if (isMultipartContentType(params)) {
        return extractCsvFromMultipart(parseMultipartRawBody(params), ct);
    }
    return parseRawBody(params);
}

function isCsvUpload(params) {
    return isCsvContentType(params) || isMultipartContentType(params);
}

module.exports = {
    HEADERS,
    parseJobIdParam,
    rowKey,
    rowKeyAliases,
    uploadRowMatchesMatch,
    flattenResultsToRows,
    filterResultsByUserCsv,
    buildResultRowKeys,
    buildCsvRowsFromFindResults,
    buildReplaceRowsFromFindResults,
    toCsv,
    fromCsv,
    parseRawBody,
    parseCsvUploadBody,
    parseMultipartRawBody,
    extractCsvFromMultipart,
    isCsvContentType,
    isMultipartContentType,
    isCsvUpload,
};
