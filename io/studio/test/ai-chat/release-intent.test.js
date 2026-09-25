const { expect } = require('chai');

let isReleaseIntent;

describe('ai-chat/isReleaseIntent', () => {
    before(async () => {
        ({ isReleaseIntent } = await import('../../src/ai-chat/index.js'));
    });

    it('detects an explicit release request', () => {
        expect(isReleaseIntent('create cards for photoshop')).to.equal(true);
        expect(isReleaseIntent('help me create a new product launch')).to.equal(true);
    });

    it('detects a release already under way from the history', () => {
        const history = [{ role: 'user', content: 'kickstart cards for Firefly' }];

        expect(isReleaseIntent('Photoshop', history)).to.equal(true);
    });

    it('leaves an ordinary question alone', () => {
        expect(isReleaseIntent('find offers for photoshop')).to.equal(false);
    });

    /**
     * The marker is produced only by continueWithMCPResult, which the client
     * calls only when the active flow is NOT release — the release flow renders
     * its product selection locally instead. Treating the marker as a release
     * request loaded the guided release prompt and its tools onto a turn that
     * needs neither, inflating it past the action's budget.
     */
    it('does not treat an MCS product-data continuation as a release', () => {
        const message =
            '[MCS product data retrieved via list_products]\n- Adobe Photoshop (code: PHSP, arrangement: phsp_direct_individual)';

        expect(isReleaseIntent(message)).to.equal(false);
    });

    it('still treats the continuation as a release when the history says so', () => {
        const message = '[MCS product data retrieved via list_products]\n- Adobe Photoshop (code: PHSP)';
        const history = [{ role: 'user', content: 'create cards for photoshop' }];

        expect(isReleaseIntent(message, history)).to.equal(true);
    });
});
