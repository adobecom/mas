import { check, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';

// Load the fragment IDs from the CSV file
const fragments = new SharedArray('fragments', () => {
    const filePath = `./fragment-files/${__ENV.ENV?.length > 0 ? __ENV.ENV + '-' : ''}fragments.csv`;
    const f = open(filePath).split('\n'); // Read CSV
    let fragmentArray = f
        .slice(1) // Remove header,
        .map((line) => line.trim()) //white spaces,
        .filter((line) => line.length === 36); // non well formatted items,
    fragmentArray = fragmentArray.slice(
        0,
        __ENV.MAX_FRAGMENTS || fragmentArray.length,
    ); // limit the number of fragments

    console.log('Fragments:', fragmentArray);
    return fragmentArray;
});

export const options = {
    stages: [
        { duration: __ENV.DURATION || '10s', target: __ENV.USERS || 10 },
        { duration: __ENV.DURATION * 2 || '20s', target: __ENV.USERS || 10 },
        { duration: __ENV.DURATION || '10s', target: 0 },
    ],
};

export default function () {
    const ENV = __ENV.ENV || 'prod';
    const SLEEP = __ENV.SLEEP || 1;
    const prefix = ENV === 'prod' ? '' : `${ENV}-`;
    const baseUrl = `https://${prefix}${__ENV.TEST_FRAG_URL}`;
    const fragmentIndex = (__VU - 1 + __ITER) % fragments.length; // rotates per user & iteration
    const fragment = fragments[fragmentIndex];
    const url = `${baseUrl}/${fragment}`;
    const res = http.get(url);

    // Assertions to validate response
    // Check response status
    const is200 = check(res, {
        'is status 200': (r) => r.status === 200,
    });
    if (!is200) {
        console.error(`Failed URL: ${url}, Status: ${res.status}`);
    } else {
        const fields = res?.body?.length > 0 ? JSON.parse(res.body).fields : {};
        const fieldCheck = check(fields, {
            'cardTitle is not empty': (f) => {
                return f?.cardTitle?.length > 0;
            },
        });
        if (!fieldCheck) {
            console.error(`Failed URL: ${url}, Fields: ${fields}`);
        }
    }
    sleep(SLEEP);
}
