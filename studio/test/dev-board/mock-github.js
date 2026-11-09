import sinon from 'sinon';

export const RESET = 1767225600;

export const user = (login, type = 'User') => ({
    login,
    avatar_url: `data:image/svg+xml,${login}`,
    type,
});

export const rawPull = ({
    number,
    author = 'alice',
    type = 'User',
    draft = false,
    updated = '2025-01-01T00:00:00Z',
    assignees = [],
    labels = [],
    reviewers = [],
    teams = [],
}) => ({
    number,
    title: `PR ${number}`,
    html_url: `https://github.com/adobecom/mas/pull/${number}`,
    draft,
    updated_at: updated,
    user: user(author, type),
    assignees: assignees.map((login) => user(login)),
    labels: labels.map((name) => ({ name })),
    requested_reviewers: reviewers.map((login) => user(login)),
    requested_teams: teams.map((name) => ({ name })),
});

export const review = (login, state) => ({ user: user(login), state });

export const commit = (login, name) => ({ author: user(login), commit: { author: { name } } });

export const respond = (body, { status = 200, resource = 'core', remaining = 50, limit = 60, reset = RESET } = {}) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'x-ratelimit-resource': resource,
            'x-ratelimit-remaining': String(remaining),
            'x-ratelimit-limit': String(limit),
            'x-ratelimit-reset': String(reset),
        },
    });

export const rateLimited = (resource = 'core') =>
    respond({ message: 'API rate limit exceeded' }, { status: 403, resource, remaining: 0 });

// Serves the GitHub endpoints the board uses from in-memory data and counts down the core rate limit.
// `data.fail(url)` can return a response to override any request; tests may swap it between steps.
export function mockGitHub(data) {
    const limits = { core: data.remaining ?? 60, search: 10 };
    return sinon.stub(window, 'fetch').callsFake(async (input) => {
        const url = new URL(input);
        const failure = data.fail?.(url);
        if (failure) return failure;
        if (url.pathname === '/search/issues') {
            limits.search -= 1;
            const qualifier = url.searchParams.get('q').split(' ').pop();
            const items = (data.searches?.[qualifier] ?? []).map((number) => ({ number }));
            return respond({ items }, { resource: 'search', remaining: limits.search, limit: 10 });
        }
        limits.core -= 1;
        const options = { remaining: limits.core };
        const page = Number(url.searchParams.get('page') ?? 1);
        const size = Number(url.searchParams.get('per_page'));
        const slice = (items = []) => items.slice((page - 1) * size, page * size);
        if (url.pathname === '/repos/adobecom/mas/pulls') return respond(slice(data.pulls), options);
        if (url.pathname === '/repos/adobecom/mas/commits') return respond(slice(data.commits), options);
        const [, number] = url.pathname.match(/\/pulls\/(\d+)\/reviews$/) ?? [];
        if (number) return respond(data.reviews?.[number] ?? [], options);
        return respond({ message: 'Not Found' }, { ...options, status: 404 });
    });
}

export function resetDevBoard(rateLimits) {
    for (const key of Object.keys(rateLimits)) delete rateLimits[key];
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith('mas-dev-board:')) localStorage.removeItem(key);
    }
}
