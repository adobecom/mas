const { expect } = require('chai');

const { sumRegions, REGION_BY_COUNTRY } = require('../../src/fragment-usage/regions');

describe('fragment-usage regions', () => {
    describe('sumRegions', () => {
        it('sums per-country requests into their region', () => {
            expect(sumRegions({ US: 5, CA: 2, JP: 3 })).to.deep.equal({ 'LATAM/Americas': 7, JAPAC: 3 });
        });

        it('leaves out countries in no region, so unattributable traffic votes for none', () => {
            expect(sumRegions({ US: 5, ZZ: 9 })).to.deep.equal({ 'LATAM/Americas': 5 });
        });

        it('upper-cases country codes before mapping them', () => {
            expect(sumRegions({ gb: 4 })).to.deep.equal({ EMEA: 4 });
        });

        it('skips non-positive counts', () => {
            expect(sumRegions({ US: 0, CA: -3, MX: 2 })).to.deep.equal({ 'LATAM/Americas': 2 });
        });

        it('returns an empty map when there are no countries', () => {
            expect(sumRegions()).to.deep.equal({});
            expect(sumRegions({})).to.deep.equal({});
        });
    });

    it('groups GB under EMEA, matching the studio locale picker', () => {
        expect(REGION_BY_COUNTRY.get('GB')).to.equal('EMEA');
    });
});
