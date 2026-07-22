import { expect } from 'chai';
import sinon from 'sinon';
import { main } from '../../src/agent/handler.js';

const FRAGMENT = {
    id: 'frag-1',
    fields: {
        variant: 'plans',
        cardTitle: 'Photoshop',
        prices: { value: '<span is="inline-price" data-wcs-osi="OSI"></span>' },
    },
};

const fakeFactory = (invoke) => () => ({ actions: { invoke } });

describe('agent action main', () => {
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

    it('invokes the fragment action and returns a flat offer with echoed inputs', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 200, body: JSON.stringify(FRAGMENT) });
        const res = await main(
            {
                productName: 'Photoshop',
                locale: 'en_US',
                pzn: 'edu',
                country: 'US',
                api_key: 'key',
                __ow_action_name: '/ns/MerchAtScale/agent',
            },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res.statusCode).to.equal(200);
        expect(res.body.fragment).to.equal('frag-1');
        expect(res.body.wcs_osi).to.equal('OSI');
        expect(res.body.product).to.equal('Photoshop');
        expect(res.body.pzn).to.equal('edu');
        expect(res.body.country).to.equal('US');
        expect(res.body.locale).to.equal('en_US');
        const arg = invoke.firstCall.args[0];
        expect(arg.name).to.equal('/ns/MerchAtScale/fragment');
        expect(arg.blocking).to.be.true;
        expect(arg.result).to.be.true;
        expect(arg.params).to.deep.equal({
            id: '8413981a-2b38-46b3-813a-ae161415c6fd',
            locale: 'en_US',
            api_key: 'key',
            pzn: 'edu',
            country: 'US',
        });
    });

    it('falls back to the packaged action name and nulls optional echoes when omitted', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 200, body: JSON.stringify(FRAGMENT) });
        const res = await main({ productName: 'Photoshop', locale: 'en_US' }, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.statusCode).to.equal(200);
        expect(res.body.pzn).to.be.null;
        expect(res.body.country).to.be.null;
        const arg = invoke.firstCall.args[0];
        expect(arg.name).to.equal('MerchAtScale/fragment');
        expect(arg.params).to.deep.equal({ id: '8413981a-2b38-46b3-813a-ae161415c6fd', locale: 'en_US' });
    });

    it('propagates a non-200 fragment action status', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 503, body: JSON.stringify({ message: 'down' }) });
        const res = await main({ productName: 'Photoshop', locale: 'en_US' }, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.statusCode).to.equal(503);
    });

    it('returns 502 when the fragment action invocation fails', async () => {
        const invoke = sinon.stub().rejects(new Error('runtime down'));
        const res = await main({ productName: 'Photoshop', locale: 'en_US' }, { openwhiskFactory: fakeFactory(invoke) });
        expect(res.statusCode).to.equal(502);
    });
});
