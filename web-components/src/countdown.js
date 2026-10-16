/** Link text that marks where a countdown timer renders in rich text. */
export const COUNTDOWN_LINK_TEXT = 'countdown-timer';

/** Whether link text, ignoring case and extra spaces, is the countdown marker. */
export const isCountdownLinkText = (text) =>
    text.replace(/\s+/g, ' ').trim().toLowerCase() === COUNTDOWN_LINK_TEXT;

/** Variants that can carry a countdown: Pro (and its bizpro alias) and every Plans variant. */
export const supportsCountdown = (variant) =>
    ['pro', 'bizpro'].includes(variant) || !!variant?.startsWith('plans');

export const COUNTDOWN_UNITS = ['day', 'hour', 'minute'];

/**
 * What `replace` resolves `{{countdown-<unit>}}` to: the unit's singular and plural dictionary entries
 * in a tag the browser can find and choose from, once it knows the count.
 */
export const countdownUnitPlaceholder = (unit) =>
    `<${unit}>{{countdown-${unit}-singular}}|{{countdown-${unit}-plural}}</${unit}>`;

/** Matches the resolved form of `countdownUnitPlaceholder`: [, unit, 'singular|plural']. */
export const COUNTDOWN_UNIT_PAIR = new RegExp(
    `<(${COUNTDOWN_UNITS.join('|')})>(.*?)</\\1>`,
    'g',
);

/** An unresolved dictionary token comes back as its key name, with or without braces. */
export const isUnresolvedCountdownToken = (text) =>
    /^(\{\{)?countdown-[\w-]+(\}\})?$/.test(text);
