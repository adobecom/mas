import { chromeLauncher } from '@web/test-runner-chrome';
import { createNodeResults, createNodeOfferResults } from './test/node-results.js';

process.env.TZ = 'UTC';
const results = createNodeResults();
const offerResults = createNodeOfferResults();

export default {
    files: ['test/browser/**/*.test.js'],
    nodeResolve: true,
    browsers: [chromeLauncher({ launchOptions: { args: ['--no-sandbox'] } })],
    middleware: [
        async (context, next) => {
            if (context.path === '/node-price-results') {
                context.type = 'application/json';
                context.body = JSON.stringify(results);
                return;
            }
            if (context.path === '/node-offer-results') {
                context.type = 'application/json';
                context.body = JSON.stringify(offerResults);
                return;
            }
            await next();
        },
    ],
};
