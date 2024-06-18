import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import { mockLana } from '/test/mocks/lana.js';
import { mockFetch } from '/test/mocks/fetch.js';
import { mockConfig } from '/test/mocks/config.js';

import { init } from '@wcms/commerce';

import './utils.js';

const shouldSkipTests = sessionStorage.getItem('skipTests') ?? false;

runTests(async () => {
    mockLana();
    await mockFetch();
    await init(mockConfig());
    if (shouldSkipTests !== 'true') {
        describe('plans-modal web component', () => {
            it('should fail', async () => {
                expect(true).to.equal(true);
            });
        });
    }
});
