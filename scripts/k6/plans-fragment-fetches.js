import { check, sleep } from 'k6';
import http from 'k6/http';
import { checkResponse, ramp, step } from './common.js';

const NB_USER = __ENV.USERS || 1;

export const options = {
    stages: __ENV.PROFILE === 'STEP' ? step(NB_USER) : ramp(NB_USER),
};

function requestFragment(baseUrl, fragment, locale, api_key, LOG) {
    const url = `${baseUrl}?id=${fragment}&locale=${locale}&api_key=${api_key}`;
    const res = http.get(url);

    // Assertions to validate response
    // Check response status
    checkResponse(
        res,
        (res) => {
            const body = res?.body?.length > 0 ? JSON.parse(res.body) : {};
            const fields = body?.fields || {};
            const id = body?.id || '';
            const fieldCheck = check(fields, {
                'label or description is not empty': (f) => {
                    return f?.label?.length > 0 || f?.description?.value?.length > 0;
                },
            });
            check(id, {
                'id seems valid': (i) => i && (!fragment[locale] || i === fragment[locale]),
            });
            if (!fieldCheck) {
                console.error(`Failed URL: ${url}, Fields: ${fields?.label} / ${fields?.description?.value}`);
            }
        },
        LOG,
    );
}

export default function () {
    const SLEEP = __ENV.SLEEP || 1;
    const LOG = __ENV.LOG || false;
    const baseUrl = `https://${__ENV.TEST_FRAG_URL}`;
    const api_key = __ENV.APIKEY || 'wcms-commerce-ims-ro-user-milo';
    const locale = 'en_US';
    requestFragment(baseUrl, '07f9729e-dc1f-4634-829d-7aa469bb0d33', locale, api_key, LOG);
    requestFragment(baseUrl, '745bf04d-0112-4468-a6d4-15db07e93578', locale, api_key, LOG);
    requestFragment(baseUrl, '2bee9d3e-55ae-4701-b946-44b32fa5d9fa', locale, api_key, LOG);
    requestFragment(baseUrl, 'e6e35985-bcc3-4d2a-bbe5-c9eb4b3851e8', locale, api_key, LOG);
    sleep(SLEEP);
}
