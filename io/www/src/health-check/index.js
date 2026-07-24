const SUCCESS = 'success';
const ERROR = 'error';
const OK = 'ok';
const FAIL = 'fail';
const ENDPOINT_TIMEOUT = 5000;
const TOTAL_TIMEOUT = 4500;

async function checkEndpoint(endpoint, validateJson, totalSignal) {
    let result = OK;
    const controller = new AbortController();
    const abort = () => controller.abort();
    totalSignal.addEventListener('abort', abort, { once: true });
    const timeoutId = setTimeout(abort, ENDPOINT_TIMEOUT);
    try {
        const response = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json, */*',
                'Accept-Encoding': 'gzip, deflate',
                'User-Agent': 'Mozilla/5.0 (compatible; mas-io-health-check/1.0)',
            },
        });
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
    } finally {
        clearTimeout(timeoutId);
        totalSignal.removeEventListener('abort', abort);
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
    const totalController = new AbortController();
    const totalTimeoutId = setTimeout(() => totalController.abort(), TOTAL_TIMEOUT);
    const probes = [
        ['odinCDN', ODIN_CDN_ENDPOINT, validateOdinJson],
        ['odinOrigin', ODIN_ORIGIN_ENDPOINT, validateOdinJson],
        ['wcsCDN', WCS_CDN_ENDPOINT, () => true],
        ['wcsOrigin', WCS_ORIGIN_ENDPOINT, () => true],
    ];
    const results = await Promise.allSettled(
        probes.map(([, endpoint, validateJson]) => checkEndpoint(endpoint, validateJson, totalController.signal)),
    );
    clearTimeout(totalTimeoutId);
    results.forEach((result, index) => {
        const [name, endpoint] = probes[index];
        body[name] =
            result.status === 'fulfilled'
                ? result.value
                : {
                      status: FAIL,
                      reason: result.reason.message,
                      url: endpoint,
                  };
    });

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
