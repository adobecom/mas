import { BASELINES_FOLDER, COMPAT_VERSION, ROOT_PATH, TAG_MERCH_CARD, TAG_MODEL_ID_MAPPING } from '../constants.js';
import { getFragmentByPathOrNull } from '../common/utils/fragment-api.js';
import { loadOfferData } from '../common/utils/item-loading-browser.js';

const BASELINES_LOCALE = 'en_US';

export const buildBaselineFolderPath = ({ surface, template, productArrangementCode }) =>
    `${ROOT_PATH}/${surface}/${BASELINES_LOCALE}/${BASELINES_FOLDER}/${template}/${productArrangementCode}`;

export async function prepareBaselineFolder(fragmentsApi, baseline) {
    const folder = buildBaselineFolderPath(baseline);
    await fragmentsApi.ensureFolderExists(folder);
    const existing = await getFragmentByPathOrNull(fragmentsApi, `${folder}/${baseline.name}`);
    return { folder, exists: Boolean(existing) };
}

export async function resolveProductArrangementCode(offerSelectorId, offer, timeoutMs) {
    if (offer.productArrangementCode) return offer.productArrangementCode;
    const resolvedOffer = await loadOfferData({}, { fallbackWcsOsi: offerSelectorId, timeoutMs });
    return resolvedOffer?.productArrangementCode;
}

export async function createBaseline(repository, { title, osi, ...baseline }) {
    const { folder, exists } = await prepareBaselineFolder(repository.aem.sites.cf.fragments, baseline);
    if (exists) return { exists };
    const fragment = await repository.createFragment({
        modelId: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
        title,
        name: baseline.name,
        parentPath: folder,
        data: { osi, variant: baseline.template, compatVersion: COMPAT_VERSION },
    });
    return { folder, fragment };
}
