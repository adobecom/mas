const crypto = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const { Core } = require('@adobe/aio-sdk');
const { init } = require('@adobe/aio-lib-state');
const Files = require('@adobe/aio-lib-files');
const { getBearerToken, isAllowed } = require('../../utils.js');

const logger = Core.Logger('promo-versions', { level: 'info' });
const RETENTION = 95 * 86400;
const MAX_BYTES = 750000;
const MAX_FRAGMENTS = 100;
const HISTORY_PAGE_SIZE = 10;
const HISTORY_CONCURRENCY = 4;
const NUMBERING_RETRIES = 5;
const NUMBERING_URL_TTL = 300;
const PROJECT_MODEL = '/conf/mas/settings/dam/cfm/models/promotion';
const RESTORE_GROUPS = new Set(['GRP-ODIN-MAS-ADMINS', 'GRP-ODIN-MAS-PROMO-POWERUSERS']);
const RECORD_GROUPS = new Set([...RESTORE_GROUPS, 'GRP-ODIN-MAS-PROMO-EDITORS']);
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const VARIATION_PATH = /^\/content\/dam\/mas\/[\w-]+\/[\w-]+\/promotions\//;

function versionFieldValues(fragment) {
    if (!fragment) return new Map();
    return new Map([
        ['@title', fragment.title ?? ''],
        ['@description', fragment.description ?? ''],
        ['@tags', fragment.tags ?? []],
        ...(fragment.fields ?? []).map((field) => [field.name, field.values ?? null]),
    ]);
}

function compareVersionValues(before, after, missingValue) {
    const differences = [];
    for (const field of new Set([...before.keys(), ...after.keys()])) {
        const previous = before.has(field) ? before.get(field) : missingValue;
        const next = after.has(field) ? after.get(field) : missingValue;
        if (JSON.stringify(previous) !== JSON.stringify(next)) {
            differences.push({ field, before: previous, after: next });
        }
    }
    return differences;
}

function restoreVersionFields(current, historical, fields) {
    const selected = new Set(fields);
    const previous = new Map(historical.map((field) => [field.name, field]));
    const restored = current.map((field) =>
        selected.has(field.name) && previous.has(field.name)
            ? { ...field, values: structuredClone(previous.get(field.name).values) }
            : field,
    );
    for (const field of historical) {
        if (selected.has(field.name) && !restored.some((item) => item.name === field.name)) {
            restored.push(structuredClone(field));
        }
    }
    return restored;
}

function fail(statusCode, message) {
    throw Object.assign(new Error(message), { statusCode });
}

function text(value, name, max = 200) {
    if (typeof value !== 'string' || !value.length || value.length > max) fail(400, `Invalid ${name}`);
    return value;
}

function identifier(value) {
    if (typeof value !== 'string' || !UUID.test(value)) fail(400, 'Invalid fragment ID');
    return value;
}

