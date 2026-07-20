import { expect, fixture, html } from '@open-wc/testing';
import {
    OstCheckoutOptions,
    WORKFLOW_STEPS,
    MODAL_TYPES,
    DEFAULT_MODAL_BY_OFFER,
} from '../../src/components/ost-checkout-options.js';
import { store } from '../../src/store/ost-store.js';

const fireChange = (target, props) => {
    Object.assign(target, props);
    target.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
};

describe('ost-checkout-options', () => {
    let el;

    beforeEach(async () => {
        store.selectedOffer = undefined;
        store.ctaTextOption = null;
        el = await fixture(html`<ost-checkout-options></ost-checkout-options>`);
    });

    afterEach(() => {
        store.selectedOffer = undefined;
        store.ctaTextOption = null;
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

    it('notifies the store when workflow step changes', () => {
        let notified = false;
        const handler = () => {
            notified = true;
        };
        store.subscribe(handler);
        el.setWorkflowStep('payment');
        store.unsubscribe(handler);
        expect(notified).to.be.true;
    });

    it('workflow picker change handler updates the step from the event target', async () => {
        const picker = el.shadowRoot.querySelector('[data-testid="ost-workflow-menu"]');
        fireChange(picker, { value: 'commitment' });
        expect(el.workflowStep).to.equal('commitment');
    });

    it('workflowSteps getter returns the full list when modal is disabled', () => {
        expect(el.workflowSteps).to.have.length(WORKFLOW_STEPS.length);
    });

    it('workflowSteps getter collapses to segmentation-only when modal is enabled', () => {
        el.toggleModal(true);
        expect(el.workflowSteps).to.have.length(1);
        expect(el.workflowSteps[0].id).to.equal('segmentation');
    });

    it('enable-modal checkbox toggles modal and seeds d2p for a BASE offer', async () => {
        store.selectedOffer = { offer_type: 'BASE' };
        const checkbox = el.shadowRoot.querySelector('[data-testid="ost-checkbox-enable-modal"]');
        fireChange(checkbox, { checked: true });
        expect(el.enableModal).to.be.true;
        expect(el.modalType).to.equal('d2p');
    });

    it('enable-modal checkbox seeds twp for a TRIAL offer', async () => {
        store.selectedOffer = { offer_type: 'TRIAL' };
        const checkbox = el.shadowRoot.querySelector('[data-testid="ost-checkbox-enable-modal"]');
        fireChange(checkbox, { checked: true });
        expect(el.modalType).to.equal('twp');
    });

    it('enable-modal checkbox falls back to d2p for an unknown offer type', async () => {
        store.selectedOffer = { offer_type: 'OTHER' };
        const checkbox = el.shadowRoot.querySelector('[data-testid="ost-checkbox-enable-modal"]');
        fireChange(checkbox, { checked: true });
        expect(el.modalType).to.equal('d2p');
    });

    it('unchecking enable-modal resets the workflow step to email', async () => {
        const checkbox = el.shadowRoot.querySelector('[data-testid="ost-checkbox-enable-modal"]');
        fireChange(checkbox, { checked: true });
        fireChange(checkbox, { checked: false });
        expect(el.enableModal).to.be.false;
        expect(el.workflowStep).to.equal('email');
    });

    it('renders the modal-type picker only after modal is enabled', async () => {
        expect(el.shadowRoot.querySelector('[data-testid="ost-modal-type"]')).to.be.null;
        el.toggleModal(true);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('[data-testid="ost-modal-type"]')).to.not.be.null;
    });

    it('modal-type picker change handler sets the modal type from the event target', async () => {
        el.toggleModal(true);
        await el.updateComplete;
        const picker = el.shadowRoot.querySelector('[data-testid="ost-modal-type"]');
        fireChange(picker, { value: 'crm' });
        expect(el.modalType).to.equal('crm');
    });

    it('modalTypes getter excludes twp for a BASE offer', () => {
        store.selectedOffer = { offer_type: 'BASE' };
        const ids = el.modalTypes.map((t) => t.id);
        expect(ids).to.not.include('twp');
        expect(ids).to.include('d2p');
    });

    it('modalTypes getter excludes d2p for a TRIAL offer', () => {
        store.selectedOffer = { offer_type: 'TRIAL' };
        const ids = el.modalTypes.map((t) => t.id);
        expect(ids).to.not.include('d2p');
        expect(ids).to.include('twp');
    });

    it('modalTypes getter returns all three types when no offer is selected', () => {
        expect(el.modalTypes).to.have.length(3);
    });

    it('entitlements checkbox change handler enables entitlement', async () => {
        const checkbox = el.shadowRoot.querySelector('[data-testid="ost-checkbox-entitlements"]');
        fireChange(checkbox, { checked: true });
        expect(el.entitlement).to.be.true;
    });

    it('upgrade checkbox change handler enables upgrade', async () => {
        const checkbox = el.shadowRoot.querySelector('[data-testid="ost-checkbox-upgrade"]');
        fireChange(checkbox, { checked: true });
        expect(el.upgrade).to.be.true;
    });

    it('ctaTexts getter returns the texts from the store option', () => {
        store.ctaTextOption = {
            getTexts: () => [{ id: 'buy-now', name: 'Buy now' }],
            getDefaultText: () => 'buy-now',
        };
        expect(el.ctaTexts).to.deep.equal([{ id: 'buy-now', name: 'Buy now' }]);
    });

    it('ctaTexts getter returns an empty array when no option is set', () => {
        expect(el.ctaTexts).to.deep.equal([]);
    });

    it('defaultCtaText getter returns the option default text', () => {
        store.ctaTextOption = {
            getTexts: () => [],
            getDefaultText: () => 'get-started',
        };
        expect(el.defaultCtaText).to.equal('get-started');
    });

    it('renders the CTA text menu when the store has cta texts', async () => {
        store.ctaTextOption = {
            getTexts: () => [
                { id: 'buy-now', name: 'Buy now' },
                { id: 'try-free', name: 'Try for free' },
            ],
            getDefaultText: () => 'buy-now',
        };
        store.notify();
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('[data-testid="ost-cta-text-menu"]')).to.not.be.null;
    });

    it('CTA text menu button toggles the dropdown open', async () => {
        store.ctaTextOption = {
            getTexts: () => [{ id: 'buy-now', name: 'Buy now' }],
            getDefaultText: () => 'buy-now',
        };
        store.notify();
        await el.updateComplete;
        const button = el.shadowRoot.querySelector('[data-testid="ost-cta-text-menu"]');
        button.click();
        expect(el.ctaDropdownOpen).to.be.true;
    });

    it('selecting a CTA option updates ctaText and closes the dropdown', async () => {
        store.ctaTextOption = {
            getTexts: () => [
                { id: 'buy-now', name: 'Buy now' },
                { id: 'try-free', name: 'Try for free' },
            ],
            getDefaultText: () => 'buy-now',
        };
        store.notify();
        await el.updateComplete;
        el.shadowRoot.querySelector('[data-testid="ost-cta-text-menu"]').click();
        await el.updateComplete;
        const options = el.shadowRoot.querySelectorAll('.cta-option');
        options[1].click();
        expect(el.ctaText).to.equal('try-free');
        expect(el.ctaDropdownOpen).to.be.false;
    });

    it('renders CTA options as role=option inside a role=listbox dropdown', async () => {
        store.ctaTextOption = {
            getTexts: () => [
                { id: 'buy-now', name: 'Buy now' },
                { id: 'save-now', name: 'Save now' },
            ],
            getDefaultText: () => 'buy-now',
        };
        store.notify();
        await el.updateComplete;
        el.shadowRoot.querySelector('[data-testid="ost-cta-text-menu"]').click();
        await el.updateComplete;
        const dropdown = el.shadowRoot.querySelector('.cta-dropdown');
        expect(dropdown.getAttribute('role')).to.equal('listbox');
        const options = el.shadowRoot.querySelectorAll('.cta-option');
        options.forEach((o) => expect(o.getAttribute('role')).to.equal('option'));
        const saveNow = Array.from(options).find((o) => o.textContent.trim() === 'Save now');
        expect(saveNow, 'Save now option must render').to.exist;
    });

    it('handleDocClick closes the dropdown on an outside click', () => {
        el.ctaDropdownOpen = true;
        document.body.click();
        expect(el.ctaDropdownOpen).to.be.false;
    });

    it('applyDeepLink applies a full deep link to the controls once', () => {
        store.deepLink = {
            workflowStep: 'payment',
            text: 'try-free',
            modal: 'crm',
            entitlement: true,
            upgrade: true,
        };
        el.deepLinkApplied = false;
        el.applyDeepLink();
        expect(el.workflowStep).to.equal('segmentation');
        expect(el.modalType).to.equal('crm');
        expect(el.ctaText).to.equal('try-free');
        expect(el.entitlement).to.be.true;
        expect(el.upgrade).to.be.true;
        store.deepLink = {};
    });

    it('applyDeepLink is a no-op once already applied', () => {
        el.deepLinkApplied = true;
        store.deepLink = { workflowStep: 'payment' };
        el.applyDeepLink();
        expect(el.workflowStep).to.equal('email');
        store.deepLink = {};
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
