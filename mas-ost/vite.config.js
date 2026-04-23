import { defineConfig } from 'vite';
import { resolve } from 'path';

// Plugin to guard customElements.define calls in SWC dependencies
function safeDefinePlugin() {
    return {
        name: 'safe-custom-elements-define',
        transform(code, id) {
            if (code.includes('customElements.define(')) {
                // Guard all customElements.define calls
                let result = code.replace(
                    /customElements\.define\((['"])([^'"]+)\1,\s*(\w+)\)/g,
                    '(customElements.get($1$2$1)||customElements.define($1$2$1,$3))'
                );
                // Guard variable names: customElements.define(e,t)
                result = result.replace(
                    /customElements\.define\((\w+),\s*(\w+)\)/g,
                    '(customElements.get($1)||customElements.define($1,$2))'
                );
                return result !== code ? result : null;
            }
            return null;
        },
    };
}

// Esbuild plugin for pre-bundling: guard ALL customElements.define calls
function safeDefineEsbuildPlugin() {
    return {
        name: 'safe-define',
        setup(build) {
            build.onLoad({ filter: /spectrum-web-components.*\.js$/ }, async (args) => {
                const fs = await import('fs');
                let contents = fs.readFileSync(args.path, 'utf8');
                if (contents.includes('customElements.define(')) {
                    // Guard string-literal names
                    contents = contents.replace(
                        /customElements\.define\("([^"]+)",\s*(\w+)\)/g,
                        '(customElements.get("$1") || customElements.define("$1", $2))'
                    );
                    // Guard variable names (defineElement helper)
                    contents = contents.replace(
                        /customElements\.define\((\w+),\s*(\w+)\)/g,
                        '(customElements.get($1) || customElements.define($1, $2))'
                    );
                }
                return { contents, loader: 'js' };
            });
        },
    };
}

export default defineConfig(({ mode }) => {
    const isGlobal = mode === 'global';

    return {
        define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
        },
        plugins: [safeDefinePlugin()],
        optimizeDeps: {
            esbuildOptions: {
                plugins: [safeDefineEsbuildPlugin()],
            },
            force: true,
        },
        build: {
            lib: {
                entry: resolve(__dirname, isGlobal ? 'src/global.js' : 'src/index.js'),
                name: isGlobal ? 'ost' : 'MasOst',
                formats: isGlobal ? ['iife'] : ['es'],
                fileName: (format) => isGlobal ? 'mas-ost.iife.js' : 'mas-ost.es.js',
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
