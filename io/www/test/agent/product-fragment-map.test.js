import { readFileSync } from 'fs';
import { expect } from 'chai';
import { PRODUCT_FRAGMENT_MAP, SEGMENTS, resolveProduct } from '../../src/agent/product-fragment-map.js';

const tools = JSON.parse(readFileSync(new URL('../../src/agent/bcos-tools.json', import.meta.url), 'utf-8'));
const { productName, pzn } = tools.config.input_schema.properties;

describe('resolveProduct', () => {
    it('resolves a known product case-insensitively with trimming', () => {
        expect(resolveProduct('  Photoshop ')).to.deep.equal({
            individual: '9941bca0-5304-47f7-aeb3-4f638aeb8791',
            team: 'c2c79d69-8990-44b8-9a86-071c69e4a25a',
            edu: '15754a77-40ba-45c6-b761-fc3e815adf15',
        });
    });

    it('returns undefined for an unknown product', () => {
        expect(resolveProduct('Nonexistent')).to.be.undefined;
    });

    it('returns undefined when no product name is given', () => {
        expect(resolveProduct('')).to.be.undefined;
        expect(resolveProduct(undefined)).to.be.undefined;
    });

    it('includes the additional education cards on the brand-concierge surface', () => {
        expect(resolveProduct('Photography').edu).to.equal('f00dad45-531a-41b2-bd98-bd5bfed389d3');
        expect(resolveProduct('Acrobat Pro').edu).to.equal('1605af8e-05b4-4017-a5ce-03ea85c49f76');
        expect(resolveProduct('Acrobat Express').edu).to.equal('8e16d3ee-bf1e-452f-b371-c1513a04dafa');
    });
});

describe('PRODUCT_FRAGMENT_MAP', () => {
    it('only uses known segments', () => {
        for (const segments of Object.values(PRODUCT_FRAGMENT_MAP)) {
            expect(SEGMENTS).to.include.members(Object.keys(segments));
        }
    });

    it('matches the productName and pzn enums in bcos-tools.json', () => {
        expect(productName.enum.map((name) => name.toLowerCase())).to.have.members(Object.keys(PRODUCT_FRAGMENT_MAP));
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
