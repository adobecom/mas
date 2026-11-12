import { HEADER_X_REQUEST_ID } from './constants.js';

/**
 * Error raised by M@S components, with a context logged to Lana.
 * A `context.response` is replaced by its request id, status and url.
 */
export class MasError extends Error {
    /**
     * @param {string} message - The error message
     * @param {Object} context - Additional context information about the error
     * @param {unknown} cause - The original error that caused this error
     */
    constructor(message, context, cause) {
        super(message, { cause });
        this.name = 'MasError';
        const { response } = context;
        if (response) {
            const requestId = response.headers?.get(HEADER_X_REQUEST_ID);
            if (requestId) context.requestId = requestId;
            if (response.status) {
                context.status = response.status;
                context.statusText = response.statusText;
            }
            if (response.url) context.url = response.url;
        }
        delete context.response;
        this.context = context;
        // V8 only: drops the constructor frame from the stack.
        Error.captureStackTrace?.(this, MasError);
    }

    toString() {
        const context = Object.entries(this.context)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join(', ');
        let string = `${this.name}: ${this.message}`;
        if (context) string += ` (${context})`;
        if (this.cause) string += `\nCaused by: ${this.cause}`;
        return string;
    }
}
