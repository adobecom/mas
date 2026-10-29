const { expect } = require('chai');

let GUIDED_OFFER_SEARCH_PROMPT;

/**
 * ENTERPRISE offers are filtered out of every assistant result in Studio, so the
 * guided offer-search prompt must not offer ENTERPRISE as a customer segment,
 * while the individual and team choices stay in their original order.
 */
describe('ai-chat/enterprise offer filter', () => {
    before(async () => {
        ({ GUIDED_OFFER_SEARCH_PROMPT } = await import('../../src/ai-chat/prompt-templates.js'));
    });

    it('does not offer ENTERPRISE as a customer segment', () => {
        expect(GUIDED_OFFER_SEARCH_PROMPT).to.not.match(/enterprise/i);
    });

    it('keeps the individual and team customer segments in order', () => {
        const individual = GUIDED_OFFER_SEARCH_PROMPT.indexOf('"value": "INDIVIDUAL"');
        const team = GUIDED_OFFER_SEARCH_PROMPT.indexOf('"value": "TEAM"');
        expect(individual).to.be.greaterThan(-1);
        expect(team).to.be.greaterThan(individual);
    });
});
