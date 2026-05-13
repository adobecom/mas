const SUCCESS = 'success';
const ERROR = 'error';
const OK = 'ok';
const FAIL = 'fail';

async function checkEndpoint(endpoint, validateJson) {
    let result = OK;
    try {
        const controller = new AbortController();
        // Increase timeout to 5 seconds for container environments
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Add headers that node-fetch included by default
        const response = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json, */*',
                'Accept-Encoding': 'gzip, deflate',
                'User-Agent': 'Mozilla/5.0 (compatible; mas-io-health-check/1.0)',
            },
        });
        clearTimeout(timeoutId);
        const json = await response.json();
        if (response?.ok) {
            const isJsonValid = validateJson(json);
            if (!isJsonValid) {
                result = {
                    status: FAIL,
                    reason: 'Invalid JSON.',
                    url: endpoint,
                };
            }
        } else {
            result = {
                status: FAIL,
                reason: `${response.status} ${response.statusText}`,
                url: endpoint,
            };
        }
    } catch (e) {
        console.log(`[healthcheck] Error checking endpoint ${endpoint}:`, e);
        result = {
            status: FAIL,
            reason: e.message,
            url: endpoint,
        };
    }
    return result;
}

async function main(params) {
    const { ODIN_CDN_ENDPOINT, ODIN_ORIGIN_ENDPOINT, WCS_CDN_ENDPOINT, WCS_ORIGIN_ENDPOINT } = params;
    let statusCode = 200;
    const body = {
        status: SUCCESS,
    };
    const validateOdinJson = (json) => json && !!json.id && !!json.fields?.variant;
    body.odinCDN = await checkEndpoint(ODIN_CDN_ENDPOINT, validateOdinJson);
    body.odinOrigin = await checkEndpoint(ODIN_ORIGIN_ENDPOINT, validateOdinJson);
    body.wcsCDN = await checkEndpoint(WCS_CDN_ENDPOINT, () => true);
    body.wcsOrigin = await checkEndpoint(WCS_ORIGIN_ENDPOINT, () => true);

    if ([body.odinCDN?.status, body.odinOrigin?.status, body.wcsCDN?.status, body.wcsOrigin?.status].includes(FAIL)) {
        body.status = ERROR;
        statusCode = 500;
    }

    return {
        statusCode,
        body,
    };
}

export { main };
