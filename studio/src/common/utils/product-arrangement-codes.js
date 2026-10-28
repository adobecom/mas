import { MAS_OFFERS_URL } from '../../constants.js';
import { showToast } from '../../utils.js';

let productArrangementCodesPromise = null;

async function fetchProductArrangementCodes() {
    const response = await fetch(MAS_OFFERS_URL);
    if (!response.ok) throw new Error(`Failed to load product arrangement codes: ${response.status}`);
    const offers = await response.json();
    return Object.entries(offers)
        .map(([code, offer]) => {
            const name = offer?.fields?.name;
            return { id: code, title: name ? `${code} — ${name}` : code };
        })
        .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Loads the product arrangement codes of the MAS offers once per session.
 * @returns {Promise<{ id: string, title: string }[]>} filter options sorted by code, empty when the request fails
 */
export function loadProductArrangementCodes() {
    productArrangementCodesPromise ??= fetchProductArrangementCodes().catch(() => {
        productArrangementCodesPromise = null;
        showToast('Could not load product arrangement codes.', 'negative');
        return [];
    });
    return productArrangementCodesPromise;
}

/** Test-only. Forgets the cached request. */
export function resetProductArrangementCodes() {
    productArrangementCodesPromise = null;
}
