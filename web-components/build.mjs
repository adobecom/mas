import { writeFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { build, transform } from 'esbuild';

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
    plugins: [minifyCss()],
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
        plugins: [minifyCss(), rewriteImportsToLibsFolder()],
        outfile: `${outfolder}/merch-offer-select.js`,
    }),
    build({
        ...defaults,
        entryPoints: ['./src/merch-card-collection.js'],
        plugins: [minifyCss(), rewriteImportsToLibsFolder()],
        outfile: `${outfolder}/merch-card-collection.js`,
    }),
    build({
        ...defaults,
        entryPoints: ['./src/sidenav/merch-sidenav.js'],
        outfile: `${outfolder}/merch-sidenav.js`,
        plugins: [minifyCss(), rewriteImportsToLibsFolder()],
    }),
    build({
        ...defaults,
        entryPoints: ['./src/mas-field.js'],
        outfile: `${outfolder}/mas-field.js`,
    }),
    buildLitComponent('merch-card', [
        {
            name: 'external-commerce',
            setup(build) {
                build.onResolve(
                    {
                        filter: /^\.\.?\/commerce\.js$/,
                    },
                    () => ({ path: './commerce.js', external: true }),
                );
            },
        },
    ]),
    buildLitComponent('merch-card-collection'),
    buildLitComponent('merch-icon'),
    buildLitComponent('merch-quantity-select'),
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

async function buildLitComponent(name, plugins = []) {
    const { metafile } = await build({
        ...defaults,
        entryPoints: [`./src/${name}.js`],
        external: ['lit'],
        metafile: false,
        outfile: `${outfolder}/${name}.js`,
        plugins: [minifyCss(), rewriteImportsToLibsFolder(), ...plugins],
    });
    if (metafile) {
        writeFileSync(`${outfolder}/${name}.json`, JSON.stringify(metafile));
    }
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

// *.css.js modules export only CSS strings: bundle them without comments or whitespace.
function minifyCss() {
    return {
        name: 'minify-css',
        setup(build) {
            if (!build.initialOptions.minify) return;
            build.onLoad({ filter: /\.css\.js$/ }, async ({ path }) => {
                const styles = await import(pathToFileURL(path));
                let contents = '';
                for (const [name, css] of Object.entries(styles)) {
                    const { code } = await transform(css, {
                        loader: 'css',
                        minifyWhitespace: true,
                    });
                    contents += `export const ${name} = ${JSON.stringify(code.trim())};\n`;
                }
                return { contents };
            });
        },
    };
}
