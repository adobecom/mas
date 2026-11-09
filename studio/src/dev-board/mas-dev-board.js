import { LitElement, css, html, nothing } from 'lit';
import {
    ESSENTIAL_BUDGET,
    OPTIONAL_BUDGET,
    REPO,
    REQUIRED_APPROVALS,
    attachReviews,
    buildBoard,
    fetchPullReviews,
    findLogin,
    getPeople,
    getReviewTargets,
    loadSnapshot,
    pruneReviews,
    rateLimits,
    readCache,
    searchPulls,
    spareRequests,
    writeCache,
} from './github.js';

const IMS_TIMEOUT = 5000;
const STALE_AFTER = 5 * 60 * 1000;
const BATCH_SIZE = 4;
const STUDIO_URL = '/studio.html';
const PULLS_URL = `https://github.com/${REPO}/pulls`;

const clock = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' });
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
];

const REASON_VARIANTS = { Draft: 'neutral', 'Do not review': 'notice', 'Changes requested': 'negative' };

const REVIEW_LABELS = {
    APPROVED: 'approved',
    CHANGES_REQUESTED: 'requested changes',
    COMMENTED: 'commented',
    DISMISSED: 'review dismissed',
    REQUESTED: 'review requested',
};

export function timeAgo(date, now = Date.now()) {
    const seconds = (new Date(date).getTime() - now) / 1000;
    const [unit, size] = UNITS.find(([, length]) => Math.abs(seconds) >= length) ?? [];
    return unit ? relative.format(Math.round(seconds / size), unit) : 'just now';
}

const avatarUrl = (avatar) => `${avatar}${avatar.includes('?') ? '&' : '?'}s=48`;

const firstName = ({ name }) => name.split(' ')[0];

const lower = (login) => login.toLowerCase();

// dev.html shares the M@S Studio IMS session; IMS only redirects back to studio.html, so sign-in happens there.
async function loadProfile() {
    await Promise.race([window.imsReady, new Promise((resolve) => setTimeout(resolve, IMS_TIMEOUT))]);
    if (!window.adobeIMS?.isSignedInUser()) return null;
    return window.adobeIMS.getProfile().catch(() => null);
}

function getChips(pr, column, who) {
    const chips = [];
    const myState = pr.myReview?.state;
    if (pr.reason) chips.push([pr.reason, REASON_VARIANTS[pr.reason]]);
    if (pr.requested) chips.push(['Review requested', 'info']);
    if (myState === 'CHANGES_REQUESTED') chips.push([`${who} requested changes`, 'notice']);
    if (myState === 'COMMENTED') chips.push([`${who} commented`, 'neutral']);
    if (!pr.reviews && pr.reviewedByMe) chips.push([`${who} reviewed`, 'neutral']);
    if (column === 'review' && pr.status.changesRequested && myState !== 'CHANGES_REQUESTED') {
        chips.push(['Changes requested', 'negative']);
    }
    if (pr.status.approvals !== null) {
        chips.push([`${pr.status.approvals}/${REQUIRED_APPROVALS} approvals`, pr.status.approvals ? 'positive' : 'neutral']);
    }
    for (const label of pr.labels) {
        if (lower(label) !== lower(pr.reason ?? '')) chips.push([label, 'label']);
    }
    return chips;
}

function getReviewers(pr) {
    const reviewers = new Map((pr.reviews ?? []).map((review) => [lower(review.login), review]));
    for (const user of pr.requestedReviewers) reviewers.set(lower(user.login), { ...user, state: 'REQUESTED' });
    return [...reviewers.values()];
}

class MasDevBoard extends LitElement {
    static properties = {
        profile: { state: true },
        selected: { state: true },
        snapshot: { state: true },
        reviews: { state: true },
        reviewedBy: { state: true },
        loading: { state: true },
        error: { state: true },
    };

