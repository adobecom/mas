import { readFileSync } from 'fs';
import zlib from 'zlib';
import { expect } from 'chai';
import sinon from 'sinon';
import { main } from '../../src/agent/handler.js';

const CC_PRO_INDIVIDUAL_ID = '128b6634-6631-4081-a6d9-9a2c7c003414';
const CC_PRO_TEAM_ID = '5c3fe2ac-0dbb-4495-9858-feac379ca19b';
const CC_PRO_EDU_ID = '2b1a6493-e03b-4803-a150-eed983094a05';
const PHOTOSHOP_ID = '9941bca0-5304-47f7-aeb3-4f638aeb8791';
const PREMIERE_INDIVIDUAL_ID = 'ea8f1b95-56b1-4665-b859-41ac2961ddcd';
const UNMAPPED_FRAGMENT_ID = 'a352adc7-6b85-4bfd-97e8-91a1082cc126';
const ccProBody = readFileSync(new URL('./mocks/fragment-cc-pro.json', import.meta.url), 'utf-8');
const photoshopEgBody = readFileSync(new URL('./mocks/fragment-photoshop-eg.json', import.meta.url), 'utf-8');

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const requestParams = { productName: 'Creative Cloud Pro', locale: 'en_US', api_key: 'test-api-key' };
const pathParams = { __ow_path: `/${UNMAPPED_FRAGMENT_ID}`, locale: 'en_US', api_key: 'test-api-key' };
const brotli = (data) => zlib.brotliCompressSync(data).toString('base64');
const respond = (body) => sinon.stub().resolves({ statusCode: 200, body });
const run = (params, invoke) => main(params, { openwhiskFactory: () => ({ actions: { invoke } }) });
const blockWcs = () => sinon.stub(globalThis, 'fetch').rejects(new Error('Unexpected WCS request'));
const bodyWithSegments = (customerSegment, marketSegment) => {
    const fragment = JSON.parse(ccProBody);
    fragment.fields.tags = [
        ...fragment.fields.tags.filter(
            (tag) => !tag.startsWith('mas:customer_segment/') && !tag.startsWith('mas:market_segments/'),
        ),
        `mas:customer_segment/${customerSegment}`,
        `mas:market_segments/${marketSegment}`,
    ];
    return JSON.stringify(fragment);
};

