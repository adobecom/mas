import { expect } from 'chai';
import sinon from 'sinon';
import { main } from '../../src/agent/handler.js';
import { createResponse } from '../fragment/mocks/MockFetch.js';

const FRAGMENT = {
    id: 'frag-1',
    fields: {
        variant: 'plans',
        cardTitle: 'Photoshop',
        prices: { value: '<span is="inline-price" data-wcs-osi="OSI"></span>' },
    },
};

describe('agent action main', () => {
    afterEach(() => sinon.restore());

    it('returns 400 when productName is missing', async () => {
        const res = await main({ locale: 'en_US' });
        expect(res.statusCode).to.equal(400);
    });

    it('returns 400 when locale is missing', async () => {
        const res = await main({ productName: 'Photoshop' });
        expect(res.statusCode).to.equal(400);
    });

    it('returns 404 for an unknown product', async () => {
        const res = await main({ productName: 'Nope', locale: 'en_US' });
        expect(res.statusCode).to.equal(404);
    });

    it('resolves the fragment endpoint and returns a flat offer with echoed inputs', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').returns(createResponse(200, FRAGMENT));
        const res = await main({
            productName: 'Photoshop',
            locale: 'en_US',
            pzn: 'edu',
            country: 'US',
            api_key: 'key',
            FRAGMENT_ENDPOINT: 'https://example.com/fragment',
        });
        expect(res.statusCode).to.equal(200);
        expect(res.body.fragment).to.equal('frag-1');
        expect(res.body.wcs_osi).to.equal('OSI');
        expect(res.body.product).to.equal('Photoshop');
        expect(res.body.pzn).to.equal('edu');
        expect(res.body.country).to.equal('US');
        expect(res.body.locale).to.equal('en_US');
        const calledUrl = fetchStub.firstCall.args[0];
        expect(calledUrl).to.include('https://example.com/fragment');
        expect(calledUrl).to.include('id=8413981a-2b38-46b3-813a-ae161415c6fd');
        expect(calledUrl).to.include('pzn=edu');
        expect(calledUrl).to.include('country=US');
        expect(calledUrl).to.include('api_key=key');
    });

    it('uses the default endpoint and null echoes when optional inputs are omitted', async () => {
        const fetchStub = sinon.stub(globalThis, 'fetch').returns(createResponse(200, FRAGMENT));
        const res = await main({ productName: 'Photoshop', locale: 'en_US' });
        expect(res.statusCode).to.equal(200);
        expect(res.body.pzn).to.be.null;
        expect(res.body.country).to.be.null;
        const calledUrl = fetchStub.firstCall.args[0];
        expect(calledUrl).to.include('www.adobe.com/mas/io/fragment');
        expect(calledUrl).to.not.include('pzn=');
        expect(calledUrl).to.not.include('api_key=');
    });

    it('propagates a non-ok fragment endpoint status', async () => {
        sinon.stub(globalThis, 'fetch').returns(createResponse(503, null, 'Service Unavailable'));
        const res = await main({ productName: 'Photoshop', locale: 'en_US' });
        expect(res.statusCode).to.equal(503);
    });

    it('returns 502 when the fragment endpoint is unreachable', async () => {
        sinon.stub(globalThis, 'fetch').rejects(new Error('network down'));
        const res = await main({ productName: 'Photoshop', locale: 'en_US' });
        expect(res.statusCode).to.equal(502);
    });
});
