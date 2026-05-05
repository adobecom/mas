const { expect } = require('chai');
const { resolvePaths } = require('../../src/bulk-publish/resolver.js');

describe('bulk-publish/resolver.js', () => {
    it('returns empty array when paths is missing or empty', () => {
        expect(resolvePaths(undefined, ['fr_FR'])).to.deep.equal([]);
        expect(resolvePaths([], ['fr_FR'])).to.deep.equal([]);
        expect(resolvePaths(null, ['fr_FR'])).to.deep.equal([]);
    });

    it('returns the original paths when locales are omitted', () => {
        const result = resolvePaths(['/content/dam/mas/acom/en_US/nico', '/content/dam/mas/acom/en_US/antonio'], undefined);
        expect(result).to.deep.equal(['/content/dam/mas/acom/en_US/nico', '/content/dam/mas/acom/en_US/antonio']);
    });

    it('returns the original paths when locales is an empty array', () => {
        const result = resolvePaths(['/content/dam/mas/acom/en_US/nico'], []);
        expect(result).to.deep.equal(['/content/dam/mas/acom/en_US/nico']);
    });

    it('expands paths with every locale and keeps the base path', () => {
        const result = resolvePaths(['/content/dam/mas/acom/en_US/nico'], ['fr_FR', 'de_DE']);
        expect(result).to.have.members([
            '/content/dam/mas/acom/en_US/nico',
            '/content/dam/mas/acom/fr_FR/nico',
            '/content/dam/mas/acom/de_DE/nico',
        ]);
        expect(result).to.have.lengthOf(3);
    });

    it('dedupes when a locale matches the base path locale', () => {
        const result = resolvePaths(['/content/dam/mas/acom/en_US/nico'], ['en_US', 'fr_FR']);
        expect(result).to.have.members(['/content/dam/mas/acom/en_US/nico', '/content/dam/mas/acom/fr_FR/nico']);
        expect(result).to.have.lengthOf(2);
    });

    it('skips non-string or empty entries in paths', () => {
        const result = resolvePaths(['/content/dam/mas/acom/en_US/nico', '', null, 42], []);
        expect(result).to.deep.equal(['/content/dam/mas/acom/en_US/nico']);
    });

    it('skips locales that produce a null target path', () => {
        const result = resolvePaths(['/not/a/mas/path'], ['fr_FR']);
        expect(result).to.deep.equal(['/not/a/mas/path']);
    });
});
