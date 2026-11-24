import { loadOfferData } from '../common/utils/item-loading-browser.js';

/**
 * Verify the base offer selector on a card about to be persisted actually
 * resolves to an offer. The assistant can emit a hallucinated osi; persisting
 * it produces a card whose price and CTA never render. Returns true when there
 * is no osi to verify or it resolves, false when a declared osi does not.
 *
 * @param {Object} fragmentData - AEM fragment data with a `fields` array
 * @param {(fragment: Object) => Promise<Object|null>} [resolveOffer] - injectable for tests
 * @returns {Promise<boolean>}
 */
export async function cardOfferResolves(fragmentData, resolveOffer = loadOfferData) {
    const osiField = fragmentData?.fields?.find((field) => field.name === 'osi');
    const baseOsi = osiField?.values?.[0];
    if (!baseOsi) return true;
    const offer = await resolveOffer(fragmentData);
    return Boolean(offer);
}
