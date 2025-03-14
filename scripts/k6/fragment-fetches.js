import { check, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { checkResponse, ramp, step } from './common.js';

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
const locales = [
    'de_DE',
    'en_US',
    'fr_FR',
    'it_IT',
    'ja_JP',
    'ko_KR',
    'pt_BR',
    'pl_PL',
    'tr_TR',
    'uk_UA',
];

const NB_USER = __ENV.USERS || 1;

export const options = {
    stages: __ENV.PROFILE === 'STEP' ? step(NB_USER) : ramp(NB_USER),
};

export default function () {
    const SLEEP = __ENV.SLEEP || 1;
    const LOG = __ENV.LOG || false;
    const baseUrl = `https://${__ENV.TEST_FRAG_URL}`;
    const api_key = __ENV.APIKEY || 'wcms-commerce-ims-ro-user-milo';
    const fragmentIndex = (__VU - 1 + __ITER) % fragments.length; // rotates per user & iteration
    const localeIndex = (__VU - 1 + __ITER) % locales.length; // rotates per user & iteration
    const fragment = fragments[fragmentIndex];
    const locale = locales[localeIndex];
    const url = `${baseUrl}?id=${fragment}&locale=${locale}&api_key=${api_key}`;
    const res = http.get(url);

    // Assertions to validate response
    // Check response status
    checkResponse(
        res,
        (res) => {
            const fields =
                res?.body?.length > 0 ? JSON.parse(res.body).fields : {};
            const fieldCheck = check(fields, {
                'description is not empty': (f) => {
                    return f?.description?.value?.length > 0;
                },
            });
            if (!fieldCheck) {
                console.error(`Failed URL: ${url}, Fields: ${fields}`);
            }
        },
        LOG,
    );
    sleep(SLEEP);
}
