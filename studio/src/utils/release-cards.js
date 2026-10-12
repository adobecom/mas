import {
    createFragmentDataForAEM,
    enrichConfigWithMcsMnemonic,
    buildReleaseCtas,
    buildReleasePrice,
    buildReleaseTags,
} from './ai-card-mapper.js';
import { getProductName, getPreferredProductDescription, capitalize } from './mas-chat-helpers.js';
import { normalizeFragmentForCache } from '../utils.js';

const PLANS_VARIANTS = new Set(['plans', 'plans-students', 'plans-education']);

/**
 * A URL-safe, collision-resistant fragment name derived from the card title.
 */
export function releaseFragmentName(title) {
    const baseName = String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `${baseName}-${Date.now()}`;
}

/**
 * Build the AEM fragment payload for one release card, deterministically from
 * MCS product data and the OST-selected offers. This is the single source of
 * release-card construction shared by the MASA chat flow and the Offers-page
 * create flow, so both emit identical cards.
 *
 * The studio is the sole author of all visible fields; only the variant and the
 * user-selected OSIs vary. Crucially this does NO offer-selector re-validation
 * against WCS — the OSIs come from the user's OST selection, so NPI/DRAFT offers
 * (absent from www.adobe.com) pass straight through.
 *
 * @param {Object} args
 * @param {Object} args.product - MCS product (copy/assets/segments/arrangement_code)
 * @param {string} args.variant - card variant, e.g. 'plans' or 'catalog'
 * @param {string} [args.baseOsi] - base offer selector id
 * @param {string} [args.trialOsi] - trial offer selector id
 * @param {string} args.parentPath - AEM parent folder
 * @param {string} [args.title] - override AEM fragment title (defaults to "<name> - <Variant>")
 * @param {string} [args.name] - override fragment name (defaults to a slug + timestamp)
 * @returns {Promise<Object>} fragment data ready for repository.aem.sites.cf.fragments.create
 */
export async function buildReleaseFragmentData({ product, variant, baseOsi, trialOsi, parentPath, title, name } = {}) {
    const productName = getProductName(product);
    const cardTitle = title || `${productName} - ${capitalize(variant)}`;

    let config = { variant, osi: baseOsi, trialOsi };
    config = await enrichConfigWithMcsMnemonic(config, product);

    const isCatalog = variant === 'catalog';
    const isPlans = PLANS_VARIANTS.has(variant);
    config.ctas = buildReleaseCtas(config.osi, config.trialOsi, {
        includeTrial: !isPlans,
        buyNowLabel: isPlans ? 'Select' : 'Buy now',
    });
    if (config.osi && !isCatalog) {
        config.prices = buildReleasePrice(config.osi);
    }
    const description = getPreferredProductDescription(product);
    if (description) config.description = description;
    if (productName) config.title = `<h3 slot="heading-xs">${productName}</h3>`;

    return createFragmentDataForAEM(config, variant, {
        title: cardTitle,
        name: name || releaseFragmentName(cardTitle),
        parentPath,
        tags: buildReleaseTags(product),
    });
}

/**
 * Build and persist one release card directly to AEM through the shared
 * mas-repository, then warm the aem-fragment cache. Mirrors the MASA chat
 * create path (mas-chat.saveDraftToAEM) so the Offers-page flow behaves the same.
 *
 * @param {Object} args - see buildReleaseFragmentData, plus:
 * @param {Object} args.repository - the mas-repository element
 * @returns {Promise<Object>} the created fragment
 */
export async function createReleaseCard({ product, variant, baseOsi, trialOsi, parentPath, repository, title, name } = {}) {
    if (!repository?.aem?.sites?.cf?.fragments?.create) {
        throw new Error('mas-repository is not available to create release cards');
    }
    const fragmentData = await buildReleaseFragmentData({ product, variant, baseOsi, trialOsi, parentPath, title, name });
    const newFragment = await repository.aem.sites.cf.fragments.create(fragmentData);

    const AemFragmentElement = customElements.get('aem-fragment');
    if (AemFragmentElement && newFragment) {
        AemFragmentElement.cache.add(normalizeFragmentForCache(newFragment));
    }
    return newFragment;
}
