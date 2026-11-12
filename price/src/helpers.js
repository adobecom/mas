export const isPositiveFiniteNumber = (value) => Number.isFinite(value) && value > 0;

export function toBoolean(value) {
    if (value === true || value === false) return value;
    const string = String(value);
    if (string === '1' || string === 'true') return true;
    if (string === '0' || string === 'false') return false;
}
