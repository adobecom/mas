/**
 * A fetch wrapper that retries network errors. HTTP error statuses are
 * returned as is and timeouts are not retried. The number of retries made is
 * stored as `retryCount` on the returned response or the thrown error.
 * @param {string|Request} resource - The resource to fetch
 * @param {Object} [options] - The options for the fetch request
 * @param {number} [retries=2] - Maximum number of retries
 * @param {number} [baseDelay=100] - Delay before the first retry in milliseconds, growing linearly (baseDelay * retry)
 * @returns {Promise<Response>} - The fetch response
 */
export async function masFetch(
    resource,
    options = {},
    retries = 2,
    baseDelay = 100,
) {
    for (let attempt = 0; ; attempt++) {
        try {
            const response = await fetch(resource, options);
            response.retryCount = attempt;
            return response;
        } catch (error) {
            error.retryCount = attempt;
            if (error.name === 'TimeoutError' || attempt >= retries)
                throw error;
            await new Promise((resolve) =>
                setTimeout(resolve, baseDelay * (attempt + 1)),
            );
        }
    }
}
