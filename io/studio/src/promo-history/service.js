const crypto = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const { Core } = require('@adobe/aio-sdk');
const { init } = require('@adobe/aio-lib-state');
const { getBearerToken, isAllowed } = require('../../utils.js');

const logger = Core.Logger('promo-history', { level: 'info' });
const RETENTION = 95 * 86400;
const INTENT_RETENTION = 86400;
const MAX_ENTRIES = 2000;
const MAX_BYTES = 750000;
const MAX_FRAGMENTS = 100;
const PROJECT_MODEL = '/conf/mas/settings/dam/cfm/models/promotion';
const RESTORE_GROUPS = new Set(['GRP-ODIN-MAS-ADMINS', 'GRP-ODIN-MAS-PROMO-POWERUSERS']);
const ACTIONS = new Set(['create', 'save', 'delete', 'duplicate', 'publish', 'unpublish', 'restore', 'backup']);
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

function fail(statusCode, message) {
    throw Object.assign(new Error(message), { statusCode });
}

function text(value, name, max = 200) {
    if (typeof value !== 'string' || !value.length || value.length > max) fail(400, `Invalid ${name}`);
    return value;
}

function identifier(value) {
    if (!UUID.test(value ?? '')) fail(400, 'Invalid fragment ID');
    return value;
}

