import { expect } from 'chai';
import { matchesGeo, getCountry } from '../../src/fragment/utils/common.js';

describe('common utils', () => {
    describe('matchesGeo', () => {
        describe('long-form CQ tag paths', () => {
            it('matches regionLocale against /content/cq:tags/mas/locale/<value>', () => {
                const result = matchesGeo(['/content/cq:tags/mas/locale/en_US'], { regionLocale: 'en_US' });
                expect(result).to.deep.equal({ region: true, country: false });
            });

            it('matches country against /content/cq:tags/mas/country/<value>', () => {
                const result = matchesGeo(['/content/cq:tags/mas/country/CH'], { country: 'CH' });
                expect(result).to.deep.equal({ region: false, country: true });
            });

            it('returns null when neither dimension matches', () => {
                const result = matchesGeo(['/content/cq:tags/mas/locale/fr_FR'], { regionLocale: 'en_US' });
                expect(result).to.be.null;
            });
        });

        describe('Short-form CQ tags', () => {
            it('matches regionLocale against mas:locale/<value> (namespace-prefixed)', () => {
                const result = matchesGeo(['mas:locale/BE/fr_BE', 'mas:pzn/country/de', 'mas:locale/en_US'], {
                    regionLocale: 'en_US',
                    country: 'FR',
                });
                expect(result).to.deep.equal({ region: true, country: false });
            });

            it('matches country against mas:pzn/country/<value>', () => {
                const result = matchesGeo(['mas:pzn/country/DE'], { country: 'DE' });
                expect(result).to.deep.equal({ region: false, country: true });
            });

            it('is case-insensitive on the value', () => {
                const result = matchesGeo(['mas:pzn/country/de'], { country: 'DE' });
                expect(result).to.deep.equal({ region: false, country: true });
            });
        });

        describe('non-geo tags are not matched spuriously', () => {
            it('matches nested locale format locale/<country>/<locale>', () => {
                // production format: locale dimension / country code / locale value
                const result = matchesGeo(['mas:locale/BE/fr_BE'], { regionLocale: 'fr_BE' });
                expect(result).to.deep.equal({ region: true, country: false });
            });

            it('matches nested locale format for GR (en_GR)', () => {
                const result = matchesGeo(['mas:locale/GR/en_GR', 'mas:pzn/country/ar'], {
                    regionLocale: 'en_GR',
                    country: 'GR',
                });
                expect(result).to.deep.equal({ region: true, country: false });
            });

            it('does not match unrelated taxonomy paths ending in /<value>', () => {
                const result = matchesGeo(['mas:promotion/en_US'], { regionLocale: 'en_US' });
                expect(result).to.be.null;
            });
        });

        describe('country fallback from regionLocale', () => {
            it('extracts country from regionLocale when country is not supplied', () => {
                const result = matchesGeo(['mas:pzn/country/FR'], { regionLocale: 'fr_FR' });
                expect(result).to.deep.equal({ region: false, country: true });
            });

            it('returns null with no regionLocale and no country', () => {
                const result = matchesGeo(['mas:locale/en_US'], {});
                expect(result).to.be.null;
            });
        });
    });

    describe('getCountry', () => {
        it('prefers explicit country', () => {
            expect(getCountry({ country: 'LU', locale: 'fr_FR' })).to.equal('LU');
        });

        it('falls back to country segment of locale', () => {
            expect(getCountry({ locale: 'fr_FR' })).to.equal('FR');
        });

        it('returns empty string when both are missing or malformed', () => {
            expect(getCountry({})).to.equal('');
            expect(getCountry({ locale: 'fr' })).to.equal('');
        });
    });
});
