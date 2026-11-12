import { Commitment, Term } from '../constants.js';

/**
 * Whether `promotion` is active at `instant` (default: now) for `quantity`:
 * it needs an amount, duration, outcome type, start and end.
 */
export const isPromotionActive = (promotion, instant, quantity = 1) => {
    if (!promotion) return false;
    const { start, end, displaySummary: { amount, duration, minProductQuantity = 1, outcomeType } = {} } = promotion;
    if (!(amount && duration && outcomeType && start && end) || quantity < minProductQuantity) return false;
    const now = instant ? new Date(instant) : new Date();
    return now >= new Date(start) && now <= new Date(end);
};

/** Months in each term, to show a per-month (optical) price. */
const OPTICAL_DIVISORS = { [Term.ANNUAL]: 12, [Term.MONTHLY]: 1, [Term.TWO_YEARS]: 24, [Term.THREE_YEARS]: 36 };

const getRecurrenceTerm = (commitment, term) => {
    if (term === Term.MONTHLY && (commitment === Commitment.YEAR || commitment === Commitment.MONTH)) return 'MONTH';
    if (term === Term.ANNUAL && commitment === Commitment.YEAR) return 'YEAR';
};

const formats = new Map();

/**
 * Parses a WCS currency format, e.g. `'US$'#,##0.00` or `#.##0,00 '€'`: the quoted
 * currency symbol and its placement, and the number mask `#<group>##0<decimal>00`.
 */
function parseFormat(formatString) {
    if (formats.has(formatString)) return formats.get(formatString);
    const currencySymbol = formatString.match(/'(.*?)'/)?.[1] ?? '';
    const mask = formatString.replace(/'.*?'/, '');
    const [, integerMask, decimal = '', fraction = ''] = mask.trim().match(/^(.*?0)(?:(\D)(0+))?$/);
    const separator = integerMask.match(/[^#0]/)?.[0];
    const groupSize = integerMask.length - integerMask.lastIndexOf(separator) - 1;
    const format = {
        currencySymbol,
        isCurrencyFirst: formatString.startsWith(`'${currencySymbol}'`),
        hasCurrencySpace: /^\s|\s$/.test(mask),
        decimal,
        fractionDigits: fraction.length,
        separator,
        group: separator && new RegExp(`\\B(?=(\\d{${groupSize}})+$)`, 'g'),
    };
    formats.set(formatString, format);
    return format;
}

function formatNumber(amount, digits, { decimal, separator, group }) {
    const [integer, fraction] = Math.abs(amount).toFixed(digits).split('.');
    const sign = amount < 0 && (digits || integer !== '0') ? '-' : '';
    return sign + (separator ? integer.replace(group, separator) : integer) + (fraction ? decimal + fraction : '');
}

/**
 * Splits `amount` into the parts rendered by the price template. A WCS
 * pre-split leaf (`preformatted`) is used verbatim, with the symbol and its
 * placement from `priceInfoFormat` when present. Otherwise `usePrecision`
 * true renders the mask's decimals separately, undefined keeps them in the
 * integer part, and any other value rounds to an integer; an amount that is
 * not a number throws.
 */
function formatPrice({ formatString, usePrecision, isIndianPrice, preformatted, priceInfoFormat }, amount, recurrenceTerm) {
    const format = parseFormat(formatString);
    const { currencySymbol, isCurrencyFirst, hasCurrencySpace, decimal } = format;
    if (preformatted?.integer != null) {
        return {
            currencySymbol: priceInfoFormat?.currencySymbol ?? currencySymbol,
            decimals: preformatted.decimals ?? '',
            decimalsDelimiter: preformatted.decimals ? (priceInfoFormat?.decimalsDelimiter ?? decimal) : '',
            hasCurrencySpace: priceInfoFormat?.hasCurrencySpace ?? hasCurrencySpace,
            integer: preformatted.integer,
            isCurrencyFirst: priceInfoFormat?.isCurrencyFirst ?? isCurrencyFirst,
            recurrenceTerm,
        };
    }
    // An amount that is not a number (e.g. a promo-weighted total missing the
    // undiscounted price) fails the price rather than rendering "NaN".
    if (isNaN(amount)) throw new Error(`Invalid price amount: ${amount}`);
    // India groups digits in lakh/crore, which the mask cannot express.
    const formatted = isIndianPrice
        ? amount.toLocaleString('hi-IN', {
              minimumFractionDigits: usePrecision ? 2 : 0,
              maximumFractionDigits: usePrecision ? 2 : 0,
          })
        : formatNumber(amount, usePrecision === undefined || usePrecision ? format.fractionDigits : 0, format);
    const index = usePrecision ? formatted.lastIndexOf(decimal) : formatted.length;
    return {
        currencySymbol,
        decimals: formatted.substring(index + 1),
        decimalsDelimiter: usePrecision ? decimal : '',
        hasCurrencySpace,
        integer: formatted.substring(0, index),
        isCurrencyFirst,
        recurrenceTerm,
    };
}

export const formatRegularPrice = (data) => formatPrice(data, data.price, getRecurrenceTerm(data.commitment, data.term));

/** Formats the price per month: exact multiples divide evenly, others round to cents or up to a unit. */
export function formatOpticalPrice(data) {
    const { commitment, term, price, usePrecision } = data;
    const divisor = OPTICAL_DIVISORS[term] ?? 1;
    let amount = price / divisor;
    if (price % divisor != 0) {
        amount = usePrecision ? Math.round(amount * 100) / 100 : Math.ceil(Math.floor((price * 100) / divisor) / 100);
    }
    return formatPrice(data, amount, divisor > 1 ? 'MONTH' : getRecurrenceTerm(commitment, term));
}

/**
 * Formats the yearly total of an ABM offer, weighting an active percentage
 * promotion by its duration in months; other offers format as regular prices.
 */
export function formatAnnualPrice(data) {
    const { commitment, term, instant, price, originalPrice, priceWithoutDiscount, promotion, quantity } = data;
    if (commitment !== Commitment.YEAR || term !== Term.MONTHLY) return formatRegularPrice(data);
    if (!promotion) return formatPrice(data, price * 12, 'YEAR');
    const { displaySummary: { outcomeType, duration } = {} } = promotion;
    if (outcomeType === 'PERCENTAGE_DISCOUNT' && isPromotionActive(promotion, instant, quantity)) {
        const months = parseInt(duration.replace('P', '').replace('M', ''));
        // Legacy contract: a non-numeric duration returns the bare annual amount.
        if (isNaN(months)) return price * 12;
        const total = Math.round((originalPrice * months + priceWithoutDiscount * (12 - months)) * 100) / 100;
        return formatPrice(data, total, 'YEAR');
    }
    return formatPrice(data, (priceWithoutDiscount ?? price) * 12, 'YEAR');
}
