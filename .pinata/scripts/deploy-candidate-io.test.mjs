import assert from 'node:assert/strict';
import test from 'node:test';
import { deployCandidate, findRun, touchesIoStudio } from './deploy-candidate-io.mjs';

const IO_FILE = 'io/studio/src/custom-field-audit/index.js';
const title = (id) => `IO Studio Candidate Deploy ${id}`;

/** Fake git/gh/sleep. Hermetic: nothing is dispatched. The gh `run list` result runs through the real findRun. */
const harness = (overrides = {}) => {
    const cfg = {
        branch: 'MWPW-123456',
        sha: 'abc123',
        remoteSha: 'abc123',
        conclusion: 'success',
        watchDrops: 0,
        cancelCode: 0,
        runsBefore: [{ databaseId: 100, headSha: 'abc123', displayTitle: title('old') }],
        runsAfter: (id) => [
            { databaseId: 101, headSha: 'abc123', displayTitle: title(id) },
            { databaseId: 100, headSha: 'abc123', displayTitle: title('old') },
        ],
        onWatch: () => {},
        onWait: () => {},
        lateRun: false,
        ...overrides,
    };
    const controller = new AbortController();
    const calls = [];
    const logs = [];
    let dispatchId = '';
    let dispatched = false;
    let watches = 0;

    const run = async (cmd, args) => {
        calls.push([cmd, ...args].join(' '));
        if (cmd === 'git') {
            const key = args.join(' ');
            if (key === 'rev-parse --abbrev-ref HEAD') return { code: 0, stdout: `${cfg.branch}\n` };
            if (key === 'rev-parse HEAD') return { code: 0, stdout: `${cfg.sha}\n` };
            return { code: 0, stdout: cfg.remoteSha ? `${cfg.remoteSha}\trefs/heads/${cfg.branch}\n` : '' };
        }
        const [a, b] = args;
        if (a === 'workflow') {
            dispatched = true;
            dispatchId = args.find((arg) => arg.startsWith('dispatch_id=')).slice('dispatch_id='.length);
            return { code: 0, stdout: '' };
        }
        if (a === 'run' && b === 'list') {
            const hidden = cfg.lateRun && !controller.signal.aborted;
            const runs = !dispatched ? cfg.runsBefore : hidden ? [] : cfg.runsAfter(dispatchId);
            return { code: 0, stdout: JSON.stringify(runs) };
        }
        if (a === 'run' && b === 'watch') {
            watches++;
            cfg.onWatch(controller);
            return { code: watches <= cfg.watchDrops ? 1 : 0, stdout: '' };
        }
        if (a === 'run' && b === 'view' && args.includes('--log-failed')) return { code: 0, stdout: 'npm test: 3 failing\n' };
        if (a === 'run' && b === 'view') {
            const status = watches > cfg.watchDrops ? 'completed' : 'in_progress';
            return { code: 0, stdout: JSON.stringify({ status, conclusion: cfg.conclusion }) };
        }
        if (a === 'run' && b === 'cancel') return { code: cfg.cancelCode, stdout: '' };
        throw new Error(`unexpected ${cmd} ${args.join(' ')}`);
    };
    const wait = async () => cfg.onWait(controller);
    const out = { log: (m) => logs.push(m), error: (m) => logs.push(m) };
    const deploy = (files = [IO_FILE]) =>
        deployCandidate(files, { run, wait, signal: controller.signal, out, makeId: () => 'ID1' });
    const has = (text) => calls.some((call) => call.includes(text));
    const said = (text) => logs.some((line) => line.includes(text));
    return { deploy, has, said };
};

test('touchesIoStudio only matches io/studio paths', () => {
    assert.equal(touchesIoStudio(['studio/src/a.js', 'io/www/src/fragment/pipeline.js']), false);
    assert.equal(touchesIoStudio(['studio/src/a.js', IO_FILE]), true);
});

test('findRun ignores other commits and other dispatches', () => {
    const runs = [
        { databaseId: 1, headSha: 'other', displayTitle: title('ID1') },
        { databaseId: 2, headSha: 'abc123', displayTitle: title('ID2') },
        { databaseId: 3, headSha: 'abc123', displayTitle: title('ID1') },
    ];
    assert.equal(findRun(runs, 'abc123', 'ID1'), 3);
    assert.equal(findRun(runs, 'abc123', 'ID9'), undefined);
});

