import { expect } from 'chai';
import sinon from 'sinon';
import { createResponse } from './mocks/MockFetch.js';
import {
    clearPendingFetches,
    fetch as odinFetch,
    geoMatchScore,
    matchesGeo,
    getCountry,
    isGroupedVariationFragmentPath,
    hasGeoTag,
} from '../../src/fragment/utils/common.js';

describe('common utils', () => {
    describe('matchesGeo', () => {
        describe('long-form CQ tag paths', () => {
            it('matches regionLocale against /content/cq:tags/mas/locale/<value>', () => {
                const result = matchesGeo(['/content/cq:tags/mas/locale/en_US'], { regionLocale: 'en_US' });
                expect(result).to.deep.equal({ region: true, country: false });
            });

            it('matches country against /content/cq:tags/mas/country/<value>', () => {
                const result = matchesGeo(['/content/cq:tags/mas/country/CH'], { country: 'CH' });
                expect(result).to.deep.equal({ region: false, country: true });
            });

            it('returns null when neither dimension matches', () => {
                const result = matchesGeo(['/content/cq:tags/mas/locale/fr_FR'], { regionLocale: 'en_US' });
                expect(result).to.be.null;
            });
        });

        describe('Short-form CQ tags', () => {
            it('matches regionLocale against mas:locale/<value> (namespace-prefixed)', () => {
                const result = matchesGeo(['mas:locale/BE/fr_BE', 'mas:pzn/country/de', 'mas:locale/en_US'], {
                    regionLocale: 'en_US',
                    country: 'FR',
                });
                expect(result).to.deep.equal({ region: true, country: false });
            });

            it('matches country against mas:pzn/country/<value>', () => {
                const result = matchesGeo(['mas:pzn/country/DE'], { country: 'DE' });
                expect(result).to.deep.equal({ region: false, country: true });
            });

            it('is case-insensitive on the value', () => {
                const result = matchesGeo(['mas:pzn/country/de'], { country: 'DE' });
                expect(result).to.deep.equal({ region: false, country: true });
            });
        });

        describe('non-geo tags are not matched spuriously', () => {
            it('matches nested locale format locale/<country>/<locale>', () => {
                // production format: locale dimension / country code / locale value
                const result = matchesGeo(['mas:locale/BE/fr_BE'], { regionLocale: 'fr_BE' });
                expect(result).to.deep.equal({ region: true, country: false });
            });

            it('matches nested locale format for GR (en_GR)', () => {
                const result = matchesGeo(['mas:locale/GR/en_GR', 'mas:pzn/country/ar'], {
                    regionLocale: 'en_GR',
                    country: 'GR',
                });
                expect(result).to.deep.equal({ region: true, country: false });
            });

            it('does not match unrelated taxonomy paths ending in /<value>', () => {
                const result = matchesGeo(['mas:promotion/en_US'], { regionLocale: 'en_US' });
                expect(result).to.be.null;
            });
        });

        describe('country fallback from regionLocale', () => {
            it('extracts country from regionLocale when country is not supplied', () => {
                const result = matchesGeo(['mas:pzn/country/FR'], { regionLocale: 'fr_FR' });
                expect(result).to.deep.equal({ region: false, country: true });
            });

            it('returns null with no regionLocale and no country', () => {
                const result = matchesGeo(['mas:locale/en_US'], {});
                expect(result).to.be.null;
            });
        });
    });

    describe('geoMatchScore', () => {
        it('prefers region matches over country matches', () => {
            expect(geoMatchScore(null)).to.equal(0);
            expect(geoMatchScore({ region: false, country: true })).to.equal(1);
            expect(geoMatchScore({ region: true, country: false })).to.equal(2);
            expect(geoMatchScore({ region: true, country: true })).to.equal(3);
        });
    });

    describe('getCountry', () => {
        it('prefers explicit country', () => {
            expect(getCountry({ country: 'LU', locale: 'fr_FR' })).to.equal('LU');
        });

        it('falls back to country segment of locale', () => {
            expect(getCountry({ locale: 'fr_FR' })).to.equal('FR');
        });

        it('returns empty string when both are missing or malformed', () => {
            expect(getCountry({})).to.equal('');
            expect(getCountry({ locale: 'fr' })).to.equal('');
        });
    });

    describe('isGroupedVariationFragmentPath', () => {
        it('matches a fragmentPath under a /pzn/ folder', () => {
            expect(isGroupedVariationFragmentPath('PA-123/pzn/edu')).to.be.true;
        });

        it('does not match a plain fragmentPath', () => {
            expect(isGroupedVariationFragmentPath('pzn-test-fragment')).to.be.false;
        });

        it('does not match a promotion variation path', () => {
            expect(isGroupedVariationFragmentPath('promotions/black-friday/pzn-test-fragment')).to.be.false;
        });

        it('returns false for non-string input', () => {
            expect(isGroupedVariationFragmentPath(undefined)).to.be.false;
        });
    });

    describe('hasGeoTag', () => {
        it('returns true for a short-form locale tag', () => {
            expect(hasGeoTag(['mas:locale/en_US'])).to.be.true;
        });

        it('returns true for a short-form country tag regardless of case', () => {
            expect(hasGeoTag(['mas:COUNTRY/FR'])).to.be.true;
        });

        it('returns true for a long-form CQ tag path', () => {
            expect(hasGeoTag(['/content/cq:tags/mas/locale/en_US'])).to.be.true;
        });

        it('returns false when no tag has a locale/country segment', () => {
            expect(hasGeoTag(['mas:pzn/edu', 'mas:offer_type/base'])).to.be.false;
        });

        it('returns false for an empty tag list', () => {
            expect(hasGeoTag([])).to.be.false;
        });
    });

    describe('fetch', () => {
        const URL_A = 'https://odinpreview.corp.adobe.com/adobe/contentFragments/a?references=all-hydrated';
        const URL_B = 'https://odinpreview.corp.adobe.com/adobe/contentFragments/b?references=all-hydrated';
        const networkConfig = { retries: 2, retryDelay: 1, fetchTimeout: 50 };
        const previewContext = () => ({ preview: { url: 'https://odinpreview.corp.adobe.com' }, networkConfig });
        const publishedContext = () => ({ networkConfig });
        let fetchStub;
        let originalFetch;

        beforeEach(() => {
            originalFetch = global.fetch;
            fetchStub = sinon.stub();
            global.fetch = fetchStub;
            clearPendingFetches();
        });

        afterEach(() => {
            global.fetch = originalFetch;
        });

        describe('attempt cancellation', () => {
            let clock;

            beforeEach(() => {
                clock = sinon.useFakeTimers();
            });

            afterEach(() => {
                clock.restore();
            });

            for (const status of [400, 401, 403, 404, 408, 429]) {
                it(`does not retry HTTP ${status}`, async () => {
                    fetchStub.callsFake(() => createResponse(status, { detail: 'unavailable' }));
                    const response = await odinFetch(URL_A, publishedContext(), 'fragment');
                    expect(response.status).to.equal(status);
                    expect(fetchStub.callCount).to.equal(1);
                });
            }

            it('aborts a timed-out fetch before starting the next attempt', async () => {
                const events = [];
                fetchStub.onFirstCall().callsFake((url, { signal }) => {
                    signal?.addEventListener('abort', () => events.push('abort'));
                    return new Promise(() => {});
                });
                fetchStub.onSecondCall().callsFake(() => {
                    events.push('retry');
                    return createResponse(200, { id: 'a' });
                });
                const pending = odinFetch(URL_A, publishedContext(), 'fragment');
                await clock.tickAsync(51);
                expect((await pending).status).to.equal(200);
                expect(events).to.deep.equal(['abort', 'retry']);
            });

            it('aborts a timed-out response body before retrying', async () => {
                const events = [];
                fetchStub.onFirstCall().callsFake(async (url, { signal }) => {
                    signal?.addEventListener('abort', () => events.push('abort'));
                    const response = await createResponse(200, {});
                    response.json = () => new Promise(() => {});
                    return response;
                });
                fetchStub.onSecondCall().callsFake(() => {
                    events.push('retry');
                    return createResponse(200, { id: 'a' });
                });
                const pending = odinFetch(URL_A, publishedContext(), 'fragment');
                await clock.tickAsync(51);
                expect((await pending).status).to.equal(200);
                expect(events).to.deep.equal(['abort', 'retry']);
            });

            it('clears timeout timers after a successful attempt', async () => {
                fetchStub.callsFake(() => createResponse(200, { id: 'a' }));
                await odinFetch(URL_A, publishedContext(), 'fragment');
                expect(clock.countTimers()).to.equal(0);
            });

            it('clears timeout timers when error reporting throws', async () => {
                const failure = new Error('logger unavailable');
                const errorStub = sinon.stub(console, 'error').throws(failure);
                fetchStub.rejects(new Error('network unavailable'));
                try {
                    const response = await odinFetch(URL_A, publishedContext(), 'fragment').catch((error) => error);
                    expect(response).to.equal(failure);
                    expect(clock.countTimers()).to.equal(0);
                } finally {
                    errorStub.restore();
                }
            });

            for (const status of [503, 504]) {
                it(`bounds retries for HTTP ${status}`, async () => {
                    fetchStub.callsFake(() => createResponse(status, { detail: 'unavailable' }));
                    const pending = odinFetch(URL_A, publishedContext(), 'fragment');
                    await clock.tickAsync(10);
                    expect((await pending).status).to.equal(status);
                    expect(fetchStub.callCount).to.equal(2);
                });
            }
        });

        it('shares one request between concurrent preview reads of the same URL', async () => {
            fetchStub.callsFake(() => createResponse(200, { id: 'a' }));
            const responses = await Promise.all([1, 2, 3].map(() => odinFetch(URL_A, previewContext(), 'fragment')));
            expect(fetchStub.callCount).to.equal(1);
            responses.forEach((response) => expect(response).to.deep.include({ status: 200, body: { id: 'a' } }));
        });

        it('gives each reader its own body, so one reader mutating it does not change the others', async () => {
            fetchStub.callsFake(() => createResponse(200, { id: 'a', fields: { title: 'x' } }));
            const [first, second] = await Promise.all([1, 2].map(() => odinFetch(URL_A, previewContext(), 'fragment')));
            first.body.fields.title = 'changed';
            expect(second.body.fields.title).to.equal('x');
            const later = await odinFetch(URL_A, previewContext(), 'fragment');
            expect(later.body.fields.title).to.equal('x');
        });

        it('does not share requests for different URLs', async () => {
            fetchStub.callsFake((url) => createResponse(200, { url }));
            const [a, b] = await Promise.all([
                odinFetch(URL_A, previewContext(), 'fragment'),
                odinFetch(URL_B, previewContext(), 'fragment'),
            ]);
            expect(fetchStub.callCount).to.equal(2);
            expect(a.body.url).to.equal(URL_A);
            expect(b.body.url).to.equal(URL_B);
        });

        it('requests again once the previous request finished, so edits are visible', async () => {
            fetchStub.onFirstCall().callsFake(() => createResponse(200, { title: 'before' }));
            fetchStub.onSecondCall().callsFake(() => createResponse(200, { title: 'after' }));
            const first = await odinFetch(URL_A, previewContext(), 'fragment');
            const second = await odinFetch(URL_A, previewContext(), 'fragment');
            expect(first.body.title).to.equal('before');
            expect(second.body.title).to.equal('after');
            expect(fetchStub.callCount).to.equal(2);
        });

        it('does not join a request started before clearPendingFetches', async () => {
            let release;
            fetchStub
                .onFirstCall()
                .callsFake(() => new Promise((resolve) => (release = () => resolve(createResponse(200, { v: 1 })))));
            fetchStub.onSecondCall().callsFake(() => createResponse(200, { v: 2 }));
            const stale = odinFetch(URL_A, previewContext(), 'fragment');
            clearPendingFetches();
            const fresh = await odinFetch(URL_A, previewContext(), 'fragment');
            release();
            expect(fresh.body.v).to.equal(2);
            expect((await stale).body.v).to.equal(1);
        });

        it('shares a failure with concurrent readers without leaking the first reader context', async () => {
            fetchStub.callsFake(() => createResponse(404, { detail: 'not found' }, 'Not Found'));
            const responses = await Promise.all(
                [1, 2].map((n) => odinFetch(URL_A, { ...previewContext(), requestId: `r${n}` }, 'fragment')),
            );
            expect(fetchStub.callCount).to.equal(1);
            responses.forEach((response) => expect(response).to.deep.equal({ status: 404, message: 'not found' }));
        });

        it('retries after a shared failure instead of caching it', async () => {
            fetchStub.onCall(0).rejects(new Error('boom'));
            fetchStub.onCall(1).rejects(new Error('boom'));
            fetchStub.onCall(2).callsFake(() => createResponse(200, { id: 'a' }));
            const failed = await Promise.all([1, 2].map(() => odinFetch(URL_A, previewContext(), 'fragment')));
            failed.forEach((response) => expect(response).to.deep.equal({ status: 503, message: 'fetch error' }));
            expect(fetchStub.callCount).to.equal(2);
            const retried = await odinFetch(URL_A, previewContext(), 'fragment');
            expect(retried.status).to.equal(200);
            expect(fetchStub.callCount).to.equal(3);
        });

        it('does not share requests whose headers differ', async () => {
            fetchStub.callsFake(() => createResponse(200, { id: 'a' }));
            await Promise.all([
                odinFetch(URL_A, { ...previewContext(), DEFAULT_HEADERS: { Authorization: 'one' } }, 'fragment'),
                odinFetch(URL_A, { ...previewContext(), DEFAULT_HEADERS: { Authorization: 'two' } }, 'fragment'),
                odinFetch(URL_A, previewContext(), 'fragment'),
            ]);
            expect(fetchStub.callCount).to.equal(3);
            expect(fetchStub.args.map(([, { headers }]) => headers.Authorization)).to.have.members(['one', 'two', undefined]);
        });

        it('shares requests whose headers and network policy match', async () => {
            fetchStub.callsFake(() => createResponse(200, { id: 'a' }));
            const context = () => ({ ...previewContext(), DEFAULT_HEADERS: { Accept: 'application/json' } });
            await Promise.all([odinFetch(URL_A, context(), 'fragment'), odinFetch(URL_A, context(), 'fragment')]);
            expect(fetchStub.callCount).to.equal(1);
        });

        it('does not share requests whose network policy differs', async () => {
            fetchStub.callsFake(() => createResponse(200, { id: 'a' }));
            const withConfig = (config) => ({ preview: { url: 'https://odinpreview.corp.adobe.com' }, networkConfig: config });
            await Promise.all([
                odinFetch(URL_A, withConfig({ retries: 1, retryDelay: 1, fetchTimeout: 50 }), 'fragment'),
                odinFetch(URL_A, withConfig({ retries: 3, retryDelay: 1, fetchTimeout: 50 }), 'fragment'),
                odinFetch(URL_A, withConfig({ retries: 1, retryDelay: 1, fetchTimeout: 5000 }), 'fragment'),
                odinFetch(URL_A, withConfig({ retries: 1, retryDelay: 9, fetchTimeout: 50 }), 'fragment'),
                odinFetch(URL_A, withConfig(undefined), 'fragment'),
            ]);
            expect(fetchStub.callCount).to.equal(5);
        });

        it('treats a missing network config like the defaults', async () => {
            fetchStub.callsFake(() => createResponse(200, { id: 'a' }));
            const withConfig = (networkConfig) => ({ preview: { url: 'https://odinpreview.corp.adobe.com' }, networkConfig });
            await Promise.all([
                odinFetch(URL_A, withConfig(undefined), 'fragment'),
                odinFetch(URL_A, withConfig({}), 'fragment'),
                odinFetch(URL_A, withConfig({ retries: 3, fetchTimeout: 2000, retryDelay: 100 }), 'fragment'),
            ]);
            expect(fetchStub.callCount).to.equal(1);
        });

        it('does not poison later reads when the shared request rejects', async () => {
            const context = previewContext();
            let reads = 0;
            Object.defineProperty(context, 'networkConfig', {
                get: () => {
                    // 1st read builds the share key, 2nd runs inside the shared request and throws
                    if (++reads === 2) throw new Error('bad config');
                    return networkConfig;
                },
            });
            const readers = await Promise.allSettled([
                odinFetch(URL_A, context, 'fragment'),
                odinFetch(URL_A, context, 'fragment'),
            ]);
            readers.forEach((reader) => expect(reader.status).to.equal('rejected'));
            expect(reads).to.equal(3);
            fetchStub.callsFake(() => createResponse(200, { id: 'a' }));
            expect((await odinFetch(URL_A, previewContext(), 'fragment')).status).to.equal(200);
        });

        it('does not share published reads', async () => {
            fetchStub.callsFake(() => createResponse(200, { id: 'a' }));
            await Promise.all([1, 2, 3].map(() => odinFetch(URL_A, publishedContext(), 'fragment')));
            expect(fetchStub.callCount).to.equal(3);
        });
    });
});
