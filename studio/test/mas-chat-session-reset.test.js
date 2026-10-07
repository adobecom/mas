import { expect } from '@esm-bundle/chai';
import '../src/swc.js';
import '../src/mas-chat.js';
import { useIsolatedChatSessionStorage } from './helpers/chat-session-storage.js';

describe('MASA release state on session switch', () => {
    let el;
    let storageSandbox;

    beforeEach(async () => {
        storageSandbox = useIsolatedChatSessionStorage();
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
    });

    afterEach(() => {
        el.remove();
        storageSandbox.restore();
    });

    it('resetReleaseState clears product and offer selections', () => {
        el.selectedReleaseProduct = { arrangement_code: 'phsp_direct_individual' };
        el.selectedReleaseOffer = { offerId: 'A' };
        el.selectedReleaseOsi = 'osi-a';
        el.selectedReleaseTrialOffer = { offerId: 'T' };
        el.selectedReleaseTrialOsi = 'trial-a';
        el.trialCtaAsked = true;

        el.resetReleaseState();

        expect(el.selectedReleaseProduct).to.be.null;
        expect(el.selectedReleaseOffer).to.be.null;
        expect(el.selectedReleaseOsi).to.be.null;
        expect(el.selectedReleaseTrialOffer).to.be.null;
        expect(el.selectedReleaseTrialOsi).to.be.null;
        expect(el.trialCtaAsked).to.be.false;
    });

    it('does not carry one session’s release offers into another on switch', () => {
        el.selectedReleaseOsi = 'osi-from-session-a';
        el.selectedReleaseTrialOsi = 'trial-from-session-a';

        el.handleSessionChanged({ detail: { sessionId: 'some-other-session' } });

        expect(el.selectedReleaseOsi, 'base OSI must not bleed across sessions').to.be.null;
        expect(el.selectedReleaseTrialOsi, 'trial OSI must not bleed across sessions').to.be.null;
    });
});
