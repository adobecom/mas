const { expect } = require('chai');
const proxyquire = require('proxyquire');

const commonStub = { fetchOdin: async () => ({}), getValues: () => null };
const load = (overrides = {}) =>
    proxyquire('../../src/find-replace/search.js', { '../common.js': { ...commonStub, ...overrides } });

const { matchesText } = load();

describe('find-replace/search: matchesText', () => {
    it('matches a case-insensitive substring by default', () => {
        expect(matchesText('Back to School sale', 'school', false)).to.equal(true);
    });
    it('is case-sensitive when matchCase is true', () => {
        expect(matchesText('Back to School sale', 'school', true)).to.equal(false);
        expect(matchesText('Back to School sale', 'School', true)).to.equal(true);
    });
    it('returns false for null/undefined values', () => {
        expect(matchesText(null, 'x', false)).to.equal(false);
        expect(matchesText(undefined, 'x', false)).to.equal(false);
    });
});

describe('find-replace/search: extractLocale', () => {
    const { extractLocale } = load();
    it('pulls the locale segment from a mas fragment path', () => {
        expect(extractLocale('/content/dam/mas/acom/en_US/photoshop-abm')).to.equal('en_US');
    });
    it('returns null when the path does not match', () => {
        expect(extractLocale('/some/other/path')).to.equal(null);
        expect(extractLocale()).to.equal(null);
    });
});
