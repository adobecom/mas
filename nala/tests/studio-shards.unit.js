import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';
import { STUDIO_SHARDS, selectStudioShard, studioShardTestMatch, studioTestFiles } from '../utils/studio-shards.js';

const fixtures = [
    'nala/studio/studio.test.js',
    'nala/studio/acom/plans/deep/tests/nested_save.test.js',
    'nala/studio/commerce/fries/tests/fries_gradient_border_save.test.js',
    'nala/studio/new-directory/deep/tests/new_save.test.js',
    'nala/studio/ost/nested/tests/authoring.test.js',
    'nala/studio/sandbox/brand/tests/css.test.js',
    'nala/studio/acom/plans/tests/css.test.js',
    'nala/studio/ahome/tests/edit.test.js',
    'nala/studio/ccd/tests/css.test.js',
    'nala/studio/commerce/tests/edit.test.js',
    'nala/studio/new-directory/nested/tests/new.test.js',
    'nala/studio/settings/settings.test.js',
    'nala/studio/commerce/tests/not-a-test.spec.js',
];

test('shards are sorted, complete and disjoint, including nested saves and future directories', () => {
    assert.deepEqual(
        selectStudioShard('saves', fixtures),
        [fixtures[1], fixtures[2], fixtures[3], fixtures[4], fixtures[5]].sort(),
    );
    assert.deepEqual(selectStudioShard('acom-ahome-ccd-commerce', fixtures), fixtures.slice(6, 10).sort());
    assert.deepEqual(selectStudioShard('rest', fixtures), [fixtures[0], fixtures[10], fixtures[11]].sort());
    const combined = STUDIO_SHARDS.flatMap((shard) => selectStudioShard(shard, fixtures));
    assert.equal(new Set(combined).size, combined.length);
    assert.deepEqual(combined.sort(), fixtures.filter((file) => file.endsWith('.test.js')).sort());
});

test('actual Studio discovery and exact config matchers cover every file once', () => {
    const files = studioTestFiles();
    assert.ok(files.includes('nala/studio/studio.test.js'));
    assert.ok(files.includes('nala/studio/commerce/fries/tests/fries_gradient_border_save.test.js'));
    const matchers = STUDIO_SHARDS.flatMap((shard) => studioShardTestMatch(shard));
    for (const file of files) {
        const absolute = resolve(file).replaceAll('\\', '/');
        assert.equal(matchers.filter((matcher) => matcher.test(absolute)).length, 1, file);
        assert.equal(
            matchers.some((matcher) => matcher.test(`${absolute}.extra`)),
            false,
        );
    }
    assert.deepEqual(STUDIO_SHARDS.flatMap((shard) => selectStudioShard(shard, files)).sort(), files);
});

test('unknown IDs and empty selections fail instead of silently running all Studio tests', () => {
    assert.throws(() => selectStudioShard('typo', fixtures), /Unknown Studio shard/);
    assert.throws(() => selectStudioShard('rest', []), /no test files/);
    assert.throws(() => selectStudioShard('saves', [fixtures[0]]), /no test files/);
    for (const shard of ['typo', '']) {
        const result = spawnSync(process.execPath, ['nala/utils/studio-shards.js', shard], { encoding: 'utf8' });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /Unknown Studio shard/);
    }
});

test('selector CLI emits exactly the sorted files for each shard', () => {
    for (const shard of STUDIO_SHARDS) {
        const result = spawnSync(process.execPath, ['nala/utils/studio-shards.js', shard], { encoding: 'utf8' });
        assert.equal(result.status, 0, result.stderr);
        assert.deepEqual(result.stdout.trim().split('\n'), selectStudioShard(shard, studioTestFiles()));
    }
});

test('config keeps local discovery and setup dependencies while selecting a CI shard exactly', async (t) => {
    const previous = process.env.NALA_STUDIO_SHARD;
    t.after(() => {
        if (previous === undefined) delete process.env.NALA_STUDIO_SHARD;
        else process.env.NALA_STUDIO_SHARD = previous;
    });
    delete process.env.NALA_STUDIO_SHARD;
    const local = (await import('../../playwright.config.js?shard-unit-local')).default;
    assert.ok(local.projects.find(({ name }) => name === 'mas-studio-chromium').testMatch instanceof RegExp);
    for (const shard of STUDIO_SHARDS) {
        process.env.NALA_STUDIO_SHARD = shard;
        const config = (await import(`../../playwright.config.js?shard-unit-${shard}`)).default;
        const studio = config.projects.find(({ name }) => name === 'mas-studio-chromium');
        assert.deepEqual(studio.dependencies, ['setup']);
        assert.equal(config.projects.find(({ name }) => name === 'setup').teardown, 'nala-teardown');
        assert.deepEqual(studio.testMatch, studioShardTestMatch(shard));
    }
});

