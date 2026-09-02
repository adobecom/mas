import { expect } from 'chai';
import { Ims } from '@adobe/aio-lib-ims';
import { StudioOperations } from '../../src/lib/studio-operations.js';

/**
 * Five variation intents were in the registry with no action behind them: the
 * model could pick them, the user could confirm, and the call 404'd. The logic
 * already existed on StudioOperations; only the actions were missing.
 *
 * The registry and the library also disagree on names. The registry sends
 * `parentId`, `locale` and `tags`; the methods take `id`, `targetLocale` and
 * `pznTags`. The action is where that translation belongs, so these tests pin
 * the REGISTRY's names as the wire contract — that is what the client sends.
 */
const validHeaders = { authorization: 'Bearer valid-test-token' };
const baseParams = { AEM_BASE_URL: 'https://author-test.adobeaemcloud.com', __ow_headers: validHeaders };

describe('variation actions', () => {
    let originalValidateToken;
    const calls = [];

    before(() => {
        originalValidateToken = Ims.prototype.validateToken;
    });

    after(() => {
        Ims.prototype.validateToken = originalValidateToken;
    });

    beforeEach(() => {
        calls.length = 0;
        Ims.prototype.validateToken = async () => ({ valid: true });
    });

    /** Record what the action hands the library, without hitting AEM. */
    function stubMethod(name, result = { ok: true }) {
        const original = StudioOperations.prototype[name];
        StudioOperations.prototype[name] = async function stubbed(params) {
            calls.push({ name, params });
            return result;
        };
        return () => {
            StudioOperations.prototype[name] = original;
        };
    }

    const cases = [
        {
            action: 'get-card-with-variations',
            method: 'getCardWithVariations',
            send: { id: 'card-1' },
            expect: { id: 'card-1' },
        },
        {
            action: 'list-variation-locales',
            method: 'listVariationLocales',
            send: { id: 'card-1' },
            expect: { id: 'card-1' },
        },
        {
            action: 'get-variation-parent',
            method: 'getVariationParent',
            send: { id: 'card-1' },
            expect: { id: 'card-1' },
        },
        {
            action: 'create-locale-variation',
            method: 'createLocaleVariation',
            send: { parentId: 'card-1', locale: 'fr_FR', title: 'Photoshop FR' },
            // registry parentId/locale -> library id/targetLocale
            expect: { id: 'card-1', targetLocale: 'fr_FR', title: 'Photoshop FR' },
        },
        {
            action: 'create-grouped-variation',
            method: 'createGroupedVariation',
            send: { parentId: 'card-1', tags: ['mas:pzn/loyal'], title: 'Loyal' },
            // registry parentId/tags -> library id/pznTags
            expect: { id: 'card-1', pznTags: ['mas:pzn/loyal'], title: 'Loyal' },
        },
    ];

    for (const testCase of cases) {
        describe(testCase.action, () => {
            let load;

            before(async () => {
                ({ main: load } = await import(`../../src/actions/${testCase.action}.js`));
            });

            it('rejects a request with no authorization header', async () => {
                const result = await load({ ...baseParams, ...testCase.send, __ow_headers: {} });

                expect(result.statusCode).to.equal(401);
            });

            it('rejects a token the IMS validator refuses', async () => {
                Ims.prototype.validateToken = async () => ({ valid: false });

                const result = await load({ ...baseParams, ...testCase.send });

                expect(result.statusCode).to.equal(401);
            });

            it('passes the registry slots through under the names the library expects', async () => {
                const restore = stubMethod(testCase.method);

                try {
                    const result = await load({ ...baseParams, ...testCase.send });

                    expect(result.statusCode).to.equal(200);
                    expect(calls).to.have.length(1);
                    for (const [key, value] of Object.entries(testCase.expect)) {
                        expect(calls[0].params[key], `${testCase.action} should send ${key}`).to.deep.equal(value);
                    }
                } finally {
                    restore();
                }
            });

            it('reports a library failure as a 500 rather than throwing', async () => {
                const original = StudioOperations.prototype[testCase.method];
                StudioOperations.prototype[testCase.method] = async () => {
                    throw new Error('boom');
                };

                try {
                    const result = await load({ ...baseParams, ...testCase.send });

                    expect(result.statusCode).to.equal(500);
                    expect(result.body.error).to.equal('boom');
                } finally {
                    StudioOperations.prototype[testCase.method] = original;
                }
            });
        });
    }

    describe('required slots', () => {
        it('rejects a locale variation with no parentId', async () => {
            const { main } = await import('../../src/actions/create-locale-variation.js');

            const result = await main({ ...baseParams, locale: 'fr_FR' });

            expect(result.statusCode).to.equal(400);
            expect(result.body.error).to.match(/parentId/i);
        });

        it('rejects a locale variation with no locale', async () => {
            const { main } = await import('../../src/actions/create-locale-variation.js');

            const result = await main({ ...baseParams, parentId: 'card-1' });

            expect(result.statusCode).to.equal(400);
            expect(result.body.error).to.match(/locale/i);
        });

        it('rejects a grouped variation with no parentId', async () => {
            const { main } = await import('../../src/actions/create-grouped-variation.js');

            const result = await main({ ...baseParams, tags: ['mas:pzn/loyal'] });

            expect(result.statusCode).to.equal(400);
            expect(result.body.error).to.match(/parentId/i);
        });
    });
});
