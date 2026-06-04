import {
    COMPARE_CHART_FIELD,
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    TAG_MERCH_CARD,
    TAG_COMPARE_CHART,
    TAG_MERCH_CARD_COLLECTION,
    TAG_STUDIO_CONTENT_TYPE,
    TAG_MODEL_ID_MAPPING,
} from '../constants.js';

export function hasNonEmptyCompareChart(item) {
    const values =
        item?.getFieldValues?.(COMPARE_CHART_FIELD) ||
        item?.getField?.(COMPARE_CHART_FIELD)?.values ||
        item?.fields?.find((field) => field.name === COMPARE_CHART_FIELD)?.values ||
        [];
    return values.some((value) => {
        if (typeof value === 'string') return value.trim() !== '';
        return value !== null && value !== undefined && value !== '';
    });
}

export function matchesContentTypeFilter(contentTypes, item) {
    if (!contentTypes.length) return true;
    const modelPath = item?.model?.path;
    if (modelPath === CARD_MODEL_PATH) return contentTypes.includes(TAG_MERCH_CARD);
    if (modelPath === COLLECTION_MODEL_PATH) {
        const isCompareChart = hasNonEmptyCompareChart(item);
        return isCompareChart ? contentTypes.includes(TAG_COMPARE_CHART) : contentTypes.includes(TAG_MERCH_CARD_COLLECTION);
    }
    return false;
}

export function resolveContentTypeFilters(tags) {
    const contentTypes = tags.filter((tag) => tag.startsWith(TAG_STUDIO_CONTENT_TYPE));
    const modelIds = [
        ...new Set(
            contentTypes
                .map((tag) =>
                    tag === TAG_COMPARE_CHART ? TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION] : TAG_MODEL_ID_MAPPING[tag],
                )
                .filter(Boolean),
        ),
    ];
    return { contentTypes, modelIds };
}
