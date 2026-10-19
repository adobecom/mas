import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import appConfig from '@adobe/aio-cli-lib-app-config';
import { getDeploymentActions } from '../../io/studio/scripts/deploy-actions.mjs';

const manifest = await appConfig.coalesce(new URL('../../io/studio/app.config.yaml', import.meta.url).pathname);

test('core deployment excludes AI actions but retains existing OST actions', () => {
    const actions = getDeploymentActions(manifest.config, 'core');
    assert.equal(actions.includes('MerchAtScaleStudio/ost-products-read'), true);
    assert.equal(actions.includes('MerchAtScaleStudio/ost-products-write'), true);
    assert.equal(actions.includes('MerchAtScaleStudio/ai-chat'), false);
    assert.equal(actions.includes('MerchAtScaleStudio/masa-api'), false);
});

test('assistant deployment includes only AI actions', () => {
    assert.deepEqual(getDeploymentActions(manifest.config, 'assistant'), ['MerchAtScaleStudio/ai-chat']);
});

test('deployment groups cover every action without overlap', () => {
    const core = getDeploymentActions(manifest.config, 'core');
    const assistant = getDeploymentActions(manifest.config, 'assistant');
    const masa = getDeploymentActions(manifest.config, 'masa');
    assert.deepEqual(masa, ['MerchAtScaleStudio/masa-api']);
    const total = Object.values(manifest.config.application.runtimeManifest.packages).reduce(
        (count, pkg) => count + Object.keys(pkg.actions).length,
        0,
    );
    assert.equal(new Set([...core, ...assistant, ...masa]).size, total);
    assert.equal(core.length + assistant.length + masa.length, total);
});

test('MASA action keeps raw HTTP, immutable inputs and its own preflight handler', () => {
    const action = manifest.config.application.runtimeManifest.packages.MerchAtScaleStudio.actions['masa-api'];
    assert.equal(action.web, 'raw');
    assert.equal(action.annotations.final, true);
    assert.equal(action.annotations['web-custom-options'], true);
    assert.equal(action.annotations['require-adobe-auth'], false);
    assert.equal(action.limits.timeout, 60000);
    for (const name of ['MASA_API_ENABLED', 'MASA_API_SERVICE_TOKEN', 'MASA_IDENTITY_PRIVATE_KEY_B64', 'MASA_PILOT_USERS']) {
        assert.equal(Object.hasOwn(action.inputs, name), true);
    }
});

test('unknown deployment groups fail closed', () => {
    assert.throws(() => getDeploymentActions(manifest.config, 'all'), /Unknown deployment group/);
});

test('AI secret retrieval is separate from required core secrets', async () => {
    const workflow = await readFile(new URL('../../.github/workflows/io-studio-deploy.yaml', import.meta.url), 'utf8');
    assert.equal(/env-fields: aos_url,aos_api_key,ost_write_api_key\s*\n/.test(workflow), true);
    assert.equal(workflow.includes('run: node scripts/deploy-actions.mjs core'), true);
    assert.equal(workflow.includes('run: node scripts/deploy-actions.mjs assistant'), true);
    assert.equal(workflow.includes('run: node scripts/deploy-actions.mjs masa'), false);
});
