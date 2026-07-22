import { expect } from 'chai';
import { PRODUCT_FRAGMENT_MAP, resolveFragmentId } from '../../src/agent/product-fragment-map.js';

describe('resolveFragmentId', () => {
    it('resolves a known product case-insensitively with trimming', () => {
        expect(resolveFragmentId('  Photoshop ')).to.equal('8413981a-2b38-46b3-813a-ae161415c6fd');
    });

    it('returns undefined for an unknown product', () => {
        expect(resolveFragmentId('Nonexistent')).to.be.undefined;
    });

    it('returns undefined when no product name is given', () => {
        expect(resolveFragmentId('')).to.be.undefined;
        expect(resolveFragmentId(undefined)).to.be.undefined;
    });

    it('maps the full initial product set', () => {
        expect(Object.keys(PRODUCT_FRAGMENT_MAP)).to.have.lengthOf(26);
    });
});
