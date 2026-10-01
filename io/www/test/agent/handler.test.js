import { readFileSync } from 'fs';
import zlib from 'zlib';
import { expect } from 'chai';
import sinon from 'sinon';
import { main } from '../../src/agent/handler.js';

const CC_PRO_INDIVIDUAL_ID = '128b6634-6631-4081-a6d9-9a2c7c003414';
const CC_PRO_TEAM_ID = '5c3fe2ac-0dbb-4495-9858-feac379ca19b';
const CC_PRO_EDU_ID = '2b1a6493-e03b-4803-a150-eed983094a05';
const PREMIERE_INDIVIDUAL_ID = 'ea8f1b95-56b1-4665-b859-41ac2961ddcd';
const UNMAPPED_FRAGMENT_ID = 'a352adc7-6b85-4bfd-97e8-91a1082cc126';
const ccProBody = readFileSync(new URL('./mocks/fragment-cc-pro.json', import.meta.url), 'utf-8');
const photoshopEgBody = readFileSync(new URL('./mocks/fragment-photoshop-eg.json', import.meta.url), 'utf-8');

const fakeFactory = (invoke) => () => ({ actions: { invoke } });
const requestParams = { productName: 'Creative Cloud Pro', locale: 'en_US', api_key: 'test-api-key' };
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

    beforeEach(() => {
        clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
        clock.restore();
        sinon.restore();
    });

    it('hydrates Photoshop for Egypt from the prefetched cache without a WCS request', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new DOMException('Unexpected WCS request', 'TimeoutError'));
        const invoke = sinon.stub().resolves({ statusCode: 200, body: photoshopEgBody });
        const pending = main(
            { ...requestParams, productName: 'Photoshop', country: 'EG' },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        await clock.tickAsync(1000);
        const res = await pending;
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.deep.include({
            fragment: '9941bca0-5304-47f7-aeb3-4f638aeb8791',
            productName: 'Photoshop',
            regularPrice: 'LE 552.90',
            recurrenceText: '/mo',
        });
        expect(res.body).to.not.have.any.keys('locale', 'country', 'segment');
        expect(invoke.firstCall.args[0].params).to.deep.equal({
            id: '9941bca0-5304-47f7-aeb3-4f638aeb8791',
            locale: 'en_US',
            api_key: 'test-api-key',
            country: 'EG',
        });
        expect(fetchStub.called).to.be.false;
        expect(clock.countTimers()).to.equal(0);
    });

    it('normalizes lowercase country before fragment prefetch and pricing hydration', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new DOMException('Unexpected WCS request', 'TimeoutError'));
        const emptyOffers = JSON.parse(photoshopEgBody);
        for (const key of Object.keys(emptyOffers.wcs.prod)) emptyOffers.wcs.prod[key] = [];
        const invoke = sinon.stub().callsFake(async ({ params }) => ({
            statusCode: 200,
            body: params.country === 'EG' ? photoshopEgBody : JSON.stringify(emptyOffers),
        }));
        const pending = main(
            { ...requestParams, productName: 'Photoshop', country: 'eg' },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        await clock.tickAsync(1000);
        const res = await pending;
        expect(invoke.firstCall.args[0].params.country).to.equal('EG');
        expect(res.statusCode).to.equal(200);
        expect(res.body.regularPrice).to.equal('LE 552.90');
        expect(fetchStub.called).to.be.false;
        expect(clock.countTimers()).to.equal(0);
    });

    it('decompresses a Brotli fragment action response', async () => {
        const invoke = sinon.stub().resolves({
            statusCode: 200,
            headers: { 'Content-Encoding': 'br' },
            body: zlib.brotliCompressSync(ccProBody).toString('base64'),
        });
        const res = await main(
            {
                productName: 'Creative Cloud Pro',
                locale: 'en_US',
                api_key: 'test-api-key',
            },
            { openwhiskFactory: fakeFactory(invoke) },
        );

        expect(res.statusCode).to.equal(200);
        expect(res.body.productName).to.equal('Creative Cloud Pro');
    });

    it('hydrates a fragment selected by path without a product name', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').rejects(new Error('Unexpected WCS request'));
        const fragmentId = '9941bca0-5304-47f7-aeb3-4f638aeb8791';
        const invoke = sinon.stub().resolves({ statusCode: 200, body: photoshopEgBody });
        const pending = main(
            {
                __ow_path: `/${fragmentId}`,
                __ow_action_name: '/ns/MerchAtScale/agent',
                locale: 'en_US',
                country: 'eg',
                api_key: 'test-api-key',
            },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        await clock.tickAsync(1000);
        const res = await pending;
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.deep.include({
            fragment: fragmentId,
            productName: 'Photoshop',
            regularPrice: 'LE 552.90',
            pzn: null,
        });
        expect(invoke.firstCall.args[0]).to.deep.include({
            name: '/ns/MerchAtScale/fragment',
            params: { id: fragmentId, locale: 'en_US', api_key: 'test-api-key', country: 'EG' },
        });
        expect(fetchStub.called).to.be.false;
        expect(clock.countTimers()).to.equal(0);
    });

    it('uses an unmapped path UUID instead of product lookup and classifies the returned fragment tags', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 200, body: bodyWithSegments('team', 'com') });
        const res = await main(
            { ...requestParams, __ow_path: `/${UNMAPPED_FRAGMENT_ID}`, productName: 'Photoshop' },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.deep.include({
            fragment: UNMAPPED_FRAGMENT_ID,
            productName: 'Creative Cloud Pro',
            customer_segment: 'team',
            market_segment: 'com',
            pzn: null,
        });
        expect(invoke.firstCall.args[0].params).to.deep.equal({
            id: UNMAPPED_FRAGMENT_ID,
            locale: 'en_US',
            api_key: 'test-api-key',
        });
    });

    for (const pzn of ['edu', 'team', '', 'enterprise', null]) {
        it(`discards pzn=${JSON.stringify(pzn)} with a fragment path and uses the fragment tags`, async () => {
            const invoke = sinon.stub().resolves({ statusCode: 200, body: bodyWithSegments('team', 'com') });
            const res = await main(
                { ...requestParams, __ow_path: `/${UNMAPPED_FRAGMENT_ID}`, pzn },
                { openwhiskFactory: fakeFactory(invoke) },
            );
            expect(res.statusCode).to.equal(200);
            expect(res.body).to.deep.include({
                fragment: UNMAPPED_FRAGMENT_ID,
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
        const invoke = sinon.stub().resolves({ statusCode: 200, body: ccProBody });
        const res = await main(
            { __ow_path: `/${UNMAPPED_FRAGMENT_ID.toUpperCase()}/`, locale: 'en_US', api_key: 'test-api-key' },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res.statusCode).to.equal(200);
        expect(res.body.fragment).to.equal(UNMAPPED_FRAGMENT_ID);
        expect(invoke.firstCall.args[0].params.id).to.equal(UNMAPPED_FRAGMENT_ID);
    });

    for (const path of ['', '/']) {
        it(`keeps product lookup for the root path '${path}'`, async () => {
            const invoke = sinon.stub().resolves({ statusCode: 200, body: ccProBody });
            const res = await main({ ...requestParams, __ow_path: path }, { openwhiskFactory: fakeFactory(invoke) });
            expect(res.statusCode).to.equal(200);
            expect(invoke.firstCall.args[0].params.id).to.equal(CC_PRO_INDIVIDUAL_ID);
        });
    }

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
            const res = await main({ ...requestParams, __ow_path: path }, { openwhiskFactory: fakeFactory(invoke) });
            expect(res.statusCode).to.equal(400);
            expect(res.body.message).to.equal('requested path must contain one fragment UUID');
            expect(invoke.called).to.be.false;
        });
    }

    for (const missingParameter of ['locale', 'api_key']) {
        it(`requires ${missingParameter} when selecting a fragment by path`, async () => {
            const params = { __ow_path: `/${UNMAPPED_FRAGMENT_ID}`, locale: 'en_US', api_key: 'test-api-key' };
            delete params[missingParameter];
            const invoke = sinon.stub();
            const res = await main(params, { openwhiskFactory: fakeFactory(invoke) });
            expect(res.statusCode).to.equal(400);
            expect(res.body.message).to.equal(`requested parameter ${missingParameter} is not present`);
            expect(invoke.called).to.be.false;
        });
    }

    it('preserves the upstream 404 for a missing fragment selected by path', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 404, message: 'fragment not found' });
        const res = await main(
            { __ow_path: `/${UNMAPPED_FRAGMENT_ID}`, locale: 'en_US', api_key: 'test-api-key' },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res.statusCode).to.equal(404);
        expect(res.body.message).to.equal('fragment not found');
        expect(invoke.firstCall.args[0].params.id).to.equal(UNMAPPED_FRAGMENT_ID);
    });

    it('returns 400 when productName is missing', async () => {
        const res = await main({ locale: 'en_US' });
        expect(res.statusCode).to.equal(400);
    });

    it('returns 400 when locale is missing', async () => {
        const res = await main({ productName: 'Creative Cloud Pro' });
        expect(res.statusCode).to.equal(400);
    });

    it('returns 400 for an unknown pzn', async () => {
        const res = await main({ ...requestParams, pzn: 'enterprise' });
        expect(res.statusCode).to.equal(400);
        expect(res.body.message).to.equal("unknown pzn 'enterprise', expected one of edu, team");
    });

    for (const [productName, pzn, fragmentId, customerSegment] of [
        ['Nope', undefined, CC_PRO_INDIVIDUAL_ID, 'individual'],
        ['Nope', 'team', CC_PRO_TEAM_ID, 'team'],
        ['Photography', 'team', CC_PRO_TEAM_ID, 'team'],
        ['Frame.io', undefined, CC_PRO_INDIVIDUAL_ID, 'individual'],
    ]) {
        it(`selects the segment default for ${productName}/${pzn ?? 'individual'}`, async () => {
            const invoke = sinon.stub().resolves({ statusCode: 200, body: bodyWithSegments(customerSegment, 'com') });
            const res = await main({ ...requestParams, productName, pzn }, { openwhiskFactory: fakeFactory(invoke) });
            expect(res.statusCode).to.equal(200);
            expect(res.body.fragment).to.equal(fragmentId);
            expect(res.body.productName).to.equal('Creative Cloud Pro');
            expect(res.body.customer_segment).to.equal(customerSegment);
            expect(res.body.pzn).to.equal(pzn ?? null);
            expect(invoke.firstCall.args[0].params).to.deep.equal({
                id: fragmentId,
                locale: 'en_US',
                api_key: 'test-api-key',
            });
        });
    }

    it('selects the team offer without forwarding pzn and echoes the audience', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 200, body: bodyWithSegments('team', 'com') });
        const res = await main(
            {
                productName: 'Creative Cloud Pro',
                locale: 'en_US',
                pzn: 'team',
                country: 'US',
                api_key: 'key',
                __ow_action_name: '/ns/MerchAtScale/agent',
            },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res.statusCode).to.equal(200);
        expect(res.body.fragment).to.equal(CC_PRO_TEAM_ID);
        expect(res.body.productName).to.equal('Creative Cloud Pro');
        expect(res.body.customer_segment).to.equal('team');
        expect(res.body.market_segment).to.equal('com');
        expect(res.body.pzn).to.equal('team');
        expect(res.body).to.not.have.any.keys('segment', 'market_segments', 'locale', 'country');
        const arg = invoke.firstCall.args[0];
        expect(arg.name).to.equal('/ns/MerchAtScale/fragment');
        expect(arg.blocking).to.be.true;
        expect(arg.result).to.be.true;
        expect(arg.params).to.deep.equal({
            id: CC_PRO_TEAM_ID,
            locale: 'en_US',
            api_key: 'key',
            country: 'US',
        });
    });

    for (const productName of ['Creative Cloud Pro', 'Photoshop', 'Lightroom', 'Frame.io', 'Adobe Firefly', 'Nonexistent']) {
        it(`selects the shared edu offer for ${productName} without forwarding pzn`, async () => {
            const invoke = sinon.stub().resolves({ statusCode: 200, body: bodyWithSegments('individual', 'edu') });
            const res = await main({ ...requestParams, productName, pzn: 'edu' }, { openwhiskFactory: fakeFactory(invoke) });
            expect(res.statusCode).to.equal(200);
            expect(res.body.fragment).to.equal(CC_PRO_EDU_ID);
            expect(res.body.productName).to.equal('Creative Cloud Pro');
            expect(res.body.customer_segment).to.equal('individual');
            expect(res.body.market_segment).to.equal('edu');
            expect(res.body).to.not.have.any.keys('segment', 'market_segments');
            expect(res.body.pzn).to.equal('edu');
            expect(invoke.firstCall.args[0].params).to.deep.equal({
                id: CC_PRO_EDU_ID,
                locale: 'en_US',
                api_key: 'test-api-key',
            });
            expect(clock.countTimers()).to.equal(0);
        });
    }

    it('defaults to individual/com, the packaged action name, and a null pzn', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 200, body: bodyWithSegments('individual', 'com') });
        const res = await main(requestParams, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.statusCode).to.equal(200);
        expect(res.body.fragment).to.equal(CC_PRO_INDIVIDUAL_ID);
        expect(res.body.customer_segment).to.equal('individual');
        expect(res.body.market_segment).to.equal('com');
        expect(res.body).to.not.have.any.keys('segment', 'market_segments');
        expect(res.body.pzn).to.be.null;
        const arg = invoke.firstCall.args[0];
        expect(arg.name).to.equal('MerchAtScale/fragment');
        expect(arg.params).to.deep.equal({
            id: CC_PRO_INDIVIDUAL_ID,
            locale: 'en_US',
            api_key: 'test-api-key',
        });
        expect(clock.countTimers()).to.equal(0);
    });

    it('returns separate Premiere CTAs and the invoked fragment ID instead of a payload variant ID', async () => {
        const invoke = sinon.stub().resolves({
            statusCode: 200,
            body: JSON.stringify({
                id: 'locale-variant-id',
                fields: {
                    cardTitle: 'Adobe Premiere',
                    ctas: {
                        value: '<span><a is="checkout-link">Free trial</a><a is="checkout-link">Buy now</a></span>',
                    },
                },
            }),
        });
        const res = await main({ ...requestParams, productName: 'Adobe Premiere' }, { openwhiskFactory: fakeFactory(invoke) });
        const invokedId = invoke.firstCall.args[0].params.id;
        expect(invokedId).to.equal(PREMIERE_INDIVIDUAL_ID);
        expect(res.statusCode).to.equal(200);
        expect(res.body.fragment).to.equal(invokedId);
        expect(res.body.ctas).to.deep.equal([{ label: 'Free trial' }, { label: 'Buy now' }]);
        expect(res.body).to.not.have.property('cta_label');
        expect(clock.countTimers()).to.equal(0);
    });

    it('uses the returned fragment tags rather than pzn for response classification', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 200, body: bodyWithSegments('team', 'com') });
        const res = await main({ ...requestParams, pzn: 'edu' }, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.body).to.deep.include({
            customer_segment: 'team',
            market_segment: 'com',
            pzn: 'edu',
        });
        expect(res.body).to.not.have.any.keys('segment', 'market_segments');
    });

    it('propagates a non-200 fragment action status', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 503, body: JSON.stringify({ message: 'down' }) });
        const res = await main(requestParams, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.statusCode).to.equal(503);
        expect(res.body.message).to.equal('fragment action returned 503');
        expect(clock.countTimers()).to.equal(0);
    });

    it('returns 502 when the fragment action invocation fails', async () => {
        const invoke = sinon.stub().rejects(new Error('runtime down'));
        const res = await main(requestParams, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.statusCode).to.equal(502);
        expect(res.body.message).to.equal('failed to invoke fragment action: runtime down');
        expect(clock.countTimers()).to.equal(0);
    });

    it('rejects a missing API key without invoking the fragment action', async () => {
        const invoke = sinon.stub();
        const res = await main(
            { productName: 'Creative Cloud Pro', locale: 'en_US' },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res).to.deep.equal({
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'requested parameter api_key is not present' },
        });
        expect(invoke.called).to.be.false;
    });

    it('preserves fragment-action error messages', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 403, message: 'invalid api_key' });
        const res = await main(requestParams, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.statusCode).to.equal(403);
        expect(res.body.message).to.equal('invalid api_key');
        expect(clock.countTimers()).to.equal(0);
    });

    it('returns a JSON 502 for malformed fragment JSON', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 200, body: '{' });
        const res = await main(requestParams, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.statusCode).to.equal(502);
        expect(res.headers['Content-Type']).to.equal('application/json');
        expect(res.body.message).to.include('failed to hydrate fragment offer:');
        expect(res.body.message).to.include('JSON');
        expect(clock.countTimers()).to.equal(0);
    });

    it('returns a JSON 502 for invalid Brotli data', async () => {
        const invoke = sinon.stub().resolves({
            statusCode: 200,
            headers: { 'Content-Encoding': 'br' },
            body: Buffer.from('not Brotli').toString('base64'),
        });
        const res = await main(requestParams, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.statusCode).to.equal(502);
        expect(res.headers['Content-Type']).to.equal('application/json');
        expect(res.body.message).to.include('failed to hydrate fragment offer:');
        expect(clock.countTimers()).to.equal(0);
    });

    it('returns a JSON 502 when WCS cannot hydrate an offer', async () => {
        sinon.stub(globalThis, 'fetch').resolves(new Response(JSON.stringify({ resolvedOffers: [] }), { status: 200 }));
        const invoke = sinon.stub().resolves({
            statusCode: 200,
            body: JSON.stringify({ ...JSON.parse(ccProBody), wcs: {} }),
        });
        const pending = main(requestParams, { openwhiskFactory: fakeFactory(invoke) });
        await clock.tickAsync(1000);
        const res = await pending;
        expect(res.statusCode).to.equal(502);
        expect(res.headers['Content-Type']).to.equal('application/json');
        expect(res.body.message).to.equal('failed to hydrate fragment offer: Commerce offer not found');
        expect(clock.countTimers()).to.equal(0);
    });

    it('returns a JSON 504 when the fragment invocation exceeds 20 seconds', async () => {
        const invoke = sinon.stub().returns(new Promise(() => {}));
        const pending = main(requestParams, { openwhiskFactory: fakeFactory(invoke) });
        await clock.tickAsync(19999);
        expect(clock.countTimers()).to.equal(1);
        await clock.tickAsync(1);
        const res = await pending;
        expect(res).to.deep.equal({
            statusCode: 504,
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'failed to invoke fragment action: fragment invoke exceeded 20000ms' },
        });
        expect(clock.countTimers()).to.equal(0);
    });

    it('returns a JSON 504 when price hydration exceeds 15 seconds', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').returns(new Promise(() => {}));
        const invoke = sinon.stub().resolves({
            statusCode: 200,
            body: JSON.stringify({ ...JSON.parse(ccProBody), wcs: {} }),
        });
        const pending = main(requestParams, { openwhiskFactory: fakeFactory(invoke) });
        await clock.tickAsync(14999);
        expect(fetchStub.called).to.be.true;
        expect(clock.countTimers()).to.equal(1);
        await clock.tickAsync(1);
        const res = await pending;
        expect(res).to.deep.equal({
            statusCode: 504,
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'failed to hydrate fragment offer: price hydration exceeded 15000ms' },
        });
        expect(clock.countTimers()).to.equal(0);
    });
});
