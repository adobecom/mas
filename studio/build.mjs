import { build } from 'esbuild';

build({
    entryPoints: ['src/swc.js'],
    format: 'esm',
    bundle: true,
    outfile: 'lib/swc.js',
    sourcemap: true,
    define: {
        'process.env.NODE_ENV': '"production"',
    },
}).catch(() => process.exit(1));

build({
    entryPoints: ['src/studio.js'],
    format: 'esm',
    bundle: true,
    outfile: 'lib/studio.js',
    sourcemap: true,
    define: {
        'process.env.NODE_ENV': '"production"',
    },
}).catch(() => process.exit(1));
