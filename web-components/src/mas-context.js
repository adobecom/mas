import { injectStyle, shouldHideStPriceLabels } from './utils.js';
import { COMPAT_VERSION_GLOBAL_PROMO_CODE } from './compat-version.js';
import {
    PLAN_TYPE_TEXT_STYLES,
    planTypeTextOptionsProvider,
} from './plan-type-text.js';

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
 * Assigns options.promotionCode from the host's gated context code (or from
 * `code` when the caller resolved it), unless a more specific promotionCode has
 * already been resolved by an earlier provider.
 */
export function applyContextPromotionCode(
    host,
    options,
    code = resolveContextPromotionCode(host),
) {
    if (code && !options.promotionCode) options.promotionCode = code;
}

/**
 * Merges resolved fragment price literals (e.g. locale plan-type labels) into
 * options.literals. `literals` is the already-resolved value (card.priceLiterals,
 * or masField.aemFragment?.data?.priceLiterals) since the two hosts expose it
 * through different shapes.
 */
export function mergePriceLiterals(literals, options) {
    if (!literals) return;
    options.literals = Object.assign(options.literals ?? {}, literals);
}

/** Suppresses per-unit/tax price labels for settings that request it. */
export function applyHideStPriceLabels(element, options) {
    if (!shouldHideStPriceLabels(element)) return;
    options.displayPerUnit = false;
    options.displayTax = false;
}

/**
 * Defaults options.displayAnnual from the host's fragment settings (and marks
 * an annualized host), unless a more specific value has already been resolved.
 * `host` is null for a mas-field-owned element unwrapped from its host.
 */
export function applyDisplayAnnualDefault(host, options) {
    const displayAnnual = host?.settings?.displayAnnual;
    if (displayAnnual == null || options.displayAnnual !== undefined) return;
    options.displayAnnual = displayAnnual;
    if (displayAnnual) host.setAttribute('annualized', '');
}

/**
 * Registers `priceProvider`/`checkoutProvider` (plus the shared
 * planTypeTextOptionsProvider and its styles) on `service` once. The service
 * may be missing or not active yet, e.g. for a mas-field connected before it.
 */
export function registerContextOptionsProviders(
    service,
    priceProvider,
    checkoutProvider,
) {
    const providers = service?.providers;
    if (!providers || providers.has(priceProvider)) return;
    providers.price(priceProvider);
    providers.checkout(checkoutProvider);
    if (providers.has(planTypeTextOptionsProvider)) return;
    providers.price(planTypeTextOptionsProvider);
    injectStyle('plan-type-text', PLAN_TYPE_TEXT_STYLES);
}
