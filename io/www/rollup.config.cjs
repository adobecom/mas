const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const terser = require('@rollup/plugin-terser');
const json = require('@rollup/plugin-json');
const path = require('path');

module.exports = {
    input: 'src/fragment-client.js',
    output: {
        file: path.resolve(__dirname, '../../studio/libs/fragment-client.js'),
        format: 'es',
        name: 'fragmentClient',
        sourcemap: true,
    },
    plugins: [
        json(),
        resolve({
            // Resolve CommonJS modules
            preferBuiltins: false,
            browser: true, // Use browser field in package.json
        }),
        commonjs({
            // Convert CommonJS to ES modules
            include: ['node_modules/**', 'src/fragment/**'],
            transformMixedEsModules: true,
            // Exclude Node.js built-ins
            exclude: ['stream', 'zlib', 'http', 'https', 'util'],
            // Ensure we include all dependencies
            requireReturnsDefault: 'auto',
        }),
        terser(),
    ],
    // Mark Node.js built-ins as external
    external: ['stream', 'zlib', 'http', 'https', 'util'],
};