function pathValue(value) {
    text(value, 'fragment path', 1000);
    if (
        !value.startsWith('/content/dam/mas/') ||
        /[?#\\\0]/.test(value) ||
        value.split('/').some((p) => p === '.' || p === '..')
    ) {
        fail(400, 'Invalid fragment path');
    }
    return value;
}

async function imsRequest(path, token) {
    const response = await fetch(`https://ims-na1.adobelogin.com${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) fail([401, 403].includes(response.status) ? response.status : 502, 'IMS verification failed');
    return response.json();
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
    const profile = await imsRequest('/ims/profile/v1', token);
    const id = profile.id ?? profile.userId;
    if (!id || !profile.email) fail(401, 'Verified IMS identity required');
    return { token, user: { id, email: profile.email, ...(profile.name ? { name: profile.name } : {}) } };
}

async function authorizeRestore(state, email) {
    let users;
    try {
        const cached = await state.get('mas-users');
        users = JSON.parse(cached?.value ?? 'null');
    } catch {
        logger.error('Promotion history membership cache could not be read');
        fail(503, 'Promotion permissions are temporarily unavailable');
    }
    if (!Array.isArray(users)) fail(503, 'Promotion permissions are temporarily unavailable');
    const user = users.find((entry) => entry.userPrincipalName?.toLowerCase() === email.toLowerCase());
    const groups = user?.groups ?? [];
    if (!Array.isArray(groups) || groups.some((group) => typeof group !== 'string')) {
        fail(503, 'Promotion permissions are temporarily unavailable');
    }
    if (!groups.some((group) => RESTORE_GROUPS.has(group.toUpperCase()))) {
        fail(403, 'Restore requires MAS admin or promotion power-user membership');
    }
}

function endpoint(params) {
    const url = new URL(params.odinEndpoint);
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
        const url = new URL(`${context.endpoint}/adobe/sites/cf/fragments${suffix}`);
        logger.error(
            JSON.stringify({
                event: 'promo-history-aem-request-failed',
                operation: context.operation,
                phase: context.phase,
                projectId: context.projectId,
                requestId: context.requestId,
                method: options.method ?? 'GET',
                endpoint: context.endpoint,
                resource: url.pathname,
                lookupPath: url.searchParams.get('path') ?? undefined,
                status: response.status,
                aemRequestId: response.headers.get('x-request-id'),
            }),
        );
        fail(response.status, response.status === 412 ? 'Fragment changed; reload before restoring' : 'AEM request failed');
    }
    return response;
}

async function readFragment(context, id) {
    const response = await aem(context, `/${identifier(id)}`);
    return { fragment: await response.json(), etag: response.headers.get('etag') };
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
    pathValue(fragment.path);
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
    return promotionNames(project).some((name) => {
        return (
            /^\/content\/dam\/mas\/[\w-]+\/[\w-]+\/promotions\//.test(fragment.path) &&
            fragment.path.split('/').slice(6).join('/').startsWith(`promotions/${name}/`)
        );
    });
}

async function discoverVariations(context, project) {
    const roots = new Set();
    for (const path of references(project)) {
        const match = /^\/content\/dam\/mas\/([\w-]+)\/([\w-]+)\//.exec(path);
        if (!match) continue;
        for (const name of promotionNames(project)) {
            const root = `/content/dam/mas/${match[1]}/${match[2]}/promotions/${name}`;
            pathValue(root);
            roots.add(root);
        }
    }
    const paths = [];
    for (const root of roots) {
        let cursor;
        const cursors = new Set();
        do {
            const query = { filter: { path: root }, sort: [{ on: 'created', order: 'ASC' }] };
            const params = new URLSearchParams({ query: JSON.stringify(query), limit: '50' });
            if (cursor) params.set('cursor', cursor);
            const response = await aem(context, `/search?${params}`);
            const data = await response.json();
            for (const fragment of data.items ?? []) {
                if (ownVariation(project, fragment)) paths.push(pathValue(fragment.path));
                if (paths.length > MAX_FRAGMENTS) fail(413, 'Project exceeds history snapshot limit');
            }
            cursor = data.cursor;
            if (cursor && cursors.has(cursor)) fail(502, 'AEM returned a repeated search cursor');
            cursors.add(cursor);
        } while (cursor);
    }
    return paths;
}

function references(fragment) {
    return [
        ...new Set(
            (fragment.fields ?? []).flatMap((field) => {
                if (
                    ['content-fragment', 'content-reference', 'fragment-reference'].includes(field.type) ||
                    ['fragments', 'variations', 'cards', 'collections'].includes(field.name)
                ) {
                    return (field.values ?? []).filter(
                        (value) => typeof value === 'string' && value.startsWith('/content/dam/mas/'),
                    );
                }
                return [];
            }),
        ),
    ];
}

async function snapshot(context, project, extra = []) {
    const fragments = [project];
    const visited = new Set([project.path]);
    const queue = [...references(project), ...(await discoverVariations(context, project)), ...extra];
    const referenceFragments = [];
    while (queue.length) {
        const path = queue.shift();
        if (visited.has(path)) continue;
        visited.add(path);
        if (visited.size > MAX_FRAGMENTS) fail(413, 'Project exceeds history snapshot limit');
        const fragment = await readPath(context, path);
        if (ownVariation(project, fragment)) {
            fragments.push(fragment);
            queue.push(...references(fragment));
        } else {
            referenceFragments.push(fragment);
            queue.push(...values(fragment, 'variations').filter((p) => ownVariation(project, { path: p })));
        }
    }
    const result = { fragments, references: referenceFragments };
    bounded(result);
    return result;
}

async function readVersion(context, entry, retryDelays = []) {
    const versionId = text(entry.versionId, 'AEM version ID');
    if (['.', '..'].includes(versionId)) fail(400, 'Invalid AEM version ID');
    let response;
    try {
        response = await aem(context, `/${identifier(entry.id)}/versions/${encodeURIComponent(versionId)}`);
    } catch (error) {
        if (error.statusCode !== 404 || !retryDelays.length) throw error;
        await delay(retryDelays[0]);
        return readVersion(context, entry, retryDelays.slice(1));
    }
    return { ...(await response.json()), id: entry.id, path: entry.path, status: entry.status };
}

async function readSnapshot(context, manifest) {
    const fragments = [];
    for (const entry of manifest.fragments) fragments.push(await readVersion(context, entry));
    return { ...manifest, fragments };
}

async function versionSnapshot(context, current) {
    const fragments = [];
    for (const fragment of current.fragments) {
        const response = await aem(context, `/${identifier(fragment.id)}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: `Promotion history: ${context.requestId}` }),
        });
        const location = response.headers.get('location');
        if (!location) fail(502, 'AEM did not return the created version');
        const versionUrl = new URL(location, context.endpoint);
        const prefix = `/adobe/sites/cf/fragments/${fragment.id}/versions/`;
        if (versionUrl.origin !== context.endpoint || !versionUrl.pathname.startsWith(prefix)) {
            fail(502, 'AEM returned an invalid version location');
        }
        const versionId = decodeURIComponent(versionUrl.pathname.slice(prefix.length));
        if (!versionId || versionId.includes('/')) fail(502, 'AEM returned an invalid version ID');
        const entry = {
            id: fragment.id,
            path: fragment.path,
            versionId,
            ...(fragment.status ? { status: fragment.status } : {}),
        };
        const historical = await readVersion(context, entry, [250, 500, 1000]);
        if (diff({ fragments: [fragment] }, { fragments: [historical] }).length) {
            fail(409, 'Fragment changed while creating its AEM version; reload and retry');
        }
        fragments.push(entry);
    }
    const confirmed = { fragments: [] };
    for (const fragment of current.fragments) confirmed.fragments.push((await readFragment(context, fragment.id)).fragment);
    if (diff(current, confirmed).length) fail(409, 'Project changed while creating its backup; reload and retry');
    return { fragments, references: (current.references ?? []).map(({ id, path }) => ({ id, path })) };
}

