// Prints minified, gzip and brotli sizes of commerce.js, its lazy satellites
// and (with --modules) the modules in each file.
// Usage: node scripts/size-report.mjs [--check] [--modules]
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import {
    buildSatellites,
    commerceOptions,
    priceLiteralsBanner,
    satellites,
} from './bundles.mjs';

// Brotli (q11) byte budgets. Lower them whenever a change shrinks a bundle.
const BUDGETS = {
    'commerce.js': 36_900,
};

const brotli = (bytes) =>
    brotliCompressSync(bytes, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length;
const gzip = (bytes) => gzipSync(bytes, { level: 9 }).length;
const kb = (bytes) => `${(bytes / 1000).toFixed(1)} KB`.padStart(9);
const row = (name, bytes, budget) =>
    `${name.padEnd(26)}${kb(bytes.length)} ${kb(gzip(bytes))} ${kb(brotli(bytes))} ${budget ? kb(budget) : ''}`;

const options = { minify: true, metafile: true, write: false };
const names = new Set();
const results = [
    await build({
        ...commerceOptions,
        ...options,
        outfile: './dist/commerce.js',
        plugins: [satellites(names)],
    }),
    ...(await buildSatellites(names, options)),
];

let failed = false;
console.log(
    'file                        minified      gzip    brotli    budget',
);
for (const { outputFiles } of results) {
    for (const { path, contents } of outputFiles) {
        const name = path.split('/').pop();
        const budget = BUDGETS[name];
        const over = budget && brotli(contents) > budget;
        failed ||= over;
        console.log(
            `${row(name, contents, budget)}${over ? '  OVER BUDGET' : ''}`,
        );
        if (name !== 'commerce.js') continue;
        const code = contents.subarray(
            Buffer.byteLength(priceLiteralsBanner.js),
        );
        console.log(row('  (without literals)', code));
    }
}

if (process.argv.includes('--modules')) {
    for (const { metafile } of results) {
        for (const [file, { inputs }] of Object.entries(metafile.outputs)) {
            console.log(`\n${file}`);
            Object.entries(inputs)
                .filter(([, { bytesInOutput }]) => bytesInOutput)
                .sort(([, a], [, b]) => b.bytesInOutput - a.bytesInOutput)
                .forEach(([input, { bytesInOutput }]) =>
                    console.log(
                        `${String(bytesInOutput).padStart(8)}  ${input}`,
                    ),
                );
        }
    }
}

if (failed && process.argv.includes('--check')) {
    console.error('\nBundle size budget exceeded (scripts/size-report.mjs).');
    process.exit(1);
}
