import { delay } from '../archive/commerce/src/external.js';

const { adobeIMS } = window;

async function mockIms(countryCode) {
    window.adobeid = {
        authorize: () => '',
    };
    window.adobeIMS = {
        initialized: true,
        isSignedInUser: () => !!countryCode,
        async getProfile() {
            await delay(1);
            return { countryCode };
        },
    };
}

function unmockIms() {
    window.adobeIMS = adobeIMS;
}

export { mockIms, unmockIms };
