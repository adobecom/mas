const Files = require('@adobe/aio-lib-files');
const { Core } = require('@adobe/aio-sdk');
const { resolveScope } = require('./components/index.js');

const logger = Core.Logger('history-cleanup', { level: 'info' });
const RETENTION = 95 * 86400000;
const MAX_BYTES = 750000;
const PAGE_SIZE = 50;
const TIME_BUDGET = 240000;
const CURSOR_PATH = 'private/history-cleanup/cursor.json';
const METADATA_PATH =
    /^private\/history\/(?<scopeType>[a-z][a-z0-9-]{0,63})\/(?<rootId>[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/(?<kind>numbering|index(?:-\d+)?)\.json$/i;

function fail(message) {
    throw Object.assign(new Error(message), { statusCode: 503 });
}

async function readBlob(blob) {
    let response;
    try {
        response = await blob.download(0, undefined, { abortSignal: AbortSignal.timeout(15000) });
    } catch (error) {
        if (error.statusCode === 404) return null;
        throw error;
    }
    if (!response.etag) fail('History cleanup storage did not confirm its revision');
    const chunks = [];
    let size = 0;
    for await (const chunk of response.readableStreamBody) {
        size += Buffer.byteLength(chunk);
        if (size > MAX_BYTES) fail('History cleanup metadata exceeds storage limit');
        chunks.push(Buffer.from(chunk));
    }
    return { etag: response.etag, value: JSON.parse(Buffer.concat(chunks).toString()) };
}

function retained(createdAt, cutoff) {
    const timestamp = Date.parse(createdAt);
    if (!Number.isFinite(timestamp)) fail('Invalid history cleanup timestamp');
    return timestamp >= cutoff;
}

async function cleanBlob(container, name, cutoff) {
    const match = METADATA_PATH.exec(name);
    if (!match) return;
    const { scopeType, kind } = match.groups;
    try {
        resolveScope(scopeType);
    } catch (error) {
        if (error.statusCode === 400) return;
        throw error;
    }
    const blob = container.getBlockBlobClient(name);
    const stored = await readBlob(blob);
    if (!stored) return;
    const value = stored.value;
    const original = JSON.stringify(value);
    if (kind === 'index') {
        value.pages = Object.fromEntries(
            Object.entries(value.pages).filter(([, range]) => retained(range.newest.split('|')[0], cutoff)),
        );
    } else {
        if (kind === 'numbering' && (!Number.isSafeInteger(value.lastVersion) || value.lastVersion < 0)) {
            fail('Invalid history cleanup counter');
        }
        value.entries = Object.fromEntries(
            Object.entries(value.entries).filter(([, entry]) => retained(entry.createdAt, cutoff)),
        );
    }
    const conditions = { ifMatch: stored.etag };
    try {
        if (kind.startsWith('index-') && !Object.keys(value.entries).length) {
            await blob.delete({ conditions, abortSignal: AbortSignal.timeout(15000) });
        } else if (JSON.stringify(value) !== original) {
            await blob.uploadData(Buffer.from(JSON.stringify(value)), {
                conditions,
                blobHTTPHeaders: { blobContentType: 'application/json' },
                abortSignal: AbortSignal.timeout(15000),
            });
        }
    } catch (error) {
        if (![404, 412].includes(error.statusCode)) throw error;
        logger.info(JSON.stringify({ event: 'cleanup-concurrent-write', statusCode: error.statusCode }));
    }
}

async function main() {
    const deadline = Date.now() + TIME_BUDGET;
    try {
        const files = await Files.init();
        const container = files.containerClientPrivate;
        const cursorBlob = container.getBlockBlobClient(CURSOR_PATH);
        const cursor = await readBlob(cursorBlob);
        const cutoff = Date.now() - RETENTION;
        let continuationToken = cursor?.value.continuationToken ?? '';
        let scanned = 0;
        let more = true;
        while (more && Date.now() < deadline) {
            const pages = container
                .listBlobsFlat({
                    prefix: 'private/history/',
                    abortSignal: AbortSignal.timeout(15000),
                })
                .byPage({ maxPageSize: PAGE_SIZE, continuationToken: continuationToken || undefined });
            const { value: page } = await pages.next();
            const items = page?.segment.blobItems ?? [];
            let offset = 0;
            for (; offset < items.length && Date.now() < deadline; offset += 4) {
                const batch = items.slice(offset, offset + 4);
                await Promise.all(batch.map(({ name }) => cleanBlob(container, name, cutoff)));
                scanned += batch.length;
            }
            if (offset < items.length) break;
            continuationToken = page?.continuationToken ?? '';
            more = !!continuationToken;
        }
        await cursorBlob.uploadData(Buffer.from(JSON.stringify({ continuationToken })), {
            conditions: cursor ? { ifMatch: cursor.etag } : { ifNoneMatch: '*' },
            blobHTTPHeaders: { blobContentType: 'application/json' },
            abortSignal: AbortSignal.timeout(15000),
        });
        const result = { scanned, more };
        logger.info(JSON.stringify({ event: 'cleanup-complete', ...result }));
        return result;
    } catch (error) {
        logger.error(JSON.stringify({ event: 'cleanup-failed', statusCode: error.statusCode ?? 500 }));
        throw error;
    }
}

module.exports = { main };
