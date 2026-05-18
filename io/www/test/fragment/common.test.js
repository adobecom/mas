import { expect } from 'chai';
import { matchesGeo } from '../../src/fragment/utils/common.js';

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

        describe('short-form CQ tags', () => {
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
            it('does not match a tag whose last segment is the value but second-to-last is not locale/country', () => {
                // mas:locale/BE/fr_BE — last two segments are BE/fr_BE, BE is not "locale" or "country"
                const result = matchesGeo(['mas:locale/BE/fr_BE'], { regionLocale: 'fr_BE' });
                expect(result).to.be.null;
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
});
