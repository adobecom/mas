/**
 * Splits [lo, hi] (epoch ms) into `count` consecutive, non-overlapping windows for the search API's
 * `created: { after, before }` filter. Both bounds are inclusive, so each window ends 1ms before the next starts.
 * @returns {{ after: string, before: string }[]}
 */
export function createdWindows(lo, hi, count) {
    const step = Math.max(1, Math.ceil((hi - lo + 1) / count));
    return Array.from({ length: count }, (_, i) => [lo + i * step, Math.min(lo + (i + 1) * step - 1, hi)])
        .filter(([after]) => after <= hi)
        .map(([after, before]) => ({ after: new Date(after).toISOString(), before: new Date(before).toISOString() }));
}
