import { build } from 'esbuild';

const defaults = {
    alias: { react: '../mocks/react.js' },
    bundle: true,
    define: { 'process.env.NODE_ENV': '"production"' },
    external: [],
    format: 'esm',
    minify: false,
    platform: 'browser',
    sourcemap: true,
    target: ['es2020'],
};

await build({
    ...defaults,
    minify: true,
    entryPoints: ['src/swc.js'],
    outfile: 'libs/swc.js',
});

await build({
    ...defaults,
    entryPoints: ['src/aem/index.js'],
    outfile: 'libs/aem.js',
});
