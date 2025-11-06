import { expect } from 'chai';
import { PATH_TOKENS, odinReferences, FRAGMENT_URL_PREFIX } from '../../src/fragment/utils/paths.js';

describe('PATH_TOKENS', () => {
    it('should work with adobe-home surface', async () => {
        const match = '/content/dam/mas/adobe-home/en_US/myadobehomecard'.match(PATH_TOKENS);
        expect(match).to.not.be?.null;
        expect(match).to.not.be?.undefined;
        const { surface } = match.groups;
        expect(surface).to.equal('adobe-home');
    });
});

describe('odinReferences', () => {
    it('should return URL without references parameter when allHydrated is false', () => {
        const result = odinReferences('test-id', false);
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id`);
    });

    it('should return URL with references=all-hydrated when allHydrated is true', () => {
        const result = odinReferences('test-id', true);
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id?references=all-hydrated`);
    });

    it('should return URL without references parameter when allHydrated is not provided', () => {
        const result = odinReferences('test-id');
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id`);
    });
});
