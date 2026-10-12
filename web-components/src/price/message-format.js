/**
 * ICU MessageFormat as accepted by intl-messageformat 9.13
 * (@formatjs/icu-messageformat-parser 2.1.0, icu-skeleton-parser 1.3.6),
 * ported for price literals, which are authored as content and may use any
 * of it. Output must match that library for every message it accepted;
 * recorded library output: test/price/__snapshots__/message-format.expected.json.
 * Not ported: rich-text tags (formatLiteral strips markup before formatting),
 * and object argument values, which format as '' instead of rich-text parts.
 * Invalid messages and missing values throw, as the library did.
 */

const SPACE = /[\t-\r \x85\u200E\u200F\u2028\u2029]*/y;
const IDENTIFIER = /[^\p{White_Space}\p{Pattern_Syntax}]*/uy;
const INTEGER = /[+-]?\d+/y;
const QUOTABLE = ['{', '<', '>', '}'];

const fail = (message) => {
    throw new SyntaxError(`Invalid message: ${message}`);
};

/**
 * @param {string} message
 * @param {Intl.Locale} locale resolves `j` in date/time skeletons
 * @returns {object[]} AST of { type, ... } elements
 */
function parse(message, locale) {
    let pos = 0;
    const match = (pattern) => {
        pattern.lastIndex = pos;
        const found = pattern.exec(message);
        if (found) pos = pattern.lastIndex;
        return found;
    };
    const eat = (prefix) => {
        if (!message.startsWith(prefix, pos)) return false;
        pos += prefix.length;
        return true;
    };
    const space = () => match(SPACE);
    const identifier = () => match(IDENTIFIER)[0];
    const integer = () => {
        const value = Number((match(INTEGER) ?? fail(message))[0]);
        return Number.isSafeInteger(value) ? value : fail(message);
    };

    const parseMessage = (depth, parentType) => {
        const plural =
            parentType === 'plural' || parentType === 'selectordinal';
        const elements = [];
        while (pos < message.length) {
            const char = message[pos];
            if (char === '{') {
                elements.push(parseArgument(depth));
            } else if (char === '}' && depth > 0) {
                break;
            } else if (char === '#' && plural) {
                pos++;
                elements.push({ type: 'pound' });
            } else {
                elements.push({
                    type: 'literal',
                    value: parseLiteral(depth, plural),
                });
            }
        }
        return elements;
    };

    // ICU apostrophe rules: `''` is `'`; `'` quotes only before `{ < > }`,
    // or `#` inside plural, up to the next single `'` or the end.
    const parseLiteral = (depth, plural) => {
        let text = '';
        for (let char; (char = message[pos]) !== undefined; ) {
            const next = message[pos + 1];
            if (char === "'" && next === "'") {
                text += "'";
                pos += 2;
            } else if (
                char === "'" &&
                (QUOTABLE.includes(next) || (next === '#' && plural))
            ) {
                pos++;
                text += message[pos++];
                while (pos < message.length) {
                    if (message[pos] !== "'") {
                        text += message[pos++];
                    } else if (message[pos + 1] === "'") {
                        text += "'";
                        pos += 2;
                    } else {
                        pos++;
                        break;
                    }
                }
            } else if (
                char === '{' ||
                (char === '#' && plural) ||
                (char === '}' && depth > 0)
            ) {
                break;
            } else {
                text += char;
                pos++;
            }
        }
        return text;
    };

    // Style text up to the first `}` outside quotes. Upstream counts nested
    // `{` but never steps past a `}` while unwinding, so the first one ends it.
    const parseStyle = () => {
        const start = pos;
        for (; pos < message.length && message[pos] !== '}'; pos++) {
            if (message[pos] === "'") {
                pos = message.indexOf("'", pos + 1);
                if (pos < 0) fail(message);
            }
        }
        return message.slice(start, pos).trimEnd() || fail(message);
    };

    const parseArgument = (depth) => {
        pos++;
        space();
        const name = identifier() || fail(message);
        space();
        if (eat('}')) return { type: 'argument', name };
        if (!eat(',')) fail(message);
        space();
        const type = identifier();
        if (type === 'number' || type === 'date' || type === 'time') {
            space();
            let style;
            if (eat(',')) {
                space();
                style = parseStyle();
            }
            if (!eat('}')) fail(message);
            if (style && style.startsWith('::')) {
                const skeleton = style.slice(2).trimStart();
                style =
                    type === 'number'
                        ? parseNumberSkeleton(skeleton)
                        : parseDateTimeSkeleton(
                              bestPattern(skeleton || fail(message), locale),
                          );
            }
            return { type, name, style };
        }
        if (
            type !== 'plural' &&
            type !== 'selectordinal' &&
            type !== 'select'
        ) {
            fail(message);
        }
        space();
        if (!eat(',')) fail(message);
        space();
        let selector = identifier();
        let offset = 0;
        if (type !== 'select' && selector === 'offset') {
            if (!eat(':')) fail(message);
            space();
            offset = integer();
            space();
            selector = identifier();
        }
        const options = [];
        for (;;) {
            if (!selector) {
                const start = pos;
                if (type === 'select' || !eat('=')) break;
                integer();
                selector = message.slice(start, pos);
            }
            if (options.some(([key]) => key === selector)) fail(message);
            space();
            if (!eat('{')) fail(message);
            options.push([selector, parseMessage(depth + 1, type)]);
            if (!eat('}')) fail(message);
            space();
            selector = identifier();
        }
        if (!options.some(([key]) => key === 'other')) fail(message);
        if (!eat('}')) fail(message);
        return { type, name, offset, options: Object.fromEntries(options) };
    };

    return parseMessage(0, '');
}

