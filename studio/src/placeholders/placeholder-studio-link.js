/**
 * Builds the Studio deep link for a single placeholder: opens Studio on the
 * Placeholders page with the search box pre-filled with the placeholder's key.
 * @param {{ path?: string, locale?: string, name: string, origin?: string }} params
 * @returns {string}
 */
export function buildPlaceholderStudioLink({ path, locale, name, origin = window.location.origin }) {
    const params = new URLSearchParams();
    params.set('content-type', 'placeholder');
    params.set('page', 'placeholders');
    params.set('path', path ?? '');
    params.set('locale', locale ?? '');
    params.set('search', name ?? '');
    return `${origin}/studio.html#${params.toString()}`;
}

/**
 * Builds one Studio deep link per placeholder, joined by newlines, suitable for
 * pasting into a list for localization / bulk-edit / bulk-publish workflows.
 * @param {string[]} placeholders - placeholder keys
 * @param {{ path?: string, locale?: string, origin?: string }} [context]
 * @returns {string}
 */
export function buildPlaceholderStudioLinks(placeholders, context = {}) {
    if (!placeholders?.length) return '';
    return placeholders.map((name) => buildPlaceholderStudioLink({ ...context, name })).join('\n');
}
