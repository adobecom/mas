const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AEM_PATH_RE = /^\/content\/dam\/mas\//;

export function parseStudioUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    let url;
    try {
        url = new URL(trimmed);
    } catch {
        return null;
    }

    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    const params = new URLSearchParams(hash);
    const fragmentId = params.get('query');
    if (!fragmentId || !UUID_RE.test(fragmentId)) return null;

    return { fragmentId };
}

export function parseAemPath(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!AEM_PATH_RE.test(trimmed)) return null;
    return { path: trimmed };
}
