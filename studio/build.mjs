import { build } from 'esbuild';

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

await build({
    ...defaults,
    entryPoints: ['src/markdown.js'],
    outfile: 'libs/markdown.js',
});
