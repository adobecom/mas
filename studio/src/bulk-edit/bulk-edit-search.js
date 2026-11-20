import { html } from 'lit';
import { Fragment } from '../aem/fragment.js';
import { extractLocaleFromPath, extractSurfaceFromPath, stripHtml } from '../utils.js';
import { getLocaleByCode } from '../locales.js';
import { normalizePznTagIds, normalizePznTagToLocaleCode, pznTagsValue } from '../editors/variation-utils.js';
import { createPreviewDataWithParent } from '../reactivity/source-fragment-store.js';
import { mergePromoReferencesIntoFragmentData } from '../promotions/promotions-repository.js';

/** Search scopes and source fields supported by backend Find. */
export const SEARCH_FIELDS = [
    { value: 'prices', label: 'Prices', fields: ['prices'] },
    { value: 'ctas', label: 'Button labels', fields: ['ctas'] },
    { value: 'calloutText', label: 'Callout text', fields: ['callout'] },
    { value: 'fragmentDescription', label: 'Fragment description', fields: ['fragmentDescription'] },
    { value: 'fragmentTitle', label: 'Fragment title', fields: ['fragmentTitle'] },
    {
        value: 'productDescription',
        label: 'Product description',
        fields: ['cardTitle', 'description', 'features', 'compareChart', 'shortDescription'],
    },
    { value: 'promoText', label: 'Promo text', fields: ['promoText', 'promoCode'] },
    { value: 'subtitle', label: 'Subtitle', fields: ['subtitle'] },
    { value: 'tags', label: 'Tags', fields: ['tags'] },
];

const plainText = (value) => (/[<&]/.test(value) ? stripHtml(value) : value);
const textPattern = (query, matchCase, global = false) =>
    new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), `${global ? 'g' : ''}${matchCase ? '' : 'i'}`);

/** Builds escaped display text and individual raw search values, including HTML and CTA destinations. */
export function buildSearchRow(raw) {
    const fragment = new Fragment(raw);
    const values = {
        fragmentTitle: [raw.title ?? ''],
        fragmentDescription: [raw.description ?? ''],
    };
    for (const { fields } of SEARCH_FIELDS) {
        for (const field of fields) {
            if (field === 'fragmentTitle' || field === 'fragmentDescription') continue;
            values[field] = raw.fields?.find(({ name }) => name === field)?.values ?? [];
        }
    }
    values.tags =
        raw.fields?.find(({ name }) => name === 'tags')?.values ?? raw.tags?.map(({ id, title }) => id || title || '') ?? [];
    const text = Object.fromEntries(
        Object.entries(values).map(([field, entries]) => [field, entries.map((value) => String(value ?? '')).join(', ')]),
    );
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
        values,
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

/** Matches raw values independently within the selected backend scopes, never across joined display values. */
export function findSearchRows(rows, query, fields, matchCase) {
    if (!query || !fields.length) return [];
    const scopes = fields.includes('*') ? SEARCH_FIELDS : SEARCH_FIELDS.filter(({ value }) => fields.includes(value));
    const needle = matchCase ? query : query.toLowerCase();
    return rows.filter((row) =>
        scopes.some(({ fields }) =>
            fields.some((field) =>
                row.values[field].some((value) => {
                    if (value == null) return false;
                    const text = String(value);
                    return (matchCase ? text : text.toLowerCase()).includes(needle);
                }),
            ),
        ),
    );
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
