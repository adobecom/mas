const ABM = 'ABM';
const PUF = 'PUF';
const M2M = 'M2M';
const PERPETUAL = 'PERPETUAL';
const P3Y = 'P3Y';

const ERROR_NOT_OFFER = 'Value is not an offer';

/**
 * Enum of known plan types.
 * @type {{ ABM: string, PUF: string, M2M: string, PERPETUAL: string, P3Y: string }}
 */
const PlanType = { ABM, PUF, M2M, PERPETUAL, P3Y };

/**
 * Computes the plan type from commitment and term strings.
 * @param {string|undefined} commitment
 * @param {string|undefined} term
 * @returns {string} plan type label or empty string
 */
function computePlanType(commitment, term) {
    switch (commitment) {
        case undefined:
            return ERROR_NOT_OFFER;
        case '':
            return '';
        case 'YEAR':
            return term === 'MONTHLY' ? ABM : term === 'ANNUAL' ? PUF : '';
        case 'MONTH':
            return term === 'MONTHLY' ? M2M : '';
        case 'PERPETUAL':
            return PERPETUAL;
        case 'TERM_LICENSE':
            return term === 'P3Y' ? P3Y : '';
        default:
            return '';
    }
}

/**
 * Computes the plan type and attaches it to a copy of the offer object.
 * @param {Object} offer - offer object with commitment and term properties
 * @returns {Object|string} new offer object with planType, or error string
 */
function applyPlanType(offer) {
    if (typeof offer !== 'object' || offer === null) return ERROR_NOT_OFFER;
    const { commitment, term } = offer;
    const planType = computePlanType(commitment, term);
    return { ...offer, planType };
}

export { PlanType, computePlanType, applyPlanType };
