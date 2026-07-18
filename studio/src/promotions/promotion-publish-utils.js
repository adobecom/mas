import { OPERATIONS } from '../constants.js';
import { showToast } from '../utils.js';
import { getPublishedAttachedPromoVariations, getUnpublishedAttachedPromoVariations } from './promotions-repository.js';

export const PROMOTION_EXPIRED_PUBLISH_MESSAGE = 'This promotion has ended. Update the dates to publish again.';

export const PROMOTION_PUBLISH_SUCCESS_MESSAGE = 'Project successfully published.';

export const PROMOTION_PUBLISH_ERROR_MESSAGE = 'Failed to publish project.';

export const PROMOTION_UNPUBLISH_SUCCESS_MESSAGE = 'Project successfully unpublished.';

export const PROMOTION_UNPUBLISH_ERROR_MESSAGE = 'Failed to unpublish project.';

export const PROMOTION_SAVE_BEFORE_PUBLISH_MESSAGE = 'Save your changes before publishing.';

/**
 * @param {number} shortfall - Promo variations that were requested but not included in publish
 * @returns {string}
 */
export function promotionPublishShortfallMessage(shortfall) {
    return `Project published, but ${shortfall} promo variation(s) could not be included.`;
}

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
    return `${base} ${promoVariationCount} promo variation(s) will also be deleted.`;
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
    confirmText: 'Publish together',
    cancelText: 'Cancel',
    variant: 'confirmation',
};

export function unpublishedPromoVariationsPublishMessage(count) {
    return `This project has ${count} attached promo variation(s) that are not published. Publish them together with the project?`;
}

export const PUBLISHED_PROMO_VARIATIONS_DIALOG = {
    title: 'Published promo variations',
    confirmText: 'Unpublish together',
    cancelText: 'Cancel',
    variant: 'confirmation',
};

export function publishedPromoVariationsUnpublishMessage(count) {
    return `This project has ${count} attached promo variation(s) that are published. Unpublish them together with the project?`;
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {object} promotionFragment
 * @param {(title: string, message: string, options: object) => Promise<boolean>} showDialog
 * @param {{ getVariations: Function, dialogConfig: object, buildMessage: (count: number) => string }} config
 * @returns {Promise<{ confirmed: boolean, variationPaths: string[] }>}
 */
async function confirmActionAgainstPromoVariations(
    aem,
    promotionFragment,
    showDialog,
    { getVariations, dialogConfig, buildMessage },
) {
    const variations = await getVariations(aem, promotionFragment);
    if (!variations.length) {
        return { confirmed: true, variationPaths: [] };
    }
    const message = buildMessage(variations.length);
    const confirmed = await showDialog(dialogConfig.title, message, {
        confirmText: dialogConfig.confirmText,
        cancelText: dialogConfig.cancelText,
        variant: dialogConfig.variant,
    });
    return {
        confirmed: !!confirmed,
        variationPaths: confirmed ? variations.map((variation) => variation.path) : [],
    };
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {object} promotionFragment
 * @param {(title: string, message: string, options: object) => Promise<boolean>} showDialog
 * @returns {Promise<{ confirmed: boolean, variationPaths: string[] }>}
 */
export async function confirmPublishDespiteUnpublishedPromoVariations(aem, promotionFragment, showDialog) {
    return confirmActionAgainstPromoVariations(aem, promotionFragment, showDialog, {
        getVariations: getUnpublishedAttachedPromoVariations,
        dialogConfig: UNPUBLISHED_PROMO_VARIATIONS_DIALOG,
        buildMessage: unpublishedPromoVariationsPublishMessage,
    });
}

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {object} promotionFragment
 * @param {(title: string, message: string, options: object) => Promise<boolean>} showDialog
 * @returns {Promise<{ confirmed: boolean, variationPaths: string[] }>}
 */
export async function confirmUnpublishAlongsidePromoVariations(aem, promotionFragment, showDialog) {
    return confirmActionAgainstPromoVariations(aem, promotionFragment, showDialog, {
        getVariations: getPublishedAttachedPromoVariations,
        dialogConfig: PUBLISHED_PROMO_VARIATIONS_DIALOG,
        buildMessage: publishedPromoVariationsUnpublishMessage,
    });
}

/**
 * Publishes the promotion project and, when provided, unpublished promo variation paths in one AEM request.
 * @param {object} repository
 * @param {object} promotionFragment
 * @param {string[]} promoVariationPaths
 * @returns {Promise<boolean>}
 */
export async function publishPromotionProject(repository, promotionFragment, promoVariationPaths = []) {
    const publishReferencesWithStatus = [];
    try {
        repository.operation.set(OPERATIONS.PUBLISH);
        if (!promoVariationPaths.length) {
            await repository.aem.sites.cf.fragments.publish(promotionFragment, publishReferencesWithStatus);
        } else {
            const promotionWithEtag = await repository.aem.sites.cf.fragments.getWithEtag(promotionFragment.id);
            if (!promotionWithEtag) {
                throw new Error('Failed to fetch promotion for publish');
            }
            const fragments = [promotionWithEtag];
            for (const path of promoVariationPaths) {
                const variation = await repository.aem.sites.cf.fragments.getByPath(path).catch(() => null);
                if (!variation?.id) continue;
                const variationWithEtag = await repository.aem.sites.cf.fragments.getWithEtag(variation.id);
                if (variationWithEtag) fragments.push(variationWithEtag);
            }
            await repository.aem.sites.cf.fragments.publishFragments(fragments, publishReferencesWithStatus);
            const expectedFragmentCount = promoVariationPaths.length + 1;
            const shortfall = expectedFragmentCount - fragments.length;
            if (shortfall > 0) {
                showToast(promotionPublishShortfallMessage(shortfall), 'info');
            } else {
                showToast(PROMOTION_PUBLISH_SUCCESS_MESSAGE, 'positive');
            }
            return true;
        }
        showToast(PROMOTION_PUBLISH_SUCCESS_MESSAGE, 'positive');
        return true;
    } catch (error) {
        repository.processError(error, PROMOTION_PUBLISH_ERROR_MESSAGE);
        return false;
    } finally {
        repository.operation.set(null);
    }
}

/**
 * Unpublishes the promotion project along with the promo variation paths.
 * Only the promotion project and the promo variations are unpublished.
 * @param {object} repository
 * @param {object} promotionFragment
 * @param {string[]} promoVariationPaths
 * @returns {Promise<boolean>}
 */
export async function unpublishPromotionProject(repository, promotionFragment, promoVariationPaths = []) {
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
            const variationWithEtag = await repository.aem.sites.cf.fragments.getWithEtag(variation.id);
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
            showToast(promotionUnpublishShortfallMessage(shortfall), 'info');
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
