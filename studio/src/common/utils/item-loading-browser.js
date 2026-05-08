import { getService } from '../../utils.js';

/**
 * Loads offer data for a fragment using its OSI field.
 * @param {Object} fragment
 * @param {Object} options
 * @param {Map} [options.cache]
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<Object|null>}
 */
export async function loadOfferData(fragment, { cache = new Map(), signal, timeoutMs = 10000 } = {}) {
    const wcsOsi = fragment?.fields?.find(({ name }) => name === 'osi')?.values?.[0];
    if (!wcsOsi) return null;

    try {
        if (cache.has(wcsOsi)) {
            return cache.get(wcsOsi);
        }

        if (signal?.aborted) return null;

        const service = getService();
        const priceOptions = service.collectPriceOptions({ wcsOsi });
        const [offersPromise] = service.resolveOfferSelectors(priceOptions);
        if (!offersPromise) return null;

        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
        });

        try {
            const [offer] = await Promise.race([offersPromise, timeoutPromise]);
            clearTimeout(timeoutId);

            if (signal?.aborted) return null;

            cache.set(wcsOsi, offer);
            return offer;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    } catch (error) {
        console.warn(`Failed to load offer data for fragment ${fragment?.id}:`, error.message);

        if (!signal?.aborted) {
            cache.set(wcsOsi, null);
        }

        return null;
    }
}
