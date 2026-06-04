import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import {
    getPromotionProjectsForProbe,
    mergePromoReferencesIntoFragmentData,
} from '../../src/promotions/promotions-repository.js';

describe('promotions-repository', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        Store.promotions.list.data.set([]);
        Store.promotions.list.data.removeMeta('listFetched');
        Store.promotions.list.loading.set(true);
    });

    describe('getPromotionProjectsForProbe', () => {
        it('loads promotions when list was never fetched', async () => {
            Store.promotions.list.data.set([]);
            Store.promotions.list.data.removeMeta('listFetched');
            const loadPromotions = sandbox.stub().callsFake(async () => {
                Store.promotions.list.data.set([
                    {
                        get: () => ({
                            id: 'promo-1',
                            tags: [{ id: 'mas:promotion/black-friday' }],
                        }),
                    },
                ]);
                Store.promotions.list.data.setMeta('listFetched', true);
            });

            const projects = await getPromotionProjectsForProbe(loadPromotions);

            expect(loadPromotions.calledOnce).to.be.true;
            expect(projects).to.have.lengthOf(1);
        });

        it('does not load when promotions list was already fetched empty', async () => {
            Store.promotions.list.data.set([]);
            Store.promotions.list.data.setMeta('listFetched', true);
            const loadPromotions = sandbox.stub().resolves();

            const projects = await getPromotionProjectsForProbe(loadPromotions);

            expect(loadPromotions.called).to.be.false;
            expect(projects).to.deep.equal([]);
        });
    });

    describe('mergePromoReferencesIntoFragmentData', () => {
        it('probes promo variations using loaded promotion projects', async () => {
            const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            Store.promotions.list.data.set([
                {
                    get: () => ({
                        tags: [{ id: 'mas:promotion/black-friday' }],
                    }),
                },
            ]);
            Store.promotions.list.loading.set(false);
            const aem = {
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sandbox.stub().withArgs(promoPath).resolves({ id: 'promo-var', path: promoPath }),
                        },
                    },
                },
            };

            const result = await mergePromoReferencesIntoFragmentData(aem, { path: defaultPath, references: [] }, () =>
                Promise.resolve(),
            );

            expect(result.references).to.have.lengthOf(1);
            expect(result.references[0].path).to.equal(promoPath);
        });
    });
});
