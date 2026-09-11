import { expect } from 'chai';
import { PATH_TOKENS, odinReferences, FRAGMENT_URL_PREFIX, REFERENCES } from '../../src/fragment/utils/paths.js';

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
    it('should return URL without references parameter when references mode is undefined', () => {
        const result = odinReferences('test-id', undefined, undefined);
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id`);
    });

    it('should return URL with references=all-hydrated for REFERENCES.ALL', () => {
        const result = odinReferences('test-id', undefined, REFERENCES.ALL);
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id?references=all-hydrated`);
    });

    it('should return URL with references=direct-hydrated for REFERENCES.DIRECT', () => {
        const result = odinReferences('test-id', undefined, REFERENCES.DIRECT);
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id?references=direct-hydrated`);
    });

    it('should return URL without references parameter when references mode is not provided', () => {
        const result = odinReferences('test-id');
        expect(result).to.equal(`${FRAGMENT_URL_PREFIX}/test-id`);
    });
});
