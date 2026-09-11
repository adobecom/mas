// A request that never settles (e.g. WCS unreachable from a serverless runtime) must not hang
// the caller: cap each attempt so it fails fast. Overridable via an explicit options.signal.
const FETCH_TIMEOUT_MS = 5000;

/**
 * A fetch wrapper that retries failed requests up to a specified number of times.
 * Only retries on network errors, not server errors (HTTP status codes) or timeouts.
 * @param {string|Request} resource - The resource to fetch
 * @param {Object} [options] - The options for the fetch request
 * @param {number} [retries=3] - Maximum number of retry attempts
 * @param {number} [baseDelay=100] - Base delay between retries in milliseconds, increases linearly with each attempt (baseDelay * (attempt + 1))
 * @returns {Promise<Response>} - The fetch response
 */
async function masFetch(resource, options = {}, retries = 2, baseDelay = 100) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(resource, {
                ...options,
                signal: options.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
            });
            // Don't retry on server errors (HTTP status codes)
            response.retryCount = attempt;
            return response;
        } catch (error) {
            // Only retry on network errors
            lastError = error;
            lastError.retryCount = attempt;

            // A timeout won't resolve by retrying — fail fast.
            if (error.name === 'TimeoutError' || attempt > retries) break;

            // Wait before retrying
            await new Promise((resolve) =>
                setTimeout(resolve, baseDelay * (attempt + 1)),
            );
        }
    }

    throw lastError;
}

export { masFetch, FETCH_TIMEOUT_MS };
