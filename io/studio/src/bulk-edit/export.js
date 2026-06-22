const { init: filesInit } = require('@adobe/aio-lib-files');
const { flattenResultsToRows, applyUserReplaceValues, toCsv } = require('./csv.js');

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
    const rows = applyUserReplaceValues(flattenResultsToRows(items), userRows);
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
    await files.write(paths.csv, buildCsvFromItems(items, userRows), { contentType: 'text/csv' });
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

async function writeFindFullExport(jobId, items) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    await files.write(
        paths.fullJson,
        JSON.stringify({ jobId, type: 'find', items: items || [] }),
        { contentType: 'application/json' },
    );
}

async function deleteJobExports(jobId) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    await Promise.all(
        [files.delete(paths.json), files.delete(paths.csv), files.delete(paths.fullJson)].map((p) => p.catch(() => {})),
    );
}

async function exportDownloadResponse(jobId, format) {
    const files = await filesInit();
    const paths = buildExportPaths(jobId);
    const filePath = format === 'csv' ? paths.csv : paths.json;
    const downloadUrl = await files.generatePresignURL(filePath, {
        expiryInSeconds: PRESIGN_TTL_SECONDS,
        permissions: 'r',
    });
    return {
        statusCode: 200,
        body: {
            jobId,
            format,
            downloadUrl,
            expiresIn: PRESIGN_TTL_SECONDS,
        },
    };
}

module.exports = {
    EXPORT_ROOT,
    PRESIGN_TTL_SECONDS,
    buildExportPaths,
    buildCsvFromItems,
    writeFindFullExport,
    readExportFullItems,
    readExportDocument,
    writeJobExports,
    readExportItems,
    deleteJobExports,
    exportDownloadResponse,
};
