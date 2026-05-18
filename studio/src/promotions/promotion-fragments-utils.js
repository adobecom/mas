import { VARIANTS } from '../editors/variant-picker.js';
import Store from '../store.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING } from '../editor-panel.js';

/**
 * @param {{ tags?: Array<{ id?: string, title?: string }> }|null|undefined} item
 * @returns {string}
 */
export function promotionProductOfferTitle(item) {
    return item?.tags?.find(({ id }) => id?.startsWith('mas:product_code/'))?.title ?? '';
}

export function promotionVariantDisplayLabel(raw) {
    if (!raw) return '';
    if (raw === 'Other') return 'Other';
    const entry = VARIANTS.find((v) => v.value === raw);
    if (entry) return entry.label;
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * @param {import('../aem/fragment.js').Fragment|object|null|undefined} data
 * @returns {string}
 */
export function getPromotionFragmentName(data) {
    if (data == null) return '';
    const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path] ?? 'Fragment';
    const { fragmentParts } = getFragmentPartsToUse(Store, data);
    return `${webComponentName}: ${fragmentParts}`;
}

export { renderFragmentStatusCell as renderPromotionFragmentStatusCell } from '../common/utils/render-utils.js';
