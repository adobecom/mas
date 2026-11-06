import { html } from 'lit';
import { Fragment } from '../aem/fragment.js';
import { extractLocaleFromPath, extractSurfaceFromPath, stripHtml } from '../utils.js';
import { getLocaleByCode } from '../locales.js';
import { parseCtas, normalizePznTagIds, normalizePznTagToLocaleCode, pznTagsValue } from '../editors/variation-utils.js';
import { createPreviewDataWithParent } from '../reactivity/source-fragment-store.js';
import { mergePromoReferencesIntoFragmentData } from '../promotions/promotions-repository.js';

/** Authored text fields supported by Find and replace. */
export const SEARCH_FIELDS = [
    { value: 'badge', label: 'Badge' },
    { value: 'ctas', label: 'Button labels' },
    { value: 'callout', label: 'Callout text' },
    { value: 'fragmentDescription', label: 'Fragment description' },
    { value: 'fragmentTitle', label: 'Fragment title' },
    { value: 'description', label: 'Product description' },
    { value: 'promoText', label: 'Promo text' },
    { value: 'subtitle', label: 'Subtitle' },
    { value: 'tags', label: 'Tags' },
];

const plainText = (value) => (/[<&]/.test(value) ? stripHtml(value) : value);
const textPattern = (query, matchCase, global = false) =>
    new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), `${global ? 'g' : ''}${matchCase ? '' : 'i'}`);

/** Builds display/search text once per fragment, without searching HTML attributes or CTA destinations. */
export function buildSearchRow(raw) {
    const fragment = new Fragment(raw);
    const text = {
        fragmentTitle: fragment.title ?? '',
        fragmentDescription: fragment.description ?? '',
    };
    for (const { value } of SEARCH_FIELDS) {
        if (value === 'fragmentTitle' || value === 'fragmentDescription') continue;
        const values = fragment.getFieldValues(value);
        text[value] =
            value === 'ctas'
                ? values.flatMap((markup) => parseCtas(markup).map((cta) => cta.text)).join(', ')
                : values.map(plainText).join(', ');
    }
    return {
        id: fragment.id,
        fragment: raw,
        path: fragment.path,
        offer: plainText(fragment.getFieldValue('cardTitle') ?? fragment.title ?? ''),
        icon: fragment.getFieldValue('mnemonicIcon') ?? '',
        offerId: fragment.getFieldValues('osi').join(', '),
        offerType: fragment.getCurrentTagTitle('mas:offer_type/') ?? '',
        status: fragment.status,
        text,
    };
}

/** Loads hydrated references and discovers promotion copies using the Fragments page's lookup. */
export async function loadSearchVariations(row, repository, controller) {
    const data = await repository.aem.sites.cf.fragments.getById(row.id, controller);
    controller.signal.throwIfAborted();
    const merged = await mergePromoReferencesIntoFragmentData(repository.aem, data, () => repository.loadPromotions());
    controller.signal.throwIfAborted();
    const parent = new Fragment(merged);
    const toRows = (variations) =>
        variations
            .filter((variation) => !Fragment.isBaselinePath(variation.path))
            .map((variation) => {
                const display = buildSearchRow(createPreviewDataWithParent(variation, parent));
                const localeCode = extractLocaleFromPath(variation.path);
                const locale = getLocaleByCode(localeCode);
                const localeLabel = locale ? `${locale.country} (${locale.lang.toUpperCase()})` : localeCode;
                const targetLocales = Fragment.isGroupedVariationPath(variation.path)
                    ? normalizePznTagIds(pznTagsValue(variation))
                          .map((tag) => normalizePznTagToLocaleCode(tag, extractSurfaceFromPath(variation.path), locale?.lang))
                          .filter(Boolean)
                    : [];
                return {
                    ...display,
                    offer: `${display.offer} ${localeLabel}`,
                    icon: '',
                    fragment: variation,
                    parentId: row.id,
                    localeCodes: targetLocales.length ? targetLocales : [localeCode],
                };
            });
    return {
        locale: toRows(parent.listLocaleVariations()),
        promotion: toRows(parent.listPromoVariations()),
        grouped: toRows(parent.listGroupedVariations()),
    };
}

/** Matches literal text against the selected fields. */
export function findSearchRows(rows, query, fields, matchCase) {
    if (!query || !fields.length) return [];
    const pattern = textPattern(query, matchCase);
    return rows.filter((row) => fields.some((field) => pattern.test(row.text[field])));
}

/** Highlights literal matches or previews replacements using escaped Lit text, never authored HTML. */
export function highlightSearchText(text, query, matchCase, replaceText = '') {
    if (!query) return text;
    const parts = [];
    let offset = 0;
    for (const match of text.matchAll(textPattern(query, matchCase, true))) {
        parts.push(
            text.slice(offset, match.index),
            replaceText
                ? html`<span class="replacement-preview"
                      ><del>${match[0]}</del><span class="replacement-arrow"> &#8594; </span><ins>${replaceText}</ins></span
                  >`
                : html`<mark>${match[0]}</mark>`,
        );
        offset = match.index + match[0].length;
    }
    parts.push(text.slice(offset));
    return parts;
}
