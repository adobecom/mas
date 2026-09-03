import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

/**
 * Picking a product, answering the offering type, then choosing an offer in OST
 * made the flow render "Found your product:" again and ask the offering type a
 * second time. Both were already answered.
 *
 * Resolving an offer runs continueFromResolvedOffer, which looks the product up
 * from the offer's arrangement code and renders it. That is right for the
 * offer-first entry, where the user pastes an offer id and nothing is selected
 * yet, and the product path then tells the model to "Proceed to Step 4
 * (Offering Type Selection)". Reached from Step 5 it rewinds two answered steps.
 *
 * This only became visible once get_offer_by_id started succeeding; before that
 * the path was never reached.
 */
const PRODUCT_CODE = 'PA-1930';
const resolvedOffer = { success: true, rawResult: { offer: { product_arrangement_code: PRODUCT_CODE } } };

describe('MasChat does not replay steps the user already answered', () => {
    let el;
    let storageSandbox;
    let reResolved;
    let sent;

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        reResolved = sinon.stub(el, 'resolveReleaseProductByArrangementCode').resolves();
        sent = sinon.stub(el, 'handleSendMessage').resolves();
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
        storageSandbox.restore();
    });

    it('does not look the product up again when it is the one already selected', async () => {
        el.selectedReleaseProduct = { arrangement_code: PRODUCT_CODE, name: 'Adobe Firefly Standard' };

        await el.continueFromResolvedOffer(resolvedOffer, PRODUCT_CODE);

        expect(reResolved.called, 'the product was chosen at Step 2 and has not changed').to.equal(false);
    });

    it('renders no second product card, which is what the user sees', async () => {
        el.selectedReleaseProduct = { arrangement_code: PRODUCT_CODE, name: 'Adobe Firefly Standard' };
        el.messages = [
            { role: 'assistant', content: 'Found your product:', productCards: [{ label: 'Adobe Firefly Standard' }] },
        ];

        await el.continueFromResolvedOffer(resolvedOffer, PRODUCT_CODE);

        const productRenders = el.messages.filter((m) => String(m.content).includes('Found your product:'));
        expect(productRenders, 'the product is shown once, from Step 2').to.have.lengthOf(1);
    });

    it('carries the flow forward instead of stopping dead', async () => {
        // The first version of this guard only skipped the lookup, which left
        // the user staring at "Resolving offer..." with nothing after it.
        el.selectedReleaseProduct = { arrangement_code: PRODUCT_CODE };

        await el.continueFromResolvedOffer(resolvedOffer, PRODUCT_CODE);

        expect(sent.calledOnce, 'a turn must advance the flow').to.equal(true);
        const detail = sent.firstCall.args[0].detail;
        expect(detail.message).to.include('Proceed to Step 6');
        expect(detail.message).to.include('do not ask for either again');
        expect(detail.context.hidden, 'the nudge is not shown to the user').to.equal(true);
    });

    it('ignores case when comparing the arrangement code', async () => {
        el.selectedReleaseProduct = { arrangement_code: PRODUCT_CODE.toLowerCase() };

        await el.continueFromResolvedOffer(resolvedOffer, PRODUCT_CODE);

        expect(reResolved.called).to.equal(false);
    });

    it('still resolves the product when the offer belongs to a different one', async () => {
        el.selectedReleaseProduct = { arrangement_code: 'PA-9999' };

        await el.continueFromResolvedOffer(resolvedOffer, PRODUCT_CODE);

        expect(reResolved.calledWith(PRODUCT_CODE), 'a different product is new information').to.equal(true);
    });

    it('still resolves the product on the offer-first entry, where nothing is selected', async () => {
        el.selectedReleaseProduct = null;

        await el.continueFromResolvedOffer(resolvedOffer, PRODUCT_CODE);

        expect(reResolved.calledWith(PRODUCT_CODE)).to.equal(true);
    });
});