    static styles = css`
        :host {
            --accent-dev: #7c4dff;
            --accent-review: #3b63fb;
            --text: #1d1d1f;
            --muted: #6e6e76;
            --line: rgb(0 0 0 / 8%);
            display: block;
            min-height: 100vh;
            background: radial-gradient(900px 360px at 0% -5%, rgb(124 77 255 / 12%), transparent 70%),
                radial-gradient(900px 360px at 100% -5%, rgb(59 99 251 / 12%), transparent 70%), #f6f6f9;
            color: var(--text);
            font-family:
                adobe-clean,
                'Source Sans Pro',
                -apple-system,
                BlinkMacSystemFont,
                'Segoe UI',
                sans-serif;
            -webkit-font-smoothing: antialiased;
        }

        a {
            color: inherit;
        }

        .top {
            position: sticky;
            top: 0;
            z-index: 2;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 12px 24px;
            padding: 14px 32px;
            background: rgb(255 255 255 / 72%);
            backdrop-filter: saturate(180%) blur(14px);
            border-bottom: 1px solid var(--line);
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo {
            display: grid;
            place-items: center;
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: linear-gradient(135deg, #ff4f2e, #c53fbd 55%, #3b63fb);
            box-shadow: 0 6px 16px rgb(197 63 189 / 30%);
            color: #fff;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: -0.02em;
        }

        h1 {
            margin: 0;
            font-size: 19px;
            font-weight: 800;
            letter-spacing: -0.01em;
        }

        .summary {
            margin: 2px 0 0;
            font-size: 12px;
            color: var(--muted);
        }

        .summary a {
            font-weight: 700;
            text-decoration: none;
        }

        .summary a:hover {
            text-decoration: underline;
        }

        .actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        sp-picker {
            min-width: 260px;
        }

        .avatar {
            flex: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #e9e9ee;
        }

        main {
            max-width: 1280px;
            margin: 0 auto;
            padding: 28px 32px 24px;
        }

        .banner {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            padding: 10px 14px;
            border-radius: 12px;
            background: #fff3dd;
            color: #7a4500;
            font-size: 13px;
        }

        .columns {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: start;
            gap: 24px;
            transition: opacity 0.2s;
        }

        .columns.refreshing {
            opacity: 0.55;
        }

        .column {
            --accent: var(--accent-dev);
            padding: 18px;
            border: 1px solid var(--line);
            border-radius: 20px;
            background: rgb(255 255 255 / 55%);
        }

        .column.review {
            --accent: var(--accent-review);
        }

        .column > header {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 800;
        }

        .column h2::before {
            content: '';
            display: inline-block;
            width: 10px;
            height: 10px;
            margin-inline-end: 10px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
            vertical-align: 1px;
        }

        .count {
            min-width: 12px;
            padding: 2px 8px;
            border-radius: 999px;
            background: color-mix(in srgb, var(--accent) 14%, white);
            color: var(--accent);
            font-size: 12px;
            font-weight: 800;
            text-align: center;
        }

        .hint {
            margin: 6px 0 16px;
            font-size: 12px;
            color: var(--muted);
        }

        .cards {
            display: grid;
            gap: 10px;
        }

        .card {
            position: relative;
            display: grid;
            gap: 10px;
            padding: 14px 16px;
            border: 1px solid var(--line);
            border-radius: 14px;
            background: #fff;
            box-shadow: 0 1px 2px rgb(16 24 40 / 4%);
            transition:
                transform 0.15s,
                box-shadow 0.15s,
                border-color 0.15s;
        }

        .card:hover {
            transform: translateY(-1px);
            border-color: color-mix(in srgb, var(--accent) 35%, transparent);
            box-shadow: 0 10px 24px rgb(16 24 40 / 8%);
        }

        .card:has(.title:focus-visible) {
            outline: 2px solid var(--accent);
            outline-offset: 2px;
        }

        .card-head {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            font-size: 12px;
            color: var(--muted);
        }

        .who {
            overflow: hidden;
            color: var(--text);
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .updated {
            white-space: nowrap;
        }

        .number {
            margin-inline-start: auto;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
        }

        .title {
            font-size: 15px;
            font-weight: 700;
            line-height: 1.35;
            text-decoration: none;
            overflow-wrap: anywhere;
        }

        .title:focus-visible {
            outline: none;
        }

        .title::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
        }

        .card:hover .title {
            color: var(--accent);
        }

        .chips {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .chip {
            display: inline-flex;
            align-items: center;
            height: 20px;
            padding: 0 8px;
            border-radius: 999px;
            background: #efeff3;
            color: #4a4a52;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
        }

        .chip.info {
            background: #e7edff;
            color: #2a4fd8;
        }

        .chip.positive {
            background: #e1f5ea;
            color: #0b7a4b;
        }

        .chip.negative {
            background: #ffe9e6;
            color: #c4291a;
        }

        .chip.notice {
            background: #fff0d9;
            color: #995200;
        }

        .chip.bot {
            background: #f1ecff;
            color: #6a3fd1;
        }

        .chip.label {
            background: transparent;
            box-shadow: inset 0 0 0 1px #dcdce3;
            color: var(--muted);
            font-weight: 600;
        }

        .reviewers {
            position: relative;
            z-index: 1;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            width: fit-content;
        }

        .reviewer {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #e9e9ee;
            outline: 2px solid var(--ring, #b9b9c2);
            outline-offset: 1px;
        }

        .reviewer.approved {
            --ring: #17a467;
        }

        .reviewer.changes_requested {
            --ring: #e5483a;
        }

        .reviewer.dismissed {
            opacity: 0.5;
        }

        .reviewer.requested {
            outline-style: dashed;
            opacity: 0.7;
        }

        .empty {
            display: grid;
            justify-items: center;
            gap: 4px;
            padding: 36px 16px;
            border: 1px dashed color-mix(in srgb, var(--accent) 30%, transparent);
            border-radius: 14px;
            color: var(--muted);
            font-size: 13px;
            text-align: center;
        }

        .empty strong {
            color: var(--text);
            font-size: 15px;
        }

        .others {
            display: grid;
            gap: 6px;
            margin: 14px 2px 0;
            font-size: 12px;
            color: var(--muted);
        }

        .others a {
            margin-inline-end: 8px;
            color: var(--accent);
            font-weight: 700;
            text-decoration: none;
        }

        .others a:hover {
            text-decoration: underline;
        }

        .state {
            display: grid;
            justify-items: center;
            gap: 14px;
            padding: 96px 24px;
            color: var(--muted);
            text-align: center;
        }

        .state h2 {
            font-size: 24px;
        }

        .state p {
            max-width: 440px;
            margin: 0;
            line-height: 1.5;
        }

        footer {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 8px 24px;
            max-width: 1280px;
            margin: 0 auto;
            padding: 8px 32px 32px;
            font-size: 12px;
            color: var(--muted);
        }

        .low {
            color: #995200;
            font-weight: 700;
        }

        @media (max-width: 900px) {
            .top {
                padding: 12px 16px;
            }

            .actions {
                flex: 1 1 100%;
            }

            .actions sp-button {
                flex: none;
            }

            sp-picker {
                flex: 1;
                min-width: 0;
            }

            main {
                padding: 16px;
            }

            .columns {
                grid-template-columns: minmax(0, 1fr);
            }

            footer {
                padding: 8px 16px 24px;
            }
        }
    `;

