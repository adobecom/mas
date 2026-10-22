// io/www/src/fragment/utils/countdown.js repeats the link text and the unit tag format on purpose: keep them in sync.

const COUNTDOWN_LINK_TEXT = 'countdown-timer';

/** Whether link text, ignoring case and extra spaces, is the countdown marker. */
export const isCountdownLinkText = (text) =>
    text.replace(/\s+/g, ' ').trim().toLowerCase() === COUNTDOWN_LINK_TEXT;

/**
 * Matches `<unit>singular|plural</unit>`, the form `replace` gives each `{{countdown-<unit>}}`:
 * [, unit, 'singular|plural'].
 */
export const COUNTDOWN_UNIT_PAIR = /<(day|hour|minute)>(.*?)<\/\1>/g;

/** An unresolved dictionary token comes back as its key name, with or without braces. */
export const isUnresolvedCountdownToken = (text) =>
    /^(\{\{)?countdown-[\w-]+(\}\})?$/.test(text);
