import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

/**
 * Observed 2026-09-16: the user picked an offer through OST, confirmed the
 * templates, and got a SECOND card configuration instead of cards. The two
 * configurations disagreed about the base offer — the first showed the OSI the
 * user picked, the second showed the raw offer id from their message text.
 *
 * One cause behind both symptoms. Nothing pins the release flow on the
 * offer-first path: the deterministic bypass answers `get_offer_by_id`, which
 * guidedFlowHintForIntent does not map to a flow, and tryDispatchEnvelope then
 * clears activeGuidedFlow outright. So the confirmation turn went up with no
 * intentHint at all, the server re-classified "Confirmed. Create cards for
 * these variants..." as a brand new release request (a case its own classifier
 * fixture pins), and the model replayed Step 6 — filling the offer slot from
 * whichever identifier was loudest in the transcript.
 *
 * The client knew the answer to both the whole time.
 */
describe('MasChat pins the release flow it is already in', () => {
    let el;
    let storageSandbox;
    let sent;

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        sent = [];
        sinon.stub(el, 'handleSendMessage').callsFake(async (event) => {
            sent.push(event.detail);
        });
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
        storageSandbox.restore();
    });

    it('hints the release flow when the user confirms a card configuration', () => {
        el.handleConfirmationAction({ detail: { action: 'confirm', selectedVariants: ['catalog', 'plans'] } });

        expect(sent).to.have.lengthOf(1);
        expect(sent[0].message).to.contain('Confirmed');
        expect(sent[0].context.intentHint, 'without this the server re-classifies the confirmation as a new release').to.equal(
            'release',
        );
    });

    it('still carries the offer the user picked on that confirmation', () => {
        el.selectedReleaseOsi = 'jVU8fJJwyl3p_KvuJ2zgl6jHRMwfchJoShxIFB0sA_w';

        el.handleConfirmationAction({ detail: { action: 'confirm', selectedVariants: ['catalog'] } });

        expect(sent[0].context.osi).to.equal('jVU8fJJwyl3p_KvuJ2zgl6jHRMwfchJoShxIFB0sA_w');
    });

    it('hints the release flow when continuing from a resolved offer', async () => {
        el.selectedReleaseProduct = { arrangement_code: 'PA-1930', description: 'a product' };

        await el.continueFromResolvedOffer({ rawResult: { offer: { offer_id: 'X' } } }, 'PA-1930');

        expect(sent).to.have.lengthOf(1);
        expect(sent[0].message).to.contain('Step 6');
        expect(sent[0].context.intentHint, 'the turn that asks for the confirmation summary').to.equal('release');
    });

    it('leaves a cancel alone rather than pinning it to the flow being abandoned', () => {
        el.handleConfirmationAction({ detail: { action: 'cancel' } });

        expect(sent).to.have.lengthOf(1);
        expect(sent[0].message).to.contain('Start over');
        expect(sent[0].context.intentHint).to.equal(undefined);
    });
});

describe('MasChat does not let the model restate the chosen offer', () => {
    let el;
    let storageSandbox;

    const OSI = 'jVU8fJJwyl3p_KvuJ2zgl6jHRMwfchJoShxIFB0sA_w';
    const OFFER_ID = '58448C28EEFC20CBF9791A949EC12BF8';

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        // Settled product, so the summary enrichment never reaches for the network.
        el.selectedReleaseProduct = { arrangement_code: 'PA-1930', description: 'a product' };
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
        storageSandbox.restore();
    });

    it('replaces the offer the model wrote with the one the user picked', async () => {
        el.selectedReleaseOsi = OSI;

        // What the model emitted on the replayed step: the offer id from the
        // user's message text, not the OSI it was handed in context.
        const enriched = await el.enrichReleaseConfirmationSummary({ osi: OFFER_ID, product: {} });

        expect(enriched.osi, 'the summary must show the offer the user actually chose').to.equal(OSI);
    });

    it('replaces the trial offer the same way', async () => {
        el.selectedReleaseOsi = OSI;
        el.selectedReleaseTrialOsi = 'trial-osi-abc';

        const enriched = await el.enrichReleaseConfirmationSummary({ osi: OFFER_ID, trialOsi: 'something-else', product: {} });

        expect(enriched.trialOsi).to.equal('trial-osi-abc');
    });

    it('keeps the model value when the client holds no offer of its own', async () => {
        el.selectedReleaseOsi = null;
        el.selectedReleaseTrialOsi = null;

        const enriched = await el.enrichReleaseConfirmationSummary({ osi: OFFER_ID, product: {} });

        expect(enriched.osi, 'overriding with nothing would blank a working summary').to.equal(OFFER_ID);
    });

    it('leaves the rest of the summary untouched', async () => {
        el.selectedReleaseOsi = OSI;

        const enriched = await el.enrichReleaseConfirmationSummary({
            osi: OFFER_ID,
            locale: 'en_US',
            offeringType: { label: 'Annual, billed monthly' },
            product: {},
        });

        expect(enriched.locale).to.equal('en_US');
        expect(enriched.offeringType.label).to.equal('Annual, billed monthly');
    });
});
