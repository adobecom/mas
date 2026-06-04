import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { OPERATIONS } from '../../src/constants.js';
import {
    UNPUBLISHED_PROMO_VARIATIONS_DIALOG,
    confirmPublishDespiteUnpublishedPromoVariations,
    isPromotionExpiredForPublish,
    publishPromotionProject,
    PROMOTION_EXPIRED_PUBLISH_MESSAGE,
    PROMOTION_PUBLISH_ERROR_MESSAGE,
    PROMOTION_PUBLISH_SUCCESS_MESSAGE,
    promotionPublishShortfallMessage,
    unpublishedPromoVariationsPublishMessage,
} from '../../src/promotions/promotion-publish-utils.js';

describe('promotion-publish-utils', () => {
    it('isPromotionExpiredForPublish returns true only when promotionStatus is expired', () => {
        expect(isPromotionExpiredForPublish({ promotionStatus: 'expired' })).to.be.true;
        expect(isPromotionExpiredForPublish({ promotionStatus: 'active' })).to.be.false;
        expect(isPromotionExpiredForPublish(null)).to.be.false;
    });

    it('exposes the expired publish toast message', () => {
        expect(PROMOTION_EXPIRED_PUBLISH_MESSAGE).to.equal('This promotion has ended. Update the dates to publish again.');
    });

    it('exposes promotion publish success and error messages', () => {
        expect(PROMOTION_PUBLISH_SUCCESS_MESSAGE).to.equal('Project successfully published.');
        expect(PROMOTION_PUBLISH_ERROR_MESSAGE).to.equal('Failed to publish project.');
    });

    it('exposes shortfall message when some promo variations are omitted from publish', () => {
        expect(promotionPublishShortfallMessage(2)).to.equal(
            'Project published, but 2 promo variation(s) could not be included.',
        );
    });

    it('returns confirmed without dialog when there are no unpublished variations', async () => {
        const repo = { getUnpublishedAttachedPromoVariations: sinon.stub().resolves([]) };
        const showDialog = sinon.stub().resolves(true);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(repo, { id: 'p1' }, showDialog);
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [] });
        expect(repo.getUnpublishedAttachedPromoVariations.calledOnceWith({ id: 'p1' })).to.be.true;
        expect(showDialog.called).to.be.false;
    });

    it('shows dialog and returns not confirmed when user cancels', async () => {
        const repo = {
            getUnpublishedAttachedPromoVariations: sinon.stub().resolves([{ path: '/v1', status: 'DRAFT' }]),
        };
        const showDialog = sinon.stub().resolves(false);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(repo, { id: 'p1' }, showDialog);
        expect(result).to.deep.equal({ confirmed: false, variationPaths: [] });
        expect(showDialog.calledOnce).to.be.true;
        const [title, message, options] = showDialog.firstCall.args;
        expect(title).to.equal(UNPUBLISHED_PROMO_VARIATIONS_DIALOG.title);
        expect(message).to.equal(unpublishedPromoVariationsPublishMessage(1));
        expect(options.confirmText).to.equal('Publish together');
        expect(options.cancelText).to.equal('Cancel');
        expect(options.variant).to.equal('confirmation');
    });

    it('returns variation paths when user confirms publish together', async () => {
        const repo = {
            getUnpublishedAttachedPromoVariations: sinon.stub().resolves([
                { path: '/v1', status: 'DRAFT' },
                { path: '/v2', status: 'DRAFT' },
            ]),
        };
        const showDialog = sinon.stub().resolves(true);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(repo, { id: 'p1' }, showDialog);
        expect(result).to.deep.equal({ confirmed: true, variationPaths: ['/v1', '/v2'] });
        expect(showDialog.firstCall.args[1]).to.equal(unpublishedPromoVariationsPublishMessage(2));
    });

    describe('publishPromotionProject', () => {
        it('publishes only the promotion when there are no variation paths', async () => {
            const publish = sinon.stub().resolves();
            const repo = {
                operation: { set: sinon.stub() },
                aem: { sites: { cf: { fragments: { publish } } } },
                processError: sinon.stub(),
            };
            const promotion = { id: 'promo-1', path: '/content/dam/mas/promotions/project' };

            const ok = await publishPromotionProject(repo, promotion, []);

            expect(ok).to.be.true;
            expect(publish.calledOnceWith(promotion, [])).to.be.true;
            expect(repo.operation.set.firstCall.args[0]).to.equal(OPERATIONS.PUBLISH);
            expect(repo.operation.set.lastCall.args[0]).to.equal(null);
        });

        it('calls processError with project message when publish fails', async () => {
            const publishError = new Error('publish failed');
            const publish = sinon.stub().rejects(publishError);
            const processError = sinon.stub();
            const repo = {
                operation: { set: sinon.stub() },
                aem: { sites: { cf: { fragments: { publish } } } },
                processError,
            };
            const promotion = { id: 'promo-1', path: '/content/dam/mas/promotions/project' };

            const ok = await publishPromotionProject(repo, promotion, []);

            expect(ok).to.be.false;
            expect(processError.calledOnceWith(publishError, PROMOTION_PUBLISH_ERROR_MESSAGE)).to.be.true;
            expect(repo.operation.set.lastCall.args[0]).to.equal(null);
        });

        it('publishes promotion and variations together in one request', async () => {
            const promotionPath = '/content/dam/mas/promotions/project';
            const variationPath = '/content/dam/mas/acom/en_US/promotions/sale/card';
            const publishFragments = sinon.stub().resolves();
            const getWithEtag = sinon.stub();
            getWithEtag.withArgs('promo-1').resolves({ id: 'promo-1', path: promotionPath, etag: 'etag-promo' });
            getWithEtag.withArgs('var-1').resolves({ id: 'var-1', path: variationPath, etag: 'etag-var' });
            const repo = {
                operation: { set: sinon.stub() },
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                publish: sinon.stub(),
                                publishFragments,
                                getWithEtag,
                                getByPath: sinon.stub().withArgs(variationPath).resolves({ id: 'var-1', path: variationPath }),
                            },
                        },
                    },
                },
                processError: sinon.stub(),
            };
            const promotion = { id: 'promo-1', path: promotionPath };

            const ok = await publishPromotionProject(repo, promotion, [variationPath]);

            expect(ok).to.be.true;
            expect(repo.aem.sites.cf.fragments.publish.called).to.be.false;
            expect(publishFragments.calledOnce).to.be.true;
            const [fragments, statuses] = publishFragments.firstCall.args;
            expect(fragments).to.have.lengthOf(2);
            expect(fragments[0].path).to.equal(promotionPath);
            expect(fragments[1].path).to.equal(variationPath);
            expect(statuses).to.deep.equal([]);
        });

        it('publishes only resolved variations when some getByPath lookups fail', async () => {
            const promotionPath = '/content/dam/mas/promotions/project';
            const foundPath = '/content/dam/mas/acom/en_US/promotions/sale/card-a';
            const missingPath = '/content/dam/mas/acom/en_US/promotions/sale/card-b';
            const publishFragments = sinon.stub().resolves();
            const getWithEtag = sinon.stub();
            getWithEtag.withArgs('promo-1').resolves({ id: 'promo-1', path: promotionPath, etag: 'etag-promo' });
            getWithEtag.withArgs('var-a').resolves({ id: 'var-a', path: foundPath, etag: 'etag-a' });
            const getByPath = sinon.stub();
            getByPath.withArgs(foundPath).resolves({ id: 'var-a', path: foundPath });
            getByPath.withArgs(missingPath).rejects(new Error('not found'));
            const repo = {
                operation: { set: sinon.stub() },
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                publish: sinon.stub(),
                                publishFragments,
                                getWithEtag,
                                getByPath,
                            },
                        },
                    },
                },
                processError: sinon.stub(),
            };
            const promotion = { id: 'promo-1', path: promotionPath };

            const ok = await publishPromotionProject(repo, promotion, [foundPath, missingPath]);

            expect(ok).to.be.true;
            const [fragments] = publishFragments.firstCall.args;
            expect(fragments).to.have.lengthOf(2);
            expect(fragments[0].path).to.equal(promotionPath);
            expect(fragments[1].path).to.equal(foundPath);
        });
    });
});
