import { expect } from '@esm-bundle/chai';
import { computeUniqueTitle, getFragmentTitleScope } from '../../src/utils/unique-fragment-title.js';

describe('computeUniqueTitle', () => {
    it('returns the input title unchanged when there is no collision', () => {
        expect(computeUniqueTitle('lucy-card', ['other'])).to.equal('lucy-card');
    });

    it('suffixes with -1 on a single collision', () => {
        expect(computeUniqueTitle('lucy-card', ['lucy-card'])).to.equal('lucy-card-1');
    });

    it('picks the next free number in a chain', () => {
        expect(computeUniqueTitle('lucy-card', ['lucy-card', 'lucy-card-1', 'lucy-card-2'])).to.equal('lucy-card-3');
    });

    it('fills gaps by picking the lowest free number', () => {
        expect(computeUniqueTitle('lucy-card', ['lucy-card', 'lucy-card-2'])).to.equal('lucy-card-1');
    });

    it('treats a title already ending in -# as an ordinary title, only suffixing on a real collision', () => {
        expect(computeUniqueTitle('lucy-card-2', ['other'])).to.equal('lucy-card-2');
        expect(computeUniqueTitle('lucy-card-2', ['lucy-card-2'])).to.equal('lucy-card-2-1');
    });
});

describe('getFragmentTitleScope', () => {
    it('returns the parent folder path of the fragment', () => {
        expect(getFragmentTitleScope({ path: '/content/dam/mas/sandbox/en_US/lucy-card' })).to.equal(
            '/content/dam/mas/sandbox/en_US',
        );
    });

    it('returns null when the fragment has no path', () => {
        expect(getFragmentTitleScope({})).to.equal(null);
        expect(getFragmentTitleScope(null)).to.equal(null);
    });

    it('scopes by folder, so the same title in a different surface/locale folder does not collide', () => {
        const scopeA = getFragmentTitleScope({ path: '/content/dam/mas/sandbox/en_US/lucy-card' });
        const scopeB = getFragmentTitleScope({ path: '/content/dam/mas/acom/en_US/lucy-card' });
        expect(scopeA).to.not.equal(scopeB);
    });
});
