import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import appConfig from '@adobe/aio-cli-lib-app-config';

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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const { config } = await appConfig.coalesce('app.config.yaml');
    const actions = getDeploymentActions(config, process.argv[2]);
    if (actions.length === 0) throw new Error('No actions selected; refusing an unfiltered deployment');
    const result = spawnSync('npx', ['aio', 'app', 'deploy', '-v', ...actions.flatMap((action) => ['--action', action])], {
        stdio: 'inherit',
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
}
