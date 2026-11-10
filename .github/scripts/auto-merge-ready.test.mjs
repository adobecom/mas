import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
    MARKER,
    commentBody,
    countApprovals,
    currentApprovals,
    maxChangedFiles,
    approvalsApplying,
    failingChecks,
    purgeFailureMessage,
    selectCandidates,
    skipReason,
    summary,
    summaryTable,
    touchesStudio,
} from './auto-merge-ready.mjs';

const run = (id, name, status, conclusion) => ({ id, name, status, conclusion });
const passing = { checkRuns: [run(1, 'build', 'completed', 'success')], statuses: [] };
const review = (login, state, submitted_at, commit_id = 'head', author_association = 'MEMBER') => ({
    user: { login },
    state,
    submitted_at,
    commit_id,
    author_association,
});
const approvals = {
    reviews: [review('a', 'APPROVED', '2026-01-01T10:00:00Z'), review('b', 'APPROVED', '2026-01-01T11:00:00Z')],
    headSha: 'head',
    applies: {},
};

const readyPr = (overrides = {}) => ({
    number: 1,
    isDraft: false,
    labels: [{ name: 'Ready to Merge' }],
    headRefOid: 'head',
    changedFiles: 2,
    mergeStateStatus: 'CLEAN',
    ...overrides,
});
const loadOf = ({ files = [{ filename: 'studio/src/a.js' }], checks = passing, approved = approvals } = {}) => ({
    files: () => files,
    checks: () => checks,
    approvals: () => approved,
});
const forbidden = () => assert.fail('loaded data an earlier rule makes unnecessary');

test('a ready PR has no skip reason', () => {
    assert.equal(skipReason(readyPr(), loadOf()), null);
});

test('draft is skipped', () => {
    assert.equal(skipReason(readyPr({ isDraft: true }), loadOf()), 'draft');
});

test('blocking labels are skipped', () => {
    for (const name of ['do not merge', 'UNDER MILO VALIDATION', 'RCP-restricted']) {
        const pr = readyPr({ labels: [{ name: 'Ready to Merge' }, { name }] });
        assert.equal(skipReason(pr, loadOf()), `labeled "${name}"`);
    }
});

test('30 or more changed files are skipped before files are fetched', () => {
    const load = { files: forbidden, checks: forbidden, approvals: forbidden };
    assert.match(skipReason(readyPr({ changedFiles: 30 }), load), /30 changed files/);
    assert.equal(skipReason(readyPr({ changedFiles: 29 }), loadOf()), null);
});

test('restricted paths are skipped', () => {
    for (const filename of ['io/www/src/a.js', 'web-components/src/a.js', '.github/workflows/a.yaml']) {
        assert.equal(skipReason(readyPr(), loadOf({ files: [{ filename }] })), `touches ${filename}`);
    }
});

test('a file renamed out of io/ is skipped through previous_filename', () => {
    const files = [{ filename: 'docs/a.js', previous_filename: 'io/www/a.js' }];
    assert.equal(skipReason(readyPr(), loadOf({ files })), 'touches io/www/a.js');
});

test('paths that only look restricted pass', () => {
    const files = [{ filename: 'studio/io/a.js' }, { filename: 'docs/web-components/a.md' }];
    assert.equal(skipReason(readyPr(), loadOf({ files })), null);
});

test('failing checks are skipped before the merge state and approvals are considered', () => {
    const checks = { checkRuns: [run(1, 'Nala Gate', 'completed', 'failure')], statuses: [] };
    const pr = readyPr({ mergeStateStatus: 'BEHIND' });
    assert.equal(
        skipReason(pr, { files: () => [], checks: () => checks, approvals: forbidden }),
        'checks not passing: Nala Gate (failure)',
    );
});

test('merge state other than CLEAN is skipped', () => {
    for (const mergeStateStatus of ['BEHIND', 'BLOCKED', 'UNKNOWN', 'DIRTY']) {
        assert.equal(skipReason(readyPr({ mergeStateStatus }), loadOf()), `merge state is ${mergeStateStatus}`);
    }
});

test('fewer than two applying approvals are skipped', () => {
    const one = { ...approvals, reviews: approvals.reviews.slice(0, 1) };
    assert.equal(skipReason(readyPr(), loadOf({ approved: one })), '1 of 2 approvals apply to the current code');
});

const failures = (checkRuns, statuses = []) => failingChecks({ checkRuns, statuses });

test('an old failure followed by a newer success passes, in either array order', () => {
    const runs = [run(1, 'Nala Gate', 'completed', 'failure'), run(2, 'Nala Gate', 'completed', 'success')];
    assert.deepEqual(failures(runs), []);
    assert.deepEqual(failures([...runs].reverse()), []);
});

test('an older success that finished after a newer failure still fails', () => {
    const runs = [run(1, 'Nala Gate', 'completed', 'success'), run(2, 'Nala Gate', 'completed', 'failure')];
    assert.deepEqual(failures(runs), ['Nala Gate (failure)']);
    assert.deepEqual(failures([...runs].reverse()), ['Nala Gate (failure)']);
});

