const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function isRetryable(error, response) {
    if (error instanceof TypeError) return true;
    if (response && RETRYABLE_STATUS_CODES.has(response.status)) return true;
    return false;
}

function getRetryDelay(attempt, response) {
    const retryAfter = response?.headers?.get?.('retry-after');
    if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) return seconds * 1000;
    }
    return BASE_DELAY * Math.pow(2, attempt);
}

export async function fetchWithRetry(url, options = {}) {
    let lastError;
    let lastResponse;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url, options);

            if (response.ok || !isRetryable(null, response)) {
                return response;
            }

            lastResponse = response;
            lastError = new Error(`HTTP ${response.status}`);
        } catch (error) {
            if (!isRetryable(error)) {
                throw error;
            }
            lastError = error;
        }

        if (attempt < MAX_RETRIES) {
            const delay = getRetryDelay(attempt, lastResponse);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}
