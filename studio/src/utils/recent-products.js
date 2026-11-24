export const RECENT_PRODUCTS_KEY = 'mas-studio-recent-products';

export function addRecent(list, id, max = 12) {
    return [id, ...list.filter((item) => item !== id)].slice(0, max);
}

export function parseRecent(raw) {
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
        return [];
    }
}

export function readRecent() {
    try {
        return parseRecent(localStorage.getItem(RECENT_PRODUCTS_KEY));
    } catch {
        return [];
    }
}

export function writeRecent(list) {
    try {
        localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(list));
    } catch {
        return;
    }
}