test('a newer queued or in-progress run after an older success fails', () => {
    for (const status of ['queued', 'in_progress']) {
        const runs = [run(1, 'Nala Gate', 'completed', 'success'), run(2, 'Nala Gate', status, null)];
        assert.deepEqual(failures(runs), [`Nala Gate (${status})`]);
        assert.deepEqual(failures([...runs].reverse()), [`Nala Gate (${status})`]);
    }
});

test('neutral and skipped conclusions pass, other conclusions fail', () => {
    assert.deepEqual(failures([run(1, 'a', 'completed', 'neutral'), run(2, 'b', 'completed', 'skipped')]), []);
    assert.deepEqual(failures([run(1, 'a', 'completed', 'cancelled')]), ['a (cancelled)']);
});

test('commit statuses must all be success', () => {
    assert.deepEqual(failures([], [{ context: 'ci/legacy', state: 'success' }]), []);
    for (const state of ['pending', 'failure', 'error']) {
        assert.deepEqual(failures([], [{ context: 'ci/legacy', state }]), [`ci/legacy (${state})`]);
    }
});

test('a reviewer whose latest non-comment review requests changes does not count', () => {
    const reviews = [review('a', 'APPROVED', '2026-01-01T10:00:00Z'), review('a', 'CHANGES_REQUESTED', '2026-01-01T11:00:00Z')];
    assert.deepEqual(currentApprovals(reviews), []);
});

test('a comment after an approval keeps the approval', () => {
    const reviews = [review('a', 'APPROVED', '2026-01-01T10:00:00Z'), review('a', 'COMMENTED', '2026-01-01T11:00:00Z')];
    assert.equal(currentApprovals(reviews).length, 1);
});

test('a re-approval after requested changes counts once', () => {
    const reviews = [
        review('a', 'CHANGES_REQUESTED', '2026-01-01T10:00:00Z'),
        review('a', 'APPROVED', '2026-01-01T11:00:00Z'),
        review('a', 'APPROVED', '2026-01-01T12:00:00Z'),
    ];
    assert.equal(currentApprovals(reviews).length, 1);
});

test('a dismissed approval does not count', () => {
    assert.deepEqual(
        currentApprovals([review('a', 'APPROVED', '2026-01-01T10:00:00Z'), review('a', 'DISMISSED', '2026-01-01T11:00:00Z')]),
        [],
    );
});

test('the file limit comes from AUTO_MERGE_MAX_FILES and falls back to 29', () => {
    assert.equal(maxChangedFiles('50'), 50);
    for (const value of [undefined, '', '0', '-3', '2.5', 'many']) assert.equal(maxChangedFiles(value), 29);
});

test('an approval from a reviewer outside the repo does not count', () => {
    assert.deepEqual(currentApprovals([review('a', 'APPROVED', '2026-01-01T10:00:00Z', 'head', 'CONTRIBUTOR')]), []);
});

test('an approval on the head counts without a tree comparison', () => {
    assert.equal(countApprovals({ ...approvals, applies: {} }), 2);
});

test('an approval on an older commit counts only when it applies to the head', () => {
    const reviews = [
        review('a', 'APPROVED', '2026-01-01T10:00:00Z', 'old'),
        review('b', 'APPROVED', '2026-01-01T11:00:00Z', 'rewritten'),
    ];
    assert.equal(countApprovals({ reviews, headSha: 'head', applies: { old: true, rewritten: false } }), 1);
    assert.equal(countApprovals({ reviews, headSha: 'head', applies: {} }), 0);
});

test('only the exact label selects candidates, oldest PR first', () => {
    const prs = [
        readyPr({ number: 9 }),
        readyPr({ number: 3, labels: [{ name: 'ready to merge' }] }),
        readyPr({ number: 5, labels: [{ name: 'Ready to Merge ' }] }),
        readyPr({ number: 2 }),
    ];
    assert.deepEqual(
        selectCandidates(prs).map((pr) => pr.number),
        [2, 9],
    );
});

test('touchesStudio sees renames out of studio/', () => {
    assert.equal(touchesStudio([{ filename: 'studio/a.js' }]), true);
    assert.equal(touchesStudio([{ filename: 'docs/a.js', previous_filename: 'studio/a.js' }]), true);
    assert.equal(touchesStudio([{ filename: 'docs/a.js' }]), false);
});

