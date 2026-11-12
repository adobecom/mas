// Prints minified, gzip and brotli sizes of commerce.js (and the modules in it).
// Usage: node scripts/size-report.mjs [--check] [--modules]
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { commerceOptions, priceLiteralsBanner } from './bundles.mjs';

// Brotli (q11) byte budgets. Lower them whenever a change shrinks a bundle.
const BUDGETS = {
    'commerce.js': 39_600,
};

const brotli = (bytes) =>
    brotliCompressSync(bytes, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length;
const gzip = (bytes) => gzipSync(bytes, { level: 9 }).length;
const kb = (bytes) => `${(bytes / 1000).toFixed(1)} KB`.padStart(9);

const { metafile, outputFiles } = await build({
    ...commerceOptions,
    minify: true,
    metafile: true,
    write: false,
    outdir: 'dist',
});

const bannerSize = Buffer.byteLength(priceLiteralsBanner.js);
let failed = false;
console.log(
    'file                       minified      gzip    brotli    budget',
);
for (const { path, contents } of outputFiles) {
    if (!path.endsWith('.js')) continue;
    const name = path.split('/').pop();
    const size = brotli(contents);
    const budget = BUDGETS[name];
    const over = budget && size > budget;
    failed ||= over;
    console.log(
        `${name.padEnd(24)}${kb(contents.length)} ${kb(gzip(contents))} ${kb(size)} ${budget ? kb(budget) : ''.padStart(9)}${over ? '  OVER BUDGET' : ''}`,
    );
    if (name === 'commerce.js') {
        const code = contents.subarray(bannerSize);
        console.log(
            `${'  (without literals)'.padEnd(24)}${kb(code.length)} ${kb(gzip(code))} ${kb(brotli(code))}`,
        );
    }
}

if (process.argv.includes('--modules')) {
    for (const [file, { inputs }] of Object.entries(metafile.outputs)) {
        if (!file.endsWith('.js')) continue;
        console.log(`\n${file}`);
        Object.entries(inputs)
            .filter(([, { bytesInOutput }]) => bytesInOutput)
            .sort(([, a], [, b]) => b.bytesInOutput - a.bytesInOutput)
            .forEach(([input, { bytesInOutput }]) =>
                console.log(`${String(bytesInOutput).padStart(8)}  ${input}`),
            );
    }
}

if (failed && process.argv.includes('--check')) {
    console.error('\nBundle size budget exceeded (scripts/size-report.mjs).');
    process.exit(1);
}
