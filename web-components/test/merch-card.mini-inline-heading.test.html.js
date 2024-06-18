// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';

import { mockLana } from '/test/mocks/lana.js';
import { mockFetch } from '/test/mocks/fetch.js';
import { mockConfig } from '/test/mocks/config.js';

import { init } from '@wcms/commerce';

import '../src/merch-icon.js';
import '../src/merch-card.js';
import '../src/merch-offer.js';
import '../src/merch-offer-select.js';
import '../src/merch-quantity-select.js';

import { appendMiloStyles } from './utils.js';
import { mockIms } from './mocks/ims.js';

const skipTests = sessionStorage.getItem('skipTests');

runTests(async () => {
    mockIms();
    mockLana();
    await mockFetch();
    await init(mockConfig());
    if (skipTests !== null) {
        appendMiloStyles();
        return;
    }
    describe('merch-card web component with inline-heading(BACOM) variant', () => {});
});
