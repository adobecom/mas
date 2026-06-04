import { check, sleep } from 'k6';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { checkResponse, ramp, step } from './common.js';

// Load captured prod tuples (api_key, id, locale) from a CSV.
// The export is double-quote wrapped per row: "key,""uuid"",""en_US""" — strip all
// quotes, then split by comma. Override the path with --env IDS=/path/to/ids.csv.
const entries = new SharedArray('entries', () => {
    const filePath = __ENV.IDS || `${__ENV.HOME}/Downloads/ids.csv`;
    let rows = open(filePath)
        .split('\n')
        .map((line) => line.replace(/"/g, '').trim())
        .filter((line) => line.length > 0)
        .map((line) => {
            const [api_key, id, locale] = line.split(',');
            return { api_key, id, locale };
        })
        .filter((row) => row.id?.length === 36);
    rows = rows.slice(0, __ENV.MAX_FRAGMENTS || rows.length);
    console.log(`Loaded ${rows.length} entries from ${filePath}`);
    return rows;
});

const NB_USER = __ENV.USERS || 1;

// PROFILE=RAMP: gentle linear ramp to target over RAMP (default 2m), then hold for DURATION.
// Avoids the STEP thundering-herd (instant 0->target) that cold-starts containers and bursts
// state/Odin pools all at once — an artifact real, gradually-ramping traffic never produces.
const profiles = {
    STEP: step(NB_USER),
    RAMP: [
        { duration: __ENV.RAMP || '2m', target: NB_USER },
        { duration: __ENV.DURATION || '3m', target: NB_USER },
    ],
};

export const options = {
    stages: profiles[__ENV.PROFILE] ?? ramp(NB_USER),
};

export default function () {
    const SLEEP = __ENV.SLEEP || 1;
    const LOG = __ENV.LOG || false;
    const baseUrl = `https://${__ENV.TEST_FRAG_URL}`;
    const index = (__VU - 1 + __ITER) % entries.length; // rotate per user & iteration
    const { id, locale } = entries[index];
    const api_key = __ENV.APIKEY || entries[index].api_key;
    const url = `${baseUrl}?id=${id}&locale=${locale}&api_key=${api_key}`;
    const res = http.get(url);

    // Assertions to validate response
    // Check response status
    checkResponse(
        res,
        (res) => {
            const body = res?.body?.length > 0 ? JSON.parse(res.body) : {};
            const fields = body?.fields || {};
            const responseId = body?.id || '';
            const fieldCheck = check(fields, {
                'label or description is not empty': (f) => {
                    return f?.label?.length > 0 || f?.description?.value?.length > 0;
                },
            });
            check(responseId, {
                'id seems valid': (i) => i?.length > 0,
            });
            if (!fieldCheck) {
                console.error(`Failed URL: ${url}, Fields: ${fields?.label} / ${fields?.description?.value}`);
            }
        },
        LOG,
    );
    sleep(SLEEP);
}
