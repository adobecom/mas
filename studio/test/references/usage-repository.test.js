import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
    DOMINANT_REGION_SHARE,
    GLOBAL_REGION,
    fetchFragmentUsage,
    formatCountries,
    groupPagesByRegion,
    parseUsageResponse,
    resolveRegion,
    canFetchFragmentUsage,
} from '../../src/references/usage-repository.js';

const FRAGMENT_ID = '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4';

function payload(overrides = {}) {
    return {
        available: true,
        updatedAt: '2026-09-17T12:00:00.000Z',
        pages: [{ url: 'https://www.adobe.com/express/', requests: 70, countries: { US: 60, CA: 10 } }],
        ...overrides,
    };
}

function jsonResponse(body, ok = true) {
    return { ok, json: async () => body };
}

describe('usage-repository', () => {
    describe('resolveRegion', () => {
        it('files a page under the region that holds nearly all of its traffic', () => {
            expect(resolveRegion({ US: 95, JP: 5 })).to.equal('LATAM/Americas');
        });

        it('calls a page Global when no region reaches the dominant share', () => {
            expect(resolveRegion({ US: 50, JP: 50 })).to.equal(GLOBAL_REGION);
        });

        it('files a page at exactly the dominant share under that region', () => {
            const dominant = DOMINANT_REGION_SHARE * 100;
            expect(resolveRegion({ GB: dominant, JP: 100 - dominant })).to.equal('EMEA');
        });

        it('lets unmapped countries push a page toward Global rather than voting for a region', () => {
            expect(resolveRegion({ US: 70, DZ: 30 })).to.equal(GLOBAL_REGION);
        });

        it('accepts lower-cased country codes', () => {
            expect(resolveRegion({ us: 100 })).to.equal('LATAM/Americas');
        });

        it('ignores zero and negative counts', () => {
            expect(resolveRegion({ US: 100, JP: 0, KR: -5 })).to.equal('LATAM/Americas');
        });

        it('is Global when there is no traffic at all', () => {
            expect(resolveRegion({})).to.equal(GLOBAL_REGION);
            expect(resolveRegion(undefined)).to.equal(GLOBAL_REGION);
        });
    });

    describe('formatCountries', () => {
        it('lists the busiest country first', () => {
            expect(formatCountries({ CA: 5, US: 50, JP: 20 })).to.deep.equal(['us', 'jp', 'ca']);
        });

        it('renders GB as uk, the name every other Adobe surface uses', () => {
            expect(formatCountries({ GB: 5 })).to.deep.equal(['uk']);
        });

        it('breaks ties by country code so the order is stable between renders', () => {
            expect(formatCountries({ MX: 5, BR: 5 })).to.deep.equal(['br', 'mx']);
        });

        it('drops countries with no requests', () => {
            expect(formatCountries({ US: 5, JP: 0 })).to.deep.equal(['us']);
        });

        it('returns an empty list when there are no countries', () => {
            expect(formatCountries(undefined)).to.deep.equal([]);
        });
    });

    describe('groupPagesByRegion', () => {
        const pages = [
            { url: 'a', region: 'EMEA' },
            { url: 'b', region: GLOBAL_REGION },
            { url: 'c', region: 'EMEA' },
        ];

        it('lists Global first, then the locale picker order', () => {
            expect(groupPagesByRegion(pages).map((group) => group.region)).to.deep.equal([GLOBAL_REGION, 'EMEA']);
        });

        it('keeps every page of a region together', () => {
            const emea = groupPagesByRegion(pages).find((group) => group.region === 'EMEA');
            expect(emea.pages.map((page) => page.url)).to.deep.equal(['a', 'c']);
        });

        it('omits regions with no pages rather than showing an empty count line', () => {
            expect(groupPagesByRegion([{ region: 'JAPAC' }]).map((group) => group.region)).to.deep.equal(['JAPAC']);
        });

        it('returns nothing when there are no pages', () => {
            expect(groupPagesByRegion(undefined)).to.deep.equal([]);
            expect(groupPagesByRegion([])).to.deep.equal([]);
        });
    });

    describe('parseUsageResponse', () => {
        it('normalises a well-formed payload', () => {
            const result = parseUsageResponse(payload());
            expect(result.available).to.equal(true);
            expect(result.updatedAt).to.equal('2026-09-17T12:00:00.000Z');
            expect(result.pages).to.have.lengthOf(1);
        });

        it('treats a payload without available:true as unavailable', () => {
            expect(parseUsageResponse({ pages: [] }).available).to.equal(false);
            expect(parseUsageResponse(null).available).to.equal(false);
        });

        it('reports a null updatedAt rather than undefined when the action omitted it', () => {
            expect(parseUsageResponse({ available: true }).updatedAt).to.equal(null);
        });
    });

    describe('page normalisation', () => {
        const parseWith = (pages) => parseUsageResponse({ available: true, pages });

        it('keeps absolute http and https pages', () => {
            const result = parseWith([
                { url: 'https://www.adobe.com/express/', requests: 5 },
                { url: 'http://www.adobe.com/legacy', requests: 1 },
            ]);
            expect(result.pages).to.have.lengthOf(2);
        });

        it('drops a javascript: url so it can never reach an href', () => {
            const result = parseWith([{ url: 'javascript:alert(1)', requests: 5 }]);
            expect(result.pages).to.deep.equal([]);
        });

        it('drops a data: url', () => {
            const result = parseWith([{ url: 'data:text/html,<script></script>', requests: 5 }]);
            expect(result.pages).to.deep.equal([]);
        });

        it('drops relative and malformed urls', () => {
            const result = parseWith([
                { url: '/express', requests: 5 },
                { url: 'not a url', requests: 1 },
            ]);
            expect(result.pages).to.deep.equal([]);
        });

        it('coerces a missing request count to zero rather than NaN', () => {
            const result = parseWith([{ url: 'https://www.adobe.com/express/' }]);
            expect(result.pages[0].requests).to.equal(0);
        });

        it('carries the locale so one url served in several locales stays several rows', () => {
            const result = parseWith([
                { url: 'https://www.adobe.com/', requests: 5, locale: 'en_US' },
                { url: 'https://www.adobe.com/', requests: 3, locale: 'en_GB' },
            ]);
            expect(result.pages.map((page) => page.locale)).to.deep.equal(['en_US', 'en_GB']);
        });

        it('reports a missing locale as an empty string rather than undefined', () => {
            expect(parseWith([{ url: 'https://www.adobe.com/', requests: 5 }]).pages[0].locale).to.equal('');
        });

        it('attaches display countries and a region to each page', () => {
            const result = parseWith([{ url: 'https://www.adobe.com/express/', requests: 5, countries: { US: 4, GB: 1 } }]);
            expect(result.pages[0].countries).to.deep.equal(['us', 'uk']);
            expect(result.pages[0].region).to.equal('LATAM/Americas');
        });

        it('falls back to Global for a page the action sent no countries for', () => {
            const result = parseWith([{ url: 'https://www.adobe.com/express/', requests: 5 }]);
            expect(result.pages[0].countries).to.deep.equal([]);
            expect(result.pages[0].region).to.equal(GLOBAL_REGION);
        });

        it('returns an empty list when the action sent no pages', () => {
            expect(parseWith(undefined).pages).to.deep.equal([]);
        });
    });

    describe('canFetchFragmentUsage', () => {
        it('is false when no IO base url is published on the page', () => {
            expect(canFetchFragmentUsage()).to.equal(false);
        });
    });

    describe('fetchFragmentUsage', () => {
        const options = { ioBaseUrl: 'https://io.example', token: 'ims-token' };

        it('returns unavailable without a fragment id', async () => {
            const result = await fetchFragmentUsage('', options);
            expect(result.available).to.equal(false);
        });

        it('returns unavailable when the IO base url is not configured', async () => {
            const result = await fetchFragmentUsage(FRAGMENT_ID, { ...options, ioBaseUrl: undefined });
            expect(result.available).to.equal(false);
        });

        it('returns unavailable when there is no access token', async () => {
            const result = await fetchFragmentUsage(FRAGMENT_ID, { ...options, token: undefined });
            expect(result.available).to.equal(false);
        });

        it('posts the fragment id to the fragment-usage action', async () => {
            const fetchImpl = sinon.stub().resolves(jsonResponse(payload()));

            await fetchFragmentUsage(FRAGMENT_ID, { ...options, fetchImpl });

            const [url, init] = fetchImpl.firstCall.args;
            expect(url).to.equal('https://io.example/fragment-usage');
            expect(init.method).to.equal('POST');
            expect(JSON.parse(init.body)).to.deep.equal({ fragmentId: FRAGMENT_ID });
            expect(init.headers.Authorization).to.equal('Bearer ims-token');
        });

        it('returns normalised usage on success', async () => {
            const fetchImpl = sinon.stub().resolves(jsonResponse(payload()));

            const result = await fetchFragmentUsage(FRAGMENT_ID, { ...options, fetchImpl });

            expect(result.available).to.equal(true);
            expect(result.pages[0].requests).to.equal(70);
        });

        it('degrades rather than throwing when the action errors', async () => {
            const fetchImpl = sinon.stub().resolves(jsonResponse('nope', false));

            const result = await fetchFragmentUsage(FRAGMENT_ID, { ...options, fetchImpl });

            expect(result.available).to.equal(false);
        });

        it('degrades rather than throwing when the network fails', async () => {
            const fetchImpl = sinon.stub().rejects(new Error('offline'));

            const result = await fetchFragmentUsage(FRAGMENT_ID, { ...options, fetchImpl });

            expect(result.available).to.equal(false);
        });

        it('passes the abort signal through so an editor switch cancels the request', async () => {
            const fetchImpl = sinon.stub().resolves(jsonResponse(payload()));
            const signal = new AbortController().signal;

            await fetchFragmentUsage(FRAGMENT_ID, { ...options, fetchImpl, signal });

            expect(fetchImpl.firstCall.args[1].signal).to.equal(signal);
        });
    });
});
