import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/swc.js';
import '../src/mas-chat.js';

/**
 * The Release Recovery buttons ("Pick a different offer", "Cancel release
 * flow") are offered on the two release dead ends, but nothing handled their
 * values. They fell through to the generic branch at the end of
 * handleButtonSelected, which ships the LABEL to the model as free text and
 * hides the value in context.buttonValue. So a recovery button became a
 * sentence for the model to interpret, on the exact turn the flow had already
 * gone wrong, and the release state it was recovering from was left intact.
 *
 * Neither button needs the model: one reopens OST for the product we already
 * resolved, the other clears the flow. The browser can do both, so it should.
 */
describe('MasChat release recovery buttons', () => {
    let el;

    beforeEach(async () => {
        el = document.createElement('mas-chat');
        document.body.appendChild(el);
        await el.updateComplete;
        sinon.stub(el, 'handleSendMessage').resolves();
        el.messages = [
            {
                role: 'assistant',
                content: 'No MCS product found.',
                buttonGroup: {
                    label: 'Release Recovery',
                    options: [
                        { label: 'Pick a different offer', value: 'release_pick_different_offer' },
                        { label: 'Cancel release flow', value: 'release_cancel' },
                    ],
                },
            },
        ];
        el.activeGuidedFlow = 'release_create';
        el.selectedReleaseProduct = { arrangement_code: 'phsp_direct_individual', name: 'Photoshop' };
        el.selectedReleaseOffer = { offer_id: 'abc' };
        el.selectedReleaseOsi = 'osi-1';
        el.selectedReleaseTrialOffer = { offer_id: 'trial' };
        el.selectedReleaseTrialOsi = 'osi-trial';
        el.trialCtaAsked = true;
    });

    afterEach(() => {
        sinon.restore();
        el.remove();
    });

    const click = (value, label) => el.handleButtonSelected({ detail: { value, label } });
    const lastMessage = () => el.messages[el.messages.length - 1];

    describe('pick a different offer', () => {
        it('reopens OST rather than asking the model to work out what to do', () => {
            click('release_pick_different_offer', 'Pick a different offer');

            expect(el.handleSendMessage.called, 'no round-trip is needed to reopen OST').to.equal(false);
            expect(lastMessage().openOst).to.equal(true);
        });

        it('reopens it scoped to the product already resolved', () => {
            click('release_pick_different_offer', 'Pick a different offer');

            expect(lastMessage().ostSearchParams.arrangement_code).to.equal('phsp_direct_individual');
        });

        it('keeps the release flow, since the user is retrying and not abandoning it', () => {
            click('release_pick_different_offer', 'Pick a different offer');

            expect(el.activeGuidedFlow).to.equal('release_create');
            expect(el.selectedReleaseProduct).to.not.equal(null);
        });

        it('clears only the offer that failed, so the stale one is not reused', () => {
            click('release_pick_different_offer', 'Pick a different offer');

            expect(el.selectedReleaseOffer).to.equal(null);
            expect(el.selectedReleaseOsi).to.equal(null);
        });

        it('falls back to asking the model when no product was ever resolved', () => {
            el.selectedReleaseProduct = null;

            click('release_pick_different_offer', 'Pick a different offer');

            // Nothing to scope an OST search to, so the model has to drive.
            expect(el.handleSendMessage.calledOnce).to.equal(true);
        });
    });

    describe('cancel release flow', () => {
        it('cancels in the browser rather than asking the model to cancel', () => {
            click('release_cancel', 'Cancel release flow');

            expect(el.handleSendMessage.called).to.equal(false);
        });

        it('clears every field the ABORT path clears', () => {
            click('release_cancel', 'Cancel release flow');

            expect(el.activeGuidedFlow).to.equal(null);
            expect(el.selectedReleaseProduct).to.equal(null);
            expect(el.selectedReleaseOffer).to.equal(null);
            expect(el.selectedReleaseOsi).to.equal(null);
            expect(el.selectedReleaseTrialOffer).to.equal(null);
            expect(el.selectedReleaseTrialOsi).to.equal(null);
            expect(el.trialCtaAsked).to.equal(false);
        });

        it('says the flow is cancelled instead of leaving the user with nothing', () => {
            click('release_cancel', 'Cancel release flow');

            expect(lastMessage().role).to.equal('assistant');
            expect(lastMessage().content).to.match(/cancel/i);
        });
    });

    it('still marks the button group answered, like every other button', () => {
        click('release_cancel', 'Cancel release flow');

        const group = el.messages.find((m) => m.buttonGroup?.label === 'Release Recovery').buttonGroup;
        expect(group.selectedValue).to.equal('release_cancel');
    });

    it('leaves unrelated buttons on the model path', () => {
        el.messages = [{ role: 'assistant', content: 'x', buttonGroup: { label: 'Offering Type', options: [] } }];

        click('subscription', 'Subscription');

        expect(el.handleSendMessage.calledOnce).to.equal(true);
    });
});
