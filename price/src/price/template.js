import { toBoolean } from '../helpers.js';
import { Commitment, Term } from '../constants.js';
import { formatAnnualPrice, formatOpticalPrice, formatRegularPrice, isPromotionActive } from './utilities.js';
import { formatMessage } from './message-format.js';

// Literals the renderers format when the price literals lack them.
const defaultLiterals = {
    recurrenceLabel: '{recurrenceTerm, select, MONTH {/mo} YEAR {/yr} other {}}',
    perUnitLabel: '{perUnit, select, LICENSE {per license} other {}}',
    taxExclusiveLabel:
        '{taxTerm, select, GST {excl. GST} VAT {excl. VAT} TAX {excl. tax} IVA {excl. IVA} SST {excl. SST} KDV {excl. KDV} other {}}',
    taxInclusiveLabel:
        '{taxTerm, select, GST {incl. GST} VAT {incl. VAT} TAX {incl. tax} IVA {incl. IVA} SST {incl. SST} KDV {incl. KDV} other {}}',
    alternativePriceAriaLabel: 'Alternatively at',
    strikethroughAriaLabel: 'Regularly at',
    planTypeLabel: '{planType, select, ABM {Annual, billed monthly} other {}}',
    discountLabel: '{discount}%',
    priceUnavailableLabel: 'no price available',
};

/** Render flags; the first five add the `price-*` container classes, in this order. */
export const OPTICAL = 1;
export const STRIKETHROUGH = 2;
export const PROMO_STRIKETHROUGH = 4;
export const ALTERNATIVE = 8;
export const ANNUAL = 16;
/** The promotion is active, so the discounted price is shown. */
export const PROMO_APPLIED = 32;
/** Hides the per-unit and tax labels. */
export const PLAIN = 64;
const CONTAINER_CLASSES = ['optical', 'strikethrough', 'promo-strikethrough', 'alternative', 'annual'];

const ANNUAL_PREFIX = '<span class="price-annual-prefix"> (</span>';
const ANNUAL_SUFFIX = '<span class="price-annual-suffix">)</span>';

const HTML = /<\/?[^>]+(>|$)/g;
const LINK = /<a [^>]+(>|$)/g;
const ENCODED_LINK = /&lt;a (?!&gt;)(.*?)(&gt;|$)/g;

export const renderSpan = (cssClass, content) =>
    `<span class="${cssClass}${content ? '' : ' disabled'}">${content ?? ''}</span>`;

export const makeSpacesAroundNonBreaking = (text) => text.replace(/^\s+/, '&nbsp;').replace(/\s+$/, '&nbsp;');

export const toLocale = (language, country) => `${language.toLowerCase()}-${country.toUpperCase()}`;

/**
 * Formats a price literal, falling back to the default literal when `literals` has no `key`.
 * Links survive markup stripping; formatting errors are logged and render ''.
 */
export function formatLiteral(literals, locale, key, parameters, logger = console) {
    let literal = key in literals ? literals[key] : defaultLiterals[key];
    if (literal == null) return '';
    const hasLinks = literal.includes('<a ');
    try {
        if (hasLinks) {
            literal = literal
                .replaceAll('</a>', '&lt;/a&gt;')
                .replace(LINK, (link) => link.replace('<a ', '&lt;a ').replace('>', '&gt;'));
        }
        literal = literal.replace(HTML, '');
        const text = formatMessage(literal, locale, parameters);
        return hasLinks
            ? text
                  .replaceAll('&lt;/a&gt;', '</a>')
                  .replace(ENCODED_LINK, (link) => link.replace('&lt;a ', '<a ').replace('&gt;', '>'))
            : text;
    } catch {
        logger.error('Failed to format literal:', literal);
        return '';
    }
}

export const taxLabelKey = (taxDisplay) => (taxDisplay === 'TAX_EXCLUSIVE' ? 'taxExclusiveLabel' : 'taxInclusiveLabel');

/**
 * Renders one price container. `flags` combines the render flags above;
 * `instant` only reaches the annual promotion calculation.
 */
