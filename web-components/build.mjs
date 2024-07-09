import { writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { execSync } from 'node:child_process';

// Get the current commit hash
const commitHash = execSync('git rev-parse HEAD').toString().trim();
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

console.log(`you're building from branch ${branch} with commit ${commitHash}`);

const banner = {
    js: `// branch: ${branch} commit: ${commitHash} ${new Date().toUTCString()}`,
};

async function buildLitComponent(name) {
    const { metafile } = await build({
        banner,
        bundle: true,
        entryPoints: [`./src/${name}.js`],
        external: ['lit'],
        format: 'esm',
        metafile: true,
        minify: true,
        platform: 'browser',
        outfile: `../libs/${name}.js`,
        plugins: [rewriteImports()],
        sourcemap: true,
    });

    writeFileSync(`../libs/${name}.json`, JSON.stringify(metafile));
}

Promise.all([
    build({
        banner,
        bundle: true,
        format: 'esm',
        entryPoints: ['./src/merch-card-all.js'],
        minify: true,
        outfile: '../libs/merch-card-all.js',
        sourcemap: true,
    }),
    build({
        banner,
        bundle: true,
        stdin: { contents: '' },
        inject: [
            './src/merch-card.js',
            './src/merch-icon.js',
            './src/merch-datasource.js',
        ],
        format: 'esm',
        minify: true,
        outfile: '../libs/merch-card.js',
        sourcemap: true,
        plugins: [rewriteImports()],
    }),
    build({
        banner,
        bundle: true,
        stdin: { contents: '' },
        inject: ['./src/merch-offer.js', './src/merch-offer-select.js'],
        format: 'esm',
        minify: true,
        outfile: '../libs/merch-offer-select.js',
        sourcemap: true,
        plugins: [rewriteImports()],
    }),
    build({
        banner,
        bundle: true,
        entryPoints: ['./src/merch-card-collection.js'],
        format: 'esm',
        minify: true,
        plugins: [rewriteImports()],
        outfile: '../libs/merch-card-collection.js',
    }),
    build({
        banner,
        bundle: true,
        entryPoints: ['./src/plans-modal.js'],
        format: 'esm',
        plugins: [rewriteImports()],
        outfile: '../libs/plans-modal.js',
    }),
    build({
        entryPoints: ['./src/sidenav/merch-sidenav.js'],
        bundle: true,
        banner,
        outfile: '../libs/merch-sidenav.js',
        format: 'esm',
        plugins: [rewriteImports()],
        external: ['lit'],
    }),
    build({
        entryPoints: ['./src/merch-twp-d2p.js'],
        bundle: true,
        banner,
        outfile: './lib/merch-twp-d2p.js',
        format: 'esm',
        plugins: [rewriteImports()],
        external: ['lit'],
    }),
    build({
        entryPoints: ['./src/merch-whats-included.js'],
        bundle: true,
        banner,
        outfile: './lib/merch-whats-included.js',
        format: 'esm',
        plugins: [rewriteImports()],
        external: ['lit'],
    }),
    build({
        entryPoints: ['./src/merch-mnemonic-list.js'],
        bundle: true,
        banner,
        outfile: './lib/merch-mnemonic-list.js',
        format: 'esm',
        plugins: [rewriteImports()],
        external: ['lit'],
    }),
    buildLitComponent('merch-icon'),
    buildLitComponent('merch-quantity-select'),
    buildLitComponent('merch-secure-transaction'),
    buildLitComponent('merch-stock'),
    buildLitComponent('merch-subscription-panel'),
    buildLitComponent('merch-twp-d2p'),
    buildLitComponent('merch-whats-included'),
    buildLitComponent('merch-mnemonic-list'),
]).catch(() => process.exit(1));

function rewriteImports(rew) {
    return {
        name: 'rewrite-imports',
        setup(build) {
            build.onResolve({ filter: /^lit(\/.*)?$/ }, (args) => {
                return {
                    path: '/libs/deps/lit-all.min.js',
                    external: true,
                };
            });
        },
    };
}