function auditSnapshot(fragment) {
    return {
        fragments: fragment
            ? [
                  {
                      ...Object.fromEntries(
                          ['id', 'path', 'model', 'modelId', 'title', 'description', 'tags', 'status'].map((key) => [
                              key,
                              fragment[key],
                          ]),
                      ),
                      fields: (fragment.fields ?? []).map(({ name, values }) => ({ name, values })),
                  },
              ]
            : [],
    };
}

async function auditTarget(context, params) {
    const project = context.project;
    if (params.targetPath) {
        pathValue(params.targetPath);
        if (
            params.targetPath !== project.path &&
            !ownVariation(project, { path: params.targetPath }) &&
            !references(project).includes(params.targetPath)
        )
            fail(403, 'Target path is outside this promotion project');
    }
    let target = project;
    if (params.targetId && params.targetId !== project.id) {
        try {
            target = (await readFragment(context, params.targetId)).fragment;
        } catch (error) {
            if (error.statusCode !== 404) throw error;
            fail(403, 'Target is outside this promotion project');
        }
    } else if (!params.targetId && params.targetPath && params.targetPath !== project.path) {
        target = ['create', 'duplicate'].includes(params.action) ? null : await readPath(context, params.targetPath);
    }
    if (target) {
        if (target.id !== project.id && !ownVariation(project, target) && !references(project).includes(target.path)) {
            fail(403, 'Target is outside this promotion project');
        }
        if (params.targetPath && params.targetPath !== target.path) fail(403, 'Target path does not match the fragment');
    }
    return target;
}

function bounded(value) {
    const serialized = JSON.stringify(value);
    if (Buffer.byteLength(serialized) > MAX_BYTES) fail(413, 'History entry exceeds storage limit');
    return serialized;
}

function namespace(projectId, kind) {
    return `promo-history.${projectId}.${kind}.`;
}

async function readEntries(state, projectId, kind = 'event') {
    const result = [];
    for await (const { keys } of state.list({ match: `${namespace(projectId, kind)}*` })) {
        for (const key of keys) {
            if (result.length >= MAX_ENTRIES * 2) fail(507, 'Project history capacity reached');
            const entry = await state.get(key);
            if (entry?.value) result.push(JSON.parse(entry.value));
        }
    }
    result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return [...new Map(result.reverse().map((entry) => [entry.id, entry])).values()];
}

async function persist(context, kind, value, ttl = RETENTION) {
    await context.state.put(`${namespace(context.projectId, kind)}${crypto.randomUUID()}`, bounded(value), { ttl });
    return value;
}

function stableId(context, kind) {
    const hash = crypto
        .createHash('sha256')
        .update(JSON.stringify([context.projectId, context.user.id, context.requestId, kind]))
        .digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function changeValues(fragment) {
    if (!fragment) return new Map();
    return new Map([
        ['@title', fragment.title ?? ''],
        ['@description', fragment.description ?? ''],
        ['@tags', fragment.tags ?? []],
        ...(fragment.fields ?? []).map((field) => [field.name, field.values]),
    ]);
}

function diff(before, after) {
    const old = new Map(before.fragments.map((f) => [f.id, f]));
    const current = new Map(after.fragments.map((f) => [f.id, f]));
    const changes = [];
    for (const id of new Set([...old.keys(), ...current.keys()])) {
        const previous = changeValues(old.get(id));
        const next = changeValues(current.get(id));
        for (const field of new Set([...previous.keys(), ...next.keys()])) {
            const beforeValue = previous.get(field) ?? null;
            const afterValue = next.get(field) ?? null;
            if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) continue;
            changes.push({
                id: `${id}:${field}`,
                fragmentId: id,
                path: (current.get(id) ?? old.get(id)).path,
                field,
                before: beforeValue,
                after: afterValue,
                category: category(current.get(id) ?? old.get(id), field),
            });
        }
    }
    return changes;
}

