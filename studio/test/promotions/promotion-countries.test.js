import { expect } from '@esm-bundle/chai';
import {
    toCountryGeoTag,
    isCountryGeoTag,
    getSelectedCountriesFromGeos,
    mergeCountriesIntoGeos,
    getCountriesForSurfaces,
    getCountryGroups,
} from '../../src/promotions/promotion-countries.js';

describe('promotion-countries', () => {
    describe('toCountryGeoTag / isCountryGeoTag', () => {
        it('builds an uppercase mas:locale/<CC> tag id, matching the existing geos convention', () => {
            expect(toCountryGeoTag('fr')).to.equal('mas:locale/FR');
        });

        it('recognizes a bare two-letter country tag', () => {
            expect(isCountryGeoTag('mas:locale/US')).to.be.true;
        });

        it('does not treat a personalization tag as a country tag', () => {
            expect(isCountryGeoTag('mas:pzn/smb')).to.be.false;
        });

        it('does not treat a language-locale tag as a country tag', () => {
            expect(isCountryGeoTag('mas:locale/fr_FR')).to.be.false;
        });
    });

    describe('getSelectedCountriesFromGeos', () => {
        it('extracts uppercase country codes from the geos field, ignoring other tags', () => {
            const countries = getSelectedCountriesFromGeos(['mas:locale/US', 'mas:pzn/smb', 'mas:locale/FR']);
            expect(countries).to.deep.equal(['US', 'FR']);
        });

        it('returns an empty array for an empty or absent geos list', () => {
            expect(getSelectedCountriesFromGeos([])).to.deep.equal([]);
            expect(getSelectedCountriesFromGeos()).to.deep.equal([]);
        });
    });

    describe('mergeCountriesIntoGeos', () => {
        it('replaces only the country tags, preserving every other geo value', () => {
            const merged = mergeCountriesIntoGeos(['mas:locale/US', 'mas:pzn/smb'], ['FR']);
            expect(merged).to.deep.equal(['mas:pzn/smb', 'mas:locale/FR']);
        });

        it('clears all countries when given an empty selection', () => {
            const merged = mergeCountriesIntoGeos(['mas:locale/US', 'mas:pzn/smb'], []);
            expect(merged).to.deep.equal(['mas:pzn/smb']);
        });
    });

    describe('getCountriesForSurfaces', () => {
        it('returns the deduped union of country codes across every surface', () => {
            const acomOnly = getCountriesForSurfaces(['acom']);
            const union = getCountriesForSurfaces(['acom', 'express']);
            expect(union.length).to.be.greaterThan(0);
            for (const code of acomOnly) {
                expect(union).to.include(code);
            }
            expect(new Set(union).size).to.equal(union.length);
        });

        it('returns an empty list for an empty surfaces array', () => {
            expect(getCountriesForSurfaces([])).to.deep.equal([]);
            expect(getCountriesForSurfaces()).to.deep.equal([]);
        });
    });

    describe('getCountryGroups', () => {
        it('groups countries available on the selected surfaces by region', () => {
            const groups = getCountryGroups(['acom']);
            expect(groups.length).to.be.greaterThan(0);
            for (const group of groups) {
                expect(group.name).to.be.a('string');
                expect(group.items.length).to.be.greaterThan(0);
                for (const item of group.items) {
                    expect(item).to.have.keys(['value', 'label']);
                }
            }
        });

        it('returns no groups for an empty surfaces array', () => {
            expect(getCountryGroups([])).to.deep.equal([]);
        });
    });
});
