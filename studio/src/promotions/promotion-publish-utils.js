import { BULK_PUBLISH_STATUS, OPERATIONS } from '../constants.js';
import { extractSurfaceFromPath, showToast } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { buildProjectPayload, buildItemsMetadata, itemTypeFromFragment } from '../bulk-publish/bulk-publish-utils.js';
import { startPublishing } from '../bulk-publish/bulk-publish-store.js';
import { processConcurrently, VARIATIONS_CONCURRENCY_LIMIT } from '../common/utils/item-loading.js';
import { getPublishedAttachedPromoVariations, getUnpublishedAttachedPromoVariations } from './promotions-repository.js';

export async function getPromotionPublishPlan(aem, promotion) {
    const variations = await getUnpublishedAttachedPromoVariations(aem, promotion);
    const groups = new Map();
    const paths = new Set();
    const warnings = [];
    for (const variation of variations) {
        const surface = extractSurfaceFromPath(variation.path);
        if (!variation.id || !surface) throw new Error(`Could not resolve promo variation: ${variation.path ?? variation.id}`);
        if (paths.has(variation.path)) continue;
        paths.add(variation.path);
        if (!groups.has(surface)) groups.set(surface, []);
        groups.get(surface).push(variation);
        for (const issue of variation.validationStatus ?? []) {
            warnings.push({ path: variation.path, message: issue.message });
        }
    }
    return {
        promotionId: promotion.id,
        targetCount: paths.size,
        warnings,
        groups: [...groups].map(([surface, items]) => ({ surface, variations: items })),
    };
}

export const PROMOTION_EXPIRED_PUBLISH_MESSAGE = 'This promotion has ended. Update the dates to publish again.';

export const PROMOTION_UNPUBLISH_SUCCESS_MESSAGE = 'Project successfully unpublished.';

export const PROMOTION_UNPUBLISH_ERROR_MESSAGE = 'Failed to unpublish project.';

export const PROMOTION_SAVE_BEFORE_PUBLISH_MESSAGE = 'Save your changes before publishing.';

/**
 * @param {number} shortfall
 * @returns {string}
 */
export function promotionUnpublishShortfallMessage(shortfall) {
    return `Project unpublished, but ${shortfall} promo variation(s) could not be included.`;
}

/**
 * @param {string} title
 * @param {number} promoVariationCount
 * @returns {string}
 */
export function promotionDeleteConfirmMessage(title, promoVariationCount) {
    const base = `Are you sure you want to delete the promotion project "${title}"? This action cannot be undone.`;
    if (!promoVariationCount) return base;
    return `${base} ${promoVariationCount} promo variation(s) will remain saved but will no longer be associated with this project.`;
}

export function isPromotionExpiredForPublish(promotionFragment) {
    return promotionFragment?.promotionStatus === 'expired';
}

/**
 * @param {object} promotionFragment
 * @returns {Date|null}
 */
function getPromotionStartDate(promotionFragment) {
    const raw = promotionFragment?.getFieldValue?.('startDate');
    if (!raw) return null;
    const startDate = new Date(raw);
    return Number.isNaN(startDate.getTime()) ? null : startDate;
}

/**
 * @param {object} promotionFragment
 * @param {Date} [now]
 * @returns {boolean}
 */
function isPromotionStartDateInFuture(promotionFragment, now = new Date()) {
    const startDate = getPromotionStartDate(promotionFragment);
    if (!startDate) return false;
    return startDate > now;
}

/**
 * @param {object} promotionFragment
 * @param {{ hasUnsavedChanges?: boolean, promotionPublish?: boolean }} options
 * @returns {boolean}
 */
function isPromotionPublishActionAllowed(promotionFragment, { hasUnsavedChanges = false, promotionPublish = false } = {}) {
    if (!promotionFragment?.id) return false;
    if (hasUnsavedChanges) return false;
    if (promotionPublish) return false;
    if (!getPromotionStartDate(promotionFragment)) return false;
    if (isPromotionExpiredForPublish(promotionFragment)) return false;
    if (promotionFragment.isPromotionPublished && !promotionFragment.isPromotionModified) return false;
    return true;
}

/**
 * @param {object} promotionFragment
 * @param {{ hasUnsavedChanges?: boolean, promotionPublish?: boolean, now?: Date }} options
 * @returns {boolean}
 */
