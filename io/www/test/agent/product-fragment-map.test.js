import { readFileSync } from 'fs';
import { expect } from 'chai';
import { PRODUCT_FRAGMENT_MAP, SEGMENTS, resolveFragmentId } from '../../src/agent/product-fragment-map.js';

const tools = JSON.parse(readFileSync(new URL('../../src/agent/bcos-tools.json', import.meta.url), 'utf-8'));
const { productName, pzn } = tools.config.input_schema.properties;

describe('resolveFragmentId', () => {
    it('resolves a known product case-insensitively with trimming', () => {
        expect(resolveFragmentId('  Photoshop ')).to.equal('9941bca0-5304-47f7-aeb3-4f638aeb8791');
        expect(resolveFragmentId('  Photoshop ', 'team')).to.equal('c2c79d69-8990-44b8-9a86-071c69e4a25a');
    });

    for (const [segment, fragmentId] of [
        ['individual', '128b6634-6631-4081-a6d9-9a2c7c003414'],
        ['team', '5c3fe2ac-0dbb-4495-9858-feac379ca19b'],
        ['edu', '2b1a6493-e03b-4803-a150-eed983094a05'],
    ]) {
        it(`returns the ${segment} default for unknown and inherited property names`, () => {
            for (const name of ['Nonexistent', 'constructor', '__proto__', 'toString']) {
                expect(resolveFragmentId(name, segment)).to.equal(fragmentId);
            }
        });
    }

    it('returns the segment default when a known product has no card for that audience', () => {
        expect(resolveFragmentId('Photography', 'team')).to.equal('5c3fe2ac-0dbb-4495-9858-feac379ca19b');
        expect(resolveFragmentId('Frame.io')).to.equal('128b6634-6631-4081-a6d9-9a2c7c003414');
        expect(resolveFragmentId('Photoshop', 'edu')).to.equal('2b1a6493-e03b-4803-a150-eed983094a05');
    });
});

describe('PRODUCT_FRAGMENT_MAP', () => {
    it('matches the productName and pzn enums in bcos-tools.json', () => {
        const products = [...new Set(Object.values(PRODUCT_FRAGMENT_MAP).flatMap((segment) => Object.keys(segment.products)))];
        expect(productName.enum.map((name) => name.toLowerCase())).to.have.members(products);
        expect(pzn.enum).to.have.members(SEGMENTS.filter((segment) => segment !== 'individual'));
        expect(tools.config.input_schema.properties).to.not.have.property('segment');
        expect(tools.config.query_template).to.not.have.property('segment');
    });

    it('uses standard customer and market segment fields in card metadata', () => {
        const { entity_info: entityInfo } = tools.config.multimodal.template;
        expect(entityInfo.customer_segment).to.equal('{{record.customer_segment}}');
        expect(entityInfo.market_segment).to.equal('{{record.market_segment}}');
        expect(entityInfo).to.not.have.property('segment');
    });
});
