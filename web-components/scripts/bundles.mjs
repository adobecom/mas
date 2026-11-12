import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
 * Modules bundled in a commerce.js build and the names it exports.
 * @param {import('esbuild').Metafile} metafile
 */
export function commerceGraph(metafile) {
    return {
        modules: new Set(
            Object.keys(metafile.inputs).map((file) =>
                resolve(absWorkingDir, file),
            ),
        ),
        exports: metafile.outputs['dist/commerce.js'].exports,
    };
}

/**
 * Rewrites imports of modules that commerce.js already bundles to
 * `import {…} from './commerce.js'`, so the page loads and runs one instance
 * of each (one Log, one service registry, one set of element classes).
 * @param {ReturnType<typeof commerceGraph>} graph
 */
export function importFromCommerce({ modules }) {
    return {
        name: 'import-from-commerce',
        setup(build) {
            build.onResolve({ filter: /.*/ }, async (args) => {
                if (args.kind === 'entry-point' || args.pluginData?.resolved)
                    return undefined;
                const { path } = await build.resolve(args.path, {
                    kind: args.kind,
                    importer: args.importer,
                    resolveDir: args.resolveDir,
                    pluginData: { resolved: true },
                });
                if (!modules.has(path)) return undefined;
                return { path: './commerce.js', external: true };
            });
        },
    };
}

/**
 * Throws when a bundle imports a name that commerce.js does not export.
 * @param {string} name bundle file name, for the error message
 * @param {string} code bundle output
 * @param {ReturnType<typeof commerceGraph>} graph
 */
export function assertCommerceImports(name, code, { exports }) {
    const imported = [
        ...code.matchAll(/import\s*\{([^}]*)\}\s*from\s*"\.\/commerce\.js"/g),
    ].flatMap(([, names]) =>
        names.split(',').map((entry) => entry.trim().split(/\s+as\s+/)[0]),
    );
    const missing = [...new Set(imported)].filter(
        (entry) => !exports.includes(entry),
    );
    if (missing.length) {
        throw new Error(
            `${name} imports ${missing.join(', ')} from ./commerce.js: export them from src/commerce.js`,
        );
    }
}

/**
 * Lazy "satellite" modules: a literal `import('./name.js')` written in a module
 * that sits directly in src/ is left as a runtime import and built as its own
 * dist/name.js, next to the bundle that loads it. Relative dynamic imports
 * resolve against the importing bundle's URL, so this works wherever dist is
 * served from. A satellite imports the modules commerce.js already bundles
 * from './commerce.js' (same instances); src/commerce.js must export every
 * name a satellite uses, or the build fails.
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
 * Writes them to dist/ unless `options.write` is false.
 * @param {Set<string>} names
 * @param {import('esbuild').BuildOptions} options
 * @param {ReturnType<typeof commerceGraph>} graph
 */
export async function buildSatellites(names, options, graph) {
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
                        write: false,
                        plugins: [
                            cssLoader(),
                            satellites(names),
                            importFromCommerce(graph),
                        ],
                    }),
                ),
            )),
        );
    }
    for (const { outputFiles } of results) {
        for (const { path, text } of outputFiles) {
            if (path.endsWith('.js')) {
                assertCommerceImports(path.split('/').pop(), text, graph);
            }
            if (options.write === false) continue;
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, text);
        }
    }
    return results;
}
