import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { cssLoader } from './css-loader.mjs';

const outfolder = './dist';

// Note: minifyIdentifiers can differ between macOS arm64 and Linux x64.
// Always run this build on Linux (ubuntu-latest) before committing dist files.
const defaults = {
    bundle: true,
    format: 'esm',
    minify: !process.argv.includes('no-minify'),
    sourcemap: process.argv.includes('sourcemap'),
    platform: 'browser',
    target: ['es2020'],
    plugins: [cssLoader()],
};

// Read the price-literals.js file content
const priceLiteralsContent = readFileSync('./price-literals.json', 'utf-8');

// commerce.js
const { metafile } = await build({
    ...defaults,
    alias: {
        react: 'test/mocks/react.js',
    },
    entryPoints: ['./src/commerce.js'],
    outfile: `${outfolder}/commerce.js`,
    metafile: true,
    platform: 'browser',
    banner: {
        js: `window.masPriceLiterals = ${priceLiteralsContent}.data;`,
    },
});
writeFileSync(`commerce.json`, JSON.stringify(metafile));

// merch-card.js imports these modules from ./commerce.js instead of bundling
// its own copies, so the page loads and runs one instance of each.
const commerceModules = new Set(
    Object.keys(metafile.inputs).map((file) => resolve(file)),
);
const commerceExports = metafile.outputs['dist/commerce.js'].exports;

// mas.js
await build({
    ...defaults,
    entryPoints: ['./src/mas.js'],
    outfile: './dist/mas.js',
    banner: {
        js: `window.masPriceLiterals = ${priceLiteralsContent}.data;`,
    },
});

// web components
Promise.all([
    build({
        ...defaults,
        stdin: { contents: '' },
        inject: ['./src/merch-offer.js', './src/merch-offer-select.js'],
        plugins: [cssLoader(), rewriteImportsToLibsFolder()],
        outfile: `${outfolder}/merch-offer-select.js`,
    }),
    buildVanillaComponent('merch-card-collection'),
    buildVanillaComponent('merch-quantity-select'),
    build({
        ...defaults,
        entryPoints: ['./src/sidenav/merch-sidenav.js'],
        outfile: `${outfolder}/merch-sidenav.js`,
        plugins: [cssLoader(), rewriteImportsToLibsFolder()],
    }),
    build({
        ...defaults,
        entryPoints: ['./src/mas-field.js'],
        outfile: `${outfolder}/mas-field.js`,
    }),
    buildMerchCard(),
    buildLitComponent('merch-icon'),
    buildLitComponent('merch-secure-transaction'),
    buildLitComponent('merch-stock'),
    buildLitComponent('merch-whats-included'),
    buildLitComponent('merch-mnemonic-list'),
    buildLitComponent('mas-mnemonic'),
    buildLitComponent('mas-compare-chart'),
]).catch((error) => {
    console.error(error.message);
    process.exit(1);
});

async function buildLitComponent(name) {
    const { metafile } = await build({
        ...defaults,
        entryPoints: [`./src/${name}.js`],
        external: ['lit'],
        metafile: false,
        outfile: `${outfolder}/${name}.js`,
        plugins: [cssLoader(), rewriteImportsToLibsFolder()],
    });
    if (metafile) {
        writeFileSync(`${outfolder}/${name}.json`, JSON.stringify(metafile));
    }
}

async function buildVanillaComponent(name) {
    await build({
        ...defaults,
        entryPoints: [`./src/${name}.js`],
        outfile: `${outfolder}/${name}.js`,
        plugins: [cssLoader(), forbidLit(name)],
    });
}

async function buildMerchCard() {
    const outfile = `${outfolder}/merch-card.js`;
    await build({
        ...defaults,
        entryPoints: ['./src/merch-card.js'],
        outfile,
        plugins: [cssLoader(), forbidLit('merch-card'), importFromCommerce()],
    });
    const imported = [
        ...readFileSync(outfile, 'utf-8').matchAll(
            /import\s*\{([^}]*)\}\s*from\s*"\.\/commerce\.js"/g,
        ),
    ].flatMap(([, names]) =>
        names.split(',').map((name) => name.trim().split(/\s+as\s+/)[0]),
    );
    const missing = [...new Set(imported)].filter(
        (name) => !commerceExports.includes(name),
    );
    if (missing.length) {
        throw new Error(
            `merch-card.js imports ${missing.join(', ')} from ./commerce.js: export them from src/commerce.js`,
        );
    }
}

function importFromCommerce() {
    return {
        name: 'import-from-commerce',
        setup(build) {
            build.onResolve({ filter: /.*/ }, async (args) => {
                if (args.kind === 'entry-point' || args.pluginData?.resolved)
                    return;
                const { path } = await build.resolve(args.path, {
                    kind: args.kind,
                    importer: args.importer,
                    resolveDir: args.resolveDir,
                    pluginData: { resolved: true },
                });
                if (!commerceModules.has(path)) return;
                return { path: './commerce.js', external: true };
            });
        },
    };
}

function forbidLit(name) {
    return {
        name: 'forbid-lit',
        setup(build) {
            build.onResolve({ filter: /^lit(\/.*)?$/ }, ({ importer }) => ({
                errors: [
                    {
                        text: `${importer} imports lit: ${name}.js must stay Lit-free`,
                    },
                ],
            }));
        },
    };
}

function rewriteImportsToLibsFolder() {
    return {
        name: 'rewrite-imports-to-libs-folder',
        setup(build) {
            build.onResolve({ filter: /^lit(\/.*)?$/ }, () => {
                return {
                    path: './lit-all.min.js',
                    external: true,
                };
            });
        },
    };
}