test('gh wrapper preserves label grep and nopr exclusion with and without sharding', () => {
    for (const shard of ['saves', '']) {
        const result = spawnSync(
            'bash',
            ['-c', 'npx() { printf "MOCK_ARG:%s\\n" "$@"; }; export -f npx; bash ./nala/utils/gh.run.sh'],
            {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    GITHUB_REF: 'refs/pull/1318/merge',
                    GITHUB_REPOSITORY: 'adobecom/mas',
                    prBranch: 'MWPW-209637-2',
                    labels: '@mas-studio @smoke run nala',
                    PROJECT: 'mas-studio-chromium',
                    NALA_STUDIO_SHARD: shard,
                },
            },
        );
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /MOCK_ARG:-g\nMOCK_ARG:mas-studio\|smoke/);
        assert.match(result.stdout, /MOCK_ARG:--grep-invert\nMOCK_ARG:nopr/);
        assert.match(result.stdout, /MOCK_ARG:--project=mas-studio-chromium/);
    }
});

test('workflow uses fixed runner slots, independent cleanup and credential-free failure artifacts', () => {
    const workflow = load(readFileSync('.github/workflows/run-nala.yml', 'utf8'));
    const studio = workflow.jobs['run-nala-studio-tests'];
    const docs = workflow.jobs['run-nala-docs-tests'];
    assert.equal(studio.strategy['fail-fast'], false);
    assert.deepEqual(
        studio.strategy.matrix.include.map(({ shard, runner, workers }) => [shard, runner, workers]),
        [
            ['saves', 'nala-studio-sj', 4],
            ['acom-ahome-ccd-commerce', 'nala-studio-or', 4],
            ['rest', 'nala-studio-no', 3],
        ],
    );
    assert.equal(
        studio.strategy.matrix.include.reduce((total, { workers }) => total + workers, docs.env.NALA_WORKER_COUNT),
        12,
    );
    assert.equal(studio.env.NALA_TOTAL_WORKERS, 12);
    assert.equal(docs.env.NALA_TOTAL_WORKERS, 12);
    assert.equal(docs.env.NALA_PLAYWRIGHT_WORKERS, 1);
    assert.equal(studio.env.NALA_WORKER_COUNT, '${{ matrix.workers }}');
    assert.equal(studio.env.NALA_PLAYWRIGHT_WORKERS, '${{ matrix.workers }}');
    assert.ok(docs['runs-on'].includes('nala-docs'));
    assert.ok(!docs.needs.includes('run-nala-studio-tests'));
    const cleanup = studio.steps.find(({ name }) => name === 'Cleanup cloned cards');
    assert.equal(cleanup.if, 'always()');
    assert.equal(cleanup['continue-on-error'], true);
    assert.ok(studio.steps.indexOf(cleanup) > studio.steps.findIndex(({ name }) => name.includes('Tests via gh.run.sh')));
    for (const job of [studio, docs]) {
        assert.equal(job.env.NALA_EDS_MAX_RPS, undefined);
        assert.equal(job.env.NALA_ODIN_PREVIEW_MAX_RPS, undefined);
        assert.equal(job.env.NALA_ODIN_MAX_RPS, 20);
        const uploads = job.steps.filter(({ uses }) => uses === 'actions/upload-artifact@v4');
        assert.equal(uploads.length, 1);
        assert.match(uploads[0].with.name, /\$\{\{ github\.run_id \}\}.*\$\{\{ github\.run_attempt \}\}/);
        assert.equal(uploads[0].with.path, 'test-results/**/*.png\ntest-results/**/error-context.md\n');
        assert.ok(!job.steps.some(({ uses }) => uses === 'actions/download-artifact@v4'));
    }
    assert.ok(!workflow.jobs['nala-auth']);
    assert.equal(workflow.concurrency.group, '${{ github.workflow }}-${{ github.event.pull_request.number }}');
});
