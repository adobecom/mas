// Squash-merges the oldest open PR labeled "Ready to Merge" that passes every guard below (MWPW-210335).
// Run every 30 minutes on weekdays by .github/workflows/auto-merge-ready.yaml, or manually with dry_run.
// Merging one PR makes the others BEHIND (strict up-to-date rule), so a live run merges at most one.
//
// Usage (needs a checkout with full history and `gh` authenticated with the workflow token):
//   [DRY_RUN=true] [GITHUB_REPOSITORY=adobecom/mas] node .github/scripts/auto-merge-ready.mjs

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = 'adobecom/mas';
export const LABEL = 'Ready to Merge';
export const MARKER = '<!-- auto-merge-ready -->';
export const MIN_APPROVALS = 2;
// The repo variable AUTO_MERGE_MAX_FILES overrides the default without a code change, as milo's merge-to-stage does.
export const DEFAULT_MAX_CHANGED_FILES = 29;

export function maxChangedFiles(value) {
    const max = Number(value);
    return Number.isInteger(max) && max > 0 ? max : DEFAULT_MAX_CHANGED_FILES;
}

export const MAX_CHANGED_FILES = maxChangedFiles(process.env.AUTO_MERGE_MAX_FILES);

const BLOCKING_LABELS = ['do not merge', 'under milo validation', 'rcp-restricted'];
const RESTRICTED_PREFIXES = ['io/', 'web-components/', '.github/'];
const PASSING_CONCLUSIONS = ['success', 'neutral', 'skipped'];
// Review states that say nothing about approval.
const NEUTRAL_REVIEW_STATES = ['COMMENTED', 'PENDING'];
// Only reviewers who can approve under the ruleset; anyone can leave an APPROVED review on a public repo.
const TRUSTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR'];

// Exact, case-sensitive match; `gh pr list --label` is not.
export function selectCandidates(prs) {
    return prs.filter((pr) => pr.labels.some((label) => label.name === LABEL)).sort((a, b) => a.number - b.number);
}

function pathsOf(file) {
    return [file.filename, file.previous_filename].filter(Boolean);
}

export function restrictedPath(files) {
    return files.flatMap(pathsOf).find((path) => RESTRICTED_PREFIXES.some((prefix) => path.startsWith(prefix)));
}

export function touchesStudio(files) {
    return files.flatMap(pathsOf).some((path) => path.startsWith('studio/'));
}

// Check run ids increase with every new run of a check, so the highest id per name is the latest. Timestamps are
// unreliable: a queued run has none and a slow old run can finish after a newer one.
export function latestRuns(checkRuns) {
    const latest = new Map();
    for (const run of checkRuns) {
        if (!latest.has(run.name) || run.id > latest.get(run.name).id) latest.set(run.name, run);
    }
    return [...latest.values()];
}

// `statuses` is already the latest status per context.
export function failingChecks({ checkRuns, statuses }) {
    const runs = latestRuns(checkRuns)
        .filter((run) => run.status !== 'completed' || !PASSING_CONCLUSIONS.includes(run.conclusion))
        .map((run) => `${run.name} (${run.status === 'completed' ? run.conclusion : run.status})`);
    const failed = statuses
        .filter((status) => status.state !== 'success')
        .map((status) => `${status.context} (${status.state})`);
    return [...runs, ...failed].sort();
}

// Each reviewer's latest non-comment review, when it is an approval.
export function currentApprovals(reviews) {
    const latest = new Map();
    const submitted = reviews
        .filter(
            (review) =>
                !NEUTRAL_REVIEW_STATES.includes(review.state) && TRUSTED_ASSOCIATIONS.includes(review.author_association),
        )
        .sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at));
    for (const review of submitted) latest.set(review.user.login, review);
    return [...latest.values()].filter((review) => review.state === 'APPROVED');
}

// `applies` maps an approved commit to whether replaying its change onto the head's main base gives the head.
export function countApprovals({ reviews, headSha, applies }) {
    return currentApprovals(reviews).filter((review) => review.commit_id === headSha || applies[review.commit_id]).length;
}

