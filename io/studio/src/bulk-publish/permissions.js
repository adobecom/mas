const { init } = require('@adobe/aio-lib-state');
const { fetchOdin } = require('../common.js');
const { readProjectFragment } = require('./project.js');

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

function pathAssertion(permissions) {
    return (paths) => {
        if (!permissions.surfaces) return;
        if (!Array.isArray(paths)) fail(403);
        for (const path of paths) {
            const surface = surfaceOf(path);
            if (!permissions.surfaces.includes(surface)) {
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

/** Returns references included by the snapshot expansion flags. */
function getReferencePaths(fragment, { includeCards = false, includeVariations = false } = {}) {
    const paths = [];
    for (const field of fragment.fields ?? []) {
        if (includeCards && (field.name === 'cards' || field.name === 'collections')) {
            paths.push(...(field.values ?? []));
        }
        if (includeVariations && field.name === 'variations') {
            paths.push(...(field.values ?? []));
        }
    }
    return paths;
}

/** Authorizes snapshot references in one read-only, cycle-safe traversal. */
async function authorizePaths(input, assertPaths, request = fetchOdin) {
    const { paths, odinEndpoint, authToken } = input;
    assertPaths(paths);
    const visited = new Set();
    const queue = [...paths];
    for (const target of queue) {
        if (typeof target !== 'string' || !target.startsWith('/')) fail(403);
        assertPaths([target]);
        if (visited.has(target)) continue;
        const data = await readTarget(odinEndpoint, `/adobe/sites/cf/fragments?path=${target}`, authToken, request);
        const fragment = data?.items?.[0];
        if (!fragment) continue;
        surfaceOf(fragment.path);
        assertPaths([fragment.path]);
        const alreadyVisited = visited.has(fragment.path);
        visited.add(target);
        if (alreadyVisited) continue;
        visited.add(fragment.path);
        const refs = getReferencePaths(fragment, input);
        assertPaths(refs);
        queue.push(...refs);
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

/** Authorizes project access; Odin controls permissions on its publishing and snapshot targets. */
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
    pathAssertion(permissions)([fragment.path]);
    const targetPermissions = { allowed: true };
    return { fragment, permissions: targetPermissions, assertPaths: pathAssertion(targetPermissions) };
}

module.exports = { getPermissions, authorizeProject, authorizeEntries, authorizePaths, getReferencePaths };
