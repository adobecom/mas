/**
 * Builds the Studio deep link for a single placeholder.
 * @param {{ path?: string, locale?: string, id: string, origin?: string }} params
 * @returns {string}
 */
export function buildPlaceholderStudioLink({ path, locale, id, origin = window.location.origin }) {
    const params = new URLSearchParams();
    params.set('content-type', 'placeholder');
    params.set('page', 'placeholders');
    params.set('path', path ?? '');
    params.set('locale', locale ?? '');
    params.set('search', id ?? '');
    return `${origin}/studio.html#${params.toString()}`;
}

export function buildPlaceholderStudioLinks(ids, context = {}) {
    if (!ids?.length) return '';
    return ids.map((id) => buildPlaceholderStudioLink({ ...context, id })).join('\n');
}