    reviewedByCache = new Map();

    fetching = new Set();

    constructor() {
        super();
        this.profile = undefined;
        this.me = null;
        this.selected = null;
        this.snapshot = null;
        this.reviews = readCache('reviews') ?? {};
        this.reviewedBy = null;
        this.loading = true;
        this.error = null;
        this.people = [];
        this.peopleByLogin = new Map();
        this.board = null;
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        window.addEventListener('storage', this.onStorage);
        this.start();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        window.removeEventListener('storage', this.onStorage);
    }

    willUpdate(changed) {
        if (changed.has('snapshot') && this.snapshot) {
            this.people = getPeople(this.snapshot);
            this.peopleByLogin = new Map(this.people.map((person) => [lower(person.login), person]));
        }
        if (changed.has('snapshot') || changed.has('profile')) {
            this.me = this.profile ? findLogin(this.people, this.profile) : null;
        }
        const inputs = ['snapshot', 'reviews', 'reviewedBy', 'selected'];
        if (!inputs.some((key) => changed.has(key)) || this.reviewedBy?.login !== this.selected) return;
        this.board = buildBoard(attachReviews(this.snapshot.pulls, this.reviews), this.selected, this.signals);
    }

    async start() {
        const [profile] = await Promise.all([loadProfile(), this.loadPulls()]);
        this.profile = profile;
        await this.loadUser();
        this.loading = false;
    }

