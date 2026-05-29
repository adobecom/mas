import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
    const isGlobal = mode === 'global';

    return {
        define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        },
        build: {
            lib: {
                entry: resolve(__dirname, isGlobal ? 'src/global.js' : 'src/index.js'),
                name: isGlobal ? 'ost' : 'Ost',
                formats: isGlobal ? ['iife'] : ['es'],
                fileName: (format) => (isGlobal ? 'ost.iife.js' : 'ost.es.js'),
            },
            outDir: 'dist',
            emptyOutDir: !isGlobal,
            rollupOptions: {
                output: {
                    inlineDynamicImports: true,
                },
            },
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
            },
        },
        server: {
            host: 'local.adobe.com',
            port: 9010,
            cors: true,
        },
    };
});
