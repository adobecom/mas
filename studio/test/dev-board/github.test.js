import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
    GitHubError,
    attachReviews,
    buildBoard,
    fetchPullReviews,
    findLogin,
    getDevReason,
    getPeople,
    getReviewStatus,
    getReviewTargets,
    isReadyForReview,
    loadSnapshot,
    pruneReviews,
    rateLimits,
    readCache,
    searchPulls,
    spareRequests,
    toPull,
    toReviews,
    writeCache,
} from '../../src/dev-board/github.js';
import { RESET, commit, mockGitHub, rateLimited, rawPull, resetDevBoard, respond, review } from './mock-github.js';

const pull = (options, reviews = null) => ({ ...toPull(rawPull(options)), reviews });

const reviewBy = (login, state) => ({ ...toPull(rawPull({ number: 0, author: login })).author, state });

const signals = ({ approved = [], changesRequested = [], reviewedBy = [] } = {}) => ({
    approved: new Set(approved),
    changesRequested: new Set(changesRequested),
    reviewedBy: new Set(reviewedBy),
});

const numbers = (pulls) => pulls.map(({ number }) => number);

describe('dev board GitHub data', () => {
    beforeEach(() => resetDevBoard(rateLimits));

    afterEach(() => {
        sinon.restore();
        resetDevBoard(rateLimits);
    });

    describe('toPull', () => {
        it('maps a developer PR to its author', () => {
            const pr = toPull(
                rawPull({ number: 7, author: 'Axel', labels: ['MWPW-1'], reviewers: ['bob'], teams: ['merch-at-scale'] }),
            );
            expect(pr).to.include({ number: 7, title: 'PR 7', draft: false, updatedAt: '2025-01-01T00:00:00Z' });
            expect(pr.owners).to.deep.equal(['axel']);
            expect(pr.author).to.deep.equal({
                login: 'Axel',
                avatar: 'data:image/svg+xml,Axel',
                bot: false,
            });
            expect(pr.labels).to.deep.equal(['MWPW-1']);
            expect(pr.requestedReviewers.map(({ login }) => login)).to.deep.equal(['bob']);
            expect(pr.requestedTeams).to.deep.equal(['merch-at-scale']);
        });

        it('gives bot PRs to their assignees', () => {
            const pr = toPull(rawPull({ number: 8, author: 'pinatacode[bot]', type: 'Bot', assignees: ['Mariia', 'bob'] }));
            expect(pr.author.bot).to.be.true;
            expect(pr.owners).to.deep.equal(['mariia', 'bob']);
        });
    });

    describe('toReviews', () => {
        it('keeps the latest decisive review per reviewer', () => {
            const reviews = toReviews(
                [
                    review('bob', 'COMMENTED'),
                    review('bob', 'APPROVED'),
                    review('bob', 'COMMENTED'),
                    review('carol', 'CHANGES_REQUESTED'),
                    review('carol', 'APPROVED'),
                    review('dave', 'APPROVED'),
                    review('dave', 'DISMISSED'),
                    review('erin', 'PENDING'),
                    { user: null, state: 'COMMENTED' },
                    review('Author', 'COMMENTED'),
                    review('frank', 'COMMENTED'),
                ],
                'author',
            );
            expect(reviews.map(({ login, state }) => `${login}:${state}`)).to.deep.equal([
                'bob:APPROVED',
                'carol:APPROVED',
                'dave:DISMISSED',
                'frank:COMMENTED',
            ]);
            expect(reviews[0]).to.include({ avatar: 'data:image/svg+xml,bob', bot: false });
        });
    });

    describe('isReadyForReview', () => {
        it('excludes drafts and PRs labeled do not review', () => {
            expect(isReadyForReview(pull({ number: 1 }))).to.be.true;
            expect(isReadyForReview(pull({ number: 2, draft: true }))).to.be.false;
            expect(isReadyForReview(pull({ number: 3, labels: ['Do Not Review'] }))).to.be.false;
        });
    });

    describe('getReviewStatus', () => {
        it('uses the search results until reviews are loaded', () => {
            const status = getReviewStatus(pull({ number: 1 }), signals({ approved: [1], changesRequested: [1] }));
            expect(status).to.deep.equal({ approvals: null, approved: true, changesRequested: true });
        });

        it('counts approvals from loaded reviews', () => {
            const approvedPull = pull({ number: 1 }, [reviewBy('bob', 'APPROVED'), reviewBy('carol', 'APPROVED')]);
            expect(getReviewStatus(approvedPull, signals())).to.deep.equal({
                approvals: 2,
                approved: true,
                changesRequested: false,
            });
            const oneApproval = pull({ number: 2 }, [reviewBy('bob', 'APPROVED'), reviewBy('dave', 'COMMENTED')]);
            expect(getReviewStatus(oneApproval, signals({ approved: [2] }))).to.deep.equal({
                approvals: 1,
                approved: false,
                changesRequested: false,
            });
        });

        it('does not treat a PR with requested changes as approved', () => {
            const reviews = [reviewBy('bob', 'APPROVED'), reviewBy('carol', 'APPROVED'), reviewBy('dave', 'CHANGES_REQUESTED')];
            expect(getReviewStatus(pull({ number: 1 }, reviews), signals())).to.deep.equal({
                approvals: 2,
                approved: false,
                changesRequested: true,
            });
        });
    });

    describe('getDevReason', () => {
        const changes = { changesRequested: true };
        const clean = { changesRequested: false };

        it('explains why a PR is back with its author', () => {
            expect(getDevReason(pull({ number: 1, draft: true }), clean)).to.equal('Draft');
            expect(getDevReason(pull({ number: 2, labels: ['DO NOT REVIEW'] }), clean)).to.equal('Do not review');
            expect(getDevReason(pull({ number: 3 }), changes)).to.equal('Changes requested');
        });

        it('returns null while reviewers still have to act', () => {
            expect(getDevReason(pull({ number: 1 }), clean)).to.be.null;
            expect(getDevReason(pull({ number: 2, reviewers: ['bob'] }), changes)).to.be.null;
            expect(getDevReason(pull({ number: 3, teams: ['merch-at-scale'] }), changes)).to.be.null;
        });
    });

    describe('buildBoard', () => {
        const pulls = [
            pull({ number: 1, author: 'me', draft: true, updated: '2025-01-01T00:00:00Z' }),
            pull({ number: 2, author: 'me', updated: '2025-01-03T00:00:00Z' }, [reviewBy('bob', 'CHANGES_REQUESTED')]),
            pull({ number: 3, author: 'me', reviewers: ['bob'] }, [reviewBy('carol', 'APPROVED')]),
            pull({ number: 4, author: 'renovate[bot]', type: 'Bot', assignees: ['ME'] }),
            pull({ number: 5, author: 'bob', updated: '2025-01-02T00:00:00Z' }),
            pull({ number: 6, author: 'bob', reviewers: ['me'], updated: '2025-01-01T00:00:00Z' }),
            pull({ number: 7, author: 'carol' }, [reviewBy('me', 'APPROVED')]),
            pull({ number: 8, author: 'carol' }, [reviewBy('bob', 'APPROVED'), reviewBy('dave', 'APPROVED')]),
            pull({ number: 9, author: 'carol', labels: ['DO NOT REVIEW'] }),
            pull({ number: 10, author: 'carol', draft: true }),
            pull({ number: 11, author: 'dave', updated: '2025-01-03T00:00:00Z' }, [reviewBy('Me', 'CHANGES_REQUESTED')]),
        ];
        const board = buildBoard(pulls, 'Me', signals({ approved: [4], reviewedBy: [5, 7, 11] }));

        it('splits my PRs by who has to act', () => {
            expect(numbers(board.inDev)).to.deep.equal([2, 1]);
            expect(board.inDev.map(({ reason }) => reason)).to.deep.equal(['Changes requested', 'Draft']);
            expect(numbers(board.withReviewers)).to.deep.equal([3]);
            expect(numbers(board.approved)).to.deep.equal([4]);
        });

        it('lists reviewable PRs I have not approved, requested reviews first', () => {
            expect(numbers(board.toReview)).to.deep.equal([6, 11, 5]);
            const [requested, changes, reviewed] = board.toReview;
            expect(requested).to.include({ requested: true, reviewedByMe: false, myReview: null });
            expect(changes.myReview.state).to.equal('CHANGES_REQUESTED');
            expect(changes.status).to.deep.equal({ approvals: 0, approved: false, changesRequested: true });
            expect(reviewed).to.include({ requested: false, reviewedByMe: true });
        });
    });

    describe('getReviewTargets', () => {
        it('loads the reviews that place PRs first', () => {
            const pulls = [
                pull({ number: 1, author: 'me' }),
                pull({ number: 2, author: 'me' }, []),
                pull({ number: 3, author: 'me' }),
                pull({ number: 4, author: 'bob', updated: '2025-01-03T00:00:00Z' }),
                pull({ number: 5, author: 'bob', updated: '2025-01-02T00:00:00Z' }),
                pull({ number: 6, author: 'bob', reviewers: ['me'], updated: '2025-01-01T00:00:00Z' }),
                pull({ number: 7, author: 'bob', draft: true }),
                pull({ number: 8, author: 'bob' }),
            ];
            const { essential, optional } = getReviewTargets(pulls, 'ME', signals({ approved: [3, 8], reviewedBy: [5] }));
            expect(numbers(essential)).to.deep.equal([1, 5]);
            expect(numbers(optional)).to.deep.equal([6, 4]);
        });
    });

    describe('getPeople', () => {
        it('combines commit authors with the people on open PRs', () => {
            const people = getPeople({
                directory: { zed: { login: 'Zed', avatar: 'zed.png', bot: false, name: 'Zed Zulu' } },
                pulls: [
                    toPull(rawPull({ number: 1, author: 'zed', reviewers: ['amy'], assignees: ['bob'] })),
                    toPull(rawPull({ number: 2, author: 'dependabot[bot]', type: 'Bot', assignees: ['bob'] })),
                ],
            });
            expect(people.map(({ login, name }) => `${login}:${name}`)).to.deep.equal(['amy:amy', 'bob:bob', 'Zed:Zed Zulu']);
        });
    });

    describe('findLogin', () => {
        const people = [
            { login: 'jnunez', name: 'José Núñez' },
            { login: 'axel', name: 'Axel Cureno Basurto' },
            { login: 'ann1', name: 'Ann Lee Smith' },
            { login: 'ann2', name: 'Ann Lee Jones' },
            { login: 'solo', name: 'solo' },
        ];

        it('matches the IMS name to a GitHub name', () => {
            expect(findLogin(people, { displayName: 'jose nunez' })).to.equal('jnunez');
            expect(findLogin(people, { displayName: 'J.', first_name: 'José', last_name: 'Núñez' })).to.equal('jnunez');
            expect(findLogin(people, { displayName: 'Axel Cureno' })).to.equal('axel');
        });

        it('does not guess between people or from a single name', () => {
            expect(findLogin(people, { displayName: 'Ann Lee' })).to.be.null;
            expect(findLogin(people, { displayName: 'Solo' })).to.be.null;
            expect(findLogin(people, { displayName: 'Nobody Here' })).to.be.null;
        });
    });

    describe('review cache', () => {
        const pulls = [pull({ number: 1, updated: 'b' }), pull({ number: 2, updated: 'c' }), pull({ number: 3 })];
        const cache = { 1: { updatedAt: 'b', reviews: ['r1'] }, 2: { updatedAt: 'old', reviews: ['r2'] }, 9: { reviews: [] } };

        it('attaches reviews while the PR has not changed', () => {
            expect(attachReviews(pulls, cache).map(({ reviews }) => reviews)).to.deep.equal([['r1'], null, null]);
        });

        it('drops reviews of closed PRs', () => {
            expect(Object.keys(pruneReviews(cache, pulls))).to.deep.equal(['1', '2']);
        });

        it('stores values under the board prefix', () => {
            expect(readCache('missing')).to.be.null;
            writeCache('selected', 'axel');
            expect(localStorage.getItem('mas-dev-board:selected')).to.equal('"axel"');
            expect(readCache('selected')).to.equal('axel');
        });
    });

    describe('GitHubError', () => {
        it('recognizes rate limits', () => {
            const error = new GitHubError(rateLimited());
            expect(error.limited).to.be.true;
            expect(error.message).to.equal('GitHub API rate limit reached');
            expect(error.resetAt).to.deep.equal(new Date(RESET * 1000));
            expect(new GitHubError(new Response('', { status: 429 })).limited).to.be.true;
        });

        it('describes other failures', () => {
            const error = new GitHubError(new Response('', { status: 500 }));
            expect(error.limited).to.be.false;
            expect(error.message).to.equal('GitHub API responded with 500');
            expect(error.resetAt).to.be.null;
        });
    });

    describe('loadSnapshot', () => {
        const data = {
            pulls: Array.from({ length: 101 }, (_, index) => rawPull({ number: index + 1 })),
            commits: [commit('Axel', 'Axel Cureno Basurto'), commit('axel', 'Axel C'), { author: null }, commit('bot', 'Bot')],
            searches: { 'review:approved': [1, 2], 'review:changes_requested': [3] },
        };
        data.commits[3].author.type = 'Bot';

        it('loads open PRs, review decisions and names', async () => {
            const fetch = mockGitHub(data);
            const snapshot = await loadSnapshot();
            expect(snapshot.pulls).to.have.length(101);
            expect(snapshot.approved).to.deep.equal(new Set([1, 2]));
            expect(snapshot.changesRequested).to.deep.equal(new Set([3]));
            expect(snapshot.directory).to.deep.equal({
                axel: { login: 'Axel', avatar: 'data:image/svg+xml,Axel', bot: false, name: 'Axel Cureno Basurto' },
            });
            expect(fetch.callCount).to.equal(6);
            expect(fetch.firstCall.args[1]).to.deep.equal({ headers: { accept: 'application/vnd.github+json' } });
            expect(rateLimits.core).to.deep.equal({ remaining: 56, limit: 60, resetAt: new Date(RESET * 1000) });
            expect(rateLimits.search.remaining).to.equal(8);
            expect(spareRequests(30)).to.equal(26);
            expect(readCache('snapshot')).to.include({ fetchedAt: snapshot.fetchedAt });
            expect(readCache('snapshot').approved).to.deep.equal([1, 2]);
        });

        it('reuses the names for a day', async () => {
            writeCache('directory', { fetchedAt: Date.now() - 60_000, people: { amy: { login: 'amy', name: 'Amy' } } });
            const fetch = mockGitHub(data);
            const { directory } = await loadSnapshot();
            expect(directory).to.deep.equal({ amy: { login: 'amy', name: 'Amy' } });
            expect(fetch.callCount).to.equal(4);
        });

        it('keeps old names when commits cannot be loaded', async () => {
            const people = { amy: { login: 'amy', name: 'Amy' } };
            writeCache('directory', { fetchedAt: Date.now() - 25 * 60 * 60 * 1000, people });
            mockGitHub({ ...data, fail: (url) => url.pathname.endsWith('/commits') && respond({}, { status: 500 }) });
            expect((await loadSnapshot()).directory).to.deep.equal(people);
            localStorage.removeItem('mas-dev-board:directory');
            expect((await loadSnapshot()).directory).to.deep.equal({});
        });

        it('falls back to the last snapshot when GitHub fails', async () => {
            const fetch = mockGitHub(data);
            const { fetchedAt } = await loadSnapshot();
            fetch.callsFake(async () => rateLimited());
            const snapshot = await loadSnapshot();
            expect(snapshot.fetchedAt).to.equal(fetchedAt);
            expect(snapshot.pulls).to.have.length(101);
            expect(snapshot.approved).to.deep.equal(new Set([1, 2]));
            expect(snapshot.changesRequested).to.deep.equal(new Set([3]));
            expect(snapshot.error.limited).to.be.true;
        });

        it('fails without a previous snapshot', async () => {
            mockGitHub({ ...data, fail: () => respond({}, { status: 502 }) });
            const error = await loadSnapshot().catch((reason) => reason);
            expect(error).to.be.instanceOf(GitHubError);
            expect(error.limited).to.be.false;
        });
    });

    describe('requests', () => {
        it('searches open PRs of the repo', async () => {
            const fetch = mockGitHub({ searches: { 'reviewed-by:axel': [4, 5] } });
            expect(await searchPulls('reviewed-by:axel')).to.deep.equal(new Set([4, 5]));
            const url = new URL(fetch.firstCall.args[0]);
            expect(url.searchParams.get('q')).to.equal('repo:adobecom/mas is:pr is:open reviewed-by:axel');
        });

        it('loads the reviews of a PR', async () => {
            mockGitHub({ reviews: { 12: [review('bob', 'APPROVED'), review('alice', 'COMMENTED')] } });
            const reviews = await fetchPullReviews(toPull(rawPull({ number: 12, author: 'alice' })));
            expect(reviews.map(({ login, state }) => `${login}:${state}`)).to.deep.equal(['bob:APPROVED']);
        });

        it('has unlimited spare requests until GitHub reports a limit', () => {
            expect(spareRequests(30)).to.equal(Infinity);
        });
    });
});
