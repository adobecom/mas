import { expect } from 'chai';
import sinon from 'sinon';
import { fetch as commonFetch, matchesGeo, getCountry } from '../../src/fragment/utils/common.js';
import { createResponse } from './mocks/MockFetch.js';

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

    describe('fetch', () => {
        const createContext = (networkConfig) => ({
            DEFAULT_HEADERS: {},
            networkConfig,
            loggedTransformer: 'test',
            measures: [],
        });

        afterEach(() => {
            sinon.restore();
        });

        it('aborts a timed-out attempt', async () => {
            let signal;
            sinon.stub(globalThis, 'fetch').callsFake((url, options) => {
                signal = options.signal;
                return new Promise(() => {});
            });

            const response = await commonFetch(
                'https://example.com/slow',
                createContext({ retries: 1, fetchTimeout: 5 }),
                'slow',
            );

            expect(response.status).to.equal(504);
            expect(signal.aborted).to.be.true;
        });

        it('normalizes timeout errors raised by fetch', async () => {
            const error = new Error('upstream timeout');
            error.isTimeout = true;
            sinon.stub(globalThis, 'fetch').rejects(error);

            const response = await commonFetch(
                'https://example.com/upstream-timeout',
                createContext({ retries: 1, fetchTimeout: 50 }),
                'upstream-timeout',
            );

            expect(response.status).to.equal(504);
        });

        it('normalizes network errors raised by fetch', async () => {
            sinon.stub(globalThis, 'fetch').rejects(new Error('connection reset'));

            const response = await commonFetch(
                'https://example.com/network-error',
                createContext({ retries: 1, fetchTimeout: 50 }),
                'network-error',
            );

            expect(response.status).to.equal(503);
        });

        it('retries 429 and 5xx responses but not other 4xx responses', async () => {
            const fetchStub = sinon.stub(globalThis, 'fetch');
            fetchStub.onCall(0).resolves(createResponse(429, {}, 'Too Many Requests'));
            fetchStub.onCall(1).resolves(createResponse(500, {}, 'Server Error'));
            fetchStub.onCall(2).resolves(createResponse(200, { ok: true }));

            const recovered = await commonFetch(
                'https://example.com/transient',
                createContext({ retries: 3, fetchTimeout: 50, retryDelay: 1 }),
                'transient',
            );
            expect(recovered.status).to.equal(200);
            expect(fetchStub.callCount).to.equal(3);

            fetchStub.resetBehavior();
            fetchStub.resetHistory();
            fetchStub.resolves(createResponse(404, {}, 'Not Found'));
            const permanent = await commonFetch(
                'https://example.com/permanent',
                createContext({ retries: 3, fetchTimeout: 50, retryDelay: 1 }),
                'permanent',
            );
            expect(permanent.status).to.equal(404);
            expect(fetchStub.calledOnce).to.be.true;
        });

        it('stops before an attempt when the overall deadline is exhausted', async () => {
            const fetchStub = sinon.stub(globalThis, 'fetch');
            const response = await commonFetch(
                'https://example.com/deadline',
                createContext({ retries: 3, fetchTimeout: 50, fetchOverallTimeout: 0 }),
                'deadline',
            );

            expect(response.status).to.equal(504);
            expect(fetchStub.called).to.be.false;
        });

        it('does not sleep when a response consumes the remaining overall budget', async () => {
            sinon.stub(globalThis, 'fetch').resolves(createResponse(503, {}, 'Unavailable'));
            const nowStub = sinon.stub(Date, 'now');
            nowStub.onCall(0).returns(0);
            nowStub.onCall(1).returns(0);
            nowStub.onCall(2).returns(2);

            const response = await commonFetch(
                'https://example.com/no-budget',
                createContext({ retries: 3, fetchTimeout: 50, fetchOverallTimeout: 1, retryDelay: 10 }),
                'no-budget',
            );

            expect(response.status).to.equal(503);
        });
    });
});
