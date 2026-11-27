import assert from 'node:assert/strict';
import { test } from 'node:test';
import { migrateLegacyHistory, retireHistoryCleanup, runHistoryMigration } from '../../io/studio/scripts/history-migration.mjs';
import { deployActions } from '../../io/studio/scripts/deploy-actions.mjs';

const rootId = '11111111-1111-4111-8111-111111111111';
const eventId = '22222222-2222-5222-a222-222222222222';
const key = `history.promotion.${rootId}.entry.${eventId}`;
const path = `private/history/promotion/${rootId}/entry-${eventId}.json`;
const event = { id: eventId, scopeType: 'promotion', rootId, createdAt: '2020-01-01T00:00:00.000Z', version: 17 };
const failure = (statusCode) => Object.assign(new Error('Resource request failed'), { statusCode });

function runtimeFixture(failedOperation, statusCode) {
    const calls = [];
    const runtime = {};
    for (const [resource, methods] of Object.entries({
        rules: ['get', 'disable', 'delete'],
        feeds: ['delete'],
        triggers: ['get', 'delete'],
        actions: ['get', 'delete'],
    })) {
        runtime[resource] = {};
        for (const method of methods) {
            runtime[resource][method] = async (options) => {
                const operation = `${resource}.${method}`;
                calls.push([operation, options]);
                if (operation === failedOperation) throw failure(statusCode);
                if (operation === 'actions.get') return {};
            };
        }
    }
    return { runtime, calls };
}

function retirementState() {
    const entries = new Map();
    return {
        get: async (key) => entries.get(key),
        put: async (key, value, options) => {
            assert.equal(options.ttl, 300);
            entries.set(key, { value });
        },
    };
}

function migrationFixture(pages = [[key]]) {
    const calls = [];
    const source = new Map([[key, JSON.stringify(event)]]);
    const destination = new Map();
    const state = {
        list: async function* (options) {
            calls.push(['list', options]);
            for (const keys of pages) yield { keys };
        },
        get: async (name) => {
            calls.push(['get', name]);
            const value = source.get(name);
            return value === undefined ? undefined : { value };
        },
    };
    const files = {
        generatePresignURL: async (name, options) => {
            calls.push(['presign', name, options]);
            return `https://storage.example/${name}`;
        },
    };
    const request = async (url, options) => {
        calls.push(['request', url, options]);
        const name = new URL(url).pathname.slice(1);
        if (options.method === 'HEAD') return { ok: destination.has(name), status: destination.has(name) ? 200 : 404 };
        assert.equal(options.headers['If-None-Match'], '*');
        if (destination.has(name)) return { ok: false, status: 412 };
        destination.set(name, options.body);
        return { ok: true, status: 201 };
    };
    return { state, files, request, calls, source, destination };
}

test('retirement disables the exact rule and removes its alarm before removing the trigger, rule and manual action', async () => {
    const { runtime, calls } = runtimeFixture();
    await retireHistoryCleanup(runtime, retirementState());
    assert.deepEqual(calls, [
        ['rules.disable', { name: 'history-cleanup-rule' }],
        ['feeds.delete', { name: '/whisk.system/alarms/alarm', trigger: 'history-cleanup-daily' }],
        ['triggers.delete', { name: 'history-cleanup-daily' }],
        ['rules.delete', { name: 'history-cleanup-rule' }],
        ['actions.get', { name: 'MerchAtScaleStudio/history-cleanup' }],
        ['actions.delete', { name: 'MerchAtScaleStudio/history-cleanup' }],
    ]);
});

test('retirement remains idempotent when any one exact resource is already missing', async () => {
    for (const operation of ['rules.disable', 'feeds.delete', 'triggers.delete', 'rules.delete', 'actions.delete']) {
        const { runtime, calls } = runtimeFixture(operation, 404);
        await retireHistoryCleanup(runtime, retirementState());
        assert.equal(calls.length, 6);
    }
});

test('retirement fails before proceeding past unexpected errors', async () => {
    for (const operation of ['rules.disable', 'feeds.delete', 'triggers.delete', 'rules.delete', 'actions.delete']) {
        const { runtime, calls } = runtimeFixture(operation, 403);
        await assert.rejects(retireHistoryCleanup(runtime, retirementState()), { statusCode: 403 });
        assert.equal(calls.at(-1)[0], operation);
    }
});

test('missing cleanup resources require no cleanup drain deadline', async () => {
    const { runtime } = runtimeFixture('actions.get', 404);
    assert.equal(await retireHistoryCleanup(runtime, retirementState()), 0);
});

test('a failed deployment preserves the cleanup drain deadline even after the cleanup action is gone', async () => {
    const { runtime } = runtimeFixture();
    const state = retirementState();
    const deadline = await retireHistoryCleanup(runtime, state);
    assert.ok(deadline >= Date.now() + 299000);
    const missing = runtimeFixture('actions.get', 404).runtime;
    assert.equal(await retireHistoryCleanup(missing, state), deadline);
});

