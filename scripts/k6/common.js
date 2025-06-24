import { check } from 'k6';

export const ramp = (nb) => [
    { duration: __ENV.DURATION || '10s', target: nb },
    { duration: __ENV.DURATION * 2 || '20s', target: nb },
    { duration: __ENV.DURATION || '10s', target: 0 },
];

export const step = (nb) => [
    { duration: '1s', target: nb },
    { duration: __ENV.DURATION || '20s', target: nb },
];

function logHeaders(response) {
    return ['Server-Timing', 'Cache-Control', 'X-Request-Id', 'Akamai-Grn']
        .map((header) => `${header}: ${response.headers[header]}`)
        .join(', ');
}

export function checkResponse(response, customCheck, log = false) {
    const is200 = check(response, {
        'is status 200': (r) => r.status === 200,
    });
    if (!is200) {
        console.error(`URL: ${response.url}, Status: ${response.status}, Headers: ${logHeaders(response)}`);
    } else {
        if (log) {
            console.log(`URL: ${response.url}, Status: ${response.status}, Headers: ${logHeaders(response)}`);
        }
        customCheck(response);
    }
}