export function renderPrice(context, value, logger = console, flags = 0, instant) {
    const {
        country,
        language,
        displayFormatted = true,
        displayRecurrence = true,
        displayPerUnit,
        displayTax,
        literals = {},
        quantity,
        space,
    } = context;
    const {
        commitment,
        offerSelectorIds,
        formatString,
        price,
        priceWithoutDiscount,
        taxDisplay,
        taxTerm,
        term,
        usePrecision,
        promotion,
        priceInfo,
    } = value;
    const missing =
        country == null
            ? 'country'
            : formatString == null
              ? 'formatString'
              : language == null
                ? 'language'
                : price == null && 'price';
    if (missing) {
        throw new Error(
            `Argument "${missing}" is missing for osi ${offerSelectorIds?.toString()}, country ${country}, language ${language}`,
        );
    }
    const locale = toLocale(language, country);
    const optical = flags & OPTICAL;
    const annual = flags & ANNUAL;
    const plain = flags & PLAIN;
    const formatted = toBoolean(displayFormatted);

    let displayPrice = price;
    if (promotion && !(flags & PROMO_APPLIED) && priceWithoutDiscount) {
        if (!(flags & (ALTERNATIVE | PROMO_STRIKETHROUGH))) displayPrice = priceWithoutDiscount;
    } else if (flags & STRIKETHROUGH && priceWithoutDiscount) displayPrice = priceWithoutDiscount;

    // WCS pre-split leaf: priceInfo[timescale][discountState].withTax, always the
    // tax-inclusive leaf as on the numeric path. Promo-weighted annual totals and
    // the leaves WCS does not send fall back to numeric formatting.
    let preformatted;
    if (priceInfo && formatted && !(annual && promotion)) {
        // `!optical`: optical divides the discounted `price`, even under strikethrough.
        const discountState = !optical && displayPrice === priceWithoutDiscount ? 'withoutDiscount' : 'withDiscount';
        const timescale =
            annual && commitment === Commitment.YEAR && term === Term.MONTHLY ? 'annualized' : optical ? 'optical' : 'asIs';
        preformatted = priceInfo[timescale]?.[discountState]?.withTax;
    }
    const format = annual ? formatAnnualPrice : optical ? formatOpticalPrice : formatRegularPrice;
    const { currencySymbol, decimals, decimalsDelimiter, hasCurrencySpace, integer, isCurrencyFirst, recurrenceTerm } = format({
        commitment,
        formatString,
        instant,
        // India regroups digits client-side (lakh/crore) on the numeric path.
        isIndianPrice: country === 'IN',
        originalPrice: price,
        priceWithoutDiscount,
        price: optical ? price : displayPrice,
        promotion,
        quantity,
        term,
        usePrecision,
        preformatted,
        priceInfoFormat: priceInfo?.format,
    });

    const label = (key, parameters) => formatLiteral(literals, locale, key, parameters, logger);
    const separator = space ? ' ' : '';
    const recurrenceLabel = toBoolean(displayRecurrence) && recurrenceTerm ? label('recurrenceLabel', { recurrenceTerm }) : '';
    const perUnitLabel = !plain && toBoolean(displayPerUnit) ? separator + label('perUnitLabel', { perUnit: 'LICENSE' }) : '';
    const taxLabel = !plain && toBoolean(displayTax) && taxTerm ? separator + label(taxLabelKey(taxDisplay), { taxTerm }) : '';
    const strikethroughLabel = flags & STRIKETHROUGH ? label('strikethroughAriaLabel', { strikethroughPrice: '' }) : '';
    const alternativeLabel = flags & ALTERNATIVE ? label('alternativePriceAriaLabel', { alternativePrice: '' }) : '';

    const cssClass = CONTAINER_CLASSES.reduce((css, name, bit) => (flags & (1 << bit) ? `${css} price-${name}` : css), 'price');

    if (!formatted) {
        const nbsp = hasCurrencySpace ? '\u00a0' : '';
        const amount = isCurrencyFirst
            ? [currencySymbol, nbsp, integer, decimalsDelimiter, decimals]
            : [integer, decimalsDelimiter, decimals, nbsp, currencySymbol];
        return renderSpan(cssClass, amount.join('') + recurrenceLabel + perUnitLabel + taxLabel);
    }
    const symbol = renderSpan('price-currency-symbol', currencySymbol);
    const gap = renderSpan('price-currency-space', hasCurrencySpace ? '&nbsp;' : '');
    const amount =
        renderSpan('price-integer', integer) +
        renderSpan('price-decimals-delimiter', decimalsDelimiter) +
        renderSpan('price-decimals', decimals);
    let markup = '';
    if (strikethroughLabel) markup = `<sr-only class="strikethrough-aria-label">${strikethroughLabel}</sr-only>`;
    else if (alternativeLabel) markup = `<sr-only class="alt-aria-label">${alternativeLabel}</sr-only>`;
    return renderSpan(
        cssClass,
        markup +
            (isCurrencyFirst ? symbol + gap + amount : amount + gap + symbol) +
            renderSpan('price-recurrence', makeSpacesAroundNonBreaking(recurrenceLabel)) +
            renderSpan('price-unit-type', makeSpacesAroundNonBreaking(perUnitLabel)) +
            renderSpan('price-tax-inclusivity', taxLabel),
    );
}

