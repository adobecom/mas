import { expect } from '@esm-bundle/chai';
import {
    toCountryTag,
    getSelectedCountries,
    getPersonalizationGeos,
    getEligibleCountries,
    setCountriesInGeos,
    setPersonalizationGeos,
    pruneIneligibleCountries,
} from '../../src/promotions/promotion-countries.js';

describe('promotion-countries', () => {
    it('builds a pzn country tag', () => {
        expect(toCountryTag('US')).to.equal('mas:pzn/country/US');
    });

    it('reads country codes from short and long pzn country tags only', () => {
        const geos = [
            'mas:pzn/country/US',
            '/content/cq:tags/mas/pzn/country/fr',
            'mas:pzn/country',
            'mas:locale/en_GB',
            'mas:pzn/smb',
        ];
        expect(getSelectedCountries(geos)).to.deep.equal(['US', 'FR']);
    });

    it('reads personalization tags excluding pzn country and locale tags', () => {
        const geos = ['mas:pzn/smb', '/content/cq:tags/mas/pzn/teams', 'mas:pzn/country/US', 'mas:locale/en_US'];
        expect(getPersonalizationGeos(geos)).to.deep.equal(['mas:pzn/smb', '/content/cq:tags/mas/pzn/teams']);
    });

    it('returns no eligible countries without surfaces', () => {
        expect(getEligibleCountries([])).to.deep.equal([]);
    });

    it('returns sorted countries available on a single surface', () => {
        const countries = getEligibleCountries(['acom']);
        expect(countries).to.include.members(['US', 'BG']);
        expect(countries).to.deep.equal([...countries].sort());
        expect(new Set(countries).size).to.equal(countries.length);
    });

    it('returns only countries available on every selected surface', () => {
        const countries = getEligibleCountries(['acom', 'ccd']);
        expect(countries).to.include('US');
        expect(countries).to.not.include('BG');
    });

    it('replaces country tags and keeps other geos', () => {
        const geos = ['mas:locale/en_US', 'mas:pzn/smb', 'mas:pzn/country/US'];
        expect(setCountriesInGeos(geos, ['FR', 'DE'])).to.deep.equal([
            'mas:locale/en_US',
            'mas:pzn/smb',
            'mas:pzn/country/FR',
            'mas:pzn/country/DE',
        ]);
    });

    it('replaces personalization tags and keeps country and locale geos', () => {
        const geos = ['mas:locale/en_US', 'mas:pzn/smb', 'mas:pzn/country/US'];
        expect(setPersonalizationGeos(geos, ['mas:pzn/teams'])).to.deep.equal([
            'mas:locale/en_US',
            'mas:pzn/country/US',
            'mas:pzn/teams',
        ]);
    });

    it('removes countries not available on the selected surfaces', () => {
        const geos = ['mas:locale/en_US', 'mas:pzn/country/US', 'mas:pzn/country/BG'];
        expect(pruneIneligibleCountries(geos, ['ccd'])).to.deep.equal(['mas:locale/en_US', 'mas:pzn/country/US']);
    });

    it('removes all countries when no surface is selected', () => {
        expect(pruneIneligibleCountries(['mas:pzn/smb', 'mas:pzn/country/US'], [])).to.deep.equal(['mas:pzn/smb']);
    });

    it('returns the same geos reference when nothing is pruned', () => {
        const geos = ['mas:pzn/country/US'];
        expect(pruneIneligibleCountries(geos, ['acom'])).to.equal(geos);
    });
});
