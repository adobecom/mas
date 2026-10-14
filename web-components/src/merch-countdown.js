import { LitElement, css, html } from 'lit';

const MINUTE = 60000;
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
        :host {
            color: var(--merch-countdown-color, #b30000);
            font-weight: 700;
        }
        :host([hidden]) {
            display: none;
        }
    `;

    #interval;

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
        clearInterval(this.#interval);
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
        clearInterval(this.#interval);
        if (!this.isConnected) return;
        this.lang = this.locale.replace('_', '-');
        this.#tick();
        // ponytail: minute precision matches the copy; instant freezes author previews.
        if (
            !this.instant &&
            Date.parse(this.start) < Date.parse(this.end) &&
            Date.now() < Date.parse(this.end)
        ) {
            this.#interval = setInterval(() => this.#tick(), MINUTE);
        }
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
        if (now >= Date.parse(this.end)) clearInterval(this.#interval);
    }

    render() {
        return html`${this.text}`;
    }
}

customElements.define('merch-countdown', MerchCountdown);
