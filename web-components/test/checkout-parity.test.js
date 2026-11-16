import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { buildCheckoutUrl } from '../src/buildCheckoutUrl.js';
import { Checkout } from '../src/checkout.js';
import { urlCases, offerCases } from '../../checkout/test/fixtures/cases.js';
import { buildCheckoutUrl as buildSharedUrl } from '../../checkout/src/buildCheckoutUrl.js';
import {
    resolveCheckoutData,
    resolveCheckoutIntent,
} from '../../checkout/src/checkout.js';

describe('shared checkout Node/Chrome parity', () => {
    let nodeResults;

    before(async () => {
        nodeResults = await (await fetch('/node-checkout-results')).json();
    });

    for (const { id, data, pageContext, expected } of urlCases) {
        it(`matches the Node and golden URL for ${id}`, () => {
            const url = buildSharedUrl(data, pageContext);
            expect(url).to.equal(expected);
            expect(url).to.equal(nodeResults.urls[id]);
        });
    }

    for (const { id, offers, options, expected, intent } of offerCases) {
        it(`matches the Node and golden checkout for ${id}`, () => {
            const result = {
                url: buildSharedUrl(
                    resolveCheckoutData(offers, options, {
                        landscape: 'published',
                    }),
                ),
                intent: resolveCheckoutIntent(offers[0]),
            };
            expect(result).to.deep.equal({ url: expected, intent });
            expect(result).to.deep.equal(nodeResults.offers[id]);
        });
    }
});

describe('checkout golden fixtures', () => {
    let originalUrl;
    let parentStub;

    beforeEach(() => {
        originalUrl = window.location.href;
    });

    afterEach(() => {
        parentStub?.restore();
        parentStub = undefined;
        window.history.replaceState({}, '', originalUrl);
    });

    for (const { id, data, pageContext = {}, expected } of urlCases) {
        it(`preserves the browser URL for ${id}`, () => {
            const { search = '', pathnames = ['/us/products/foo'] } =
                pageContext;
            window.history.replaceState({}, '', pathnames[0] + search);
            parentStub = sinon
                .stub(window, 'parent')
                .value(
                    pathnames.length > 1
                        ? { location: { pathname: pathnames[1] } }
                        : window,
                );
            expect(buildCheckoutUrl(data)).to.equal(expected);
        });
    }

    for (const { id, offers, options, expected } of offerCases) {
        it(`preserves the service URL for ${id}`, () => {
            window.history.replaceState({}, '', '/us/products/foo');
            const service = Checkout({
                settings: { ...options, landscape: 'published' },
            });
            expect(service.buildCheckoutURL(offers, {})).to.equal(expected);
        });
    }
});
