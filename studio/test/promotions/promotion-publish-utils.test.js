import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    UNPUBLISHED_PROMO_VARIATIONS_DIALOG,
    confirmPublishDespiteUnpublishedPromoVariations,
    isPromotionExpiredForPublish,
    PROMOTION_EXPIRED_PUBLISH_MESSAGE,
} from '../../src/promotions/promotion-publish-utils.js';

const unpublishedPromoVariationsMessage = (count) =>
    `This project has ${count} attached promo variation(s) that are not published. Publish the project anyway?`;

describe('promotion-publish-utils', () => {
    it('isPromotionExpiredForPublish returns true only when promotionStatus is expired', () => {
        expect(isPromotionExpiredForPublish({ promotionStatus: 'expired' })).to.be.true;
        expect(isPromotionExpiredForPublish({ promotionStatus: 'active' })).to.be.false;
        expect(isPromotionExpiredForPublish(null)).to.be.false;
    });

    it('exposes the expired publish toast message', () => {
        expect(PROMOTION_EXPIRED_PUBLISH_MESSAGE).to.equal('This promotion has ended. Update the dates to publish again.');
    });

    it('returns true without dialog when there are no unpublished variations', async () => {
        const repo = { getUnpublishedAttachedPromoVariations: sinon.stub().resolves([]) };
        const showDialog = sinon.stub().resolves(true);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(repo, { id: 'p1' }, showDialog);
        expect(result).to.be.true;
        expect(repo.getUnpublishedAttachedPromoVariations.calledOnceWith({ id: 'p1' })).to.be.true;
        expect(showDialog.called).to.be.false;
    });

    it('shows dialog and returns false when user cancels', async () => {
        const repo = {
            getUnpublishedAttachedPromoVariations: sinon.stub().resolves([{ path: '/v1', status: 'DRAFT' }]),
        };
        const showDialog = sinon.stub().resolves(false);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(repo, { id: 'p1' }, showDialog);
        expect(result).to.be.false;
        expect(showDialog.calledOnce).to.be.true;
        const [title, message, options] = showDialog.firstCall.args;
        expect(title).to.equal(UNPUBLISHED_PROMO_VARIATIONS_DIALOG.title);
        expect(message).to.equal(unpublishedPromoVariationsMessage(1));
        expect(options.confirmText).to.equal('Publish anyway');
        expect(options.cancelText).to.equal('Cancel');
        expect(options.variant).to.equal('confirmation');
    });

    it('returns true when user confirms', async () => {
        const repo = {
            getUnpublishedAttachedPromoVariations: sinon.stub().resolves([{}, {}]),
        };
        const showDialog = sinon.stub().resolves(true);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(repo, { id: 'p1' }, showDialog);
        expect(result).to.be.true;
        expect(showDialog.firstCall.args[1]).to.equal(unpublishedPromoVariationsMessage(2));
    });
});
