import { expect, fixture, html, waitUntil } from '@open-wc/testing';
import sinon from 'sinon';
import '../../src/swc.js';
import { timeAgo } from '../../src/dev-board/mas-dev-board.js';
import { rateLimits, readCache, writeCache } from '../../src/dev-board/github.js';
import { commit, mockGitHub, rateLimited, rawPull, resetDevBoard, respond, review } from './mock-github.js';

const PULLS = [
    rawPull({ number: 101, author: '3ch023', draft: true, updated: '2025-01-05T00:00:00Z' }),
    rawPull({ number: 102, author: '3ch023', labels: ['MWPW-1'], updated: '2025-01-06T00:00:00Z' }),
    rawPull({ number: 103, author: '3ch023', reviewers: ['axel'], updated: '2025-01-04T00:00:00Z' }),
    rawPull({ number: 104, author: 'pinatacode[bot]', type: 'Bot', assignees: ['3ch023'], updated: '2025-01-03T00:00:00Z' }),
    rawPull({ number: 105, author: 'axel', reviewers: ['3ch023'], updated: '2025-01-02T00:00:00Z' }),
    rawPull({ number: 106, author: 'bob', labels: ['DO NOT REVIEW'], updated: '2025-01-08T00:00:00Z' }),
    rawPull({ number: 107, author: 'bob', updated: '2025-01-07T00:00:00Z' }),
    rawPull({ number: 108, author: 'axel', updated: '2025-01-09T00:00:00Z' }),
    rawPull({ number: 109, author: 'dependabot[bot]', type: 'Bot', assignees: ['bob'], updated: '2025-01-01T00:00:00Z' }),
];

const github = (overrides = {}) => ({
    pulls: PULLS,
    commits: [commit('3ch023', 'Mariia Lukianets'), commit('axel', 'Axel Cureno Basurto'), commit('bob', 'Bob Smith')],
    reviews: {
        102: [review('bob', 'CHANGES_REQUESTED')],
        103: [review('bob', 'APPROVED')],
        107: [review('3ch023', 'COMMENTED')],
        108: [review('3ch023', 'APPROVED')],
    },
    searches: {
        'review:approved': [104],
        'review:changes_requested': [102],
        'reviewed-by:3ch023': [107, 108],
    },
    ...overrides,
});

const signIn = (profile) => {
    window.adobeIMS = { isSignedInUser: () => true, getProfile: async () => profile };
};

const $ = (el, selector) => el.shadowRoot.querySelector(selector);
const text = (node) => node?.textContent.replace(/\s+/g, ' ').trim();
const column = (el, id) => $(el, `.column.${id}`);
const cardNumbers = (el, id) => [...column(el, id).querySelectorAll('.number')].map(text);
const cardOf = (el, number) =>
    [...el.shadowRoot.querySelectorAll('.card')].find((card) => text(card.querySelector('.number')) === `#${number}`);
const otherLinks = (el) => [...column(el, 'dev').querySelectorAll('.others a')].map(text);
const chips = (card) => [...card.querySelectorAll('.chips .chip')].map(text);

async function idle(el) {
    await waitUntil(() => !el.loading && el.fetching.size === 0, 'the board kept loading', { timeout: 3000 });
    await el.updateComplete;
}

async function mount() {
    const el = await fixture(html`<mas-dev-board></mas-dev-board>`);
    await idle(el);
    return el;
}

function pick(el, login) {
    const picker = $(el, 'sp-picker');
    picker.value = login;
    picker.dispatchEvent(new Event('change'));
    return idle(el);
}

