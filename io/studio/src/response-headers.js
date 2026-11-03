const EXPOSE_HEADERS = 'Access-Control-Expose-Headers';
const REQUEST_ID_HEADER = 'x-request-id';

function exposeRequestId(main) {
    return async function exposedMain(params) {
        const response = await main(params);
        return { ...response, headers: { ...response?.headers, [EXPOSE_HEADERS]: REQUEST_ID_HEADER } };
    };
}

module.exports = { exposeRequestId };
