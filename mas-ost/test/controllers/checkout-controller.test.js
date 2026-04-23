import { expect } from '@open-wc/testing';
import {
    CheckoutController,
    WORKFLOW_STEPS,
    MODAL_TYPES,
    DEFAULT_MODAL_BY_OFFER,
} from '../../src/controllers/checkout-controller.js';

function createMockHost() {
    return {
        controllers: [],
        addController(c) { this.controllers.push(c); },
        removeController() {},
        requestUpdate() {},
    };
}

describe('CheckoutController', () => {
    let host;
    let ctrl;

    beforeEach(() => {
        host = createMockHost();
        ctrl = new CheckoutController(host);
    });

    it('registers itself on the host', () => {
        expect(host.controllers).to.include(ctrl);
    });

    it('has correct initial defaults', () => {
        expect(ctrl.workflowStep).to.equal('email');
        expect(ctrl.ctaText).to.equal('');
        expect(ctrl.enableModal).to.be.false;
        expect(ctrl.modalType).to.equal('');
        expect(ctrl.entitlement).to.be.false;
        expect(ctrl.upgrade).to.be.false;
    });

    it('sets workflow step', () => {
        ctrl.setWorkflowStep('payment');
        expect(ctrl.workflowStep).to.equal('payment');
    });

    it('sets CTA text', () => {
        ctrl.setCtaText('Buy now');
        expect(ctrl.ctaText).to.equal('Buy now');
    });

    it('toggles modal on and sets workflow to segmentation', () => {
        ctrl.toggleModal(true);
        expect(ctrl.enableModal).to.be.true;
        expect(ctrl.workflowStep).to.equal('segmentation');
    });

    it('toggles modal off and resets workflow to email', () => {
        ctrl.toggleModal(true);
        ctrl.toggleModal(false);
        expect(ctrl.enableModal).to.be.false;
        expect(ctrl.workflowStep).to.equal('email');
    });

    it('sets modal type', () => {
        ctrl.setModalType('twp');
        expect(ctrl.modalType).to.equal('twp');
    });

    it('toggles entitlement', () => {
        ctrl.toggleEntitlement(true);
        expect(ctrl.entitlement).to.be.true;
        ctrl.toggleEntitlement(false);
        expect(ctrl.entitlement).to.be.false;
    });

    it('toggles upgrade', () => {
        ctrl.toggleUpgrade(true);
        expect(ctrl.upgrade).to.be.true;
    });

    it('calls host.requestUpdate on each setter', () => {
        let count = 0;
        host.requestUpdate = () => { count++; };
        ctrl.setWorkflowStep('bundle');
        ctrl.setCtaText('Go');
        ctrl.toggleModal(true);
        ctrl.setModalType('d2p');
        ctrl.toggleEntitlement(true);
        ctrl.toggleUpgrade(true);
        expect(count).to.equal(6);
    });

    it('hostConnected and hostDisconnected are callable', () => {
        ctrl.hostConnected();
        ctrl.hostDisconnected();
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