test('skips without io/studio files', async () => {
    const h = harness();
    assert.equal(await h.deploy(['studio/src/editors/merch-card-editor.js']), 0);
    assert.ok(h.said('SKIP: no io/studio changes'));
    assert.equal(h.has('workflow run'), false);
});

test('refuses an unpushed candidate', async () => {
    const h = harness({ remoteSha: 'def456' });
    assert.equal(await h.deploy(), 1);
    assert.ok(h.said('is not pushed at abc123'));
    assert.equal(h.has('workflow run'), false);
});

test('refuses a detached HEAD', async () => {
    const h = harness({ branch: 'HEAD' });
    assert.equal(await h.deploy(), 1);
    assert.ok(h.said('detached HEAD'));
    assert.equal(h.has('workflow run'), false);
});

test('deploys the candidate branch and waits on the new run', async () => {
    const h = harness();
    assert.equal(await h.deploy(), 0);
    assert.ok(h.said('OK: io/studio candidate deployed'));
    assert.ok(h.has('workflow run io-studio-candidate.yaml --ref MWPW-123456 -f dispatch_id=ID1'));
    assert.ok(h.has('run watch 101'));
});

for (const [name, runsAfter] of [
    ['an older run for the same commit', () => [{ databaseId: 100, headSha: 'abc123', displayTitle: title('old') }]],
    ['a newer run for a different commit', (id) => [{ databaseId: 101, headSha: 'fff999', displayTitle: title(id) }]],
    ["another dispatch's run on the same commit", () => [{ databaseId: 102, headSha: 'abc123', displayTitle: title('other') }]],
]) {
    test(`ignores ${name}`, async () => {
        const h = harness({ runsAfter });
        assert.equal(await h.deploy(), 1);
        assert.ok(h.said('run appeared for abc123'));
        assert.equal(h.has('run watch'), false);
    });
}

test('surfaces the failed run log', async () => {
    const h = harness({ conclusion: 'failure' });
    assert.equal(await h.deploy(), 1);
    assert.ok(h.said('npm test: 3 failing'));
});

test('explains a run replaced by a newer deploy', async () => {
    const h = harness({ conclusion: 'cancelled' });
    assert.equal(await h.deploy(), 1);
    assert.ok(h.said('was cancelled'));
    assert.equal(h.has('--log-failed'), false);
});

test('rides out a dropped watch connection', async () => {
    assert.equal(await harness({ watchDrops: 1 }).deploy(), 0);
});

test('gives up after repeated dropped watches', async () => {
    const h = harness({ watchDrops: 99 });
    assert.equal(await h.deploy(), 1);
    assert.ok(h.said('lost track of'));
});

for (const [reason, code] of [
    ['TERM', 143],
    ['INT', 130],
]) {
    test(`${reason} mid-watch cancels the run it was waiting on`, async () => {
        const h = harness({ onWatch: (c) => c.abort(reason) });
        assert.equal(await h.deploy(), code);
        assert.ok(h.has('run cancel 101'));
    });

    test(`${reason} while polling cancels the run`, async () => {
        const h = harness({ watchDrops: 99, onWait: (c) => c.abort(reason) });
        assert.equal(await h.deploy(), code);
        assert.ok(h.has('run cancel 101'));
    });

    test(`${reason} while looking up the run still cancels it`, async () => {
        const h = harness({ lateRun: true, onWait: (c) => c.abort(reason) });
        assert.equal(await h.deploy(), code);
        assert.ok(h.has('run cancel 101'));
    });
}

test('reports a rejected remote cancellation', async () => {
    const h = harness({ onWatch: (c) => c.abort('TERM'), cancelCode: 1 });
    assert.equal(await h.deploy(), 143);
    assert.ok(h.said('could not cancel'));
});

test('reports a stop before the run ever appeared', async () => {
    const h = harness({ runsAfter: () => [], onWait: (c) => c.abort('TERM') });
    assert.equal(await h.deploy(), 143);
    assert.ok(h.said('stopped before run ID1 appeared'));
});
