import { importMapsPlugin } from '@web/dev-server-import-maps';
import { defaultReporter } from '@web/test-runner';
import { chromeLauncher } from '@web/test-runner-chrome';
import { fromRollup } from '@web/dev-server-rollup';
import rollupResolve from '@rollup/plugin-node-resolve';

const nodeResolvePlugin = fromRollup(rollupResolve);

export default {
    browsers: [
        chromeLauncher({
            launchOptions: { args: ['--no-sandbox'] },
        }),
    ],
    coverageConfig: {
        include: ['src/**'],
        exclude: [
            'test/mocks/**',
            'test/**',
            '**/node_modules/**',
            'src/bodyScrollLock.js', // todo
            'src/ merch-whats-included.js', // on hold
        ],
        threshold: {
            // TODO bump to 100%
            branches: 85,
            functions: 65,
            statements: 85,
            lines: 85,
        },
    },
    debug: false,
    files: ['test/**/*.test.(js|html)'],
    nodeResolve: {
        exportConditions: ['node', 'development'],
        preferBuiltins: false,
        extensions: ['.js', '.mjs', '.json', '.node'],
    },
    mimeTypes: {
        '**/*.snap': 'html',
    },
    testFramework: {
        config: {
            timeout: 10000, // timeout in milliseconds
        },
    },
    plugins: [
        nodeResolvePlugin({
            moduleDirectories: ['node_modules'],
            rootDir: process.cwd(),
        }),
        importMapsPlugin({
            inject: {
                importMap: {
                    imports: {
                        react: '/test/mocks/react.js',
                        '@pandora/fetch': '/test/mocks/pandora-fetch.js',
                    },
                },
            },
        }),
    ],
    port: 2023,
    reporters: [
        defaultReporter({ reportTestResults: true, reportTestProgress: true }),
    ],
};
