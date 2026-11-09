const API = 'https://api.github.com';
const STORAGE_PREFIX = 'mas-dev-board';
const PAGE_SIZE = 100;
const DIRECTORY_PAGES = 2;
const DIRECTORY_TTL = 24 * 60 * 60 * 1000;
const DO_NOT_REVIEW = 'do not review';

export const REPO = 'adobecom/mas';
export const REQUIRED_APPROVALS = 2;

// Unauthenticated GitHub API limits are per IP: 60 core requests/hour and 10 searches/minute.
// Review lookups stop at these floors so the requests the board cannot work without keep succeeding.
export const ESSENTIAL_BUDGET = 3;
export const OPTIONAL_BUDGET = 30;

export const rateLimits = {};

export class GitHubError extends Error {
    constructor(response) {
        const limited = response.status === 429 || response.headers.get('x-ratelimit-remaining') === '0';
        super(limited ? 'GitHub API rate limit reached' : `GitHub API responded with ${response.status}`);
        const reset = Number(response.headers.get('x-ratelimit-reset'));
        this.limited = limited;
        this.resetAt = reset ? new Date(reset * 1000) : null;
    }
}

export const readCache = (key) => JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}:${key}`));

export const writeCache = (key, value) => localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value));

const lower = (login) => login.toLowerCase();

const toUser = ({ login, avatar_url: avatar, type }) => ({ login, avatar, bot: type === 'Bot' });

async function request(path) {
    const response = await fetch(`${API}${path}`, { headers: { accept: 'application/vnd.github+json' } });
    const resource = response.headers.get('x-ratelimit-resource');
    if (resource) {
        rateLimits[resource] = {
            remaining: Number(response.headers.get('x-ratelimit-remaining')),
            limit: Number(response.headers.get('x-ratelimit-limit')),
            resetAt: new Date(Number(response.headers.get('x-ratelimit-reset')) * 1000),
        };
    }
    if (!response.ok) throw new GitHubError(response);
    return response.json();
}

export const spareRequests = (floor) => (rateLimits.core?.remaining ?? Infinity) - floor;

export function toPull(pr) {
    const author = toUser(pr.user);
    return {
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        draft: pr.draft,
        updatedAt: pr.updated_at,
        author,
        // Bot PRs (pinatacode, dependabot) belong to the developers they are assigned to.
        owners: (author.bot ? pr.assignees.map(({ login }) => login) : [author.login]).map(lower),
        assignees: pr.assignees.map(toUser),
        labels: pr.labels.map(({ name }) => name),
        requestedReviewers: pr.requested_reviewers.map(toUser),
        requestedTeams: pr.requested_teams.map(({ name }) => name),
    };
}

// Latest decisive review per reviewer, as GitHub counts them: a later comment does not undo an approval.
export function toReviews(reviews, authorLogin) {
    const latest = new Map();
    for (const { user, state } of reviews) {
        if (!user || state === 'PENDING' || lower(user.login) === lower(authorLogin)) continue;
        const key = lower(user.login);
        if (state !== 'COMMENTED' || !latest.has(key)) latest.set(key, { ...toUser(user), state });
    }
    return [...latest.values()];
}

async function fetchOpenPulls() {
    const pulls = [];
    for (let page = 1; ; page += 1) {
        const batch = await request(`/repos/${REPO}/pulls?state=open&per_page=${PAGE_SIZE}&page=${page}`);
        pulls.push(...batch.map(toPull));
        if (batch.length < PAGE_SIZE) return pulls;
    }
}

export async function searchPulls(qualifier) {
    const query = encodeURIComponent(`repo:${REPO} is:pr is:open ${qualifier}`);
    const { items } = await request(`/search/issues?q=${query}&per_page=${PAGE_SIZE}`);
    return new Set(items.map(({ number }) => number));
}

// Recent commit authors give the real names behind GitHub logins; refreshed daily.
async function loadDirectory() {
    const cached = readCache('directory');
    if (cached && Date.now() - cached.fetchedAt < DIRECTORY_TTL) return cached.people;
    try {
        const pages = await Promise.all(
            Array.from({ length: DIRECTORY_PAGES }, (_, index) =>
                request(`/repos/${REPO}/commits?per_page=${PAGE_SIZE}&page=${index + 1}`),
            ),
        );
        const people = {};
        for (const { author, commit } of pages.flat()) {
            if (!author || author.type === 'Bot') continue;
            people[lower(author.login)] ??= { ...toUser(author), name: commit.author.name };
        }
        writeCache('directory', { fetchedAt: Date.now(), people });
        return people;
    } catch {
        return cached?.people ?? {};
    }
}

// Falls back to the last good snapshot when GitHub is unreachable or the rate limit is spent.
export async function loadSnapshot() {
    try {
        const [pulls, approved, changesRequested, directory] = await Promise.all([
            fetchOpenPulls(),
            searchPulls('review:approved'),
            searchPulls('review:changes_requested'),
            loadDirectory(),
        ]);
        const fetchedAt = Date.now();
        writeCache('snapshot', {
            pulls,
            directory,
            fetchedAt,
            approved: [...approved],
            changesRequested: [...changesRequested],
        });
        return { pulls, directory, fetchedAt, approved, changesRequested };
    } catch (error) {
        const cached = readCache('snapshot');
        if (!cached) throw error;
        return { ...cached, approved: new Set(cached.approved), changesRequested: new Set(cached.changesRequested), error };
    }
}

export async function fetchPullReviews(pr) {
    const reviews = await request(`/repos/${REPO}/pulls/${pr.number}/reviews?per_page=${PAGE_SIZE}`);
    return toReviews(reviews, pr.author.login);
}

// Cached reviews stay valid until the PR's updated_at moves; new reviews bump it.
export const attachReviews = (pulls, cache) =>
    pulls.map((pr) => ({ ...pr, reviews: cache[pr.number]?.updatedAt === pr.updatedAt ? cache[pr.number].reviews : null }));

export function pruneReviews(cache, pulls) {
    const open = new Set(pulls.map(({ number }) => String(number)));
    return Object.fromEntries(Object.entries(cache).filter(([number]) => open.has(number)));
}

export const isReadyForReview = (pr) => !pr.draft && !pr.labels.some((label) => label.toLowerCase() === DO_NOT_REVIEW);

// Exact counts once the PR's reviews are loaded, otherwise GitHub's review decision from search.
export function getReviewStatus(pr, { approved, changesRequested }) {
    if (!pr.reviews) {
        return { approvals: null, approved: approved.has(pr.number), changesRequested: changesRequested.has(pr.number) };
    }
    const approvals = pr.reviews.filter(({ state }) => state === 'APPROVED').length;
    const changes = pr.reviews.some(({ state }) => state === 'CHANGES_REQUESTED');
    // Requested changes block the merge even with enough approvals.
    return { approvals, approved: approvals >= REQUIRED_APPROVALS && !changes, changesRequested: changes };
}

// Why the PR is back with its author; null means it is waiting on reviewers.
export function getDevReason(pr, status) {
    if (pr.draft) return 'Draft';
    if (!isReadyForReview(pr)) return 'Do not review';
    const awaitingReviewers = pr.requestedReviewers.length > 0 || pr.requestedTeams.length > 0;
    return status.changesRequested && !awaitingReviewers ? 'Changes requested' : null;
}

const byUpdated = (a, b) => b.updatedAt.localeCompare(a.updatedAt);

const isRequested = (pr, user) => pr.requestedReviewers.some(({ login }) => lower(login) === user);

export function buildBoard(pulls, login, signals) {
    const user = lower(login);
    const board = { inDev: [], toReview: [], withReviewers: [], approved: [] };
    for (const pr of pulls) {
        const status = getReviewStatus(pr, signals);
        if (pr.owners.includes(user)) {
            const reason = status.approved ? null : getDevReason(pr, status);
            if (reason) board.inDev.push({ ...pr, status, reason });
            else board[status.approved ? 'approved' : 'withReviewers'].push(pr);
            continue;
        }
        const myReview = pr.reviews?.find((review) => lower(review.login) === user) ?? null;
        if (status.approved || !isReadyForReview(pr) || myReview?.state === 'APPROVED') continue;
        board.toReview.push({
            ...pr,
            status,
            myReview,
            reviewedByMe: signals.reviewedBy.has(pr.number),
            requested: isRequested(pr, user),
        });
    }
    board.inDev.sort(byUpdated);
    board.toReview.sort((a, b) => b.requested - a.requested || byUpdated(a, b));
    return board;
}

// Essential: reviews needed to place PRs in the right column. Optional: approval details for the rest.
export function getReviewTargets(pulls, login, signals) {
    const user = lower(login);
    const pending = pulls.filter((pr) => !pr.reviews && !signals.approved.has(pr.number));
    const owned = pending.filter((pr) => pr.owners.includes(user));
    const others = pending
        .filter((pr) => !pr.owners.includes(user) && isReadyForReview(pr))
        .sort((a, b) => isRequested(b, user) - isRequested(a, user) || byUpdated(a, b));
    return {
        essential: [...owned, ...others.filter((pr) => signals.reviewedBy.has(pr.number))],
        optional: others.filter((pr) => !signals.reviewedBy.has(pr.number)),
    };
}

export function getPeople({ pulls, directory }) {
    const people = new Map(Object.entries(directory));
    for (const pr of pulls) {
        for (const user of [pr.author, ...pr.assignees, ...pr.requestedReviewers]) {
            if (user.bot || people.has(lower(user.login))) continue;
            people.set(lower(user.login), { ...user, name: user.login });
        }
    }
    return [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const toTokens = (name = '') =>
    name
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

// Matches the IMS profile to a GitHub user by real name, ignoring accents and case.
export function findLogin(people, profile) {
    const names = [profile.displayName, `${profile.first_name ?? ''} ${profile.last_name ?? ''}`]
        .map(toTokens)
        .filter((tokens) => tokens.length > 1);
    const candidates = people.map((person) => ({ login: person.login, tokens: toTokens(person.name) }));
    const exact = candidates.find(({ tokens }) => names.some((name) => name.join(' ') === tokens.join(' ')));
    if (exact) return exact.login;
    // GitHub names often add a middle or second last name ("Axel Cureno Basurto").
    const partial = candidates.filter(({ tokens }) => names.some((name) => name.every((token) => tokens.includes(token))));
    return partial.length === 1 ? partial[0].login : null;
}