export function canSchedulePromotion(promotionFragment, options = {}) {
    const { now = new Date(), ...rest } = options;
    if (!isPromotionPublishActionAllowed(promotionFragment, rest)) return false;
    return isPromotionStartDateInFuture(promotionFragment, now);
}

/**
 * @param {object} promotionFragment
 * @param {{ hasUnsavedChanges?: boolean, promotionPublish?: boolean, now?: Date }} options
 * @returns {boolean}
 */
export function canPublishPromotionNow(promotionFragment, options = {}) {
    const { now = new Date(), ...rest } = options;
    if (!isPromotionPublishActionAllowed(promotionFragment, rest)) return false;
    return !isPromotionStartDateInFuture(promotionFragment, now);
}

export const UNPUBLISHED_PROMO_VARIATIONS_DIALOG = {
    title: 'Unpublished promo variations',
    confirmText: 'Publish',
    cancelText: 'Cancel',
    variant: 'confirmation',
    question: 'Publish them together with the project?',
    checkboxLabel: 'Publish promo variations',
    checkboxDefault: true,
};

export function unpublishedPromoVariationsPublishMessage(count) {
    return `This project has ${count} attached promo variation(s) that are not published.`;
}

export const PUBLISHED_PROMO_VARIATIONS_DIALOG = {
    title: 'Published promo variations',
    confirmText: 'Unpublish',
    cancelText: 'Cancel',
    variant: 'confirmation',
    question: 'Unpublish them together with the project?',
    checkboxLabel: 'Unpublish promo variations',
    checkboxDefault: true,
};

export function publishedPromoVariationsUnpublishMessage(count) {
    return `This project has ${count} attached promo variation(s) that are published.`;
}

/**
 * @param {number} count
 * @returns {string}
 */
export function publishedPromoVariationsSkippedMessage(count) {
    return `Project unpublished, but ${count} attached promo variation(s) remain published.`;
}

/**
 * `dialogConfig.checkboxLabel` is always set for the two callers below, so `showDialog`
 * (backed by `showConfirmDialog`) always resolves `{ confirmed, checked }`, never a bare boolean.
 * When the user confirms without checking the box, the variations are intentionally left as-is.
 * `skippedCount` is returned instead of toasting here so the caller can fold it into a single
 * toast once the publish/unpublish call itself has settled, rather than stacking two toasts.
 * @param {import('../aem/aem.js').AEM} aem
 * @param {object} promotionFragment
 * @param {(title: string, message: string, options: object) => Promise<{ confirmed: boolean, checked: boolean }>} showDialog
 * @param {{ getVariations: Function, dialogConfig: object, buildMessage: (count: number) => string }} config
 * @returns {Promise<{ confirmed: boolean, variationPaths: string[], skippedCount: number }>}
 */