describe('mas-dev-board', () => {
    const originalUrl = location.href;

    beforeEach(() => {
        resetDevBoard(rateLimits);
        window.imsReady = Promise.resolve();
        signIn({ displayName: 'Mariia Lukianets', first_name: 'Mariia' });
    });

    afterEach(() => {
        sinon.restore();
        resetDevBoard(rateLimits);
        delete window.adobeIMS;
        delete window.imsReady;
        history.replaceState(null, '', originalUrl);
    });

    it('shows my PRs in dev and the PRs I should review', async () => {
        mockGitHub(github());
        const el = await mount();
        expect(el.me).to.equal('3ch023');
        expect($(el, 'sp-picker').value).to.equal('3ch023');
        expect(text($(el, 'sp-menu-item'))).to.equal('Mariia Lukianets (you)');
        expect($(el, 'sp-button[href="/studio.html"]')).to.not.exist;
        expect(text($(el, '.summary'))).to.match(/^adobecom\/mas · 9 open PRs · updated .+$/);

        expect(text($(el, '#dev-title'))).to.equal('My PRs in Dev');
        expect(text(column(el, 'dev').querySelector('.count'))).to.equal('2');
        expect(cardNumbers(el, 'dev')).to.deep.equal(['#102', '#101']);
        expect(chips(cardOf(el, 102))).to.deep.equal(['Changes requested', '0/2 approvals', 'MWPW-1']);
        expect(chips(cardOf(el, 101))).to.deep.equal(['Draft', '0/2 approvals']);
        expect(cardOf(el, 102).querySelector('.reviewer.changes_requested').alt).to.equal('Bob Smith: requested changes');
        expect(cardOf(el, 102).querySelector('.who')).to.not.exist;
        expect(text(column(el, 'dev').querySelector('.others'))).to.equal('With reviewers: #103 Approved: #104');

        expect(text($(el, '#review-title'))).to.equal('PRs to review');
        expect(cardNumbers(el, 'review')).to.deep.equal(['#105', '#107', '#109']);
        expect(chips(cardOf(el, 105))).to.deep.equal(['Review requested', '0/2 approvals']);
        expect(text(cardOf(el, 105).querySelector('.who'))).to.equal('Axel Cureno Basurto');
        expect(cardOf(el, 105).querySelector('.reviewer.requested').alt).to.equal('Mariia Lukianets: review requested');
        expect(chips(cardOf(el, 107))).to.deep.equal(['You commented', '0/2 approvals']);
        expect(text(cardOf(el, 109).querySelector('.who'))).to.equal('Bob Smith');
        expect(text(cardOf(el, 109).querySelector('.chip.bot'))).to.equal('dependabot');
        expect(cardOf(el, 109).querySelector('.title').href).to.equal('https://github.com/adobecom/mas/pull/109');

        expect(Object.keys(readCache('reviews'))).to.deep.equal(['101', '102', '103', '105', '107', '108', '109']);
        expect(text($(el, 'footer'))).to.match(/50\/60 GitHub requests left until/);
        expect($(el, 'footer .low')).to.not.exist;
    });

    it('switches to another developer and back', async () => {
        mockGitHub(github());
        const el = await mount();
        await pick(el, 'axel');
        expect(new URL(location.href).searchParams.get('user')).to.equal('axel');
        expect(readCache('selected')).to.equal('axel');
        expect(text($(el, '#dev-title'))).to.equal("Axel's PRs in Dev");
        expect(text(column(el, 'dev').querySelector('.empty strong'))).to.equal('Nothing in dev 🎉');
        expect(otherLinks(el)).to.deep.equal(['#105', '#108']);
        expect(text($(el, '#review-title'))).to.equal('PRs for Axel to review');
        expect(text(column(el, 'review').querySelector('.hint'))).to.match(/not approved by Axel yet$/);
        expect(cardNumbers(el, 'review')).to.deep.equal(['#103', '#107', '#102', '#109']);
        expect(chips(cardOf(el, 103))).to.deep.equal(['Review requested', '1/2 approvals']);
        expect(chips(cardOf(el, 102))).to.deep.equal(['Changes requested', '0/2 approvals', 'MWPW-1']);

        await pick(el, '3ch023');
        expect(new URL(location.href).searchParams.has('user')).to.be.false;
        expect(text($(el, '#dev-title'))).to.equal('My PRs in Dev');
    });

    it('opens the developer from a shared link', async () => {
        const url = new URL(location.href);
        url.searchParams.set('user', 'BOB');
        history.replaceState(null, '', url);
        mockGitHub(github());
        const el = await mount();
        expect(el.selected).to.equal('bob');
        expect(text($(el, '#dev-title'))).to.equal("Bob's PRs in Dev");
        expect(cardNumbers(el, 'dev')).to.deep.equal(['#106']);
        expect(chips(cardOf(el, 106))).to.deep.equal(['Do not review', '0/2 approvals']);
        expect(otherLinks(el)).to.deep.equal(['#107', '#109']);
    });

    it('asks who is checking in when the Studio session is gone', async () => {
        window.adobeIMS.getProfile = () => Promise.reject(new Error('expired'));
        mockGitHub(github());
        const el = await mount();
        expect(el.profile).to.be.null;
        expect($(el, 'sp-button[href="/studio.html"]')).to.exist;
        expect(text($(el, '.state h2'))).to.equal('Who is checking in?');
        expect(text($(el, 'sp-menu-item'))).to.equal('Axel Cureno Basurto');

        await pick(el, 'bob');
        expect(new URL(location.href).searchParams.get('user')).to.equal('bob');
        expect(text($(el, '#dev-title'))).to.equal("Bob's PRs in Dev");
    });

    it('greets a signed-in developer it cannot match', async () => {
        signIn({ displayName: 'Jane Doe', first_name: 'Jane' });
        mockGitHub(github());
        const el = await mount();
        expect(el.me).to.be.null;
        expect(text($(el, '.state h2'))).to.equal('Hi Jane!');
    });

    it('reopens the last picked developer', async () => {
        delete window.adobeIMS;
        writeCache('selected', 'axel');
        mockGitHub(github());
        const el = await mount();
        expect(el.profile).to.be.null;
        expect(text($(el, '#dev-title'))).to.equal("Axel's PRs in Dev");
    });

    it('offers a retry when GitHub cannot be reached', async () => {
        const data = github({ fail: () => respond({}, { status: 502 }) });
        mockGitHub(data);
        const el = await mount();
        expect($(el, 'sp-picker')).to.not.exist;
        expect(text($(el, '.state h2'))).to.equal("Couldn't load pull requests");
        expect(text($(el, '.state p'))).to.equal('GitHub is not reachable right now.');

        data.fail = null;
        $(el, '.state sp-button').click();
        await idle(el);
        expect(text($(el, '#dev-title'))).to.equal('My PRs in Dev');
    });

    it('keeps showing the last pull requests when the rate limit is used up', async () => {
        const data = github();
        mockGitHub(data);
        const el = await mount();
        data.fail = (url) => url.pathname.endsWith('/pulls') && rateLimited();
        $(el, 'sp-action-button[label="Refresh"]').click();
        expect(el.loading).to.be.true;
        await idle(el);
        expect(text($(el, '.banner'))).to.match(
            /^The GitHub API limit for your network is used up until .+\. Showing pull requests from .+\.$/,
        );
        expect(cardNumbers(el, 'dev')).to.deep.equal(['#102', '#101']);
        expect(text($(el, 'footer .low'))).to.match(/^0\/60 GitHub requests left until/);
    });

    it('warns when GitHub search is busy', async () => {
        mockGitHub(github({ fail: (url) => url.searchParams.get('q')?.includes('reviewed-by') && rateLimited('search') }));
        const el = await mount();
        expect(text($(el, '.banner'))).to.equal(
            'GitHub search is busy, so PRs you already reviewed may show up. Refresh in a minute.',
        );
    });

    it('keeps the last GitHub requests for the essentials', async () => {
        mockGitHub(github({ remaining: 8 }));
        const el = await mount();
        expect(Object.keys(readCache('reviews'))).to.deep.equal(['101', '102']);
        expect(cardNumbers(el, 'review')).to.deep.equal(['#105', '#108', '#107', '#109']);
        expect(chips(cardOf(el, 105))).to.deep.equal(['Review requested']);
        expect(chips(cardOf(el, 107))).to.deep.equal(['You reviewed']);
        expect(cardOf(el, 109).querySelector('.chips')).to.not.exist;
        expect(text($(el, 'footer .low'))).to.match(/^3\/60 GitHub requests left until/);
    });

    it('refreshes stale data when the tab becomes visible again', async () => {
        sinon.stub(document, 'visibilityState').get(() => 'visible');
        const fetch = mockGitHub(github());
        const el = await mount();
        document.dispatchEvent(new Event('visibilitychange'));
        expect(el.loading).to.be.false;

        el.snapshot = { ...el.snapshot, fetchedAt: Date.now() - 10 * 60 * 1000 };
        const calls = fetch.callCount;
        document.dispatchEvent(new Event('visibilitychange'));
        expect(el.loading).to.be.true;
        await idle(el);
        expect(fetch.callCount).to.be.above(calls);
    });

    it('describes how long ago a PR changed', () => {
        const now = Date.parse('2025-01-10T12:00:00Z');
        expect(timeAgo('2025-01-10T11:59:30Z', now)).to.equal('just now');
        expect(timeAgo('2025-01-10T11:55:00Z', now)).to.equal('5 minutes ago');
        expect(timeAgo('2025-01-10T09:00:00Z', now)).to.equal('3 hours ago');
        expect(timeAgo('2025-01-09T12:00:00Z', now)).to.equal('yesterday');
        expect(timeAgo('2024-12-20T12:00:00Z', now)).to.equal('3 weeks ago');
    });
});
