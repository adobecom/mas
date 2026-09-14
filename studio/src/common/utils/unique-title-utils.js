export function normalizeTitleForCompare(title) {
    return (title ?? '').trim().toLowerCase();
}

const TRAILING_SUFFIX_PATTERN = /^(.*)-(\d+)$/;

export function splitBaseAndSuffix(title) {
    const trimmed = (title ?? '').trim();
    const match = trimmed.match(TRAILING_SUFFIX_PATTERN);
    if (!match) return { base: trimmed, suffix: null };
    return { base: match[1], suffix: Number(match[2]) };
}

/**
 * Picks the lowest free `-#` suffix for `typedTitle` given the titles already taken
 * within the same tag Path, reusing gaps left by deleted/renamed cards.
 * @param {string} typedTitle
 * @param {string[]} takenTitles
 * @returns {{ finalTitle: string, adjusted: boolean }}
 */
export function resolveUniqueTitle(typedTitle, takenTitles = []) {
    const typed = (typedTitle ?? '').trim();
    if (!typed) return { finalTitle: typedTitle, adjusted: false };

    const normalizedTyped = normalizeTitleForCompare(typed);
    const isTaken = takenTitles.some((taken) => normalizeTitleForCompare(taken) === normalizedTyped);
    if (!isTaken) return { finalTitle: typed, adjusted: false };

    const { base } = splitBaseAndSuffix(typed);
    const normalizedBase = normalizeTitleForCompare(base);

    const takenSuffixes = new Set();
    for (const taken of takenTitles) {
        const takenParts = splitBaseAndSuffix(taken);
        if (normalizeTitleForCompare(takenParts.base) !== normalizedBase) continue;
        takenSuffixes.add(takenParts.suffix ?? 0);
    }

    let nextSuffix = 1;
    while (takenSuffixes.has(nextSuffix)) nextSuffix += 1;

    return { finalTitle: `${base}-${nextSuffix}`, adjusted: true };
}
