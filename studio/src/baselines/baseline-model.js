import {
    AEM_TAG_PATH_PRODUCT_CODE_ROOT,
    BASELINE_NAME,
    BASELINES_FOLDER,
    COMPAT_VERSION,
    MAS_PRODUCT_CODE_PREFIX,
    ROOT_PATH,
    TAG_MERCH_CARD,
    TAG_MODEL_ID_MAPPING,
} from '../constants.js';
import Store from '../store.js';
import { getFragmentByPathOrNull } from '../common/utils/fragment-api.js';
import { loadOfferData } from '../common/utils/item-loading-browser.js';
import { loadProjectList, mergePendingProjects, trackPendingProject } from '../common/utils/project-list-utils.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { FragmentStore } from '../reactivity/fragment-store.js';

const DEFAULT_MARKET_SEGMENT = 'com';
const MARKET_SEGMENTS_TAG_ROOT = '/content/cq:tags/mas/market_segments';
const PRODUCT_ARRANGEMENT_CODE_TAG_ROOT = '/content/cq:tags/mas/product_arrangement_code';
const LOADED_PATH_META = 'loadedPath';

export const getBaselinesPath = ({ surface, locale }) => `${ROOT_PATH}/${surface}/${locale}/${BASELINES_FOLDER}`;

export const buildBaselineFolderPath = ({ surface, locale, template, productArrangementCode, marketSegment }) => {
    const folder = `${getBaselinesPath({ surface, locale })}/${template}/${productArrangementCode}`;
    const segment = marketSegment?.toLowerCase();
    return segment && segment !== DEFAULT_MARKET_SEGMENT ? `${folder}/${segment}` : folder;
};

/**
 * Reads the list columns of a baseline from its folder path (<template>/<PA code>[/<segment>]) and tags.
 * @param {Fragment} fragment
 * @returns {{ productCode: string, productArrangementCode: string, marketSegment: string, template: string }}
 */
export function getBaselineInfo(fragment) {
    const [template, productArrangementCode, segment] = fragment.path.split(`/${BASELINES_FOLDER}/`)[1].split('/').slice(0, -1);
    const productCodeTag = (fragment.tags ?? []).map(normalizeTagId).find((tagId) => tagId.startsWith(MAS_PRODUCT_CODE_PREFIX));
    return {
        productCode: productCodeTag?.slice(MAS_PRODUCT_CODE_PREFIX.length).toUpperCase() ?? '',
        productArrangementCode,
        marketSegment: (segment ?? DEFAULT_MARKET_SEGMENT).toUpperCase(),
        template: fragment.variant || template,
    };
}

/**
 * Loads the baselines of the surface and locale into `Store.baselines.list`, keeping created ones AEM has not indexed yet.
 * Rows of a previous surface or locale are cleared so the skeleton shows while the new folder loads.
 * @param {object} repository - mas-repository element
 * @param {{ surface: string, locale: string }} context
 * @param {AbortController} abortController
 * @returns {Promise<boolean>} true when the results were published
 */
export async function loadBaselines(repository, { surface, locale }, abortController) {
    const { data, loading } = Store.baselines.list;
    if (!surface) {
        data.removeMeta(LOADED_PATH_META);
        data.set([]);
        loading.set(false);
        return false;
    }
    const path = getBaselinesPath({ surface, locale });
    if (data.getMeta(LOADED_PATH_META) !== path) {
        data.setMeta(LOADED_PATH_META, path);
        data.set([]);
    }
    return loadProjectList(repository, {
        path,
        list: Store.baselines.list,
        abortController,
        errorMessage: 'Could not load baselines.',
        transform: (stores) =>
            mergePendingProjects(
                Store.baselines.list.data,
                stores.filter((store) => store.get().fragmentName === BASELINE_NAME),
                path,
            ),
    });
}

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
    const existing = await getFragmentByPathOrNull(fragmentsApi, `${folder}/${BASELINE_NAME}`);
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
        name: BASELINE_NAME,
        parentPath: folder,
        tags,
        data: { osi, cardTitle: title, variant: baseline.template, compatVersion: COMPAT_VERSION },
    });
    if (fragment?.id) {
        const store = new FragmentStore(fragment);
        trackPendingProject(Store.baselines.list.data, store);
        Store.baselines.list.data.set((list) => [store, ...list]);
    }
    return { folder, fragment };
}
