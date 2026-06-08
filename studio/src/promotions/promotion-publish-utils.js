import { OPERATIONS } from '../constants.js';
import { showToast } from '../utils.js';
import { getUnpublishedAttachedPromoVariations } from './promotions-repository.js';

export const PROMOTION_EXPIRED_PUBLISH_MESSAGE = 'This promotion has ended. Update the dates to publish again.';

export const PROMOTION_PUBLISH_SUCCESS_MESSAGE = 'Project successfully published.';

export const PROMOTION_PUBLISH_ERROR_MESSAGE = 'Failed to publish project.';

/**
 * @param {number} shortfall - Promo variations that were requested but not included in publish
 * @returns {string}
 */
export function promotionPublishShortfallMessage(shortfall) {
    return `Project published, but ${shortfall} promo variation(s) could not be included.`;
}

export function isPromotionExpiredForPublish(promotionFragment) {
    return promotionFragment?.promotionStatus === 'expired';
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

/**
 * @param {import('../aem/aem.js').AEM} aem
 * @param {object} promotionFragment
 * @param {(title: string, message: string, options: object) => Promise<boolean>} showDialog
 * @returns {Promise<{ confirmed: boolean, variationPaths: string[] }>}
 */
export async function confirmPublishDespiteUnpublishedPromoVariations(aem, promotionFragment, showDialog) {
    const unpublished = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
    if (!unpublished.length) {
        return { confirmed: true, variationPaths: [] };
    }
    const message = unpublishedPromoVariationsPublishMessage(unpublished.length);
    const confirmed = await showDialog(UNPUBLISHED_PROMO_VARIATIONS_DIALOG.title, message, {
        confirmText: UNPUBLISHED_PROMO_VARIATIONS_DIALOG.confirmText,
        cancelText: UNPUBLISHED_PROMO_VARIATIONS_DIALOG.cancelText,
        variant: UNPUBLISHED_PROMO_VARIATIONS_DIALOG.variant,
    });
    return {
        confirmed: !!confirmed,
        variationPaths: confirmed ? unpublished.map((variation) => variation.path) : [],
    };
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
