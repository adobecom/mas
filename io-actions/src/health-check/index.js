const fetch = require('node-fetch');
const SUCCESS = 'success';
const ERROR = 'error';
const OK = 'ok';
const FAIL = 'fail';
async function main(params) {
    const checkEndpoint = async (endpoint, validateJson) => {
        let result = OK;
        const response = await fetch(endpoint);
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
        return result;
    };

    const {
        ODIN_CDN_ENDPOINT,
        ODIN_ORIGIN_ENDPOINT,
        WCS_CDN_ENDPOINT,
        WCS_ORIGIN_ENDPOINT,
    } = params;
    try {
        let statusCode = 200;
        const body = {
            status: SUCCESS,
        };
        const validateOdinJson = (json) =>
            json && !!json.id && !!json.fields?.variant;
        body.odinCDN = await checkEndpoint(ODIN_CDN_ENDPOINT, validateOdinJson);
        body.odinOrigin = await checkEndpoint(
            ODIN_ORIGIN_ENDPOINT,
            validateOdinJson,
        );
        body.wcsCDN = await checkEndpoint(WCS_CDN_ENDPOINT, () => true);
        body.wcsOrigin = await checkEndpoint(WCS_ORIGIN_ENDPOINT, () => true);

        if (
            [
                body.odinCDN?.status,
                body.odinOrigin?.status,
                body.wcsCDN?.status,
                body.wcsOrigin?.status,
            ].includes(FAIL)
        ) {
            body.status = ERROR;
            statusCode = 500;
        }

        return {
            statusCode,
            body,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: 'ERROR in I/O action',
        };
    }
}

exports.main = main;