const firstQuantity = ({ quantity }) => (Array.isArray(quantity) ? quantity[0] : quantity);
const showsOldPrice = ({ displayOldPrice }) => displayOldPrice === undefined || toBoolean(displayOldPrice);
const clauseSeparator = ({ wrapClauses }) => (wrapClauses ? ' ' : '&nbsp;');

/**
 * Regular price, or the struck-through old price followed by the new one when
 * the promotion (or a plain discount) applies.
 */
export function renderPromoPrice(context, value, logger = console) {
    const { promotion, price, priceWithoutDiscount } = value;
    const applied = isPromotionActive(promotion, promotion?.displaySummary?.instant, firstQuantity(context))
        ? PROMO_APPLIED
        : 0;
    const showOldPrice =
        showsOldPrice(context) && priceWithoutDiscount && priceWithoutDiscount != price && (!promotion || applied);
    return (
        (showOldPrice ? renderPrice(context, value, logger, STRIKETHROUGH | PLAIN | applied) + clauseSeparator(context) : '') +
        renderPrice(context, value, logger, (showOldPrice ? ALTERNATIVE : 0) | applied)
    );
}

/** Monthly price followed by its annual total, for ABM offers. */
export const renderPriceWithAnnual = (context, value, logger = console) =>
    renderPrice(context, value, logger, context.displayOldPrice ? ALTERNATIVE : 0) +
    ANNUAL_PREFIX +
    renderPrice(context, value, logger, ANNUAL | PLAIN) +
    ANNUAL_SUFFIX;

/** Promotional monthly price followed by its promo-weighted annual total, for ABM offers. */
export function renderPromoPriceWithAnnual(context, value, logger = console) {
    const instant = context.instant ? new Date(context.instant) : context.instant;
    const { promotion, price, priceWithoutDiscount } = value;
    if (!isPromotionActive(promotion, instant, firstQuantity(context))) {
        const regular = { ...value, price: priceWithoutDiscount };
        return (
            renderPrice(context, regular, logger) +
            ANNUAL_PREFIX +
            renderPrice(context, regular, logger, ANNUAL | PLAIN, instant) +
            ANNUAL_SUFFIX
        );
    }
    const showOldPrice = showsOldPrice(context) && priceWithoutDiscount && priceWithoutDiscount != price;
    return (
        (showOldPrice
            ? renderPrice(context, value, logger, STRIKETHROUGH | PLAIN | PROMO_APPLIED) + clauseSeparator(context)
            : '') +
        renderPrice(context, value, logger, (showOldPrice ? ALTERNATIVE : 0) | PROMO_APPLIED) +
        ANNUAL_PREFIX +
        renderPrice(context, value, logger, ANNUAL | PLAIN | PROMO_APPLIED, instant) +
        ANNUAL_SUFFIX
    );
}
