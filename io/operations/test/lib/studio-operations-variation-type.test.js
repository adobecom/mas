import { expect } from 'chai';
import { StudioOperations } from '../../src/lib/studio-operations.js';

const ops = () => new StudioOperations({}, {});
const BASE = '/content/dam/mas/acom/en_US';
const card = (path, variations = []) => ({
    id: path,
    path,
    fields: variations.length ? [{ name: 'variations', values: variations }] : [],
});

describe('StudioOperations.filterByVariationType', () => {
    const grouped = card(`${BASE}/parent-g`, [`${BASE}/pzn/child`]);
    const promo = card(`${BASE}/parent-p`, [`${BASE}/promotions/child`]);
    const locale = card(`${BASE}/parent-l`, ['/content/dam/mas/acom/en_GB/child']);
    const plain = card(`${BASE}/plain`, []);
    const all = [grouped, promo, locale, plain];

    it('returns every card for "all"', () => {
        expect(ops().filterByVariationType(all, 'all')).to.have.lengthOf(4);
    });

    it('keeps only cards that have a grouped (pzn) variation', () => {
        expect(ops().filterByVariationType(all, 'grouped')).to.deep.equal([grouped]);
    });

    it('keeps only cards that have a promo variation', () => {
        expect(ops().filterByVariationType(all, 'promo')).to.deep.equal([promo]);
    });

    it('keeps only cards that have a regional locale variation', () => {
        expect(ops().filterByVariationType(all, 'locale-variations')).to.deep.equal([locale]);
    });

    it('classifies a pzn path as grouped even over promo/locale (priority)', () => {
        const both = card(`${BASE}/p`, [`/content/dam/mas/acom/en_GB/pzn/child`]);
        expect(ops().filterByVariationType([both], 'grouped')).to.deep.equal([both]);
        expect(ops().filterByVariationType([both], 'locale-variations')).to.deep.equal([]);
    });

    it('still supports the existing default-locale-only / variations-only locale filters', () => {
        const regional = card('/content/dam/mas/acom/en_GB/x');
        expect(ops().filterByVariationType([grouped, regional], 'default-locale-only')).to.deep.equal([grouped]);
        expect(ops().filterByVariationType([grouped, regional], 'variations-only')).to.deep.equal([regional]);
    });
});
