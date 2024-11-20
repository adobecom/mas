import { check, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';

// Load the fragment IDs from the CSV file
const fragments = new SharedArray('fragments', () => {
    const filePath = `./fragment-files/${__ENV.ENV?.length > 0 ? __ENV.ENV + '-' : ''}fragments.csv`;
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
        check(res, {
            'response is not empty': (r) => r.body && r.body.length > 0,
            'cardTitle is not empty': (r) => {
                const json = JSON.parse(r.body);
                return (
                    json.fields &&
                    json.fields.cardTitle &&
                    json.fields.cardTitle.length > 0
                );
            },
        });
    }
    sleep(SLEEP);
}
