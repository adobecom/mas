import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { load } from 'js-yaml';
import {
    STUDIO_SHARDS,
    selectStudioShard,
    studioShardForFile,
    studioShardTestMatch,
    studioTestFiles,
} from '../utils/studio-shards.js';

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

test('mixed shards are sorted, complete and disjoint, including nested saves and future directories', () => {
    for (const shard of STUDIO_SHARDS) {
        const selected = selectStudioShard(shard, fixtures);
        assert.deepEqual(selected, [...selected].sort());
    }
    const combined = STUDIO_SHARDS.flatMap((shard) => selectStudioShard(shard, fixtures));
    assert.equal(new Set(combined).size, combined.length);
    assert.deepEqual(combined.sort(), fixtures.filter((file) => file.endsWith('.test.js')).sort());
});

test('mixed shards separate the largest workloads and distribute save suites without serialization', () => {
    assert.equal(studioShardForFile('acom/plans/individuals/tests/individuals_edit_and_discard.test.js'), 'mixed-1');
    assert.equal(studioShardForFile('regional-variations/tests/variations.test.js'), 'mixed-2');
    assert.equal(studioShardForFile('acom/plans/individuals/tests/individuals_save.test.js'), 'mixed-3');
    assert.equal(studioShardForFile('ccd/suggested/tests/suggested_save.test.js'), 'mixed-1');
    assert.equal(studioShardForFile('ccd/slice/tests/slice_save.test.js'), 'mixed-2');
    assert.equal(studioShardForFile('commerce/fries/tests/fries_save.test.js'), 'mixed-3');
});

test('new files inherit suite and workload policies rather than filename hashes or a maintained file list', () => {
    const additions = [
        ['acom/plans/individuals/nested/tests/new_save.test.js', 'mixed-3'],
        ['acom/plans/individuals/tests/new_edit_and_discard.test.js', 'mixed-1'],
        ['acom/plans/individuals/tests/new_css.test.js', 'mixed-2'],
        ['acom/pro/tests/new_feature.test.js', 'mixed-1'],
        ['commerce/fries/nested/tests/new_gradient_save.test.js', 'mixed-2'],
        ['ost/new-folder/tests/new_authoring_save.test.js', 'mixed-1'],
        ['ost/new-folder/tests/new_bundle_fields.test.js', 'mixed-1'],
        ['ost/tests/authoringish.test.js', 'mixed-2'],
        ['regional-variations/new-folder/tests/new_feature.test.js', 'mixed-2'],
        ['placeholders/tests/new_search.test.js', 'mixed-1'],
        ['acom/new-product/tests/new_save.test.js', 'mixed-3'],
        ['acom/new-product/tests/new_edit_and_discard.test.js', 'mixed-1'],
        ['ahome/new-product/tests/new_save.test.js', 'mixed-2'],
        ['ccd/new-product/tests/new_save.test.js', 'mixed-1'],
        ['commerce/new-product/tests/new_save.test.js', 'mixed-3'],
        ['new-area/nested/tests/new_css.test.js', 'mixed-1'],
        ['new-area/nested/tests/new_save.test.js', 'mixed-2'],
        ['new-area/nested/tests/new_edit_and_discard.test.js', 'mixed-3'],
        ['new-area/nested/tests/new_feature.test.js', 'mixed-2'],
        ['new_navigation.test.js', 'mixed-3'],
    ];
    for (const [file, shard] of additions) {
        assert.equal(studioShardForFile(file), shard, file);
        assert.equal(studioShardForFile(`nala/studio/${file}`), shard, file);
        assert.equal(studioShardForFile(`nala/studio/${file}`.replaceAll('/', '\\')), shard, file);
    }
    const files = additions.map(([file]) => `nala/studio/${file}`);
    for (const shard of STUDIO_SHARDS) {
        assert.deepEqual(
            selectStudioShard(shard, files),
            additions
                .filter(([, selected]) => selected === shard)
                .map(([file]) => `nala/studio/${file}`)
                .sort(),
        );
    }
});

test('recursive discovery automatically includes new suites and nested files without a manifest update', () => {
    const directory = mkdtempSync(join(tmpdir(), 'nala-studio-discovery-'));
    const additions = [
        ['acom/pro/new-folder/tests/another_save.test.js', 'mixed-1'],
        ['brand-new-suite/deeper/tests/new_save.test.js', 'mixed-2'],
        ['brand-new-suite/deeper/tests/new_edit_and_discard.test.js', 'mixed-3'],
    ];
    try {
        for (const [file] of additions) {
            mkdirSync(dirname(join(directory, file)), { recursive: true });
            writeFileSync(join(directory, file), '');
        }
        writeFileSync(join(directory, 'not-a-nala-spec.js'), '');
        const discovered = studioTestFiles(directory);
        assert.deepEqual(discovered, additions.map(([file]) => `nala/studio/${file}`).sort());
        for (const shard of STUDIO_SHARDS) {
            assert.deepEqual(
                selectStudioShard(shard, discovered),
                additions
                    .filter(([, selected]) => selected === shard)
                    .map(([file]) => `nala/studio/${file}`)
                    .sort(),
            );
        }
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
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
    assert.throws(() => selectStudioShard('mixed-3', []), /no test files/);
    assert.throws(() => selectStudioShard('mixed-1', [fixtures[0]]), /no test files/);
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
    for (const shard of ['mixed-1', '']) {
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
            ['mixed-1', 'nala-studio-sj', 4],
            ['mixed-2', 'nala-studio-or', 4],
            ['mixed-3', 'nala-studio-no', 3],
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