    async refresh() {
        this.loading = true;
        await this.loadPulls();
        await this.loadUser();
        this.loading = false;
    }

    async loadPulls() {
        try {
            this.snapshot = await loadSnapshot();
            this.error = this.snapshot.error ?? null;
            this.saveReviews(pruneReviews(this.reviews, this.snapshot.pulls));
        } catch (error) {
            this.error = error;
        }
        this.reviewedByCache.clear();
    }

    // Loads what the selected developer's columns depend on, then fills in approval details while budget allows.
    async loadUser() {
        if (!this.snapshot) return;
        await this.updateComplete;
        this.selected ??= this.defaultLogin;
        const login = this.selected;
        if (!login) return;
        const reviewedBy = await this.searchReviewedBy(login);
        if (login !== this.selected) return;
        this.reviewedBy = reviewedBy;
        const pulls = attachReviews(this.snapshot.pulls, this.reviews);
        const { essential, optional } = getReviewTargets(pulls, login, this.signals);
        await this.loadReviews(essential, ESSENTIAL_BUDGET, login);
        this.loadReviews(optional, OPTIONAL_BUDGET, login);
    }

    async searchReviewedBy(login) {
        if (this.reviewedByCache.has(login)) return this.reviewedByCache.get(login);
        try {
            const reviewedBy = { login, numbers: await searchPulls(`reviewed-by:${login}`) };
            this.reviewedByCache.set(login, reviewedBy);
            return reviewedBy;
        } catch (error) {
            return { login, numbers: new Set(), error };
        }
    }

    async loadReviews(targets, floor, login) {
        const queue = targets.filter(({ number }) => !this.fetching.has(number));
        while (queue.length && login === this.selected) {
            const batch = queue.splice(0, Math.min(BATCH_SIZE, spareRequests(floor)));
            if (!batch.length) return;
            for (const { number } of batch) this.fetching.add(number);
            const results = await Promise.allSettled(batch.map(fetchPullReviews));
            const reviews = { ...this.reviews };
            for (const [index, { number, updatedAt }] of batch.entries()) {
                this.fetching.delete(number);
                if (results[index].status === 'fulfilled') reviews[number] = { updatedAt, reviews: results[index].value };
            }
            this.saveReviews(reviews);
        }
    }

    saveReviews(reviews) {
        this.reviews = reviews;
        writeCache('reviews', reviews);
    }

    async onPick({ target }) {
        const login = target.value;
        if (login === this.selected) return;
        this.selected = login;
        writeCache('selected', login);
        const url = new URL(location.href);
        if (login === this.me) url.searchParams.delete('user');
        else url.searchParams.set('user', login);
        history.replaceState(null, '', url);
        this.loading = true;
        await this.loadUser();
        if (login === this.selected) this.loading = false;
    }

    onVisibilityChange = () => {
        const stale = Date.now() - (this.snapshot?.fetchedAt ?? 0) > STALE_AFTER;
        if (document.visibilityState === 'visible' && stale && !this.loading) this.refresh();
    };

    // Signing in on studio.html in another tab stores a token that this page can pick up.
    onStorage = ({ key }) => {
        if (!this.profile && key?.startsWith('adobeid_ims_access_token')) location.reload();
    };

    get signals() {
        const { approved, changesRequested } = this.snapshot;
        return { approved, changesRequested, reviewedBy: this.reviewedBy.numbers };
    }

    // A shared ?user= link wins, then the signed-in developer, then whoever was picked last time.
    get defaultLogin() {
        const login = new URLSearchParams(location.search).get('user') ?? this.me ?? readCache('selected');
        return login && (this.peopleByLogin.get(lower(login))?.login ?? login);
    }

    get selectedPerson() {
        return this.personOf({ login: this.selected });
    }

    get isMine() {
        return this.selected === this.me;
    }

    personOf(user) {
        return this.peopleByLogin.get(lower(user.login)) ?? { ...user, name: user.login.replace('[bot]', '') };
    }

    ownerOf(pr) {
        return this.personOf(pr.author.bot ? (pr.assignees[0] ?? pr.author) : pr.author);
    }

