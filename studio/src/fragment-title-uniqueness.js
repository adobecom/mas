const DEFAULT_MAX_ATTEMPTS = 100;

/**
 * Finds the first title absent from `existingTitles`, appending `-1`, `-2`, … to `title`
 * until a free one is found. Never throws: if `maxAttempts` is exhausted, the original
 * `title` is returned unchanged with `exhausted: true` so callers can still save.
 * @param {string} title
 * @param {Set<string>|string[]} existingTitles
 * @param {number} [maxAttempts]
 * @returns {{ title: string, renamed: boolean, exhausted?: boolean }}
 */
export function nextAvailableTitle(title, existingTitles, maxAttempts = DEFAULT_MAX_ATTEMPTS) {
    const taken = existingTitles instanceof Set ? existingTitles : new Set(existingTitles || []);
    if (!taken.has(title)) return { title, renamed: false };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const candidate = `${title}-${attempt}`;
        if (!taken.has(candidate)) return { title: candidate, renamed: true };
    }

    return { title, renamed: false, exhausted: true };
}

/**
 * @param {string} title - The final (possibly suffixed) title
 * @returns {string}
 */
export function buildRenameNotice(title) {
    return `A card with this title already exists in this path. Saved as "${title}".`;
}

/**
 * Resolves a unique title against a caller-provided lookup, notifying once when renamed.
 * Degrades to the typed title (never throws) when `listTitles` rejects or resolves to
 * null/undefined, so a lookup failure never blocks the save.
 * @param {Object} params
 * @param {string} params.title
 * @param {() => Promise<Set<string>|string[]|null|undefined>} params.listTitles
 * @param {(title: string) => void} [params.notify]
 * @param {number} [params.maxAttempts]
 * @returns {Promise<{ title: string, renamed: boolean }>}
 */
export async function resolveUniqueTitle({ title, listTitles, notify, maxAttempts = DEFAULT_MAX_ATTEMPTS }) {
    let existingTitles;
    try {
        existingTitles = await listTitles();
    } catch {
        return { title, renamed: false };
    }
    if (existingTitles == null) return { title, renamed: false };

    const { title: resolvedTitle, renamed } = nextAvailableTitle(title, existingTitles, maxAttempts);
    if (renamed) notify?.(resolvedTitle);
    return { title: resolvedTitle, renamed };
}
