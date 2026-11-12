import { Log } from './log.js';

const IMS_COUNTRY_COOKIE = /(?:^|;\s*)ims_country_code=([^;]*)/;

export function getImsCountryCookie() {
    const match = document.cookie.match(IMS_COUNTRY_COOKIE);
    if (!match) return null;
    let country;
    try {
        country = decodeURIComponent(match[1]);
    } catch {
        // malformed cookie value
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
    if (country) {
        Log.module('ims').debug('Got user country from cookie:', country);
    }
    return Promise.resolve(country);
}

/**
 * IMS promises of a service. Each one is created on first read, so pages that
 * never check the user do not poll for adobeIMS, and can be replaced.
 */
export function Ims() {
    let ready;
    let signedIn;
    let country;
    return {
        get imsReadyPromise() {
            return (ready ??= imsReady());
        },
        set imsReadyPromise(promise) {
            ready = promise;
        },
        get imsSignedInPromise() {
            return (signedIn ??= imsSignedIn(this.imsReadyPromise));
        },
        set imsSignedInPromise(promise) {
            signedIn = promise;
        },
        get imsCountryPromise() {
            return (country ??= imsCountry());
        },
        set imsCountryPromise(promise) {
            country = promise;
        },
    };
}