    get errorText() {
        if (!this.error.limited) return 'GitHub is not reachable right now.';
        const until = this.error.resetAt ? ` until ${clock.format(this.error.resetAt)}` : '';
        return `The GitHub API limit for your network is used up${until}.`;
    }

    get header() {
        return html`
            <header class="top">
                <div class="brand">
                    <span class="logo" aria-hidden="true">M@S</span>
                    <div>
                        <h1>Dev Board</h1>
                        <p class="summary">${this.summary}</p>
                    </div>
                </div>
                <div class="actions">
                    ${this.signInButton} ${this.picker}
                    <sp-action-button quiet label="Refresh" title="Refresh" ?disabled=${this.loading} @click=${this.refresh}>
                        <sp-icon-refresh slot="icon"></sp-icon-refresh>
                    </sp-action-button>
                </div>
            </header>
        `;
    }

    get summary() {
        const repo = html`<a href=${PULLS_URL} target="_blank" rel="noopener">${REPO}</a>`;
        if (!this.snapshot) return repo;
        const { pulls, fetchedAt } = this.snapshot;
        return html`${repo} · ${pulls.length} open PRs · updated ${clock.format(fetchedAt)}`;
    }

    get signInButton() {
        if (this.profile !== null) return nothing;
        return html`
            <sp-button size="s" variant="secondary" treatment="outline" href=${STUDIO_URL} target="_blank">
                Sign in with Studio
            </sp-button>
        `;
    }

    get picker() {
        if (!this.people.length) return nothing;
        const people = [...this.people].sort((a, b) => (b.login === this.me) - (a.login === this.me));
        return html`
            <sp-picker label="Pick a developer" .value=${this.selected ?? ''} @change=${this.onPick}>
                ${people.map((person) => this.renderPerson(person))}
            </sp-picker>
        `;
    }

    renderPerson(person) {
        return html`
            <sp-menu-item value=${person.login}>
                <img slot="icon" class="avatar" src=${avatarUrl(person.avatar)} alt="" width="20" height="20" />
                ${person.name}${person.login === this.me ? ' (you)' : ''}
            </sp-menu-item>
        `;
    }

    get banner() {
        const notes = [];
        if (this.snapshot && this.error) {
            notes.push(`${this.errorText} Showing pull requests from ${clock.format(this.snapshot.fetchedAt)}.`);
        }
        if (this.reviewedBy?.error) {
            notes.push('GitHub search is busy, so PRs you already reviewed may show up. Refresh in a minute.');
        }
        return notes.map(
            (note) => html`<div class="banner" role="status"><sp-icon-alert></sp-icon-alert><span>${note}</span></div>`,
        );
    }

    get content() {
        if (!this.snapshot) return this.error ? this.failure : this.spinner;
        if (!this.selected) return this.welcome;
        if (!this.board) return this.spinner;
        return html`
            <div class="columns ${this.loading ? 'refreshing' : ''}">
                ${this.columns.map((column) => this.renderColumn(column))}
            </div>
        `;
    }

    get spinner() {
        return html`
            <div class="state">
                <sp-progress-circle indeterminate size="l" label="Loading pull requests"></sp-progress-circle>
                <p>Loading pull requests…</p>
            </div>
        `;
    }

    get failure() {
        return html`
            <div class="state">
                <h2>Couldn't load pull requests</h2>
                <p>${this.errorText}</p>
                <sp-button variant="secondary" @click=${this.refresh}>Try again</sp-button>
            </div>
        `;
    }

    get welcome() {
        const unmatched = Boolean(this.profile);
        return html`
            <div class="state">
                <span class="logo" aria-hidden="true">M@S</span>
                <h2>${unmatched ? `Hi ${this.profile.first_name ?? 'there'}!` : 'Who is checking in?'}</h2>
                <p>
                    ${unmatched
                        ? "We couldn't match your Adobe profile to a GitHub account. Pick yourself in the developer menu above."
                        : 'Pick yourself in the developer menu above, or sign in with Studio and the board will find you.'}
                </p>
            </div>
        `;
    }

