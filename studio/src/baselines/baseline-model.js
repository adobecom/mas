import { BASELINES_FOLDER, COMPAT_VERSION, ROOT_PATH, TAG_MERCH_CARD, TAG_MODEL_ID_MAPPING } from '../constants.js';
import { getFragmentByPathOrNull } from '../common/utils/fragment-api.js';
import { loadOfferData } from '../common/utils/item-loading-browser.js';

const DEFAULT_MARKET_SEGMENT = 'com';

export const buildBaselineFolderPath = ({ surface, locale, template, productArrangementCode, marketSegment }) => {
    const folder = `${ROOT_PATH}/${surface}/${locale}/${BASELINES_FOLDER}/${template}/${productArrangementCode}`;
    const segment = marketSegment?.toLowerCase();
    return segment && segment !== DEFAULT_MARKET_SEGMENT ? `${folder}/${segment}` : folder;
};

export async function prepareBaselineFolder(fragmentsApi, baseline) {
    const folder = buildBaselineFolderPath(baseline);
    await fragmentsApi.ensureFolderExists(folder);
    const existing = await getFragmentByPathOrNull(fragmentsApi, `${folder}/${baseline.name}`);
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
        name: 'baseline',
        parentPath: folder,
        data: { osi, cardTitle: title, variant: baseline.template, compatVersion: COMPAT_VERSION },
    });
    return { folder, fragment };
}
