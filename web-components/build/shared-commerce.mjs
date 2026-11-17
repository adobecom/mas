import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';

export function createSharedCommerce({ resolveDir, entryPoint, modules }) {
    const sources = new Map(
        Object.entries(modules).map(([id, { source, exports: names }]) => [
            realpathSync(resolve(resolveDir, source)),
            names.map((name) => ({
                name,
                alias: `__mas_${id}_${name}`,
            })),
        ]),
    );
    const reexports = Object.entries(modules).map(
        ([id, { source, exports: names }]) =>
            `export { ${names.map((name) => `${name} as __mas_${id}_${name}`).join(', ')} } from ${JSON.stringify(source)};`,
    );

    return {
        entry: {
            contents: [
                `export * from ${JSON.stringify(entryPoint)};`,
                ...reexports,
            ].join('\n'),
            resolveDir,
            sourcefile: 'commerce-entry.js',
        },
        plugin: {
            name: 'shared-commerce',
            setup(build) {
                build.initialOptions.logOverride = {
                    ...build.initialOptions.logOverride,
                    'import-is-undefined': 'error',
                };
                build.onResolve(
                    { filter: /.*/, namespace: 'file' },
                    async (args) => {
                        if (args.pluginData?.sharedCommerceResolved) return;
                        const result = await build.resolve(args.path, {
                            kind: args.kind,
                            importer: args.importer,
                            resolveDir: args.resolveDir,
                            namespace: args.namespace,
                            pluginData: { sharedCommerceResolved: true },
                        });
                        if (result.errors.length) {
                            return {
                                errors: result.errors,
                                warnings: result.warnings,
                            };
                        }
                        if (!sources.has(result.path)) return;
                        return {
                            path: result.path,
                            namespace: 'shared-commerce',
                        };
                    },
                );
                build.onLoad(
                    { filter: /.*/, namespace: 'shared-commerce' },
                    ({ path }) => ({
                        contents: `export { ${sources
                            .get(path)
                            .map(({ name, alias }) => `${alias} as ${name}`)
                            .join(', ')} } from "./commerce.js";`,
                    }),
                );
                build.onResolve(
                    {
                        filter: /^\.\/commerce\.js$/,
                        namespace: 'shared-commerce',
                    },
                    () => ({ path: './commerce.js', external: true }),
                );
            },
        },
    };
}

export function assertNoSharedModules(commerce, card) {
    const included = (metafile) =>
        new Set(
            Object.values(metafile.outputs).flatMap(({ inputs }) =>
                Object.entries(inputs)
                    .filter(([, { bytesInOutput }]) => bytesInOutput > 0)
                    .map(([path]) => path),
            ),
        );
    const commerceModules = included(commerce);
    const duplicated = [...included(card)].filter((path) =>
        commerceModules.has(path),
    );
    if (duplicated.length) {
        throw new Error(
            `Modules bundled in both commerce.js and merch-card.js: ${duplicated.join(', ')}. Add their required exports to the shared commerce boundary in build.mjs.`,
        );
    }
}
