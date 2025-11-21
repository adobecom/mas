import { chromeLauncher } from '@web/test-runner-chrome';
import { importMapsPlugin } from '@web/dev-server-import-maps';

const testRunnerHtml = (testFramework) => `
  <html>
  <head>
    <script type="module">
        window.process = { env: {} };
        window.__swc = { warn: () => {} };
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
    middleware: [
        async (ctx, next) => {
            if (ctx.path.startsWith('/test/mocks/adobe/sites')) {
                ctx.set('Content-Type', 'application/json');
            }
            await next();
            ctx.set('Access-Control-Allow-Credentials', true);
            ctx.set('Access-Control-Allow-Origin', '*');
        },
    ],
    plugins: [
        importMapsPlugin({
            inject: {
                importMap: {
                    imports: {
                        react: '/test/mocks/react.js',
                        '@pandora/fetch': '/test/mocks/pandora-fetch.js',
                        'fragment-client': '/libs/fragment-client.js',
                    },
                },
            },
        }),
    ],
    nodeResolve: true,
    port: 2023,
    testRunnerHtml,
};
