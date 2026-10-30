import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import appConfig from '@adobe/aio-cli-lib-app-config';
import runtimeLib from '@adobe/aio-lib-runtime';

/** Selects core or assistant actions from the existing runtime manifest. */
export function getDeploymentActions(config, group) {
    if (!['core', 'assistant'].includes(group)) throw new Error(`Unknown deployment group: ${group}`);
    const selected = [];
    for (const [packageName, pkg] of Object.entries(config.application.runtimeManifest.packages)) {
        for (const [actionName, action] of Object.entries(pkg.actions)) {
            const assistant = Boolean(action.inputs?.AI_FOUNDRY_API_KEY);
            if (assistant === (group === 'assistant')) selected.push(`${packageName}/${actionName}`);
        }
    }
    return selected;
}

/**
 * Selects the rules that fire a group's actions, with their triggers and actions.
 *
 * `aio app deploy --action` deploys no triggers or rules, so these go in a second pass. It lists the
 * rules' actions too, because aio-lib-runtime rejects a rule whose action is outside its filter; an
 * action the first pass just deployed is unchanged, so it is not deployed again.
 */
export function getDeploymentRules(config, group) {
    const actions = getDeploymentActions(config, group);
    const selected = { actions: [], triggers: [], rules: [] };
    for (const [packageName, pkg] of Object.entries(config.application.runtimeManifest.packages)) {
        for (const [ruleName, rule] of Object.entries(pkg.rules ?? {})) {
            const action = `${packageName}/${rule.action}`;
            if (!actions.includes(action)) continue;
            selected.actions.push(action);
            selected.triggers.push(rule.trigger);
            selected.rules.push(ruleName);
        }
    }
    return selected;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const group = process.argv[2];
    const { config } = await appConfig.coalesce('app.config.yaml');
    const actions = getDeploymentActions(config, group);
    if (actions.length === 0) throw new Error('No actions selected; refusing an unfiltered deployment');
    const result = spawnSync('npx', ['aio', 'app', 'deploy', '-v', ...actions.flatMap((action) => ['--action', action])], {
        stdio: 'inherit',
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
    const rules = getDeploymentRules(config, group);
    if (process.exitCode === 0 && rules.rules.length > 0) {
        const { all } = await appConfig.load();
        await runtimeLib.deployActions(all.application, { filterEntities: rules });
    }
}
