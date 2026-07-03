/**
 * Studio deep-link handling for chat messages.
 *
 * Authors paste card links (built by buildStudioFragmentHref, e.g.
 * https://mas.adobe.com/studio.html#content-type=merch-card&page=content&query=<uuid>)
 * into the chat. The LLM cannot act on a URL, but the fragment UUID inside
 * it is a first-class identifier for get_card and friends — so links are
 * resolved to their UUIDs before routing.
 */

const STUDIO_LINK_PATTERN = /https?:\/\/\S*studio\.html\S*/gi;
const FRAGMENT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fragmentIdFromLink(link) {
    const hashIndex = link.indexOf('#');
    const hashParams = hashIndex >= 0 ? new URLSearchParams(link.slice(hashIndex + 1)) : null;
    const candidate = hashParams?.get('query');
    return candidate && FRAGMENT_UUID.test(candidate) ? candidate.toLowerCase() : null;
}

export function extractStudioFragmentIds(text) {
    if (typeof text !== 'string') return [];
    const ids = [];
    for (const link of text.match(STUDIO_LINK_PATTERN) ?? []) {
        const id = fragmentIdFromLink(link);
        if (id) ids.push(id);
    }
    return ids;
}

export function replaceStudioLinksWithFragmentIds(text) {
    if (typeof text !== 'string') return text;
    return text.replace(STUDIO_LINK_PATTERN, (link) => fragmentIdFromLink(link) ?? link);
}