test('migration scans every State page and archives available bodies regardless of event age without altering State', async () => {
    const nextId = '33333333-3333-5333-a333-333333333333';
    const nextKey = `history.promotion.${rootId}.entry.${nextId}`;
    const fixture = migrationFixture([[], [key], [nextKey]]);
    fixture.source.set(nextKey, JSON.stringify({ ...event, id: nextId, version: 18 }));
    const original = new Map(fixture.source);
    await migrateLegacyHistory(fixture.state, fixture.files, fixture.request);
    assert.deepEqual(fixture.calls[0], ['list', { match: 'history.promotion.*.entry.*' }]);
    assert.equal(fixture.destination.get(path), JSON.stringify(event));
    assert.equal(fixture.destination.size, 2);
    assert.deepEqual(fixture.source, original);
});

test('migration excludes guards, indexes, other scopes and malformed or suffixed keys before reading them', async () => {
    const ignored = [
        key.replace('.entry.', '.request.'),
        key.replace('.entry.', '.index.'),
        key.replace('history.promotion.', 'history.collection.'),
        key.replace(rootId, '../../private'),
        `${key}.extra`,
    ];
    const fixture = migrationFixture([[...ignored, key]]);
    await migrateLegacyHistory(fixture.state, fixture.files, fixture.request);
    assert.deepEqual(
        fixture.calls.filter(([operation]) => operation === 'get'),
        [['get', key]],
    );
});

test('migration leaves an authoritative file unchanged on reruns and duplicate State listing keys', async () => {
    const fixture = migrationFixture([[key, key]]);
    fixture.destination.set(path, JSON.stringify({ ...event, version: 99 }));
    await migrateLegacyHistory(fixture.state, fixture.files, fixture.request);
    await migrateLegacyHistory(fixture.state, fixture.files, fixture.request);
    assert.equal(JSON.parse(fixture.destination.get(path)).version, 99);
});

test('migration skips entries that expire between listing and retrieval', async () => {
    const fixture = migrationFixture();
    fixture.source.clear();
    await migrateLegacyHistory(fixture.state, fixture.files, fixture.request);
    assert.equal(fixture.destination.size, 0);
    assert.equal(
        fixture.calls.some(([operation]) => operation === 'presign'),
        false,
    );
});

test('migration rejects corrupt bodies or a body whose identity disagrees with its exact State key', async () => {
    for (const value of ['{', JSON.stringify({ ...event, rootId: eventId }), JSON.stringify({ ...event, id: rootId })]) {
        const fixture = migrationFixture();
        fixture.source.set(key, value);
        await assert.rejects(migrateLegacyHistory(fixture.state, fixture.files, fixture.request));
        assert.equal(fixture.destination.size, 0);
    }
});

test('migration fails explicitly on State, presign and Files write failures', async () => {
    for (const operation of ['get', 'generatePresignURL', 'request']) {
        const fixture = migrationFixture();
        const fail = async () => {
            throw failure(503);
        };
        if (operation === 'get') fixture.state.get = fail;
        else if (operation === 'generatePresignURL') fixture.files.generatePresignURL = fail;
        else fixture.request = fail;
        await assert.rejects(migrateLegacyHistory(fixture.state, fixture.files, fixture.request), { statusCode: 503 });
    }
    const fixture = migrationFixture();
    fixture.request = async () => ({ ok: false, status: 403 });
    await assert.rejects(migrateLegacyHistory(fixture.state, fixture.files, fixture.request), /403/);
});

test('migration uses HTTPS conditional private blob creation with redirects disabled and a bounded timeout', async () => {
    const fixture = migrationFixture();
    await migrateLegacyHistory(fixture.state, fixture.files, fixture.request);
    const [, name, presign] = fixture.calls.find(([operation]) => operation === 'presign');
    assert.equal(name, path);
    assert.deepEqual(presign, { permissions: 'w', expiryInSeconds: 60, urlType: 'external' });
    const [, , options] = fixture.calls.find(([operation]) => operation === 'request');
    assert.equal(options.method, 'PUT');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers['x-ms-blob-type'], 'BlockBlob');
    assert.ok(options.signal instanceof AbortSignal);
    fixture.files.generatePresignURL = async () => 'http://storage.example/history';
    await assert.rejects(migrateLegacyHistory(fixture.state, fixture.files, fixture.request), /HTTPS/);
});

test('migration dry-run validates entries and checks destination presence without any writes', async () => {
    const fixture = migrationFixture();
    const summary = await migrateLegacyHistory(fixture.state, fixture.files, fixture.request, { dryRun: true });
    assert.equal(summary.wouldCopy, 1);
    assert.equal(fixture.destination.size, 0);
    assert.equal(fixture.calls.find(([operation]) => operation === 'presign')[2].permissions, 'r');
    assert.equal(fixture.calls.find(([operation]) => operation === 'request')[2].method, 'HEAD');
});

