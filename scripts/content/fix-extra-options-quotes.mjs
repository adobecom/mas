export const FIELDS = ['ctas', 'cta', 'description', 'shortDescription'];

const DATA_EXTRA_OPTIONS_REGEX = /data-extra-options="(\{[^}]*\})"/g;

export function fixExtraOptionsQuotes(value) {
    return value.replace(DATA_EXTRA_OPTIONS_REGEX, (match, json) => {
        const fixed = json.replace(/\\"/g, '&quot;').replace(/"/g, '&quot;');
        return `data-extra-options="${fixed}"`;
    });
}

export function repairFragment(fragment) {
    const changed = [];
    for (const field of fragment.fields ?? []) {
        if (!FIELDS.includes(field.name)) continue;
        let fieldChanged = false;
        field.values = (field.values ?? []).map((value) => {
            if (typeof value !== 'string') return value;
            const fixed = fixExtraOptionsQuotes(value);
            if (fixed !== value) fieldChanged = true;
            return fixed;
        });
        if (fieldChanged) changed.push(field.name);
    }
    return changed;
}

export function studioLink(id) {
    return `https://main--mas--adobecom.aem.live/studio.html#page=fragment-editor&fragmentId=${id}`;
}

export function buildReport(hits) {
    return hits.map((hit) => studioLink(hit.id)).join('\n');
}
