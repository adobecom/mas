const crypto = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const { Core } = require('@adobe/aio-sdk');
const { init } = require('@adobe/aio-lib-state');
const { getBearerToken, isAllowed } = require('../../utils.js');
const { DEFAULT_LOCALES } = require('../locales.js');
const {
    versionFieldValues,
    compareVersionValues,
    restoreVersionFields,
} = require('../../../../studio/src/common/utils/fragment-version.js');

const logger = Core.Logger('promo-history', { level: 'info' });
const RETENTION = 95 * 86400;
const INTENT_RETENTION = 86400;
const MAX_ENTRIES = 2000;
const MAX_PENDING_INTENTS = 50;
const MAX_BYTES = 750000;
const MAX_FRAGMENTS = 100;
const PROJECT_MODEL = '/conf/mas/settings/dam/cfm/models/promotion';
const RESTORE_GROUPS = new Set(['GRP-ODIN-MAS-ADMINS', 'GRP-ODIN-MAS-PROMO-POWERUSERS']);
const RECORD_GROUPS = new Set([...RESTORE_GROUPS, 'GRP-ODIN-MAS-PROMO-EDITORS']);
const ACTIONS = new Set(['create', 'save', 'delete', 'duplicate', 'publish', 'unpublish']);
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const VARIATION_PATH = /^\/content\/dam\/mas\/[\w-]+\/[\w-]+\/promotions\//;

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

async function authorizeWrite(state, email, operation) {
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
    const permitted = operation === 'restore' ? RESTORE_GROUPS : RECORD_GROUPS;
    if (!groups.some((group) => permitted.has(group.toUpperCase()))) {
        fail(
            403,
            operation === 'restore'
                ? 'Restore requires MAS admin or promotion power-user membership'
                : 'Recording requires promotion author membership',
        );
    }
}

function endpoint(params) {
    const url = new URL(params.odinEndpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
        fail(500, 'Invalid configured AEM endpoint');
    }
    return url.origin;
}

