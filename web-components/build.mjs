import { writeFileSync, readFileSync } from 'node:fs';
import { build } from 'esbuild';
import {
    assertNoSharedModules,
    createSharedCommerce,
} from './build/shared-commerce.mjs';

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
};

// Read the price-literals.js file content
const priceLiteralsContent = readFileSync('./price-literals.json', 'utf-8');

const sharedCommerce = createSharedCommerce({
    resolveDir: process.cwd(),
    entryPoint: './src/commerce.js',
    modules: {
        constants: {
            source: './src/constants.js',
            exports: [
                'EVENT_AEM_ERROR',
                'EVENT_AEM_LOAD',
                'EVENT_MAS_ERROR',
                'EVENT_MAS_READY',
                'EVENT_MERCH_ADDON_AND_QUANTITY_UPDATE',
                'EVENT_MERCH_CARD_ACTION_MENU_TOGGLE',
                'EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED',
                'EVENT_MERCH_CARD_QUANTITY_CHANGE',
                'EVENT_MERCH_OFFER_SELECT_READY',
                'EVENT_MERCH_QUANTITY_SELECTOR_CHANGE',
                'EVENT_TYPE_RESOLVED',
                'FF_DEFAULTS',
                'HEADLESS_STYLE_CTA_VARIANTS',
                'MARK_DURATION_SUFFIX',
                'MARK_START_SUFFIX',
                'MERCH_CARD_LOAD_TIMEOUT',
                'SELECTOR_MAS_CHECKOUT_LINK',
                'SELECTOR_MAS_ELEMENT',
                'SELECTOR_MAS_INLINE_PRICE',
                'TEMPLATE_PRICE_LEGAL',
                'TRIAL_ANALYTICS_IDS',
                'TRIAL_TO_BUY_CTA_ANALYTICS_IDS',
            ],
        },
        utils: {
            source: './src/utils.js',
            exports: [
                'clearForegroundTimeout',
                'createTag',
                'debounce',
                'getHeadlessCtaVariant',
                'getOuterHeight',
                'getService',
                'hydrateHeadlessCta',
                'isMobileOrTablet',
                'printMeasure',
                'setForegroundTimeout',
                'toRelativeAssetUrl',
            ],
        },
        masElement: {
            source: './src/mas-element.js',
            exports: ['createMasElement'],
        },
        utilities: {
            source: './src/utilities.js',
            exports: ['toPromotionCodes'],
        },
        uptLink: {
            source: './src/upt-link.js',
            exports: ['UptLink'],
        },
        imageMarkup: {
            source: './src/image-markup.js',
            exports: [
                'extractBackgroundUrl',
                'rewriteImageUrlsForProd',
                'sanitizePictureMarkup',
            ],
        },
        planType: {
            source: './src/plan-type-text.js',
            exports: ['hostOsi'],
        },
        context: {
            source: './src/mas-context.js',
            exports: [
                'applyContextPromotionCode',
                'applyDisplayAnnualDefault',
                'applyHideStPriceLabels',
                'mergePriceLiterals',
                'registerContextOptionsProviders',
            ],
        },
        log: {
            source: './src/log.js',
            exports: ['Log'],
        },
    },
});

// Link both sides before replacing either published bundle.
const commerce = await build({
    ...defaults,
    alias: {
        react: 'test/mocks/react.js',
    },
    stdin: sharedCommerce.entry,
    outfile: `${outfolder}/commerce.js`,
    metafile: true,
    write: false,
    platform: 'browser',
    banner: {
        js: `window.masPriceLiterals = ${priceLiteralsContent}.data;`,
    },
});
const card = await build({
    ...defaults,
    entryPoints: ['./src/merch-card.js'],
    outfile: `${outfolder}/merch-card.js`,
    metafile: true,
    write: false,
    plugins: [rewriteImportsToLibsFolder(), sharedCommerce.plugin],
});
assertNoSharedModules(commerce.metafile, card.metafile);
for (const file of [...commerce.outputFiles, ...card.outputFiles]) {
    writeFileSync(file.path, file.contents);
}
writeFileSync('commerce.json', JSON.stringify(commerce.metafile));
writeFileSync('merch-card.json', JSON.stringify(card.metafile));

// mas.js
await build({
    ...defaults,
    entryPoints: ['./src/mas.js'],
    outfile: './dist/mas.js',
    plugins: [],
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
        plugins: [rewriteImportsToLibsFolder()],
        outfile: `${outfolder}/merch-offer-select.js`,
    }),
    build({
        ...defaults,
        entryPoints: ['./src/merch-card-collection.js'],
        plugins: [rewriteImportsToLibsFolder()],
        outfile: `${outfolder}/merch-card-collection.js`,
    }),
    build({
        ...defaults,
        entryPoints: ['./src/sidenav/merch-sidenav.js'],
        outfile: `${outfolder}/merch-sidenav.js`,
        plugins: [rewriteImportsToLibsFolder()],
    }),
    build({
        ...defaults,
        entryPoints: ['./src/mas-field.js'],
        outfile: `${outfolder}/mas-field.js`,
    }),
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

async function buildLitComponent(name) {
    const { metafile } = await build({
        ...defaults,
        entryPoints: [`./src/${name}.js`],
        external: ['lit'],
        metafile: false,
        outfile: `${outfolder}/${name}.js`,
        plugins: [rewriteImportsToLibsFolder()],
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
