'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire');

chai.use(sinonChai);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFragment(id, path, variationPaths = [], locked = false) {
    return {
        id,
        path,
        title: `Fragment ${id}`,
        description: '',
        fields: [
            { name: 'variant', type: 'text', multiple: false, values: ['plans'] },
            {
                name: 'variations',
                type: 'content-fragment',
                multiple: true,
                locked,
                values: variationPaths,
            },
        ],
        etag: `"etag-${id}"`,
    };
}

function makeFetchResponse(fragment, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : status === 429 ? 'Not Acceptable' : 'Error',
        json: () => Promise.resolve({ items: fragment ? [fragment] : [] }),
        headers: { get: () => fragment?.etag ?? null },
    };
}

function makeFolderResponse(paths, cursor = null) {
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () =>
            Promise.resolve({
                items: paths.map((p) => ({ path: p })),
                cursor,
            }),
        headers: { get: () => null },
    };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe('cleanup-variations/index.js', () => {
    let action;
    let mockLogger;
    let fetchStub;
    let putToOdinStub;
    let fetchFragmentByPathStub;
    let processBatchWithConcurrencyStub;

    const odinEndpoint = 'https://test-odin.example.com';
    const authToken = 'test-token';
    const baseParams = {
        __ow_headers: { authorization: `Bearer ${authToken}` },
        odinEndpoint,
    };

    beforeEach(function () {
        this.timeout(5000);

        mockLogger = {
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        };

        fetchStub = sinon.stub();
        putToOdinStub = sinon.stub().resolves({ success: true });
        fetchFragmentByPathStub = sinon.stub();

        // Real processBatchWithConcurrency — just runs sequentially for tests
        processBatchWithConcurrencyStub = async (items, _batchSize, processor) => {
            const results = [];
            for (const item of items) {
                results.push(await processor(item));
            }
            return results;
        };

        action = proxyquire('../../src/cleanup-variations/index.js', {
            '@adobe/aio-sdk': {
                Core: { Logger: sinon.stub().returns(mockLogger) },
            },
            '../common': {
                fetchOdin: fetchStub,
                fetchFragmentByPath: fetchFragmentByPathStub,
                putToOdin: putToOdinStub,
                processBatchWithConcurrency: processBatchWithConcurrencyStub,
                getValues: (fragment, name) => {
                    const field = fragment?.fields?.find((f) => f.name === name);
                    return field ? { values: field.values, path: `/fields/${fragment.fields.indexOf(field)}` } : null;
                },
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    // ---------------------------------------------------------------------------
    // getValidVariationsLocales
    // ---------------------------------------------------------------------------

    describe('getValidVariationsLocales', () => {
        it('returns only the default locale when there are no regions', () => {
            const result = action.getValidVariationsLocales('acom', 'ja_JP');
            expect(result).to.deep.equal(['ja_JP']);
        });

        it('returns default locale + region locales for de_DE (acom)', () => {
            const result = action.getValidVariationsLocales('acom', 'de_DE');
            expect(result).to.deep.equal(['de_DE', 'de_AT', 'de_CH', 'de_LU']);
        });

        it('returns en_GB + AU + IN but NOT en_US (acom)', () => {
            const result = action.getValidVariationsLocales('acom', 'en_GB');
            expect(result).to.include('en_GB');
            expect(result).to.include('en_AU');
            expect(result).to.include('en_IN');
            expect(result).to.not.include('en_US');
        });

        it('returns zh_TW + zh_HK for acom (HK is a region of TW)', () => {
            const result = action.getValidVariationsLocales('acom', 'zh_TW');
            expect(result).to.deep.equal(['zh_TW', 'zh_HK']);
        });

        it('returns just [localeCode] for an unknown surface', () => {
            const result = action.getValidVariationsLocales('unknown-surface', 'de_DE');
            expect(result).to.deep.equal(['de_DE']);
        });

        it('returns just [localeCode] for an unknown locale on a known surface', () => {
            const result = action.getValidVariationsLocales('acom', 'xx_XX');
            expect(result).to.deep.equal(['xx_XX']);
        });

        it('acom-cc and acom-dc are mapped to ACOM locale set', () => {
            expect(action.getValidVariationsLocales('acom-cc', 'de_DE')).to.deep.equal(['de_DE', 'de_AT', 'de_CH', 'de_LU']);
            expect(action.getValidVariationsLocales('acom-dc', 'de_DE')).to.deep.equal(['de_DE', 'de_AT', 'de_CH', 'de_LU']);
        });

        it('ccd surface returns correct locales for fr_FR', () => {
            const result = action.getValidVariationsLocales('ccd', 'fr_FR');
            expect(result).to.include('fr_FR');
            expect(result).to.include('fr_BE');
            expect(result).to.include('fr_CA');
        });
    });

    // ---------------------------------------------------------------------------
    // main — auth & config validation
    // ---------------------------------------------------------------------------

    describe('main — auth & config', () => {
        it('returns 401 when Authorization header is missing', async () => {
            const result = await action.main({ odinEndpoint });
            expect(result.statusCode).to.equal(401);
        });

        it('returns 500 when odinEndpoint is not configured', async () => {
            const result = await action.main({ __ow_headers: { authorization: 'Bearer tok' } });
            expect(result.statusCode).to.equal(500);
        });

        it('returns 400 for an unknown surface', async () => {
            const result = await action.main({ ...baseParams, surface: 'not-a-surface' });
            expect(result.statusCode).to.equal(400);
        });
    });

    // ---------------------------------------------------------------------------
    // main — dry-run: detection only, no writes
    // ---------------------------------------------------------------------------

    describe('main — dryRun: true (default)', () => {
        it('reports invalid variations without calling putToOdin', async () => {
            const fragment = makeFragment(
                'frag-1',
                '/content/dam/mas/sandbox/de_DE/test-card',
                [
                    '/content/dam/mas/sandbox/de_AT/test-card', // valid region
                    '/content/dam/mas/sandbox/en_US/test-card', // INVALID — wrong lang
                ],
            );

            // folder listing returns one path
            fetchStub.resolves(makeFolderResponse(['/content/dam/mas/sandbox/de_DE/test-card']));
            fetchFragmentByPathStub.resolves({ fragment, status: 200, etag: fragment.etag });

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'de_DE', dryRun: true });

            expect(result.statusCode).to.equal(200);
            expect(result.body.dryRun).to.equal(true);
            expect(result.body.processed).to.equal(1);
            expect(result.body.removed).to.equal(1);
            expect(result.body.details[0].removed).to.deep.equal(['/content/dam/mas/sandbox/en_US/test-card']);
            expect(putToOdinStub).to.not.have.been.called;
        });

        it('does not report a fragment whose all variations are valid', async () => {
            const fragment = makeFragment('frag-2', '/content/dam/mas/sandbox/de_DE/clean-card', [
                '/content/dam/mas/sandbox/de_AT/clean-card',
                '/content/dam/mas/sandbox/de_CH/clean-card',
            ]);

            fetchStub.resolves(makeFolderResponse(['/content/dam/mas/sandbox/de_DE/clean-card']));
            fetchFragmentByPathStub.resolves({ fragment, status: 200, etag: fragment.etag });

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'de_DE', dryRun: true });

            expect(result.body.removed).to.equal(0);
            expect(result.body.details).to.be.empty;
        });

        it('skips fragments with no variations field values', async () => {
            const fragment = makeFragment('frag-3', '/content/dam/mas/sandbox/de_DE/empty-card', []);

            fetchStub.resolves(makeFolderResponse(['/content/dam/mas/sandbox/de_DE/empty-card']));
            fetchFragmentByPathStub.resolves({ fragment, status: 200, etag: fragment.etag });

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'de_DE', dryRun: true });

            expect(result.body.processed).to.equal(1);
            expect(result.body.removed).to.equal(0);
        });
    });

    // ---------------------------------------------------------------------------
    // main — live run: writes via putToOdin
    // ---------------------------------------------------------------------------

    describe('main — dryRun: false', () => {
        it('calls putToOdin with only the valid variation paths', async () => {
            const fragment = makeFragment(
                'frag-live',
                '/content/dam/mas/sandbox/de_DE/live-card',
                [
                    '/content/dam/mas/sandbox/de_AT/live-card', // valid
                    '/content/dam/mas/sandbox/en_BE/live-card', // INVALID
                    '/content/dam/mas/sandbox/en_US/some/pzn/path', // INVALID
                ],
            );

            fetchStub.resolves(makeFolderResponse(['/content/dam/mas/sandbox/de_DE/live-card']));
            fetchFragmentByPathStub.resolves({ fragment, status: 200, etag: fragment.etag });

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'de_DE', dryRun: false });

            expect(result.statusCode).to.equal(200);
            expect(result.body.removed).to.equal(2);
            expect(putToOdinStub).to.have.been.calledOnce;

            const putArgs = putToOdinStub.firstCall.args;
            const putFields = putArgs[3].fields;
            const variationsField = putFields.find((f) => f.name === 'variations');
            expect(variationsField.values).to.deep.equal(['/content/dam/mas/sandbox/de_AT/live-card']);
        });

        it('adds error to summary and continues when putToOdin fails', async () => {
            const fragment = makeFragment(
                'frag-fail',
                '/content/dam/mas/sandbox/de_DE/fail-card',
                ['/content/dam/mas/sandbox/en_US/fail-card'],
            );

            fetchStub.resolves(makeFolderResponse(['/content/dam/mas/sandbox/de_DE/fail-card']));
            fetchFragmentByPathStub.resolves({ fragment, status: 200, etag: fragment.etag });
            putToOdinStub.resolves({ success: false, error: 'Server error' });

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'de_DE', dryRun: false });

            expect(result.body.errors).to.have.length(1);
            expect(result.body.errors[0].fragmentPath).to.include('fail-card');
        });
    });

    // ---------------------------------------------------------------------------
    // main — 404 / fetch errors
    // ---------------------------------------------------------------------------

    describe('main — fetch edge cases', () => {
        it('skips fragment when fetchFragmentByPath returns 404', async () => {
            fetchStub.resolves(makeFolderResponse(['/content/dam/mas/sandbox/de_DE/ghost-card']));
            fetchFragmentByPathStub.resolves({ fragment: null, status: 404 });

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'de_DE' });

            expect(result.body.processed).to.equal(1);
            expect(result.body.removed).to.equal(0);
            expect(result.body.errors).to.be.empty;
        });

        it('adds error to summary when folder listing throws', async () => {
            fetchStub.rejects(new Error('Network failure'));

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'de_DE' });

            expect(result.body.errors).to.have.length(1);
            expect(result.body.errors[0].locale).to.equal('de_DE');
        });

        it('retries on 429 and succeeds on second attempt', async () => {
            const fragment = makeFragment(
                'frag-retry',
                '/content/dam/mas/sandbox/de_DE/retry-card',
                ['/content/dam/mas/sandbox/en_US/retry-card'],
            );

            fetchStub.resolves(makeFolderResponse(['/content/dam/mas/sandbox/de_DE/retry-card']));

            // First call returns 429, second returns the fragment
            fetchFragmentByPathStub
                .onFirstCall()
                .resolves({ fragment: null, status: 429 })
                .onSecondCall()
                .resolves({ fragment, status: 200, etag: fragment.etag });

            const clock = sinon.useFakeTimers({ shouldAdvanceTime: true });
            const resultPromise = action.main({ ...baseParams, surface: 'sandbox', locale: 'de_DE', dryRun: true });
            await clock.tickAsync(5000);
            const result = await resultPromise;
            clock.restore();

            expect(result.body.removed).to.equal(1);
            expect(fetchFragmentByPathStub).to.have.been.calledTwice;
        });
    });

    // ---------------------------------------------------------------------------
    // main — scope filtering
    // ---------------------------------------------------------------------------

    describe('main — scope filtering', () => {
        it('processes only the specified locale when locale param is given', async () => {
            fetchStub.resolves(makeFolderResponse([]));

            await action.main({ ...baseParams, surface: 'sandbox', locale: 'de_DE' });

            // folder listing should be called once (for de_DE only)
            expect(fetchStub).to.have.been.calledOnce;
            expect(fetchStub.firstCall.args[1]).to.include('de_DE');
        });

        it('skips en_US when iterating all locales for a surface', async () => {
            fetchStub.resolves(makeFolderResponse([]));

            await action.main({ ...baseParams, surface: 'ccd' });

            const calledUrls = fetchStub.args.map((a) => a[1]);
            const hasEnUs = calledUrls.some((url) => url.includes('/en_US'));
            expect(hasEnUs).to.be.false;
        });
    });
});
