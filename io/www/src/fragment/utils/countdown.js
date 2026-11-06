// Countdown rules shared by the pipeline and Studio.
// web-components/src/countdown.js repeats the link text and the unit tag format on purpose: keep them in sync.

/** Link text that marks where a countdown timer renders in rich text. */
export const COUNTDOWN_LINK_TEXT = 'countdown-timer';

/** Whether link text, ignoring case and extra spaces, is the countdown marker. */
export const isCountdownLinkText = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase() === COUNTDOWN_LINK_TEXT;

/** Variants that can carry a countdown: Pro (and its bizpro alias) and every Plans variant. */
export const supportsCountdown = (variant) => ['pro', 'bizpro'].includes(variant) || !!variant?.startsWith('plans');

export const COUNTDOWN_UNITS = ['day', 'hour', 'minute'];

/**
 * Countdown dates are wall-clock times: AEM stores them with a zone, but each browser must read them
 * in its own time zone, like Milo's countdown timer, so the zone is dropped.
 */
export const countdownLocalTime = (date) => date.replace(/(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/i, '');

/**
 * What `replace` resolves `{{countdown-<unit>}}` to: the unit's singular and plural dictionary entries
 * in a tag the browser can find and choose from, once it knows the count.
 */
export const countdownUnitPlaceholder = (unit) =>
    `<${unit}>{{countdown-${unit}-singular}}|{{countdown-${unit}-plural}}</${unit}>`;
