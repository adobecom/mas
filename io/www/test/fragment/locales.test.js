import { expect } from 'chai';
import {
    getLocaleCode,
    getLocaleByCode,
    getCountryName,
    getCountryFlag,
    getDefaultLocale,
    getDefaultLocaleCode,
    getDefaultLocales,
    getRegionLocales,
    getLanguageName,
} from '../../src/fragment/locales.js';

describe('locales', function () {
    describe('getLocaleCode', function () {
        it('should return locale code from locale object', function () {
            const locale = { lang: 'en', country: 'US' };
            expect(getLocaleCode(locale)).to.equal('en_US');
        });

        it('should return null when locale is null or undefined', function () {
            expect(getLocaleCode(null)).to.be.null;
            expect(getLocaleCode(undefined)).to.be.null;
        });
    });

    describe('getLocaleByCode', function () {
        it('should return locale object from locale code', function () {
            const result = getLocaleByCode('en_US');
            expect(result).to.deep.equal({ lang: 'en', country: 'US' });
        });

        it('should handle different locale codes', function () {
            expect(getLocaleByCode('fr_FR')).to.deep.equal({ lang: 'fr', country: 'FR' });
            expect(getLocaleByCode('ja_JP')).to.deep.equal({ lang: 'ja', country: 'JP' });
            expect(getLocaleByCode('pt_BR')).to.deep.equal({ lang: 'pt', country: 'BR' });
        });

        it('should return null when code is null or undefined', function () {
            expect(getLocaleByCode(null)).to.be.null;
            expect(getLocaleByCode(undefined)).to.be.null;
        });

        it('should return null for invalid locale code format', function () {
            expect(getLocaleByCode('')).to.be.null;
            expect(getLocaleByCode('en')).to.be.null;
            expect(getLocaleByCode('invalid')).to.be.null;
        });
    });

    describe('getCountryName', function () {
        it('should return country name for valid country code', function () {
            expect(getCountryName('US')).to.equal('United States');
        });

        it('should return country code when country is not found', function () {
            expect(getCountryName('XX')).to.equal('XX');
        });
    });

    describe('getCountryFlag', function () {
        it('should return country flag emoji for valid country code', function () {
            expect(getCountryFlag('US')).to.equal('🇺🇸');
        });

        it('should return default flag when country is not found', function () {
            expect(getCountryFlag('XX')).to.equal('🏴');
        });
    });

    describe('getDefaultLocale', function () {
        it('should return default locale', function () {
            const result = getDefaultLocale('acom', 'en_US');
            expect(result).to.be.an('object');
            expect(result.lang).to.equal('en');
            expect(result.country).to.equal('US');
            expect(result.regions).to.be.an('array');
            expect(result.regions.length).to.be.greaterThan(0);
        });

        it('should return null for invalid surface', function () {
            const result = getDefaultLocale('invalid_surface', 'en_US');
            expect(result).to.be.null;
        });

        it('should fallback to language match when country does not match', function () {
            const result = getDefaultLocale('acom', 'en_XX');
            expect(result).to.be.an('object');
            expect(result.lang).to.equal('en');
        });
    });

    describe('getDefaultLocaleCode', function () {
        it('should return default locale code for a regional variant', function () {
            expect(getDefaultLocaleCode('acom', 'fr_CA'), 'return fr_FR for fr_CA').to.equal('fr_FR');
            expect(getDefaultLocaleCode('acom', 'en_EG'), 'return en_US for en_EG').to.equal('en_US');
            expect(getDefaultLocaleCode('acom', 'en_US'), 'return en_US for en_US').to.equal('en_US');
            expect(getDefaultLocaleCode('acom', 'zh_TW'), 'return zh_TW for zh_TW').to.equal('zh_TW');
            // for acom AU and IN fall back to GB, pt_BR exists as a default language
            expect(getDefaultLocaleCode('acom', 'en_GB'), 'return en_GB for en_GB').to.equal('en_GB');
            expect(getDefaultLocaleCode('acom', 'en_AU'), 'return en_GB for en_AU').to.equal('en_GB');
            expect(getDefaultLocaleCode('acom', 'en_IN'), 'return en_GB for en_IN').to.equal('en_GB');
            expect(getDefaultLocaleCode('acom', 'pt_PT'), 'return pt_PT for pt_PT').to.equal('pt_PT');
            expect(getDefaultLocaleCode('acom', 'pt_BR'), 'return pt_BR for pt_BR').to.equal('pt_BR');

            // for ccd AU and IN fall back to US, pt_PT is a variation of pt_BR
            expect(getDefaultLocaleCode('ccd', 'pt_PT'), 'return pt_BR for pt_PT for ccd').to.equal('pt_BR');
            expect(getDefaultLocaleCode('ccd', 'en_AU'), 'return en_US for en_AU for ccd').to.equal('en_US');
            expect(getDefaultLocaleCode('ccd', 'en_IN'), 'return en_US for en_IN for ccd').to.equal('en_US');

            expect(getDefaultLocaleCode(null, 'pt_BR'), 'return null if no surface').to.be.null;
            expect(getDefaultLocaleCode('acom', null), 'return null if no locale code').to.be.null;
            expect(getDefaultLocaleCode('acom', undefined), 'return null if no locale code').to.be.null;
        });
    });

    describe('getDefaultLocales', function () {
        it('should return all default locales for a given surface', function () {
            const result = getDefaultLocales('acom');
            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);
            expect(result[0]).to.have.property('lang');
            expect(result[0]).to.have.property('country');
        });

        it('should return empty array for invalid surface', function () {
            const result = getDefaultLocales('invalid_surface');
            expect(result).to.be.an('array');
            expect(result.length).to.equal(0);
        });
    });

    describe('getRegionLocales', function () {
        it('should return region locales for a default locale on a surface', function () {
            const result = getRegionLocales('acom', 'en_GB', true);
            expect(result).to.be.an('array');
            // en_GB has regions ['AU', 'IN', 'GB'] in ACOM
            expect(result.length).to.be.equal(3);
            expect(result[0]).to.have.property('lang');
            expect(result[0]).to.have.property('country');
            expect(result[0].lang).to.equal('en');
            expect(result[0].country).to.equal('AU');
        });

        it('should not include default locale when includeDefault is false', function () {
            const result = getRegionLocales('acom', 'en_GB', false);
            expect(result).to.be.an('array');
            // en_GB has regions ['AU', 'IN'] in ACOM
            expect(result.length).to.be.equal(2);
        });

        it('should return region locales for a non default locale', function () {
            const result = getRegionLocales('acom', 'fr_LU', false);
            expect(result).to.be.an('array');
            expect(result.length).to.be.equal(4);
        });

        it('should return empty array if no regions', function () {
            const result = getRegionLocales('acom', 'pt_PT', false);
            expect(result).to.be.an('array');
            expect(result.length).to.be.equal(0);
        });

        it('should return empty array for invalid surface', function () {
            const result = getRegionLocales('invalid_surface', 'en_US', false);
            expect(result).to.be.an('array');
            expect(result.length).to.equal(0);
        });
    });

    describe('getLanguageName', function () {
        it('should return language name for a given language code', function () {
            expect(getLanguageName('en')).to.equal('English');
        });

        it('should return language code when language is not found', function () {
            expect(getLanguageName('xx')).to.equal('xx');
        });
    });
});