// `load` returns the data that needs a request, so a PR is only loaded as far as the first failing rule.
export function skipReason(pr, load) {
    if (pr.isDraft) return 'draft';
    const blocking = pr.labels.find((label) => BLOCKING_LABELS.includes(label.name.toLowerCase()));
    if (blocking) return `labeled "${blocking.name}"`;
    if (pr.changedFiles > MAX_CHANGED_FILES) return `${pr.changedFiles} changed files (limit is ${MAX_CHANGED_FILES})`;
    const restricted = restrictedPath(load.files());
    if (restricted) return `touches ${restricted}`;
    const failing = failingChecks(load.checks());
    if (failing.length) return `checks not passing: ${failing.join(', ')}`;
    if (pr.mergeStateStatus !== 'CLEAN') return `merge state is ${pr.mergeStateStatus}`;
    const approvals = countApprovals(load.approvals());
    if (approvals < MIN_APPROVALS) return `${approvals} of ${MIN_APPROVALS} approvals apply to the current code`;
    return null;
}

export function commentBody(reason) {
    return `${MARKER}\nNot auto-merged yet: ${reason}`;
}

export function summary({ dryRun, rows }) {
    const mode = dryRun ? 'dry run: nothing is merged, commented or purged' : 'live';
    const body = rows.length ? summaryTable(rows) : `No open PR is labeled "${LABEL}".`;
    return `Mode: ${mode}\n\n${body}`;
}

export function summaryTable(rows) {
    const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const lines = rows.map(({ number, outcome }) => `| #${number} | ${cell(outcome)} |`);
    return ['| PR | Outcome |', '| --- | --- |', ...lines].join('\n');
}

