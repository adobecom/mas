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
    unpublishPromotionProject,
    PROMOTION_EXPIRED_PUBLISH_MESSAGE,
    PROMOTION_SAVE_BEFORE_PUBLISH_MESSAGE,
    PROMOTION_UNPUBLISH_ERROR_MESSAGE,
    PROMOTION_UNPUBLISH_SUCCESS_MESSAGE,
    promotionUnpublishShortfallMessage,
    unpublishedPromoVariationsPublishMessage,
    publishedPromoVariationsUnpublishMessage,
    publishedPromoVariationsSkippedMessage,
    promotionDeleteConfirmMessage,
} from '../../src/promotions/promotion-publish-utils.js';
import { makeSearchStub as makeSharedSearchStub } from '../helpers/aem-tag-fetch.js';
import Events from '../../src/events.js';

describe('promotion-publish-utils', () => {
    const makeSearchStub = (itemsByFolder = {}) => makeSharedSearchStub(sinon, itemsByFolder);
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('isPromotionExpiredForPublish returns true only when promotionStatus is expired', () => {
        expect(isPromotionExpiredForPublish({ promotionStatus: 'expired' })).to.be.true;
        expect(isPromotionExpiredForPublish({ promotionStatus: 'active' })).to.be.false;
        expect(isPromotionExpiredForPublish(null)).to.be.false;
    });

    it('exposes the expired publish toast message', () => {
        expect(PROMOTION_EXPIRED_PUBLISH_MESSAGE).to.equal('This promotion has ended. Update the dates to publish again.');
    });

    it('exposes the save-before-publish message', () => {
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

    it('returns confirmed without dialog when there are no unpublished variations', async () => {
        const aem = { sites: { cf: { fragments: { getByPath: sinon.stub().resolves(null) } } } };
        const showDialog = sinon.stub().resolves(true);
        const result = await confirmPublishDespiteUnpublishedPromoVariations(
            aem,
            { id: 'p1', getFieldValues: () => [], tags: [] },
            showDialog,
        );
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [], skippedCount: 0 });
        expect(showDialog.called).to.be.false;
    });

    it('shows dialog and returns not confirmed when user cancels', async () => {
        const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const promoPath = `${promoFolder}/my-card`;
        const search = makeSearchStub({
            [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'DRAFT', title: 'V1' }],
        });
        const aem = {
            sites: {
                cf: {
                    fragments: { search },
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
        const showDialog = sinon.stub().resolves({ confirmed: false, checked: false });
        const result = await confirmPublishDespiteUnpublishedPromoVariations(aem, promotionFragment, showDialog);
        expect(result).to.deep.equal({ confirmed: false, variationPaths: [], skippedCount: 0 });
        expect(showDialog.calledOnce).to.be.true;
        const [title, message, options] = showDialog.firstCall.args;
        expect(title).to.equal(UNPUBLISHED_PROMO_VARIATIONS_DIALOG.title);
        expect(message).to.equal(unpublishedPromoVariationsPublishMessage(1));
        expect(options.confirmText).to.equal('Publish');
        expect(options.cancelText).to.equal('Cancel');
        expect(options.variant).to.equal('confirmation');
        expect(options.question).to.equal('Publish them together with the project?');
        expect(options.checkboxLabel).to.equal('Publish promo variations');
        expect(options.checkboxDefault).to.be.true;
    });

    it('returns variation paths when user confirms publish together', async () => {
        const parentPaths = ['/content/dam/mas/sandbox/en_US/card-a', '/content/dam/mas/sandbox/en_US/card-b'];
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const path1 = `${promoFolder}/card-a`;
        const path2 = `${promoFolder}/card-b`;
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        search: makeSearchStub({
                            [promoFolder]: [
                                { id: 'variation-id-1', path: path1, status: 'DRAFT', title: 'V1' },
                                { id: 'variation-id-2', path: path2, status: 'DRAFT', title: 'V2' },
                            ],
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
        const showDialog = sinon.stub().resolves({ confirmed: true, checked: true });
        const result = await confirmPublishDespiteUnpublishedPromoVariations(aem, promotionFragment, showDialog);
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [path1, path2], skippedCount: 0 });
        expect(showDialog.firstCall.args[1]).to.equal(unpublishedPromoVariationsPublishMessage(2));
    });

    it('excludes variation paths and reports skipped count when user confirms but unchecks the publish promo variations checkbox', async () => {
        const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const promoPath = `${promoFolder}/my-card`;
        const search = makeSearchStub({
            [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'DRAFT', title: 'V1' }],
        });
        const aem = { sites: { cf: { fragments: { search } } } };
        const promotionFragment = {
            getFieldValues: sinon.stub().callsFake((name) => {
                if (name === 'fragments') return [parentPath];
                return undefined;
            }),
            tags: [{ id: 'mas:promotion/black-friday' }],
        };
        const showDialog = sinon.stub().resolves({ confirmed: true, checked: false });
        const result = await confirmPublishDespiteUnpublishedPromoVariations(aem, promotionFragment, showDialog);
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [], skippedCount: 1 });
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
            'Are you sure you want to delete the promotion project "Black Friday"? This action cannot be undone. 3 promo variation(s) will remain saved but will no longer be associated with this project.',
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
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [], skippedCount: 0 });
        expect(showDialog.called).to.be.false;
    });

    it('shows unpublish dialog and returns not confirmed when user cancels', async () => {
        const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const promoPath = `${promoFolder}/my-card`;
        const search = makeSearchStub({
            [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'PUBLISHED', title: 'V1' }],
        });
        const aem = {
            sites: {
                cf: {
                    fragments: { search },
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
        const showDialog = sinon.stub().resolves({ confirmed: false, checked: false });
        const result = await confirmUnpublishAlongsidePromoVariations(aem, promotionFragment, showDialog);
        expect(result).to.deep.equal({ confirmed: false, variationPaths: [], skippedCount: 0 });
        expect(showDialog.calledOnce).to.be.true;
        const [title, message, options] = showDialog.firstCall.args;
        expect(title).to.equal(PUBLISHED_PROMO_VARIATIONS_DIALOG.title);
        expect(message).to.equal(publishedPromoVariationsUnpublishMessage(1));
        expect(options.confirmText).to.equal('Unpublish');
        expect(options.cancelText).to.equal('Cancel');
        expect(options.variant).to.equal('confirmation');
        expect(options.question).to.equal('Unpublish them together with the project?');
        expect(options.checkboxLabel).to.equal('Unpublish promo variations');
        expect(options.checkboxDefault).to.be.true;
    });

    it('returns variation paths when user confirms unpublish together, including modified ones', async () => {
        const parentPaths = ['/content/dam/mas/sandbox/en_US/card-a', '/content/dam/mas/sandbox/en_US/card-b'];
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const path1 = `${promoFolder}/card-a`;
        const path2 = `${promoFolder}/card-b`;
        const aem = {
            sites: {
                cf: {
                    fragments: {
                        search: makeSearchStub({
                            [promoFolder]: [
                                { id: 'variation-id-1', path: path1, status: 'PUBLISHED', title: 'V1' },
                                { id: 'variation-id-2', path: path2, status: 'MODIFIED', title: 'V2' },
                            ],
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
        const showDialog = sinon.stub().resolves({ confirmed: true, checked: true });
        const result = await confirmUnpublishAlongsidePromoVariations(aem, promotionFragment, showDialog);
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [path1, path2], skippedCount: 0 });
    });

    it('excludes variation paths and reports skipped count when user confirms unpublish but unchecks the checkbox', async () => {
        const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const promoPath = `${promoFolder}/my-card`;
        const search = makeSearchStub({
            [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'PUBLISHED', title: 'V1' }],
        });
        const aem = { sites: { cf: { fragments: { search } } } };
        const promotionFragment = {
            getFieldValues: sinon.stub().callsFake((name) => {
                if (name === 'fragments') return [parentPath];
                return undefined;
            }),
            tags: [{ id: 'mas:promotion/black-friday' }],
        };
        const showDialog = sinon.stub().resolves({ confirmed: true, checked: false });
        const result = await confirmUnpublishAlongsidePromoVariations(aem, promotionFragment, showDialog);
        expect(result).to.deep.equal({ confirmed: true, variationPaths: [], skippedCount: 1 });
    });

    it('documents that a search index lag silently drops attached variations from the confirm dialog count', async () => {
        // `getUnpublishedAttachedPromoVariations` relies on AEM's search index. If it hasn't caught
        // up yet, it can return fewer results than the promotion's actually attached variations,
        // and neither the dialog nor the eventual publish call is aware anything was missed.
        const parentPaths = ['/content/dam/mas/sandbox/en_US/card-a', '/content/dam/mas/sandbox/en_US/card-b'];
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const indexedPath = `${promoFolder}/card-a`;
        // card-b is attached to the promotion (via parentPaths) but not yet indexed by search.
        const search = makeSearchStub({
            [promoFolder]: [{ id: 'variation-id-1', path: indexedPath, status: 'DRAFT', title: 'V1' }],
        });
        const aem = { sites: { cf: { fragments: { search } } } };
        const promotionFragment = {
            getFieldValues: sinon.stub().callsFake((name) => {
                if (name === 'fragments') return parentPaths;
                return undefined;
            }),
            tags: [{ id: 'mas:promotion/black-friday' }],
        };
        const showDialog = sinon.stub().resolves({ confirmed: true, checked: true });

        const result = await confirmPublishDespiteUnpublishedPromoVariations(aem, promotionFragment, showDialog);

        expect(result).to.deep.equal({ confirmed: true, variationPaths: [indexedPath], skippedCount: 0 });
        const [, message] = showDialog.firstCall.args;
        expect(message).to.equal(unpublishedPromoVariationsPublishMessage(1));
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

        it('does not abort the whole batch when getWithEtag rejects for one variation', async () => {
            const badPath = '/content/dam/mas/acom/en_US/promotions/sale/card-bad';
            const goodPath = '/content/dam/mas/acom/en_US/promotions/sale/card-good';
            const unpublish = sinon.stub().resolves();
            const getWithEtag = sinon.stub();
            getWithEtag.withArgs('promo-1').resolves({ id: 'promo-1', etag: 'etag-promo' });
            getWithEtag.withArgs('var-bad').rejects(new Error('Network error: fetch failed'));
            getWithEtag.withArgs('var-good').resolves({ id: 'var-good', etag: 'etag-good' });
            const getByPath = sinon.stub();
            getByPath.withArgs(badPath).resolves({ id: 'var-bad', path: badPath });
            getByPath.withArgs(goodPath).resolves({ id: 'var-good', path: goodPath });
            const repo = {
                operation: { set: sinon.stub() },
                aem: { sites: { cf: { fragments: { unpublish, getWithEtag, getByPath } } } },
                processError: sinon.stub(),
            };
            const promotion = { id: 'promo-1', path: '/content/dam/mas/promotions/project' };
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const ok = await unpublishPromotionProject(repo, promotion, [badPath, goodPath]);

            expect(ok).to.be.true;
            expect(unpublish.calledTwice).to.be.true;
            expect(unpublish.secondCall.calledWith({ id: 'var-good', etag: 'etag-good' })).to.be.true;
            expect(toastStub.calledWith(sinon.match({ variant: 'warning', content: promotionUnpublishShortfallMessage(1) }))).to
                .be.true;
        });

        it('combines the skipped-by-user count into a single toast instead of one warning plus a separate success toast', async () => {
            const unpublish = sinon.stub().resolves();
            const getWithEtag = sinon.stub().withArgs('promo-1').resolves({ id: 'promo-1', etag: 'etag-promo' });
            const repo = {
                operation: { set: sinon.stub() },
                aem: { sites: { cf: { fragments: { unpublish, getWithEtag } } } },
                processError: sinon.stub(),
            };
            const promotion = { id: 'promo-1', path: '/content/dam/mas/promotions/project' };
            const toastStub = sandbox.stub(Events.toast, 'emit');

            const ok = await unpublishPromotionProject(repo, promotion, [], 2);

            expect(ok).to.be.true;
            expect(toastStub.calledOnce).to.be.true;
            expect(
                toastStub.calledWith(
                    sinon.match({
                        variant: 'warning',
                        content: publishedPromoVariationsSkippedMessage(2),
                    }),
                ),
            ).to.be.true;
        });
    });
});
