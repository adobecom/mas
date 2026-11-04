import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKSPACES = ['web-components', 'io/studio', 'io/operations', 'ost', 'scripts/content', 'price'];
const STUDIO_TEST = /^studio\/test\/.*\.test\.(js|html)$/;
const STUDIO_SRC = /^studio\/src\/.*\.js$/;
const WTR = ['npx', 'wtr', '--config', './web-test-runner.config.mjs'];

// shortcut: studio tests are picked by file name (tests that mention the changed module), so tests of transitive dependents are left to CI.
const studioTestsFor = (changed, studioTests) => {
    const names = changed.filter((f) => STUDIO_SRC.test(f)).map((f) => basename(f));
    const mentioning = Object.keys(studioTests).filter((path) => names.some((name) => studioTests[path].includes(name)));
    return [...new Set([...changed.filter((f) => STUDIO_TEST.test(f)), ...mentioning])].sort();
};

const studioCommands = (changed, studioTests) => {
    const studio = changed.filter((f) => f.startsWith('studio/'));
    if (!studio.length) return [];
    const nodeTests = { argv: ['npm', 'run', 'test:node', '-w', 'studio'] };
    if (studio.some((f) => !STUDIO_SRC.test(f) && !STUDIO_TEST.test(f))) {
        return [nodeTests, { argv: WTR, cwd: 'studio' }];
    }
    const tests = studioTestsFor(changed, studioTests).map((f) => f.replace('studio/', ''));
    return tests.length ? [nodeTests, { argv: [...WTR, '--files', ...tests], cwd: 'studio' }] : [nodeTests];
};

/** Commands that test what `changed` (repo-relative paths) touches. `studioTests` maps studio test paths to their source. */
export const plan = (changed, studioTests) => [
    ...WORKSPACES.filter((ws) => changed.some((f) => f.startsWith(`${ws}/`))).map((ws) => ({
        argv: ['npm', 'run', 'test:ci', '-w', ws],
    })),
    ...studioCommands(changed, studioTests),
];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);

const changedFiles = () => {
    const base = git('rev-parse', '--verify', '-q', 'origin/main').length
        ? git('merge-base', 'HEAD', 'origin/main')[0]
        : 'HEAD';
    return [
        ...new Set([
            ...git('diff', '--name-only', '--diff-filter=d', base),
            ...git('ls-files', '--others', '--exclude-standard'),
        ]),
    ].sort();
};

const readStudioTests = () =>
    Object.fromEntries(
        readdirSync('studio/test', { recursive: true })
            .map((f) => `studio/test/${f}`)
            .filter((f) => STUDIO_TEST.test(f))
            .map((f) => [f, readFileSync(f, 'utf8')]),
    );

const main = () => {
    process.chdir(fileURLToPath(new URL('../..', import.meta.url)));
    for (const { argv, cwd } of plan(changedFiles(), readStudioTests())) {
        const { status } = spawnSync(argv[0], argv.slice(1), { cwd, stdio: 'inherit' });
        if (status) process.exit(status);
    }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
