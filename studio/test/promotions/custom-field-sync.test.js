import { expect } from '@esm-bundle/chai';
import {
    diffCustomFields,
    isCustomFieldRenameAllowed,
    normalizeCustomFieldEntries,
} from '../../src/promotions/custom-field-sync.js';

describe('custom-field-sync', () => {
    describe('normalizeCustomFieldEntries', () => {
        it('drops entries with blank or missing names and keeps original index', () => {
            const entries = [{ name: 'foo' }, { name: '  ' }, { name: 'bar' }, {}];
            expect(normalizeCustomFieldEntries(entries)).to.deep.equal([
                { name: 'foo', index: 0 },
                { name: 'bar', index: 2 },
            ]);
        });

        it('returns an empty array for undefined input', () => {
            expect(normalizeCustomFieldEntries()).to.deep.equal([]);
        });
    });

    describe('diffCustomFields', () => {
        it('reports no missing, renamed, or extra fields when name sets are identical', () => {
            const defaultEntries = [{ name: 'foo' }, { name: 'bar' }];
            const promoEntries = [{ name: 'foo' }, { name: 'bar' }];
            expect(diffCustomFields({ defaultEntries, promoEntries })).to.deep.equal({
                missing: [],
                renames: [],
                extra: [],
            });
        });

        it('reports a default-only field as missing', () => {
            const defaultEntries = [{ name: 'foo' }, { name: 'bar' }];
            const promoEntries = [{ name: 'foo' }];
            const { missing, renames } = diffCustomFields({ defaultEntries, promoEntries });
            expect(missing).to.deep.equal(['bar']);
            expect(renames).to.deep.equal([]);
        });

        it('reports a position-paired differing name as a rename to the default name', () => {
            const defaultEntries = [{ name: 'foo' }, { name: 'bar' }];
            const promoEntries = [{ name: 'foo' }, { name: 'baz' }];
            const { missing, renames } = diffCustomFields({ defaultEntries, promoEntries });
            expect(missing).to.deep.equal([]);
            expect(renames).to.deep.equal([{ from: 'baz', to: 'bar', index: 1 }]);
        });

        it('does not infer a rename when the promo name already exists elsewhere on the default', () => {
            const defaultEntries = [{ name: 'foo' }, { name: 'bar' }];
            const promoEntries = [{ name: 'bar' }, { name: 'foo' }];
            const { missing, renames, extra } = diffCustomFields({ defaultEntries, promoEntries });
            expect(missing).to.deep.equal([]);
            expect(renames).to.deep.equal([]);
            expect(extra).to.deep.equal([]);
        });

        it('reports a promo-only field as extra', () => {
            const defaultEntries = [{ name: 'foo' }];
            const promoEntries = [{ name: 'foo' }, { name: 'extraField' }];
            const { extra } = diffCustomFields({ defaultEntries, promoEntries });
            expect(extra).to.deep.equal(['extraField']);
        });

        it('treats missing entries/arrays as empty', () => {
            expect(diffCustomFields()).to.deep.equal({ missing: [], renames: [], extra: [] });
        });
    });

    describe('isCustomFieldRenameAllowed', () => {
        it('returns false for a promo variation', () => {
            expect(isCustomFieldRenameAllowed({ isPromoVariation: true })).to.be.false;
        });

        it('returns true for a default fragment', () => {
            expect(isCustomFieldRenameAllowed({ isPromoVariation: false })).to.be.true;
            expect(isCustomFieldRenameAllowed({})).to.be.true;
        });
    });
});
