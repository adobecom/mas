const { expect } = require('chai');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const { toEpochHour, PAGE_RETENTION_HOURS } = require('../../src/fragment-usage/pages');

const VALID_ID = '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4';
const AUTH = { authorization: 'Bearer valid-token' };

/** The package input every io/studio action receives: Studio's IMS client. */
const INPUTS = { allowedClientId: 'mas-studio' };

/**
 * Loads the action with IMS validation and State reads stubbed. The stubbed isAllowed keeps the
 * real contract: no token, or no allowed client, is never allowed.
 */
function loadAction({ valid = true, record = null, readError = null } = {}) {
    const readUsage = readError ? sinon.stub().rejects(readError) : sinon.stub().resolves(record);
    const isAllowed = sinon.stub().callsFake(async (token, clientId) => valid && Boolean(token && clientId));
    const action = proxyquire('../../src/fragment-usage/usage', {
        '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, warn() {}, error() {} }) } },
        '../../utils.js': { ...require('../../utils.js'), isAllowed },
        './state': { readUsage },
    });
    return { action, readUsage, isAllowed };
}

describe('fragment-usage usage action', () => {
    describe('authorization', () => {
        it('rejects a request with no authorization header', async () => {
            const { action } = loadAction();
            const response = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: {} });
            expect(response.statusCode).to.equal(401);
        });

        it('rejects a token IMS says is invalid', async () => {
            const { action } = loadAction({ valid: false });
            const response = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(response.statusCode).to.equal(401);
        });

        it('only accepts tokens issued to the Studio IMS client', async () => {
            const { action, isAllowed } = loadAction();
            await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(isAllowed).to.have.been.calledWith('valid-token', 'mas-studio');
        });

        it('checks authorization before it looks at the fragment id', async () => {
            const { action, readUsage } = loadAction({ valid: false });
            await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: {} });
            expect(readUsage).to.not.have.been.called;
        });
    });

    describe('fragmentId validation', () => {
        it('requires a fragmentId', async () => {
            const { action } = loadAction();
            const response = await action.main({ ...INPUTS, __ow_headers: AUTH });
            expect(response.statusCode).to.equal(400);
        });

        ["'; DROP TABLE logs --", 'a b', "id' OR '1'='1", '../etc/passwd', 'wrong-fragment-id'].forEach((value) => {
            it(`rejects ${JSON.stringify(value)} rather than sanitising it`, async () => {
                const { action, readUsage } = loadAction();
                const response = await action.main({ ...INPUTS, fragmentId: value, __ow_headers: AUTH });
                expect(response.statusCode).to.equal(400);
                expect(readUsage).to.not.have.been.called;
            });
        });

        it('reads the fragment id from a raw base64 JSON body', async () => {
            // The gateway usually merges a JSON body into params, but the other Studio actions also
            // accept it raw in __ow_body, so this one does too.
            const { action, readUsage } = loadAction();
            const rawBody = Buffer.from(JSON.stringify({ fragmentId: VALID_ID })).toString('base64');
            const response = await action.main({ ...INPUTS, __ow_body: rawBody, __ow_headers: AUTH });
            expect(response.statusCode).to.equal(200);
            expect(readUsage).to.have.been.calledWith(VALID_ID);
        });

        it('accepts a uuid', async () => {
            const { action } = loadAction();
            const response = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(response.statusCode).to.equal(200);
        });
    });

    describe('response', () => {
        it('reports no pages for a fragment the rollup has never seen', async () => {
            const { action } = loadAction({ record: null });
            const { body } = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(body.available).to.equal(true);
            expect(body.pages).to.deep.equal([]);
        });

        it('returns the consuming pages ranked by request count, with their countries', async () => {
            const nowHour = toEpochHour(Date.now());
            const record = {
                updatedAt: 'now',
                pages: {
                    [nowHour - 1]: {
                        'https://www.adobe.com/a': { requests: 5, countries: { US: 5 } },
                        'https://www.adobe.com/b': { requests: 9, countries: { JP: 9 } },
                    },
                    [nowHour - 2]: {
                        'https://www.adobe.com/a': { requests: 7, countries: { US: 4, CA: 3 } },
                    },
                },
            };
            const { action } = loadAction({ record });
            const { body } = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });

            expect(body.pages).to.deep.equal([
                { url: 'https://www.adobe.com/a', locale: '', requests: 12, countries: { US: 9, CA: 3 } },
                { url: 'https://www.adobe.com/b', locale: '', requests: 9, countries: { JP: 9 } },
            ]);
        });

        it('reports one url served in several locales as separate rows', async () => {
            const nowHour = toEpochHour(Date.now());
            const record = {
                updatedAt: 'now',
                pages: {
                    [nowHour - 1]: {
                        'https://www.adobe.com/a#en_US': {
                            url: 'https://www.adobe.com/a',
                            locale: 'en_US',
                            requests: 5,
                            countries: { US: 5 },
                        },
                        'https://www.adobe.com/a#en_GB': {
                            url: 'https://www.adobe.com/a',
                            locale: 'en_GB',
                            requests: 9,
                            countries: { GB: 9 },
                        },
                    },
                },
            };
            const { action } = loadAction({ record });
            const { body } = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });

            expect(body.pages).to.deep.equal([
                { url: 'https://www.adobe.com/a', locale: 'en_GB', requests: 9, countries: { GB: 9 } },
                { url: 'https://www.adobe.com/a', locale: 'en_US', requests: 5, countries: { US: 5 } },
            ]);
        });

        it('leaves out hours that aged past the retention window since the last rollup', async () => {
            // The rollup only rewrites fragments that still get traffic, so a quiet fragment keeps
            // its old hours in State until the record expires.
            const stale = toEpochHour(Date.now()) - PAGE_RETENTION_HOURS - 1;
            const record = { updatedAt: 'then', pages: { [stale]: { 'https://www.adobe.com/old': { requests: 5 } } } };
            const { action } = loadAction({ record });
            const { body } = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(body.pages).to.deep.equal([]);
        });

        it('returns an empty page list for traffic that carried no referer', async () => {
            const { action } = loadAction({ record: { updatedAt: 'now', pages: {} } });
            const { body } = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(body.pages).to.deep.equal([]);
        });

        it('surfaces the rollup timestamp so the UI can show how fresh the data is', async () => {
            const updatedAt = '2026-09-17T12:00:00.000Z';
            const { action } = loadAction({ record: { updatedAt, pages: {} } });
            const { body } = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(body.updatedAt).to.equal(updatedAt);
        });

        it('never echoes the Grafana service token', async () => {
            const { action } = loadAction({ record: { updatedAt: 'now', pages: {} } });
            const response = await action.main({
                ...INPUTS,
                fragmentId: VALID_ID,
                __ow_headers: AUTH,
                GRAFANA_SERVICE_TOKEN: 'glsa_secret',
            });
            expect(JSON.stringify(response)).to.not.contain('glsa_secret');
        });
    });

    describe('failure handling', () => {
        it('returns 500 rather than throwing when State is unreachable', async () => {
            const { action } = loadAction({ readError: new Error('state down') });
            const response = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(response.statusCode).to.equal(500);
        });

        it('keeps internal error details out of the response', async () => {
            const { action } = loadAction({ readError: new Error('ECONNREFUSED 10.0.0.12:443') });
            const response = await action.main({ ...INPUTS, fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(JSON.stringify(response.body)).to.not.contain('10.0.0.12');
        });
    });
});