for (const dryRun of [true, false]) {
    test(`migration ${dryRun ? 'dry-run' : 'apply'} counts distinct projects needing copies across pages`, async () => {
        const entries = [
            event,
            { ...event, id: '33333333-3333-5333-a333-333333333333' },
            { ...event, rootId: '44444444-4444-4444-8444-444444444444' },
            { ...event, rootId: '55555555-5555-4555-8555-555555555555' },
        ];
        const keys = entries.map(({ rootId, id }) => `history.promotion.${rootId}.entry.${id}`);
        const missingKey = key.replace(rootId, '66666666-6666-4666-8666-666666666666');
        const fixture = migrationFixture([keys.slice(0, 1), [...keys.slice(1), missingKey]]);
        for (const [index, entry] of entries.entries()) {
            fixture.source.set(keys[index], JSON.stringify(entry));
        }
        fixture.destination.set(
            `private/history/promotion/${entries[3].rootId}/entry-${eventId}.json`,
            JSON.stringify(entries[3]),
        );

        const summary = await migrateLegacyHistory(fixture.state, fixture.files, fixture.request, { dryRun });

        assert.equal(summary.impactedProjects, 2);
        assert.equal(summary[dryRun ? 'wouldCopy' : 'copied'], 3);
        assert.equal(summary.existing, 1);
        assert.equal(summary.missing, 1);
    });
}

test('migration dry-run reports existing archives and propagates unexpected destination failures', async () => {
    const fixture = migrationFixture();
    fixture.destination.set(path, JSON.stringify(event));
    const summary = await migrateLegacyHistory(fixture.state, fixture.files, fixture.request, { dryRun: true });
    assert.equal(summary.existing, 1);
    fixture.request = async () => ({ ok: false, status: 403 });
    await assert.rejects(migrateLegacyHistory(fixture.state, fixture.files, fixture.request, { dryRun: true }), /403/);
});

test('cleanup dry-run reads resources without disabling or deleting anything or writing State', async () => {
    const { runtime, calls } = runtimeFixture();
    const state = {
        get: async () => undefined,
        put: async () => assert.fail('Dry-run must not write State'),
    };
    await retireHistoryCleanup(runtime, state, { dryRun: true, log: () => {} });
    assert.deepEqual(
        calls.map(([operation]) => operation),
        ['rules.get', 'triggers.get', 'actions.get'],
    );
});

function deploymentFixture(status = 0) {
    const phases = [];
    const application = {
        ow: { namespace: 'test-workspace', auth: 'test-auth', apihost: 'https://runtime.example', apiversion: 'v1' },
    };
    const manifest = {
        application: {
            runtimeManifest: {
                packages: {
                    MerchAtScaleStudio: {
                        actions: { 'history-record': {}, 'ai-chat': { inputs: { AI_FOUNDRY_API_KEY: '$KEY' } } },
                    },
                },
            },
        },
    };
    const { runtime } = runtimeFixture();
    runtime.rules.disable = async () => phases.push('retire');
    const migration = migrationFixture();
    const marker = retirementState();
    const get = migration.state.get;
    migration.state.get = async (key) => (await marker.get(key)) ?? get(key);
    migration.state.put = marker.put;
    return {
        phases,
        migration,
        runtime,
        dependencies: {
            config: {
                coalesce: async () => ({ config: manifest }),
                load: async () => {
                    phases.push('load');
                    return { all: { application } };
                },
            },
            runtime: (options) => {
                assert.deepEqual(options, {
                    apihost: application.ow.apihost,
                    apiversion: application.ow.apiversion,
                    api_key: application.ow.auth,
                    namespace: application.ow.namespace,
                    auth_handler: undefined,
                });
                return runtime;
            },
            spawn: (command, args) => {
                phases.push('deploy');
                assert.equal(command, 'npx');
                assert.equal(args.includes('--action'), true);
                return { status };
            },
            sleep: async (duration) => {
                phases.push('drain');
                assert.ok(duration >= 60000 && duration <= 300000);
            },
            state: {
                init: async (options) => {
                    phases.push('state');
                    assert.deepEqual(options, { ow: { namespace: 'test-workspace', auth: 'test-auth' } });
                    return migration.state;
                },
            },
            files: {
                init: async (options) => {
                    phases.push('files');
                    assert.deepEqual(options, {
                        ow: { namespace: 'test-workspace', auth: 'test-auth' },
                        tvm: { cacheFile: false },
                    });
                    return migration.files;
                },
            },
            request: migration.request,
        },
    };
}

