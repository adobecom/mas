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

    it('ignores a release keyword in an earlier user turn', () => {
        const history = [{ role: 'user', content: 'kickstart cards for Firefly' }];

        expect(isReleaseIntent('Photoshop', history)).to.equal(false);
    });

    it('detects the turn after the guided Step 1 question', () => {
        const history = [
            { role: 'user', content: 'what is a release?' },
            { role: 'assistant', content: 'Which product is this release for?' },
        ];

        expect(isReleaseIntent('PA-1375', history)).to.equal(true);
    });

    it('leaves an ordinary question alone', () => {
        expect(isReleaseIntent('find offers for photoshop')).to.equal(false);
    });

    /**
     * The marker is produced only by continueWithOperationResult, which the client
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

    it('still treats the continuation as a release when the Step 1 question was just asked', () => {
        const message = '[MCS product data retrieved via list_products]\n- Adobe Photoshop (code: PHSP)';
        const history = [{ role: 'assistant', content: 'Which product is this release for?' }];

        expect(isReleaseIntent(message, history)).to.equal(true);
    });
});
