import { pathToFileURL } from 'node:url';

const activeStatuses = ['queued', 'pending', 'waiting', 'in_progress'];
const PER_PAGE = 100;

function workspaceKey(login) {
    if (!login) throw new Error('Unable to resolve workspace identity.');
    // Match the resolver's [bot] removal and lowercased Vault lookup; concurrency groups ignore case.
    return login.replace(/\[bot\]$/i, '').toLowerCase();
}

function isCompetingRun(run, currentRunId) {
    return String(run.id) !== String(currentRunId) && activeStatuses.includes(run.status);
}

export function findWorkspaceConflict(runs, currentRunId, vaultLogin) {
    const key = workspaceKey(vaultLogin);
    return runs.find((run) => isCompetingRun(run, currentRunId) && workspaceKey(run.workspaceLogin) === key) ?? null;
}

export async function checkWorkspaceAvailability({ repository, runId, vaultLogin, token, fetchImpl = fetch }) {
    if (!repository || !runId || !token) throw new Error('Repository, current run ID and GitHub token are required.');
    const key = workspaceKey(vaultLogin);
    const base = `https://api.github.com/repos/${repository}`;

    async function get(path) {
        let response;
        try {
            response = await fetchImpl(`${base}${path}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            });
        } catch {
            throw new Error(`GitHub API request failed: ${path}`);
        }
        if (!response.ok) throw new Error(`GitHub API ${response.status}: ${path}`);
        try {
            return await response.json();
        } catch {
            throw new Error(`GitHub API returned invalid JSON: ${path}`);
        }
    }

    async function* paginate(path, query, pick) {
        for (let page = 1; ; page++) {
            const items = pick(await get(`${path}?${new URLSearchParams({ ...query, per_page: PER_PAGE, page })}`));
            yield* items;
            if (items.length < PER_PAGE) return;
        }
    }

    async function prIdentity(run) {
        let pulls = run.pull_requests ?? [];
        // GitHub can omit pull_requests on run records, particularly for fork PRs.
        if (!pulls.length) {
            if (!run.head_sha || !run.head_branch || !run.head_repository?.full_name) {
                throw new Error(`Unable to resolve PR identity for run ${run.id}.`);
            }
            const commitPulls = await Array.fromAsync(paginate(`/commits/${run.head_sha}/pulls`, {}, (batch) => batch));
            pulls = commitPulls.filter(
                (pull) =>
                    pull.head.ref === run.head_branch &&
                    pull.head.repo?.full_name === run.head_repository.full_name &&
                    pull.base.repo.full_name === repository,
            );
        }
        if (pulls.length !== 1 || !pulls[0].number) {
            throw new Error(`Unable to resolve a unique PR identity for run ${run.id}.`);
        }
        const prNumber = pulls[0].number;
        const pull = await get(`/pulls/${prNumber}`);
        if (!pull.user?.login) throw new Error(`Unable to resolve author identity for PR #${prNumber}, run ${run.id}.`);
        return { workspaceLogin: pull.user.login, prNumber };
    }

    const identityResolvers = {
        'io-studio-candidate.yaml': async (run) => ({ workspaceLogin: run.actor?.login }),
        'io-studio-pr.yaml': prIdentity,
    };

    for (const [workflow, resolveIdentity] of Object.entries(identityResolvers)) {
        for (const status of activeStatuses) {
            const runs = paginate(`/actions/workflows/${workflow}/runs`, { status }, (result) => {
                if (!Array.isArray(result.workflow_runs)) throw new Error(`GitHub API returned no run list for ${workflow}.`);
                return result.workflow_runs;
            });
            for await (const run of runs) {
                if (!isCompetingRun(run, runId)) continue;
                const conflict = findWorkspaceConflict([{ ...run, ...(await resolveIdentity(run)) }], runId, key);
                if (conflict) {
                    const pr = conflict.prNumber ? `PR #${conflict.prNumber}, ` : '';
                    throw new Error(
                        `Workspace '${key}' is busy: ${pr}run ${conflict.id} (${conflict.status}), ` +
                            `${conflict.html_url}. Retry after that run finishes.`,
                    );
                }
            }
        }
    }
    return null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        await checkWorkspaceAvailability({
            repository: process.env.GITHUB_REPOSITORY,
            runId: process.env.GITHUB_RUN_ID,
            vaultLogin: process.env.VAULT_LOGIN,
            token: process.env.GH_TOKEN,
        });
        console.log('No known active run for this workspace; this preflight is advisory, not a reservation.');
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
