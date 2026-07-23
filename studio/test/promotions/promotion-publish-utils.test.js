import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { OPERATIONS } from '../../src/constants.js';
import {
    UNPUBLISHED_PROMO_VARIATIONS_DIALOG,
    PUBLISHED_PROMO_VARIATIONS_DIALOG,
    canPublishPromotionNow,
    canSchedulePromotion,
    confirmPublishDespiteUnpublishedPromoVariations,
    confirmUnpublishAlongsidePromoVariations,
    isPromotionExpiredForPublish,
    publishPromotionProject,
    unpublishPromotionProject,
    PROMOTION_EXPIRED_PUBLISH_MESSAGE,
    PROMOTION_PUBLISH_ERROR_MESSAGE,
    PROMOTION_PUBLISH_SUCCESS_MESSAGE,
    PROMOTION_SAVE_BEFORE_PUBLISH_MESSAGE,
    PROMOTION_UNPUBLISH_ERROR_MESSAGE,
    PROMOTION_UNPUBLISH_SUCCESS_MESSAGE,
    promotionPublishShortfallMessage,
    promotionUnpublishShortfallMessage,
    unpublishedPromoVariationsPublishMessage,
    publishedPromoVariationsUnpublishMessage,
    promotionDeleteConfirmMessage,
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
        expect(PROMOTION_SAVE_BEFORE_PUBLISH_MESSAGE).to.equal('Save your changes before publishing.');
    });

    it('canSchedulePromotion requires saved promotion with future start date', () => {
        const futureFragment = {
            id: 'promo-1',
            promotionStatus: 'active',
            isPromotionPublished: false,
            isPromotionModified: false,
            getFieldValue: () => '2030-01-01T00:00:00.000Z',
        };
        expect(canSchedulePromotion(futureFragment, { now: new Date('2026-01-01') })).to.be.true;
        expect(canSchedulePromotion(futureFragment, { hasUnsavedChanges: true })).to.be.false;
        expect(canPublishPromotionNow(futureFragment, { now: new Date('2026-01-01') })).to.be.false;
    });

    it('canPublishPromotionNow requires start date that has begun', () => {
        const fragment = {
            id: 'promo-1',
            promotionStatus: 'active',
            isPromotionPublished: false,
            isPromotionModified: false,
            getFieldValue: () => '2026-01-01T00:00:00.000Z',
        };
        expect(canPublishPromotionNow(fragment, { now: new Date('2026-06-01') })).to.be.true;
        expect(canSchedulePromotion(fragment, { now: new Date('2026-06-01') })).to.be.false;
    });

    it('canPublishPromotionNow and canSchedulePromotion both return false when startDate is missing', () => {
        const noStartDate = {
            id: 'promo-1',
            promotionStatus: 'active',
            isPromotionPublished: false,
            isPromotionModified: false,
            getFieldValue: () => '',
        };
        expect(canPublishPromotionNow(noStartDate)).to.be.false;
        expect(canSchedulePromotion(noStartDate)).to.be.false;
    });

    it('exposes shortfall message when some promo variations are omitted from publish', () => {
        expect(promotionPublishShortfallMessage(2)).to.equal(
            'Project published, but 2 promo variation(s) could not be included.',
        );
    });

    it('returns confirmed without dialog when there are no unpublished variations', async () => {
        const aem = { sites: { cf: { fragments: { getByPath: sinon.stub().resolves(null) } } } };
        const showDialog = sinon.stub().resolves(true);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(
            aem,
            { id: 'p1', getFieldValues: () => [], tags: [] },
            showDialog,
        );
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [] });
        expect(showDialog.called).to.be.false;
    });

    it('shows dialog and returns not confirmed when user cancels', async () => {
        const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
        const getByPath = sinon.stub().resolves(null);
        getByPath.withArgs(promoPath).resolves({ id: 'promo-var-id', path: promoPath, status: 'DRAFT', title: 'V1' });
        const aem = {
            sites: {
                cf: {
                    fragments: { getByPath },
                },
            },
        };
        const promotionFragment = {
            getFieldValues: sinon.stub().callsFake((name) => {
                if (name === 'fragments') return [parentPath];
                return undefined;
            }),
            tags: [{ id: 'mas:promotion/black-friday' }],
        };
        const showDialog = sinon.stub().resolves(false);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(aem, promotionFragment, showDialog);
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
        const parentPaths = ['/content/dam/mas/sandbox/en_US/card-a', '/content/dam/mas/sandbox/en_US/card-b'];
        const path1 = '/content/dam/mas/sandbox/en_US/promotions/black-friday/card-a';
        const path2 = '/content/dam/mas/sandbox/en_US/promotions/black-friday/card-b';
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        getByPath: sinon.stub().callsFake(async (path) => {
                            if (path === path1) return { id: 'variation-id-1', path: path1, status: 'DRAFT', title: 'V1' };
                            if (path === path2) return { id: 'variation-id-2', path: path2, status: 'DRAFT', title: 'V2' };
                            return null;
                        }),
                    },
                },
            },
        };
        const promotionFragment = {
            getFieldValues: sinon.stub().callsFake((name) => {
                if (name === 'fragments') return parentPaths;
                return undefined;
            }),
            tags: [{ id: 'mas:promotion/black-friday' }],
        };
        const showDialog = sinon.stub().resolves(true);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(aem, promotionFragment, showDialog);
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [path1, path2] });
        expect(showDialog.firstCall.args[1]).to.equal(unpublishedPromoVariationsPublishMessage(2));
    });

    it('exposes shortfall message when some promo variations are omitted from unpublish', () => {
        expect(promotionUnpublishShortfallMessage(2)).to.equal(
            'Project unpublished, but 2 promo variation(s) could not be included.',
        );
    });

    it('builds the delete confirm message without a promo variations note when there are none', () => {
        expect(promotionDeleteConfirmMessage('Black Friday', 0)).to.equal(
            'Are you sure you want to delete the promotion project "Black Friday"? This action cannot be undone.',
        );
    });

    it('builds the delete confirm message with a promo variations note when some are attached', () => {
        expect(promotionDeleteConfirmMessage('Black Friday', 3)).to.equal(
            'Are you sure you want to delete the promotion project "Black Friday"? This action cannot be undone. 3 promo variation(s) will also be deleted.',
        );
    });

    it('returns confirmed without dialog when there are no published variations', async () => {
        const aem = { sites: { cf: { fragments: { getByPath: sinon.stub().resolves(null) } } } };
        const showDialog = sinon.stub().resolves(true);
        const result = await confirmUnpublishAlongsidePromoVariations(
            aem,
            { id: 'p1', getFieldValues: () => [], tags: [] },
            showDialog,
        );
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [] });
        expect(showDialog.called).to.be.false;
    });

    it('shows unpublish dialog and returns not confirmed when user cancels', async () => {
        const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
        const getByPath = sinon.stub().resolves(null);
        getByPath.withArgs(promoPath).resolves({ id: 'promo-var-id', path: promoPath, status: 'PUBLISHED', title: 'V1' });
        const aem = {
            sites: {
                cf: {
                    fragments: { getByPath },
                },
            },
        };
        const promotionFragment = {
            getFieldValues: sinon.stub().callsFake((name) => {
                if (name === 'fragments') return [parentPath];
                return undefined;
            }),
            tags: [{ id: 'mas:promotion/black-friday' }],
        };
        const showDialog = sinon.stub().resolves(false);
        const result = await confirmUnpublishAlongsidePromoVariations(aem, promotionFragment, showDialog);
        expect(result).to.deep.equal({ confirmed: false, variationPaths: [] });
        expect(showDialog.calledOnce).to.be.true;
        const [title, message, options] = showDialog.firstCall.args;
        expect(title).to.equal(PUBLISHED_PROMO_VARIATIONS_DIALOG.title);
        expect(message).to.equal(publishedPromoVariationsUnpublishMessage(1));
        expect(options.confirmText).to.equal('Unpublish together');
        expect(options.cancelText).to.equal('Cancel');
        expect(options.variant).to.equal('confirmation');
    });

    it('returns variation paths when user confirms unpublish together, including modified ones', async () => {
        const parentPaths = ['/content/dam/mas/sandbox/en_US/card-a', '/content/dam/mas/sandbox/en_US/card-b'];
        const path1 = '/content/dam/mas/sandbox/en_US/promotions/black-friday/card-a';
        const path2 = '/content/dam/mas/sandbox/en_US/promotions/black-friday/card-b';
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        getByPath: sinon.stub().callsFake(async (path) => {
                            if (path === path1) return { id: 'variation-id-1', path: path1, status: 'PUBLISHED', title: 'V1' };
                            if (path === path2) return { id: 'variation-id-2', path: path2, status: 'MODIFIED', title: 'V2' };
                            return null;
                        }),
                    },
                },
            },
        };
        const promotionFragment = {
            getFieldValues: sinon.stub().callsFake((name) => {
                if (name === 'fragments') return parentPaths;
                return undefined;
            }),
            tags: [{ id: 'mas:promotion/black-friday' }],
        };
        const showDialog = sinon.stub().resolves(true);
        const result = await confirmUnpublishAlongsidePromoVariations(aem, promotionFragment, showDialog);
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [path1, path2] });
        expect(showDialog.firstCall.args[1]).to.equal(publishedPromoVariationsUnpublishMessage(2));
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

    describe('unpublishPromotionProject', () => {
        it('unpublishes only the promotion when there are no variation paths', async () => {
            const unpublish = sinon.stub().resolves();
            const getWithEtag = sinon.stub().withArgs('promo-1').resolves({ id: 'promo-1', etag: 'etag-promo' });
            const repo = {
                operation: { set: sinon.stub() },
                aem: { sites: { cf: { fragments: { unpublish, getWithEtag } } } },
                processError: sinon.stub(),
            };
            const promotion = { id: 'promo-1', path: '/content/dam/mas/promotions/project' };

            const ok = await unpublishPromotionProject(repo, promotion, []);

            expect(ok).to.be.true;
            expect(unpublish.calledOnceWith({ id: 'promo-1', etag: 'etag-promo' })).to.be.true;
            expect(repo.operation.set.firstCall.args[0]).to.equal(OPERATIONS.UNPUBLISH);
            expect(repo.operation.set.lastCall.args[0]).to.equal(null);
        });

        it('calls processError with project message when unpublish fails', async () => {
            const unpublishError = new Error('unpublish failed');
            const getWithEtag = sinon.stub().withArgs('promo-1').resolves({ id: 'promo-1', etag: 'etag-promo' });
            const unpublish = sinon.stub().rejects(unpublishError);
            const processError = sinon.stub();
            const repo = {
                operation: { set: sinon.stub() },
                aem: { sites: { cf: { fragments: { unpublish, getWithEtag } } } },
                processError,
            };
            const promotion = { id: 'promo-1', path: '/content/dam/mas/promotions/project' };

            const ok = await unpublishPromotionProject(repo, promotion, []);

            expect(ok).to.be.false;
            expect(processError.calledOnceWith(unpublishError, PROMOTION_UNPUBLISH_ERROR_MESSAGE)).to.be.true;
            expect(repo.operation.set.lastCall.args[0]).to.equal(null);
        });

        it('unpublishes promotion and its promo variations together', async () => {
            const variationPath = '/content/dam/mas/acom/en_US/promotions/sale/card';
            const unpublish = sinon.stub().resolves();
            const getWithEtag = sinon.stub();
            getWithEtag.withArgs('promo-1').resolves({ id: 'promo-1', etag: 'etag-promo' });
            getWithEtag.withArgs('var-1').resolves({ id: 'var-1', etag: 'etag-var' });
            const getByPath = sinon.stub().withArgs(variationPath).resolves({ id: 'var-1', path: variationPath });
            const repo = {
                operation: { set: sinon.stub() },
                aem: { sites: { cf: { fragments: { unpublish, getWithEtag, getByPath } } } },
                processError: sinon.stub(),
            };
            const promotion = { id: 'promo-1', path: '/content/dam/mas/promotions/project' };

            const ok = await unpublishPromotionProject(repo, promotion, [variationPath]);

            expect(ok).to.be.true;
            expect(unpublish.calledTwice).to.be.true;
            expect(unpublish.firstCall.calledWith({ id: 'promo-1', etag: 'etag-promo' })).to.be.true;
            expect(unpublish.secondCall.calledWith({ id: 'var-1', etag: 'etag-var' })).to.be.true;
        });

        it('unpublishes only resolved variations and reports a shortfall when some lookups fail', async () => {
            const foundPath = '/content/dam/mas/acom/en_US/promotions/sale/card-a';
            const missingPath = '/content/dam/mas/acom/en_US/promotions/sale/card-b';
            const unpublish = sinon.stub().resolves();
            const getWithEtag = sinon.stub();
            getWithEtag.withArgs('promo-1').resolves({ id: 'promo-1', etag: 'etag-promo' });
            getWithEtag.withArgs('var-a').resolves({ id: 'var-a', etag: 'etag-a' });
            const getByPath = sinon.stub();
            getByPath.withArgs(foundPath).resolves({ id: 'var-a', path: foundPath });
            getByPath.withArgs(missingPath).rejects(new Error('not found'));
            const repo = {
                operation: { set: sinon.stub() },
                aem: { sites: { cf: { fragments: { unpublish, getWithEtag, getByPath } } } },
                processError: sinon.stub(),
            };
            const promotion = { id: 'promo-1', path: '/content/dam/mas/promotions/project' };

            const ok = await unpublishPromotionProject(repo, promotion, [foundPath, missingPath]);

            expect(ok).to.be.true;
            expect(unpublish.calledTwice).to.be.true;
            expect(unpublish.secondCall.calledWith({ id: 'var-a', etag: 'etag-a' })).to.be.true;
        });
    });
});
