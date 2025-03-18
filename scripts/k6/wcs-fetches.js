import { check, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';

// Load the OSIs from the CSV file
const osis = new SharedArray('fragments', () => {
    const filePath = './wcs-reqs.csv';
    const f = open(filePath).split('\n'); // Read CSV
    let osiArray = f
        .slice(1) // Remove header,
        .map((line) => line.trim()) // whitespace,
        .filter((line) => line.length === 43); // non well formatted items
    osiArray = osiArray.slice(0, __ENV.MAX_OSI || osiArray.length); // limit the number of osis
    console.log('OSIs:', osiArray);
    return osiArray;
});

const NB_USERS = __ENV.USERS || 10;

export const options = {
    stages: __ENV.PROFILE === 'STEP' ? STEP : RAMP,
};

const logHeaders = (response) =>
    ['Server-Timing', 'Cache-Control', 'X-Request-Id', 'Akamai-Grn']
        .map((header) => `${header}: ${response.headers[header]}`)
        .join(', ');

export default function () {
    const SLEEP = __ENV.SLEEP || 1;
    const LOG = __ENV.LOG || false;
    const api_key = __ENV.APIKEY || 'wcms-commerce-ims-ro-user-milo';
    const locale = { country: 'US', locale: 'en_US' };
    const osiIndex = (__VU - 1 + __ITER) % osis.length; // rotates per user & iteration
    const osi = osis[osiIndex];
    const landscape =
        __ENV.TEST_WCS_URL?.indexOf('.stage.') > 0 ? 'ALL' : 'PUBLISHED';
    const url = `${__ENV.TEST_WCS_URL}${osi}&country=${locale.country}&language=${locale.country === 'GB' ? 'EN' : 'MULT'}&locale=${locale.locale}&api_key=${api_key}&landscape=${landscape}`;
    const res = http.get(url);

    // Assertions to validate response
    // Check response status
    const is200 = check(res, {
        'is status 200': (r) => r.status === 200,
    });
    if (!is200) {
        console.error(
            `URL: ${url}, Status: ${res.status}, Headers: ${logHeaders(res)}`,
        );
    } else {
        if (LOG) {
            console.log(
                `URL: ${url}, Status: ${res.status}, Headers: ${logHeaders(res)}`,
            );
        }
        check(res, {
            'response is not empty': (r) => r.body && r.body.length > 0,
            'price is not empty': (r) => {
                const json = JSON.parse(r.body);
                return (
                    json.resolvedOffers &&
                    json.resolvedOffers.length > 0 &&
                    json.resolvedOffers[0].priceDetails?.price?.length > 0
                );
            },
        });
    }
    sleep(SLEEP);
}
