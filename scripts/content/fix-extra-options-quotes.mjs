export const FIELDS = ['ctas', 'cta', 'description', 'shortDescription'];

const DATA_EXTRA_OPTIONS_REGEX = /data-extra-options="(\{[^}]*\})"/g;

export function fixExtraOptionsQuotes(value) {
    return value.replace(DATA_EXTRA_OPTIONS_REGEX, (match, json) => {
        const fixed = json.replace(/\\"/g, '&quot;').replace(/"/g, '&quot;');
        return `data-extra-options="${fixed}"`;
    });
}
