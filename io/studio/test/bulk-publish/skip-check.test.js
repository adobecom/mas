const { expect } = require('chai');
const { isAlreadyPublished } = require('../../src/bulk-publish/skip-check.js');

describe('bulk-publish/skip-check.js', () => {
    it('returns skip=false when fragment is null', () => {
        expect(isAlreadyPublished(null)).to.deep.equal({ skip: false, reason: 'no-fragment' });
    });

    it('returns skip=false when fragment has never been published', () => {
        const fragment = { modified: { at: '2026-04-01T00:00:00.000Z' } };
        expect(isAlreadyPublished(fragment)).to.deep.equal({ skip: false, reason: 'never-published' });
    });

    it('skips when published.at is after modified.at', () => {
        const fragment = {
            published: { at: '2026-04-05T12:00:00.000Z' },
            modified: { at: '2026-04-01T00:00:00.000Z' },
        };
        const result = isAlreadyPublished(fragment);
        expect(result.skip).to.equal(true);
        expect(result.reason).to.equal('already-published');
    });

    it('skips when published.at equals modified.at', () => {
        const fragment = {
            published: { at: '2026-04-05T12:00:00.000Z' },
            modified: { at: '2026-04-05T12:00:00.000Z' },
        };
        expect(isAlreadyPublished(fragment).skip).to.equal(true);
    });

    it('publishes when modified.at is after published.at', () => {
        const fragment = {
            published: { at: '2026-04-01T00:00:00.000Z' },
            modified: { at: '2026-04-05T12:00:00.000Z' },
        };
        const result = isAlreadyPublished(fragment);
        expect(result.skip).to.equal(false);
        expect(result.reason).to.equal('modified-after-publish');
    });

    it('skips when published.at is present but modified.at is missing', () => {
        const fragment = { published: { at: '2026-04-05T12:00:00.000Z' } };
        const result = isAlreadyPublished(fragment);
        expect(result.skip).to.equal(true);
        expect(result.reason).to.equal('already-published');
        expect(result.modifiedAt).to.equal(null);
    });
});
