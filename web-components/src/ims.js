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

export function imsReady({ interval = 200, maxAttempts = 25 } = {}) {
    const log = Log.module('ims');
    return new Promise((resolve) => {
        log.debug('Waiting for IMS to be ready');
        let count = 0;
        /* c8 ignore next 10 */
        function poll() {
            if (window.adobeIMS?.initialized) {
                resolve();
            } else if (++count > maxAttempts) {
                log.debug('Timeout');
                resolve();
            } else {
                setTimeout(poll, interval);
            }
        }
        poll();
    });
}

export function imsSignedIn(imsReadyPromise) {
    return imsReadyPromise.then(
        () => window.adobeIMS?.isSignedInUser() ?? false,
    );
}

export function imsCountry() {
    const country = getImsCountryCookie();
    if (country)
        Log.module('ims').debug('Got user country from cookie:', country);
    return Promise.resolve(country);
}

export function Ims() {
    const imsReadyPromise = imsReady();
    return {
        imsReadyPromise,
        imsSignedInPromise: imsSignedIn(imsReadyPromise),
        imsCountryPromise: imsCountry(),
    };
}
