// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import '../src/swc.js';
import '../src/studio.js';

import { mockFetch } from './mocks/fetch.js';
import { withAem } from './mocks/aem.js';
import { withWcs } from './mocks/wcs.js';

import mas from './mocks/mas.js?features=merch-card';
import { getTemplateContent } from '@adobe/mas-commons/test/utils.js';

runTests(async () => {
    await mockFetch(withAem, withWcs);
    await mas();

    describe('M@S Studio', () => {
        it('should render', () => {
            const [studio] = getTemplateContent('studio');
            document.querySelector('main').append(studio);
            expect(studio).exist;
        });
    });
});
