import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { MAS_OFFERS_URL } from '../../src/constants.js';
import { loadProductArrangementCodes, resetProductArrangementCodes } from '../../src/common/utils/product-arrangement-codes.js';

describe('loadProductArrangementCodes', () => {
    let sandbox;
    let fetchStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(window, 'fetch');
        resetProductArrangementCodes();
    });

    afterEach(() => {
        sandbox.restore();
        resetProductArrangementCodes();
    });

    it('maps the offers to options sorted by code', async () => {
        fetchStub.resolves(
            new Response(
                JSON.stringify({
                    'PA-2': { fields: { name: 'Illustrator' } },
                    'PA-1': { fields: { name: 'Photoshop' } },
                    acro_indirect_team: { fields: {} },
                }),
            ),
        );

        expect(await loadProductArrangementCodes()).to.deep.equal([
            { id: 'acro_indirect_team', title: 'acro_indirect_team' },
            { id: 'PA-1', title: 'PA-1 — Photoshop' },
            { id: 'PA-2', title: 'PA-2 — Illustrator' },
        ]);
        expect(fetchStub.calledOnceWith(MAS_OFFERS_URL)).to.be.true;
    });

    it('requests the offers once per session', async () => {
        fetchStub.callsFake(async () => new Response('{}'));

        await Promise.all([loadProductArrangementCodes(), loadProductArrangementCodes()]);
        await loadProductArrangementCodes();

        expect(fetchStub.calledOnce).to.be.true;
    });

    it('returns no options and retries on the next call when the request fails', async () => {
        fetchStub.onFirstCall().resolves(new Response('', { status: 500 }));
        fetchStub.onSecondCall().resolves(new Response(JSON.stringify({ 'PA-1': { fields: { name: 'Photoshop' } } })));

        expect(await loadProductArrangementCodes()).to.deep.equal([]);
        expect(await loadProductArrangementCodes()).to.deep.equal([{ id: 'PA-1', title: 'PA-1 — Photoshop' }]);
    });
});
