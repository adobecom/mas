const { init } = require('@adobe/aio-lib-state');
const { fetchOdin } = require('../common.js');
const {
    readProjectFragment,
    getProjectPaths,
    getProjectLocales,
    getProjectSnapshots,
    hasPendingSnapshot,
} = require('./project.js');
const { resolvePaths } = require('./resolver.js');
const { PUBLISH_REFERENCE_STATUSES } = require('./publisher.js');
const { isDictionaryIndex } = require('./publish-core.js');

const STUDIO_ORG_ID = '3B962FB55F5F922E0A495C88';
const GROUP_PERMISSIONS = new Map([
    ['GRP-ODIN-MAS-ACOM-CURATORS', null],
    ['GRP-ODIN-MAS-ADMINS', null],
    ['GRP-ODIN-MAS-CCDAH-CURATORS', ['ccd', 'adobe-home']],
]);
const PROJECT_MODEL = '/conf/mas/settings/dam/cfm/models/bulk-publish-project';

function fail(statusCode, message = 'Bulk publish permission denied') {
    throw Object.assign(new Error(message), { statusCode });
}

async function imsData(token, resource) {
    try {
        const response = await fetch(`https://ims-na1.adobelogin.com/ims/${resource}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            redirect: 'error',
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            fail([401, 403].includes(response.status) ? response.status : 502, 'Unable to verify IMS membership');
        }
        return await response.json();
    } catch (error) {
        fail(error.statusCode ?? 502, 'Unable to verify IMS membership');
    }
}

async function membershipGroups(token) {
    const profile = await imsData(token, 'profile/v1');
    if (!(profile.id ?? profile.userId) || !profile.email) fail(401, 'Unable to verify IMS identity');
    if (profile.email.toLowerCase().endsWith('@adobetest.com')) {
        const organizations = await imsData(token, 'organizations/v5');
        if (!Array.isArray(organizations)) fail(502, 'Unable to verify IMS membership');
        const organization = organizations.find(
            ({ orgRef }) =>
                orgRef?.authSrc === 'AdobeOrg' && [STUDIO_ORG_ID, `${STUDIO_ORG_ID}@AdobeOrg`].includes(orgRef.ident),
        );
        return (organization?.groups ?? []).map(({ groupName }) => groupName);
    }
    try {
        const state = await init();
        const cached = await state.get('mas-users');
        const users = JSON.parse(cached?.value ?? 'null');
        if (!Array.isArray(users)) fail(503);
        return users.find((entry) => entry.userPrincipalName?.toLowerCase() === profile.email.toLowerCase())?.groups ?? [];
    } catch {
        fail(503, 'Bulk publish permissions are temporarily unavailable');
    }
}

/** Returns bulk-publish capabilities from verified IMS identity and authoritative memberships. */
async function getPermissions(token) {
    const groups = await membershipGroups(token);
    if (!Array.isArray(groups) || groups.some((group) => typeof group !== 'string')) {
        fail(503, 'Bulk publish permissions are temporarily unavailable');
    }
    const surfaces = new Set();
    for (const group of groups) {
        const name = group.toUpperCase();
        if (!GROUP_PERMISSIONS.has(name)) continue;
        const scope = GROUP_PERMISSIONS.get(name);
        if (scope === null) return { allowed: true };
        for (const surface of scope) surfaces.add(surface);
    }
    return surfaces.size ? { allowed: true, surfaces: [...surfaces] } : { allowed: false };
}

function surfaceOf(path) {
    if (typeof path !== 'string' || !/^\/content\/dam\/mas\/[\w-]+\/[\w-]+\/[^?#%\\\s]+$/.test(path)) fail(403);
    if (
        path
            .split('/')
            .slice(1)
            .some((part) => !part || part === '.' || part === '..')
    )
        fail(403);
    return path.split('/')[4];
}

function pathAssertion(permissions, projectSurface) {
    return (paths) => {
        if (!permissions.surfaces) return;
        if (!Array.isArray(paths)) fail(403);
        for (const path of paths) {
            const surface = surfaceOf(path);
            if (!permissions.surfaces.includes(surface) || (projectSurface && surface !== projectSurface)) {
                fail(403);
            }
        }
    };
}

async function readTarget(odinEndpoint, uri, authToken, request = fetchOdin) {
    try {
        const response = await request(odinEndpoint, uri, authToken, { ignoreErrors: [404] });
        if (response.status === 404) return null;
        if (!response.ok) fail(502);
        return await response.json();
    } catch {
        fail(502, 'Unable to verify bulk publish targets');
    }
}

/** Separates snapshot expansion flags from the references implicitly included by Odin publication. */
function getReferencePaths(
    fragment,
    { includeCards = false, includeVariations = false, includeWorkflowReferences = false } = {},
) {
    const paths = [];
    if (includeWorkflowReferences && !Array.isArray(fragment.fields)) fail(502, 'Unable to verify bulk publish targets');
    for (const field of fragment.fields ?? []) {
        if (
            includeWorkflowReferences &&
            (['content-fragment', 'content-reference', 'fragment-reference'].includes(field.type) ||
                ['fragments', 'cards', 'collections', 'variations'].includes(field.name))
        ) {
            if (!Array.isArray(field.values)) fail(502, 'Unable to verify bulk publish targets');
            paths.push(...field.values);
            continue;
        }
        if (includeCards && (field.name === 'cards' || field.name === 'collections')) {
            paths.push(...(field.values ?? []));
        }
        if (includeVariations && field.name === 'variations') {
            paths.push(...(field.values ?? []));
        }
    }
    if (includeWorkflowReferences) {
        if (fragment.references != null && !Array.isArray(fragment.references)) {
            fail(502, 'Unable to verify bulk publish targets');
        }
        for (const reference of fragment.references ?? []) paths.push(reference?.path ?? reference?.id);
    }
    return paths;
}

async function readReference(input, target, request) {
    const byPath = target.startsWith('/');
    const uri = byPath
        ? `/adobe/sites/cf/fragments?${
              input.includeWorkflowReferences
                  ? new URLSearchParams({ path: target, references: 'direct-hydrated' })
                  : `path=${target}`
          }`
        : `/adobe/sites/cf/fragments/${target}?references=direct-hydrated`;
    const data = await readTarget(input.odinEndpoint, uri, input.authToken, request);
    const fragment = byPath ? data?.items?.[0] : data;
    if (!fragment) {
        if (input.includeWorkflowReferences) fail(502, 'Unable to verify bulk publish targets');
        return null;
    }
    surfaceOf(fragment.path);
    if (input.includeWorkflowReferences && (byPath ? fragment.path !== target : fragment.id !== target)) {
        fail(502, 'Unable to verify bulk publish targets');
    }
    return fragment;
}

/** Authorizes explicit snapshot or implicit publishing references in one read-only, cycle-safe traversal. */
async function authorizePaths(input, assertPaths, request = fetchOdin) {
    const { paths, includeWorkflowReferences = false } = input;
    assertPaths(paths);
    const visited = new Map();
    const queue = paths.map((target) => ({ target, explicit: true }));
    for (const { target, explicit } of queue) {
        if (typeof target !== 'string') fail(403);
        const byPath = target.startsWith('/');
        if (byPath) {
            if (explicit) assertPaths([target]);
            else surfaceOf(target);
        }
        if (!byPath && (!includeWorkflowReferences || !/^[\w-]+$/.test(target))) fail(403);
        let record = visited.get(target);
        if (record) {
            if (explicit) assertPaths([record.fragment.path]);
            if (explicit ? record.explicit : record.workflow) continue;
        }
        const fragment = record?.fragment ?? (await readReference(input, target, request));
        if (!fragment) continue;
        if (explicit || PUBLISH_REFERENCE_STATUSES.includes(fragment.status)) {
            assertPaths([fragment.path]);
        } else if (fragment.status !== 'PUBLISHED') {
            fail(502, 'Unable to verify bulk publish targets');
        }
        if (!record) {
            record = visited.get(fragment.path);
            if (record && (explicit ? record.explicit : record.workflow)) {
                visited.set(target, record);
                continue;
            }
        }
        record ??= { fragment, explicit: false, workflow: false };
        record.explicit ||= explicit;
        record.workflow ||= !explicit || !isDictionaryIndex(fragment.path);
        visited.set(target, record);
        visited.set(fragment.path, record);
        const refs =
            includeWorkflowReferences && explicit && isDictionaryIndex(fragment.path) ? [] : getReferencePaths(fragment, input);
        if (includeWorkflowReferences && explicit) {
            const expanded = resolvePaths(
                getReferencePaths(fragment, { ...input, includeWorkflowReferences: false }),
                input.locales,
            );
            for (const reference of expanded) {
                if (reference.startsWith('/')) assertPaths([reference]);
            }
            queue.push(...expanded.map((reference) => ({ target: reference, explicit: true })));
        } else if (!includeWorkflowReferences) {
            assertPaths(refs);
        }
        queue.push(...refs.map((reference) => ({ target: reference, explicit: !includeWorkflowReferences })));
    }
}

/** Authorizes the current fragment IDs read or restored by snapshot operations; deleted fragments remain skippable. */
async function authorizeEntries(input, permissions, assertPaths) {
    permissions ??= await getPermissions(input.authToken);
    if (!permissions.allowed) fail(403);
    assertPaths ??= pathAssertion(permissions);
    if (!permissions.surfaces) return;
    for (const raw of input.entries) {
        let entry;
        try {
            entry = JSON.parse(raw);
        } catch {
            fail(403);
        }
        if (typeof entry.fragmentId !== 'string' || !/^[\w-]+$/.test(entry.fragmentId)) fail(403);
        const fragment = await readTarget(input.odinEndpoint, `/adobe/sites/cf/fragments/${entry.fragmentId}`, input.authToken);
        if (fragment) assertPaths([fragment.path]);
    }
}

/** Authorizes only the project resources consumed by the server-selected operation. */
async function authorizeProject(input, fragment, operation = 'publish') {
    const permissions = await getPermissions(input.authToken);
    if (!permissions.allowed) fail(403);
    if (!permissions.surfaces && (operation === 'dispatch' || operation === 'snapshot')) {
        return { fragment, permissions, assertPaths: pathAssertion(permissions) };
    }
    if (permissions.surfaces && (typeof input.projectId !== 'string' || !/^[\w-]+$/.test(input.projectId))) fail(403);
    if (!fragment) {
        try {
            fragment = (await readProjectFragment(input.odinEndpoint, input.projectId, input.authToken)).fragment;
        } catch {
            fail(502, 'Unable to verify bulk publish project');
        }
    }
    if (!permissions.surfaces) return { fragment, permissions, assertPaths: pathAssertion(permissions) };
    const model = fragment.model?.path ?? fragment.model?.id ?? fragment.modelId ?? '';
    if ((model.startsWith('/') ? model : Buffer.from(model, 'base64').toString()) !== PROJECT_MODEL) fail(403);
    const projectSurface = surfaceOf(fragment.path);
    const assertPaths = pathAssertion(permissions, projectSurface);
    assertPaths([fragment.path]);
    const context = { fragment, permissions, assertPaths };
    if (operation === 'reset') return context;
    if (operation === 'revert') {
        await authorizeEntries({ ...input, entries: getProjectSnapshots(fragment) }, permissions, assertPaths);
        return context;
    }
    if (operation === 'save') {
        assertPaths(getProjectPaths(fragment));
        return context;
    }
    if (operation === 'snapshot') {
        assertPaths(input.paths);
        return context;
    }
    const locales = getProjectLocales(fragment);
    const entries = getProjectSnapshots(fragment);
    const paths =
        (input.includeCards || input.includeVariations) && hasPendingSnapshot(entries)
            ? entries.map((entry) => JSON.parse(entry).path)
            : getProjectPaths(fragment);
    const resolved = resolvePaths(paths, locales);
    assertPaths([...paths, ...resolved]);
    await authorizePaths(
        {
            ...input,
            paths: resolved,
            locales,
            includeWorkflowReferences: true,
        },
        assertPaths,
    );
    return context;
}

module.exports = { getPermissions, authorizeProject, authorizeEntries, authorizePaths, getReferencePaths };
