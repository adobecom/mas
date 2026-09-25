const { expect } = require('chai');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const { toEpochHour } = require('../../src/fragment-usage/pages');

const VALID_ID = '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4';
const AUTH = { authorization: 'Bearer valid-token' };

/** Loads the action with IMS validation and State reads stubbed. */
function loadAction({ valid = true, record = null } = {}) {
    const readUsage = sinon.stub().resolves(record);
    const action = proxyquire('../../src/fragment-usage/usage', {
        '@adobe/aio-lib-ims': {
            Ims: class {
                async validateToken() {
                    return { valid };
                }
            },
        },
        './state': { readUsage },
    });
    return { action, readUsage };
}

describe('fragment-usage usage action', () => {
    describe('authorization', () => {
        it('rejects a request with no authorization header', async () => {
            const { action } = loadAction();
            const response = await action.main({ fragmentId: VALID_ID, __ow_headers: {} });
            expect(response.statusCode).to.equal(401);
        });

        it('rejects a token IMS says is invalid', async () => {
            const { action } = loadAction({ valid: false });
            const response = await action.main({ fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(response.statusCode).to.equal(401);
        });

        it('checks authorization before it looks at the fragment id', async () => {
            const { action, readUsage } = loadAction({ valid: false });
            await action.main({ fragmentId: VALID_ID, __ow_headers: {} });
            expect(readUsage).to.not.have.been.called;
        });
    });

    describe('fragmentId validation', () => {
        it('requires a fragmentId', async () => {
            const { action } = loadAction();
            const response = await action.main({ __ow_headers: AUTH });
            expect(response.statusCode).to.equal(400);
        });

        ["'; DROP TABLE logs --", 'a b', "id' OR '1'='1", '../etc/passwd'].forEach((value) => {
            it(`rejects ${JSON.stringify(value)} rather than sanitising it`, async () => {
                const { action, readUsage } = loadAction();
                const response = await action.main({ fragmentId: value, __ow_headers: AUTH });
                expect(response.statusCode).to.equal(400);
                expect(readUsage).to.not.have.been.called;
            });
        });

        it('accepts a uuid', async () => {
            const { action } = loadAction();
            const response = await action.main({ fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(response.statusCode).to.equal(200);
        });
    });

    describe('response', () => {
        it('reports no pages for a fragment the rollup has never seen', async () => {
            const { action } = loadAction({ record: null });
            const { body } = await action.main({ fragmentId: VALID_ID, __ow_headers: AUTH });
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
            const { body } = await action.main({ fragmentId: VALID_ID, __ow_headers: AUTH });

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
            const { body } = await action.main({ fragmentId: VALID_ID, __ow_headers: AUTH });

            expect(body.pages).to.deep.equal([
                { url: 'https://www.adobe.com/a', locale: 'en_GB', requests: 9, countries: { GB: 9 } },
                { url: 'https://www.adobe.com/a', locale: 'en_US', requests: 5, countries: { US: 5 } },
            ]);
        });

        it('returns an empty page list for traffic that carried no referer', async () => {
            const { action } = loadAction({ record: { updatedAt: 'now', pages: {} } });
            const { body } = await action.main({ fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(body.pages).to.deep.equal([]);
        });

        it('surfaces the rollup timestamp so the UI can show how fresh the data is', async () => {
            const updatedAt = '2026-09-17T12:00:00.000Z';
            const { action } = loadAction({ record: { updatedAt, pages: {} } });
            const { body } = await action.main({ fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(body.updatedAt).to.equal(updatedAt);
        });

        it('never echoes the Grafana service token', async () => {
            const { action } = loadAction({ record: { updatedAt: 'now', pages: {} } });
            const response = await action.main({
                fragmentId: VALID_ID,
                __ow_headers: AUTH,
                GRAFANA_SERVICE_TOKEN: 'glsa_secret',
            });
            expect(JSON.stringify(response)).to.not.contain('glsa_secret');
        });
    });

    describe('failure handling', () => {
        it('returns 500 rather than throwing when State is unreachable', async () => {
            const action = proxyquire('../../src/fragment-usage/usage', {
                '@adobe/aio-lib-ims': {
                    Ims: class {
                        async validateToken() {
                            return { valid: true };
                        }
                    },
                },
                './state': { readUsage: sinon.stub().rejects(new Error('state down')) },
            });
            const response = await action.main({ fragmentId: VALID_ID, __ow_headers: AUTH });
            expect(response.statusCode).to.equal(500);
        });
    });
});