describe('agent action main', () => {
    let clock;
    const settle = async (pending) => {
        await clock.tickAsync(1000);
        return pending;
    };

    beforeEach(() => {
        clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
        const pendingTimers = clock.countTimers();
        clock.restore();
        sinon.restore();
        delete process.env.__OW_ACTION_NAME;
        expect(pendingTimers, 'timers left pending').to.equal(0);
    });

    describe('request validation', () => {
        for (const path of [
            '/not-a-uuid',
            `/${UNMAPPED_FRAGMENT_ID}/extra`,
            `//${UNMAPPED_FRAGMENT_ID}`,
            `/${UNMAPPED_FRAGMENT_ID}\n`,
            '/%2e%2e%2fsecret',
            { id: UNMAPPED_FRAGMENT_ID },
        ]) {
            it(`rejects an invalid fragment path ${JSON.stringify(path)} without using the product fallback`, async () => {
                const invoke = sinon.stub();
                const res = await run({ ...requestParams, __ow_path: path }, invoke);
                expect(res.statusCode).to.equal(400);
                expect(res.body.message).to.equal('requested path must contain one fragment UUID');
                expect(invoke.called).to.be.false;
            });
        }

        for (const [params, missing, name] of [
            [requestParams, 'productName', 'productName or fragment ID'],
            [requestParams, 'locale', 'locale'],
            [requestParams, 'api_key', 'api_key'],
            [pathParams, 'locale', 'locale'],
            [pathParams, 'api_key', 'api_key'],
        ]) {
            it(`requires ${missing} when selecting by ${params.__ow_path ? 'path' : 'product'}`, async () => {
                const invoke = sinon.stub();
                const res = await run({ ...params, [missing]: undefined }, invoke);
                expect(res).to.deep.equal({
                    statusCode: 400,
                    headers: JSON_HEADERS,
                    body: { message: `requested parameter ${name} is not present` },
                });
                expect(invoke.called).to.be.false;
            });
        }

        it('rejects an unknown pzn', async () => {
            const invoke = sinon.stub();
            const res = await run({ ...requestParams, pzn: 'enterprise' }, invoke);
            expect(res.statusCode).to.equal(400);
            expect(res.body.message).to.equal("unknown pzn 'enterprise', expected one of edu, team");
            expect(invoke.called).to.be.false;
        });
    });

    describe('fragment selection', () => {
        // The card tags differ from most requested audiences, so these also check that the response
        // classification comes from the returned fragment rather than pzn.
        for (const [pzn, fragmentId] of [
            [undefined, CC_PRO_INDIVIDUAL_ID],
            ['team', CC_PRO_TEAM_ID],
            ['edu', CC_PRO_EDU_ID],
        ]) {
            it(`selects the ${pzn ?? 'individual'} card by product without forwarding pzn, and echoes it`, async () => {
                const invoke = respond(bodyWithSegments('team', 'com'));
                const res = await run({ ...requestParams, pzn }, invoke);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.deep.include({
                    fragment: fragmentId,
                    productName: 'Creative Cloud Pro',
                    pzn: pzn ?? null,
                    customer_segment: 'team',
                    market_segment: 'com',
                });
                expect(res.body).to.not.have.any.keys('segment', 'market_segments', 'locale', 'country');
                expect(invoke.firstCall.args[0].params).to.deep.equal({
                    id: fragmentId,
                    locale: 'en_US',
                    api_key: 'test-api-key',
                });
            });
        }

        for (const pzn of ['edu', 'team', '', 'enterprise', null]) {
            it(`selects by path over the product name and discards pzn=${JSON.stringify(pzn)}`, async () => {
                const invoke = respond(bodyWithSegments('team', 'com'));
                const res = await run({ ...pathParams, productName: 'Photoshop', pzn }, invoke);
                expect(res.statusCode).to.equal(200);
                expect(res.body).to.deep.include({
                    fragment: UNMAPPED_FRAGMENT_ID,
                    productName: 'Creative Cloud Pro',
                    pzn: null,
                    customer_segment: 'team',
                    market_segment: 'com',
                });
                expect(invoke.firstCall.args[0].params).to.deep.equal({
                    id: UNMAPPED_FRAGMENT_ID,
                    locale: 'en_US',
                    api_key: 'test-api-key',
                });
            });
        }

        it('normalizes an uppercase path UUID and accepts a trailing slash', async () => {
            const invoke = respond(ccProBody);
            const res = await run({ ...pathParams, __ow_path: `/${UNMAPPED_FRAGMENT_ID.toUpperCase()}/` }, invoke);
            expect(res.statusCode).to.equal(200);
            expect(res.body.fragment).to.equal(UNMAPPED_FRAGMENT_ID);
            expect(invoke.firstCall.args[0].params.id).to.equal(UNMAPPED_FRAGMENT_ID);
        });

        for (const path of ['', '/']) {
            it(`keeps product lookup for the root path '${path}'`, async () => {
                const invoke = respond(ccProBody);
                const res = await run({ ...requestParams, __ow_path: path }, invoke);
                expect(res.statusCode).to.equal(200);
                expect(invoke.firstCall.args[0].params.id).to.equal(CC_PRO_INDIVIDUAL_ID);
            });
        }

        it('returns separate Premiere CTAs and the invoked fragment ID instead of a payload variant ID', async () => {
            const invoke = respond(
                JSON.stringify({
                    id: 'locale-variant-id',
                    fields: {
                        cardTitle: 'Adobe Premiere',
                        ctas: {
                            value: '<span><a is="checkout-link">Free trial</a><a is="checkout-link">Buy now</a></span>',
                        },
                    },
                }),
            );
            const res = await run({ ...requestParams, productName: 'Adobe Premiere' }, invoke);
            expect(invoke.firstCall.args[0].params.id).to.equal(PREMIERE_INDIVIDUAL_ID);
            expect(res.statusCode).to.equal(200);
            expect(res.body.fragment).to.equal(PREMIERE_INDIVIDUAL_ID);
            expect(res.body.ctas).to.deep.equal([{ label: 'Free trial' }, { label: 'Buy now' }]);
        });
    });

    describe('fragment action responses', () => {
        it('decompresses a Brotli fragment action response', async () => {
            const invoke = sinon
                .stub()
                .resolves({ statusCode: 200, headers: { 'Content-Encoding': 'br' }, body: brotli(ccProBody) });
            const res = await run(requestParams, invoke);
            expect(res.statusCode).to.equal(200);
            expect(res.body.productName).to.equal('Creative Cloud Pro');
        });

        for (const [label, result, message] of [
            [
                'a Brotli JSON message',
                {
                    statusCode: 400,
                    headers: { 'Content-Encoding': 'br' },
                    body: brotli(JSON.stringify({ message: 'bad locale' })),
                },
                'bad locale',
            ],
            ['a JSON message', { statusCode: 503, body: JSON.stringify({ message: 'down' }) }, 'down'],
            ['an activation message', { statusCode: 403, message: 'invalid api_key' }, 'invalid api_key'],
            ...[undefined, '', '{}', 'null'].map((body) => [
                `a generic message for body ${JSON.stringify(body)}`,
                { statusCode: 404, body },
                'fragment action returned 404',
            ]),
        ]) {
            it(`keeps the upstream ${result.statusCode} with ${label}`, async () => {
                const res = await run(requestParams, sinon.stub().resolves(result));
                expect(res).to.deep.equal({ statusCode: result.statusCode, headers: JSON_HEADERS, body: { message } });
            });
        }

        for (const result of [
            { statusCode: 503, body: '<html>Service unavailable</html>' },
            { statusCode: 502, headers: { 'Content-Encoding': 'br' }, body: Buffer.from('invalid Brotli').toString('base64') },
        ]) {
            it(`logs unreadable upstream ${result.statusCode} error bodies without replacing their status`, async () => {
                const errorLog = sinon.stub(console, 'error');
                const res = await run(requestParams, sinon.stub().resolves(result));
                expect(res).to.deep.equal({
                    statusCode: result.statusCode,
                    headers: JSON_HEADERS,
                    body: { message: `fragment action returned ${result.statusCode}` },
                });
                expect(errorLog.calledOnce).to.be.true;
                expect(errorLog.firstCall.args[0]).to.include('Failed to decode fragment action error response:');
            });
        }

        for (const [label, result] of [
            ['malformed fragment JSON', { statusCode: 200, body: '{' }],
            [
                'invalid Brotli data',
                { statusCode: 200, headers: { 'Content-Encoding': 'br' }, body: Buffer.from('not Brotli').toString('base64') },
            ],
        ]) {
            it(`returns a generic 502 and logs the cause for ${label}`, async () => {
                const errorLog = sinon.stub(console, 'error');
                const res = await run(requestParams, sinon.stub().resolves(result));
                expect(res).to.deep.equal({
                    statusCode: 502,
                    headers: JSON_HEADERS,
                    body: { message: 'failed to hydrate fragment offer' },
                });
                expect(errorLog.calledOnce).to.be.true;
                expect(errorLog.firstCall.args[0]).to.match(
                    /\[error\]\[test-api-key\]\[mas-[\d.]+\].*Failed to hydrate fragment offer: /,
                );
            });
        }

        it('builds the client and action name from the runtime, ignoring request-supplied __ow_ parameters', async () => {
            const invoke = sinon.stub().resolves({ statusCode: 403, message: 'stop' });
            const factory = sinon.spy(() => ({ actions: { invoke } }));
            await main(
                {
                    ...requestParams,
                    __ow_api_host: 'http://127.0.0.1:8080',
                    __ow_api_key: 'attacker:key',
                    __ow_namespace: 'other',
                    __ow_action_name: '/other/pkg/agent',
                },
                { openwhiskFactory: factory },
            );
            expect(factory.calledOnceWithExactly()).to.be.true;
            expect(invoke.firstCall.args[0].name).to.equal('MerchAtScale/fragment');
        });

        it('returns a generic 502 and logs the cause when the fragment action invocation fails', async () => {
            const errorLog = sinon.stub(console, 'error');
            const invoke = sinon.stub().rejects(new Error('runtime down at https://internal.example'));
            const res = await run({ ...requestParams, __ow_headers: { 'x-request-id': 'req-1' } }, invoke);
            expect(res.statusCode).to.equal(502);
            expect(res.body.message).to.equal('failed to invoke fragment action');
            expect(errorLog.calledOnce).to.be.true;
            expect(errorLog.firstCall.args[0]).to.equal(
                `[error][test-api-key][req-1][${CC_PRO_INDIVIDUAL_ID}][en_US][agent] Failed to invoke fragment action: runtime down at https://internal.example`,
            );
        });

        it('returns a JSON 504 when the fragment invocation exceeds 20 seconds', async () => {
            const errorLog = sinon.stub(console, 'error');
            const pending = run(requestParams, sinon.stub().returns(new Promise(() => {})));
            await clock.tickAsync(19999);
            expect(clock.countTimers()).to.equal(1);
            await clock.tickAsync(1);
            expect(await pending).to.deep.equal({
                statusCode: 504,
                headers: JSON_HEADERS,
                body: { message: 'fragment action timed out' },
            });
            expect(errorLog.firstCall.args[0]).to.include('Failed to invoke fragment action: fragment invoke exceeded 20000ms');
        });
    });

    describe('price hydration', () => {
        it('hydrates Photoshop for Egypt from the prefetched cache, forwarding the normalized country', async () => {
            process.env.__OW_ACTION_NAME = '/ns/MerchAtScale/agent';
            const fetchStub = blockWcs();
            const invoke = respond(photoshopEgBody);
            const res = await settle(run({ ...requestParams, productName: 'Photoshop', country: 'eg' }, invoke));
            expect(res.statusCode).to.equal(200);
            expect(res.body).to.deep.include({
                fragment: PHOTOSHOP_ID,
                productName: 'Photoshop',
                regularPrice: 'LE 552.90',
                recurrenceText: '/mo',
            });
            expect(res.body).to.not.have.any.keys('locale', 'country', 'segment');
            expect(invoke.firstCall.args[0]).to.deep.include({
                name: '/ns/MerchAtScale/fragment',
                blocking: true,
                result: true,
                params: { id: PHOTOSHOP_ID, locale: 'en_US', api_key: 'test-api-key', country: 'EG' },
            });
            expect(fetchStub.called).to.be.false;
        });

        it('omits and logs a price WCS cannot resolve while returning the rest of the offer', async () => {
            const errorLog = sinon.stub(console, 'error');
            sinon.stub(globalThis, 'fetch').resolves(new Response(JSON.stringify({ resolvedOffers: [] }), { status: 200 }));
            const invoke = respond(JSON.stringify({ ...JSON.parse(ccProBody), wcs: {} }));
            const res = await settle(run(requestParams, invoke));
            expect(res.statusCode).to.equal(200);
            expect(res.body).to.deep.include({ productName: 'Creative Cloud Pro', title: 'Creative Cloud Pro' });
            expect(res.body.regularPrice).to.be.undefined;
            expect(res.body.priceErrors).to.be.an('array').that.is.not.empty;
            expect(errorLog.firstCall.args[0]).to.match(/\[agent\] Failed to resolve offer .+: Commerce offer not found$/);
        });

        it('returns a JSON 504 when price hydration exceeds 15 seconds', async () => {
            const errorLog = sinon.stub(console, 'error');
            const fetchStub = sinon.stub(globalThis, 'fetch').returns(new Promise(() => {}));
            const pending = run(requestParams, respond(JSON.stringify({ ...JSON.parse(ccProBody), wcs: {} })));
            await clock.tickAsync(14999);
            expect(fetchStub.called).to.be.true;
            expect(clock.countTimers()).to.equal(1);
            await clock.tickAsync(1);
            expect(await pending).to.deep.equal({
                statusCode: 504,
                headers: JSON_HEADERS,
                body: { message: 'price hydration timed out' },
            });
            expect(errorLog.firstCall.args[0]).to.include('Failed to hydrate fragment offer: price hydration exceeded 15000ms');
        });
    });
});