async function aem(context, suffix, options = {}, resource = 'fragments') {
    const response = await fetch(`${context.endpoint}/adobe/sites/cf/${resource}${suffix}`, {
        ...options,
        headers: { Authorization: `Bearer ${context.token}`, Accept: 'application/json', ...options.headers },
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
        const url = new URL(`${context.endpoint}/adobe/sites/cf/${resource}${suffix}`);
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
            VARIATION_PATH.test(fragment.path) && fragment.path.split('/').slice(6).join('/').startsWith(`promotions/${name}/`)
        );
    });
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
        let entry = context.capture?.versions.find((entry) => entry.id === fragment.id);
        if (!entry) {
            if (context.capture?.creating) fail(503, 'AEM version creation could not be verified; review the pending audit');
            if (context.capture) {
                context.capture.creating = fragment.id;
                await saveCapture(context);
            }
            let response;
            try {
                response = await aem(context, `/${identifier(fragment.id)}/versions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ comment: `Promotion history: ${context.requestId}` }),
                });
            } catch (error) {
                if (context.capture && error.statusCode) {
                    delete context.capture.creating;
                    await saveCapture(context);
                }
                throw error;
            }
            const location = response.headers.get('location');
            if (!location) fail(502, 'AEM did not return the created version');
            const versionUrl = new URL(location, context.endpoint);
            const prefix = `/adobe/sites/cf/fragments/${fragment.id}/versions/`;
            if (versionUrl.origin !== context.endpoint || !versionUrl.pathname.startsWith(prefix)) {
                fail(502, 'AEM returned an invalid version location');
            }
            const versionId = decodeURIComponent(versionUrl.pathname.slice(prefix.length));
            if (!versionId || versionId.includes('/')) fail(502, 'AEM returned an invalid version ID');
            entry = {
                id: fragment.id,
                path: fragment.path,
                versionId,
                ...(fragment.status ? { status: fragment.status } : {}),
            };
            if (context.capture) {
                context.capture.versions.push(entry);
                delete context.capture.creating;
                await saveCapture(context);
            }
        }
        const historical = await readVersion(context, entry, [250, 500, 1000]);
        if (diff({ fragments: [fragment] }, { fragments: [historical] }).length) {
            fail(409, 'Fragment changed while creating its AEM version; reload and retry');
        }
        fragments.push(entry);
    }
    const confirmed = { fragments: [] };
    for (const fragment of current.fragments) confirmed.fragments.push((await readFragment(context, fragment.id)).fragment);
    if (
        diff(current, confirmed).length ||
        current.fragments.some((fragment, index) => {
            const live = confirmed.fragments[index];
            return (
                live.path !== fragment.path || (live.status !== fragment.status && fragment.id !== context.publicationTarget)
            );
        })
    )
        fail(409, 'Fragment changed while creating its AEM version; reload and retry');
    return { fragments };
}

async function nativeInheritanceParent(context, path) {
    const parent = await readPath(context, path);
    const { fragment } = await readFragment(context, parent.id);
    if (fragment.path !== path) fail(409, 'Inheritance source moved; reload and retry');
    return fragment;
}

async function groupedInheritanceParent(context, sourcePath) {
    const response = await aem(context, '/referencedBy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [sourcePath] }),
    });
    const refs = (await response.json()).items?.[0]?.parentReferences ?? [];
    if (refs.length > MAX_FRAGMENTS) fail(413, 'Too many inheritance parent references');
    const [, , , , surface, locale] = sourcePath.split('/');
    const [lang, country] = locale.split('_');
    const family = (DEFAULT_LOCALES[surface] ?? []).find(
        (entry) => entry.lang === lang && [entry.country, ...(entry.regions ?? [])].includes(country),
    );
    const parents = new Map();
    for (const ref of refs) {
        if (
            ref.type !== 'content-fragment' ||
            !family ||
            !ref.path?.startsWith(`/content/dam/mas/${surface}/${family.lang}_${family.country}/`) ||
            ref.path.includes('/pzn/') ||
            ownVariation(context.project, ref)
        )
            continue;
        const candidate = await nativeInheritanceParent(context, ref.path);
        if (values(candidate, 'variations').includes(sourcePath)) parents.set(candidate.id, candidate);
    }
    return parents.size === 1
        ? { parent: [...parents.values()][0] }
        : { reason: parents.size ? 'grouped-parent-ambiguous' : 'grouped-parent-missing' };
}

async function historySnapshot(context, current) {
    const snapshot = await versionSnapshot(context, current);
    return { ...snapshot, ...(await inheritanceContext(context, current)) };
}

async function inheritanceContext(context, current) {
    const sources = new Map();
    for (const path of references(context.project)) {
        const match = /^(\/content\/dam\/mas\/[\w-]+\/[\w-]+)\/(.+)$/.exec(pathValue(path));
        if (!match || match[2].startsWith('promotions/')) continue;
        for (const name of promotionNames(context.project)) {
            sources.set(`${match[1]}/promotions/${name}/${match[2]}`, path);
        }
    }
    const inheritance = [];
    const inheritanceUnavailable = [];
    for (const fragment of current.fragments) {
        if (!ownVariation(context.project, fragment)) continue;
        const suffix = /^(.*)-(\d+)$/.exec(fragment.path);
        const parentPath =
            sources.get(fragment.path) ??
            (suffix && Number(suffix[2]) >= 1 && Number(suffix[2]) <= 50 ? sources.get(suffix[1]) : undefined);
        if (!parentPath) continue;
        const resolved = parentPath.includes('/pzn/')
            ? await groupedInheritanceParent(context, parentPath)
            : { parent: await nativeInheritanceParent(context, parentPath) };
        if (!resolved.parent) {
            inheritanceUnavailable.push({ fragmentId: fragment.id, reason: resolved.reason });
            continue;
        }
        const manifest = await versionSnapshot(context, { fragments: [resolved.parent] });
        inheritance.push({ fragmentId: fragment.id, ...manifest.fragments[0] });
    }
    return {
        ...(inheritance.length ? { inheritance } : {}),
        ...(inheritanceUnavailable.length ? { inheritanceUnavailable } : {}),
    };
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
        if (params.targetPath !== project.path && !ownVariation(project, { path: params.targetPath }))
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
        if (target.id !== project.id && !ownVariation(project, target)) {
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

function canonicalEntry(entries) {
    const score = (entry) =>
        (entry.restored?.length ?? 0) * (MAX_FRAGMENTS + 1) +
        (entry.afterSnapshot?.fragments.length ?? 0) +
        (['confirmed', 'failed'].includes(entry.publicationOutcome) ? 1 : 0);
    entries.sort(
        (a, b) =>
            score(b) - score(a) ||
            (a.failures?.length ?? 0) - (b.failures?.length ?? 0) ||
            b.createdAt.localeCompare(a.createdAt) ||
            JSON.stringify(a).localeCompare(JSON.stringify(b)),
    );
    const [entry, ...others] = entries;
    if (entry.action !== 'restore') return entry;
    const outcome = (attempt) => JSON.stringify([attempt.restored, attempt.failures, attempt.changes]);
    const alternatives = others.filter((attempt) => outcome(attempt) !== outcome(entry));
    return alternatives.length ? { ...entry, concurrentAttempts: alternatives } : entry;
}

async function readEntries(state, projectId, kind = 'event', storageKeys, entryId = '') {
    const result = [];
    for await (const { keys } of state.list({ match: `${namespace(projectId, kind)}${entryId ? `${entryId}.` : ''}*` })) {
        for (let offset = 0; offset < keys.length; offset += 10) {
            const batch = keys.slice(offset, offset + 10);
            const entries = await Promise.all(batch.map((key) => state.get(key)));
            for (const [index, entry] of entries.entries()) {
                if (entry?.value) {
                    const value = JSON.parse(entry.value);
                    result.push(value);
                    if (storageKeys) {
                        if (!storageKeys.has(value.id)) storageKeys.set(value.id, []);
                        storageKeys.get(value.id).push(batch[index]);
                    }
                }
            }
        }
    }
    const grouped = new Map();
    for (const entry of result) {
        if (!grouped.has(entry.id)) grouped.set(entry.id, []);
        grouped.get(entry.id).push(entry);
    }
    return [...grouped.values()].map(canonicalEntry);
}

async function persist(context, kind, value, ttl = RETENTION) {
    const suffix = kind === 'event' ? `${value.id}.${crypto.randomUUID()}` : crypto.randomUUID();
    await context.state.put(`${namespace(context.projectId, kind)}${suffix}`, bounded(value), { ttl });
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
    return versionFieldValues(fragment);
}

function diff(before, after) {
    const old = new Map(before.fragments.map((f) => [f.id, f]));
    const current = new Map(after.fragments.map((f) => [f.id, f]));
    const changes = [];
    for (const id of new Set([...old.keys(), ...current.keys()])) {
        const previous = changeValues(old.get(id));
        const next = changeValues(current.get(id));
        for (const { field, before: beforeValue, after: afterValue } of compareVersionValues(previous, next, null)) {
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
    const [canonical] = await readEntries(context.state, context.projectId, 'event', null, event.id);
    return { event: canonical };
}

async function saveCapture(context) {
    await context.state.put(
        `${namespace(context.projectId, 'completion')}${stableId(context, 'completion')}`,
        bounded(context.capture),
        { ttl: INTENT_RETENTION },
    );
}

async function stateEvent(context, action, before, target, extra = {}) {
    if (['create', 'duplicate'].includes(action)) {
        const existing = context.events.find(
            (event) => ['create', 'duplicate'].includes(event.action) && event.targetId === target.id,
        );
        if (existing) {
            await authorizeEvent(context, existing);
            return { event: existing, unchanged: true };
        }
    }
    const publication = ['publish', 'unpublish'].includes(action);
    context.publicationTarget = publication ? target.id : undefined;
    const key = `${namespace(context.projectId, 'completion')}${stableId(context, 'completion')}`;
    const pending = await context.state.get(key);
    const { fragment, etag } = await readFragment(context, target.id);
    if (context.completionEtag !== undefined && context.completionEtag !== etag) {
        throw Object.assign(new Error('Completed fragment changed; the original operation result cannot be captured'), {
            statusCode: 409,
            result: { auditPending: true },
        });
    }
    const after = auditSnapshot(fragment);
    if (
        fragment.path !== target.path ||
        (publication
            ? diff(auditSnapshot(target), after).length
            : JSON.stringify(after) !== JSON.stringify(auditSnapshot(target)))
    ) {
        fail(409, 'Audit target changed before capture; reload before continuing');
    }
    if (!etag) fail(409, 'AEM did not provide a completion concurrency token');
    if (pending?.value) {
        context.capture = JSON.parse(pending.value);
        if (
            context.capture.action !== action ||
            context.capture.intentId !== extra.intentId ||
            context.capture.sourceProjectId !== extra.sourceProjectId ||
            context.capture.workflowInstanceId !== extra.workflowInstanceId ||
            (publication
                ? diff(context.capture.after, after).length
                : context.capture.etag !== etag || JSON.stringify(context.capture.after) !== JSON.stringify(after))
        )
            throw Object.assign(new Error('Pending audit target changed; the original completion cannot be verified'), {
                statusCode: 409,
                result: { auditPending: true },
            });
        before = context.capture.before;
    } else {
        context.capture = {
            action,
            intentId: extra.intentId,
            sourceProjectId: extra.sourceProjectId,
            workflowInstanceId: extra.workflowInstanceId,
            before,
            after,
            etag,
            versions: [],
        };
    }
    try {
        await saveCapture(context);
        if (!context.capture.snapshot) {
            context.capture.snapshot = await historySnapshot(context, { fragments: [fragment] });
            await saveCapture(context);
        }
        return await writeEvent(context, action, before, after, {
            beforeContext: {},
            ...extra,
            restoreMode: 'state',
            afterSnapshot: context.capture.snapshot,
            snapshot: context.capture.snapshot,
        });
    } catch {
        throw Object.assign(new Error('Content operation finished but history capture failed; audit completion is pending'), {
            statusCode: 503,
            result: { auditPending: true },
        });
    }
}

async function duplicateSource(context, params) {
    if (params.sourceProjectId === undefined) return {};
    if (params.action !== 'duplicate') fail(400, 'Source project is only valid for duplication');
    const { fragment } = await readFragment(context, identifier(params.sourceProjectId));
    assertProject(fragment);
    return { sourceProjectId: fragment.id };
}

async function record(context, params) {
    if (params.phase === 'complete') {
        identifier(params.intentId);
        const intent = (await readEntries(context.state, context.projectId, 'intent')).find(
            (entry) => entry.id === params.intentId,
        );
        if (!intent) fail(404, 'History intent expired or missing');
        if (intent.user.id !== context.user.id || intent.requestId !== context.requestId) fail(403, 'History intent mismatch');
        if (['publish', 'unpublish'].includes(intent.action) && intent.targetId !== context.projectId)
            fail(400, 'Publication history is only available for the promotion project');
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
        if (target && target.id !== context.projectId && !ownVariation(project, target))
            fail(403, 'Target is outside this promotion project');
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
        const extra = {
            intentId: intent.id,
            changes: changes.filter((change) => change.fragmentId === context.targetId),
            ...(intent.sourceProjectId ? { sourceProjectId: intent.sourceProjectId } : {}),
            ...(intent.beforeContext ? { beforeContext: intent.beforeContext } : {}),
        };
        if (['publish', 'unpublish'].includes(intent.action)) {
            if (params.workflowInstanceId !== undefined) extra.workflowInstanceId = params.workflowInstanceId;
            const oldTarget = before.fragments.find((fragment) => fragment.id === context.targetId);
            extra.publicationBeforeStatus = oldTarget?.status ?? null;
            Object.assign(
                extra,
                publicationResult({ ...extra, action: intent.action, targetPath: intent.targetPath }, null, target),
            );
        }
        if (params.sourceProjectId !== undefined) {
            if (intent.sourceProjectId && params.sourceProjectId !== intent.sourceProjectId)
                fail(409, 'Source project does not match intent');
            Object.assign(extra, await duplicateSource(context, { ...params, action: intent.action }));
        }
        return target
            ? stateEvent(context, intent.action, before, target, extra)
            : writeEvent(context, intent.action, before, after, extra);
    }
    if (!ACTIONS.has(params.action)) fail(400, 'Invalid audit action');
    if (!params.phase) {
        if (!['create', 'duplicate'].includes(params.action)) fail(400, 'Prepare intent required');
        const target = await auditTarget(context, params);
        if (!target) fail(404, 'Created fragment is not available');
        context.targetId = target.id;
        context.targetPath = target.path;
        return stateEvent(context, params.action, { fragments: [] }, target, await duplicateSource(context, params));
    }
    if (params.phase !== 'prepare') fail(400, 'Invalid record phase');
    const target = await auditTarget(context, params);
    if (['publish', 'unpublish'].includes(params.action) && target?.id !== context.projectId)
        fail(400, 'Publication history is only available for the promotion project');
    const intents = await readEntries(context.state, context.projectId, 'intent');
    const existing = intents.find((intent) => intent.requestId === context.requestId && intent.user.id === context.user.id);
    if (existing) {
        if (
            existing.action !== params.action ||
            existing.sourceProjectId !== params.sourceProjectId ||
            (params.targetId && existing.targetId !== params.targetId) ||
            (params.targetPath && existing.targetPath !== params.targetPath)
        )
            fail(409, 'Request ID already used');
        return { intentId: existing.id };
    }
    const current = auditSnapshot(target);
    const before = ['create', 'duplicate'].includes(params.action) ? { fragments: [] } : current;
    const provenance = await duplicateSource(context, params);
    const beforeContext =
        target && ['save', 'publish', 'unpublish'].includes(params.action)
            ? await inheritanceContext(context, { fragments: [target] })
            : null;
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
        ...provenance,
        ...(beforeContext ? { beforeContext } : {}),
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
    if (params.eventIds !== undefined) {
        if (!Array.isArray(params.eventIds) || !params.eventIds.length || params.eventIds.length > 100)
            fail(400, 'Invalid history event IDs');
        for (const id of params.eventIds) identifier(id);
    }
    for (const name of ['from', 'to']) {
        if (params[name] && !Number.isFinite(Date.parse(params[name]))) fail(400, `Invalid ${name} date`);
    }
    if (params.query) text(params.query, 'query', 200);
    const current = new Map();
    const inheritance = new Map();
    const inheritanceUnavailable = new Map();
    const ordered = events
        .filter((event) => event.action !== 'restore' && !event.isAudit)
        .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    for (const event of ordered) {
        if (event.action === 'delete') {
            current.delete(event.targetId);
            inheritance.delete(event.targetId);
            inheritanceUnavailable.delete(event.targetId);
            continue;
        }
        const snapshot = event.afterSnapshot ?? (event.restoreMode !== 'undo' ? event.snapshot : null);
        for (const entry of snapshot?.fragments ?? []) {
            current.set(entry.id, entry);
            inheritance.delete(entry.id);
            inheritanceUnavailable.delete(entry.id);
        }
        for (const entry of snapshot?.inheritance ?? []) inheritance.set(entry.fragmentId, entry);
        for (const entry of snapshot?.inheritanceUnavailable ?? []) inheritanceUnavailable.set(entry.fragmentId, entry);
    }
    let filtered = ordered
        .map((event, index) => ({ ...event, version: index + 1 }))
        .filter(
            (event) =>
                (!params.eventIds || params.eventIds.includes(event.id)) &&
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
    return {
        events: page,
        currentSnapshot: {
            fragments: [...current.values()],
            ...(inheritance.size ? { inheritance: [...inheritance.values()] } : {}),
            ...(inheritanceUnavailable.size ? { inheritanceUnavailable: [...inheritanceUnavailable.values()] } : {}),
        },
        ...(filtered.length > limit ? { cursor: `${last.createdAt}|${last.id}` } : {}),
    };
}

async function authorizeEvent(context, event) {
    const targets = [];
    for (const snapshot of [event.snapshot, event.afterSnapshot, event.beforeSnapshot, event.beforeContext]) {
        targets.push(...(snapshot?.fragments ?? []), ...(snapshot?.inheritance ?? []));
    }
    if (event.targetId) targets.push({ id: event.targetId, path: event.targetPath });
    for (const change of event.changes) targets.push({ id: change.fragmentId, path: change.path });
    for (const entry of targets) {
        if (!entry.id) fail(403, 'Historical target access could not be verified');
        const key = JSON.stringify([entry.id, entry.path, entry.versionId]);
        if (!context.access.has(key)) {
            context.access.set(
                key,
                (async () => {
                    const { fragment } = await readFragment(context, entry.id);
                    if (entry.path && fragment.path !== entry.path) fail(409, 'Historical fragment moved');
                    if (entry.versionId) await readVersion(context, entry);
                })(),
            );
        }
        await context.access.get(key);
    }
    for (const attempt of event.concurrentAttempts ?? []) await authorizeEvent(context, attempt);
    return event;
}

function promotionEvents(context, events) {
    return events
        .filter(
            (event) =>
                ((event.targetId ?? event.projectId) === context.projectId || VARIATION_PATH.test(event.targetPath ?? '')) &&
                (!['publish', 'unpublish'].includes(event.action) ||
                    ((event.targetId ?? event.projectId) === context.projectId &&
                        !VARIATION_PATH.test(event.targetPath ?? ''))),
        )
        .map((event) => ({
            ...event,
            changes: event.changes.filter(
                (change) =>
                    change.fragmentId === context.projectId ||
                    VARIATION_PATH.test(change.path ?? (change.fragmentId === event.targetId ? event.targetPath : '')),
            ),
        }));
}

function publicationResult(event, workflow, fragment) {
    const operation = fragment.operations?.replication ?? null;
    const correlated = event.workflowInstanceId && operation?.workflowInstanceId === event.workflowInstanceId;
    const state = (typeof operation === 'string' ? operation : (operation?.status ?? operation?.state))?.toUpperCase();
    if (
        workflow?.invalidFragments?.some((item) => item.fragmentPath === event.targetPath) ||
        (workflow?.end && workflow.state !== 'COMPLETED') ||
        ['FAILED', 'ABORTED', 'CANCELLED', 'ERROR'].includes(workflow?.state) ||
        (correlated && ['FAILED', 'ABORTED', 'CANCELLED', 'ERROR'].includes(state))
    ) {
        return { publicationOutcome: 'failed', publicationStatus: fragment.status, publicationOperation: operation };
    }
    const active = ['PENDING', 'SCHEDULED', 'QUEUED', 'ACCEPTED', 'RUNNING', 'PROCESSING', 'STARTED'].includes(state);
    const settled = !operation || ['COMPLETED', 'SUCCEEDED', 'SUCCESS', 'FINISHED'].includes(state);
    const confirmed =
        workflow?.state === 'COMPLETED' ||
        (!active &&
            !event.workflowInstanceId &&
            settled &&
            fragment.status === (event.action === 'publish' ? 'PUBLISHED' : 'UNPUBLISHED') &&
            fragment.status !==
                (event.publicationBeforeStatus !== undefined ? event.publicationBeforeStatus : event.publicationStatus));
    return {
        publicationOutcome: confirmed ? 'confirmed' : 'pending',
        publicationStatus: fragment.status,
        publicationOperation: operation,
    };
}

async function refreshPublication(context, event) {
    if (!['publish', 'unpublish'].includes(event.action) || event.publicationOutcome !== 'pending') return event;
    try {
        const workflow = event.workflowInstanceId
            ? await (await aem(context, `/${encodeURIComponent(event.workflowInstanceId)}`, {}, 'workflows')).json()
            : null;
        if (event.workflowInstanceId && !workflow?.state) fail(502, 'Publication workflow state is unavailable');
        if (workflow && workflow.type !== `${event.action}-fragments`) fail(409, 'Publication workflow type does not match');
        const { fragment } = await readFragment(context, event.targetId ?? event.projectId);
        if (fragment.path !== event.targetPath) fail(409, 'Publication target moved');
        const updated = { ...event, ...publicationResult(event, workflow, fragment) };
        if (updated.publicationOutcome !== 'pending') {
            for (const key of context.eventKeys.get(event.id)) {
                await context.state.put(key, bounded(updated), {
                    ttl: Math.max(1, Math.ceil((Date.parse(event.createdAt) + RETENTION * 1000 - Date.now()) / 1000)),
                });
            }
        }
        return updated;
    } catch (error) {
        if ([401, 403].includes(error.statusCode)) throw error;
        logger.error('Promotion publication status could not be refreshed');
        return { ...event, publicationCheckError: 'Publication status could not be verified. Reload to retry.' };
    }
}

function restorePayload(current, historical, fields) {
    const chosen = new Set(fields ?? [...changeValues(historical).keys()]);
    const known = changeValues(historical);
    if (!chosen.size || [...chosen].some((field) => !known.has(field))) fail(400, 'Unknown or empty restore fields');
    const payload = {
        title: chosen.has('@title') ? (historical.title ?? '') : (current.title ?? ''),
        description: chosen.has('@description') ? (historical.description ?? '') : (current.description ?? ''),
        tags: chosen.has('@tags') ? (historical.tags ?? []) : (current.tags ?? []),
        fields: restoreVersionFields(current.fields, historical.fields, chosen),
    };
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
    let writing = false;
    try {
        if (item.contentSelected) {
            writing = true;
            await aem(context, `/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'If-Match': item.expected },
                body: JSON.stringify(content),
            });
            writing = false;
            contentWritten = true;
            let confirmed = false;
            for (let attempt = 0; attempt < 10; attempt++) {
                const { fragment } = await readFragment(context, item.id);
                const current = {
                    title: fragment.title ?? '',
                    description: fragment.description ?? '',
                    fields: fragment.fields,
                };
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
            writing = true;
            await aem(context, `/${item.id}/tags`, {
                method: wanted.length ? 'PUT' : 'DELETE',
                headers: { 'Content-Type': 'application/json', 'If-Match': current.etag },
                ...(wanted.length ? { body: JSON.stringify({ tags: wanted }) } : {}),
            });
            writing = false;
        }
    } catch (error) {
        error.partial = contentWritten || (writing && (!error.statusCode || error.statusCode >= 500));
        throw error;
    }
}

