import {
    WorkflowStep,
    CheckoutType,
} from '@pandora/commerce-checkout-url-builder';

const workflowSteps = {};
workflowSteps[CheckoutType.V2] = [
    { id: WorkflowStep.CHECKOUT, name: 'Checkout' },
    { id: WorkflowStep.CHECKOUT_EMAIL, name: 'Checkout Email' },
];
workflowSteps[CheckoutType.V3] = [
    { id: WorkflowStep.EMAIL, name: 'Email' },
    { id: WorkflowStep.BUNDLE, name: 'Bundle' },
    { id: WorkflowStep.COMMITMENT, name: 'Commitment' },
    { id: WorkflowStep.SEGMENTATION, name: 'Segmentation' },
    { id: WorkflowStep.RECOMMENDATION, name: 'Recommendation' },
    { id: WorkflowStep.PAYMENT, name: 'Payment' },
    {
        id: WorkflowStep.CHANGE_PLAN_TEAM_PLANS,
        name: 'Change Plan Team Plans',
    },
    {
        id: WorkflowStep.CHANGE_PLAN_TEAM_PAYMENT,
        name: 'Change Plan Team Payment',
    },
];

const defaultWfSteps = {};
defaultWfSteps[CheckoutType.V2] = WorkflowStep.CHECKOUT;
defaultWfSteps[CheckoutType.V3] = WorkflowStep.EMAIL;

const getDefaultWorkflowStep = (checkoutType) => {
    return defaultWfSteps[checkoutType];
};

const listWorkflowStepsForType = (checkoutType) => {
    return workflowSteps[checkoutType];
};

const getSelectedCheckoutType = (searchParameters) => {
    const linkCheckoutType = searchParameters.get('checkoutType');
    return !!linkCheckoutType &&
        Object.values(CheckoutType).includes(linkCheckoutType)
        ? linkCheckoutType
        : 'UCv3';
};

const getSelectedWorkflowStep = (searchParameters, checkoutType) => {
    const linkWorkflowStep = toggleWorkflowStepFormat(
        decodeURI(searchParameters.get('workflowStep'))
    );
    return !!linkWorkflowStep &&
        workflowSteps[checkoutType].find((step) => step.id === linkWorkflowStep)
        ? linkWorkflowStep
        : defaultWfSteps[checkoutType];
};

const toggleWorkflowStepFormat = (workflowStep) => {
    if (!workflowStep) {
        return '';
    }
    return workflowStep.includes('_')
        ? workflowStep.replace('_', '/')
        : workflowStep;
};

export {
    getDefaultWorkflowStep,
    listWorkflowStepsForType,
    getSelectedCheckoutType,
    getSelectedWorkflowStep,
};
