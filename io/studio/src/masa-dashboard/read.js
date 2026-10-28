const { init } = require('@adobe/aio-lib-state');
const { getBearerToken, isAllowed } = require('../../utils.js');
const { CACHE_KEY, STALE_AFTER_MS, response } = require('./snapshot.js');

/** Validates the Studio caller and resolves admin membership before reading dashboard data. */
async function main(params) {
    if ((params.__ow_method || 'get') !== 'get') return response(405, { error: 'Use GET.' });
    const token = getBearerToken(params);
    if (!token) return response(401, { error: 'Sign in to Studio.' });
    try {
        if (!(await isAllowed(token, 'mas-studio'))) return response(401, { error: 'Sign in to Studio.' });
    } catch {
        return response(401, { error: 'Unable to validate your Studio session.' });
    }
    let email;
    try {
        const profileResponse = await fetch('https://ims-na1.adobelogin.com/ims/profile/v1', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            redirect: 'error',
            signal: AbortSignal.timeout(10000),
        });
        if (!profileResponse.ok)
            return response(profileResponse.status === 401 ? 401 : 502, { error: 'Unable to verify your Studio identity.' });
        const profile = await profileResponse.json();
        email = profile.email?.toLowerCase();
    } catch {
        return response(502, { error: 'Unable to verify your Studio identity.' });
    }
    if (!email) return response(403, { error: 'MAS administrator access is required.' });
    try {
        const state = await init();
        const members = await state.get('mas-users');
        if (!members?.value) return response(503, { error: 'Studio membership data is unavailable.' });
        const user = JSON.parse(members.value).find((member) => member.userPrincipalName?.toLowerCase() === email);
        if (!user?.groups?.some((group) => group.toUpperCase() === 'GRP-ODIN-MAS-ADMINS')) {
            return response(403, { error: 'MAS administrator access is required.' });
        }
        const stored = await state.get(CACHE_KEY);
        if (!stored?.value) return response(404, { error: 'No dashboard snapshot has arrived yet.' });
        const snapshot = JSON.parse(stored.value);
        const ageMs = Math.max(0, Date.now() - Date.parse(snapshot.generatedAt));
        return response(200, { ...snapshot, ageMs, stale: ageMs >= STALE_AFTER_MS });
    } catch {
        return response(503, { error: 'Dashboard storage is unavailable.' });
    }
}

exports.main = main;