function gh(...args) {
    return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function ghPaginate(path) {
    return JSON.parse(gh('api', path, '--paginate', '--slurp')).flat();
}

function runGit(args) {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

// Replaying the approved change onto the head's main base must give exactly the head's tree. A clean update from main
// or a clean rebase passes, any code change or hand-resolved conflict does not. `git` throws on a non-zero exit, and
// merge-tree exits 1 on conflicts.
function appliesToHead(git, headSha, commitId) {
    try {
        git(['fetch', 'origin', commitId]);
        const base = git(['merge-base', 'origin/main', headSha]).trim();
        const merged = git(['merge-tree', '--write-tree', commitId, base]).split('\n')[0].trim();
        return merged === git(['rev-parse', `${headSha}^{tree}`]).trim();
    } catch {
        return false;
    }
}

export function approvalsApplying(git, { number, headSha, commitIds }) {
    const others = commitIds.filter((commitId) => commitId !== headSha);
    if (!others.length) return {};
    try {
        git(['fetch', 'origin', `refs/pull/${number}/head`]);
    } catch {
        return {};
    }
    return Object.fromEntries(others.map((commitId) => [commitId, appliesToHead(git, headSha, commitId)]));
}

function once(fn) {
    let value;
    let done = false;
    return () => {
        if (!done) {
            value = fn();
            done = true;
        }
        return value;
    };
}

function ghJson(path) {
    return JSON.parse(gh('api', path));
}

function loadChecks(repo, sha) {
    const pages = JSON.parse(
        gh('api', `repos/${repo}/commits/${sha}/check-runs?filter=all&per_page=100`, '--paginate', '--slurp'),
    );
    return {
        checkRuns: pages.flatMap((page) => page.check_runs),
        statuses: ghJson(`repos/${repo}/commits/${sha}/status?per_page=100`).statuses,
    };
}

function loaders(repo, pr) {
    return {
        files: once(() => ghPaginate(`repos/${repo}/pulls/${pr.number}/files`)),
        checks: once(() => loadChecks(repo, pr.headRefOid)),
        approvals: once(() => {
            const reviews = ghPaginate(`repos/${repo}/pulls/${pr.number}/reviews`);
            const commitIds = [...new Set(currentApprovals(reviews).map((review) => review.commit_id))];
            const applies = approvalsApplying(runGit, { number: pr.number, headSha: pr.headRefOid, commitIds });
            return { reviews, headSha: pr.headRefOid, applies };
        }),
    };
}

function syncComment(repo, number, reason) {
    const body = commentBody(reason);
    const mine = ghPaginate(`repos/${repo}/issues/${number}/comments`).find(
        (comment) => comment.user.login === 'github-actions[bot]' && comment.body.startsWith(MARKER),
    );
    if (!mine) gh('api', `repos/${repo}/issues/${number}/comments`, '-f', `body=${body}`);
    else if (mine.body !== body) gh('api', '-X', 'PATCH', `repos/${repo}/issues/comments/${mine.id}`, '-f', `body=${body}`);
}

// GITHUB_TOKEN merges do not trigger push workflows, so the Akamai purge of Studio files is dispatched by hand.
// Returns the failure, with the commit to purge from when it is known, or null.
function dispatchPurge(repo, number) {
    let parent;
    try {
        const { mergeCommit } = JSON.parse(gh('pr', 'view', String(number), '--repo', repo, '--json', 'mergeCommit'));
        parent = gh('api', `repos/${repo}/commits/${mergeCommit.oid}`, '--jq', '.parents[0].sha').trim();
        gh('workflow', 'run', 'studio-akamai-purge.yaml', '--repo', repo, '-f', `before_sha=${parent}`);
        return null;
    } catch (error) {
        return { number, parent, message: error.message };
    }
}

export function purgeFailureMessage({ number, parent, message }) {
    const sha = parent ?? `<first parent of the merge commit of #${number}>`;
    return `PR #${number} is merged but the Akamai purge dispatch failed (${message}). Retry: gh workflow run studio-akamai-purge.yaml -f before_sha=${sha}`;
}

// A merged PR is never retried: a purge failure is reported next to "merged" and fails the run.
function merge(repo, pr, files) {
    gh('pr', 'merge', String(pr.number), '--repo', repo, '--squash', '--match-head-commit', pr.headRefOid);
    if (!touchesStudio(files)) return { outcome: 'merged' };
    const purgeFailure = dispatchPurge(repo, pr.number);
    if (purgeFailure) return { outcome: 'merged, Akamai purge dispatch failed', purgeFailure };
    return { outcome: 'merged, Akamai purge dispatched' };
}

function handle(repo, pr, dryRun) {
    const load = loaders(repo, pr);
    const reason = skipReason(pr, load);
    if (reason) {
        if (!dryRun) {
            try {
                syncComment(repo, pr.number, reason);
            } catch (error) {
                console.error(`#${pr.number}: could not sync comment: ${error.message}`);
            }
        }
        return { outcome: `skipped: ${reason}` };
    }
    if (dryRun) return { outcome: 'would merge', merged: true };
    return { ...merge(repo, pr, load.files()), merged: true };
}

function main() {
    const repo = process.env.GITHUB_REPOSITORY ?? REPO;
    const dryRun = process.env.DRY_RUN === 'true';
    const prs = JSON.parse(
        gh(
            'pr',
            'list',
            '--repo',
            repo,
            '--base',
            'main',
            '--state',
            'open',
            '--limit',
            '200',
            '--json',
            'number,isDraft,labels,headRefOid,changedFiles,mergeStateStatus',
        ),
    );
    const rows = [];
    const purgeFailures = [];
    let mergedNumber = null;
    for (const pr of selectCandidates(prs)) {
        if (mergedNumber) {
            rows.push({ number: pr.number, outcome: `not evaluated: #${mergedNumber} merged first` });
            continue;
        }
        try {
            const { outcome, merged, purgeFailure } = handle(repo, pr, dryRun);
            rows.push({ number: pr.number, outcome });
            // A dry run merges nothing, so every PR stays mergeable and is evaluated.
            if (merged && !dryRun) mergedNumber = pr.number;
            if (purgeFailure) purgeFailures.push(purgeFailure);
        } catch (error) {
            rows.push({ number: pr.number, outcome: `error: ${error.message}` });
        }
    }
    const text = summary({ dryRun, rows });
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
    // ::error:: puts the retry command on the run page, not only in the log.
    for (const failure of purgeFailures) console.error(`::error::${purgeFailureMessage(failure)}`);
    if (purgeFailures.length) process.exitCode = 1;
}

const isDirectRun = process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url));
if (isDirectRun) {
    main();
}
