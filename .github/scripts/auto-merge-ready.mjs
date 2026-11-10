// Squash-merges the oldest open PR labeled "Ready to Merge" that passes every guard below (MWPW-210335).
// Run every 30 minutes on weekdays by .github/workflows/auto-merge-ready.yaml, or manually with dry_run.
// Merging one PR makes the others BEHIND (strict up-to-date rule), so a run merges at most one.
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
export const MAX_CHANGED_FILES = 30;

const BLOCKING_LABELS = ['do not merge', 'under milo validation', 'rcp-restricted'];
const RESTRICTED_PREFIXES = ['io/', 'web-components/', '.github/'];
const PASSING_CONCLUSIONS = ['SUCCESS', 'NEUTRAL', 'SKIPPED'];
// Review states that say nothing about approval.
const NEUTRAL_REVIEW_STATES = ['COMMENTED', 'PENDING'];

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

// The rollup holds CheckRun (name, status, conclusion) and StatusContext (context, state) entries, and keeps every
// rerun of a check, so only the latest entry per name counts.
const checkName = (check) => check.name ?? check.context;
const checkTime = (check) => Math.max(...[check.startedAt, check.completedAt].map((time) => Date.parse(time) || 0));

export function latestChecks(rollup) {
    const latest = new Map();
    for (const check of rollup ?? []) {
        const seen = latest.get(checkName(check));
        if (!seen || checkTime(check) >= checkTime(seen)) latest.set(checkName(check), check);
    }
    return [...latest.values()];
}

function checkResult(check) {
    if (check.state !== undefined) return check.state;
    return check.status === 'COMPLETED' ? check.conclusion : check.status;
}

export function failingChecks(rollup) {
    return latestChecks(rollup)
        .filter((check) => !PASSING_CONCLUSIONS.includes(checkResult(check)))
        .map((check) => `${checkName(check)} (${checkResult(check)})`)
        .sort();
}

// Each reviewer's latest non-comment review, when it is an approval.
export function currentApprovals(reviews) {
    const latest = new Map();
    const submitted = reviews
        .filter((review) => !NEUTRAL_REVIEW_STATES.includes(review.state))
        .sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at));
    for (const review of submitted) latest.set(review.user.login, review);
    return [...latest.values()].filter((review) => review.state === 'APPROVED');
}

// An approval counts when the commit it approved has the same diff against main as the head.
export function countApprovals({ reviews, headPatchId, patchIds }) {
    if (!headPatchId) return 0;
    return currentApprovals(reviews).filter((review) => patchIds[review.commit_id] === headPatchId).length;
}

// `load` returns the data that needs a request, so a PR is only loaded as far as the first failing rule.
export function skipReason(pr, load) {
    if (pr.isDraft) return 'draft';
    const blocking = pr.labels.find((label) => BLOCKING_LABELS.includes(label.name.toLowerCase()));
    if (blocking) return `labeled "${blocking.name}"`;
    if (pr.changedFiles >= MAX_CHANGED_FILES) return `${pr.changedFiles} changed files (limit is ${MAX_CHANGED_FILES - 1})`;
    const restricted = restrictedPath(load.files());
    if (restricted) return `touches ${restricted}`;
    const failing = failingChecks(pr.statusCheckRollup);
    if (failing.length) return `checks not passing: ${failing.join(', ')}`;
    if (pr.mergeStateStatus !== 'CLEAN') return `merge state is ${pr.mergeStateStatus}`;
    const approvals = countApprovals(load.approvals());
    if (approvals < MIN_APPROVALS) return `${approvals} of ${MIN_APPROVALS} approvals apply to the current code`;
    return null;
}

export function commentBody(reason) {
    return `${MARKER}\nNot auto-merged yet: ${reason}`;
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

function git(...args) {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

// Same value for two commits that make the same change to main, whatever main looks like around it.
function patchId(sha) {
    const base = git('merge-base', 'origin/main', sha).trim();
    const diff = git('diff', base, sha);
    return execFileSync('git', ['patch-id', '--stable'], { encoding: 'utf8', input: diff }).split(' ')[0] || null;
}

function tryPatchId(ref, sha) {
    try {
        git('fetch', 'origin', ref);
        return patchId(sha);
    } catch {
        return null;
    }
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

function loaders(repo, pr) {
    return {
        files: once(() => ghPaginate(`repos/${repo}/pulls/${pr.number}/files`)),
        approvals: once(() => {
            const reviews = ghPaginate(`repos/${repo}/pulls/${pr.number}/reviews`);
            const headPatchId = tryPatchId(`refs/pull/${pr.number}/head`, pr.headRefOid);
            const commits = [...new Set(currentApprovals(reviews).map((review) => review.commit_id))];
            const patchIds = Object.fromEntries(commits.map((sha) => [sha, tryPatchId(sha, sha)]));
            return { reviews, headPatchId, patchIds };
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
function dispatchPurge(repo, number) {
    const { mergeCommit } = JSON.parse(gh('pr', 'view', String(number), '--repo', repo, '--json', 'mergeCommit'));
    const parent = gh('api', `repos/${repo}/commits/${mergeCommit.oid}`, '--jq', '.parents[0].sha').trim();
    gh('workflow', 'run', 'studio-akamai-purge.yaml', '--repo', repo, '-f', `before_sha=${parent}`);
}

function merge(repo, pr, files) {
    gh('pr', 'merge', String(pr.number), '--repo', repo, '--squash', '--match-head-commit', pr.headRefOid);
    if (!touchesStudio(files)) return 'merged';
    try {
        dispatchPurge(repo, pr.number);
        return 'merged, Akamai purge dispatched';
    } catch (error) {
        return `merged, Akamai purge dispatch failed: ${error.message}`;
    }
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
    return { outcome: merge(repo, pr, load.files()), merged: true };
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
            'number,isDraft,labels,headRefOid,changedFiles,mergeStateStatus,statusCheckRollup',
        ),
    );
    const rows = [];
    let mergedNumber = null;
    for (const pr of selectCandidates(prs)) {
        if (mergedNumber) {
            rows.push({ number: pr.number, outcome: `not evaluated: #${mergedNumber} merged first` });
            continue;
        }
        try {
            const { outcome, merged } = handle(repo, pr, dryRun);
            rows.push({ number: pr.number, outcome });
            if (merged) mergedNumber = pr.number;
        } catch (error) {
            rows.push({ number: pr.number, outcome: `error: ${error.message}` });
        }
    }
    const table = rows.length ? summaryTable(rows) : `No open PR is labeled "${LABEL}".`;
    console.log(table);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${table}\n`);
}

const isDirectRun = process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url));
if (isDirectRun) {
    main();
}
