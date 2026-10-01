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

function makeFragment(id, path, customFieldValues = [], customFieldLabels = []) {
    return {
        id,
        path,
        title: `Fragment ${id}`,
        description: '',
        fields: [
            { name: 'customFields', type: 'text', multiple: true, values: customFieldValues },
            { name: 'customFieldLabels', type: 'text', multiple: true, values: customFieldLabels },
        ],
        etag: `"etag-${id}"`,
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

const getValuesStub = (fragment, name) => {
    const field = fragment?.fields?.find((f) => f.name === name);
    return field ? { values: field.values, path: `/fields/${fragment.fields.indexOf(field)}` } : null;
};

function fakeFetchByPath(fragmentsByPath) {
    return (_endpoint, path) => {
        const fragment = fragmentsByPath[path];
        if (!fragment) return Promise.resolve({ fragment: null, status: 404 });
        return Promise.resolve({ fragment, status: 200, etag: fragment.etag });
    };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe('custom-field-audit/index.js', () => {
    let action;
    let mockLogger;
    let fetchStub;
    let patchToOdinStub;
    let fetchFragmentByPathStub;

    const odinEndpoint = 'https://test-odin.example.com';
    const authToken = 'test-token';
    const baseParams = {
        __ow_headers: { authorization: `Bearer ${authToken}` },
        odinEndpoint,
    };

    const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
    const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';

    beforeEach(function () {
        this.timeout(5000);

        mockLogger = {
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub(),
        };

        fetchStub = sinon.stub();
        patchToOdinStub = sinon.stub().resolves({ success: true });
        fetchFragmentByPathStub = sinon.stub();

        const processBatchWithConcurrencyStub = async (items, _batchSize, processor) => {
            const results = [];
            for (const item of items) {
                results.push(await processor(item));
            }
            return results;
        };

        action = proxyquire('../../src/custom-field-audit/index.js', {
            '@adobe/aio-sdk': {
                Core: { Logger: sinon.stub().returns(mockLogger) },
            },
            '../common': {
                fetchOdin: fetchStub,
                fetchFragmentByPath: fetchFragmentByPathStub,
                patchToOdin: patchToOdinStub,
                processBatchWithConcurrency: processBatchWithConcurrencyStub,
                getValues: getValuesStub,
            },
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    // ---------------------------------------------------------------------------
    // resolveDefaultPathFromPromoPath
    // ---------------------------------------------------------------------------

    describe('resolveDefaultPathFromPromoPath', () => {
        it('strips the promotions/{promoName}/ segment', () => {
            expect(action.resolveDefaultPathFromPromoPath(promoPath)).to.equal(defaultPath);
        });

        it('strips a numeric collision suffix from the leaf', () => {
            expect(action.resolveDefaultPathFromPromoPath(`${promoPath}-2`)).to.equal(defaultPath);
        });

        it('returns null for a path with no promotions/ segment', () => {
            expect(action.resolveDefaultPathFromPromoPath(defaultPath)).to.equal(null);
        });
    });

    // ---------------------------------------------------------------------------
    // diffCustomFields
    // ---------------------------------------------------------------------------

    describe('diffCustomFields', () => {
        it('reports a default-only name as missing', () => {
            const result = action.diffCustomFields(
                [{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }],
                [{ name: 'A', value: 'a' }],
            );
            expect(result.missing).to.deep.equal(['B']);
            expect(result.renames).to.deep.equal([]);
        });

        it('reports a position-paired differing name as a rename', () => {
            const result = action.diffCustomFields([{ name: 'B', value: 'b' }], [{ name: 'Renamed', value: 'b' }]);
            expect(result.renames).to.deep.equal([{ from: 'Renamed', to: 'B' }]);
            expect(result.missing).to.deep.equal([]);
        });

        it('reports no changes for identical name sets', () => {
            const result = action.diffCustomFields([{ name: 'A', value: 'a' }], [{ name: 'A', value: 'other' }]);
            expect(result.missing).to.deep.equal([]);
            expect(result.renames).to.deep.equal([]);
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
        it('reports a missing custom field on a promo variation without patching it', async () => {
            const defaultFragment = makeFragment('default-1', defaultPath, ['valA', 'valB'], ['A', 'B']);
            const promoFragment = makeFragment('promo-1', promoPath, ['valA'], ['A']);

            fetchStub.resolves(makeFolderResponse([defaultPath, promoPath]));
            fetchFragmentByPathStub.callsFake(
                fakeFetchByPath({ [defaultPath]: defaultFragment, [promoPath]: promoFragment }),
            );

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'en_US', dryRun: true });

            expect(result.statusCode).to.equal(200);
            expect(result.body.dryRun).to.equal(true);
            expect(result.body.processed).to.equal(1);
            expect(result.body.corrected).to.equal(1);
            expect(result.body.details[0]).to.deep.include({ defaultPath, promoPath, missing: ['B'], renames: [] });
            expect(patchToOdinStub).to.not.have.been.called;
        });

        it('does not report a promo variation whose custom fields already match the default', async () => {
            const defaultFragment = makeFragment('default-2', defaultPath, ['valA'], ['A']);
            const promoFragment = makeFragment('promo-2', promoPath, ['valA'], ['A']);

            fetchStub.resolves(makeFolderResponse([defaultPath, promoPath]));
            fetchFragmentByPathStub.callsFake(
                fakeFetchByPath({ [defaultPath]: defaultFragment, [promoPath]: promoFragment }),
            );

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'en_US', dryRun: true });

            expect(result.body.processed).to.equal(0);
            expect(result.body.corrected).to.equal(0);
        });
    });

    // ---------------------------------------------------------------------------
    // main — dryRun: false, applies the fix
    // ---------------------------------------------------------------------------

    describe('main — dryRun: false', () => {
        it('appends the missing field, preserving the promo variation own values', async () => {
            const defaultFragment = makeFragment('default-3', defaultPath, ['valA', 'valB'], ['A', 'B']);
            const promoFragment = makeFragment('promo-3', promoPath, ['own-a'], ['A']);

            fetchStub.resolves(makeFolderResponse([defaultPath, promoPath]));
            fetchFragmentByPathStub.callsFake(
                fakeFetchByPath({ [defaultPath]: defaultFragment, [promoPath]: promoFragment }),
            );

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'en_US', dryRun: false });

            expect(result.body.corrected).to.equal(1);
            expect(patchToOdinStub).to.have.been.calledOnce;
            const [, fragmentId, , ops, etag] = patchToOdinStub.firstCall.args;
            expect(fragmentId).to.equal('promo-3');
            expect(etag).to.equal(promoFragment.etag);
            expect(ops).to.deep.equal([
                { op: 'replace', path: '/fields/0/values', value: ['own-a', 'valB'] },
                { op: 'replace', path: '/fields/1/values', value: ['A', 'B'] },
            ]);
        });

        it('corrects a renamed promo-side name to the default naming, keeping its own value', async () => {
            const defaultFragment = makeFragment('default-4', defaultPath, ['valB'], ['B']);
            const promoFragment = makeFragment('promo-4', promoPath, ['own-value'], ['Renamed']);

            fetchStub.resolves(makeFolderResponse([defaultPath, promoPath]));
            fetchFragmentByPathStub.callsFake(
                fakeFetchByPath({ [defaultPath]: defaultFragment, [promoPath]: promoFragment }),
            );

            const result = await action.main({ ...baseParams, surface: 'sandbox', locale: 'en_US', dryRun: false });

            expect(result.body.details[0].renames).to.deep.equal(['Renamed -> B']);
            const [, , , ops] = patchToOdinStub.firstCall.args;
            expect(ops).to.deep.equal([
                { op: 'replace', path: '/fields/0/values', value: ['own-value'] },
                { op: 'replace', path: '/fields/1/values', value: ['B'] },
            ]);
        });
    });
});
