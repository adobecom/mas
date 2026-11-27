const REFUSAL_CODES = [
    'caller-not-allowed',
    'surface-not-allowed',
    'investigations-disabled',
    'masa-disabled',
    'masa-not-configured',
    'studio-origin-denied',
];

const UNAVAILABLE_CODES = new Set(['connection-unavailable', ...REFUSAL_CODES]);

const USER_INPUT_CODES = new Set(['invalid-question', 'question-too-large', 'invalid-image']);

let unavailable = false;

/** True until a remembered MASA failure is seen on this page. */
export function isMasaAvailable() {
    return !unavailable;
}

/** Marks MASA unavailable for the page when the error code says so. Returns true if marked. */
export function rememberFailure(error) {
    if (!UNAVAILABLE_CODES.has(error.code)) return false;
    unavailable = true;
    return true;
}

/** MASA answered that it takes no questions here: it accepted nothing, so Studio can answer the turn itself. */
export function isRefusal(error) {
    return REFUSAL_CODES.includes(error.code);
}

/** Clears the memory, used by the "Ask MASA again" action. */
export function resetMasaAvailability() {
    unavailable = false;
}

/** Input errors are shown as an editable error and never fall back; any other failure is answered from built-in knowledge. */
export function isUserInputError(error) {
    return USER_INPUT_CODES.has(error.code);
}
