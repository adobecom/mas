const { expect } = require('chai');
const { PATH_TOKENS } = require('../../src/fragment/paths');

describe('PATH_TOKENS', () => {
    it('should work with adobe-home surface', async () => {
        const match = '/content/dam/mas/adobe-home/en_US/myadobehomecard'.match(
            PATH_TOKENS,
        );
        expect(match).to.not.be?.null;
        expect(match).to.not.be?.undefined;
        const { surface } = match.groups;
        expect(surface).to.equal('adobe-home');
    });
});