function versionIdentifier(value) {
    text(value, 'AEM version ID');
    if (['.', '..'].includes(value) || /[/\\?#\0]/.test(value)) fail(400, 'Invalid AEM version ID');
    return value;
}

function pathValue(value) {
    text(value, 'fragment path', 1000);
    if (
        !value.startsWith('/content/dam/mas/') ||
        /[?#\\\0]/.test(value) ||
        value.split('/').some((part) => part === '.' || part === '..')
    )
        fail(400, 'Invalid fragment path');
    return value;
}

function etagValue(value) {
    text(value, 'ETag');
    if (value === '*' || /[\r\n]/.test(value)) fail(400, 'Invalid ETag');
    return value;
}

async function authenticate(params) {
    const token = getBearerToken(params);
    if (!token) fail(401, 'Authorization required');
    let valid;
    try {
        valid = await isAllowed(token, 'mas-studio');
    } catch {
        fail(401, 'Token validation failed');
    }
    if (!valid) fail(401, 'Token validation failed');
    const response = await fetch('https://ims-na1.adobelogin.com/ims/profile/v1', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) fail([401, 403].includes(response.status) ? response.status : 502, 'IMS verification failed');
    const profile = await response.json();
    const id = profile.id ?? profile.userId;
    if (!id || !profile.email) fail(401, 'Verified IMS identity required');
    return { token, user: { id, email: profile.email, ...(profile.name ? { name: profile.name } : {}) } };
}

async function authorizeWrite(state, email, operation) {
    let users;
    try {
        const cached = await state.get('mas-users');
        users = JSON.parse(cached?.value ?? 'null');
    } catch {
        fail(503, 'Promotion permissions are temporarily unavailable');
    }
    if (!Array.isArray(users)) fail(503, 'Promotion permissions are temporarily unavailable');
    const user = users.find((entry) => entry.userPrincipalName?.toLowerCase() === email.toLowerCase());
    const groups = user?.groups ?? [];
    if (!Array.isArray(groups) || groups.some((group) => typeof group !== 'string')) {
        fail(503, 'Promotion permissions are temporarily unavailable');
    }
    const permitted = operation === 'restore' ? RESTORE_GROUPS : RECORD_GROUPS;
    if (!groups.some((group) => permitted.has(group.toUpperCase()))) fail(403, 'Promotion author membership required');
}

function endpoint(params) {
    let url;
    try {
        url = new URL(params.odinEndpoint);
    } catch {
        fail(500, 'Invalid configured AEM endpoint');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
        fail(500, 'Invalid configured AEM endpoint');
    }
    return url.origin;
}

async function aem(context, suffix, options = {}) {
    const response = await fetch(`${context.endpoint}/adobe/sites/cf/fragments${suffix}`, {
        ...options,
        headers: { Authorization: `Bearer ${context.token}`, Accept: 'application/json', ...options.headers },
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
        logger.error(
            JSON.stringify({ operation: context.operation, method: options.method ?? 'GET', status: response.status }),
        );
        fail(response.status, response.status === 412 ? 'Fragment changed; reload before restoring' : 'AEM request failed');
    }
    return response;
}

async function readFragment(context, id) {
    identifier(id);
    if (context.operation === 'list' && context.fragments.has(id)) return context.fragments.get(id);
    const pending = (async () => {
        const response = await aem(context, `/${id}`);
        const fragment = await response.json();
        if (fragment.id !== id) fail(502, 'AEM returned a different fragment');
        pathValue(fragment.path);
        return { fragment, etag: response.headers.get('etag') };
    })();
    if (context.operation === 'list') context.fragments.set(id, pending);
    return pending;
}

async function readPath(context, path) {
    const response = await aem(context, `?path=${encodeURIComponent(pathValue(path))}`);
    const fragment = (await response.json()).items?.find((item) => item.path === path);
    if (!fragment) fail(404, 'Referenced fragment no longer exists');
    return fragment;
}

function assertProject(fragment) {
    const model = fragment.model?.path ?? fragment.model?.id ?? fragment.modelId;
    const decoded = model?.startsWith('/') ? model : Buffer.from(model ?? '', 'base64').toString();
    if (decoded !== PROJECT_MODEL) fail(403, 'Not a promotion project');
}

function values(fragment, name) {
    return fragment.fields?.find((field) => field.name === name)?.values ?? [];
}

function promotionNames(project) {
    return [...values(project, 'tags'), ...(project.tags ?? [])]
        .map((tag) => {
            const raw = typeof tag === 'string' ? tag : (tag.id ?? tag.path ?? '');
            return raw.replace(/^\/content\/cq:tags\/mas\//, 'mas:');
        })
        .filter((tag) => tag.startsWith('mas:promotion/'))
        .map((tag) => tag.slice('mas:promotion/'.length))
        .filter((name) => name && !name.split('/').some((part) => !part || part === '.' || part === '..'));
}

function ownVariation(project, fragment) {
    return promotionNames(project).some(
        (name) =>
            VARIATION_PATH.test(fragment.path) && fragment.path.split('/').slice(6).join('/').startsWith(`promotions/${name}/`),
    );
}

function assertTarget(context, fragment) {
    pathValue(fragment.path);
    if (fragment.id !== context.projectId && !ownVariation(context.project, fragment)) {
        fail(403, 'Target is outside this promotion project');
    }
}

function references(fragment) {
    return [
        ...new Set(
            (fragment.fields ?? []).flatMap((field) =>
                ['content-fragment', 'content-reference', 'fragment-reference'].includes(field.type) ||
                ['fragments', 'variations', 'cards', 'collections'].includes(field.name)
                    ? (field.values ?? []).filter((value) => typeof value === 'string' && value.startsWith('/content/dam/mas/'))
                    : [],
            ),
        ),
    ];
}

async function readVersion(context, entry, retryDelays = []) {
    const versionId = versionIdentifier(entry.versionId);
    let response;
    try {
        response = await aem(context, `/${identifier(entry.id)}/versions/${encodeURIComponent(versionId)}`);
    } catch (error) {
        if (error.statusCode !== 404 || !retryDelays.length) throw error;
        await delay(retryDelays[0]);
        return readVersion(context, entry, retryDelays.slice(1));
    }
    const fragment = await response.json();
    if ((fragment.id && fragment.id !== entry.id) || (fragment.path && fragment.path !== entry.path)) {
        fail(409, 'Historical fragment moved');
    }
    return { ...fragment, id: entry.id, path: entry.path };
}

function category(fragment, field) {
    const model = fragment.model?.path ?? Buffer.from(fragment.model?.id ?? '', 'base64').toString();
    if (model !== PROJECT_MODEL) return 'fragments';
    if (['countries', 'geos'].includes(field)) return 'countries';
    if (['offers', 'offer'].includes(field)) return 'offers';
    return field === 'fragments' ? 'fragments' : 'general';
}

function diff(before, after) {
    const previous = new Map(before.fragments.map((fragment) => [fragment.id, fragment]));
    const current = new Map(after.fragments.map((fragment) => [fragment.id, fragment]));
    return [...new Set([...previous.keys(), ...current.keys()])].flatMap((id) => {
        const fragment = current.get(id) ?? previous.get(id);
        return compareVersionValues(versionFieldValues(previous.get(id)), versionFieldValues(current.get(id)), null).map(
            (change) => ({ fragmentId: id, path: fragment.path, ...change, category: category(fragment, change.field) }),
        );
    });
}

async function versionSnapshot(context, current) {
    const fragments = [];
    for (const fragment of current.fragments) {
        const response = await aem(context, `/${identifier(fragment.id)}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: `Promotion version: ${context.requestId}` }),
        });
        const location = response.headers.get('location');
        if (!location) fail(502, 'AEM did not return the created version');
        const url = new URL(location, context.endpoint);
        const prefix = `/adobe/sites/cf/fragments/${fragment.id}/versions/`;
        if (
            url.origin !== context.endpoint ||
            !url.pathname.startsWith(prefix) ||
            url.search ||
            url.hash ||
            url.username ||
            url.password
        ) {
            fail(502, 'AEM returned an invalid version location');
        }
        let versionId;
        try {
            versionId = versionIdentifier(decodeURIComponent(url.pathname.slice(prefix.length)));
        } catch {
            fail(502, 'AEM returned an invalid version ID');
        }
        const entry = { id: fragment.id, path: fragment.path, versionId };
        const historical = await readVersion(context, entry, [250, 500, 1000]);
        if (diff({ fragments: [fragment] }, { fragments: [historical] }).length) {
            fail(409, 'Fragment changed while creating its AEM version; reload and retry');
        }
        fragments.push(entry);
    }
    for (const fragment of current.fragments) {
        const live = (await readFragment(context, fragment.id)).fragment;
        if (live.path !== fragment.path || diff({ fragments: [fragment] }, { fragments: [live] }).length) {
            fail(409, 'Fragment changed while creating its AEM version; reload and retry');
        }
    }
    return { fragments };
}

function inheritanceContext(context, current) {
    const inheritanceUnavailable = current.fragments
        .filter((fragment) => ownVariation(context.project, fragment))
        .map((fragment) => ({ fragmentId: fragment.id, reason: 'outside-project' }));
    return inheritanceUnavailable.length ? { inheritanceUnavailable } : {};
}

async function historySnapshot(context, current) {
    return { ...(await versionSnapshot(context, current)), ...inheritanceContext(context, current) };
}

function namespace(context, kind) {
    return `promo-versions.${context.projectId}.${kind}.`;
}

function requestId(context) {
    const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify([context.projectId, context.user.id, context.requestId]))
        .digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function bounded(value) {
    const serialized = JSON.stringify(value);
    if (Buffer.byteLength(serialized) > MAX_BYTES) fail(413, 'Version entry exceeds storage limit');
    return serialized;
}

async function numberingRequest(context, options = {}) {
    if (!context.numberingUrl) {
        const files = await Files.init();
        context.numberingUrl = await files.generatePresignURL(`private/promo-versions/${context.projectId}/numbering.json`, {
            permissions: 'rw',
            expiryInSeconds: NUMBERING_URL_TTL,
            urlType: 'internal',
        });
        if (new URL(context.numberingUrl).protocol !== 'https:') fail(503, 'Invalid version numbering storage endpoint');
    }
    return fetch(context.numberingUrl, {
        ...options,
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
    });
}

async function initialNumberingEntries(context, event) {
    const entries = [];
    for (const entry of await readEntries(context)) {
        const stored = entry.event ?? (await readEntry(context, entry.key));
        if (stored) entries.push(stored);
    }
    if (!entries.some((entry) => entry.id === event.id)) entries.push(event);
    return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

function assignVersionNumbers(ledger, events) {
    for (const event of events) {
        if (Number.isSafeInteger(event.version) && event.version > 0) {
            ledger.lastVersion = Math.max(ledger.lastVersion, event.version);
        }
    }
    for (const event of events) {
        if (ledger.entries[event.id]) continue;
        const version = Number.isSafeInteger(event.version) && event.version > 0 ? event.version : ++ledger.lastVersion;
        if (!Number.isSafeInteger(version)) fail(503, 'Version numbering limit reached');
        ledger.entries[event.id] = { version, createdAt: event.createdAt };
    }
}

async function reserveVersion(context, event) {
    if (context.numbering?.entries[event.id]) return context.numbering.entries[event.id];
    let existing;
    for (let attempt = 0; attempt < NUMBERING_RETRIES; attempt += 1) {
        const response = await numberingRequest(context);
        if (!response.ok && response.status !== 404) fail(503, 'Version numbering storage is temporarily unavailable');
        const ledger = response.ok ? await response.json() : { lastVersion: 0, entries: {} };
        if (!Number.isSafeInteger(ledger.lastVersion) || ledger.lastVersion < 0 || !ledger.entries) {
            fail(503, 'Invalid version numbering metadata');
        }
        ledger.entries = Object.fromEntries(
            Object.entries(ledger.entries).filter(([, entry]) => Date.parse(entry.createdAt) >= Date.now() - RETENTION * 1000),
        );
        if (ledger.entries[event.id]) {
            context.numbering = ledger;
            return ledger.entries[event.id];
        }
        if (!response.ok) existing ??= await initialNumberingEntries(context, event);
        const etag = response.ok ? response.headers.get('etag') : null;
        if (response.ok && !etag) fail(503, 'Version numbering storage did not confirm its revision');
        assignVersionNumbers(ledger, response.ok ? [event] : existing);
        const written = await numberingRequest(context, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-ms-blob-type': 'BlockBlob',
                'x-ms-version': '2021-12-02',
                ...(response.ok ? { 'If-Match': etag } : { 'If-None-Match': '*' }),
            },
            body: bounded(ledger),
        });
        if (written.ok) {
            context.numbering = ledger;
            return ledger.entries[event.id];
        }
        if (written.status !== 412) fail(503, 'Version numbering could not be saved');
        await delay(25 * 2 ** attempt);
    }
    fail(503, 'Version numbering is busy; retry recording shortly');
}

async function numberedEntry(context, key, event) {
    event ??= await readEntry(context, key);
    if (!event || (Number.isSafeInteger(event.version) && event.version > 0)) return event;
    const { version } = await reserveVersion(context, event);
    const numbered = { ...event, version };
    await context.state.put(key, bounded(numbered), { ttl: entryTtl(event) });
    return numbered;
}

function entryTtl(event) {
    return Math.max(1, Math.ceil((Date.parse(event.createdAt) + RETENTION * 1000 - Date.now()) / 1000));
}

async function readEntries(context) {
    const entries = [];
    for await (const { keys } of context.state.list({ match: `${namespace(context, 'entry')}*` })) {
        for (const key of keys) {
            const suffix = key.slice(namespace(context, 'entry').length);
            const timestamp = /^(\d{13})\.(.+)$/.exec(suffix);
            if (timestamp) {
                if (Number(timestamp[1]) >= Date.now() - RETENTION * 1000) {
                    entries.push({ key, id: timestamp[2], createdAt: new Date(Number(timestamp[1])).toISOString() });
                }
            } else {
                const event = await readEntry(context, key);
                if (event) entries.push({ key, id: event.id, createdAt: event.createdAt, event });
            }
        }
    }
    return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

async function readEntry(context, key) {
    const stored = await context.state.get(key);
    if (!stored?.value) return null;
    const event = JSON.parse(stored.value);
    return Date.parse(event.createdAt) >= Date.now() - RETENTION * 1000 ? event : null;
}

async function findEntry(context, id) {
    for await (const { keys } of context.state.list({ match: `${namespace(context, 'entry')}*.${id}` })) {
        for (const key of keys) {
            const event = await numberedEntry(context, key);
            if (event) return event;
        }
    }
    return numberedEntry(context, `${namespace(context, 'entry')}${id}`);
}

async function writeEntry(context, action, before, after, beforeSnapshot, afterSnapshot) {
    const event = {
        id: requestId(context),
        createdAt: new Date().toISOString(),
        user: context.user,
        action,
        projectId: context.projectId,
        targetId: context.target.id,
        targetPath: context.target.path,
        changes: diff(before, after),
        beforeSnapshot,
        afterSnapshot,
    };
    Object.assign(event, await reserveVersion(context, event));
    await context.state.put(`${namespace(context, 'entry')}${Date.parse(event.createdAt)}.${event.id}`, bounded(event), {
        ttl: entryTtl(event),
    });
    return event;
}

async function authorizeEvent(context, event) {
    const unavailable = new Set();
    const targets = [
        ...event.beforeSnapshot.fragments,
        ...event.afterSnapshot.fragments,
        ...(event.beforeSnapshot.inheritance ?? []),
        ...(event.afterSnapshot.inheritance ?? []),
    ];
    for (const entry of targets) {
        if (!entry.fragmentId) assertTarget(context, entry);
        const key = JSON.stringify([entry.id, entry.path, entry.versionId]);
        if (!context.access.has(key))
            context.access.set(
                key,
                (async () => {
                    let missing = false;
                    try {
                        const { fragment } = await readFragment(context, entry.id);
                        if (fragment.path !== entry.path) fail(409, 'Historical fragment moved');
                    } catch (error) {
                        if (error.statusCode !== 404) throw error;
                        missing = true;
                    }
                    await readVersion(context, entry);
                    return missing;
                })(),
            );
        if (await context.access.get(key)) unavailable.add(entry.id);
    }
    return { ...event, ...(unavailable.size ? { unavailableFragments: [...unavailable] } : {}) };
}

async function record(context, params) {
    const target =
        params.targetId === context.projectId ? context.project : (await readFragment(context, params.targetId)).fragment;
    assertTarget(context, target);
    context.target = target;
    const { etag } = await readFragment(context, target.id);
    if (params.completionEtag !== undefined && params.completionEtag !== etag) {
        fail(409, 'Completed fragment changed; reload before capturing its version');
    }
    const beforeEntry = params.beforeVersionId ? { id: target.id, path: target.path, versionId: params.beforeVersionId } : null;
    const before = { fragments: beforeEntry ? [await readVersion(context, beforeEntry)] : [] };
    const after = { fragments: [target] };
    if (params.action === 'save' && !diff(before, after).length) return { unchanged: true };
    const inheritance = inheritanceContext(context, after);
    const beforeSnapshot = { fragments: beforeEntry ? [beforeEntry] : [], ...(beforeEntry ? inheritance : {}) };
    const afterSnapshot = { ...(await versionSnapshot(context, after)), ...inheritance };
    if (params.completionEtag !== undefined && params.completionEtag !== (await readFragment(context, target.id)).etag) {
        fail(409, 'Completed fragment changed while capturing its version');
    }
    return { event: await writeEntry(context, params.action, before, after, beforeSnapshot, afterSnapshot) };
}

async function list(context, events, params) {
    const limit = params.limit ?? HISTORY_PAGE_SIZE;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) fail(400, 'Invalid version limit');
    if (params.query !== undefined) text(params.query, 'query', 200);
    if (params.cursor !== undefined) text(params.cursor, 'cursor', 150);
    const numbered = [...events].reverse();
    const cursorIndex = params.cursor ? numbered.findIndex((event) => `${event.createdAt}|${event.id}` === params.cursor) : -1;
    if (params.cursor && cursorIndex === -1) fail(400, 'Invalid version cursor');
    const page = [];
    let currentEventId = null;
    for (let offset = 0; offset < numbered.length; ) {
        const batch = [];
        const batchSize = params.cursor && !currentEventId ? 1 : Math.min(HISTORY_CONCURRENCY, limit + 1 - page.length);
        while (offset < numbered.length && batch.length < batchSize) {
            const index = offset++;
            const entry = numbered[index];
            if (currentEventId && index <= cursorIndex) continue;
            const event = await numberedEntry(context, entry.key, entry.event);
            if (!event) continue;
            const matches =
                index > cursorIndex &&
                (!params.query || JSON.stringify(event).toLowerCase().includes(params.query.toLowerCase()));
            if (!currentEventId || matches) batch.push({ event, matches });
        }
        const authorized = await Promise.all(
            batch.map(async ({ event, matches }) => {
                try {
                    return { event: await authorizeEvent(context, event), matches };
                } catch (error) {
                    if (![401, 403, 404, 409].includes(error.statusCode)) throw error;
                    return null;
                }
            }),
        );
        for (const result of authorized) {
            if (!result) continue;
            currentEventId ??= result.event.id;
            if (result.matches) page.push(result.event);
        }
        if (page.length > limit) {
            page.pop();
            const last = page.at(-1);
            return { events: page, currentEventId, cursor: `${last.createdAt}|${last.id}` };
        }
    }
    return { events: page, currentEventId };
}

function restorePayload(current, historical, fields) {
    const selected = new Set(fields);
    const historicalFields = [
        ...historical.fields,
        ...current.fields
            .filter((field) => selected.has(field.name) && !historical.fields.some((previous) => previous.name === field.name))
            .map((field) => ({ ...field, values: [] })),
    ];
    return {
        title: selected.has('@title') ? (historical.title ?? '') : (current.title ?? ''),
        description: selected.has('@description') ? (historical.description ?? '') : (current.description ?? ''),
        tags: selected.has('@tags') ? (historical.tags ?? []) : (current.tags ?? []),
        fields: restoreVersionFields(current.fields, historicalFields, selected),
    };
}

function tagIds(tags) {
    return tags.map((tag) => (typeof tag === 'string' ? tag : (tag.id ?? tag.path)));
}

async function readTags(context, id) {
    const response = await aem(context, `/${id}/tags`);
    const body = await response.json();
    const etag = response.headers.get('etag');
    if (!etag) fail(409, 'AEM tags did not provide a concurrency token');
    return { tags: tagIds(body.tags ?? []), etag };
}

async function confirmDraft(context, item) {
    for (let attempt = 0; attempt < 5; attempt++) {
        const { fragment } = await readFragment(context, item.id);
        const wanted = { ...item.before, ...item.payload };
        const selected = diff({ fragments: [fragment] }, { fragments: [wanted] });
        if (!selected.some((change) => item.fields.includes(change.field))) return fragment;
        if (attempt < 4) await delay(250);
    }
    fail(409, 'Draft write could not be confirmed');
}

async function writeDraft(context, item) {
    const { tags, ...content } = item.payload;
    let contentWritten = false;
    let tagsWritten = false;
    let writing = false;
    try {
        if (item.fields.some((field) => field !== '@tags')) {
            writing = true;
            await aem(context, `/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'If-Match': item.expected },
                body: JSON.stringify(content),
            });
            writing = false;
            contentWritten = true;
            await confirmDraft(context, { ...item, fields: item.fields.filter((field) => field !== '@tags') });
        }
        if (item.tags) {
            const current = contentWritten ? await readTags(context, item.id) : item.tags;
            if (JSON.stringify(current.tags) !== JSON.stringify(item.tags.tags)) fail(409, 'Tags changed during restore');
            const wanted = tagIds(tags);
            writing = true;
            await aem(context, `/${item.id}/tags`, {
                method: wanted.length ? 'PUT' : 'DELETE',
                headers: { 'Content-Type': 'application/json', 'If-Match': current.etag },
                ...(wanted.length ? { body: JSON.stringify({ tags: wanted }) } : {}),
            });
            writing = false;
            tagsWritten = true;
        }
        return await confirmDraft(context, item);
    } catch (error) {
        error.partial = contentWritten || tagsWritten || (writing && (!error.statusCode || error.statusCode >= 500));
        throw error;
    }
}

function restoreSelections(params) {
    if (!Array.isArray(params.selections) || !params.selections.length || params.selections.length > MAX_FRAGMENTS) {
        fail(400, 'Invalid restore selections');
    }
    if (!Array.isArray(params.expected) || params.expected.length !== params.selections.length)
        fail(400, 'Expected ETags required');
    const selected = new Set();
    for (const selection of params.selections) {
        identifier(selection?.fragmentId);
        if (selected.has(selection.fragmentId)) fail(400, 'Duplicate restore target');
        selected.add(selection.fragmentId);
        if (
            !Array.isArray(selection.fields) ||
            !selection.fields.length ||
            selection.fields.length > 200 ||
            selection.fields.some((field) => typeof field !== 'string' || !field.length || field.length > 200)
        ) {
            fail(400, 'Invalid selected fields');
        }
    }
    const expectedIds = new Set();
    for (const expected of params.expected) {
        identifier(expected?.fragmentId);
        etagValue(expected.etag);
        if (!selected.has(expected.fragmentId) || expectedIds.has(expected.fragmentId)) fail(400, 'Invalid expected ETags');
        expectedIds.add(expected.fragmentId);
    }
}

async function restorePlan(context, params, source) {
    const plan = [];
    for (const selection of params.selections) {
        const entry = source.beforeSnapshot.fragments.find((entry) => entry.id === selection.fragmentId);
        if (!entry) fail(403, 'Target is not in the selected version');
        const changes = source.changes.filter((change) => change.fragmentId === selection.fragmentId);
        if (selection.fields.some((field) => !changes.some((change) => change.field === field))) {
            fail(400, 'Only fields changed by this version can be restored');
        }
        const historical = await readVersion(context, entry);
        const { fragment, etag } = await readFragment(context, entry.id);
        assertTarget(context, fragment);
        if (fragment.path !== entry.path) fail(409, 'Historical fragment moved');
        const expected = params.expected.find((item) => item.fragmentId === entry.id).etag;
        if (!etag || etag !== expected) fail(409, 'Fragment changed; reload before restoring');
        const current = versionFieldValues(fragment);
        if (
            changes.some(
                (change) =>
                    selection.fields.includes(change.field) &&
                    JSON.stringify(current.get(change.field) ?? null) !== JSON.stringify(change.after),
            )
        ) {
            fail(409, 'Selected fields changed since this version; review newer changes before restoring');
        }
        const payload = restorePayload(fragment, historical, selection.fields);
        for (const path of references(payload)) await readPath(context, path);
        const tagsChanged = JSON.stringify(tagIds(payload.tags)) !== JSON.stringify(tagIds(fragment.tags ?? []));
        const tags = tagsChanged ? await readTags(context, entry.id) : null;
        if (tags && JSON.stringify(tags.tags) !== JSON.stringify(tagIds(fragment.tags ?? [])))
            fail(409, 'Tags changed during preflight');
        if (diff({ fragments: [fragment] }, { fragments: [{ ...fragment, ...payload }] }).length) {
            plan.push({ id: entry.id, expected, payload, before: fragment, tags, fields: selection.fields });
        }
    }
    return plan;
}

function versionPending(restored, failures) {
    return Object.assign(new Error('Draft writes finished but version capture failed; do not retry blindly'), {
        statusCode: 503,
        result: { restored, failures, versionPending: true },
    });
}

async function restore(context, params, source) {
    if (!source) fail(404, 'Version no longer available');
    if (!source.beforeSnapshot.fragments.length) fail(400, 'Creation cannot be undone');
    const plan = await restorePlan(context, params, source);
    if (!plan.length) return { unchanged: true, restored: [], failures: [] };
    context.target = context.project;
    const before = { fragments: plan.map((item) => item.before) };
    const beforeSnapshot = await historySnapshot(context, before);
    const guardKey = `${namespace(context, 'request')}${requestId(context)}`;
    const guard = { eventId: source.id, selections: params.selections, expected: params.expected, versionPending: true };
    await context.state.put(guardKey, bounded(guard), { ttl: RETENTION });
    const restored = [];
    const failures = [];
    const after = [];
    for (const [index, item] of plan.entries()) {
        try {
            after.push(await writeDraft(context, item));
            restored.push(item.id);
        } catch (error) {
            failures.push({
                fragmentId: item.id,
                statusCode: error.statusCode ?? 502,
                error: 'Draft restore failed',
                ...(error.partial ? { partial: true } : {}),
            });
            if (error.partial) {
                try {
                    after.push((await readFragment(context, item.id)).fragment);
                } catch {
                    throw versionPending(restored, failures);
                }
            } else after.push(item.before);
            for (const remaining of plan.slice(index + 1)) {
                failures.push({ fragmentId: remaining.id, statusCode: 424, error: 'Not attempted after earlier failure' });
                after.push(remaining.before);
            }
            break;
        }
    }
    try {
        const result = { restored, failures };
        const changed = after.filter((fragment, index) => {
            const changes = diff({ fragments: [plan[index].before] }, { fragments: [fragment] });
            if (changes.some((change) => !plan[index].fields.includes(change.field))) {
                fail(409, 'Unrelated content changed before version capture');
            }
            return changes.length;
        });
        if (changed.length) {
            const ids = new Set(changed.map((fragment) => fragment.id));
            const afterSnapshot = await historySnapshot(context, { fragments: changed });
            const changedBefore = { fragments: before.fragments.filter((fragment) => ids.has(fragment.id)) };
            const changedSnapshot = {
                fragments: beforeSnapshot.fragments.filter((entry) => ids.has(entry.id)),
                ...(beforeSnapshot.inheritance
                    ? {
                          inheritance: beforeSnapshot.inheritance.filter((entry) => ids.has(entry.fragmentId)),
                      }
                    : {}),
                ...(beforeSnapshot.inheritanceUnavailable
                    ? {
                          inheritanceUnavailable: beforeSnapshot.inheritanceUnavailable.filter((entry) =>
                              ids.has(entry.fragmentId),
                          ),
                      }
                    : {}),
            };
            result.event = await writeEntry(
                context,
                'restore',
                changedBefore,
                { fragments: changed },
                changedSnapshot,
                afterSnapshot,
            );
        }
        await context.state.put(guardKey, bounded({ ...guard, versionPending: false, restored, failures }), { ttl: RETENTION });
        return result;
    } catch (error) {
        if (error.statusCode && error.statusCode < 500) {
            error.result = { restored, failures };
            try {
                await context.state.put(
                    guardKey,
                    bounded({
                        ...guard,
                        versionPending: false,
                        restored,
                        failures,
                        conflict: { statusCode: error.statusCode, message: error.message },
                    }),
                    { ttl: RETENTION },
                );
            } catch {
                throw versionPending(restored, failures);
            }
            throw error;
        }
        throw versionPending(restored, failures);
    }
}

async function execute(operation, params) {
    if ((params.__ow_method ?? '').toLowerCase() !== 'post') fail(405, 'POST required');
    if (!['record', 'list', 'restore'].includes(operation)) fail(400, 'Unknown version operation');
    identifier(params.projectId);
    if (operation === 'record') {
        identifier(params.targetId);
        params = { ...params, action: params.action ?? 'save' };
        if (!['save', 'create'].includes(params.action)) fail(400, 'Invalid version action');
        if (params.beforeVersionId !== undefined) versionIdentifier(params.beforeVersionId);
        if (params.action === 'save' && !params.beforeVersionId) fail(400, 'Before version required');
        if (params.action === 'create' && params.beforeVersionId !== undefined)
            fail(400, 'Creation cannot have a before version');
        if (params.completionEtag !== undefined) etagValue(params.completionEtag);
    }
    if (operation === 'restore') {
        identifier(params.eventId);
        restoreSelections(params);
    }
    const configuredEndpoint = endpoint(params);
    const identity = await authenticate(params);
    const state = await init();
    if (operation !== 'list') await authorizeWrite(state, identity.user.email, operation);
    const context = {
        ...identity,
        state,
        operation,
        endpoint: configuredEndpoint,
        projectId: params.projectId,
        requestId: operation === 'list' ? undefined : text(params.requestId, 'request ID'),
        access: new Map(),
        fragments: new Map(),
    };
    context.project = (await readFragment(context, context.projectId)).fragment;
    assertProject(context.project);
    if (operation !== 'list') {
        const previous = await findEntry(context, requestId(context));
        if (previous && operation === 'record') {
            if (
                previous.action !== params.action ||
                previous.targetId !== params.targetId ||
                previous.beforeSnapshot.fragments[0]?.versionId !== params.beforeVersionId
            )
                fail(409, 'Request ID already used');
            await authorizeEvent(context, previous);
            return { event: previous };
        }
        const request = await state.get(`${namespace(context, 'request')}${requestId(context)}`);
        if (request?.value) {
            const prior = JSON.parse(request.value);
            if (
                operation !== 'restore' ||
                prior.eventId !== params.eventId ||
                JSON.stringify(prior.selections) !== JSON.stringify(params.selections) ||
                JSON.stringify(prior.expected) !== JSON.stringify(params.expected)
            )
                fail(409, 'Request ID already used');
            if (prior.versionPending)
                throw Object.assign(new Error('Restore already attempted; reload before retrying'), {
                    statusCode: 409,
                    result: { versionPending: true },
                });
            if (prior.conflict)
                throw Object.assign(new Error(prior.conflict.message), {
                    statusCode: prior.conflict.statusCode,
                    result: { restored: prior.restored, failures: prior.failures },
                });
            if (previous) await authorizeEvent(context, previous);
            return { restored: prior.restored, failures: prior.failures, ...(previous ? { event: previous } : {}) };
        }
        if (previous) fail(409, 'Request ID already used');
    }
    if (operation === 'record') return record(context, params);
    if (operation === 'restore') return restore(context, params, await findEntry(context, params.eventId));
    return list(context, await readEntries(context), params);
}

module.exports = { execute };