// Number skeletons: https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html
// Upstream declares these with `g` and calls .test(), so a rejected `.00/a/b`
// left lastIndex set and broke the next fraction stem. That bug is not ported.
const FRACTION_PRECISION = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/;
const SIGNIFICANT_PRECISION = /^(@+)?(\+|#+)?[rs]?$/;
const CONCISE_INTEGER_WIDTH = /^(0+)$/;
const INTEGER_WIDTH = /(\*)(0+)|(#+)(0+)|(0+)/g;

const SIGNS = {
    'sign-auto': { signDisplay: 'auto' },
    'sign-accounting': { currencySign: 'accounting' },
    '()': { currencySign: 'accounting' },
    'sign-always': { signDisplay: 'always' },
    '+!': { signDisplay: 'always' },
    'sign-accounting-always': {
        signDisplay: 'always',
        currencySign: 'accounting',
    },
    '()!': { signDisplay: 'always', currencySign: 'accounting' },
    'sign-except-zero': { signDisplay: 'exceptZero' },
    '+?': { signDisplay: 'exceptZero' },
    'sign-accounting-except-zero': {
        signDisplay: 'exceptZero',
        currencySign: 'accounting',
    },
    '()?': { signDisplay: 'exceptZero', currencySign: 'accounting' },
    'sign-never': { signDisplay: 'never' },
    '+_': { signDisplay: 'never' },
};
const signOf = (stem) =>
    Object.hasOwn(SIGNS, stem) ? { ...SIGNS[stem] } : undefined;

// The `g1.length` reads throw on `+`, `#`, `r`, `s` or empty input, as upstream.
function significantPrecision(str) {
    const result = {};
    if (str.endsWith('r')) result.roundingPriority = 'morePrecision';
    else if (str.endsWith('s')) result.roundingPriority = 'lessPrecision';
    const found = str.match(SIGNIFICANT_PRECISION);
    if (found) {
        const [, g1, g2] = found;
        if (typeof g2 !== 'string') {
            result.minimumSignificantDigits = g1.length;
            result.maximumSignificantDigits = g1.length;
        } else if (g2 === '+') {
            result.minimumSignificantDigits = g1.length;
        } else {
            result.minimumSignificantDigits = g1.length;
            result.maximumSignificantDigits = g1.length + g2.length;
        }
    }
    return result;
}

function conciseNotation(stem) {
    const notation = stem.startsWith('EE')
        ? 'engineering'
        : stem.startsWith('E')
          ? 'scientific'
          : undefined;
    if (!notation) return undefined;
    const result = { notation };
    let rest = stem.slice(notation === 'engineering' ? 2 : 1);
    const sign = { '+!': 'always', '+?': 'exceptZero' }[rest.slice(0, 2)];
    if (sign) {
        result.signDisplay = sign;
        rest = rest.slice(2);
    }
    if (!CONCISE_INTEGER_WIDTH.test(rest)) {
        throw new RangeError('Malformed concise eng/scientific notation');
    }
    result.minimumIntegerDigits = rest.length;
    return result;
}

/** @returns {Intl.NumberFormatOptions & { scale?: number }} */
function parseNumberSkeleton(skeleton) {
    if (!skeleton) throw new RangeError('Empty number skeleton');
    const tokens = skeleton
        .split(/[\t-\r \x85\u200E\u200F\u2028\u2029]/)
        .filter(Boolean)
        .map((token) => {
            const [stem, ...options] = token.split('/');
            if (options.some((option) => !option)) {
                throw new RangeError(`Invalid number skeleton: ${skeleton}`);
            }
            return { stem, options };
        });
    let result = {};
    for (const { stem, options } of tokens) {
        switch (stem) {
            case 'percent':
            case '%':
                result.style = 'percent';
                continue;
            case '%x100':
                result.style = 'percent';
                result.scale = 100;
                continue;
            case 'currency':
                result.style = 'currency';
                result.currency = options[0];
                continue;
            case 'group-off':
            case ',_':
                result.useGrouping = false;
                continue;
            case 'precision-integer':
            case '.':
                result.maximumFractionDigits = 0;
                continue;
            case 'measure-unit':
            case 'unit':
                result.style = 'unit';
                result.unit = options[0].replace(/^(.*?)-/, '');
                continue;
            case 'compact-short':
            case 'K':
                result.notation = 'compact';
                result.compactDisplay = 'short';
                continue;
            case 'compact-long':
            case 'KK':
                result.notation = 'compact';
                result.compactDisplay = 'long';
                continue;
            case 'scientific':
            case 'engineering':
                result = { ...result, notation: stem };
                for (const option of options) {
                    Object.assign(result, signOf(option));
                }
                continue;
            case 'notation-simple':
                result.notation = 'standard';
                continue;
            case 'unit-width-narrow':
                result.currencyDisplay = 'narrowSymbol';
                result.unitDisplay = 'narrow';
                continue;
            case 'unit-width-short':
                result.currencyDisplay = 'code';
                result.unitDisplay = 'short';
                continue;
            case 'unit-width-full-name':
                result.currencyDisplay = 'name';
                result.unitDisplay = 'long';
                continue;
            case 'unit-width-iso-code':
                result.currencyDisplay = 'symbol';
                continue;
            case 'scale':
                result.scale = parseFloat(options[0]);
                continue;
            case 'integer-width':
                if (options.length > 1) {
                    throw new RangeError('integer-width takes one option');
                }
                for (const [, g1, g2, g3, g4, g5] of options[0].matchAll(
                    INTEGER_WIDTH,
                )) {
                    if (g1) result.minimumIntegerDigits = g2.length;
                    else if ((g3 && g4) || g5) {
                        throw new RangeError('Unsupported integer-width');
                    }
                }
                continue;
        }
        if (CONCISE_INTEGER_WIDTH.test(stem)) {
            result.minimumIntegerDigits = stem.length;
            continue;
        }
        const fraction = stem.match(FRACTION_PRECISION);
        if (fraction) {
            if (options.length > 1) {
                throw new RangeError('Fraction precision takes one option');
            }
            const [, g1, g2, g3, g4, g5] = fraction;
            if (g2 === '*') {
                result.minimumFractionDigits = g1.length;
            } else if (g3) {
                result.maximumFractionDigits = g3.length;
            } else if (g4 && g5) {
                result.minimumFractionDigits = g4.length;
                result.maximumFractionDigits = g4.length + g5.length;
            } else {
                result.minimumFractionDigits = g1.length;
                result.maximumFractionDigits = g1.length;
            }
            const [option] = options;
            if (option === 'w') result.trailingZeroDisplay = 'stripIfInteger';
            else if (option)
                Object.assign(result, significantPrecision(option));
            continue;
        }
        if (SIGNIFICANT_PRECISION.test(stem)) {
            Object.assign(result, significantPrecision(stem));
            continue;
        }
        Object.assign(result, signOf(stem), conciseNotation(stem));
    }
    return result;
}

// Date skeletons: https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
const DATE_TIME_FIELD =
    /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;
const HOUR_CYCLES = { h: 'h12', H: 'h23', K: 'h11', k: 'h24' };
const HOUR_SYMBOLS = { h12: 'h', h23: 'H', h11: 'K', h24: 'k' };
const NUMERIC = ['numeric', '2-digit'];
const WEEKDAYS = ['short', 'long', 'narrow', 'short'];

/** @returns {Intl.DateTimeFormatOptions} */
function parseDateTimeSkeleton(skeleton) {
    const result = {};
    for (const [field] of skeleton.matchAll(DATE_TIME_FIELD)) {
        const { length } = field;
        const symbol = field[0];
        switch (symbol) {
            case 'G':
                result.era =
                    length === 4 ? 'long' : length === 5 ? 'narrow' : 'short';
                break;
            case 'y':
                result.year = length === 2 ? '2-digit' : 'numeric';
                break;
            case 'M':
            case 'L':
                result.month = [...NUMERIC, 'short', 'long', 'narrow'][
                    length - 1
                ];
                break;
            case 'd':
                result.day = NUMERIC[length - 1];
                break;
            case 'E':
                result.weekday = length === 5 ? 'narrow' : 'short';
                break;
            case 'e':
            case 'c':
                if (length < 4) throw new RangeError(`Unsupported ${field}`);
                result.weekday = WEEKDAYS[length - 4];
                break;
            case 'a':
                result.hour12 = true;
                break;
            case 'h':
            case 'H':
            case 'K':
            case 'k':
                result.hourCycle = HOUR_CYCLES[symbol];
                result.hour = NUMERIC[length - 1];
                break;
            case 'm':
                result.minute = NUMERIC[length - 1];
                break;
            case 's':
                result.second = NUMERIC[length - 1];
                break;
            case 'z':
                result.timeZoneName = length < 4 ? 'short' : 'long';
                break;
            default:
                throw new RangeError(`Unsupported ${field}`);
        }
    }
    return result;
}

// ponytail: the library falls back to bundled CLDR hour-cycle data when the
// engine lacks Intl.Locale#hourCycles; this uses the engine's default hour
// cycle instead. Only affects `j` in date/time skeletons.
function hourSymbol(locale) {
    const hourCycle =
        locale.hourCycle ||
        locale.hourCycles?.[0] ||
        new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions()
            .hourCycle;
    return HOUR_SYMBOLS[hourCycle] ?? fail(hourCycle);
}

// Expands `j` (locale hour) and `J` (24h) in a date/time skeleton.
function bestPattern(skeleton, locale) {
    let pattern = '';
    for (let i = 0; i < skeleton.length; i++) {
        const char = skeleton[i];
        if (char !== 'j') {
            pattern += char === 'J' ? 'H' : char;
            continue;
        }
        let extra = 0;
        while (skeleton[i + 1] === 'j') {
            extra++;
            i++;
        }
        const hour = hourSymbol(locale);
        const periods =
            hour === 'H' || hour === 'k' ? 0 : extra < 2 ? 1 : 3 + (extra >> 1);
        pattern = hour.repeat(1 + (extra & 1)) + pattern + 'a'.repeat(periods);
    }
    return pattern;
}

const NUMBER_STYLES = {
    integer: { maximumFractionDigits: 0 },
    currency: { style: 'currency' },
    percent: { style: 'percent' },
};
const DATE_STYLES = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
};
const LONG_TIME = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short',
};
const TIME_STYLES = {
    short: { hour: 'numeric', minute: 'numeric' },
    medium: { hour: 'numeric', minute: 'numeric', second: 'numeric' },
    long: LONG_TIME,
    full: LONG_TIME,
};

