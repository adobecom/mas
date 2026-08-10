/**
 * pro "What's included" bridges the SHARED merch-card editor fields
 * (label + "Add bullet" + Edit-Icon dialog) to the variant's section markup.
 *
 * Each editor bullet `{ icon, alt, link }` maps to one titled section:
 *   - `icon`  -> the section icon (sp-icon-* element or merch-icon image)
 *   - `alt`   -> rich-text HTML whose FIRST paragraph is the bold title and
 *                whose remaining paragraphs are the section's bullet rows.
 *
 * The editor's shared label input supplies the card's whats-included toggle
 * copy (e.g. "See what's included:"), stored as a leading
 * `<p class="whats-included-label">` so it localizes with the field.
 *
 * Rendered shape (styled by web-components/src/variants/pro.css.js):
 *   <p class="whats-included-label">{label}</p>
 *   <div class="section">
 *     <h4>{icon}{title}</h4>
 *     <ul><li>row</li>…</ul>
 *   </div>
 *
 * Kept separate from the shared `merch-whats-included` path so other variants
 * are completely unaffected.
 */

function firstParagraphText(html) {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    const p = doc.querySelector('p');
    return (p ? p.textContent : doc.body.textContent).replace(/ /g, ' ').trim();
}

/** A bullet is empty when it has no icon and no title text. */
export function proBulletIsEmpty(value) {
    const { icon, alt } = value || {};
    if (icon) return false;
    if (!(alt ?? '').trim()) return true;
    return !firstParagraphText(alt);
}

/**
 * Parse stored section markup into the shared editor's
 * `{ label, values, bullets }` model. Each section becomes one bullet.
 */
export function parseProWhatsIncluded(html) {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    const bullets = [];
    doc.querySelectorAll('div.section').forEach((section) => {
        const h4 = section.querySelector('h4');
        if (!h4) return;

        let icon = '';
        const lead = h4.querySelector(':scope > *');
        const leadTag = lead?.tagName.toLowerCase() ?? '';
        if (leadTag.startsWith('sp-icon-')) icon = leadTag;
        else if (leadTag === 'merch-icon') icon = lead.getAttribute('src') || '';
        // A raw <svg> (legacy/custom icon) can't be represented in the standard
        // picker — drop the icon reference but keep the text.

        const titleClone = h4.cloneNode(true);
        const cloneLead = titleClone.querySelector(':scope > *');
        if (cloneLead && (leadTag.startsWith('sp-icon-') || leadTag === 'merch-icon' || leadTag === 'svg')) {
            cloneLead.remove();
        }
        const titleHtml = titleClone.innerHTML.trim();

        const parts = [`<p>${titleHtml}</p>`];
        section.querySelectorAll('ul > li').forEach((li) => {
            parts.push(`<p>${li.innerHTML.trim()}</p>`);
        });
        bullets.push({ icon, alt: parts.join(''), link: '' });
    });
    const label = doc.querySelector('p.whats-included-label')?.textContent.trim() ?? '';
    return { label, values: [], bullets };
}

function iconMarkup(icon) {
    if (!icon) return '';
    if (icon.startsWith('sp-icon-')) {
        return `<${icon} class="sp-icon"></${icon}>`;
    }
    const src = String(icon).replace(/"/g, '&quot;');
    return `<merch-icon size="xs" src="${src}"></merch-icon>`;
}

/**
 * Serialize the shared editor's bullets back to section markup. Inverse of
 * parseProWhatsIncluded; every row after the title is preserved
 * (the bug this fixes dropped all paragraphs except the first). A non-empty
 * label is stored ahead of the sections; with no label the output is
 * byte-identical to the pre-label format, so existing fragments round-trip
 * unchanged.
 */
export function serializeProWhatsIncluded(bullets, label = '') {
    const sections = (bullets ?? [])
        .filter((b) => !proBulletIsEmpty(b))
        .map(({ icon, alt }) => {
            const doc = new DOMParser().parseFromString(alt || '', 'text/html');
            const ps = Array.from(doc.querySelectorAll('p'));
            const titleHtml = (ps.length ? ps[0].innerHTML : doc.body.innerHTML).trim();
            const rows = ps
                .slice(1)
                .map((p) => p.innerHTML.trim())
                .filter((r) => r && r.replace(/&nbsp;|\s/g, ''));
            const list = rows.length ? `<ul>${rows.map((r) => `<li>${r}</li>`).join('')}</ul>` : '';
            return `<div class="section"><h4>${iconMarkup(icon)}${titleHtml}</h4>${list}</div>`;
        })
        .join('');
    if (!sections || !(label ?? '').trim()) return sections;
    const labelEl = document.createElement('p');
    labelEl.className = 'whats-included-label';
    labelEl.textContent = label.trim();
    return `${labelEl.outerHTML}${sections}`;
}
