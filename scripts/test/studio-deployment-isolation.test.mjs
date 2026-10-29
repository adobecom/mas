import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import appConfig from '@adobe/aio-cli-lib-app-config';
import { getDeploymentActions, getDeploymentRules } from '../../io/studio/scripts/deploy-actions.mjs';

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

test('core deployment schedules the hourly usage rollup', () => {
    assert.deepEqual(getDeploymentRules(manifest.config, 'core'), {
        actions: ['MerchAtScaleStudio/fragment-usage-rollup'],
        triggers: ['fragment-usage-hourly'],
        rules: ['fragment-usage-rollup-rule'],
    });
});

test('the usage rollup fires on the clock, so a redeploy cannot restart its schedule', () => {
    // Every deploy recreates the trigger's feed. An interval alarm counts from that moment; a cron
    // alarm does not.
    const trigger = manifest.config.application.runtimeManifest.packages.MerchAtScaleStudio.triggers['fragment-usage-hourly'];
    assert.equal(trigger.feed, '/whisk.system/alarms/alarm');
    assert.match(trigger.inputs.cron, /^\d{1,2} \* \* \* \*$/);
});

test('assistant deployment schedules nothing', () => {
    assert.deepEqual(getDeploymentRules(manifest.config, 'assistant'), { actions: [], triggers: [], rules: [] });
});

test('deployment groups cover every rule without overlap', () => {
    const core = getDeploymentRules(manifest.config, 'core').rules;
    const assistant = getDeploymentRules(manifest.config, 'assistant').rules;
    const total = Object.values(manifest.config.application.runtimeManifest.packages).reduce(
        (count, pkg) => count + Object.keys(pkg.rules ?? {}).length,
        0,
    );
    assert.equal(new Set([...core, ...assistant]).size, total);
    assert.equal(
        core.some((rule) => assistant.includes(rule)),
        false,
    );
});

test('unknown deployment groups fail closed', () => {
    assert.throws(() => getDeploymentActions(manifest.config, 'all'), /Unknown deployment group/);
});

test('AI secret retrieval is separate from required core secrets', async () => {
    const workflow = await readFile(new URL('../../.github/workflows/io-studio-deploy.yaml', import.meta.url), 'utf8');
    assert.equal(/env-fields: aos_url,aos_api_key,ost_write_api_key,grafana_service_token\s*\n/.test(workflow), true);
    assert.equal(workflow.includes('run: node scripts/deploy-actions.mjs core'), true);
    assert.equal(workflow.includes('run: node scripts/deploy-actions.mjs assistant'), true);
});