async function restore(context, params, events) {
    const source = events.find((event) => event.id === params.eventId);
    if (source?.action === 'restore' || source?.isAudit) fail(404, 'Technical audit events are not restorable versions');
    const snapshot = source?.restoreMode === 'state' ? source.afterSnapshot : source?.snapshot;
    if (!snapshot?.fragments?.length) fail(404, 'Historical snapshot missing');
    const restoreKey = `${namespace(context.projectId, 'restore-intent')}${stableId(context, 'restore-intent')}`;
    const pending = await context.state.get(restoreKey);
    if (pending) {
        throw Object.assign(new Error('Restore was already attempted; review its pending audit before retrying'), {
            statusCode: 409,
            result: { auditPending: true },
        });
    }
    if (!Array.isArray(params.expected) || params.expected.length > MAX_FRAGMENTS) fail(400, 'Expected ETags required');
    const selections = params.selections ?? snapshot.fragments.map(({ id }) => ({ fragmentId: id }));
    if (!Array.isArray(selections) || !selections.length || selections.length > MAX_FRAGMENTS)
        fail(400, 'Invalid restore selections');
    const selectedIds = selections.map(({ fragmentId }) => identifier(fragmentId));
    if (new Set(selectedIds).size !== selectedIds.length) fail(400, 'Duplicate restore target');
    const selectedSource = {
        ...source,
        changes: source.changes.filter((change) => selectedIds.includes(change.fragmentId)),
        concurrentAttempts: [],
    };
    for (const name of ['snapshot', 'afterSnapshot', 'beforeSnapshot', 'beforeContext']) {
        if (source[name])
            selectedSource[name] = {
                ...source[name],
                fragments: source[name].fragments?.filter((entry) => selectedIds.includes(entry.id)),
                inheritance: source[name].inheritance?.filter((entry) => selectedIds.includes(entry.fragmentId)),
            };
    }
    await authorizeEvent(context, selectedSource);
    const historicalSnapshot = await readSnapshot(context, {
        ...snapshot,
        fragments: snapshot.fragments.filter((entry) => entry.id === context.projectId || selectedIds.includes(entry.id)),
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
        const changes = source.changes.filter((change) => change.fragmentId === selection.fragmentId);
        const fields =
            selection.fields ??
            (source.restoreMode === 'undo'
                ? changes.map((change) => change.field)
                : source.restoreMode === 'state'
                  ? [...changeValues(historical).keys()]
                  : undefined);
        if (source.restoreMode === 'undo' && fields.some((field) => !changes.some((change) => change.field === field))) {
            fail(400, 'Only fields changed by this event can be restored');
        }
        const { fragment, etag } = await readFragment(context, historical.id);
        if (fragment.path !== historical.path) fail(409, 'Historical fragment moved');
        if (fragment.id !== context.projectId && !ownVariation(context.project, fragment)) fail(403, 'Unsafe restore target');
        if (etag !== expected) fail(409, 'Fragment changed; reload before restoring');
        const payload = restorePayload(fragment, historical, fields);
        if (!diff(auditSnapshot(fragment), auditSnapshot({ ...fragment, ...payload })).length) continue;
        if (source.restoreMode === 'undo') {
            const currentValues = changeValues(fragment);
            if (
                changes.some(
                    (change) =>
                        fields.includes(change.field) &&
                        JSON.stringify(currentValues.get(change.field) ?? null) !== JSON.stringify(change.after),
                )
            ) {
                fail(409, 'Selected fields changed since this event; review the newer changes before restoring');
            }
        }
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
            contentSelected: fields === undefined || fields.some((field) => field !== '@tags'),
        });
    }
    if (!plan.length) return { unchanged: true, restored: [] };
    const before = { fragments: plan.map((item) => item.before) };
    bounded({
        before,
        after: plan.map((item) => ({ ...item.before, ...item.payload })),
        changes: diff(before, { fragments: plan.map((item) => ({ ...item.before, ...item.payload })) }),
        reserved: ' '.repeat(20000),
    });
    await context.state.put(
        restoreKey,
        bounded({
            id: crypto.randomUUID(),
            requestId: context.requestId,
            user: context.user,
            createdAt: new Date().toISOString(),
            eventId: source.id,
            targets: plan.map(({ id, expected }) => ({ fragmentId: id, etag: expected })),
            before,
        }),
        { ttl: INTENT_RETENTION },
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
        for (const item of plan) {
            if (restored.includes(item.id) || failures.some((failure) => failure.fragmentId === item.id && failure.partial)) {
                const { fragment } = await readFragment(context, item.id);
                const observed = auditSnapshot(fragment);
                const wanted = auditSnapshot(after.find((entry) => entry.id === item.id));
                if (JSON.stringify(observed) !== JSON.stringify(wanted)) {
                    fail(409, 'Restored content changed before history capture');
                }
            }
        }
        result = await writeEvent(
            context,
            'restore',
            before,
            { fragments: after },
            {
                changes: diff(before, { fragments: after }),
                isAudit: true,
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
    return {
        ...result,
        restored: result.event.restored,
        ...(result.event.failures ? { failures: result.event.failures } : {}),
    };
}

async function execute(operation, params) {
    if ((params.__ow_method ?? '').toLowerCase() !== 'post') fail(405, 'POST required');
    if (!['record', 'list', 'restore'].includes(operation)) fail(400, 'Unknown history operation');
    identifier(params.projectId);
    if (params.completionEtag !== undefined) {
        text(params.completionEtag, 'completion ETag', 200);
        if (params.completionEtag === '*') fail(400, 'Wildcard completion ETags are not permitted');
    }
    if (params.workflowInstanceId !== undefined) {
        text(params.workflowInstanceId, 'workflow instance ID', 1000);
        if (['.', '..'].includes(params.workflowInstanceId)) fail(400, 'Invalid workflow instance ID');
    }
    const identity = await authenticate(params);
    const state = await init();
    if (operation !== 'list') await authorizeWrite(state, identity.user.email, operation);
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
        completionEtag: params.completionEtag,
        fingerprint: fingerprint(operation, params),
        eventKeys: new Map(),
        access: new Map(),
    };
    const completing = operation === 'record' && params.phase === 'complete';
    if (!completing) {
        context.project = (await readFragment(context, context.projectId)).fragment;
        assertProject(context.project);
    }
    const events = await readEntries(context.state, context.projectId, 'event', context.eventKeys);
    context.events = events;
    if (operation !== 'list') {
        const previous = events.find((event) => event.requestId === context.requestId && event.user.id === context.user.id);
        if (previous) {
            await authorizeEvent(context, previous);
            if (operation !== 'record' && previous.fingerprint !== context.fingerprint) fail(409, 'Request ID already used');
            if (operation === 'record' && params.action && previous.action !== params.action)
                fail(409, 'Request ID already used');
            if (
                operation === 'record' &&
                params.sourceProjectId !== undefined &&
                previous.sourceProjectId !== params.sourceProjectId
            )
                fail(409, 'Request ID belongs to a different source project');
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
        if (events.filter((event) => event.user.id === context.user.id).length >= MAX_ENTRIES)
            fail(429, 'History capacity reached for this author; no retained events were removed');
        const intents = [
            ...(await readEntries(state, context.projectId, 'intent')),
            ...(await readEntries(state, context.projectId, 'restore-intent')),
        ].filter((intent) => intent.user.id === context.user.id);
        const completed = new Set(events.filter((event) => event.user.id === context.user.id).map((event) => event.requestId));
        const completedIds = new Set(events.map((event) => event.intentId));
        if (
            !intents.some((intent) => intent.requestId === context.requestId) &&
            intents.filter((intent) => !completedIds.has(intent.id) && (!intent.requestId || !completed.has(intent.requestId)))
                .length >= MAX_PENDING_INTENTS
        )
            fail(429, 'Too many pending history intents for this author; complete existing operations before retrying');
    }
    if (operation === 'list') {
        const authorized = [];
        for (const event of promotionEvents(context, events)) {
            try {
                authorized.push(await authorizeEvent(context, event));
            } catch (error) {
                if (![401, 403, 404, 409].includes(error.statusCode)) throw error;
            }
        }
        const page = list(authorized, params);
        for (let offset = 0; offset < page.events.length; offset += 10) {
            const refreshed = await Promise.all(
                page.events.slice(offset, offset + 10).map((event) => refreshPublication(context, event)),
            );
            page.events.splice(offset, refreshed.length, ...refreshed);
        }
        return page;
    }
    if (operation === 'record') return record(context, params);
    return restore(context, params, events);
}

module.exports = { execute };
