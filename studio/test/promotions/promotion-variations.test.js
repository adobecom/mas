import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    createPromoVariation,
    findOverlappingGeoTags,
    getUsedGeoTags,
    getNextAvailablePromoVariationIndex,
    MAX_PROMO_VARIATIONS_PER_FRAGMENT,
    mergePromoVariationReferences,
    mergePromoReferencesForDefaultFragment,
    probeOrphanedPromoVariationsForFragment,
    probePromoVariationReferences,
    probePromoVariationsForFragment,
    probePromoVariationsForFragments,
    getUnpublishedAttachedPromoVariations,
    getAllAttachedPromoVariations,
    getPublishedAttachedPromoVariations,
    resolveDefaultFragmentForPromoVariation,
} from '../../src/promotions/promotion-variations.js';
import { makeSearchStub as makeSharedSearchStub } from '../helpers/aem-tag-fetch.js';

describe('promotion-variations', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const makeSearchStub = (itemsByFolder = {}) => makeSharedSearchStub(sandbox, itemsByFolder);

    const createAemMock = (overrides = {}) => ({
        sites: {
            cf: {
                fragments: {
                    getByPath: sandbox.stub(),
                    getById: sandbox.stub(),
                    search: makeSearchStub(),
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
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
        const targetPath = `${promoFolder}/my-card`;

        it('creates the first (unsuffixed) promo variation and writes the given geo tags', async () => {
            const createdDraft = { id: 'new-promo-var-id' };
            const createdFragment = { id: 'new-promo-var-id', path: targetPath };
            const createFragmentCopy = sandbox.stub().resolves(createdDraft);
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
                createFragmentCopy,
            });

            const result = await createPromoVariation(aem, parentFragment.id, promoTag, ['mas:pzn/country/ar']);
            expect(result).to.deep.equal(createdFragment);
            const [fragmentForCopy] = createFragmentCopy.firstCall.args;
            const pznTagsField = fragmentForCopy.fields.find((field) => field.name === 'pznTags');
            expect(pznTagsField).to.deep.equal({
                name: 'pznTags',
                type: 'tag',
                multiple: true,
                values: ['mas:pzn/country/ar'],
            });
        });

        it('creates a second variation with a suffixed path when the first already exists', async () => {
            const variation1Path = targetPath;
            const variation2Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'var-1',
                        path: variation1Path,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                    },
                ],
            });
            const createdDraft = { id: 'new-promo-var-2' };
            const createdFragment = { id: 'new-promo-var-2', path: variation2Path };
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    search,
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
                createFragmentCopy: sandbox.stub().resolves(createdDraft),
            });

            const result = await createPromoVariation(aem, parentFragment.id, promoTag, ['mas:pzn/country/fr']);
            expect(result).to.deep.equal(createdFragment);
        });

        it('throws when the requested geo tags overlap with a sibling variation', async () => {
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'var-1',
                        path: targetPath,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                    },
                ],
            });
            const aem = createAemMock({
                fragments: { getById: sandbox.stub().resolves(parentFragment), search },
            });

            try {
                await createPromoVariation(aem, parentFragment.id, promoTag, ['mas:pzn/country/ar']);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.include('mas:pzn/country/ar');
            }
        });

        it('throws when requesting a geo-less variation and a geo-less sibling already exists', async () => {
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'var-1', path: targetPath, fields: [] }],
            });
            const aem = createAemMock({
                fragments: { getById: sandbox.stub().resolves(parentFragment), search },
            });

            try {
                await createPromoVariation(aem, parentFragment.id, promoTag);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.equal('A variation with no geos already exists for this project.');
            }
        });

        it('does not throw the geo-less-sibling error when geoTags is empty but no sibling is geo-less', async () => {
            const createdFragment = {
                id: 'new-promo-var-2',
                path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2',
            };
            const search = makeSearchStub({
                [promoFolder]: [
                    { id: 'var-1', path: targetPath, fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }] },
                ],
            });
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    search,
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-promo-var-2' }),
            });

            const result = await createPromoVariation(aem, parentFragment.id, promoTag, []);
            expect(result).to.deep.equal(createdFragment);
        });

        it('creates a geo-specific variation alongside a sibling with no pznTags (legacy fallback variation)', async () => {
            const variation2Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'var-1', path: targetPath, fields: [] }],
            });
            const createdFragment = { id: 'new-promo-var-2', path: variation2Path };
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    search,
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-promo-var-2' }),
            });

            const result = await createPromoVariation(aem, parentFragment.id, promoTag, ['mas:pzn/country/fr']);
            expect(result).to.deep.equal(createdFragment);
        });

        it('skips a suffix index that collides with another attached fragment in the same project', async () => {
            const variation1Path = targetPath;
            const collidingAttachedPath = '/content/dam/mas/sandbox/en_US/my-card-2';
            const variation3Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-3';
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'var-1',
                        path: variation1Path,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                    },
                ],
            });
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    search,
                    pollCreatedFragment: sandbox.stub().resolves({ id: 'new-promo-var-3', path: variation3Path }),
                },
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-promo-var-3' }),
            });

            const result = await createPromoVariation(
                aem,
                parentFragment.id,
                promoTag,
                ['mas:pzn/country/fr'],
                [collidingAttachedPath],
            );
            expect(result).to.deep.equal({ id: 'new-promo-var-3', path: variation3Path });
        });

        it('throws when promotion tag resolves to an unsafe promo folder name', async () => {
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                },
            });

            try {
                await createPromoVariation(aem, parentFragment.id, 'mas:promotion/../evil');
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.include('Invalid promotion tag');
            }
        });

        it('throws when creating a promo variation from an existing promo variation', async () => {
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({ ...parentFragment, path: targetPath }),
                },
            });

            try {
                await createPromoVariation(aem, parentFragment.id, promoTag);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.include('Cannot create a promo variation from a promo variation');
            }
        });

        it('throws when creating a promo variation from a grouped variation', async () => {
            const groupedSourcePath = '/content/dam/mas/sandbox/en_US/PA-123/pzn/my-card-grouped';
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({ ...parentFragment, path: groupedSourcePath }),
                },
            });

            try {
                await createPromoVariation(aem, parentFragment.id, promoTag);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.include('Cannot create a promo variation from a grouped variation');
            }
        });

        it('throws a plain Error when the source fragment cannot be fetched', async () => {
            const aem = createAemMock({
                fragments: { getById: sandbox.stub().resolves(null) },
            });

            try {
                await createPromoVariation(aem, parentFragment.id, promoTag);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.equal('Failed to fetch source fragment');
            }
        });

        it('throws when the source fragment path cannot be parsed into a promo variation path', async () => {
            const unparsablePath = 'not-a-dam-path';
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({ ...parentFragment, path: unparsablePath }),
                },
            });

            try {
                await createPromoVariation(aem, parentFragment.id, promoTag);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.include('Could not determine promo variation path from fragment path');
            }
        });

        it('throws a plain Error when the created fragment cannot be polled back', async () => {
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    pollCreatedFragment: sandbox.stub().resolves(null),
                },
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-promo-var-id' }),
            });

            try {
                await createPromoVariation(aem, parentFragment.id, promoTag);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.equal('Failed to create promo variation');
            }
        });

        it('creates a variation and copies no promotion tags when the source fragment has no tags', async () => {
            const createdFragment = { id: 'new-promo-var-id', path: targetPath };
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({ ...parentFragment, tags: undefined }),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
                createFragmentCopy: sandbox.stub().resolves({ id: 'new-promo-var-id' }),
            });

            const result = await createPromoVariation(aem, parentFragment.id, promoTag);
            expect(result).to.deep.equal(createdFragment);
            expect(aem.saveTags.firstCall.args[0].newTags).to.deep.equal([promoTag]);
        });

        it('does not block a later explicit-geo variation when a geo-less fallback sibling already exists', async () => {
            const createdDraft = { id: 'fallback-var' };
            const createdFragment = { id: 'fallback-var', path: targetPath };
            const aemForFallback = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
                createFragmentCopy: sandbox.stub().resolves(createdDraft),
            });

            // Simulates Task 1's confirm handler: confirming with zero geos checked
            // passes [] straight through, so createPromoVariation omits pznTags entirely.
            await createPromoVariation(aemForFallback, parentFragment.id, promoTag, []);

            const [fragmentForCopy] = aemForFallback.createFragmentCopy.firstCall.args;
            expect(fragmentForCopy.fields.find((field) => field.name === 'pznTags')).to.be.undefined;

            const existingVariations = [{ pznTags: [] }];
            expect(findOverlappingGeoTags(existingVariations, ['mas:pzn/country/ar'])).to.deep.equal([]);

            const secondVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            const searchForSecond = makeSearchStub({
                [promoFolder]: [{ id: 'fallback-var', path: targetPath, fields: [] }],
            });
            const aemForSecond = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    search: searchForSecond,
                    pollCreatedFragment: sandbox.stub().resolves({ id: 'second-var', path: secondVariationPath }),
                },
            });

            const result = await createPromoVariation(aemForSecond, parentFragment.id, promoTag, ['mas:pzn/country/ar']);
            expect(result).to.deep.equal({ id: 'second-var', path: secondVariationPath });
        });
    });

    describe('probePromoVariationsForFragment', () => {
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
        const promoTag = 'mas:promotion/black-friday';
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';

        it('returns an empty array when aem, defaultPath or promoTagId is missing', async () => {
            expect(await probePromoVariationsForFragment(null, defaultPath, promoTag)).to.deep.equal([]);
            expect(await probePromoVariationsForFragment(createAemMock(), '', promoTag)).to.deep.equal([]);
            expect(await probePromoVariationsForFragment(createAemMock(), defaultPath, '')).to.deep.equal([]);
        });

        it('returns an empty array when the unsuffixed variation does not exist', async () => {
            const aem = createAemMock({ fragments: { search: makeSearchStub() } });
            const result = await probePromoVariationsForFragment(aem, defaultPath, promoTag);
            expect(result).to.deep.equal([]);
        });

        it('returns one entry for the unsuffixed variation when no suffixed siblings exist', async () => {
            const variation1Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'var-1',
                        path: variation1Path,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                    },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await probePromoVariationsForFragment(aem, defaultPath, promoTag);
            expect(result).to.have.lengthOf(1);
            expect(result[0]).to.deep.equal({
                path: variation1Path,
                index: 1,
                id: 'var-1',
                pznTags: ['mas:pzn/country/ar'],
                status: undefined,
                title: undefined,
                model: undefined,
                fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                tags: undefined,
            });
        });

        it('finds multiple suffixed variations in order when they are all contiguous', async () => {
            const variation1Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const variation2Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'var-1',
                        path: variation1Path,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                    },
                    {
                        id: 'var-2',
                        path: variation2Path,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/fr'] }],
                    },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await probePromoVariationsForFragment(aem, defaultPath, promoTag);
            expect(result).to.have.lengthOf(2);
            expect(result[0].index).to.equal(1);
            expect(result[1]).to.deep.equal({
                path: variation2Path,
                index: 2,
                id: 'var-2',
                pznTags: ['mas:pzn/country/fr'],
                status: undefined,
                title: undefined,
                model: undefined,
                fields: [{ name: 'pznTags', values: ['mas:pzn/country/fr'] }],
                tags: undefined,
            });
        });

        it('finds a variation past a gap left by deleting a lower-indexed sibling', async () => {
            const variation1Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const variation3Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-3';
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'var-1',
                        path: variation1Path,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/ar'] }],
                    },
                    {
                        id: 'var-3',
                        path: variation3Path,
                        fields: [{ name: 'pznTags', values: ['mas:pzn/country/eg'] }],
                    },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await probePromoVariationsForFragment(aem, defaultPath, promoTag);
            expect(result.map((variation) => variation.index)).to.deep.equal([1, 3]);
            expect(result[1].id).to.equal('var-3');
        });
    });

    describe('probePromoVariationsForFragments', () => {
        const promoTag = 'mas:promotion/black-friday';

        it('returns an empty array per default path when aem or promoTagId is missing', async () => {
            const paths = ['/content/dam/mas/sandbox/en_US/my-card'];
            const resultWithNoAem = await probePromoVariationsForFragments(null, paths, promoTag);
            expect(resultWithNoAem.get(paths[0])).to.deep.equal([]);
            const resultWithNoTag = await probePromoVariationsForFragments(createAemMock(), paths, '');
            expect(resultWithNoTag.get(paths[0])).to.deep.equal([]);
        });

        it('groups fragments that resolve to the same parent folder into a single search call', async () => {
            const cardAPath = '/content/dam/mas/sandbox/en_US/card-a';
            const cardBPath = '/content/dam/mas/sandbox/en_US/card-b';
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const search = makeSearchStub({
                [promoFolder]: [
                    { id: 'var-a', path: `${promoFolder}/card-a`, fields: [] },
                    { id: 'var-b', path: `${promoFolder}/card-b`, fields: [] },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await probePromoVariationsForFragments(aem, [cardAPath, cardBPath], promoTag);

            expect(search.calledOnce, 'should search the shared folder once for both fragments').to.be.true;
            expect(result.get(cardAPath).map((variation) => variation.path)).to.deep.equal([`${promoFolder}/card-a`]);
            expect(result.get(cardBPath).map((variation) => variation.path)).to.deep.equal([`${promoFolder}/card-b`]);
        });

        it("does not attribute a sibling fragment's own leaf name as this fragment's suffixed variation", async () => {
            const cardPath = '/content/dam/mas/sandbox/en_US/dir/card';
            const card2Path = '/content/dam/mas/sandbox/en_US/dir/card-2';
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday/dir';
            const search = makeSearchStub({
                [promoFolder]: [
                    { id: 'var-card', path: `${promoFolder}/card`, fields: [] },
                    { id: 'var-card-2', path: `${promoFolder}/card-2`, fields: [] },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await probePromoVariationsForFragments(aem, [cardPath, card2Path], promoTag);

            const cardVariations = result.get(cardPath);
            expect(cardVariations).to.have.lengthOf(1);
            expect(cardVariations[0].path).to.equal(`${promoFolder}/card`);
            const card2Variations = result.get(card2Path);
            expect(card2Variations).to.have.lengthOf(1);
            expect(card2Variations[0].path).to.equal(`${promoFolder}/card-2`);
            expect(card2Variations[0].index).to.equal(1);
        });
    });

    describe('findOverlappingGeoTags', () => {
        it('returns geo tags already used by a sibling variation', () => {
            const existing = [{ pznTags: ['mas:pzn/country/ar', 'mas:pzn/country/ae'] }];
            expect(findOverlappingGeoTags(existing, ['mas:pzn/country/ae', 'mas:pzn/country/fr'])).to.deep.equal([
                'mas:pzn/country/ae',
            ]);
        });

        it('returns an empty array when there is no overlap', () => {
            const existing = [{ pznTags: ['mas:pzn/country/ar'] }];
            expect(findOverlappingGeoTags(existing, ['mas:pzn/country/fr'])).to.deep.equal([]);
        });

        it('returns an empty array when there are no existing variations', () => {
            expect(findOverlappingGeoTags([], ['mas:pzn/country/fr'])).to.deep.equal([]);
        });

        it('returns an empty array when newGeoTags is not provided', () => {
            expect(findOverlappingGeoTags([{ pznTags: ['mas:pzn/country/ar'] }])).to.deep.equal([]);
        });

        it('does not treat a sibling with no pznTags as covering any geo (legacy fallback variation)', () => {
            const existing = [{ pznTags: [] }];
            expect(findOverlappingGeoTags(existing, ['mas:pzn/country/fr'])).to.deep.equal([]);
        });
    });

    describe('getUsedGeoTags', () => {
        it('collects pznTags from every variation that has them', () => {
            const existing = [{ pznTags: ['mas:pzn/country/ar'] }, { pznTags: ['mas:pzn/country/fr'] }];
            expect(getUsedGeoTags(existing)).to.deep.equal(['mas:pzn/country/ar', 'mas:pzn/country/fr']);
        });

        it('excludes a legacy variation with no pznTags from the used set', () => {
            const existing = [{ pznTags: [] }, { pznTags: ['mas:pzn/country/ar'] }];
            expect(getUsedGeoTags(existing)).to.deep.equal(['mas:pzn/country/ar']);
        });

        it('returns an empty array when there are no variations', () => {
            expect(getUsedGeoTags([])).to.deep.equal([]);
        });
    });

    describe('getNextAvailablePromoVariationIndex', () => {
        const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';

        it('returns 1 when there are no existing variations, regardless of attached fragments', () => {
            expect(getNextAvailablePromoVariationIndex([], defaultPath, ['/content/dam/mas/sandbox/en_US/my-card-2'])).to.equal(
                1,
            );
        });

        it('returns the next index after the highest used one when it does not collide with an attached fragment', () => {
            expect(getNextAvailablePromoVariationIndex([1], defaultPath, [])).to.equal(2);
        });

        it('skips an index that would collide with another attached fragment in the same project', () => {
            const attached = ['/content/dam/mas/sandbox/en_US/my-card-2'];
            expect(getNextAvailablePromoVariationIndex([1], defaultPath, attached)).to.equal(3);
        });

        it('fills a gap left by a deleted sibling instead of colliding with a surviving higher index', () => {
            expect(getNextAvailablePromoVariationIndex([1, 3], defaultPath, [])).to.equal(2);
        });

        it('throws when every index up to the safety cap collides with an attached fragment', () => {
            const attached = [];
            for (let index = 2; index <= MAX_PROMO_VARIATIONS_PER_FRAGMENT; index += 1) {
                attached.push(`/content/dam/mas/sandbox/en_US/my-card-${index}`);
            }
            try {
                getNextAvailablePromoVariationIndex([1], defaultPath, attached);
                expect.fail('Should have thrown');
            } catch (err) {
                expect(err.message).to.include('Too many promo variations for this fragment');
            }
        });
    });

    describe('getUnpublishedAttachedPromoVariations', () => {
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';

        it('returns unpublished promo variations resolved by tag and path', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'DRAFT', title: 'Promo Card' }],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.have.lengthOf(1);
            expect(result[0].path).to.equal(promoPath);
        });

        it('includes modified promo variations as unpublished', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'MODIFIED', title: 'Promo Card' }],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.have.lengthOf(1);
            expect(result[0].status).to.equal('MODIFIED');
        });

        it('excludes published promo variations', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'PUBLISHED', title: 'Promo Card' }],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.deep.equal([]);
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

        it('returns empty array when the promotion has no attached fragments', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return [];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const aem = createAemMock();
            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.deep.equal([]);
        });

        it('skips an attached path that cannot be turned into a promo variation path', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['not-a-dam-path'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const aem = createAemMock();
            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.deep.equal([]);
        });

        it('skips an attached fragment whose promo variation does not exist', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const aem = createAemMock({ fragments: { search: makeSearchStub() } });
            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.deep.equal([]);
        });

        it('detects an unpublished second (suffixed) variation even when the first variation is published', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const variation1Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const variation2Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            const search = makeSearchStub({
                [promoFolder]: [
                    { id: 'var-1', path: variation1Path, status: 'PUBLISHED' },
                    { id: 'var-2', path: variation2Path, status: 'DRAFT' },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getUnpublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.have.lengthOf(1);
            expect(result[0].path).to.equal(variation2Path);
        });
    });

    describe('getAllAttachedPromoVariations', () => {
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';

        it('includes published promo variations', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const search = makeSearchStub({
                [promoFolder]: [
                    {
                        id: 'promo-var-id',
                        path: promoPath,
                        status: 'PUBLISHED',
                        title: 'Promo Card',
                        model: { path: '/conf/mas/settings/dam/cfm/models/card' },
                        fields: [{ name: 'cardTitle', values: ['Promo Card'] }],
                        tags: [],
                    },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getAllAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.have.lengthOf(1);
            expect(result[0]).to.deep.equal({
                index: 1,
                pznTags: [],
                id: 'promo-var-id',
                path: promoPath,
                status: 'PUBLISHED',
                title: 'Promo Card',
                model: { path: '/conf/mas/settings/dam/cfm/models/card' },
                fields: [{ name: 'cardTitle', values: ['Promo Card'] }],
                tags: [],
                parentPath: '/content/dam/mas/sandbox/en_US/my-card',
            });
        });

        it('includes multiple suffixed variations attached to the same parent fragment', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const variation1Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const variation2Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            const search = makeSearchStub({
                [promoFolder]: [
                    { id: 'var-1', path: variation1Path, status: 'PUBLISHED' },
                    { id: 'var-2', path: variation2Path, status: 'DRAFT' },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getAllAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.have.lengthOf(2);
            expect(result.map((variation) => variation.path)).to.deep.equal([variation1Path, variation2Path]);
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
            const result = await getAllAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.deep.equal([]);
        });

        it('does not attribute a sibling fragment named "card-2" as "card"\'s own suffixed variation', async () => {
            const cardPath = '/content/dam/mas/sandbox/en_US/dir/card';
            const card2Path = '/content/dam/mas/sandbox/en_US/dir/card-2';
            const dirPromoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday/dir';
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return [cardPath, card2Path];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const search = makeSearchStub({
                [dirPromoFolder]: [
                    { id: 'var-card', path: `${dirPromoFolder}/card`, fields: [] },
                    { id: 'var-card-2', path: `${dirPromoFolder}/card-2`, fields: [] },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getAllAttachedPromoVariations(aem, promotionFragment);

            expect(result).to.have.lengthOf(2);
            const cardVariations = result.filter((variation) => variation.parentPath === cardPath);
            expect(cardVariations).to.have.lengthOf(1);
            expect(cardVariations[0].path).to.equal(`${dirPromoFolder}/card`);
            const card2Variations = result.filter((variation) => variation.parentPath === card2Path);
            expect(card2Variations).to.have.lengthOf(1);
            expect(card2Variations[0].path).to.equal(`${dirPromoFolder}/card-2`);
            expect(card2Variations[0].index).to.equal(1);
        });
    });

    describe('getPublishedAttachedPromoVariations', () => {
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';

        it('returns only published promo variations, excluding drafts', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const variation1Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const variation2Path = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2';
            const search = makeSearchStub({
                [promoFolder]: [
                    { id: 'var-1', path: variation1Path, status: 'PUBLISHED' },
                    { id: 'var-2', path: variation2Path, status: 'DRAFT' },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getPublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.have.lengthOf(1);
            expect(result[0].path).to.equal(variation1Path);
        });

        it('returns empty array when no attached promo variations are published', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'DRAFT' }],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getPublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.deep.equal([]);
        });

        it('includes a modified promo variation, since it is still live with unpublished edits', async () => {
            const promotionFragment = {
                getFieldValues: sandbox.stub().callsFake((name) => {
                    if (name === 'fragments') return ['/content/dam/mas/sandbox/en_US/my-card'];
                    return undefined;
                }),
                tags: [{ id: 'mas:promotion/black-friday' }],
            };
            const promoPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoPath, status: 'MODIFIED' }],
            });
            const aem = createAemMock({ fragments: { search } });

            const result = await getPublishedAttachedPromoVariations(aem, promotionFragment);
            expect(result).to.have.lengthOf(1);
            expect(result[0].status).to.equal('MODIFIED');
        });
    });

    describe('probePromoVariationReferences', () => {
        const defaultPath = '/content/dam/mas/sandbox/en_US/Plans/Individual/com/my-card';
        const promotionsRoot = '/content/dam/mas/sandbox/en_US/promotions';
        const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/back-to-school/Plans/Individual/com';
        const promoPath = `${promoFolder}/my-card`;

        it('returns references for existing promo copies from promotion project tags', async () => {
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-var-id', path: promoPath, tags: [{ id: 'mas:promotion/back-to-school' }] }],
            });
            const aem = createAemMock({ fragments: { search } });

            const refs = await probePromoVariationReferences(aem, defaultPath, [
                { tags: [{ id: 'mas:promotion/back-to-school' }] },
            ]);
            expect(refs).to.have.lengthOf(1);
            expect(refs[0].path).to.equal(promoPath);
        });

        it('returns every variation when the same project has more than one, geo-specific, promo variation', async () => {
            const promoPath2 = `${promoFolder}/my-card-2`;
            const search = makeSearchStub({
                [promoFolder]: [
                    { id: 'promo-var-1', path: promoPath, status: 'PUBLISHED' },
                    { id: 'promo-var-2', path: promoPath2, status: 'DRAFT' },
                ],
            });
            const aem = createAemMock({ fragments: { search } });

            const refs = await probePromoVariationReferences(aem, defaultPath, [
                { tags: [{ id: 'mas:promotion/back-to-school' }] },
            ]);
            expect(refs).to.have.lengthOf(2);
            expect(refs.map((ref) => ref.path)).to.deep.equal([promoPath, promoPath2]);
        });

        it('returns an empty array when aem, defaultPath, or promotionProjects is missing/empty', async () => {
            expect(await probePromoVariationReferences(null, defaultPath, [{ tags: [] }])).to.deep.equal([]);
            expect(await probePromoVariationReferences(createAemMock(), '', [{ tags: [] }])).to.deep.equal([]);
            expect(await probePromoVariationReferences(createAemMock(), defaultPath, [])).to.deep.equal([]);
        });

        it('returns an empty array when defaultPath is already a promo variation path', async () => {
            const result = await probePromoVariationReferences(createAemMock(), promoPath, [{ tags: [] }]);
            expect(result).to.deep.equal([]);
        });

        it('excludes a project whose variation exists but is missing an id', async () => {
            const aem = createAemMock({
                fragments: { search: makeSearchStub({ [promoFolder]: [{ path: promoPath }] }) },
            });

            const refs = await probePromoVariationReferences(aem, defaultPath, [
                { tags: [{ id: 'mas:promotion/back-to-school' }] },
            ]);
            expect(refs).to.deep.equal([]);
        });

        it('does not fall back to a promotions-tree scan when no live project has a matching variation', async () => {
            const search = makeSearchStub({
                [promotionsRoot]: [{ id: 'orphan-id', path: promoPath }],
            });
            const aem = createAemMock({ fragments: { search } });

            const refs = await probePromoVariationReferences(aem, defaultPath, []);
            expect(refs).to.deep.equal([]);
            expect(search.called, 'should not scan the promotions tree').to.be.false;
        });

        it('does not fall back to a promotions-tree scan when live projects exist but none match', async () => {
            const search = makeSearchStub({
                [promotionsRoot]: [{ id: 'orphan-id', path: promoPath }],
            });
            const aem = createAemMock({ fragments: { search } });

            const refs = await probePromoVariationReferences(aem, defaultPath, [
                { tags: [{ id: 'mas:promotion/some-other-project' }] },
            ]);
            expect(refs).to.deep.equal([]);
            expect(search.calledWith({ path: promotionsRoot }), 'should not scan the promotions tree').to.be.false;
        });
    });

    describe('probeOrphanedPromoVariationsForFragment', () => {
        const defaultPath = '/content/dam/mas/sandbox/en_US/Plans/Individual/com/my-card';
        const promotionsRoot = '/content/dam/mas/sandbox/en_US/promotions';
        const promoPath = `${promotionsRoot}/back-to-school/Plans/Individual/com/my-card`;

        it('discovers a variation left behind by a deleted promotion project', async () => {
            const aem = createAemMock({
                fragments: { search: makeSearchStub({ [promotionsRoot]: [{ id: 'orphan-id', path: promoPath }] }) },
            });

            const refs = await probeOrphanedPromoVariationsForFragment(aem, defaultPath);
            expect(refs).to.have.lengthOf(1);
            expect(refs[0]).to.include({ id: 'orphan-id', path: promoPath });
        });

        it('discovers a variation under a nested (multi-segment) promo-name folder', async () => {
            const nestedPath = `${promotionsRoot}/season/black-friday/Plans/Individual/com/my-card-2`;
            const aem = createAemMock({
                fragments: { search: makeSearchStub({ [promotionsRoot]: [{ id: 'nested-id', path: nestedPath }] }) },
            });

            const refs = await probeOrphanedPromoVariationsForFragment(aem, defaultPath);
            expect(refs).to.have.lengthOf(1);
            expect(refs[0]).to.include({ id: 'nested-id', path: nestedPath, index: 2 });
        });

        it('ignores unrelated fragments found under the promotions tree', async () => {
            const unrelatedPath = `${promotionsRoot}/back-to-school/Plans/Individual/com/other-card`;
            const aem = createAemMock({
                fragments: { search: makeSearchStub({ [promotionsRoot]: [{ id: 'unrelated-id', path: unrelatedPath }] }) },
            });

            expect(await probeOrphanedPromoVariationsForFragment(aem, defaultPath)).to.deep.equal([]);
        });

        it('returns an empty array when nothing is found under the promotions tree', async () => {
            const aem = createAemMock({ fragments: { search: makeSearchStub({ [promotionsRoot]: [] }) } });
            expect(await probeOrphanedPromoVariationsForFragment(aem, defaultPath)).to.deep.equal([]);
        });

        it('returns an empty array when aem, defaultPath is missing, or it is a promo path', async () => {
            expect(await probeOrphanedPromoVariationsForFragment(createAemMock(), '')).to.deep.equal([]);
            expect(await probeOrphanedPromoVariationsForFragment(createAemMock(), promoPath)).to.deep.equal([]);
            expect(await probeOrphanedPromoVariationsForFragment(null, defaultPath)).to.deep.equal([]);
        });

        it('returns an empty array when the promotions-tree search fails', async () => {
            const aem = createAemMock({ fragments: { search: sandbox.stub().throws(new Error('boom')) } });
            expect(await probeOrphanedPromoVariationsForFragment(aem, defaultPath)).to.deep.equal([]);
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

        it('returns fragmentData unchanged when there is nothing discovered', () => {
            const fragmentData = { path: '/content/dam/mas/sandbox/en_US/my-card', references: [] };
            expect(mergePromoVariationReferences(fragmentData, [])).to.equal(fragmentData);
            expect(mergePromoVariationReferences(null, [{ path: '/x' }])).to.be.null;
        });

        it('treats a missing references array on fragmentData as empty', () => {
            const fragmentData = { path: '/content/dam/mas/sandbox/en_US/my-card' };
            const merged = mergePromoVariationReferences(fragmentData, [
                { id: 'new', path: '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card' },
            ]);
            expect(merged.references).to.have.lengthOf(1);
        });
    });

    describe('mergePromoReferencesForDefaultFragment', () => {
        it('returns fragmentData unchanged when it has no path or is itself a promo variation', async () => {
            const aem = createAemMock();
            expect(await mergePromoReferencesForDefaultFragment(aem, { references: [] }, [])).to.deep.equal({ references: [] });
            const promoData = { path: '/content/dam/mas/sandbox/en_US/promotions/sale/my-card', references: [] };
            expect(await mergePromoReferencesForDefaultFragment(aem, promoData, [])).to.equal(promoData);
        });

        it('merges probed promo references into fragment payload', async () => {
            const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
            const promoFolder = '/content/dam/mas/sandbox/en_US/promotions/black-friday';
            const promoPath = `${promoFolder}/my-card`;
            const search = makeSearchStub({
                [promoFolder]: [{ id: 'promo-1', path: promoPath, tags: [] }],
            });
            const aem = createAemMock({ fragments: { search } });

            const enriched = await mergePromoReferencesForDefaultFragment(aem, { path: defaultPath, references: [] }, [
                { tags: [{ id: 'mas:promotion/black-friday' }] },
            ]);
            expect(enriched.references).to.have.lengthOf(1);
            expect(enriched.references[0].path).to.equal(promoPath);
        });
    });

    describe('resolveDefaultFragmentForPromoVariation', () => {
        const promoPath = '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card';
        const parentPath = '/content/dam/mas/sandbox/en_US/my-card';

        it('returns null when promoVariationId is not provided', async () => {
            const aem = createAemMock();
            const result = await resolveDefaultFragmentForPromoVariation(aem, promoPath);
            expect(result).to.be.null;
        });

        it('returns null when the variation path does not resolve to any candidate for the promo name', async () => {
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({
                        id: 'promo-var',
                        path: '/content/dam/mas/sandbox/en_US/my-card',
                        tags: [{ id: 'mas:promotion/back-to-school' }],
                    }),
                },
            });
            const result = await resolveDefaultFragmentForPromoVariation(
                aem,
                '/content/dam/mas/sandbox/en_US/my-card',
                'promo-var',
            );
            expect(result).to.be.null;
        });

        it('resolves default fragment path from promo variation path and tag', async () => {
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

        it('prefers the candidate listed in attachedFragmentPaths when the leaf has a numeric suffix', async () => {
            const suffixedPromoPath = '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card-2';
            const unstrippedCandidate = '/content/dam/mas/sandbox/en_US/my-card-2';
            const strippedCandidate = '/content/dam/mas/sandbox/en_US/my-card';
            const strippedData = { id: 'default-id', path: strippedCandidate };
            const getByPath = sandbox.stub();
            getByPath.withArgs(unstrippedCandidate).resolves({ id: 'wrong-match', path: unstrippedCandidate });
            getByPath.withArgs(strippedCandidate).resolves(strippedData);
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({
                        id: 'promo-var-2',
                        path: suffixedPromoPath,
                        tags: [{ id: 'mas:promotion/back-to-school' }],
                    }),
                    getByPath,
                },
            });

            const result = await resolveDefaultFragmentForPromoVariation(aem, suffixedPromoPath, 'promo-var-2', [
                strippedCandidate,
            ]);
            expect(result).to.deep.equal(strippedData);
        });

        it('falls back to the first candidate that resolves when none match attachedFragmentPaths', async () => {
            const suffixedPromoPath = '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card-2';
            const unstrippedCandidate = '/content/dam/mas/sandbox/en_US/my-card-2';
            const unstrippedData = { id: 'default-id', path: unstrippedCandidate };
            const getByPath = sandbox.stub();
            getByPath.withArgs(unstrippedCandidate).resolves(unstrippedData);
            getByPath.resolves(null);
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({
                        id: 'promo-var-2',
                        path: suffixedPromoPath,
                        tags: [{ id: 'mas:promotion/back-to-school' }],
                    }),
                    getByPath,
                },
            });

            const result = await resolveDefaultFragmentForPromoVariation(aem, suffixedPromoPath, 'promo-var-2', []);
            expect(result).to.deep.equal(unstrippedData);
        });

        it('prefers the stripped candidate over a coincidentally-named suffixed fragment when neither is attached', async () => {
            const suffixedPromoPath = '/content/dam/mas/sandbox/en_US/promotions/back-to-school/my-card-2';
            const unstrippedCandidate = '/content/dam/mas/sandbox/en_US/my-card-2';
            const strippedCandidate = '/content/dam/mas/sandbox/en_US/my-card';
            const strippedData = { id: 'default-id', path: strippedCandidate };
            const getByPath = sandbox.stub();
            getByPath.withArgs(unstrippedCandidate).resolves({ id: 'wrong-match', path: unstrippedCandidate });
            getByPath.withArgs(strippedCandidate).resolves(strippedData);
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({
                        id: 'promo-var-2',
                        path: suffixedPromoPath,
                        tags: [{ id: 'mas:promotion/back-to-school' }],
                    }),
                    getByPath,
                },
            });

            const result = await resolveDefaultFragmentForPromoVariation(aem, suffixedPromoPath, 'promo-var-2', []);
            expect(result).to.deep.equal(strippedData);
        });

        it('returns null when no candidate default path resolves to a real fragment', async () => {
            const aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves({
                        id: 'promo-var',
                        path: promoPath,
                        tags: [{ id: 'mas:promotion/back-to-school' }],
                    }),
                    getByPath: sandbox.stub().resolves(null),
                },
            });

            const result = await resolveDefaultFragmentForPromoVariation(aem, promoPath, 'promo-var');
            expect(result).to.be.null;
        });
    });
});