    get columns() {
        const name = firstName(this.selectedPerson);
        const { inDev, toReview } = this.board;
        return [
            {
                id: 'dev',
                title: this.isMine ? 'My PRs in Dev' : `${name}'s PRs in Dev`,
                hint: `Fewer than ${REQUIRED_APPROVALS} approvals and not waiting on reviewers`,
                items: inDev,
                empty: ['Nothing in dev 🎉', 'Every open PR is with reviewers or approved.'],
                extra: this.otherPulls,
            },
            {
                id: 'review',
                title: this.isMine ? 'PRs to review' : `PRs for ${name} to review`,
                hint: `Ready for review, fewer than ${REQUIRED_APPROVALS} approvals, not approved by ${this.isMine ? 'you' : name} yet`,
                items: toReview,
                empty: ['All caught up ✨', 'No PRs are waiting for a review.'],
                extra: nothing,
            },
        ];
    }

    renderColumn({ id, title, hint, items, empty: [headline, detail], extra }) {
        return html`
            <section class="column ${id}" aria-labelledby="${id}-title">
                <header>
                    <h2 id="${id}-title">${title}</h2>
                    <span class="count">${items.length}</span>
                </header>
                <p class="hint">${hint}</p>
                ${items.length
                    ? html`<div class="cards">${items.map((pr) => this.renderCard(pr, id))}</div>`
                    : html`<div class="empty"><strong>${headline}</strong><span>${detail}</span></div>`}
                ${extra}
            </section>
        `;
    }

    get otherPulls() {
        const { withReviewers, approved } = this.board;
        const groups = [
            ['With reviewers', withReviewers],
            ['Approved', approved],
        ].filter(([, pulls]) => pulls.length);
        if (!groups.length) return nothing;
        return html`
            <div class="others">
                ${groups.map(
                    ([label, pulls]) => html`
                        <div>
                            ${label}:
                            ${pulls.map(
                                (pr) =>
                                    html`<a href=${pr.url} target="_blank" rel="noopener" title=${pr.title}>#${pr.number}</a>`,
                            )}
                        </div>
                    `,
                )}
            </div>
        `;
    }

    renderCard(pr, column) {
        const owner = this.ownerOf(pr);
        const chips = getChips(pr, column, this.isMine ? 'You' : firstName(this.selectedPerson));
        const reviewers = getReviewers(pr);
        return html`
            <article class="card">
                <div class="card-head">
                    ${column === 'review'
                        ? html`<img class="avatar" src=${avatarUrl(owner.avatar)} alt="" width="20" height="20" />
                              <span class="who">${owner.name}</span>`
                        : nothing}
                    ${pr.author.bot ? html`<span class="chip bot">${pr.author.login.replace('[bot]', '')}</span>` : nothing}
                    <span class="updated">updated ${timeAgo(pr.updatedAt)}</span>
                    <span class="number">#${pr.number}</span>
                </div>
                <a class="title" href=${pr.url} target="_blank" rel="noopener">${pr.title}</a>
                ${chips.length
                    ? html`<div class="chips">${chips.map(([text, variant]) => this.renderChip(text, variant))}</div>`
                    : nothing}
                ${reviewers.length
                    ? html`<div class="reviewers">${reviewers.map((reviewer) => this.renderReviewer(reviewer))}</div>`
                    : nothing}
            </article>
        `;
    }

    renderChip(text, variant) {
        return html`<span class="chip ${variant}">${text}</span>`;
    }

    renderReviewer(reviewer) {
        const label = `${this.personOf(reviewer).name}: ${REVIEW_LABELS[reviewer.state]}`;
        return html`
            <img
                class="reviewer ${lower(reviewer.state)}"
                src=${avatarUrl(reviewer.avatar)}
                alt=${label}
                title=${label}
                width="22"
                height="22"
            />
        `;
    }

    get footer() {
        const { core } = rateLimits;
        return html`
            <footer>
                <span>Bot PRs (pinatacode, dependabot) count for their assignees · data from the public GitHub API</span>
                ${core
                    ? html`<span class=${core.remaining <= OPTIONAL_BUDGET ? 'low' : ''}>
                          ${core.remaining}/${core.limit} GitHub requests left until ${clock.format(core.resetAt)}
                      </span>`
                    : nothing}
            </footer>
        `;
    }

    render() {
        return html`${this.header}
            <main>${this.banner}${this.content}</main>
            ${this.footer}`;
    }
}

customElements.define('mas-dev-board', MasDevBoard);
