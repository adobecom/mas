import { check, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';

// Load the OSIs from the CSV file
const osis = new SharedArray('fragments', () => {
    const filePath = './wcs-reqs.csv';
    const f = open(filePath).split('\n'); // Read CSV
    return f.slice(1).map((line) => line.trim()); // Remove header and whitespace
});

export const options = {
    stages: [
        { duration: __ENV.DURATION || '10s', target: __ENV.USERS || 10 },
        { duration: __ENV.DURATION * 2 || '20s', target: __ENV.USERS || 10 },
        { duration: __ENV.DURATION || '10s', target: 0 },
    ],
};

export default function () {
    const SLEEP = __ENV.SLEEP || 1;
    const api_key = __ENV.APIKEY || 'wcms-commerce-ims-ro-user-milo';
    const locale = { country: 'US', locale: 'en_US' };
    const osiIndex = (__VU - 1 + __ITER) % osis.length; // rotates per user & iteration
    const osi = osis[osiIndex];
    const url = `${__ENV.TEST_WCS_URL}${osi}&country=${locale.country}&language=${locale.country === 'GB' ? 'EN' : 'MULT'}&locale=${locale.locale}&api_key=${api_key}&landscape=PUBLISHED`;
    const res = http.get(url);

    // Assertions to validate response
    // Check response status
    const is200 = check(res, {
        'is status 200': (r) => r.status === 200,
    });
    if (!is200) {
        console.error(`Failed URL: ${url}, Status: ${res.status}`);
    } else {
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
