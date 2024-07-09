import { chromeLauncher } from '@web/test-runner-chrome';
import { importMapsPlugin } from '@web/dev-server-import-maps';

const testRunnerHtml = (testFramework) => `
  <html>
  <head>
    <script type="module">
        window.process = { env: {} };
    </script>
  </head>
  <body>
    <script type='module' src='${testFramework}'></script>
  </body>
</html>
`;

export default {
    browsers: [
        chromeLauncher({
            launchOptions: { args: ['--no-sandbox'] },
        }),
    ],
    coverageConfig: {
        include: ['src/**'],
        exclude: ['test/mocks/**', 'test/**', '**/node_modules/**'],
    },
    files: ['test/**/*.test.(js|html)'],
    plugins: [
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
    nodeResolve: true,
    port: 2023,
    testRunnerHtml,
};
