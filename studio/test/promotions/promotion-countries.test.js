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
        expect(toCountryTag('US', [{ path: '/content/cq:tags/mas/pzn/country/us' }])).to.equal('mas:pzn/country/us');
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

    it('reads country codes from locale-suffixed pzn country tags', () => {
        const geos = ['mas:pzn/country/en_US', '/content/cq:tags/mas/pzn/country/fr_fr'];
        expect(getSelectedCountries(geos)).to.deep.equal(['US', 'FR']);
    });

    it('deduplicates normalized country codes in first-seen order', () => {
        const geos = [
            'mas:pzn/country/fr',
            'mas:pzn/country/en_US',
            '/content/cq:tags/mas/pzn/country/fr_FR',
            'mas:pzn/country/us',
            'mas:pzn/country/en_GB',
            '/content/cq:tags/mas/pzn/country/GB',
        ];
        expect(getSelectedCountries(geos)).to.deep.equal(['FR', 'US', 'GB']);
    });

    it('reads personalization and locale tags excluding pzn country tags', () => {
        const geos = [
            'mas:pzn/smb',
            '/content/cq:tags/mas/pzn/teams',
            'mas:pzn/country/US',
            'mas:locale/en_US',
            '/content/cq:tags/mas/locale/fr_FR',
        ];
        expect(getPersonalizationGeos(geos)).to.deep.equal([
            'mas:pzn/smb',
            '/content/cq:tags/mas/pzn/teams',
            'mas:locale/en_US',
            '/content/cq:tags/mas/locale/fr_FR',
        ]);
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
        expect(setCountriesInGeos(geos, ['FR', 'DE'], ['mas:pzn/country/fr', 'mas:pzn/country/DE'])).to.deep.equal([
            'mas:locale/en_US',
            'mas:pzn/smb',
            'mas:pzn/country/fr',
            'mas:pzn/country/DE',
        ]);
    });

    it('preserves original geos when the country selection is unchanged', () => {
        const geos = ['mas:pzn/country/fr_FR', 'mas:pzn/smb', '/content/cq:tags/mas/pzn/country/au'];
        expect(setCountriesInGeos(geos, getSelectedCountries(geos))).to.deep.equal(geos);
    });

    it('adds only new countries using their exact taxonomy IDs', () => {
        const geos = ['mas:pzn/country/fr_FR', 'mas:pzn/smb'];
        expect(setCountriesInGeos(geos, ['FR', 'AU'], ['mas:pzn/country/au'])).to.deep.equal([...geos, 'mas:pzn/country/au']);
    });

    it('rejects a new country absent from the taxonomy', () => {
        expect(() => setCountriesInGeos([], ['AU'], ['mas:pzn/country/KW'])).to.throw('AU');
    });

    it('prefers a country-wide taxonomy tag over a regional tag', () => {
        expect(toCountryTag('AU', ['mas:pzn/country/en_AU', 'mas:pzn/country/au'])).to.equal('mas:pzn/country/au');
    });

    it('uses an unambiguous locale-form taxonomy ID verbatim', () => {
        expect(toCountryTag('FR', ['mas:pzn/country/fr_FR'])).to.equal('mas:pzn/country/fr_FR');
    });

    it('removes only deselected countries and preserves every retained geo', () => {
        const geos = ['mas:pzn/country/fr_FR', 'mas:pzn/smb', '/content/cq:tags/mas/pzn/country/fr', 'mas:pzn/country/au'];
        expect(setCountriesInGeos(geos, ['FR'])).to.deep.equal(geos.slice(0, 3));
    });

    it('preserves eligible country tags when a surface change prunes another country', () => {
        const geos = ['/content/cq:tags/mas/pzn/country/en_US', 'mas:pzn/smb', 'mas:pzn/country/bg'];
        expect(pruneIneligibleCountries(geos, ['ccd'])).to.deep.equal(geos.slice(0, 2));
    });

    it('replaces personalization and locale tags and keeps country geos', () => {
        const geos = ['mas:locale/en_US', 'mas:pzn/smb', 'mas:pzn/country/US'];
        expect(setPersonalizationGeos(geos, ['mas:pzn/teams'])).to.deep.equal(['mas:pzn/country/US', 'mas:pzn/teams']);
    });

    it('clears personalization and locale tags and keeps country geos', () => {
        const geos = ['mas:locale/en_US', '/content/cq:tags/mas/locale/fr_FR', 'mas:pzn/smb', 'mas:pzn/country/US'];
        expect(setPersonalizationGeos(geos, [])).to.deep.equal(['mas:pzn/country/US']);
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
