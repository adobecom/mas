import { LitElement, css, html } from 'lit';

const MINUTE = 60000;
/** Classes an author can put on the sentinel link; each has a color rule in the styles below. */
export const COUNTDOWN_COLOR_CLASSES = [
    'spectrum-green-900',
    'spectrum-red-700',
];
const TEMPLATES = {
    en: 'Ends in {days} days, {hours} hours, {minutes} minutes!',
    ko: '{days} 일 {hours} 시간 {minutes} 분 후 할인 종료!',
};

/** Formats an active countdown, or returns an empty string outside its range. */
export function countdownText(start, end, now, locale = 'en_US', template) {
    const startTime = Date.parse(start);
    const endTime = Date.parse(end);
    if (!(startTime <= now && now < endTime)) return '';
    const remaining = Math.floor((endTime - now) / MINUTE);
    const values = {
        days: Math.floor(remaining / 1440),
        hours: Math.floor((remaining % 1440) / 60),
        minutes: remaining % 60,
    };
    const language = locale.split(/[-_]/)[0];
    const copy =
        !template || /^(\{\{)?countdown-timer-text(\}\})?$/.test(template)
            ? TEMPLATES[language] || TEMPLATES.en
            : template;
    return copy.replace(/\{(days|hours|minutes)\}/g, (_, unit) => values[unit]);
}

/** Inline promotion countdown with a clock owned by its connected element. */
export class MerchCountdown extends LitElement {
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

customElements.define('merch-countdown', MerchCountdown);