test('the comment carries the marker and the summary escapes pipes', () => {
    assert.ok(commentBody('draft').startsWith(MARKER));
    assert.match(summaryTable([{ number: 4, outcome: 'skipped: a | b' }]), /\| #4 \| skipped: a \\\| b \|/);
});

test('the summary starts with the mode', () => {
    const rows = [{ number: 4, outcome: 'would merge' }];
    assert.match(summary({ dryRun: true, rows }), /^Mode: dry run/);
    assert.match(summary({ dryRun: false, rows }), /^Mode: live\n\n\| PR/);
    assert.match(summary({ dryRun: false, rows: [] }), /No open PR is labeled "Ready to Merge"/);
});

test('the purge failure names the PR and the exact retry command', () => {
    const message = purgeFailureMessage({ number: 7, parent: 'abc123', message: 'boom' });
    assert.match(message, /PR #7 is merged/);
    assert.ok(message.endsWith('gh workflow run studio-akamai-purge.yaml -f before_sha=abc123'));
});

// Real git: a bare origin, a clone that built the history, and a fresh runner clone that only knows what origin serves.
function repoWith(build) {
    const dir = mkdtempSync(join(tmpdir(), 'auto-merge-ready-'));
    const sh = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    const origin = join(dir, 'origin.git');
    const work = join(dir, 'work');
    sh(dir, 'init', '--bare', '-b', 'main', origin);
    sh(dir, 'clone', origin, work);
    sh(work, 'config', 'user.email', 'test@example.com');
    sh(work, 'config', 'user.name', 'Test');
    const lines = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');
    const write = (file, content) => writeFileSync(join(work, file), content);
    const commit = (message) => {
        sh(work, 'add', '-A');
        sh(work, 'commit', '-m', message);
        return sh(work, 'rev-parse', 'HEAD');
    };
    write('a.txt', `${lines}\n`);
    write('s.txt', 'status: not allowed\n');
    commit('base');
    sh(work, 'push', 'origin', 'main');
    sh(work, 'checkout', '-b', 'pr');
    const { approved, head } = build({ sh: (...args) => sh(work, ...args), write, commit, lines });
    sh(work, 'push', 'origin', 'main');
    sh(work, 'push', 'origin', `${head}:refs/pull/1/head`);
    // Reachable only through a ref the runner's clone does not fetch, like a replaced PR commit.
    sh(work, 'push', 'origin', `${approved}:refs/pull/1/approved`);
    const runner = join(dir, 'runner');
    sh(dir, 'clone', origin, runner);
    const git = (args) => execFileSync('git', args, { cwd: runner, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { dir, git, approved, head };
}

function approvalApplies(build) {
    const { dir, git, approved, head } = repoWith(build);
    try {
        return approvalsApplying(git, { number: 1, headSha: head, commitIds: [approved] })[approved];
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

// The PR changes line 3 of a.txt and gets approved.
function approvedChange({ sh, write, commit, lines }) {
    write('a.txt', `${lines.replace('line 3', 'line 3 changed')}\n`);
    return commit('pr change');
}

const mainChange = (sh, write, commit, file, content, message) => {
    sh('checkout', 'main');
    write(file, content);
    return commit(message);
};

test('a clean merge from main that changed lines near the PR change keeps the approval', () => {
    const applies = approvalApplies((ctx) => {
        const approved = approvedChange(ctx);
        mainChange(ctx.sh, ctx.write, ctx.commit, 'a.txt', `${ctx.lines.replace('line 6', 'line 6 main')}\n`, 'main change');
        ctx.sh('checkout', 'pr');
        ctx.sh('merge', '--no-edit', 'main');
        return { approved, head: ctx.sh('rev-parse', 'HEAD') };
    });
    assert.equal(applies, true);
});

test('removing a space inside a string after the approval drops it', () => {
    const applies = approvalApplies((ctx) => {
        const approved = approvedChange(ctx);
        ctx.write('s.txt', 'status: notallowed\n');
        return { approved, head: ctx.commit('edit string') };
    });
    assert.equal(applies, false);
});

test('a clean rebase onto newer main keeps the approval', () => {
    const applies = approvalApplies((ctx) => {
        const approved = approvedChange(ctx);
        mainChange(ctx.sh, ctx.write, ctx.commit, 'other.txt', 'other\n', 'main change');
        ctx.sh('checkout', 'pr');
        ctx.sh('rebase', 'main');
        return { approved, head: ctx.sh('rev-parse', 'HEAD') };
    });
    assert.equal(applies, true);
});

test('a merge from main with a hand-resolved conflict drops the approval', () => {
    const applies = approvalApplies((ctx) => {
        const approved = approvedChange(ctx);
        mainChange(
            ctx.sh,
            ctx.write,
            ctx.commit,
            'a.txt',
            `${ctx.lines.replace('line 3', 'line 3 main')}\n`,
            'conflicting main change',
        );
        ctx.sh('checkout', 'pr');
        assert.throws(() => ctx.sh('merge', '--no-edit', 'main'));
        ctx.write('a.txt', `${ctx.lines.replace('line 3', 'line 3 resolved')}\n`);
        ctx.sh('add', '-A');
        ctx.sh('commit', '--no-edit');
        return { approved, head: ctx.sh('rev-parse', 'HEAD') };
    });
    assert.equal(applies, false);
});

test('an approval commit that cannot be fetched does not count', () => {
    const { dir, git, head } = repoWith((ctx) => ({ approved: approvedChange(ctx), head: ctx.sh('rev-parse', 'HEAD') }));
    try {
        const missing = 'deadbeef'.repeat(5);
        assert.deepEqual(approvalsApplying(git, { number: 1, headSha: head, commitIds: [missing] }), { [missing]: false });
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
