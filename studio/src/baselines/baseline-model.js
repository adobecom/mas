import {
    BASELINES_FOLDER,
    COMPAT_VERSION,
    ROOT_PATH,
    TAG_MERCH_CARD,
    TAG_MODEL_ID_MAPPING,
    BASELINE_NAME,
} from '../constants.js';
import { Fragment } from '../aem/fragment.js';
import { getFragmentByPathOrNull } from '../common/utils/fragment-api.js';
import { loadOfferData } from '../common/utils/item-loading-browser.js';
import { DEFAULT_CONTEXT } from '../../libs/fragment-client.js';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';
import { getOfferBaseline } from '../../../io/www/src/fragment/transformers/offer.js';
import { normalizeExplicitEmptyInFields } from '../../../io/www/src/fragment/utils/explicit-empty.js';

export const DEFAULT_MARKET_SEGMENT = 'com';

const BASELINE_LAYERS = [
    ['offerBaseline', 'offer'],
    ['fragmentBaseline', 'template'],
    ['fragmentSegmentBaseline', 'segment'],
];

const CARD_OWN_FIELDS = new Set([
    'variant',
    'osi',
    'tags',
    'pznTags',
    'variations',
    'enableBaselines',
    'locReady',
    'compatVersion',
    'originalId',
]);

const OFFER_ICON_FIELDS = new Set(['mnemonicIcon', 'mnemonicAlt']);

export const buildBaselineFolderPath = ({ surface, locale, template, productArrangementCode, marketSegment }) => {
    const folder = `${ROOT_PATH}/${surface}/${locale}/${BASELINES_FOLDER}/${template}/${productArrangementCode}`;
    const segment = marketSegment?.toLowerCase();
    return segment && segment !== DEFAULT_MARKET_SEGMENT ? `${folder}/${segment}` : folder;
};

const BASELINE_PATH = new RegExp(
    `/${BASELINES_FOLDER}/(?<template>[^/]+)/(?<productArrangementCode>[^/]+)(?:/(?<marketSegment>[^/]+))?/[^/]+$`,
);

/**
 * Template, PA code & market segment override (`undefined` for the default segment) of a baseline fragment path, the
 * inverse of `buildBaselineFolderPath`; `null` for any other path.
 */
export const parseBaselinePath = (path) => {
    const groups = path?.match(BASELINE_PATH)?.groups;
    return groups ? { ...groups } : null;
};

export async function prepareBaselineFolder(fragmentsApi, baseline) {
    const folder = buildBaselineFolderPath(baseline);
    await fragmentsApi.ensureFolderExists(folder);
    const existing = await getFragmentByPathOrNull(fragmentsApi, `${folder}/${BASELINE_NAME}`);
    return { folder, exists: Boolean(existing) };
}

export async function resolveBaselineOffer(offerSelectorId, offer, timeoutMs) {
    if (offer.productArrangementCode) {
        return { productArrangementCode: offer.productArrangementCode, marketSegment: offer.market_segments?.[0] };
    }
    const resolvedOffer = await loadOfferData({}, { fallbackWcsOsi: offerSelectorId, timeoutMs });
    return {
        productArrangementCode: resolvedOffer?.productArrangementCode,
        marketSegment: resolvedOffer?.marketSegments?.[0],
    };
}

export async function createBaseline(repository, { title, osi, ...baseline }) {
    const { folder, exists } = await prepareBaselineFolder(repository.aem.sites.cf.fragments, baseline);
    if (exists) return { exists };
    const fragment = await repository.createFragment({
        modelId: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
        title,
        name: BASELINE_NAME,
        parentPath: folder,
        data: { osi, cardTitle: title, variant: baseline.template, compatVersion: COMPAT_VERSION },
    });
    return { folder, fragment };
}

export const hasContent = (values = []) => values.some((value) => value !== '' && value !== null && value !== undefined);

const toAuthorFragment = ({ fields, ...offerBaseline }) => ({
    ...offerBaseline,
    fields: Object.entries(fields).map(([name, value]) => ({
        name,
        multiple: Array.isArray(value),
        values: Array.isArray(value) ? value : [value],
    })),
});

/**
 * Baselines a card would inherit from (ADR CONT-0005), looked up like the `offer` transformer does: in the default locale
 * of the card locale, for the PA code & market segment of its offer and its template. `null` without offer, template or
 * PA code; each missing baseline is `null`. Also returns the PA code & market segment they were looked up with.
 */
export async function findCardBaselines(fragmentsApi, { surface, locale, osi, template }) {
    const defaultLocale = getDefaultLocaleCode(surface, locale);
    if (!osi || !template || !defaultLocale) return null;
    const { productArrangementCode, marketSegment } = await resolveBaselineOffer(osi, {});
    if (!productArrangementCode) return null;
    const folder = { surface, locale: defaultLocale, template, productArrangementCode };
    const templatePath = `${buildBaselineFolderPath(folder)}/${BASELINE_NAME}`;
    const segmentPath = `${buildBaselineFolderPath({ ...folder, marketSegment })}/${BASELINE_NAME}`;
    const [offerBaseline, fragmentBaseline, fragmentSegmentBaseline] = await Promise.all([
        getOfferBaseline({ ...DEFAULT_CONTEXT, defaultLocale }, productArrangementCode),
        getFragmentByPathOrNull(fragmentsApi, templatePath),
        segmentPath === templatePath ? null : getFragmentByPathOrNull(fragmentsApi, segmentPath),
    ]);
    return {
        productArrangementCode,
        marketSegment,
        offerBaseline: offerBaseline ? toAuthorFragment(offerBaseline) : null,
        fragmentBaseline,
        fragmentSegmentBaseline,
    };
}

/**
 * Merges a card's baselines into one parent fragment, with the same layering as `applyBaselines` in the `customize`
 * transformer: offer < template < segment, field by field; empty values inherit, the explicit_empty sentinel clears; the
 * offer icon & its alt text are dropped when a higher baseline or the card has its own icon. Card identity & system
 * fields never come from a baseline. `null` when no baseline provides any field.
 * @returns {{ fragment: Fragment, sources: Record<string, 'offer' | 'template' | 'segment'> } | null}
 */
export function buildBaselineParent(baselines, card) {
    const hasOwnIcon = [baselines.fragmentBaseline, baselines.fragmentSegmentBaseline, card].some((layer) =>
        hasContent(layer?.fields.find(({ name }) => name === 'mnemonicIcon')?.values),
    );
    const fields = new Map();
    const sources = {};
    for (const [key, source] of BASELINE_LAYERS) {
        for (const field of baselines[key]?.fields ?? []) {
            if (CARD_OWN_FIELDS.has(field.name) || !hasContent(field.values)) continue;
            if (source === 'offer' && hasOwnIcon && OFFER_ICON_FIELDS.has(field.name)) continue;
            fields.set(field.name, field);
            sources[field.name] = source;
        }
    }
    if (!fields.size) return null;
    return { fragment: new Fragment({ fields: normalizeExplicitEmptyInFields([...fields.values()]), tags: [] }), sources };
}
