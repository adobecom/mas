function withExposedRequestId(response) {
    return { ...response, headers: { ...response?.headers, 'Access-Control-Expose-Headers': 'x-request-id' } };
}

function exposeRequestId(main) {
    return async function exposedMain(params) {
        const response = await main(params);
        if (response?.error) return { ...response, error: withExposedRequestId(response.error) };
        return withExposedRequestId(response);
    };
}

module.exports = { exposeRequestId };
