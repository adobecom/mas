import { expect } from '@open-wc/testing';
import { normalizeTitleForCompare, splitBaseAndSuffix, resolveUniqueTitle } from '../../src/common/utils/unique-title-utils.js';

describe('unique-title-utils', () => {
    describe('normalizeTitleForCompare', () => {
        it('trims and lowercases', () => {
            expect(normalizeTitleForCompare(' Lucy-Card ')).to.equal('lucy-card');
        });

        it('handles empty/undefined input', () => {
            expect(normalizeTitleForCompare(undefined)).to.equal('');
            expect(normalizeTitleForCompare('')).to.equal('');
        });
    });

    describe('splitBaseAndSuffix', () => {
        it('splits a trailing numeric suffix', () => {
            expect(splitBaseAndSuffix('lucy-card-3')).to.deep.equal({ base: 'lucy-card', suffix: 3 });
        });

        it('returns the whole trimmed title as base when there is no numeric suffix', () => {
            expect(splitBaseAndSuffix('lucy-card')).to.deep.equal({ base: 'lucy-card', suffix: null });
        });
    });

    describe('resolveUniqueTitle', () => {
        it('returns a title unique in its path exactly as typed', () => {
            expect(resolveUniqueTitle('lucy-card', [])).to.deep.equal({ finalTitle: 'lucy-card', adjusted: false });
        });

        it('appends -1 when the base title is already taken', () => {
            expect(resolveUniqueTitle('lucy-card', ['lucy-card'])).to.deep.equal({
                finalTitle: 'lucy-card-1',
                adjusted: true,
            });
        });

        it('appends -2 when the base title and -1 are already taken', () => {
            expect(resolveUniqueTitle('lucy-card', ['lucy-card', 'lucy-card-1'])).to.deep.equal({
                finalTitle: 'lucy-card-2',
                adjusted: true,
            });
        });

        it('reuses a gap left by a deleted/renamed card', () => {
            expect(resolveUniqueTitle('lucy-card', ['lucy-card', 'lucy-card-2'])).to.deep.equal({
                finalTitle: 'lucy-card-1',
                adjusted: true,
            });
        });

        it('matches case-insensitively and ignores surrounding whitespace', () => {
            expect(resolveUniqueTitle(' Lucy-Card ', ['lucy-card'])).to.deep.equal({
                finalTitle: 'Lucy-Card-1',
                adjusted: true,
            });
        });

        it('treats a title already ending in a numeric suffix by its base', () => {
            expect(resolveUniqueTitle('lucy-card-3', ['lucy-card-3'])).to.deep.equal({
                finalTitle: 'lucy-card-1',
                adjusted: true,
            });
        });

        it('returns an empty title unchanged', () => {
            expect(resolveUniqueTitle('', ['lucy-card'])).to.deep.equal({ finalTitle: '', adjusted: false });
        });
    });
});
