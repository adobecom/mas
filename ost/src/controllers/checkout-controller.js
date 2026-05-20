export const WORKFLOW_STEPS = [
    { id: 'email', name: 'Email' },
    { id: 'bundle', name: 'Bundle' },
    { id: 'commitment', name: 'Commitment' },
    { id: 'segmentation', name: 'Segmentation' },
    { id: 'recommendation', name: 'Recommendation' },
    { id: 'payment', name: 'Payment' },
    { id: 'change-plan/team-upgrade/plans', name: 'Change Plan Team Plans' },
    { id: 'change-plan/team-upgrade/payment', name: 'Change Plan Team Payment' },
];

export const MODAL_TYPES = { TWP: 'twp', D2P: 'd2p', CRM: 'crm' };
export const DEFAULT_MODAL_BY_OFFER = { BASE: 'd2p', TRIAL: 'twp' };

export class CheckoutController {
    host;
    store;
    workflowStep = 'email';
    ctaText = '';
    enableModal = false;
    modalType = '';
    entitlement = false;
    upgrade = false;

    constructor(host, store) {
        this.host = host;
        this.store = store;
        host.addController(this);
    }

    hostConnected() {}

    hostDisconnected() {}

    setWorkflowStep(step) {
        this.workflowStep = step;
        this.host.requestUpdate();
        this.store?.notify();
    }

    setCtaText(text) {
        this.ctaText = text;
        this.host.requestUpdate();
        this.store?.notify();
    }

    toggleModal(enabled) {
        this.enableModal = enabled;
        if (enabled) this.workflowStep = 'segmentation';
        else this.workflowStep = 'email';
        this.host.requestUpdate();
        this.store?.notify();
    }

    setModalType(type) {
        this.modalType = type;
        this.host.requestUpdate();
        this.store?.notify();
    }

    toggleEntitlement(v) {
        this.entitlement = v;
        this.host.requestUpdate();
        this.store?.notify();
    }

    toggleUpgrade(v) {
        this.upgrade = v;
        this.host.requestUpdate();
        this.store?.notify();
    }
}
