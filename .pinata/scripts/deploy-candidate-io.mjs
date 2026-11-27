#!/usr/bin/env node
// io-studio-candidate gate: deploy a candidate's io/studio changes to the shared
// bot workspace through CI (.github/workflows/io-studio-candidate.yaml), then wait
// for unit tests, deploy and health check. Piñata never holds runtime credentials:
// the dispatched workflow reads them from Vault on the self-hosted runner.
//
// Usage: node .pinata/scripts/deploy-candidate-io.mjs <changed file>...
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const WORKFLOW = 'io-studio-candidate.yaml';
const RUN_LOOKUP_ATTEMPTS = 30;
const WATCH_ATTEMPTS = 5;
const LOG_TAIL_LINES = 200;

export const touchesIoStudio = (files) => files.some((file) => file.startsWith('io/studio/'));

/** The run this dispatch started: workflow_dispatch returns no id, so the run name ends with our dispatch id. */
export const findRun = (runs, sha, dispatchId) =>
    runs.find((run) => run.headSha === sha && run.displayTitle.endsWith(` ${dispatchId}`))?.databaseId;

export const exec = (cmd, args, { signal, inherit = false } = {}) =>
    new Promise((resolve) => {
        const child = spawn(cmd, args, { stdio: ['ignore', inherit ? 'inherit' : 'pipe', 'inherit'], signal });
        let stdout = '';
        child.stdout?.on('data', (chunk) => (stdout += chunk));
        child.on('error', () => resolve({ code: 1, stdout }));
        child.on('close', (code) => resolve({ code: code ?? 1, stdout }));
    });

export const sleep = (ms, signal) =>
    new Promise((resolve) => {
        if (signal?.aborted) return resolve();
        const done = () => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', done);
            resolve();
        };
        const timer = setTimeout(done, ms);
        signal?.addEventListener('abort', done, { once: true });
    });

const newDispatchId = () => `${Math.floor(Date.now() / 1000)}-${process.pid}-${Math.floor(Math.random() * 32768)}`;

/** Returns the process exit code. `signal` aborting (reason 'INT' or 'TERM') cancels the remote run. */
export async function deployCandidate(files, deps = {}) {
    const { run = exec, wait = sleep, signal, out = console, makeId = newDispatchId } = deps;
    if (!touchesIoStudio(files)) {
        out.log('SKIP: no io/studio changes');
        return 0;
    }
    const fail = (message) => {
        out.error(message);
        return 1;
    };
    const git = async (...args) => (await run('git', args)).stdout.trim();
    const gh = (args, options) => run('gh', args, { signal, ...options });

    const branch = await git('rev-parse', '--abbrev-ref', 'HEAD');
    const sha = await git('rev-parse', 'HEAD');
    if (branch === 'HEAD') return fail('FAIL: detached HEAD; the candidate must be on a pushed branch.');
    const remoteSha = (await git('ls-remote', 'origin', `refs/heads/${branch}`)).split(/\s/)[0];
    if (remoteSha !== sha) {
        return fail(`FAIL: ${branch} is not pushed at ${sha} (origin has '${remoteSha || 'nothing'}').`);
    }

    const dispatchId = makeId();
    let dispatched = false;
    let runId;

    const lookup = async (options) => {
        const { stdout } = await run(
            'gh',
            [
                'run',
                'list',
                '--workflow',
                WORKFLOW,
                '--branch',
                branch,
                '--event',
                'workflow_dispatch',
                '--json',
                'databaseId,headSha,displayTitle',
            ],
            options,
        );
        try {
            return findRun(JSON.parse(stdout), sha, dispatchId);
        } catch {
            return undefined;
        }
    };

    // The engine stopping this gate (timeout, abort) must not leave the run deploying
    // behind it: a retry would queue behind the orphan in the same concurrency group.
    const stopGate = async () => {
        const code = signal.reason === 'INT' ? 130 : 143;
        if (!runId && dispatched) runId = await lookup();
        if (runId) {
            const { code: cancelCode } = await run('gh', ['run', 'cancel', String(runId)]);
            if (cancelCode) out.error(`FAIL: could not cancel ${WORKFLOW} run ${runId}. Cancel it on GitHub.`);
        } else if (dispatched) {
            out.error(`FAIL: stopped before run ${dispatchId} appeared. Cancel it on GitHub if it starts.`);
        }
        return code;
    };

    dispatched = true;
    await gh(['workflow', 'run', WORKFLOW, '--ref', branch, '-f', `dispatch_id=${dispatchId}`]);

    let attempt = 0;
    while (!runId && attempt < RUN_LOOKUP_ATTEMPTS) {
        if (signal?.aborted) return stopGate();
        runId = await lookup({ signal });
        attempt++;
        if (!runId) await wait(2000, signal);
    }
    if (signal?.aborted) return stopGate();
    if (!runId) return fail(`FAIL: no ${WORKFLOW} run appeared for ${sha} after ${attempt} lookups.`);

    out.log(`Waiting on ${WORKFLOW} run ${runId}`);
    // A watch can drop on a network error while the run keeps going, so the verdict
    // comes from the run's own status and conclusion, never from the watch's exit code.
    let state = {};
    for (attempt = 1; attempt <= WATCH_ATTEMPTS; attempt++) {
        const watch = await gh(['run', 'watch', String(runId), '--interval', '15'], { inherit: true });
        if (signal?.aborted) return stopGate();
        if (watch.code) out.error(`WARN: watch disconnected for run ${runId}; checking the run status.`);
        const view = await run('gh', ['run', 'view', String(runId), '--json', 'status,conclusion']);
        try {
            state = JSON.parse(view.stdout);
        } catch {
            state = {};
        }
        if (state.status === 'completed') break;
        await wait(15000, signal);
        if (signal?.aborted) return stopGate();
    }
    if (state.status !== 'completed') {
        return fail(
            `FAIL: lost track of ${WORKFLOW} run ${runId} after ${WATCH_ATTEMPTS} watch attempts (last status '${state.status || 'unknown'}'). Check it on GitHub.`,
        );
    }

    if (state.conclusion === 'cancelled') {
        return fail(
            `FAIL: ${WORKFLOW} run ${runId} was cancelled, most likely replaced by a newer deploy to the shared bot workspace. Retry the gate.`,
        );
    }
    if (state.conclusion !== 'success') {
        out.error(`FAIL: ${WORKFLOW} run ${runId} ended '${state.conclusion}'. Failed steps:`);
        const { stdout } = await run('gh', ['run', 'view', String(runId), '--log-failed']);
        out.error(stdout.split('\n').slice(-LOG_TAIL_LINES).join('\n'));
        return 1;
    }
    out.log(`OK: io/studio candidate deployed and healthy (run ${runId})`);
    return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    process.chdir(fileURLToPath(new URL('../..', import.meta.url)));
    const controller = new AbortController();
    process.on('SIGTERM', () => controller.abort('TERM'));
    process.on('SIGINT', () => controller.abort('INT'));
    process.exitCode = await deployCandidate(process.argv.slice(2), { signal: controller.signal });
}
