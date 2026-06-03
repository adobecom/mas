import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    createPromoVariation,
    mergePromoVariationReferences,
    mergePromoReferencesForDefaultFragment,
    probePromoVariationReferences,
    getUnpublishedAttachedPromoVariations,
    resolveDefaultFragmentForPromoVariation,
} from '../../src/promotions/promotion-variations.js';

describe('promotion-variations', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createAemMock = (overrides = {}) => ({
        sites: {
            cf: {
                fragments: {
                    getByPath: sandbox.stub(),
                    getById: sandbox.stub(),
                    ensureFolderExists: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub(),
                    ...overrides.fragments,
                },
            },
        },
        getCsrfToken: sandbox.stub().resolves('csrf-token'),
        createFragmentCopy: sandbox.stub(),
        wait: sandbox.stub().resolves(),
        saveTags: sandbox.stub().resolves(),
        ...overrides,
    });

    describe('createPromoVariation', () => {
        const parentFragment = {
            id: 'parent-promo-1',
            path: '/content/dam/mas/sandbox/en_US/my-card',
            title: 'Card title',
            description: 'Card description',
            model: { id: 'model-1' },
            fields: [{ name: 'title', values: ['Hello'] }],
            tags: [{ id: 'mas:product_code/cc' }],
        };
        const promoTag = 'mas:promotion/black-friday';
        const targetPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';

        it('creates promo variation without updating parent variations field', async () => {
            const createdDraft = { id: 'new-promo-var-id' };
            const createdFragment = { id: 'new-promo-var-id', path: targetPath };
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    getByPath: sandbox.stub().resolves(null),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });

            const result = await createPromoVariation(aem, parentFragment.id, promoTag);
            expect(result).to.deep.equal(createdFragment);
        });

        it('throws when promo variation already exists at target path', async () => {
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    getByPath: sandbox.stub().resolves({ id: 'existing', path: targetPath }),
                },
            });

            try {
                await createPromoVariation(aem, parentFragment.id, promoTag);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.include('already exists');
            }
        });
    });

    describe('getUnpublishedAttachedPromoVariations', () => {
        it('returns unpublished promo variations resolved by tag and path', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const aem = createAemMock({
                fragments: {
                    getByPath: sandbox.stub().withArgs(promoPath).resolves({
                        path: promoPath,
                        status: 'DRAFT',
                        title: 'Promo Card',
                    }),
                },
            });

            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.have.lengthOf(1);
            expect(result[0].path).to.equal(promoPath);
        });

        it('returns empty array when promotion has no promotion tag', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [],
            };
            const aem = createAemMock();
            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.deep.equal([]);
        });
    });

    describe('probePromoVariationReferences', () => {
        const defaultPath = '/content/dam/mas/sandbox/en_US/Plans/Individual/com/my-card';
        const promoPath = '/content/dam/mas/sandbox/en_US/promotions/back-to-school/Plans/Individual/com/my-card';

        it('returns references for existing promo copies from promotion project tags', async () => {
            const aem = createAemMock({
                fragments: {
                    getByPath: sandbox
                        .stub()
                        .withArgs(promoPath)
                        .resolves({
                            id: 'promo-var-id',
                            path: promoPath,
                            tags: [{ id: 'mas:promotion/back-to-school' }],
                        }),
                },
            });

            const refs = await probePromoVariationReferences(aem, defaultPath, [
                { tags: [{ id: 'mas:promotion/back-to-school' }] },
            ]);
            expect(refs).to.have.lengthOf(1);
            expect(refs[0].path).to.equal(promoPath);
        });
    });

    describe('mergePromoVariationReferences', () => {
        it('dedupes discovered references by path', () => {
            const fragmentData = {
                path: '/content/dam/mas/sandbox/en_US/my-card',
                references: [{ id: 'existing', path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card' }],
            };
            const merged = mergePromoVariationReferences(fragmentData, [
                { id: 'existing', path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card' },
                { id: 'new', path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card' },
            ]);
            expect(merged.references).to.have.lengthOf(2);
        });
    });

    describe('mergePromoReferencesForDefaultFragment', () => {
        it('merges probed promo references into fragment payload', async () => {
            const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const aem = createAemMock({
                fragments: {
                    getByPath: sandbox.stub().withArgs(promoPath).resolves({ id: 'promo-1', path: promoPath, tags: [] }),
                },
            });

            const enriched = await mergePromoReferencesForDefaultFragment(aem, { path: defaultPath, references: [] }, [
                { tags: [{ id: 'mas:promotion/black-friday' }] },
            ]);
            expect(enriched.references).to.have.lengthOf(1);
            expect(enriched.references[0].path).to.equal(promoPath);
        });
    });

    describe('resolveDefaultFragmentForPromoVariation', () => {
        it('resolves default fragment path from promo variation path and tag', async () => {
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card';
            const parentPath = '/content/dam/mas/sandbox/en_US/my-card';
            const parentData = { id: 'default-id', path: parentPath };
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({
                        id: 'promo-var',
                        path: promoPath,
                        tags: [{ id: 'mas:promotion/back-to-school' }],
                    }),
                    getByPath: sandbox.stub().withArgs(parentPath).resolves(parentData),
                },
            });

            const result = await resolveDefaultFragmentForPromoVariation(aem, promoPath, 'promo-var');
            expect(result).to.deep.equal(parentData);
        });
    });
});
