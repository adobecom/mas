import { expect } from 'chai';
import {
    getLocaleCode,
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
    });

    describe('getDefaultLocaleCode', function () {
        it('should return default locale code for a regional variant', function () {
            expect(getDefaultLocaleCode('acom', 'fr_CA'), 'should return fr_FR').to.equal('fr_FR');
            expect(getDefaultLocaleCode('acom', 'en_AU')).to.equal('en_GB');
            expect(getDefaultLocaleCode('ccd', 'en_AU')).to.equal('en_US');
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
    });

    describe('getRegionLocales', function () {
        it('should return region locales for a default locale on a surface', function () {
            const result = getRegionLocales('acom', 'en_GB', false);
            expect(result).to.be.an('array');
            // en_GB has regions ['AU', 'IN'] in ACOM
            expect(result.length).to.be.greaterThan(0);
            expect(result[0]).to.have.property('lang');
            expect(result[0]).to.have.property('country');
            expect(result[0].lang).to.equal('en');
            expect(result[0].country).to.equal('AU');
        });

        it('should return nothing for a non default locale', function () {
            const result = getRegionLocales('ccd', 'en_GB', false);
            expect(result).to.be.an('array');
            // en_GB is not default locale for ccd
            expect(result.length).to.be.equal(0);
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
