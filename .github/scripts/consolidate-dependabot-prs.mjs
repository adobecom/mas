// Consolidates every open Dependabot PR on adobecom/mas into a single PR so QA only
// has to regression-test one change. Requires the `gh` CLI authenticated with a
// token that has `pull-requests: write` (and `contents: write` to push the branch).
//
// Usage:
//   node .github/scripts/consolidate-dependabot-prs.mjs             # dry run (default)
//   node .github/scripts/consolidate-dependabot-prs.mjs --execute   # creates the
//     consolidated PR, then comments on and closes each original Dependabot PR.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO = 'adobecom/mas';

const TITLE_RE = /bump\s+(\S+)\s+from\s+(\S+)\s+to\s+(\S+)/i;
const CHANGELOG_LINK_RE = /\[(?:Release notes|Changelog|Commits)\]\((https?:\/\/[^)\s]+)\)/i;
const MANIFEST_PATH_RE = /(^|\/)(package\.json|package-lock\.json)$/;

export function runCommand(cmd, args, options = {}) {
    return execFileSync(cmd, args, { encoding: 'utf8', ...options });
}

function isDependabotAuthor(author) {
    return /dependabot/i.test(author?.login ?? '');
}

export function listOpenDependabotPrs({ repo = REPO, run = runCommand } = {}) {
    const stdout = run('gh', [
        'pr',
        'list',
        '--repo',
        repo,
        '--state',
        'open',
        '--limit',
        '100',
        '--json',
        'number,title,headRefName,url,author,body',
    ]);
    const prs = JSON.parse(stdout);
    return prs.filter((pr) => isDependabotAuthor(pr.author));
}

export function parseDependabotTitle(title) {
    const match = TITLE_RE.exec(title ?? '');
    if (!match) return null;
    const [, name, from, to] = match;
    return { name, from, to };
}

export function extractChangelogLink(body) {
    const match = CHANGELOG_LINK_RE.exec(body ?? '');
    return match ? match[1] : null;
}

export function buildConsolidatedBody(prs, { branch, consolidatedPrUrl } = {}) {
    const rows = prs.map((pr) => {
        const parsed = parseDependabotTitle(pr.title) ?? { name: pr.title, from: '—', to: '—' };
        const changelog = extractChangelogLink(pr.body) ?? pr.url;
        return `| ${parsed.name} | ${parsed.from} | ${parsed.to} | [#${pr.number}](${pr.url}) | [Notes](${changelog}) |`;
    });

    const header = ['| Dependency | From | To | Original PR | Changelog |', '| --- | --- | --- | --- | --- |'];
    const table = [...header, ...rows].join('\n');

    const qaLines = ['## QA / Regression', ''];
    if (consolidatedPrUrl) {
        qaLines.push(`- Diff: ${consolidatedPrUrl}/files`);
        qaLines.push(`- Checks: ${consolidatedPrUrl}/checks`);
    } else {
        qaLines.push(`- Diff: https://github.com/${REPO}/compare/main...${branch}`);
        qaLines.push(`- Checks: https://github.com/${REPO}/actions?query=branch%3A${branch}`);
    }
    if (branch) {
        qaLines.push(`- Preview: https://${branch}--mas--adobecom.aem.page/`);
        qaLines.push('- Live (after merge): https://main--mas--adobecom.aem.live/');
    } else {
        qaLines.push('- Only diff and CI links are available for this change; no preview branch was created.');
    }
    qaLines.push('- QA Checklist: https://wiki.corp.adobe.com/display/adobedotcom/M@S+Engineering+QA+Use+Cases');

    return ['## Dependency updates', '', table, '', ...qaLines].join('\n');
}

export function assertOnlyManifestPaths(changedPaths) {
    for (const path of changedPaths) {
        if (!MANIFEST_PATH_RE.test(path)) {
            throw new Error(`Consolidated branch touches a non-manifest path: ${path}`);
        }
    }
    return true;
}

export function createConsolidationBranch({ name, run = runCommand }) {
    run('git', ['fetch', 'origin', 'main']);
    run('git', ['checkout', '-B', name, 'origin/main']);
}

export function mergePrHead({ number, run = runCommand }) {
    run('git', ['fetch', 'origin', `pull/${number}/head`]);
    try {
        run('git', ['merge', '--no-edit', 'FETCH_HEAD']);
    } catch (error) {
        throw new Error(`Merge conflict bringing in PR #${number}: ${error.message}`);
    }
}

export function getChangedManifestPaths({ run = runCommand } = {}) {
    const stdout = run('git', ['diff', '--name-only', 'origin/main...HEAD']);
    return stdout.split('\n').filter(Boolean);
}

export function createConsolidatedPr({ title, bodyFile, run = runCommand }) {
    return run('gh', ['pr', 'create', '--title', title, '--body-file', bodyFile]).trim();
}

export function closeOriginalPr({ number, consolidatedPrUrl, run = runCommand }) {
    run('gh', ['pr', 'comment', String(number), '--body', `Consolidated into ${consolidatedPrUrl}`]);
    run('gh', ['pr', 'close', String(number)]);
}

function writeTempBodyFile(body) {
    const dir = mkdtempSync(join(tmpdir(), 'consolidate-dependabot-'));
    const file = join(dir, 'body.md');
    writeFileSync(file, body, 'utf8');
    return file;
}

export function consolidate({
    execute = false,
    run = runCommand,
    repo = REPO,
    branch = `consolidate-dependabot-${Date.now()}`,
    listPrs = listOpenDependabotPrs,
    log = console.log,
} = {}) {
    const prs = listPrs({ repo, run });

    if (prs.length === 0) {
        log(`No open Dependabot PRs found on ${repo}. Dependency updates here are configured through Renovate.`);
        return { prs: [], executed: false };
    }

    log(`Found ${prs.length} open Dependabot PR(s) on ${repo}:`);
    for (const pr of prs) log(`  #${pr.number} ${pr.title} (${pr.url})`);

    if (!execute) {
        const body = buildConsolidatedBody(prs, { branch });
        log('\nDry run: no branch, PR, comment or close will be created.');
        log('\nPlanned consolidated PR description:\n');
        log(body);
        return { prs, executed: false, body };
    }

    createConsolidationBranch({ name: branch, run });
    for (const pr of prs) mergePrHead({ number: pr.number, run });

    const changedPaths = getChangedManifestPaths({ run });
    assertOnlyManifestPaths(changedPaths);

    const bodyFile = writeTempBodyFile(buildConsolidatedBody(prs, { branch }));
    const consolidatedPrUrl = createConsolidatedPr({
        title: `chore(deps): consolidate ${prs.length} Dependabot update(s)`,
        bodyFile,
        run,
    });

    const finalBody = buildConsolidatedBody(prs, { branch, consolidatedPrUrl });
    run('gh', ['pr', 'edit', consolidatedPrUrl, '--body', finalBody]);

    for (const pr of prs) closeOriginalPr({ number: pr.number, consolidatedPrUrl, run });

    return { prs, executed: true, consolidatedPrUrl };
}

function checkGhAvailable() {
    try {
        runCommand('gh', ['--version']);
    } catch {
        console.error('The gh CLI is required. Install it and run `gh auth login` with pull-requests:write scope.');
        process.exit(1);
    }
}

function main() {
    checkGhAvailable();
    const execute = process.argv.includes('--execute');
    const result = consolidate({ execute });
    if (execute && result.executed) {
        console.log(`\nConsolidated PR created: ${result.consolidatedPrUrl}`);
    }
}

const isDirectRun = process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url));
if (isDirectRun) {
    main();
}