test('core deployment never runs migration, retirement or a drain delay', async () => {
    const { dependencies, phases, migration } = deploymentFixture();
    assert.equal(await deployActions('core', dependencies), 0);
    assert.deepEqual(phases, ['deploy']);
    assert.equal(migration.destination.size, 0);
});

test('core deployment still schedules unrelated manifest rules after deploying actions', async () => {
    const { dependencies, phases } = deploymentFixture();
    const { config } = await dependencies.config.coalesce();
    const pkg = config.application.runtimeManifest.packages.MerchAtScaleStudio;
    pkg.actions['fragment-usage-rollup'] = {};
    pkg.rules = { 'fragment-usage-rollup-rule': { trigger: 'fragment-usage-hourly', action: 'fragment-usage-rollup' } };
    dependencies.deployRules = async (application, options) => {
        phases.push('rules');
        assert.equal(application.ow.namespace, 'test-workspace');
        assert.deepEqual(options.filterEntities, {
            actions: ['MerchAtScaleStudio/fragment-usage-rollup'],
            triggers: ['fragment-usage-hourly'],
            rules: ['fragment-usage-rollup-rule'],
        });
    };

    assert.equal(await deployActions('core', dependencies), 0);
    assert.deepEqual(phases, ['deploy', 'load', 'rules']);
});

test('failed core deployment never initializes Files or starts migration', async () => {
    const { dependencies, phases } = deploymentFixture(1);
    assert.equal(await deployActions('core', dependencies), 1);
    assert.deepEqual(phases, ['deploy']);
});

test('assistant deployment performs no cleanup retirement, drain, migration or credential config loading', async () => {
    const { dependencies, phases } = deploymentFixture();
    assert.equal(await deployActions('assistant', dependencies), 0);
    assert.deepEqual(phases, ['deploy']);
});

test('manual migration defaults to dry-run and never deploys actions or waits', async () => {
    const { dependencies, phases, migration } = deploymentFixture();
    const messages = [];
    const result = await runHistoryMigration([], { ...dependencies, log: (message) => messages.push(message) });
    assert.equal(result.wouldCopy, 1);
    assert.deepEqual(phases, ['load', 'state', 'files']);
    assert.equal(migration.destination.size, 0);
    assert.match(messages[0], /dry-run.*test-workspace/);
});

test('manual apply requires an explicit matching namespace before any writes', async () => {
    const { dependencies, phases } = deploymentFixture();
    await assert.rejects(runHistoryMigration(['--apply'], dependencies), /namespace/);
    assert.deepEqual(phases, []);
    await assert.rejects(runHistoryMigration(['--apply', '--namespace', 'wrong-workspace'], dependencies), /mismatch/i);
    assert.deepEqual(phases, ['load']);
});

test('manual apply retires cleanup, drains running actions and archives available events', async () => {
    const { dependencies, phases, migration } = deploymentFixture();
    const result = await runHistoryMigration(['--apply', '--namespace', 'test-workspace'], {
        ...dependencies,
        log: () => {},
    });
    assert.equal(result.copied, 1);
    assert.deepEqual(phases, ['load', 'state', 'files', 'retire', 'drain']);
    assert.equal(migration.destination.has(path), true);
});

test('manual migration rejects conflicting modes and unknown flags without loading workspace credentials', async () => {
    const { dependencies, phases } = deploymentFixture();
    await assert.rejects(runHistoryMigration(['--apply', '--dry-run', '--namespace', 'test-workspace'], dependencies));
    await assert.rejects(runHistoryMigration(['--unknown'], dependencies));
    assert.deepEqual(phases, []);
});

test('manual help requires no workspace credentials', async () => {
    const { dependencies, phases } = deploymentFixture();
    const messages = [];
    await runHistoryMigration(['--help'], { ...dependencies, log: (message) => messages.push(message) });
    assert.deepEqual(phases, []);
    assert.match(messages[0], /--apply/);
});

test('manual migration propagates storage failures and can safely be rerun', async () => {
    const { dependencies, migration } = deploymentFixture();
    const get = migration.state.get;
    migration.state.get = async () => {
        throw failure(503);
    };
    const args = ['--apply', '--namespace', 'test-workspace'];
    const options = { ...dependencies, log: () => {} };
    await assert.rejects(runHistoryMigration(args, options), { statusCode: 503 });
    migration.state.get = get;
    await runHistoryMigration(args, options);
    assert.equal(migration.destination.has(path), true);
});

test('manual apply without cleanup resources drains old writers for only 60 seconds', async () => {
    const { dependencies, runtime, migration } = deploymentFixture();
    runtime.actions.get = async () => {
        throw failure(404);
    };
    dependencies.sleep = async (duration) => assert.equal(duration, 60000);
    await runHistoryMigration(['--apply', '--namespace', 'test-workspace'], { ...dependencies, log: () => {} });
    assert.equal(migration.destination.has(path), true);
});
