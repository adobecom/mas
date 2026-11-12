import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { cssLoader } from '../css-loader.mjs';

export const absWorkingDir = fileURLToPath(new URL('..', import.meta.url));
const srcDir = fileURLToPath(new URL('../src', import.meta.url));

const priceLiterals = readFileSync(
    new URL('../price-literals.json', import.meta.url),
    'utf-8',
);

export const priceLiteralsBanner = {
    js: `window.masPriceLiterals = ${priceLiterals}.data;`,
};

export const defaults = {
    absWorkingDir,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    plugins: [cssLoader()],
};

export const commerceOptions = {
    ...defaults,
    alias: {
        react: 'test/mocks/react.js',
    },
    entryPoints: ['./src/commerce.js'],
    banner: priceLiteralsBanner,
};

/**
 * Lazy "satellite" modules: a literal `import('./name.js')` written in a module
 * that sits directly in src/ is left as a runtime import and built as its own
 * dist/name.js, next to the bundle that loads it. Relative dynamic imports
 * resolve against the importing bundle's URL, so this works wherever dist is
 * served from. Satellites are bundled independently: they must reach shared
 * state (service, Log, element classes) through the service element or the
 * custom element registry, never by importing stateful modules.
 * Builds without this plugin (mas.js) inline satellites as before.
 * @param {Set<string>} names collects the satellite file names
 */
export function satellites(names) {
    return {
        name: 'satellites',
        setup(build) {
            build.onResolve(
                { filter: /^\.\/[\w-]+\.js$/ },
                ({ kind, path, resolveDir }) => {
                    if (kind !== 'dynamic-import' || resolveDir !== srcDir) {
                        return undefined;
                    }
                    names.add(path.slice(2));
                    return { path, external: true };
                },
            );
        },
    };
}

/**
 * Builds every satellite collected in `names` (and the satellites they load).
 * @param {Set<string>} names
 * @param {import('esbuild').BuildOptions} options
 */
export async function buildSatellites(names, options) {
    const built = new Set();
    const results = [];
    while (built.size < names.size) {
        const pending = [...names].filter((name) => !built.has(name));
        pending.forEach((name) => built.add(name));
        results.push(
            ...(await Promise.all(
                pending.map((name) =>
                    build({
                        ...defaults,
                        ...options,
                        entryPoints: [`./src/${name}`],
                        outfile: `./dist/${name}`,
                        plugins: [cssLoader(), satellites(names)],
                    }),
                ),
            )),
        );
    }
    return results;
}
