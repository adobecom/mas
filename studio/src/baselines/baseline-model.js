import {
    AEM_TAG_PATH_PRODUCT_CODE_ROOT,
    BASELINES_FOLDER,
    COMPAT_VERSION,
    ROOT_PATH,
    TAG_MERCH_CARD,
    TAG_MODEL_ID_MAPPING,
} from '../constants.js';
import { getFragmentByPathOrNull } from '../common/utils/fragment-api.js';
import { loadOfferData } from '../common/utils/item-loading-browser.js';

const BASELINE_FRAGMENT_NAME = 'baseline';
const DEFAULT_MARKET_SEGMENT = 'com';
const MARKET_SEGMENTS_TAG_ROOT = '/content/cq:tags/mas/market_segments';
const PRODUCT_ARRANGEMENT_CODE_TAG_ROOT = '/content/cq:tags/mas/product_arrangement_code';

export const buildBaselineFolderPath = ({ surface, locale, template, productArrangementCode, marketSegment }) => {
    const folder = `${ROOT_PATH}/${surface}/${locale}/${BASELINES_FOLDER}/${template}/${productArrangementCode}`;
    const segment = marketSegment?.toLowerCase();
    return segment && segment !== DEFAULT_MARKET_SEGMENT ? `${folder}/${segment}` : folder;
};

export const buildBaselineTags = ({ productCode, marketSegment, productArrangementCode }) =>
    [
        [AEM_TAG_PATH_PRODUCT_CODE_ROOT, productCode],
        [MARKET_SEGMENTS_TAG_ROOT, marketSegment || DEFAULT_MARKET_SEGMENT],
        [PRODUCT_ARRANGEMENT_CODE_TAG_ROOT, productArrangementCode],
    ]
        .filter(([, value]) => value)
        .map(([root, value]) => `${root}/${value.toLowerCase()}`);

export async function filterExistingTags(tagsApi, tags) {
    const existing = await Promise.all(tags.map((tag) => tagsApi.exists(tag)));
    return tags.filter((tag, index) => existing[index]);
}

export async function prepareBaselineFolder(fragmentsApi, baseline) {
    const folder = buildBaselineFolderPath(baseline);
    await fragmentsApi.ensureFolderExists(folder);
    const existing = await getFragmentByPathOrNull(fragmentsApi, `${folder}/${BASELINE_FRAGMENT_NAME}`);
    return { folder, exists: Boolean(existing) };
}

export async function resolveBaselineOffer(offerSelectorId, offer, timeoutMs) {
    if (offer.productArrangementCode) {
        return {
            productArrangementCode: offer.productArrangementCode,
            marketSegment: offer.market_segments?.[0],
            productCode: offer.product_code,
        };
    }
    const resolvedOffer = await loadOfferData({}, { fallbackWcsOsi: offerSelectorId, timeoutMs });
    return {
        productArrangementCode: resolvedOffer?.productArrangementCode,
        marketSegment: resolvedOffer?.marketSegments?.[0],
        productCode: resolvedOffer?.productArrangement?.productCode,
    };
}

export async function createBaseline(repository, { title, osi, ...baseline }) {
    const { folder, exists } = await prepareBaselineFolder(repository.aem.sites.cf.fragments, baseline);
    if (exists) return { exists };
    const tags = await filterExistingTags(repository.aem.tags, buildBaselineTags(baseline));
    const fragment = await repository.createFragment({
        modelId: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
        title,
        name: BASELINE_FRAGMENT_NAME,
        parentPath: folder,
        tags,
        data: { osi, cardTitle: title, variant: baseline.template, compatVersion: COMPAT_VERSION },
    });
    return { folder, fragment };
}
