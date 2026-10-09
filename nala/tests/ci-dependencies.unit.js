import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { load } from 'js-yaml';
import { runnerDependencyKey, verifyNalaDependencies, checkChromiumDependencies } from '../utils/ci-dependencies.js';

test('cached root dependencies must match the lockfile and cannot bypass root installation hooks', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'nala-dependency-check-'));
    const manifest = { dependencies: { 'test-library': '^1.0.0' }, devDependencies: { 'test-tool': '^2.0.0' } };
    const json = (file, value) => writeFileSync(join(directory, file), JSON.stringify(value));
    try {
        json('package.json', manifest);
        json('package-lock.json', {
            packages: { 'node_modules/test-library': { version: '1.0.0' }, 'node_modules/test-tool': { version: '2.0.0' } },
        });
        for (const [name, version] of [
            ['test-library', '1.0.0'],
            ['test-tool', '2.0.0'],
        ]) {
            mkdirSync(join(directory, 'node_modules', name), { recursive: true });
            json(`node_modules/${name}/package.json`, { version });
        }
        await verifyNalaDependencies(directory);
        json('node_modules/test-tool/package.json', { version: '3.0.0' });
        await assert.rejects(verifyNalaDependencies(directory), /test-tool@3.0.0 does not match locked 2.0.0/);
        json('package.json', { ...manifest, scripts: { postinstall: 'node checkout-specific-install.js' } });
        await assert.rejects(verifyNalaDependencies(directory), /Root installation hooks require a fresh npm ci/);
        json('package.json', { dependencies: { 'missing-package': '*' } });
        await assert.rejects(verifyNalaDependencies(directory), /ENOENT/);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});

test('dependency keys invalidate every runner/runtime compatibility change', () => {
    const environment = {
        platform: 'linux',
        arch: 'x64',
        osRelease: 'Ubuntu 22.04',
        kernel: '6.8',
        node: 'v20.20.2',
        abi: '115',
        npm: '10.8.2',
        glibc: '2.35',
        imageOS: 'ubuntu22',
        imageVersion: '20261001',
    };
    const key = runnerDependencyKey(environment);
    assert.equal(runnerDependencyKey({ ...environment }), key);
    for (const field of Object.keys(environment)) {
        assert.notEqual(runnerDependencyKey({ ...environment, [field]: `${environment[field]}-changed` }), key, field);
    }
});

test('a working Chromium skips system package installation and closes its probe browser', async () => {
    let closed = false;
    const browser = {
        newPage: async () => ({
            setContent: async (content) => assert.match(content, /Nala dependency check/),
            title: async () => 'Nala dependency check',
        }),
        close: async () => {
            closed = true;
        },
    };
    assert.equal(await checkChromiumDependencies({ launch: async () => browser }), true);
    assert.equal(closed, true);
});

test('only recognized missing libraries request system repair; unrelated browser failures remain failures', async () => {
    const warn = console.warn;
    const warnings = [];
    console.warn = (message) => warnings.push(message);
    try {
        for (const message of [
            'Host system is missing dependencies to run browsers.',
            'error while loading shared libraries: libgbm.so.1: cannot open shared object file',
        ]) {
            assert.equal(
                await checkChromiumDependencies({
                    launch: async () => {
                        throw new Error(message);
                    },
                }),
                false,
            );
        }
        assert.equal(warnings.length, 2);
        await assert.rejects(
            checkChromiumDependencies({
                launch: async () => {
                    throw new Error('Chromium launch timed out');
                },
            }),
            /Chromium launch timed out/,
        );
    } finally {
        console.warn = warn;
    }
});

test('CI caches exact compatible install artifacts but no HAR, authentication or test results', () => {
    const action = load(readFileSync('.github/actions/setup-nala/action.yml', 'utf8'));
    const steps = action.runs.steps;
    const restores = steps.filter(({ uses }) => uses === 'actions/cache/restore@v4');
    assert.deepEqual(
        restores.map(({ with: options }) => options.path),
        ['node_modules', '${{ runner.temp }}/nala-playwright'],
    );
    for (const step of restores) {
        assert.match(step.with.key, /steps\.runner\.outputs\.runner-key/);
        assert.equal(step.with['restore-keys'], undefined);
        assert.equal(step.env.SEGMENT_DOWNLOAD_TIMEOUT_MINS, 2);
    }
    assert.match(restores[0].with.key, /package-lock\.json.*package\.json.*\.npmrc/);
    assert.match(restores[1].with.key, /steps\.playwright\.outputs\.version/);
    assert.match(steps.find(({ id }) => id === 'runner').run, /PLAYWRIGHT_BROWSERS_PATH=\$RUNNER_TEMP\/nala-playwright/);
    const saves = steps.filter(({ uses }) => uses === 'actions/cache/save@v4');
    assert.deepEqual(
        saves.map(({ with: options }) => options.key),
        restores.map(({ with: options }) => options.key),
    );
    const installation = steps.find(({ name }) => name === 'Install or verify Nala dependencies').run;
    assert.match(installation, /npm ci --workspaces=false --include=dev/);
    assert.match(installation, /node nala\/utils\/ci-dependencies.js dependencies/);
    assert.match(installation, /fetch-timeout=30000/);
    const repair = steps.find(({ uses }) => uses === './.github/actions/prep-apt');
    assert.equal(repair.if, "steps.libraries.outputs.system-deps-ready != 'true'");
    assert.equal(repair.with.browser, 'chromium');
    assert.match(steps.find(({ name }) => name === 'Verify repaired Chromium').run, /system-deps-ready=true/);
    const apt = load(readFileSync('.github/actions/prep-apt/action.yml', 'utf8'));
    const commands = apt.runs.steps.map(({ run }) => run).join('\n');
    assert.doesNotMatch(commands, /fuser -k|systemctl stop|dpkg --configure/);
    assert.match(commands, /timeout 90/);
    assert.match(commands, /timeout 120/);
    assert.match(commands, /for attempt in 1 2/);
    const workflow = load(readFileSync('.github/workflows/run-nala.yml', 'utf8'));
    for (const name of ['run-nala-studio-tests', 'run-nala-docs-tests']) {
        const preparation = workflow.jobs[name].steps.find(({ uses }) => uses === './.github/actions/setup-nala');
        assert.equal(preparation['timeout-minutes'], 10);
    }
});
