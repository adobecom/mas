// Semantics retained from @dexter/tacocat-core 1.13.1 without its browser entry point.
export const escapeHtml = (html) =>
    `${html ?? ''}`.replace(
        /[&<>'"]/g,
        (tag) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;',
            })[tag],
    );

export const isNumber = (value) => typeof value === 'number';
export const isObject = (value) => value != null && typeof value === 'object';
export const isString = (value) => typeof value === 'string';
export const isPositiveFiniteNumber = (value) => isNumber(value) && Number.isFinite(value) && value > 0;

export function toBoolean(value, defaultValue) {
    if (value === true || value === false) return value;
    const string = String(value);
    if (string === '1' || string === 'true') return true;
    if (string === '0' || string === 'false') return false;
    return defaultValue;
}
