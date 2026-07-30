/**
 * eduWhatsIncluded transformer — pro cards at size="edu".
 *
 * The authored whats-included field carries a single leading value (the panel
 * title) as `<p class="whats-included-label">`. For edu we promote it to the
 * title and inject two localized elements as {{…}} placeholders, which the
 * downstream `replace` transformer resolves from the dictionary:
 *   <p class="whats-included-title">{authored value}</p>
 *   <p class="whats-included-label">{{whats-included}}</p>
 *   …feature sections…
 *   <div class="whats-included-disclaimer">{{edu-disclaimer}}</div>  (unless hidden)
 *
 * The disclaimer uses a <div> because its dictionary value is rich text (a
 * <p>…</p>); a <p> wrapper would nest illegally and the browser would split it.
 *
 * Runs after `settings` (to read hideEduDisclaimer) and before `replace` (so the
 * placeholders resolve). String-based — the runtime has no DOM. Only pro/edu is
 * touched; everything else passes through untouched.
 */

const TRANSFORMER_NAME = 'eduWhatsIncluded';

const LABEL_RE = /<p class="whats-included-label">([\s\S]*?)<\/p>/;

export function transformEduWhatsIncluded(html, hideDisclaimer) {
    if (typeof html !== 'string') return html;
    // Already migrated, or nothing to promote — leave untouched (idempotent).
    if (html.includes('whats-included-title') || !LABEL_RE.test(html)) return html;
    let out = html.replace(
        LABEL_RE,
        '<p class="whats-included-title">$1</p>' +
            '<p class="whats-included-label">{{whats-included}}</p>',
    );
    if (!hideDisclaimer) {
        out += '<div class="whats-included-disclaimer">{{edu-disclaimer}}</div>';
    }
    return out;
}

function applyToFragment(fragment) {
    const fields = fragment?.fields;
    if (!fields || fields.variant !== 'pro' || fields.size !== 'edu') return;
    const wi = fields.whatsIncluded;
    if (wi == null) return;
    const hideDisclaimer = !!fragment.settings?.hideEduDisclaimer;
    // text/html fields are { mimeType, value }; plain text fields are strings.
    if (typeof wi === 'string') {
        fields.whatsIncluded = transformEduWhatsIncluded(wi, hideDisclaimer);
    } else if (typeof wi.value === 'string') {
        wi.value = transformEduWhatsIncluded(wi.value, hideDisclaimer);
    }
}

async function eduWhatsIncluded(context) {
    // edu is a standalone card, so the pipeline body is the card itself.
    // ponytail: standalone only — add a references sweep if edu ever ships in a collection.
    applyToFragment(context.body);
    return context;
}

export const transformer = {
    name: TRANSFORMER_NAME,
    process: eduWhatsIncluded,
};
