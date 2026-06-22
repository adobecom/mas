import { build } from 'esbuild';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const defaults = {
    alias: { react: '../mocks/react.js' },
    bundle: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    external: [],
    format: 'esm',
    minify: true,
    platform: 'browser',
    sourcemap: true,
    target: ['es2020'],
};

await build({
    ...defaults,
    entryPoints: ['src/swc.js'],
    outfile: 'libs/swc.js',
});

await build({
    ...defaults,
    entryPoints: ['src/rte/prosemirror.js'],
    outfile: 'libs/prosemirror.js',
});

await build({
    ...defaults,
    entryPoints: ['src/spectrum.css.js'],
    outfile: 'libs/spectrum.js',
});

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('node', ['studio/design-system/scripts/sync.js'], {
    stdio: 'inherit',
    cwd: repoRoot,
});
