export function getOfferSelection(value, env) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return env === 'stage' ? false : undefined;
}

export function getOfferSelectionSuffix(value) {
    if (value === true) return '-latest';
    if (value === false) return '-legacy';
    return '';
}