async function confirmActionAgainstPromoVariations(
    aem,
    promotionFragment,
    showDialog,
    { getVariations, dialogConfig, buildMessage },
) {
    const variations = await getVariations(aem, promotionFragment);
    if (!variations.length) {
        return { confirmed: true, variationPaths: [], skippedCount: 0 };
    }
    const message = buildMessage(variations.length);
    const { confirmed, checked } = await showDialog(dialogConfig.title, message, {
        confirmText: dialogConfig.confirmText,
        cancelText: dialogConfig.cancelText,
        variant: dialogConfig.variant,
        question: dialogConfig.question,
        checkboxLabel: dialogConfig.checkboxLabel,
        checkboxDefault: dialogConfig.checkboxDefault,
    });
    if (!confirmed) {
        return { confirmed: false, variationPaths: [], skippedCount: 0 };
    }
    if (!checked) {
        return { confirmed: true, variationPaths: [], skippedCount: variations.length };
    }
    return { confirmed: true, variationPaths: variations.map((variation) => variation.path), skippedCount: 0 };
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {object} promotionFragment
 * @param {(title: string, message: string, options: object) => Promise<{ confirmed: boolean, checked: boolean }>} showDialog
 * @returns {Promise<{ confirmed: boolean, variationPaths: string[], skippedCount: number }>}
 */
export async function confirmPublishDespiteUnpublishedPromoVariations(aem, promotionFragment, showDialog) {
    const plan = await getPromotionPublishPlan(aem, promotionFragment);
    if (!plan.targetCount) return { confirmed: true, variationPaths: [], skippedCount: 0 };
    const { confirmed, checked } = await showDialog(
        UNPUBLISHED_PROMO_VARIATIONS_DIALOG.title,
        unpublishedPromoVariationsPublishMessage(plan.targetCount),
        { ...UNPUBLISHED_PROMO_VARIATIONS_DIALOG, plan },
    );
    if (!confirmed) return { confirmed: false, variationPaths: [], skippedCount: 0 };
    return {
        confirmed: true,
        variationPaths: checked ? plan.groups.flatMap((group) => group.variations.map((variation) => variation.path)) : [],
        skippedCount: checked ? 0 : plan.targetCount,
    };
}

async function createPromotionBulkProject(repository, group, title) {
    const parentPath = repository.getBulkPublishParentPath(group.surface);
    const payload = buildProjectPayload({
        parentPath,
        title,
        status: BULK_PUBLISH_STATUS.DRAFT,
        urls: '',
        fragments: group.variations.map((variation) => variation.path),
        locales: [],
        items: buildItemsMetadata(
            group.variations.map((variation) => ({
                path: variation.path,
                type: itemTypeFromFragment(variation),
                status: 'valid',
            })),
        ),
    });
    const raw = await repository.aem.sites.cf.fragments.create(payload);
    if (!raw?.id || !raw.path?.startsWith(`${parentPath}/`)) {
        throw new Error('Could not confirm the created Bulk Publish project. Check the project list before trying again.');
    }
    return {
        store: new FragmentStore(new Fragment(raw)),
        entry: {
            id: raw.id,
            path: raw.path,
            title,
            surface: group.surface,
            dispatchStatus: 'not-started',
            activationId: null,
            error: null,
        },
    };
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {object} promotionFragment
 * @param {(title: string, message: string, options: object) => Promise<{ confirmed: boolean, checked: boolean }>} showDialog
 * @returns {Promise<{ confirmed: boolean, variationPaths: string[], skippedCount: number }>}
 */
export async function confirmUnpublishAlongsidePromoVariations(aem, promotionFragment, showDialog) {
    return confirmActionAgainstPromoVariations(aem, promotionFragment, showDialog, {
        getVariations: getPublishedAttachedPromoVariations,
        dialogConfig: PUBLISHED_PROMO_VARIATIONS_DIALOG,
        buildMessage: publishedPromoVariationsUnpublishMessage,
    });
}

export async function publishPromotionProject(repository, promotionFragment, { plan, publishVariations = true } = {}) {
    const result = {
        promotionId: promotionFragment.id,
        promotion: { status: 'not-started', error: null },
        projects: [],
        warnings: plan?.warnings ?? [],
        error: null,
    };
    let stage = 'prepare publishing';
    try {
        repository.operation.set(OPERATIONS.PUBLISH);
        const publishPlan = plan ?? (await getPromotionPublishPlan(repository.aem, promotionFragment));
        const groups = publishVariations ? publishPlan.groups : [];
        const ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
        const token = sessionStorage.getItem('masAccessToken') ?? window.adobeIMS?.getAccessToken()?.token;
        if (groups.length && !ioBaseUrl) throw new Error('ioBaseUrl is required');
        if (groups.length && !token) throw new Error('A sign-in token is required');
        const current = await repository.aem.sites.cf.fragments.getWithEtag(promotionFragment.id);
        if (!current?.etag) throw new Error('Failed to fetch promotion revision for publish');
        if (promotionFragment.etag && current.etag !== promotionFragment.etag) {
            throw new Error('The promotion has changed. Refresh it before publishing.');
        }
        const prepared = [];
        const title = `${promotionFragment.title}-${new Date().toISOString()}`;
        for (const group of groups) {
            stage = `create Bulk Publish project for ${group.surface}`;
            const project = await createPromotionBulkProject(repository, group, title);
            prepared.push(project);
            result.projects.push(project.entry);
        }
        stage = 'publish promotion';
        const promotion = new Fragment(current);
        await processConcurrently(
            [promotion, ...groups.flatMap((group) => group.variations)],
            async (fragment) => {
                const latest =
                    fragment === promotion
                        ? fragment
                        : new Fragment(await repository.aem.sites.cf.fragments.getWithEtag(fragment.id));
                if (!latest.etag) throw new Error(`Failed to fetch the latest revision for ${fragment.path}`);
                await repository.clearStagedTag(latest, { expectedEtag: latest.etag });
            },
            VARIATIONS_CONCURRENCY_LIMIT,
        );
        result.promotion.status = 'unknown';
        const response = await repository.aem.sites.cf.fragments.publish(promotion, []);
        const item = response?.items?.find((entry) => entry.path === promotion.path);
        if (item?.status !== 'SUCCESS_TRIGGERED') {
            result.promotion.status = item?.status?.startsWith('ERROR_') ? 'failed' : 'unknown';
            throw new Error(`Promotion publish was not confirmed (${item?.status ?? 'missing response item'}).`);
        }
        result.promotion.status = 'accepted';
        for (const { store, entry } of prepared) {
            try {
                const acceptance = await startPublishing({
                    project: store,
                    repository,
                    ioBaseUrl,
                    token,
                    aemOdinEndpoint: repository.aem.baseUrl?.startsWith('http://localhost')
                        ? undefined
                        : repository.aem.baseUrl,
                    waitForCompletion: false,
                    includeCards: false,
                    includeVariations: false,
                    publishReferences: false,
                });
                if (!acceptance.accepted) throw new Error('A request is already in progress. Check the Bulk Publish project.');
                entry.dispatchStatus = 'accepted';
                entry.activationId = acceptance.activationId;
            } catch (error) {
                console.error(`Failed to start Bulk Publish for ${entry.surface}`, error);
                entry.dispatchStatus = [400, 401, 403, 404, 422].includes(error.status) ? 'failed' : 'unknown';
                entry.error = error.message;
                result.error = 'Some Bulk Publish requests could not be confirmed. Check the project links.';
            }
        }
    } catch (error) {
        console.error(`Failed to ${stage}`, error);
        result.error = `Could not ${stage}: ${error.message}`;
        if (stage === 'publish promotion') result.promotion.error = result.error;
    } finally {
        repository.operation.set(null);
    }
    return result;
}

/**
 * Unpublishes the promotion project along with the promo variation paths.
 * Only the promotion project and the promo variations are unpublished.
 * @param {object} repository
 * @param {object} promotionFragment
 * @param {string[]} promoVariationPaths
 * @param {number} [skippedVariationCount] - Variations the user chose not to unpublish alongside the project
 * @returns {Promise<boolean>}
 */
export async function unpublishPromotionProject(
    repository,
    promotionFragment,
    promoVariationPaths = [],
    skippedVariationCount = 0,
) {
    try {
        repository.operation.set(OPERATIONS.UNPUBLISH);
        const promotionWithEtag = await repository.aem.sites.cf.fragments.getWithEtag(promotionFragment.id);
        if (!promotionWithEtag) {
            throw new Error('Failed to fetch promotion for unpublish');
        }
        await repository.aem.sites.cf.fragments.unpublish(promotionWithEtag);

        let shortfall = 0;
        for (const path of promoVariationPaths) {
            const variation = await repository.aem.sites.cf.fragments.getByPath(path).catch(() => null);
            if (!variation?.id) {
                shortfall += 1;
                continue;
            }
            const variationWithEtag = await repository.aem.sites.cf.fragments.getWithEtag(variation.id).catch(() => null);
            if (!variationWithEtag) {
                shortfall += 1;
                continue;
            }
            try {
                await repository.aem.sites.cf.fragments.unpublish(variationWithEtag);
            } catch {
                shortfall += 1;
            }
        }

        if (shortfall > 0) {
            showToast(promotionUnpublishShortfallMessage(shortfall), 'warning');
        } else if (skippedVariationCount > 0) {
            showToast(publishedPromoVariationsSkippedMessage(skippedVariationCount), 'warning');
        } else {
            showToast(PROMOTION_UNPUBLISH_SUCCESS_MESSAGE, 'positive');
        }
        return true;
    } catch (error) {
        repository.processError(error, PROMOTION_UNPUBLISH_ERROR_MESSAGE);
        return false;
    } finally {
        repository.operation.set(null);
    }
}
