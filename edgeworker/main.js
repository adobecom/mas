import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import { logger } from 'log';

export function responseProvider(request) {

    let headers = request.getHeaders() || {};
    delete headers.host;

    // Forward the request to oriagin
    return httpRequest(`${request.scheme}://${request.host}${request.url}`, {
        method: request.method,
        headers: headers
    })
    .then(response => {
        logger.log('Origin response status: %d', response.status);

        // Only change status code for 429 responses
        if (response.status === 429) {
            logger.log('Converting 429 to 529 to trigger serve-stale');

            // Just change the status code, keep everything else identical
            return Promise.resolve(
                createResponse(
                    529,
                    getSafeResponseHeaders(response.getHeaders()),
                    response.body
                )
            );
        }
        else{

        // For all other responses, pass through unchanged
            return Promise.resolve(
                createResponse(
                    response.status,
                    getSafeResponseHeaders(response.getHeaders()),
                    response.body
                )
            );
        }
    })
    .catch(error => {
        logger.log('EdgeWorker error: %s', error.message);
        // Return 529 on error to also trigger serve-stale
        return Promise.resolve(
            createResponse(
                529,
                {'content-type': ['text/plain']},
                'EdgeWorker Error'
            )
        );
    });
}

const UNSAFE_RESPONSE_HEADERS = [
    'content-length',
    'transfer-encoding',
    'connection',
    'vary',
    'accept-encoding',
    'content-encoding',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'upgrade',
    'host',
];

function getSafeResponseHeaders(headers) {
    return Object.keys(headers).reduce((safeHeaders, header) => {
        if (!UNSAFE_RESPONSE_HEADERS.includes(header.toLowerCase())) {
            safeHeaders[header] = headers[header];
        }
        return safeHeaders;
    }, {});
}
