import { shouldHideStPriceLabels } from './utils.js';
import { COMPAT_VERSION_GLOBAL_PROMO_CODE } from './compat-version.js';
import { planTypeTextOptionsProvider } from './plan-type-text.js';

/**
 * Shared MAS context helpers consumed by both merch-card.js and mas-field.js,
 * so settings/promo handling for prices and CTAs comes from a single
 * implementation instead of two independently maintained copies (MWPW-201843).
 * This is an internal module only: it must stay imported by commerce.js and
 * mas.js (via mas-field.js/merch-card.js) so it is inlined into both bundles
 * at build time, never emitted as its own chunk or loaded on its own.
 */

/**
 * True when `host` (a merch-card or mas-field) has opted into resolving a
 * page/project-level promo code onto its prices/CTAs: either its fragment
 * was authored at or above the compat version that turned this on globally,
 * or it explicitly belongs to a promo project.
 */
export function contextPromotionCodeGate(host) {
    return (
        host.compatVersion >= COMPAT_VERSION_GLOBAL_PROMO_CODE ||
        host.hasAttribute('data-promotion-project')
    );
}

/** Returns host.contextPromotionCode when the promo-code gate passes, else null. */
export function resolveContextPromotionCode(host) {
    return contextPromotionCodeGate(host) ? host.contextPromotionCode : null;
}

/**
 * Assigns options.promotionCode from the host's gated context code, unless a
 * more specific promotionCode has already been resolved by an earlier provider.
 */
export function applyContextPromotionCode(host, options) {
    if (options.promotionCode) return;
    const code = resolveContextPromotionCode(host);
    if (code) options.promotionCode = code;
}

/**
 * Merges resolved fragment price literals (e.g. locale plan-type labels) into
 * options.literals. `literals` is the already-resolved value (card.priceLiterals,
 * or masField.aemFragment?.data?.priceLiterals) since the two hosts expose it
 * through different shapes.
 */
export function mergePriceLiterals(literals, options) {
    if (!literals) return;
    options.literals ??= {};
    Object.assign(options.literals, literals);
}

/** Suppresses per-unit/tax price labels for settings that request it. */
export function applyHideStPriceLabels(element, options) {
    if (!shouldHideStPriceLabels(element)) return;
    options.displayPerUnit = false;
    options.displayTax = false;
}

/**
 * Defaults options.displayAnnual from the host's fragment settings, unless a
 * more specific value has already been resolved. `host` may be null/undefined
 * (e.g. a mas-field-owned element unwrapped from its host).
 */
export function applyDisplayAnnualDefault(host, options) {
    if (
        options.displayAnnual === undefined &&
        typeof host?.settings?.displayAnnual === 'boolean'
    ) {
        options.displayAnnual = host.settings.displayAnnual;
        if (host.settings.displayAnnual) host.setAttribute('annualized', '');
    }
}

/**
 * Registers `priceProvider`/`checkoutProvider` (plus the shared
 * planTypeTextOptionsProvider) on `service`, guarding against double
 * registration the same way merch-card and mas-field each did before.
 */
export function registerContextOptionsProviders(
    service,
    priceProvider,
    checkoutProvider,
) {
    if (!service?.providers || service.providers.has(priceProvider)) return;
    service.providers.price(priceProvider);
    service.providers.checkout(checkoutProvider);
    if (!service.providers.has(planTypeTextOptionsProvider)) {
        service.providers.price(planTypeTextOptionsProvider);
    }
}
