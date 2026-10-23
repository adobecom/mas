import { LiteElement, html } from './lite.js';
import {
    COUNTDOWN_UNIT_PAIR,
    isUnresolvedCountdownToken,
} from './countdown.js';
import { css } from './css.js';

const MINUTE = 60000;
/** Classes an author can put on the sentinel link; each has a color rule in the styles below. */
export const COUNTDOWN_COLOR_CLASSES = [
    'spectrum-green-900',
    'spectrum-red-700',
];
// The resolved dictionary sentence holds one <unit>singular|plural</unit> per unit (see replace.js),
// where {n} is the number. Built-ins fill in whatever the dictionary leaves unresolved.
const DEFAULTS = {
    en: {
        sentence: 'Ends in <day></day>, <hour></hour>, <minute></minute>!',
        day: ['{n} day', '{n} days'],
        hour: ['{n} hour', '{n} hours'],
        minute: ['{n} minute', '{n} minutes'],
    },
    ko: {
        sentence: '<day></day> <hour></hour> <minute></minute> 후 할인 종료!',
        day: ['{n} 일'],
        hour: ['{n} 시간'],
        minute: ['{n} 분'],
    },
};
/** Whole days, hours and minutes left, or null outside the start..end range. */
export function remainingParts(start, end, now) {
    const startTime = Date.parse(start);
    const endTime = Date.parse(end);
    if (!(startTime <= now && now < endTime)) return null;
    const remaining = Math.floor((endTime - now) / MINUTE);
    return {
        day: Math.floor(remaining / 1440),
        hour: Math.floor((remaining % 1440) / 60),
        minute: remaining % 60,
    };
}

/** Fills the sentence's <unit>singular|plural</unit> pairs from `parts`; built-ins cover unresolved text. */
export function renderSentence(parts, locale, template) {
    const language = locale.split(/[-_]/)[0];
    // Built-in text is English unless we ship the language. Its plural form follows its own language,
    // so a ja page showing English still says "1 day" (ja has no singular rule).
    const builtInLanguage = DEFAULTS[language] ? language : 'en';
    const defaults = DEFAULTS[builtInLanguage];
    // Rich-text dictionary entries arrive wrapped in <p>.
    const authored = template?.replace(/<\/?p>/gi, '');
    const sentence =
        !authored || isUnresolvedCountdownToken(authored)
            ? defaults.sentence
            : authored;
    // shortcut: singular|plural only, languages with more plural categories need more forms.
    const formIndex = (lang, count) =>
        new Intl.PluralRules(lang).select(count) === 'one' ? 0 : 1;
    return sentence.replace(COUNTDOWN_UNIT_PAIR, (_, name, pair) => {
        const count = parts[name];
        const forms = pair.split('|');
        const form = forms[formIndex(language, count)] ?? forms[0];
        const builtIn = defaults[name];
        const text =
            form && !isUnresolvedCountdownToken(form)
                ? form
                : (builtIn[formIndex(builtInLanguage, count)] ?? builtIn[0]);
        return text.replace('{n}', count);
    });
}

/** Formats an active countdown, or returns an empty string outside its range. */
export function countdownText(start, end, now, locale = 'en_US', template) {
    const parts = remainingParts(start, end, now);
    return parts ? renderSentence(parts, locale, template) : '';
}

/** Inline promotion countdown with a clock owned by its connected element. */
export class MerchCountdown extends LiteElement {
    static properties = {
        start: { type: String },
        end: { type: String },
        locale: { type: String },
        template: { type: String },
        instant: { type: String },
        text: { state: true },
    };

    static styles = css`
        /* Default inherits the description color; authors pick one of these in the RTE. */
        :host(.spectrum-green-900) {
            color: var(--spectrum-green-900, #05834e);
        }
        :host(.spectrum-red-700) {
            color: var(--spectrum-red-700, #eb1000);
        }
        :host([hidden]) {
            display: none;
        }
    `;

    #timer;

    constructor() {
        super();
        this.locale = 'en_US';
        this.text = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.hidden = true;
        this.setAttribute('role', 'timer');
        this.setAttribute('aria-live', 'off');
        this.#startClock();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearTimeout(this.#timer);
    }

    willUpdate(changed) {
        if (
            ['start', 'end', 'locale', 'template', 'instant'].some((key) =>
                changed.has(key),
            )
        ) {
            this.#startClock();
        }
    }

    #startClock() {
        clearTimeout(this.#timer);
        if (!this.isConnected) return;
        this.lang = this.locale.replace('_', '-');
        this.#tick();
    }

    #tick() {
        const now = this.instant ? Date.parse(this.instant) : Date.now();
        this.text = countdownText(
            this.start,
            this.end,
            now,
            this.locale,
            this.template,
        );
        this.hidden = !this.text;
        const start = Date.parse(this.start);
        const end = Date.parse(this.end);
        // A fixed instant freezes author previews.
        if (this.instant || !(start < end) || now >= end) return;
        // Wake just after the minute count changes (or at start), so text and expiry never lag.
        const untilChange = ((end - now) % MINUTE) + 1;
        this.#timer = setTimeout(
            () => this.#tick(),
            now < start ? Math.min(untilChange, start - now) : untilChange,
        );
    }

    render() {
        return html`${this.text}`;
    }
}

// hydrate.js imports this module, so the card and collection bundles both include it.
if (!customElements.get('merch-countdown')) {
    customElements.define('merch-countdown', MerchCountdown);
}
