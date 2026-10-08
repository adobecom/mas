import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
    assertOnlyManifestPaths,
    buildConsolidatedBody,
    consolidate,
    createBranchName,
    extractChangelogLink,
    mergePrHead,
    mergeRows,
    parseConsolidatedRows,
    parseDependabotTitle,
} from './consolidate-dependabot-prs.mjs';

test('createBranchName uses the MWPW ticket as the consolidation branch', () => {
    assert.equal(createBranchName('MWPW-123456'), 'MWPW-123456');
});

test('createBranchName rejects ticket IDs outside the MWPW-XXXXXX format', () => {
    assert.throws(() => createBranchName('MWPW-12345'), {
        message: /MWPW-XXXXXX/,
    });
});

test('parseDependabotTitle parses the plain "Bump X from A to B" form', () => {
    assert.deepEqual(parseDependabotTitle('Bump lodash from 4.17.20 to 4.17.21'), {
        name: 'lodash',
        from: '4.17.20',
        to: '4.17.21',
    });
});

test('parseDependabotTitle parses the conventional-commit form with a scoped package', () => {
    assert.deepEqual(parseDependabotTitle('chore(deps): bump @scope/x from 1.0.0 to 2.0.0'), {
        name: '@scope/x',
        from: '1.0.0',
        to: '2.0.0',
    });
});

test('parseDependabotTitle parses a major bump', () => {
    assert.deepEqual(parseDependabotTitle('Bump express from 4.18.2 to 5.0.0'), {
        name: 'express',
        from: '4.18.2',
        to: '5.0.0',
    });
});

test('parseDependabotTitle returns null for titles it does not recognize', () => {
    assert.equal(parseDependabotTitle('Bump the eslint group with 2 updates'), null);
});

test('extractChangelogLink returns the release notes URL when present', () => {
    const body = 'Sourced from [Release notes](https://github.com/lodash/lodash/releases) for lodash.';
    assert.equal(extractChangelogLink(body), 'https://github.com/lodash/lodash/releases');
});

test('extractChangelogLink returns null when no changelog link is present', () => {
    assert.equal(extractChangelogLink('Bumps lodash from 4.17.20 to 4.17.21.'), null);
});

const samplePrs = [
    {
        number: 101,
        title: 'Bump lodash from 4.17.20 to 4.17.21',
        url: 'https://github.com/adobecom/mas/pull/101',
        body: 'Sourced from [Release notes](https://github.com/lodash/lodash/releases).',
    },
    {
        number: 102,
        title: 'chore(deps): bump express from 4.18.2 to 5.0.0',
        url: 'https://github.com/adobecom/mas/pull/102',
        body: 'Bumps express from 4.18.2 to 5.0.0.',
    },
];