const styleOf = (styles, style) =>
    typeof style === 'string' ? styles[style] : style;

function formatElements(elements, locale, values, pluralValue) {
    return elements
        .map((element) => {
            const { type, name, style } = element;
            if (type === 'literal') return element.value;
            if (type === 'pound') {
                // Only parsed directly in a plural branch: always a number.
                return new Intl.NumberFormat(locale).format(pluralValue);
            }
            if (!(values && name in values)) {
                throw new ReferenceError(`Missing value: ${name}`);
            }
            const value = values[name];
            switch (type) {
                case 'argument':
                    return typeof value === 'string' ||
                        typeof value === 'number'
                        ? String(value)
                        : '';
                case 'number': {
                    const options = styleOf(NUMBER_STYLES, style);
                    return new Intl.NumberFormat(locale, options).format(
                        options?.scale ? value * options.scale : value,
                    );
                }
                case 'date':
                    return new Intl.DateTimeFormat(
                        locale,
                        styleOf(DATE_STYLES, style),
                    ).format(value);
                case 'time':
                    return new Intl.DateTimeFormat(
                        locale,
                        style === undefined
                            ? TIME_STYLES.medium
                            : styleOf(TIME_STYLES, style),
                    ).format(value);
                case 'select':
                    return formatElements(
                        element.options[value] || element.options.other,
                        locale,
                        values,
                    );
                default: {
                    const { options, offset } = element;
                    const rule = new Intl.PluralRules(locale, {
                        type: type === 'plural' ? 'cardinal' : 'ordinal',
                    }).select(value - offset);
                    return formatElements(
                        options[`=${value}`] || options[rule] || options.other,
                        locale,
                        values,
                        value - offset,
                    );
                }
            }
        })
        .join('');
}

/**
 * Formats an ICU message like `new IntlMessageFormat(message, locale).format(values)`.
 * Throws on invalid syntax, an invalid locale, or a missing value.
 */
export function formatMessage(message, locale, values) {
    const locales = locale ?? new Intl.NumberFormat().resolvedOptions().locale;
    const [supported] = Intl.NumberFormat.supportedLocalesOf(locales);
    const ast = parse(message, new Intl.Locale(supported ?? locales));
    return formatElements(ast, locales, values);
}
