import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
    files: 'test/**/*.test.js',
    nodeResolve: true,
    plugins: [esbuildPlugin({ js: true, define: { 'process.env.NODE_ENV': '"production"' } })],
    testRunnerHtml: (testFramework) =>
        `<html>
            <body>
                <script>window.process = { env: { NODE_ENV: 'production' } };</script>
                <script type="module" src="${testFramework}"></script>
            </body>
        </html>`,
};