test('buildConsolidatedBody emits one table row per PR with changelog fallback to the PR link', () => {
    const body = buildConsolidatedBody(samplePrs, { branch: 'consolidate-dependabot-1' });

    assert.match(
        body,
        /\| lodash \| 4\.17\.20 \| 4\.17\.21 \| \[#101\]\(https:\/\/github\.com\/adobecom\/mas\/pull\/101\) \| \[Notes\]\(https:\/\/github\.com\/lodash\/lodash\/releases\) \|/,
    );
    assert.match(
        body,
        /\| express \| 4\.18\.2 \| 5\.0\.0 \| \[#102\]\(https:\/\/github\.com\/adobecom\/mas\/pull\/102\) \| \[Notes\]\(https:\/\/github\.com\/adobecom\/mas\/pull\/102\) \|/,
    );
});

test('buildConsolidatedBody includes diff, checks and preview links for a branch', () => {
    const branch = 'MWPW-123456-consolidate-dependabot-1';
    const body = buildConsolidatedBody(samplePrs, { branch });

    assert.match(body, /Diff: https:\/\/github\.com\/adobecom\/mas\/compare\/main\.\.\.MWPW-123456-consolidate-dependabot-1/);
    assert.match(
        body,
        /Checks: https:\/\/github\.com\/adobecom\/mas\/actions\?query=branch%3AMWPW-123456-consolidate-dependabot-1/,
    );
    assert.match(body, /EDS page: https:\/\/mwpw-123456-consolidate-dependabot-1--mas--adobecom\.aem\.page\//);
    assert.match(body, /EDS live: https:\/\/mwpw-123456-consolidate-dependabot-1--mas--adobecom\.aem\.live\//);
});

test('buildConsolidatedBody adds test links for affected project areas', () => {
    const body = buildConsolidatedBody(samplePrs, {
        branch: 'MWPW-123456-consolidate-dependabot-1',
        changedPaths: ['studio/package-lock.json', 'web-components/package.json', 'io/www/package.json'],
    });

    assert.match(body, /\/studio\.html\?martech=off/);
    assert.match(body, /\/web-components\/docs\/merch-card\.html\?martech=off/);
    assert.match(body, /mas-io-url=https%3A%2F%2F14257-merchatscale-dev\.adobeioruntime\.net%2Fapi%2Fv1%2Fweb%2FMerchAtScale/);
    assert.match(body, /www\.adobe\.com\/kr\/creativecloud\/plans\.html/);
});

test('buildConsolidatedBody uses the consolidated PR URL for diff/checks once it exists', () => {
    const body = buildConsolidatedBody(samplePrs, {
        branch: 'consolidate-dependabot-1',
        consolidatedPrUrl: 'https://github.com/adobecom/mas/pull/999',
    });

    assert.match(body, /Diff: https:\/\/github\.com\/adobecom\/mas\/pull\/999\/files/);
    assert.match(body, /Checks: https:\/\/github\.com\/adobecom\/mas\/pull\/999\/checks/);
});

test('buildConsolidatedBody falls back to a no-preview line when no branch is supplied', () => {
    const body = buildConsolidatedBody(samplePrs, { consolidatedPrUrl: 'https://github.com/adobecom/mas/pull/999' });

    assert.match(body, /Only diff and CI links are available for this change; no preview branch was created\./);
    assert.doesNotMatch(body, /aem\.page/);
});

test('assertOnlyManifestPaths passes for manifest and lockfile paths', () => {
    assert.doesNotThrow(() => assertOnlyManifestPaths(['package.json', 'web-components/package-lock.json']));
});

test('assertOnlyManifestPaths throws and names the offending path for a source file', () => {
    assert.throws(() => assertOnlyManifestPaths(['package.json', 'web-components/src/merch-card.js']), {
        message: /web-components\/src\/merch-card\.js/,
    });
});

function makeRecorder(responder) {
    const calls = [];
    function run(cmd, args) {
        calls.push([cmd, ...args]);
        return responder(cmd, args) ?? '';
    }
    run.calls = calls;
    return run;
}

const asDependabotAuthor = (pr) => ({ ...pr, author: { login: 'dependabot' } });

const isDependabotList = (cmd, args) => cmd === 'gh' && args[0] === 'pr' && args[1] === 'list' && !args.includes('--head');
const isConsolidatedLookup = (cmd, args) => cmd === 'gh' && args[0] === 'pr' && args[1] === 'list' && args.includes('--head');

function respondToPrList(prs) {
    return (cmd, args) => {
        if (isDependabotList(cmd, args)) return JSON.stringify(prs.map(asDependabotAuthor));
        if (isConsolidatedLookup(cmd, args)) return '[]';
        return '';
    };
}

function respondToExecute(prs, existingPrs = []) {
    return (cmd, args) => {
        if (isDependabotList(cmd, args)) return JSON.stringify(prs.map(asDependabotAuthor));
        if (isConsolidatedLookup(cmd, args)) return JSON.stringify(existingPrs);
        if (cmd === 'git' && args[0] === 'remote') {
            return 'origin\tgit@github.com:someone/mas.git (fetch)\nupstream\tgit@github.com:adobecom/mas.git (fetch)\n';
        }
        if (cmd === 'git' && args[0] === 'diff') return 'package.json\npackage-lock.json\n';
        if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'create') return 'https://github.com/adobecom/mas/pull/999\n';
        return '';
    };
}

test('consolidate in dry-run mode records no mutating command', () => {
    const run = makeRecorder(respondToPrList(samplePrs));

    const result = consolidate({ execute: false, run, branch: 'consolidate-dependabot-1', log: () => {} });

    assert.equal(result.executed, false);
    assert.equal(result.prs.length, 2);
    for (const call of run.calls) {
        assert.equal(call[0], 'gh');
        assert.equal(call[1], 'pr');
        assert.equal(call[2], 'list');
    }
});

test('consolidate in execute mode comments before closing each original PR and never merges one', () => {
    const run = makeRecorder(respondToExecute(samplePrs));

    const result = consolidate({ execute: true, run, branch: 'MWPW-123456-consolidate-dependabot-1', log: () => {} });

    assert.equal(result.executed, true);
    assert.equal(result.consolidatedPrUrl, 'https://github.com/adobecom/mas/pull/999');

    const ghPrCalls = run.calls.filter((call) => call[0] === 'gh' && call[1] === 'pr');
    const commentIndexFor = (number) => ghPrCalls.findIndex((call) => call[2] === 'comment' && call[3] === String(number));
    const closeIndexFor = (number) => ghPrCalls.findIndex((call) => call[2] === 'close' && call[3] === String(number));

    for (const pr of samplePrs) {
        const commentIndex = commentIndexFor(pr.number);
        const closeIndex = closeIndexFor(pr.number);
        assert.ok(commentIndex !== -1, `expected a comment call for PR #${pr.number}`);
        assert.ok(closeIndex !== -1, `expected a close call for PR #${pr.number}`);
        assert.ok(commentIndex < closeIndex, `expected comment before close for PR #${pr.number}`);
    }

    assert.ok(!ghPrCalls.some((call) => call[2] === 'merge'), 'expected no `gh pr merge` call on any original PR');
    assert.ok(
        run.calls.some(
            (call) => call[0] === 'git' && call[1] === 'fetch' && call[2] === 'upstream' && call[3] === 'pull/101/head',
        ),
        'expected PR heads to be fetched from the remote pointing to adobecom/mas',
    );
    assert.ok(
        ghPrCalls.every((call) => call.includes('--repo')),
        'expected every gh pr call to target the repo explicitly',
    );
});

test('consolidate refuses to create a branch without the required MWPW ticket prefix', () => {
    const run = makeRecorder(() => '');

    assert.throws(
        () =>
            consolidate({
                execute: true,
                run,
                branch: 'consolidate-dependabot-1',
                listPrs: () => samplePrs,
                log: () => {},
            }),
        { message: /MWPW-XXXXXX/ },
    );
    assert.equal(run.calls.length, 0);
});

test('consolidate reports no PRs to consolidate when none are open', () => {
    const run = makeRecorder(respondToPrList([]));

    const result = consolidate({ execute: false, run, log: () => {} });

    assert.equal(result.prs.length, 0);
    assert.equal(result.executed, false);
});

const existingBody = [
    '## Dependency updates',
    '',
    '| Dependency | From | To | Original PR | Changelog |',
    '| --- | --- | --- | --- | --- |',
    '| lodash | 4.17.19 | 4.17.20 | [#90](https://github.com/adobecom/mas/pull/90) | [Notes](https://example.com/lodash) |',
    '| postcss | 8.5.12 | 8.5.26 | [#91](https://github.com/adobecom/mas/pull/91) | [Notes](https://example.com/postcss) |',
    '',
    '## QA / Regression',
].join('\n');

test('parseConsolidatedRows reads back the dependency table of a consolidated PR', () => {
    assert.deepEqual(parseConsolidatedRows(existingBody), [
        {
            name: 'lodash',
            from: '4.17.19',
            to: '4.17.20',
            prLinks: '[#90](https://github.com/adobecom/mas/pull/90)',
            notes: '[Notes](https://example.com/lodash)',
        },
        {
            name: 'postcss',
            from: '8.5.12',
            to: '8.5.26',
            prLinks: '[#91](https://github.com/adobecom/mas/pull/91)',
            notes: '[Notes](https://example.com/postcss)',
        },
    ]);
    assert.deepEqual(parseConsolidatedRows(undefined), []);
});

test('mergeRows bumps an already consolidated dependency, appends new ones and ignores already listed PRs', () => {
    const rows = mergeRows(parseConsolidatedRows(existingBody), [
        ...samplePrs,
        { number: 91, title: 'Bump postcss from 8.5.12 to 8.5.26', url: 'https://github.com/adobecom/mas/pull/91' },
    ]);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
        name: 'lodash',
        from: '4.17.19',
        to: '4.17.21',
        prLinks: '[#90](https://github.com/adobecom/mas/pull/90), [#101](https://github.com/adobecom/mas/pull/101)',
        notes: '[Notes](https://github.com/lodash/lodash/releases)',
    });
    assert.equal(rows[1].prLinks, '[#91](https://github.com/adobecom/mas/pull/91)');
    assert.equal(rows[2].name, 'express');
});

test('consolidate re-run updates the open consolidated PR instead of creating a new one', () => {
    const branch = 'MWPW-123456';
    const existingPr = { number: 999, url: 'https://github.com/adobecom/mas/pull/999', body: existingBody };
    const run = makeRecorder(respondToExecute(samplePrs, [existingPr]));

    const result = consolidate({ execute: true, run, branch, log: () => {} });

    assert.equal(result.executed, true);
    assert.equal(result.updated, true);
    assert.equal(result.consolidatedPrUrl, existingPr.url);
    assert.ok(!run.calls.some((call) => call[0] === 'gh' && call[2] === 'create'), 'expected no new PR');

    const gitCalls = run.calls.filter((call) => call[0] === 'git').map((call) => call.slice(1).join(' '));
    const checkoutIndex = gitCalls.indexOf(`checkout -B ${branch} upstream/${branch}`);
    const mainMergeIndex = gitCalls.indexOf('merge --no-edit upstream/main');
    const prMergeIndex = gitCalls.indexOf('fetch upstream pull/101/head');
    assert.ok(checkoutIndex !== -1, 'expected the existing consolidated branch to be checked out');
    assert.ok(checkoutIndex < mainMergeIndex && mainMergeIndex < prMergeIndex, 'expected main merged before new PRs');

    const edit = run.calls.find((call) => call[0] === 'gh' && call[2] === 'edit');
    assert.equal(edit[3], existingPr.url);
    assert.equal(edit[edit.indexOf('--title') + 1], 'MWPW-123456 chore(deps): consolidate 3 Dependabot update(s)');
    const body = readFileSync(edit[edit.indexOf('--body-file') + 1], 'utf8');
    assert.match(body, /\| lodash \| 4\.17\.19 \| 4\.17\.21 \| \[#90\].*, \[#101\]/);
    assert.match(body, /\| postcss \| 8\.5\.12 \| 8\.5\.26 \| \[#91\]/);
    assert.match(body, /\| express \| 4\.18\.2 \| 5\.0\.0 \| \[#102\]/);
    assert.match(body, /Diff: https:\/\/github\.com\/adobecom\/mas\/pull\/999\/files/);

    for (const pr of samplePrs) {
        assert.ok(run.calls.some((call) => call[0] === 'gh' && call[2] === 'close' && call[3] === String(pr.number)));
    }
});

test('mergeRows keeps the same dependency bumped in different directories on separate rows', () => {
    const rows = mergeRows(
        [],
        [
            { number: 1, title: 'Bump axios from 1.19.0 to 1.20.0', url: 'https://github.com/adobecom/mas/pull/1' },
            { number: 2, title: 'Bump axios from 1.18.1 to 1.20.0 in /io/www', url: 'https://github.com/adobecom/mas/pull/2' },
        ],
    );

    assert.deepEqual(
        rows.map(({ name, from }) => [name, from]),
        [
            ['axios', '1.19.0'],
            ['axios (/io/www)', '1.18.1'],
        ],
    );
});

test('mergePrHead retries a conflicting merge preferring the Dependabot side on conflicting hunks', () => {
    const run = makeRecorder((cmd, args) => {
        if (cmd === 'git' && args[0] === 'merge' && !args.includes('-X') && args[1] !== '--abort') {
            throw new Error('CONFLICT (content): Merge conflict in package-lock.json');
        }
        return '';
    });

    mergePrHead({ number: 1372, remote: 'upstream', run, log: () => {} });

    assert.deepEqual(
        run.calls.map((call) => call.slice(1).join(' ')),
        [
            'fetch upstream pull/1372/head',
            'merge --no-edit FETCH_HEAD',
            'merge --abort',
            'merge --no-edit -X theirs FETCH_HEAD',
        ],
    );
});

test('mergePrHead reports the PR when even the retried merge fails', () => {
    const run = makeRecorder((cmd, args) => {
        if (cmd === 'git' && args[0] === 'merge' && args[1] !== '--abort') throw new Error('boom');
        return '';
    });

    assert.throws(() => mergePrHead({ number: 7, remote: 'upstream', run, log: () => {} }), {
        message: /Merge conflict bringing in PR #7/,
    });
});