function category(fragment, field) {
    const model = fragment.model?.path ?? Buffer.from(fragment.model?.id ?? '', 'base64').toString();
    if (model !== PROJECT_MODEL) return 'fragments';
    if (['countries', 'geos'].includes(field)) return 'countries';
    if (['offers', 'offer'].includes(field)) return 'offers';
    return field === 'fragments' ? 'fragments' : 'general';
}

function fingerprint(operation, params) {
    return crypto
        .createHash('sha256')
        .update(JSON.stringify([operation, params.eventId, params.selections, params.expected, params.label]))
        .digest('hex');
}

async function writeEvent(context, action, before, after, extra = {}) {
    const createdAt = new Date().toISOString();
    const event = {
        id: stableId(context, 'event'),
        requestId: context.requestId,
        action,
        createdAt,
        user: context.user,
        projectId: context.projectId,
        projectPath: context.project?.path ?? context.projectPath,
        environment: { aem: context.endpoint, runtime: process.env.__OW_NAMESPACE },
        targetId: context.targetId ?? context.projectId,
        targetPath: context.targetPath ?? context.project?.path,
        changes: extra.changes ?? (after ? diff(before, after) : []),
        label: createdAt,
        fingerprint: context.fingerprint,
        ...extra,
    };
    await persist(context, 'event', event);
    return { event };
}

async function record(context, params) {
    if (params.phase === 'complete') {
        identifier(params.intentId);
        const intent = (await readEntries(context.state, context.projectId, 'intent')).find(
            (entry) => entry.id === params.intentId,
        );
        if (!intent) fail(404, 'History intent expired or missing');
        if (intent.user.id !== context.user.id || intent.requestId !== context.requestId) fail(403, 'History intent mismatch');
        context.targetId = intent.targetId;
        context.targetPath = intent.targetPath;
        let project;
        try {
            project = (await readFragment(context, context.projectId)).fragment;
            assertProject(project);
        } catch (error) {
            if (error.statusCode !== 404 || intent.action !== 'delete' || intent.targetId !== context.projectId) throw error;
        }
        context.project = project;
        context.projectPath = intent.projectPath;
        let target;
        try {
            target =
                intent.targetId === context.projectId
                    ? project
                    : intent.targetId
                      ? (await readFragment(context, intent.targetId)).fragment
                      : await readPath(context, intent.targetPath);
        } catch (error) {
            if (error.statusCode !== 404 || intent.action !== 'delete') throw error;
        }
        if (target && target.path !== intent.targetPath) fail(409, 'Audit target moved; reload before continuing');
        if (target) context.targetId = target.id;
        if (params.targetId && params.targetId !== context.targetId) fail(403, 'Completed target does not match intent');
        const after = auditSnapshot(target);
        const before =
            intent.action !== 'delete' && intent.before.fragments.some((fragment) => fragment.versionId)
                ? await readSnapshot(context, intent.before)
                : intent.before;
        const changes = intent.action === 'delete' ? intent.changes : diff(before, after);
        if (intent.action === 'delete' && after.fragments.some((fragment) => fragment.id === context.targetId)) {
            fail(409, 'No server-observed deletion');
        }
        if (['save', 'create', 'duplicate', 'delete'].includes(intent.action) && !changes.length) {
            fail(409, 'No server-observed content change');
        }
        if (['publish', 'unpublish'].includes(intent.action)) {
            const oldTarget = before.fragments.find((fragment) => fragment.id === context.targetId);
            const newTarget = after.fragments.find((fragment) => fragment.id === context.targetId);
            if (!newTarget || oldTarget?.status === newTarget.status) fail(409, 'No server-observed publication change');
        }
        return writeEvent(context, intent.action, before, after, {
            intentId: intent.id,
            changes: changes.filter((change) => change.fragmentId === context.targetId),
        });
    }
    if (!ACTIONS.has(params.action) || ['restore', 'backup'].includes(params.action)) fail(400, 'Invalid audit action');
    if (!params.phase) {
        if (!['create', 'duplicate'].includes(params.action)) fail(400, 'Prepare intent required');
        const target = await auditTarget(context, params);
        if (!target) fail(404, 'Created fragment is not available');
        context.targetId = target.id;
        context.targetPath = target.path;
        return writeEvent(context, params.action, { fragments: [] }, auditSnapshot(target));
    }
    if (params.phase !== 'prepare') fail(400, 'Invalid record phase');
    const intents = await readEntries(context.state, context.projectId, 'intent');
    const existing = intents.find((intent) => intent.requestId === context.requestId && intent.user.id === context.user.id);
    if (existing) {
        if (
            existing.action !== params.action ||
            (params.targetId && existing.targetId !== params.targetId) ||
            (params.targetPath && existing.targetPath !== params.targetPath)
        )
            fail(409, 'Request ID already used');
        return { intentId: existing.id };
    }
    if (intents.length >= MAX_ENTRIES) fail(507, 'Project history intent capacity reached');
    const target = await auditTarget(context, params);
    const current = auditSnapshot(target);
    const before = ['create', 'duplicate'].includes(params.action) ? { fragments: [] } : current;
    const intent = {
        id: stableId(context, 'intent'),
        createdAt: new Date().toISOString(),
        user: context.user,
        projectPath: context.project.path,
        requestId: context.requestId,
        action: params.action,
        targetId: target?.id ?? null,
        targetPath: params.targetPath ?? target?.path,
        before,
        ...(params.action === 'delete'
            ? {
                  changes: diff(current, { fragments: [] }).filter(
                      (change) => change.fragmentId === (params.targetId ?? context.projectId),
                  ),
              }
            : {}),
    };
    bounded(intent);
    await persist(context, 'intent', intent, INTENT_RETENTION);
    return { intentId: intent.id };
}

