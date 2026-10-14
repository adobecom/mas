import assert from 'node:assert/strict';
import test from 'node:test';
import { checkWorkspaceAvailability, findWorkspaceConflict } from './check-io-studio-workspace.mjs';

const run = (id, status, login) => ({ id, status, workspaceLogin: login, html_url: `https://github.com/example/run/${id}` });

test('excludes the current run even when its workspace matches', () => {
    assert.equal(findWorkspaceConflict([run(10, 'in_progress', 'pinatacode[bot]')], '10', 'pinatacode'), null);
});

test('ignores a different workspace', () => {
    assert.equal(findWorkspaceConflict([run(11, 'in_progress', 'alice')], 10, 'bob'), null);
});

for (const status of ['queued', 'pending', 'waiting', 'in_progress']) {
    test(`rejects a ${status} run in the same normalized workspace`, () => {
        const conflict = run(11, status, 'Pinatacode[bot]');
        assert.equal(findWorkspaceConflict([conflict], 10, 'pinatacode'), conflict);
    });
}

test('ignores a completed run in the same workspace', () => {
    assert.equal(findWorkspaceConflict([run(11, 'completed', 'alice')], 10, 'alice'), null);
});

test('fails explicitly when a competing active run identity is missing', () => {
    assert.throws(() => findWorkspaceConflict([run(11, 'queued', '')], 10, 'alice'), /identity/i);
});

const options = {
    repository: 'example/mas',
    runId: '10',
    vaultLogin: 'pinatacode',
    token: 'test-token',
};

function apiFixture(handler) {
    return async (url, init) => {
        assert.equal(init.headers.Authorization, 'Bearer test-token');
        const data = handler(new URL(url));
        return { ok: true, status: 200, json: async () => data };
    };
}

const candidate = {
    id: 11,
    status: 'in_progress',
    actor: { login: 'pinatacode[bot]' },
    triggering_actor: { login: 'human' },
    html_url: 'https://github.com/example/mas/actions/runs/11',
};
const prRun = {
    id: 12,
    status: 'queued',
    actor: { login: 'maintainer' },
    pull_requests: [{ number: 42 }],
    html_url: 'https://github.com/example/mas/actions/runs/12',
};
const orphanPrRun = {
    ...prRun,
    pull_requests: [],
    head_sha: 'abc',
    head_branch: 'MWPW-123',
    head_repository: { full_name: 'example/mas' },
};

const runsOnly = (url, workflow, status, runs) => ({
    workflow_runs: url.pathname.endsWith(`${workflow}/runs`) && url.searchParams.get('status') === status ? runs : [],
});

test('candidate reruns use the original actor rather than the triggering actor', async () => {
    const fetchImpl = apiFixture((url) => runsOnly(url, 'io-studio-candidate.yaml', 'in_progress', [candidate]));
    await assert.rejects(checkWorkspaceAvailability({ ...options, fetchImpl }), /workspace.*pinatacode.*run.*11.*retry/i);
});

test('a bot PR conflicts with a bot candidate even when synchronized by a human', async () => {
    const fetchImpl = apiFixture((url) => {
        if (url.pathname.endsWith('/pulls/42')) return { user: { login: 'pinatacode[bot]' } };
        return runsOnly(url, 'io-studio-pr.yaml', 'queued', [prRun]);
    });
    await assert.rejects(checkWorkspaceAvailability({ ...options, fetchImpl }), /PR #42.*run.*12.*retry/i);
});

test('own run is excluded before PR identity lookup', async () => {
    const fetchImpl = apiFixture((url) => {
        assert.ok(!url.pathname.includes('/pulls/'));
        return { workflow_runs: [{ ...prRun, id: 10 }] };
    });
    assert.equal(await checkWorkspaceAvailability({ ...options, fetchImpl }), null);
});

test('different workspaces are available across both workflows', async () => {
    const fetchImpl = apiFixture((url) => {
        if (url.pathname.endsWith('/pulls/42')) return { user: { login: 'alice' } };
        if (url.pathname.endsWith('io-studio-pr.yaml/runs')) return runsOnly(url, 'io-studio-pr.yaml', 'queued', [prRun]);
        return { workflow_runs: [{ ...candidate, actor: { login: 'bob' } }] };
    });
    assert.equal(await checkWorkspaceAvailability({ ...options, fetchImpl }), null);
});

test('detects a conflict beyond the first API page', async () => {
    const fetchImpl = apiFixture((url) => {
        if (!url.pathname.endsWith('io-studio-candidate.yaml/runs') || url.searchParams.get('status') !== 'queued') {
            return { workflow_runs: [] };
        }
        if (url.searchParams.get('page') === '1') {
            return {
                workflow_runs: Array.from({ length: 100 }, (value, index) => ({
                    ...candidate,
                    id: 100 + index,
                    status: 'queued',
                    actor: { login: 'bob' },
                })),
            };
        }
        return { workflow_runs: [{ ...candidate, status: 'queued' }] };
    });
    await assert.rejects(checkWorkspaceAvailability({ ...options, fetchImpl }), /run.*11.*retry/i);
});

test('API permission failures cannot report an available workspace', async () => {
    const fetchImpl = async () => ({ ok: false, status: 403 });
    await assert.rejects(checkWorkspaceAvailability({ ...options, fetchImpl }), /GitHub API.*403/);
});

test('network errors cannot report an available workspace', async () => {
    const fetchImpl = async () => {
        throw new Error('network unavailable');
    };
    await assert.rejects(checkWorkspaceAvailability({ ...options, fetchImpl }), /GitHub API/);
});

test('PR author lookup errors cannot report an available workspace', async () => {
    const fetchImpl = apiFixture((url) => {
        if (url.pathname.endsWith('/pulls/42')) return { user: {} };
        return runsOnly(url, 'io-studio-pr.yaml', 'queued', [prRun]);
    });
    await assert.rejects(checkWorkspaceAvailability({ ...options, fetchImpl }), /identity/i);
});

test('missing PR associations are resolved from the commit rather than the run actor', async () => {
    const fetchImpl = apiFixture((url) => {
        if (url.pathname.endsWith('/commits/abc/pulls')) {
            return [
                {
                    number: 42,
                    head: { ref: 'MWPW-123', repo: { full_name: 'example/mas' } },
                    base: { repo: { full_name: 'example/mas' } },
                },
            ];
        }
        if (url.pathname.endsWith('/pulls/42')) return { user: { login: 'pinatacode[bot]' } };
        return runsOnly(url, 'io-studio-pr.yaml', 'queued', [orphanPrRun]);
    });
    await assert.rejects(checkWorkspaceAvailability({ ...options, fetchImpl }), /PR #42.*retry/i);
});

test('unresolvable PR identity fails rather than using the synchronizing actor', async () => {
    const fetchImpl = apiFixture((url) => {
        if (url.pathname.endsWith('/commits/abc/pulls')) return [];
        return runsOnly(url, 'io-studio-pr.yaml', 'queued', [orphanPrRun]);
    });
    await assert.rejects(checkWorkspaceAvailability({ ...options, fetchImpl }), /identity/i);
});
