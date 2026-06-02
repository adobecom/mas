export const PROMOTION_EXPIRED_PUBLISH_MESSAGE = 'This promotion has ended. Update the dates to publish again.';

export function isPromotionExpiredForPublish(promotionFragment) {
    return promotionFragment?.promotionStatus === 'expired';
}

export const UNPUBLISHED_PROMO_VARIATIONS_DIALOG = {
    title: 'Unpublished promo variations',
    confirmText: 'Publish anyway',
    cancelText: 'Cancel',
    variant: 'confirmation',
};

/**
 * @param {object} repository
 * @param {object} promotionFragment
 * @param {(title: string, message: string, options: object) => Promise<boolean>} showDialog
 * @returns {Promise<boolean>}
 */
export async function confirmPublishDespiteUnpublishedPromoVariations(repository, promotionFragment, showDialog) {
    const unpublished = await repository.getUnpublishedAttachedPromoVariations(promotionFragment);
    if (!unpublished.length) return true;
    const message = `This project has ${unpublished.length} attached promo variation(s) that are not published. Publish the project anyway?`;
    return showDialog(UNPUBLISHED_PROMO_VARIATIONS_DIALOG.title, message, {
        confirmText: UNPUBLISHED_PROMO_VARIATIONS_DIALOG.confirmText,
        cancelText: UNPUBLISHED_PROMO_VARIATIONS_DIALOG.cancelText,
        variant: UNPUBLISHED_PROMO_VARIATIONS_DIALOG.variant,
    });
}