function list(events, params) {
    const limit = params.limit ?? 30;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) fail(400, 'Invalid history limit');
    for (const name of ['from', 'to']) {
        if (params[name] && !Number.isFinite(Date.parse(params[name]))) fail(400, `Invalid ${name} date`);
    }
    if (params.query) text(params.query, 'query', 200);
    let filtered = events
        .filter(
            (event) =>
                (!params.user || [event.user.id, event.user.email].includes(params.user)) &&
                (!params.action || event.action === params.action) &&
                (!params.fragmentId ||
                    event.targetId === params.fragmentId ||
                    event.changes.some((c) => c.fragmentId === params.fragmentId)) &&
                (!params.from || event.createdAt >= new Date(params.from).toISOString()) &&
                (!params.to || event.createdAt <= new Date(params.to).toISOString()) &&
                (!params.query || JSON.stringify(event).toLowerCase().includes(params.query.toLowerCase())),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    if (params.cursor) {
        text(params.cursor, 'cursor', 150);
        const index = filtered.findIndex((event) => `${event.createdAt}|${event.id}` === params.cursor);
        if (index === -1) fail(400, 'Invalid history cursor');
        filtered = filtered.slice(index + 1);
    }
    const page = filtered.slice(0, limit);
    const last = page.at(-1);
    return { events: page, ...(filtered.length > limit ? { cursor: `${last.createdAt}|${last.id}` } : {}) };
}

