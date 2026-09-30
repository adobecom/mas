import assert from 'node:assert/strict';
import test from 'node:test';

import {
    assertOnlyManifestPaths,
    buildConsolidatedBody,
    consolidate,
    extractChangelogLink,
    parseDependabotTitle,
} from './consolidate-dependabot-prs.mjs';

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
    const body = buildConsolidatedBody(samplePrs, { branch: 'consolidate-dependabot-1' });

    assert.match(body, /Diff: https:\/\/github\.com\/adobecom\/mas\/compare\/main\.\.\.consolidate-dependabot-1/);
    assert.match(body, /Checks: https:\/\/github\.com\/adobecom\/mas\/actions\?query=branch%3Aconsolidate-dependabot-1/);
    assert.match(body, /Preview: https:\/\/consolidate-dependabot-1--mas--adobecom\.aem\.page\//);
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

function respondToPrList(prs) {
    return (cmd, args) => {
        if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'list') {
            return JSON.stringify(prs.map(asDependabotAuthor));
        }
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
    const run = makeRecorder((cmd, args) => {
        if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'list') {
            return JSON.stringify(samplePrs.map(asDependabotAuthor));
        }
        if (cmd === 'git' && args[0] === 'diff') {
            return 'package.json\npackage-lock.json\n';
        }
        if (cmd === 'gh' && args[0] === 'pr' && args[1] === 'create') {
            return 'https://github.com/adobecom/mas/pull/999\n';
        }
        return '';
    });

    const result = consolidate({ execute: true, run, branch: 'consolidate-dependabot-1', log: () => {} });

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
});

test('consolidate reports no PRs to consolidate when none are open', () => {
    const run = makeRecorder(respondToPrList([]));

    const result = consolidate({ execute: false, run, log: () => {} });

    assert.equal(result.prs.length, 0);
    assert.equal(result.executed, false);
});
