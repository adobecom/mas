import assert from 'node:assert/strict';
import test from 'node:test';

import {
    MARKER,
    commentBody,
    countApprovals,
    currentApprovals,
    failingChecks,
    latestChecks,
    selectCandidates,
    skipReason,
    summaryTable,
    touchesStudio,
} from './auto-merge-ready.mjs';

const run = (name, status, conclusion, startedAt, completedAt = startedAt) => ({
    name,
    status,
    conclusion,
    startedAt,
    completedAt,
});
const passing = [run('build', 'COMPLETED', 'SUCCESS', '2026-01-01T10:00:00Z')];
const review = (login, state, submitted_at, commit_id = 'head') => ({ user: { login }, state, submitted_at, commit_id });
const approvals = {
    reviews: [review('a', 'APPROVED', '2026-01-01T10:00:00Z'), review('b', 'APPROVED', '2026-01-01T11:00:00Z')],
    headPatchId: 'p1',
    patchIds: { head: 'p1' },
};

const readyPr = (overrides = {}) => ({
    number: 1,
    isDraft: false,
    labels: [{ name: 'Ready to Merge' }],
    headRefOid: 'head',
    changedFiles: 2,
    mergeStateStatus: 'CLEAN',
    statusCheckRollup: passing,
    ...overrides,
});
const loadOf = ({ files = [{ filename: 'studio/src/a.js' }], approved = approvals } = {}) => ({
    files: () => files,
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
    const load = { files: forbidden, approvals: forbidden };
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

test('failing checks are skipped before approvals are loaded', () => {
    const pr = readyPr({ statusCheckRollup: [run('Nala Gate', 'COMPLETED', 'FAILURE', '2026-01-01T10:00:00Z')] });
    assert.equal(skipReason(pr, { files: () => [], approvals: forbidden }), 'checks not passing: Nala Gate (FAILURE)');
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

test('an old failure followed by a newer success passes', () => {
    const rollup = [
        run('Nala Gate', 'COMPLETED', 'FAILURE', '2026-01-01T10:00:00Z', '2026-01-01T10:05:00Z'),
        run('Nala Gate', 'COMPLETED', 'SUCCESS', '2026-01-01T11:00:00Z', '2026-01-01T11:05:00Z'),
    ];
    assert.equal(latestChecks(rollup).length, 1);
    assert.deepEqual(failingChecks(rollup), []);
});

test('dedupe does not depend on array order', () => {
    const rollup = [
        run('Nala Gate', 'COMPLETED', 'SUCCESS', '2026-01-01T11:00:00Z'),
        run('Nala Gate', 'COMPLETED', 'CANCELLED', '2026-01-01T10:00:00Z'),
    ];
    assert.deepEqual(failingChecks(rollup), []);
});

test('a newer pending rerun fails', () => {
    const rollup = [
        run('Nala Gate', 'COMPLETED', 'SUCCESS', '2026-01-01T10:00:00Z', '2026-01-01T10:05:00Z'),
        run('Nala Gate', 'IN_PROGRESS', '', '2026-01-01T11:00:00Z', '0001-01-01T00:00:00Z'),
    ];
    assert.deepEqual(failingChecks(rollup), ['Nala Gate (IN_PROGRESS)']);
});

test('neutral and skipped conclusions pass', () => {
    const rollup = [
        run('a', 'COMPLETED', 'NEUTRAL', '2026-01-01T10:00:00Z'),
        run('b', 'COMPLETED', 'SKIPPED', '2026-01-01T10:00:00Z'),
    ];
    assert.deepEqual(failingChecks(rollup), []);
});

test('StatusContext entries are matched by context', () => {
    const status = (state, startedAt) => ({ context: 'ci/legacy', state, startedAt });
    assert.deepEqual(failingChecks([status('FAILURE', '2026-01-01T10:00:00Z'), status('SUCCESS', '2026-01-01T11:00:00Z')]), []);
    assert.deepEqual(failingChecks([status('SUCCESS', '2026-01-01T10:00:00Z'), status('PENDING', '2026-01-01T11:00:00Z')]), [
        'ci/legacy (PENDING)',
    ]);
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

test('approvals on an older commit count only with the same patch-id as the head', () => {
    const reviews = [
        review('a', 'APPROVED', '2026-01-01T10:00:00Z', 'old'),
        review('b', 'APPROVED', '2026-01-01T11:00:00Z', 'rewritten'),
    ];
    const patchIds = { old: 'p1', rewritten: 'p2' };
    assert.equal(countApprovals({ reviews, headPatchId: 'p1', patchIds }), 1);
});

test('an approval on a commit that could not be fetched does not count', () => {
    const reviews = [review('a', 'APPROVED', '2026-01-01T10:00:00Z', 'gone')];
    assert.equal(countApprovals({ reviews, headPatchId: 'p1', patchIds: { gone: null } }), 0);
    assert.equal(countApprovals({ reviews, headPatchId: 'p1', patchIds: {} }), 0);
});

test('nothing counts when the head patch-id is unknown', () => {
    const reviews = [review('a', 'APPROVED', '2026-01-01T10:00:00Z')];
    assert.equal(countApprovals({ reviews, headPatchId: null, patchIds: { head: null } }), 0);
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
