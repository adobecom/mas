import { readFileSync } from 'fs';
import { expect } from 'chai';
import { PRODUCT_FRAGMENT_MAP, SEGMENTS, resolveProduct } from '../../src/agent/product-fragment-map.js';

const tools = JSON.parse(readFileSync(new URL('../../src/agent/bcos-tools.json', import.meta.url), 'utf-8'));
const { productName, segment } = tools.config.input_schema.properties;

describe('resolveProduct', () => {
    it('resolves a known product case-insensitively with trimming', () => {
        expect(resolveProduct('  Photoshop ')).to.deep.equal({
            individual: '9941bca0-5304-47f7-aeb3-4f638aeb8791',
            team: 'c2c79d69-8990-44b8-9a86-071c69e4a25a',
            edu: '7f8315df-c95e-4b19-858d-4ecb60f8ab5c',
        });
    });

    it('returns undefined for an unknown product', () => {
        expect(resolveProduct('Nonexistent')).to.be.undefined;
    });

    it('returns undefined when no product name is given', () => {
        expect(resolveProduct('')).to.be.undefined;
        expect(resolveProduct(undefined)).to.be.undefined;
    });
});

describe('PRODUCT_FRAGMENT_MAP', () => {
    it('only uses known segments', () => {
        for (const segments of Object.values(PRODUCT_FRAGMENT_MAP)) {
            expect(SEGMENTS).to.include.members(Object.keys(segments));
        }
    });

    it('matches the productName and segment enums in bcos-tools.json', () => {
        expect(productName.enum.map((name) => name.toLowerCase())).to.have.members(Object.keys(PRODUCT_FRAGMENT_MAP));
        expect(segment.enum).to.deep.equal(SEGMENTS);
    });
});
