import { Log } from './log.js';

const IMS_COUNTRY_COOKIE = 'ims_country_code';

export function getImsCountryCookie() {
    /* c8 ignore next */
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)${IMS_COUNTRY_COOKIE}=([^;]*)`),
    );
    if (!match) return null;
    let country;
    try {
        country = decodeURIComponent(match[1]);
    } catch {
        return null;
    }
    return country.trim().toUpperCase() || null;
}

export function imsReady() {
    return Promise.resolve();
}

export function imsSignedIn() {
    return Promise.resolve(getImsCountryCookie() != null);
}

export function imsCountry() {
    const country = getImsCountryCookie();
    if (country)
        Log.module('ims').debug('Got user country from cookie:', country);
    return Promise.resolve(country);
}

export function Ims() {
    return {
        imsReadyPromise: imsReady(),
        imsSignedInPromise: imsSignedIn(),
        imsCountryPromise: imsCountry(),
    };
}
