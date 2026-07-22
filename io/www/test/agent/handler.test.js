import { readFileSync } from 'fs';
import { expect } from 'chai';
import sinon from 'sinon';
import { main } from '../../src/agent/handler.js';

const CC_PRO_FRAGMENT_ID = '2c5cd672-1db8-409c-96ff-46b1a1dfb7dc';
const ccProBody = readFileSync(new URL('./mocks/fragment-cc-pro.json', import.meta.url), 'utf-8');

const fakeFactory = (invoke) => () => ({ actions: { invoke } });

describe('agent action main', () => {
    it('returns 400 when productName is missing', async () => {
        const res = await main({ locale: 'en_US' });
        expect(res.statusCode).to.equal(400);
    });

    it('returns 400 when locale is missing', async () => {
        const res = await main({ productName: 'Creative Cloud Pro' });
        expect(res.statusCode).to.equal(400);
    });

    it('returns 404 for an unknown product', async () => {
        const res = await main({ productName: 'Nope', locale: 'en_US' });
        expect(res.statusCode).to.equal(404);
    });

    it('invokes the fragment action and returns a flat offer with echoed inputs', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 200, body: ccProBody });
        const res = await main(
            {
                productName: 'Creative Cloud Pro',
                locale: 'en_US',
                pzn: 'edu',
                country: 'US',
                api_key: 'key',
                __ow_action_name: '/ns/MerchAtScale/agent',
            },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res.statusCode).to.equal(200);
        expect(res.body.fragment).to.equal(CC_PRO_FRAGMENT_ID);
        expect(res.body.productName).to.equal('Creative Cloud Pro');
        expect(res.body.wcs_osi).to.equal('r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8');
        expect(res.body.promotion_code).to.equal('CCI_50_3_IP_US');
        expect(res.body.product).to.equal('Creative Cloud Pro');
        expect(res.body.pzn).to.equal('edu');
        expect(res.body.country).to.equal('US');
        expect(res.body.locale).to.equal('en_US');
        const arg = invoke.firstCall.args[0];
        expect(arg.name).to.equal('/ns/MerchAtScale/fragment');
        expect(arg.blocking).to.be.true;
        expect(arg.result).to.be.true;
        expect(arg.params).to.deep.equal({
            id: CC_PRO_FRAGMENT_ID,
            locale: 'en_US',
            api_key: 'key',
            pzn: 'edu',
            country: 'US',
        });
    });

    it('falls back to the packaged action name and nulls optional echoes when omitted', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 200, body: ccProBody });
        const res = await main(
            { productName: 'Creative Cloud Pro', locale: 'en_US' },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res.statusCode).to.equal(200);
        expect(res.body.pzn).to.be.null;
        expect(res.body.country).to.be.null;
        const arg = invoke.firstCall.args[0];
        expect(arg.name).to.equal('MerchAtScale/fragment');
        expect(arg.params).to.deep.equal({ id: CC_PRO_FRAGMENT_ID, locale: 'en_US' });
    });

    it('propagates a non-200 fragment action status', async () => {
        const invoke = sinon.stub().resolves({ statusCode: 503, body: JSON.stringify({ message: 'down' }) });
        const res = await main(
            { productName: 'Creative Cloud Pro', locale: 'en_US' },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res.statusCode).to.equal(503);
    });

    it('returns 502 when the fragment action invocation fails', async () => {
        const invoke = sinon.stub().rejects(new Error('runtime down'));
        const res = await main(
            { productName: 'Creative Cloud Pro', locale: 'en_US' },
            { openwhiskFactory: fakeFactory(invoke) },
        );
        expect(res.statusCode).to.equal(502);
    });
});
