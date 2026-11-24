import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import appConfig from '@adobe/aio-cli-lib-app-config';
import State from '@adobe/aio-lib-state';
import Files from '@adobe/aio-lib-files';
import openwhisk from 'openwhisk';

const ENTRY_KEY =
    /^history\.promotion\.([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.entry\.([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const CLEANUP_DRAIN_KEY = 'history.migration.cleanup-drain';

export async function runHistoryMigration(
    args = process.argv.slice(2),
    {
        config = appConfig,
        runtime = openwhisk,
        state = State,
        files = Files,
        sleep = delay,
        request = fetch,
        log = console.log,
    } = {},
) {
    const { values } = parseArgs({
        args,
        options: {
            apply: { type: 'boolean' },
            'dry-run': { type: 'boolean' },
            namespace: { type: 'string' },
            help: { type: 'boolean' },
        },
    });
    if (values.help) {
        log('Usage (from io/studio): node scripts/history-migration.mjs [--dry-run | --apply --namespace <namespace>]');
        return;
    }
    if (values.apply && values['dry-run']) throw new Error('Choose --dry-run or --apply, not both');
    if (values.apply && !values.namespace) throw new Error('--apply requires --namespace to confirm the target workspace');
    await config.coalesce('app.config.yaml');
    const { all } = await config.load();
    const { ow } = all.application;
    if (values.namespace && values.namespace !== ow.namespace) throw new Error('Configured workspace namespace mismatch');
    const dryRun = !values.apply;
    log(`[${dryRun ? 'dry-run' : 'apply'}] History migration workspace: ${ow.namespace}`);
    const credentials = { namespace: ow.namespace, auth: ow.auth };
    const historyState = await state.init({ ow: credentials });
    const historyFiles = await files.init({ ow: credentials, tvm: { cacheFile: false } });
    const cleanupDeadline = await retireHistoryCleanup(
        runtime({
            apihost: ow.apihost,
            apiversion: ow.apiversion,
            api_key: ow.auth,
            namespace: ow.namespace,
            auth_handler: ow.auth_handler,
        }),
        historyState,
        { dryRun, log },
    );
    if (!dryRun) {
        const duration = Math.max(60000, cleanupDeadline - Date.now());
        log(`Waiting ${Math.ceil(duration / 1000)} seconds for running legacy actions`);
        await sleep(duration);
    }
    const summary = await migrateLegacyHistory(historyState, historyFiles, request, { dryRun });
    log(JSON.stringify({ mode: dryRun ? 'dry-run' : 'apply', namespace: ow.namespace, ...summary }));
    return summary;
}

export async function retireHistoryCleanup(runtime, state, { dryRun = false, log = console.log } = {}) {
    if (dryRun) {
        for (const [resource, name] of [
            ['rules', 'history-cleanup-rule'],
            ['triggers', 'history-cleanup-daily'],
            ['actions', 'MerchAtScaleStudio/history-cleanup'],
        ]) {
            try {
                await runtime[resource].get({ name });
                log(`[dry-run] Would retire ${resource}: ${name}`);
            } catch (error) {
                if (error.statusCode !== 404) throw error;
            }
        }
        return 0;
    }
    const stored = await state.get(CLEANUP_DRAIN_KEY);
    let deadline = stored ? JSON.parse(stored.value) : 0;
    if (!Number.isSafeInteger(deadline) || deadline < 0) throw new Error('Invalid history cleanup drain deadline');
    const operations = [
        ['rules', 'disable', { name: 'history-cleanup-rule' }],
        ['feeds', 'delete', { name: '/whisk.system/alarms/alarm', trigger: 'history-cleanup-daily' }],
        ['triggers', 'delete', { name: 'history-cleanup-daily' }],
        ['rules', 'delete', { name: 'history-cleanup-rule' }],
        ['actions', 'get', { name: 'MerchAtScaleStudio/history-cleanup' }],
    ];
    for (const [resource, method, options] of operations) {
        try {
            const result = await runtime[resource][method](options);
            if (result?.response?.success === false) throw new Error(`History cleanup ${resource} retirement failed`);
        } catch (error) {
            if (error.statusCode !== 404) throw error;
            continue;
        }
        if (resource === 'actions') {
            deadline = Date.now() + 300000;
            await state.put(CLEANUP_DRAIN_KEY, JSON.stringify(deadline), { ttl: 300 });
            try {
                await runtime.actions.delete(options);
            } catch (error) {
                if (error.statusCode !== 404) throw error;
            }
        }
    }
    return deadline;
}

export async function migrateLegacyHistory(state, files, request = fetch, { dryRun = false } = {}) {
    const summary = { scanned: 0, missing: 0, copied: 0, existing: 0, wouldCopy: 0 };
    const impactedProjects = new Set();
    for await (const { keys } of state.list({ match: 'history.promotion.*.entry.*' })) {
        for (const key of keys) {
            const match = ENTRY_KEY.exec(key);
            if (!match) continue;
            summary.scanned += 1;
            const stored = await state.get(key);
            if (!stored) {
                summary.missing += 1;
                continue;
            }
            const [, rootId, eventId] = match;
            const event = JSON.parse(stored.value);
            if (event.scopeType !== 'promotion' || event.rootId !== rootId || event.id !== eventId) {
                throw new Error('Legacy history entry does not match its State key');
            }
            if (Buffer.byteLength(stored.value) > 750000) throw new Error('Legacy history entry exceeds storage limit');
            const url = await files.generatePresignURL(`private/history/promotion/${rootId}/entry-${eventId}.json`, {
                permissions: dryRun ? 'r' : 'w',
                expiryInSeconds: 60,
                urlType: 'external',
            });
            if (new URL(url).protocol !== 'https:') throw new Error('History migration requires HTTPS storage');
            const response = await request(url, {
                method: dryRun ? 'HEAD' : 'PUT',
                ...(dryRun
                    ? {}
                    : {
                          headers: {
                              'Content-Type': 'application/json',
                              'x-ms-blob-type': 'BlockBlob',
                              'x-ms-version': '2021-12-02',
                              'If-None-Match': '*',
                          },
                          body: stored.value,
                      }),
                redirect: 'error',
                signal: AbortSignal.timeout(15000),
            });
            if (dryRun) {
                if (response.ok) summary.existing += 1;
                else if (response.status === 404) summary.wouldCopy += 1;
                else throw new Error(`Legacy history archive could not be checked (${response.status})`);
            } else if (response.ok) summary.copied += 1;
            else if (response.status === 412) summary.existing += 1;
            else {
                throw new Error(`Legacy history entry could not be archived (${response.status})`);
            }
            if (dryRun ? response.status === 404 : response.ok) impactedProjects.add(rootId);
        }
    }
    return { ...summary, impactedProjects: impactedProjects.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    await runHistoryMigration();
}
