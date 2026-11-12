import { writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { cssLoader } from './css-loader.mjs';
import {
    assertCommerceImports,
    buildSatellites,
    commerceGraph,
    commerceOptions,
    defaults as bundleDefaults,
    importFromCommerce,
    priceLiteralsBanner,
    satellites,
} from './scripts/bundles.mjs';

const outfolder = './dist';

// Note: minifyIdentifiers can differ between macOS arm64 and Linux x64.
// Always run this build on Linux (ubuntu-latest) before committing dist files.
const defaults = {
    ...bundleDefaults,
    minify: !process.argv.includes('no-minify'),
    sourcemap: process.argv.includes('sourcemap'),
};

const satelliteNames = new Set();

// commerce.js
const { metafile } = await build({
    ...commerceOptions,
    ...defaults,
    outfile: `${outfolder}/commerce.js`,
    metafile: true,
    plugins: [cssLoader(), satellites(satelliteNames)],
});
writeFileSync(`commerce.json`, JSON.stringify(metafile));

// merch-card.js and the satellites import these modules from ./commerce.js
// instead of bundling their own copies.
const graph = commerceGraph(metafile);

// mas.js (Studio) inlines the satellites
await build({
    ...defaults,
    entryPoints: ['./src/mas.js'],
    outfile: './dist/mas.js',
    banner: priceLiteralsBanner,
});

// Template bundles. A page loads merch-card.js and, in parallel, the bundle its
// URL rule names (MERCH_CARD_TEMPLATE_RULES in Milo libs/utils/utils.js). A template can be in several
// bundles. The headless family is in merch-card.js itself, not in a bundle.
// Keep src/templates/README.md in sync.
const TEMPLATE_BUNDLES = {
    dc: ['pro', 'compare-chart-column'],
    catalog: ['catalog'],
    cc: [
        'plans',
        'plans-v2',
        'pro',
        'segment',
        'special-offers',
        'product',
        'product-c2',
        'product-pricing',
        'mini-compare-chart',
        'mini-compare-chart-mweb',
        'image',
        'media',
        'compare-chart-column',
        'inline-heading',
    ],
    firefly: ['pro'],
    express: [
        'simplified-pricing-express',
        'full-pricing-express',
        'compare-chart-column',
    ],
    // Apps that load mas.js today; built for when they opt in.
    ah: ['ah-try-buy-widget', 'ah-promoted-plans', 'mini'],
    ccd: ['ccd-slice', 'ccd-suggested', 'mini'],
    bc: ['brand-concierge-product'],
    aup: ['fries'],
};

// web components
Promise.all([
    ...Object.entries(TEMPLATE_BUNDLES).map(([bundle, files]) =>
        buildTemplateBundle(bundle, files),
    ),
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
        plugins: [cssLoader(), satellites(satelliteNames)],
    }).then(() => buildSatellites(satelliteNames, defaults, graph)),
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
        plugins: [
            cssLoader(),
            forbidLit('merch-card'),
            importFromCommerce(graph),
        ],
    });
    assertCommerceImports(
        'merch-card.js',
        readFileSync(outfile, 'utf-8'),
        graph,
    );
}

// A bundle registers its template files once merch-card is defined, so it can
// load before or after merch-card.js. Template files import nothing: merch-card
// injects their dependencies (src/template-deps.js).
async function buildTemplateBundle(bundle, files) {
    const imports = files.map(
        (file, index) =>
            `import { define as t${index} } from './src/templates/${file}.js';`,
    );
    const defines = files.map((_, index) => `t${index}`).join(', ');
    await build({
        ...defaults,
        stdin: {
            contents: `${imports.join('\n')}
customElements.whenDefined('merch-card').then((MerchCard) => {
    for (const define of [${defines}]) MerchCard.registerTemplates(define);
});`,
            resolveDir: '.',
            sourcefile: `templates/${bundle}.js`,
        },
        outfile: `${outfolder}/templates/${bundle}.js`,
        plugins: [cssLoader(), templatesImportNothing(bundle)],
    });
}

function templatesImportNothing(bundle) {
    return {
        name: 'templates-import-nothing',
        setup(build) {
            const entry = resolve(`templates/${bundle}.js`);
            build.onResolve({ filter: /.*/ }, ({ path, importer }) => {
                if (importer === entry) return;
                return {
                    errors: [
                        {
                            text: `${importer} imports ${path}: template files must not import; add what they need to src/template-deps.js`,
                        },
                    ],
                };
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