function restorePayload(current, historical, fields) {
    const chosen = new Set(fields ?? [...changeValues(historical).keys()]);
    const known = changeValues(historical);
    if (!chosen.size || [...chosen].some((field) => !known.has(field))) fail(400, 'Unknown or empty restore fields');
    const payload = {
        title: chosen.has('@title') ? (historical.title ?? '') : (current.title ?? ''),
        description: chosen.has('@description') ? (historical.description ?? '') : (current.description ?? ''),
        tags: chosen.has('@tags') ? (historical.tags ?? []) : (current.tags ?? []),
        fields: current.fields.map((field) =>
            chosen.has(field.name) ? { ...field, values: structuredClone(known.get(field.name)) } : field,
        ),
    };
    for (const field of historical.fields) {
        if (chosen.has(field.name) && !payload.fields.some((f) => f.name === field.name))
            payload.fields.push(structuredClone(field));
    }
    if (fields === undefined) payload.fields = structuredClone(historical.fields);
    return payload;
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

async function writeDraft(context, item) {
    const { tags, ...content } = item.payload;
    let contentWritten = false;
    if (item.contentSelected) {
        await aem(context, `/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'If-Match': item.expected },
            body: JSON.stringify(content),
        });
        contentWritten = true;
        let confirmed = false;
        for (let attempt = 0; attempt < 10; attempt++) {
            const { fragment } = await readFragment(context, item.id);
            const current = { title: fragment.title ?? '', description: fragment.description ?? '', fields: fragment.fields };
            if (JSON.stringify(current) === JSON.stringify(content)) {
                confirmed = true;
                break;
            }
            if (attempt < 9) await new Promise((resolve) => setTimeout(resolve, 250));
        }
        if (!confirmed)
            throw Object.assign(new Error('Draft write could not be confirmed'), { statusCode: 409, partial: true });
    }
    if (item.tags) {
        const current = contentWritten ? await readTags(context, item.id) : item.tags;
        if (JSON.stringify(current.tags) !== JSON.stringify(item.tags.tags)) {
            throw Object.assign(new Error('Tags changed during restore'), { statusCode: 409, partial: contentWritten });
        }
        const wanted = tagIds(tags);
        try {
            await aem(context, `/${item.id}/tags`, {
                method: wanted.length ? 'PUT' : 'DELETE',
                headers: { 'Content-Type': 'application/json', 'If-Match': current.etag },
                ...(wanted.length ? { body: JSON.stringify({ tags: wanted }) } : {}),
            });
        } catch (error) {
            error.partial = contentWritten;
            throw error;
        }
    }
}

async function restore(context, params, events) {
    const source = events.find((event) => event.id === params.eventId);
    if (!source?.snapshot?.fragments?.length) fail(404, 'Historical snapshot missing');
    if (!Array.isArray(params.expected) || params.expected.length > MAX_FRAGMENTS) fail(400, 'Expected ETags required');
    const selections = params.selections ?? source.snapshot.fragments.map(({ id }) => ({ fragmentId: id }));
    if (!Array.isArray(selections) || !selections.length || selections.length > MAX_FRAGMENTS)
        fail(400, 'Invalid restore selections');
    const selectedIds = selections.map(({ fragmentId }) => identifier(fragmentId));
    if (new Set(selectedIds).size !== selectedIds.length) fail(400, 'Duplicate restore target');
    const historicalSnapshot = await readSnapshot(context, {
        ...source.snapshot,
        fragments: source.snapshot.fragments.filter(
            (entry) => entry.id === context.projectId || selectedIds.includes(entry.id),
        ),
    });
    const historicalProject =
        historicalSnapshot.fragments.find((fragment) => fragment.id === context.projectId) ?? context.project;
    const plan = [];
    for (const selection of selections) {
        const historical = historicalSnapshot.fragments.find((fragment) => fragment.id === selection.fragmentId);
        if (!historical) fail(403, 'Target is not in the selected project snapshot');
        if (historical.id !== context.projectId && !ownVariation(historicalProject, historical))
            fail(403, 'Unsafe restore target');
        const expected = params.expected.find((item) => item.fragmentId === selection.fragmentId)?.etag;
        text(expected, 'expected ETag', 200);
        if (expected === '*') fail(400, 'Wildcard ETags are not permitted');
        if (selection.fields !== undefined && (!Array.isArray(selection.fields) || !selection.fields.length)) {
            fail(400, 'Invalid selected fields');
        }
        const { fragment, etag } = await readFragment(context, historical.id);
        if (fragment.path !== historical.path) fail(409, 'Historical fragment moved');
        if (etag !== expected) fail(409, 'Fragment changed; reload before restoring');
        const payload = restorePayload(fragment, historical, selection.fields);
        for (const path of references(payload)) await readPath(context, path);
        const tagsChanged = JSON.stringify(tagIds(payload.tags)) !== JSON.stringify(tagIds(fragment.tags ?? []));
        const tags = tagsChanged ? await readTags(context, fragment.id) : null;
        if (tags && JSON.stringify(tags.tags) !== JSON.stringify(tagIds(fragment.tags ?? [])))
            fail(409, 'Tags changed during preflight');
        plan.push({
            id: fragment.id,
            expected,
            payload,
            before: fragment,
            tags,
            contentSelected: selection.fields === undefined || selection.fields.some((field) => field !== '@tags'),
        });
    }
    const before = { fragments: plan.map((item) => item.before) };
    bounded({
        before,
        after: plan.map((item) => ({ ...item.before, ...item.payload })),
        changes: diff(before, { fragments: plan.map((item) => ({ ...item.before, ...item.payload })) }),
        reserved: ' '.repeat(20000),
    });
    await persist(
        context,
        'restore-intent',
        {
            id: crypto.randomUUID(),
            requestId: context.requestId,
            user: context.user,
            createdAt: new Date().toISOString(),
            eventId: source.id,
            targets: plan.map(({ id, expected }) => ({ fragmentId: id, etag: expected })),
        },
        INTENT_RETENTION,
    );
    const restored = [];
    const failures = [];
    const after = [];
    for (const item of plan) {
        try {
            await writeDraft(context, item);
            restored.push(item.id);
            after.push({ ...item.before, ...item.payload });
        } catch (error) {
            failures.push({
                fragmentId: item.id,
                statusCode: error.statusCode ?? 502,
                error: 'Draft restore failed',
                ...(error.partial ? { partial: true } : {}),
            });
            after.push(error.partial ? { ...item.before, ...item.payload, tags: item.before.tags } : item.before);
            for (const remaining of plan.slice(after.length)) {
                failures.push({ fragmentId: remaining.id, statusCode: 424, error: 'Not attempted after earlier failure' });
                after.push(remaining.before);
            }
            break;
        }
    }
    let result;
    try {
        result = await writeEvent(
            context,
            'restore',
            before,
            { fragments: after },
            {
                changes: diff(before, { fragments: after }),
                restored,
                ...(failures.length ? { failures } : {}),
                sourceEventId: source.id,
            },
        );
    } catch {
        throw Object.assign(new Error('Draft writes finished but audit completion failed; do not retry blindly'), {
            statusCode: 503,
            result: { restored, failures, auditPending: true },
        });
    }
    return { ...result, restored, ...(failures.length ? { failures } : {}) };
}

async function execute(operation, params) {
    if ((params.__ow_method ?? '').toLowerCase() !== 'post') fail(405, 'POST required');
    identifier(params.projectId);
    const identity = await authenticate(params);
    const state = await init();
    if (operation === 'restore') await authorizeRestore(state, identity.user.email);
    const context = {
        ...identity,
        operation,
        phase: params.phase,
        endpoint: endpoint(params),
        state,
        projectId: params.projectId,
        requestId: operation === 'list' ? undefined : text(params.requestId, 'request ID'),
        targetId: params.targetId,
        targetPath: params.targetPath,
        fingerprint: fingerprint(operation, params),
    };
    const completing = operation === 'record' && params.phase === 'complete';
    if (!completing) {
        context.project = (await readFragment(context, context.projectId)).fragment;
        assertProject(context.project);
    }
    const events = await readEntries(context.state, context.projectId);
    if (operation !== 'list') {
        const previous = events.find((event) => event.requestId === context.requestId && event.user.id === context.user.id);
        if (previous) {
            if (operation !== 'record' && previous.fingerprint !== context.fingerprint) fail(409, 'Request ID already used');
            if (operation === 'record' && params.action && previous.action !== params.action)
                fail(409, 'Request ID already used');
            if (operation === 'record' && params.phase === 'complete' && previous.intentId !== params.intentId) {
                fail(409, 'Request ID belongs to a different intent');
            }
            if (operation === 'record' && params.phase === 'prepare') {
                if (previous.action !== params.action || (params.targetId && previous.targetId !== params.targetId)) {
                    fail(409, 'Request ID already used');
                }
                return { intentId: previous.intentId, event: previous };
            }
            return operation === 'restore'
                ? {
                      event: previous,
                      restored: previous.restored,
                      ...(previous.failures ? { failures: previous.failures } : {}),
                  }
                : { event: previous };
        }
        if (events.length >= MAX_ENTRIES) fail(507, 'Project history capacity reached; no retained events were removed');
    }
    if (operation === 'list') return list(events, params);
    if (operation === 'record') return record(context, params);
    if (operation === 'backup') {
        const label = params.label === undefined ? 'Manual backup' : text(params.label, 'backup label');
        const current = await snapshot(context, context.project);
        const manifest = await versionSnapshot(context, current);
        return writeEvent(context, 'backup', current, current, { label, isBackup: true, snapshot: manifest });
    }
    if (operation === 'restore') return restore(context, params, events);
    fail(400, 'Unknown history operation');
}

module.exports = { execute };
