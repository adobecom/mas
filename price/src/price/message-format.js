/**
 * The ICU MessageFormat subset authored in price literals: text with ICU
 * apostrophe quoting, `{arg}`, nested `{arg, select, key {…} other {…}}`, and
 * `{arg, number}` or `{arg, number, ::skeleton}` with `scale/N` and fraction
 * precision (`.00`, `.0#`, `.#`) stems. Anything else (plural, selectordinal,
 * date, time, named number styles, other stems), an invalid locale, or a
 * missing value throws, so formatLiteral logs the literal and renders ''.
 */

const SPACE = /[\t-\r \x85\u200E\u200F\u2028\u2029]*/y;
const SPACES = /[\t-\r \x85\u200E\u200F\u2028\u2029]+/;
const IDENTIFIER = /[^\p{White_Space}\p{Pattern_Syntax}]*/uy;
const STEM = /^(?:scale\/([^/]+)|\.(0*)(#*))$/;
const QUOTABLE = '{}<>';

const fail = () => {
    throw new SyntaxError('Unsupported price literal');
};

const join = (parts) => (values, locale) => parts.reduce((text, part) => text + part(values, locale), '');

/** Compiles a message into a `(values, locale) => string` formatter. */
function compile(message) {
    let pos = 0;
    const match = (pattern) => {
        pattern.lastIndex = pos;
        const [found] = pattern.exec(message);
        pos = pattern.lastIndex;
        return found;
    };
    const word = () => (match(SPACE), match(IDENTIFIER));
    const eat = (char) => (match(SPACE), message[pos] === char && ++pos);

    const literal = (depth) => {
        let text = '';
        let quoted = false;
        for (; pos < message.length; pos++) {
            const char = message[pos];
            if (char === "'") {
                if (message[pos + 1] === "'") {
                    text += "'";
                    pos++;
                    continue;
                }
                if (quoted || QUOTABLE.includes(message[pos + 1])) {
                    quoted = !quoted;
                    continue;
                }
            } else if (!quoted && (char === '{' || (depth && char === '}'))) break;
            text += char;
        }
        return () => text;
    };

    const argument = (depth) => {
        pos++;
        const name = word() || fail();
        const value = (values) => (name in values ? values[name] : fail());
        if (eat('}')) return (values) => value(values) ?? '';
        if (!eat(',')) fail();
        const type = word();
        if (type === 'number') {
            const options = {};
            let scale;
            if (eat(',')) {
                match(SPACE);
                const end = message.indexOf('}', pos);
                if (!message.startsWith('::', pos) || end < 0) fail();
                const stems = message
                    .slice(pos + 2, end)
                    .split(SPACES)
                    .filter(Boolean);
                if (!stems.length) fail();
                for (const stem of stems) {
                    const [, factor, minimum, optional] = stem.match(STEM) ?? fail();
                    if (factor) scale = parseFloat(factor);
                    else {
                        options.minimumFractionDigits = minimum.length;
                        options.maximumFractionDigits = minimum.length + optional.length;
                    }
                }
                pos = end;
            }
            if (!eat('}')) fail();
            const formats = new Map();
            return (values, locale) => {
                const number = value(values);
                if (!formats.has(locale)) formats.set(locale, new Intl.NumberFormat(locale, options));
                return formats.get(locale).format(scale ? number * scale : number);
            };
        }
        if (type !== 'select' || !eat(',')) fail();
        const cases = new Map();
        for (let key; (key = word()); ) {
            if (cases.has(key) || !eat('{')) fail();
            cases.set(key, join(parse(depth + 1)));
            if (!eat('}')) fail();
        }
        const other = cases.get('other') ?? fail();
        if (!eat('}')) fail();
        return (values, locale) => (cases.get(`${value(values)}`) ?? other)(values, locale);
    };

    const parse = (depth) => {
        const parts = [];
        while (pos < message.length && !(depth && message[pos] === '}')) {
            parts.push(message[pos] === '{' ? argument(depth) : literal(depth));
        }
        return parts;
    };

    return join(parse(0));
}

const messages = new Map();

/** Formats an ICU message subset; throws on unsupported syntax, an invalid locale or a missing value. */
export function formatMessage(message, locale, values) {
    Intl.getCanonicalLocales(locale);
    if (!messages.has(message)) messages.set(message, compile(message));
    return messages.get(message)(values, locale);
}
