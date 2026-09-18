import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';

/**
 * Resolving a selected offer derives the product arrangement code from the
 * resolved offer. A failed resolve already surfaces an error, but a SUCCESSFUL
 * resolve whose offers carry no product_arrangement_code used to fall through
 * an `if (pa)` guard with no else and do nothing at all: the user was left on
 * "Resolving the selected offers..." forever, with no error and no way on.
 *
 * Any resolution that cannot produce an arrangement code has to end in
 * something the user can act on, the same way a missing MCS product does.
 */
describe('MasChat offer resolution dead ends', () => {
    let el;

    beforeEach(async () => {
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        sinon.stub(el, 'resolveReleaseProductByArrangementCode').resolves();
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
    });

    const lastMessage = () => el.messages[el.messages.length - 1];

    it('advances to the product lookup when an arrangement code was found', async () => {
        await el.continueFromResolvedOffer({ success: true }, 'phsp_direct_individual');

        expect(el.resolveReleaseProductByArrangementCode.calledOnceWith('phsp_direct_individual')).to.equal(true);
    });

    it('does not strand the user when no arrangement code could be derived', async () => {
        await el.continueFromResolvedOffer({ success: true }, undefined);

        expect(el.resolveReleaseProductByArrangementCode.called).to.equal(false);
        expect(lastMessage().content).to.match(/could not|couldn't|unable/i);
        expect(lastMessage().buttonGroup?.options?.length).to.be.above(0);
    });

    it('offers the same way out as a missing MCS product', async () => {
        await el.continueFromResolvedOffer({ success: true }, null);

        const values = lastMessage().buttonGroup.options.map((option) => option.value);
        expect(values).to.include('release_pick_different_offer');
        expect(values).to.include('release_cancel');
    });

    it('clears the operation card either way, so no spinner is left behind', async () => {
        const operationResult = { success: true };
        el.messages = [{ role: 'assistant', content: 'Resolving...', operationResult, operationLoading: true }];

        await el.continueFromResolvedOffer(operationResult, null);

        expect(el.messages.some((m) => m.operationResult === operationResult)).to.equal(false);
    });
});
