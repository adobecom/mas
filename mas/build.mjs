import { build } from 'esbuild';
import fs from 'node:fs';

import { execSync } from 'node:child_process';

// Get the current commit hash
const commitHash = execSync('git rev-parse HEAD').toString().trim();
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
console.log(`you're building from branch ${branch} with commit ${commitHash}`);
const params = process.argv.slice(2);
const banner = params.includes('skipBanner') ? {} : {
    js: `// branch: ${branch} commit: ${commitHash} ${new Date().toUTCString()}`,
};

const { metafile } = await build({
    alias: {
        react: '../mocks/react.js',
    },
    banner,
    bundle: true,
    entryPoints: ['./src/mas.js'],
    format: 'esm',
    metafile: true,
    minify: true,
    sourcemap: true,
    outfile: '../mas.js',
    platform: 'browser',
    target: ['es2020'],
});

fs.writeFileSync('stats.json', JSON.stringify(metafile));
