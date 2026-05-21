import { expect, fixture, html } from '@open-wc/testing';
import {
    OstCheckoutOptions,
    WORKFLOW_STEPS,
    MODAL_TYPES,
    DEFAULT_MODAL_BY_OFFER,
} from '../../src/components/ost-checkout-options.js';

describe('ost-checkout-options', () => {
    let el;

    beforeEach(async () => {
        el = await fixture(html`<ost-checkout-options></ost-checkout-options>`);
    });

    it('is an OstCheckoutOptions instance', () => {
        expect(el).to.be.instanceOf(OstCheckoutOptions);
    });

    it('exposes back-compat `checkout` getter pointing at self', () => {
        expect(el.checkout).to.equal(el);
    });

    it('has correct initial defaults', () => {
        expect(el.workflowStep).to.equal('email');
        // ctaText is auto-initialized in connectedCallback to defaultCtaText so
        // the UI's displayed default matches the underlying state (otherwise
        // handleUse emits an empty options.ctaText and Studio drops the
        // checkout link's text attribute). When store.ctaTextOption is unset
        // (as in unit tests) defaultCtaText falls back to 'Buy now'.
        expect(el.ctaText).to.equal('Buy now');
        expect(el.enableModal).to.be.false;
        expect(el.modalType).to.equal('');
        expect(el.entitlement).to.be.false;
        expect(el.upgrade).to.be.false;
    });

    it('sets workflow step', () => {
        el.setWorkflowStep('payment');
        expect(el.workflowStep).to.equal('payment');
    });

    it('sets CTA text', () => {
        el.setCtaText('Buy now');
        expect(el.ctaText).to.equal('Buy now');
    });

    it('toggles modal on and sets workflow to segmentation', () => {
        el.toggleModal(true);
        expect(el.enableModal).to.be.true;
        expect(el.workflowStep).to.equal('segmentation');
    });

    it('toggles modal off and resets workflow to email', () => {
        el.toggleModal(true);
        el.toggleModal(false);
        expect(el.enableModal).to.be.false;
        expect(el.workflowStep).to.equal('email');
    });

    it('sets modal type', () => {
        el.setModalType('twp');
        expect(el.modalType).to.equal('twp');
    });

    it('toggles entitlement', () => {
        el.toggleEntitlement(true);
        expect(el.entitlement).to.be.true;
        el.toggleEntitlement(false);
        expect(el.entitlement).to.be.false;
    });

    it('toggles upgrade', () => {
        el.toggleUpgrade(true);
        expect(el.upgrade).to.be.true;
    });
});

describe('WORKFLOW_STEPS', () => {
    it('has 8 workflow steps', () => {
        expect(WORKFLOW_STEPS).to.have.length(8);
    });

    it('starts with email', () => {
        expect(WORKFLOW_STEPS[0].id).to.equal('email');
    });

    it('includes change-plan steps', () => {
        const ids = WORKFLOW_STEPS.map((s) => s.id);
        expect(ids).to.include('change-plan/team-upgrade/plans');
        expect(ids).to.include('change-plan/team-upgrade/payment');
    });
});

describe('MODAL_TYPES', () => {
    it('has TWP, D2P, CRM', () => {
        expect(MODAL_TYPES.TWP).to.equal('twp');
        expect(MODAL_TYPES.D2P).to.equal('d2p');
        expect(MODAL_TYPES.CRM).to.equal('crm');
    });
});

describe('DEFAULT_MODAL_BY_OFFER', () => {
    it('maps BASE to d2p and TRIAL to twp', () => {
        expect(DEFAULT_MODAL_BY_OFFER.BASE).to.equal('d2p');
        expect(DEFAULT_MODAL_BY_OFFER.TRIAL).to.equal('twp');
    });
});
