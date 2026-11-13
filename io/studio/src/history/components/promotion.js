const PROJECT_MODEL = '/conf/mas/settings/dam/cfm/models/promotion';
const RESTORE_GROUPS = new Set(['GRP-ODIN-MAS-ADMINS', 'GRP-ODIN-MAS-PROMO-POWERUSERS']);
const RECORD_GROUPS = new Set([...RESTORE_GROUPS, 'GRP-ODIN-MAS-PROMO-EDITORS']);
const VARIATION_PATH = /^\/content\/dam\/mas\/[\w-]+\/[\w-]+\/promotions\//;

function fail(statusCode, message) {
    throw Object.assign(new Error(message), { statusCode });
}

function modelPath(fragment) {
    const model = fragment.model?.path ?? fragment.model?.id ?? fragment.modelId;
    return model?.startsWith('/') ? model : Buffer.from(model ?? '', 'base64').toString();
}

function assertRoot(fragment) {
    if (modelPath(fragment) !== PROJECT_MODEL) fail(403, 'Not a promotion project');
}

function promotionNames(root) {
    const tags = root.fields?.find((field) => field.name === 'tags')?.values ?? [];
    return [...tags, ...(root.tags ?? [])]
        .map((tag) => {
            const raw = typeof tag === 'string' ? tag : (tag.id ?? tag.path ?? '');
            return raw.replace(/^\/content\/cq:tags\/mas\//, 'mas:');
        })
        .filter((tag) => tag.startsWith('mas:promotion/'))
        .map((tag) => tag.slice('mas:promotion/'.length))
        .filter((name) => name && !name.split('/').some((part) => !part || part === '.' || part === '..'));
}

function ownsVariation(root, fragment) {
    return promotionNames(root).some(
        (name) =>
            VARIATION_PATH.test(fragment.path) && fragment.path.split('/').slice(6).join('/').startsWith(`promotions/${name}/`),
    );
}

function assertTarget(context, fragment) {
    if (fragment.id !== context.rootId && !ownsVariation(context.root, fragment)) {
        fail(403, 'Target is outside this promotion project');
    }
}

function category(fragment, field) {
    if (modelPath(fragment) !== PROJECT_MODEL) return 'fragments';
    if (['countries', 'geos'].includes(field)) return 'countries';
    if (['offers', 'offer'].includes(field)) return 'offers';
    return field === 'fragments' ? 'fragments' : 'general';
}

function inheritanceMetadata(context, snapshot) {
    const inheritanceUnavailable = snapshot.fragments
        .filter((fragment) => ownsVariation(context.root, fragment))
        .map((fragment) => ({ fragmentId: fragment.id, reason: 'outside-project' }));
    return inheritanceUnavailable.length ? { inheritanceUnavailable } : {};
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

module.exports = { assertRoot, assertTarget, category, inheritanceMetadata, authorizeWrite };
