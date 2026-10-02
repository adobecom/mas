// Consolidates every open Dependabot PR on adobecom/mas into a single PR so QA only
// has to regression-test one change. Requires the `gh` CLI authenticated with a
// token that has `pull-requests: write` (and `contents: write` to push the branch).
//
// Usage:
//   node .github/scripts/consolidate-dependabot-prs.mjs --ticket MWPW-123456
//   node .github/scripts/consolidate-dependabot-prs.mjs --ticket MWPW-123456 --execute
//     # creates the consolidated PR, then comments on and closes each original Dependabot PR.

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

export function createBranchName(ticket, timestamp = Date.now()) {
    if (!/^MWPW-\d{6}$/.test(ticket ?? '')) {
        throw new Error('Ticket must use the MWPW-XXXXXX format, for example MWPW-123456.');
    }
    return `${ticket}-consolidate-dependabot-${timestamp}`;
}

export function buildConsolidatedBody(prs, { branch, consolidatedPrUrl, changedPaths = [] } = {}) {
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
        const edsBranch = branch.toLowerCase();
        qaLines.push('## Test URLs');
        qaLines.push(`- EDS page: https://${edsBranch}--mas--adobecom.aem.page/`);
        qaLines.push(`- EDS live: https://${edsBranch}--mas--adobecom.aem.live/`);
        if (changedPaths.some((path) => /^(studio|io\/studio)\//.test(path))) {
            qaLines.push(`- Studio: https://${edsBranch}--mas--adobecom.aem.live/studio.html?martech=off`);
        }
        if (changedPaths.some((path) => path.startsWith('web-components/'))) {
            qaLines.push(
                `- Web components: https://${edsBranch}--mas--adobecom.aem.page/web-components/docs/merch-card.html?martech=off`,
            );
        }
        if (changedPaths.some((path) => path.startsWith('io/www/'))) {
            const masIoUrl = 'https://14257-merchatscale-dev.adobeioruntime.net/api/v1/web/MerchAtScale';
            qaLines.push(
                `- io/www: https://www.adobe.com/products/indesign/plans.html?mas-io-url=${encodeURIComponent(masIoUrl)}`,
            );
            qaLines.push(
                `- io/www: https://www.adobe.com/kr/creativecloud/plans.html?mas-io-url=${encodeURIComponent(masIoUrl)}`,
            );
        }
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

export function resolveRemote({ repo = REPO, run = runCommand } = {}) {
    const repoRe = new RegExp(`github\\.com[:/]${repo.replace('/', '\\/')}(\\.git)?$`, 'i');
    for (const line of run('git', ['remote', '-v']).split('\n')) {
        const [name, url] = line.split(/\s+/);
        if (url && repoRe.test(url)) return name;
    }
    throw new Error(`No git remote points to ${repo}. Add one with: git remote add upstream git@github.com:${repo}.git`);
}

export function createConsolidationBranch({ name, remote, run = runCommand }) {
    run('git', ['fetch', remote, 'main']);
    run('git', ['checkout', '-B', name, `${remote}/main`]);
}

export function mergePrHead({ number, remote, run = runCommand }) {
    run('git', ['fetch', remote, `pull/${number}/head`]);
    try {
        run('git', ['merge', '--no-edit', 'FETCH_HEAD']);
    } catch (error) {
        throw new Error(`Merge conflict bringing in PR #${number}: ${error.message}`);
    }
}

export function getChangedManifestPaths({ remote, run = runCommand } = {}) {
    const stdout = run('git', ['diff', '--name-only', `${remote}/main...HEAD`]);
    return stdout.split('\n').filter(Boolean);
}

export function createConsolidatedPr({ title, bodyFile, branch, repo = REPO, run = runCommand }) {
    return run('gh', [
        'pr',
        'create',
        '--repo',
        repo,
        '--base',
        'main',
        '--head',
        branch,
        '--title',
        title,
        '--body-file',
        bodyFile,
    ]).trim();
}

export function closeOriginalPr({ number, consolidatedPrUrl, repo = REPO, run = runCommand }) {
    run('gh', ['pr', 'comment', String(number), '--repo', repo, '--body', `Consolidated into ${consolidatedPrUrl}`]);
    run('gh', ['pr', 'close', String(number), '--repo', repo]);
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
    branch,
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

    if (!/^MWPW-\d{6}-/.test(branch ?? '')) {
        throw new Error('Consolidation branch must start with the MWPW-XXXXXX ticket format.');
    }

    const remote = resolveRemote({ repo, run });
    createConsolidationBranch({ name: branch, remote, run });
    for (const pr of prs) mergePrHead({ number: pr.number, remote, run });

    const changedPaths = getChangedManifestPaths({ remote, run });
    assertOnlyManifestPaths(changedPaths);
    run('git', ['push', '-u', remote, branch]);

    const bodyFile = writeTempBodyFile(buildConsolidatedBody(prs, { branch, changedPaths }));
    const consolidatedPrUrl = createConsolidatedPr({
        title: `chore(deps): consolidate ${prs.length} Dependabot update(s)`,
        bodyFile,
        branch,
        repo,
        run,
    });

    const finalBody = buildConsolidatedBody(prs, { branch, consolidatedPrUrl, changedPaths });
    run('gh', ['pr', 'edit', consolidatedPrUrl, '--repo', repo, '--body', finalBody]);

    for (const pr of prs) closeOriginalPr({ number: pr.number, consolidatedPrUrl, repo, run });

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
    const ticketIndex = process.argv.indexOf('--ticket');
    const ticket = ticketIndex === -1 ? null : process.argv[ticketIndex + 1];
    const execute = process.argv.includes('--execute');
    if (!ticket) {
        console.error('Usage: node consolidate-dependabot-prs.mjs --ticket MWPW-XXXXXX [--execute]');
        process.exit(1);
    }
    let branch;
    try {
        branch = createBranchName(ticket);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
    const result = consolidate({ execute, branch });
    if (execute && result.executed) {
        console.log(`\nConsolidated PR created: ${result.consolidatedPrUrl}`);
    }
}

const isDirectRun = process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url));
if (isDirectRun) {
    main();
}
