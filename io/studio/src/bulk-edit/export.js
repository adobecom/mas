const { init: filesInit } = require('@adobe/aio-lib-files');
const { buildCsvRowsFromFindResults, toCsv } = require('./csv.js');

const EXPORT_ROOT = 'private/bulk-edit';
const PRESIGN_TTL_SECONDS = 24 * 60 * 60;

function buildExportPaths(jobId) {
    const base = `${EXPORT_ROOT}/${jobId}`;
    return {
        json: `${base}/results.json`,
        csv: `${base}/results.csv`,
        fullJson: `${base}/results-full.json`,
    };
}

function buildCsvFromItems(items, userRows) {
    const rows = buildCsvRowsFromFindResults(items, userRows);
    return toCsv(rows);
}

async function writeJobExports(jobId, payload) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    const { items, report, type, filteredByUpload, dryRun, userRows } = payload;
    const exportedAt = new Date().toISOString();
    const document = {
        jobId,
        type,
        exportedAt,
        filteredByUpload: !!filteredByUpload,
        dryRun: !!dryRun,
        items: items || [],
        report: report || null,
    };
    await files.write(paths.json, JSON.stringify(document), { contentType: 'application/json' });
    if (type !== 'replace') {
        await files.write(paths.csv, buildCsvFromItems(items, userRows), { contentType: 'text/csv' });
    }
    return { exportedAt, paths };
}

async function readExportDocument(jobId, pathKey) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    const filePath = paths[pathKey];
    const buffer = await files.read(filePath);
    const text = Buffer.isBuffer(buffer) ? buffer.toString('utf8') : String(buffer);
    return JSON.parse(text);
}

async function readExportItems(jobId) {
    const document = await readExportDocument(jobId, 'json');
    return document.items || [];
}

async function readExportFullItems(jobId) {
    try {
        const document = await readExportDocument(jobId, 'fullJson');
        return document.items || [];
    } catch {
        return [];
    }
}

async function writeFullExport(jobId, type, items) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    await files.write(paths.fullJson, JSON.stringify({ jobId, type, items: items || [] }), { contentType: 'application/json' });
}

async function writeFindFullExport(jobId, items) {
    await writeFullExport(jobId, 'find', items);
}

async function deleteJobExports(jobId) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    await Promise.all(
        [files.delete(paths.json), files.delete(paths.csv), files.delete(paths.fullJson)].map((p) => p.catch(() => {})),
    );
}

async function exportFileExists(jobId, format) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    const filePath = format === 'csv' ? paths.csv : paths.json;
    try {
        const buffer = await files.read(filePath);
        const text = Buffer.isBuffer(buffer) ? buffer.toString('utf8') : String(buffer ?? '');
        return text.length > 0;
    } catch {
        return false;
    }
}

async function exportPresignUrl(jobId, format) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    const filePath = format === 'csv' ? paths.csv : paths.json;
    return files.generatePresignURL(filePath, {
        expiryInSeconds: PRESIGN_TTL_SECONDS,
        permissions: 'r',
    });
}

async function exportRedirectResponse(jobId, format) {
    const downloadUrl = await exportPresignUrl(jobId, format);
    return {
        statusCode: 302,
        headers: {
            Location: downloadUrl,
        },
    };
}

module.exports = {
    EXPORT_ROOT,
    PRESIGN_TTL_SECONDS,
    buildExportPaths,
    buildCsvFromItems,
    writeFullExport,
    writeFindFullExport,
    readExportFullItems,
    readExportDocument,
    writeJobExports,
    readExportItems,
    deleteJobExports,
    exportFileExists,
    exportPresignUrl,
    exportRedirectResponse,
};
