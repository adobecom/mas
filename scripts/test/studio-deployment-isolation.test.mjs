import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { load } from 'js-yaml';
import appConfig from '@adobe/aio-cli-lib-app-config';
import { getDeploymentActions } from '../../io/studio/scripts/deploy-actions.mjs';

const manifest = await appConfig.coalesce(new URL('../../io/studio/app.config.yaml', import.meta.url).pathname);

test('core deployment excludes AI actions but retains existing OST actions', () => {
    const actions = getDeploymentActions(manifest.config, 'core');
    assert.equal(actions.includes('MerchAtScaleStudio/ost-products-read'), true);
    assert.equal(actions.includes('MerchAtScaleStudio/ost-products-write'), true);
    assert.equal(actions.includes('MerchAtScaleStudio/ai-chat'), false);
});

test('assistant deployment includes only AI actions', () => {
    assert.deepEqual(getDeploymentActions(manifest.config, 'assistant'), ['MerchAtScaleStudio/ai-chat']);
});

test('deployment groups cover every action without overlap', () => {
    const core = getDeploymentActions(manifest.config, 'core');
    const assistant = getDeploymentActions(manifest.config, 'assistant');
    const total = Object.values(manifest.config.application.runtimeManifest.packages).reduce(
        (count, pkg) => count + Object.keys(pkg.actions).length,
        0,
    );
    assert.equal(new Set([...core, ...assistant]).size, total);
    assert.equal(
        core.some((action) => assistant.includes(action)),
        false,
    );
});

test('unknown deployment groups fail closed', () => {
    assert.throws(() => getDeploymentActions(manifest.config, 'all'), /Unknown deployment group/);
});

test('AI secret retrieval is separate from required core secrets', async () => {
    const workflow = await readFile(new URL('../../.github/workflows/io-studio-deploy.yaml', import.meta.url), 'utf8');
    assert.equal(/env-fields: aos_url,aos_api_key,ost_write_api_key\s*\n/.test(workflow), true);
    assert.equal(workflow.includes('run: node scripts/deploy-actions.mjs core'), true);
    assert.equal(workflow.includes('run: node scripts/deploy-actions.mjs assistant'), true);
});

test('Studio NALA reads namespace metadata once without fetching workspace secrets', async () => {
    const workflow = load(await readFile(new URL('../../.github/workflows/run-nala.yml', import.meta.url), 'utf8'));
    const preparation = workflow.jobs['prepare-studio-runtime'];
    assert.equal(
        preparation.steps.some((step) => step.uses === 'actions/download-artifact@v4'),
        true,
    );
    assert.equal(
        preparation.steps.some((step) => step.uses?.includes('vault-secrets')),
        false,
    );
    const studio = workflow.jobs['run-nala-studio-tests'];
    assert.equal(studio.needs.includes('prepare-studio-runtime'), true);
    assert.equal(studio.steps.find((step) => step.uses === 'actions/checkout@v4').with['fetch-depth'], 2);
    assert.equal(
        studio.steps.some((step) => step.uses?.includes('vault-secrets')),
        false,
    );
    const deploy = load(await readFile(new URL('../../.github/workflows/io-studio-deploy.yaml', import.meta.url), 'utf8'));
    assert.equal(
        deploy.jobs.deploy.steps.find((step) => step.uses === 'actions/upload-artifact@v4').with.name,
        'studio-runtime',
    );
});

test('Studio NALA workspace selection preserves existing query overrides', async () => {
    const workflow = load(await readFile(new URL('../../.github/workflows/run-nala.yml', import.meta.url), 'utf8'));
    const selection = workflow.jobs['run-nala-studio-tests'].steps.find(
        (step) => step.name === 'Select the deployed Studio workspace',
    );
    const directory = await mkdtemp(join(tmpdir(), 'nala-studio-workspace-'));
    try {
        execFileSync('bash', ['-e', '-c', selection.run], {
            env: {
                ...process.env,
                RUNNER_TEMP: directory,
                GITHUB_ENV: join(directory, 'github-env'),
                STUDIO_ENV: 'reviewer',
                MILO_LIBS: '?milolibs=local&aem.env=stage&io.studio.env=old',
            },
        });
        const value = await readFile(join(directory, 'github-env'), 'utf8');
        const params = new URLSearchParams(value.trim().slice('MILO_LIBS='.length));
        assert.equal(params.get('milolibs'), 'local');
        assert.equal(params.get('aem.env'), 'stage');
        assert.deepEqual(params.getAll('io.studio.env'), ['reviewer']);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

for (const namespace of ['14257-masstudio-reviewer', 'unrelated-workspace']) {
    test(`Studio NALA validates namespace metadata: ${namespace}`, async () => {
        const workflow = load(await readFile(new URL('../../.github/workflows/run-nala.yml', import.meta.url), 'utf8'));
        const selection = workflow.jobs['prepare-studio-runtime'].steps.find((step) => step.name === 'Read Studio namespace');
        const directory = await mkdtemp(join(tmpdir(), 'nala-studio-workspace-'));
        try {
            await mkdir(join(directory, 'studio-runtime'));
            await writeFile(join(directory, 'studio-runtime', 'studio-namespace.txt'), `${namespace}\n`);
            const select = () =>
                execFileSync('bash', ['-e', '-c', selection.run], {
                    env: { ...process.env, RUNNER_TEMP: directory, GITHUB_OUTPUT: join(directory, 'github-output') },
                    stdio: 'pipe',
                });
            if (namespace === 'unrelated-workspace') {
                assert.throws(select, /no valid Studio runtime namespace/);
            } else {
                select();
                assert.equal(await readFile(join(directory, 'github-output'), 'utf8'), 'environment=reviewer\n');
            }
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
}

for (const conclusion of ['success', 'failure']) {
    test(`Studio NALA waits for the matching deployment and handles ${conclusion}`, async () => {
        const workflow = load(await readFile(new URL('../../.github/workflows/run-nala.yml', import.meta.url), 'utf8'));
        const wait = workflow.jobs['prepare-studio-runtime'].steps.find((step) => step.id === 'deployment');
        const execute = new (Object.getPrototypeOf(async () => {}).constructor)(
            'github',
            'context',
            'core',
            'process',
            'setTimeout',
            wait.with.script,
        );
        let calls = 0;
        const output = {};
        const github = {
            rest: {
                actions: {
                    listWorkflowRuns: async (params) => {
                        assert.equal(params.head_sha, 'current-sha');
                        assert.equal(params.event, 'pull_request');
                        assert.equal(params.branch, 'feature');
                        calls++;
                        return {
                            data: {
                                workflow_runs:
                                    calls === 1
                                        ? []
                                        : [
                                              { id: 1, head_sha: 'stale-sha', status: 'completed', conclusion: 'success' },
                                              {
                                                  id: 2,
                                                  head_sha: 'current-sha',
                                                  status: 'completed',
                                                  conclusion,
                                                  html_url: 'https://example.test/run/2',
                                              },
                                          ],
                            },
                        };
                    },
                },
            },
        };
        const run = execute(
            github,
            { repo: {}, payload: { pull_request: { head: { ref: 'feature' } } } },
            {
                setOutput: (key, value) => {
                    output[key] = value;
                },
            },
            { env: { HEAD_SHA: 'current-sha' } },
            (resolve) => resolve(),
        );
        if (conclusion === 'failure') await assert.rejects(run, /Studio deployment failed/);
        else {
            await run;
            assert.equal(output['run-id'], 2);
        }
        assert.equal(calls, 2);
    });
}
