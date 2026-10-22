import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
    BULK_PUBLISH_PROJECT_MODEL_PATH,
    BULK_PUBLISH_PROJECTS_FOLDER,
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    PAGE_NAMES,
    PROMOTION_MODEL_PATH,
    PROMOTIONS_PATH_PREFIX,
    PZN_FOLDER,
    TRANSLATION_PROJECT_MODEL_PATH,
} from '../../src/constants.js';
import {
    ARTIFACT_TYPE_KEYS,
    REFERENCED_BY_MAX_PAGES,
    REFERENCED_BY_PAGE_LIMIT,
    REFERENCE_TYPES,
    bucketReferences,
    chooseRepresentative,
    classifyReference,
    fetchAllReferencingItems,
    getReferencingFragments,
    groupFlatReferences,
    groupReferencesByCollection,
    isCrossSurfaceReference,
    isExcludedReference,
    isSelfLocaleVariationReference,
    parsePathTokens,
} from '../../src/references/references-repository.js';

const hashParams = (link) => Object.fromEntries(new URLSearchParams(new URL(link).hash.slice(1)));

describe('references-repository', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('ARTIFACT_TYPE_KEYS (displayed types)', () => {
        it('lists the four Figma artifact types in order and excludes cards/other', () => {
            expect(ARTIFACT_TYPE_KEYS).to.deep.equal([
                'collections',
                'bulkPublishProjects',
                'promoProjects',
                'localizationProjects',
            ]);
            expect(ARTIFACT_TYPE_KEYS).to.not.include('cards');
            expect(ARTIFACT_TYPE_KEYS).to.not.include('other');
        });

        it('uses the singular Figma labels for the project types', () => {
            const labelOf = (key) => REFERENCE_TYPES.find((type) => type.key === key)?.label;
            expect(labelOf('bulkPublishProjects')).to.equal('Bulk Publish Project');
            expect(labelOf('promoProjects')).to.equal('Promo Project');
            expect(labelOf('localizationProjects')).to.equal('Translation Project');
        });
    });

    describe('classifyReference', () => {
        it('classifies a reference with an unknown model as other', () => {
            expect(classifyReference({ model: { path: '/conf/mas/settings/dam/cfm/models/unknown' } })).to.equal('other');
        });
    });

    describe('isSelfLocaleVariationReference (self-locale-variation predicate)', () => {
        it('excludes a reference that is the same collection on the same surface', () => {
            expect(isSelfLocaleVariationReference('acom', 'my-collection', 'acom', 'my-collection')).to.be.true;
        });

        it('keeps a reference to a different collection on the same surface', () => {
            expect(isSelfLocaleVariationReference('acom', 'other-collection', 'acom', 'my-collection')).to.be.false;
        });

        it('keeps a reference on a different surface even with the same fragmentPath', () => {
            expect(isSelfLocaleVariationReference('nala', 'my-collection', 'acom', 'my-collection')).to.be.false;
        });
    });

    describe('isCrossSurfaceReference (cross-surface predicate)', () => {
        it('excludes a parent from a different surface', () => {
            expect(isCrossSurfaceReference('/content/dam/mas/nala/en_US/my-collection', 'sandbox')).to.be.true;
        });

        it('keeps a parent from the same surface', () => {
            expect(isCrossSurfaceReference('/content/dam/mas/sandbox/en_US/my-collection', 'sandbox')).to.be.false;
        });

        it('is false when the surface of the open fragment is unknown', () => {
            expect(isCrossSurfaceReference('/content/dam/mas/nala/en_US/my-collection', undefined)).to.be.false;
        });
    });

    describe('parsePathTokens / PATH_TOKENS no-match fallback', () => {
        it('parses surface, locale and fragmentPath out of a well-formed path', () => {
            const tokens = parsePathTokens('/content/dam/mas/acom/en_US/plans-two-wide-reflow-all');
            expect(tokens).to.deep.equal({ surface: 'acom', parsedLocale: 'en_US', fragmentPath: 'plans-two-wide-reflow-all' });
        });

        it('returns null when PATH_TOKENS cannot parse the path', () => {
            expect(parsePathTokens('/content/dam/mas/promotions/campaign-card')).to.equal(null);
        });

        it('returns null for a missing path', () => {
            expect(parsePathTokens(undefined)).to.equal(null);
        });
    });

    describe('isExcludedReference', () => {
        const openFragmentTokens = { surface: 'acom', parsedLocale: 'en_US', fragmentPath: 'my-card' };
        const collection = (path) => ({ path, model: { path: COLLECTION_MODEL_PATH } });

        it('keeps a pzn collection variation that holds the open card', () => {
            const reference = collection(`/content/dam/mas/acom/en_US/${PZN_FOLDER}/black-friday/my-collection`);
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.false;
        });

        it('keeps a promo collection variation that holds the open card', () => {
            const reference = collection(`/content/dam/mas/acom/en_US/${PROMOTIONS_PATH_PREFIX}black-friday/my-collection`);
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.false;
        });

        it('excludes the self locale variation', () => {
            const reference = { path: '/content/dam/mas/acom/fr_FR/my-card', model: { path: CARD_MODEL_PATH } };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.true;
        });

        it('excludes a locale copy of the open pzn variation', () => {
            const openVariationTokens = parsePathTokens(`/content/dam/mas/acom/fr_FR/${PZN_FOLDER}/black-friday/my-card`);
            const reference = {
                path: `/content/dam/mas/acom/en_US/${PZN_FOLDER}/black-friday/my-card`,
                model: { path: CARD_MODEL_PATH },
            };
            expect(isExcludedReference(reference, openVariationTokens)).to.be.true;
        });

        it('excludes a locale copy of the open promo variation', () => {
            const openVariationTokens = parsePathTokens(
                `/content/dam/mas/acom/fr_FR/${PROMOTIONS_PATH_PREFIX}black-friday/my-collection`,
            );
            const reference = collection(`/content/dam/mas/acom/en_US/${PROMOTIONS_PATH_PREFIX}black-friday/my-collection`);
            expect(isExcludedReference(reference, openVariationTokens)).to.be.true;
        });

        it('excludes cross-surface clones', () => {
            const reference = collection('/content/dam/mas/nala/en_US/my-collection');
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.true;
        });

        it('keeps a legitimate same-surface collection parent', () => {
            const reference = collection('/content/dam/mas/acom/en_US/plans-two-wide-reflow-all');
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.false;
        });

        it('keeps a promotion project, which is stored outside every surface folder', () => {
            const reference = { path: '/content/dam/mas/promotions/summer-sale', model: { path: PROMOTION_MODEL_PATH } };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.false;
        });

        it('keeps a bulk-publish project named like the open card', () => {
            const reference = {
                path: `/content/dam/mas/acom/${BULK_PUBLISH_PROJECTS_FOLDER}/my-card`,
                model: { path: BULK_PUBLISH_PROJECT_MODEL_PATH },
            };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.false;
        });

        it('keeps a translation project named like the open card', () => {
            const reference = {
                path: '/content/dam/mas/acom/translations/my-card',
                model: { path: TRANSLATION_PROJECT_MODEL_PATH },
            };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.false;
        });

        it('excludes a cross-surface bulk-publish project', () => {
            const reference = {
                path: `/content/dam/mas/nala/${BULK_PUBLISH_PROJECTS_FOLDER}/holiday-push`,
                model: { path: BULK_PUBLISH_PROJECT_MODEL_PATH },
            };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.true;
        });

        it('keeps an unparseable path rather than excluding it', () => {
            const reference = collection('/content/dam/mas/acom/weird-path');
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.false;
        });
    });

    describe('chooseRepresentative', () => {
        const items = [
            { locale: 'fr_FR', id: 'fr-id' },
            { locale: 'en_US', id: 'en-id' },
            { locale: 'ja_JP', id: 'ja-id' },
        ];

        it('prefers the open fragment locale when present in the group', () => {
            expect(chooseRepresentative(items, 'ja_JP', 'en_US').id).to.equal('ja-id');
        });

        it('falls back to the surface default locale when the open locale is absent', () => {
            expect(chooseRepresentative(items, 'de_DE', 'en_US').id).to.equal('en-id');
        });

        it('falls back to the first item when neither locale is present', () => {
            expect(chooseRepresentative(items, 'de_DE', 'it_IT').id).to.equal('fr-id');
        });
    });

    describe('groupReferencesByCollection', () => {
        const openFragmentTokens = { surface: 'acom', parsedLocale: 'en_US', fragmentPath: 'my-card' };

        it('groups the same collection across locales into a single row', () => {
            const items = [
                {
                    path: '/content/dam/mas/acom/en_US/plans-two-wide-reflow-all',
                    id: 'en-id',
                    title: 'Plans',
                    status: 'PUBLISHED',
                },
                {
                    path: '/content/dam/mas/acom/fr_FR/plans-two-wide-reflow-all',
                    id: 'fr-id',
                    title: 'Plans FR',
                    status: 'DRAFT',
                },
                {
                    path: '/content/dam/mas/acom/ja_JP/plans-two-wide-reflow-all',
                    id: 'ja-id',
                    title: 'Plans JA',
                    status: 'DRAFT',
                },
            ];

            const groups = groupReferencesByCollection(items, openFragmentTokens, 'en_US');

            expect(groups).to.deep.equal([
                {
                    title: 'Plans',
                    path: '/content/dam/mas/acom/en_US/plans-two-wide-reflow-all',
                    link: groups[0].link,
                },
            ]);
        });

        it('keeps distinct collections in separate rows', () => {
            const items = [
                { path: '/content/dam/mas/acom/en_US/collection-a', id: 'a-id' },
                { path: '/content/dam/mas/acom/en_US/collection-b', id: 'b-id' },
            ];

            const groups = groupReferencesByCollection(items, openFragmentTokens, 'en_US');

            expect(groups.map((group) => group.path)).to.deep.equal([
                '/content/dam/mas/acom/en_US/collection-a',
                '/content/dam/mas/acom/en_US/collection-b',
            ]);
        });

        it('keeps a path PATH_TOKENS cannot parse as its own row', () => {
            const items = [{ path: '/content/dam/mas/promotions/campaign-card', id: 'weird-id' }];

            const groups = groupReferencesByCollection(items, openFragmentTokens, 'en_US');

            expect(groups.map((group) => group.path)).to.deep.equal(['/content/dam/mas/promotions/campaign-card']);
        });
    });

    describe('groupFlatReferences', () => {
        it('lists one row per project', () => {
            const items = [
                {
                    path: `/content/dam/mas/acom/${BULK_PUBLISH_PROJECTS_FOLDER}/holiday-push`,
                    id: 'project-1',
                    title: 'Holiday Push',
                    status: 'PUBLISHED',
                    model: { path: BULK_PUBLISH_PROJECT_MODEL_PATH },
                },
            ];

            const projects = groupFlatReferences(items);

            expect(projects).to.deep.equal([{ title: 'Holiday Push', path: items[0].path, link: null }]);
        });

        it('deduplicates repeated project parents by path', () => {
            const item = {
                path: `/content/dam/mas/acom/${BULK_PUBLISH_PROJECTS_FOLDER}/holiday-push`,
                id: 'project-1',
                model: { path: BULK_PUBLISH_PROJECT_MODEL_PATH },
            };

            const projects = groupFlatReferences([item, { ...item }]);

            expect(projects).to.have.lengthOf(1);
        });
    });

    describe('fetchAllReferencingItems (cursor pagination)', () => {
        it('follows cursor until it is absent, assembling every page', async () => {
            const getReferencedByFragmentId = sandbox.stub();
            getReferencedByFragmentId
                .onCall(0)
                .resolves({ items: [{ id: 'ref-1' }, { id: 'ref-2' }], cursor: 'cursor-page-2' });
            getReferencedByFragmentId.onCall(1).resolves({ items: [{ id: 'ref-3' }], cursor: undefined });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const items = await fetchAllReferencingItems(aem, 'fragment-id');

            expect(items.map((item) => item.id)).to.deep.equal(['ref-1', 'ref-2', 'ref-3']);
            expect(getReferencedByFragmentId.calledTwice).to.be.true;
            expect(getReferencedByFragmentId.firstCall.args).to.deep.equal([
                'fragment-id',
                { cursor: undefined, limit: REFERENCED_BY_PAGE_LIMIT, abortController: undefined },
            ]);
            expect(getReferencedByFragmentId.secondCall.args[1].cursor).to.equal('cursor-page-2');
        });

        it('stops after a single page when no cursor is returned', async () => {
            const getReferencedByFragmentId = sandbox.stub().resolves({ items: [{ id: 'only-ref' }] });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const items = await fetchAllReferencingItems(aem, 'fragment-id');

            expect(items).to.deep.equal([{ id: 'only-ref' }]);
            expect(getReferencedByFragmentId.calledOnce).to.be.true;
        });

        it('passes the abort controller through to the aem layer', async () => {
            const getReferencedByFragmentId = sandbox.stub().resolves({ items: [] });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };
            const abortController = { signal: {} };

            await fetchAllReferencingItems(aem, 'fragment-id', { abortController });

            expect(getReferencedByFragmentId.firstCall.args[1].abortController).to.equal(abortController);
        });

        it(`rejects incomplete results after ${REFERENCED_BY_MAX_PAGES} pages`, async () => {
            const getReferencedByFragmentId = sandbox.stub().callsFake(async (id, { cursor }) => {
                if (getReferencedByFragmentId.callCount > REFERENCED_BY_MAX_PAGES) throw new Error('pagination is unbounded');
                return { items: [{ id: `ref-${cursor}` }], cursor: `${cursor ?? 0}+` };
            });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const result = await fetchAllReferencingItems(aem, 'fragment-id').catch((error) => error);
            expect(result).to.be.instanceOf(Error);
            expect(result.message).to.include('Reference lookup incomplete');

            expect(getReferencedByFragmentId.callCount).to.equal(REFERENCED_BY_MAX_PAGES);
        });

        it('rejects incomplete results when the server repeats a cursor', async () => {
            const getReferencedByFragmentId = sandbox.stub().callsFake(async () => {
                if (getReferencedByFragmentId.callCount > 2) throw new Error('a repeated cursor is followed');
                return { items: [{ id: 'ref' }], cursor: 'stuck' };
            });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const result = await fetchAllReferencingItems(aem, 'fragment-id').catch((error) => error);
            expect(result).to.be.instanceOf(Error);
            expect(result.message).to.include('Reference lookup incomplete');

            expect(getReferencedByFragmentId.callCount).to.equal(2);
        });
    });

    describe('bucketReferences', () => {
        const openFragmentTokens = { surface: 'acom', parsedLocale: 'en_US', fragmentPath: 'my-card' };
        const reference = (id, modelPath) => ({ id, path: `/content/dam/mas/acom/en_US/${id}`, model: { path: modelPath } });

        it('returns only non-empty buckets in display order', () => {
            const items = [
                reference('translation', TRANSLATION_PROJECT_MODEL_PATH),
                reference('collection', COLLECTION_MODEL_PATH),
            ];

            const buckets = bucketReferences(items, openFragmentTokens, 'en_US');

            expect(buckets.map((b) => b.key)).to.deep.equal(['collections', 'localizationProjects']);
        });

        it('adds the resolved promotion project to the promo bucket', () => {
            const promotionProject = { id: 'promo-id', path: '/content/dam/mas/promotions/augdemo', title: 'AugDemo' };

            const [promoBucket] = bucketReferences([], openFragmentTokens, 'en_US', promotionProject);

            expect(promoBucket.key).to.equal('promoProjects');
            expect(promoBucket.rows[0].title).to.equal('AugDemo');
        });

        [
            ['bulkPublishProjects', BULK_PUBLISH_PROJECT_MODEL_PATH, PAGE_NAMES.BULK_PUBLISH_EDITOR, 'bulkPublishProjectId'],
            ['promoProjects', PROMOTION_MODEL_PATH, PAGE_NAMES.PROMOTIONS_EDITOR, 'promotionId'],
            ['localizationProjects', TRANSLATION_PROJECT_MODEL_PATH, PAGE_NAMES.TRANSLATION_EDITOR, 'translationProjectId'],
        ].forEach(([key, modelPath, page, param]) => {
            it(`links a ${key} row to ${page} on the open fragment surface`, () => {
                const [projectBucket] = bucketReferences([reference('proj-1', modelPath)], openFragmentTokens, 'en_US');

                expect(projectBucket.key).to.equal(key);
                expect(hashParams(projectBucket.rows[0].link)).to.deep.equal({
                    page,
                    [param]: 'proj-1',
                    path: 'acom',
                });
            });
        });

        it('leaves other references unlinked', () => {
            const [otherBucket] = bucketReferences([reference('unknown', '/conf/x')], openFragmentTokens, 'en_US');

            expect(otherBucket.key).to.equal('other');
            expect(otherBucket.rows[0].link).to.equal(null);
        });
    });

    describe('getReferencingFragments', () => {
        const fragment = { id: 'card-id', path: '/content/dam/mas/acom/en_US/my-card', locale: 'en_US' };
        const bucket = (result, key) => result.buckets.find((b) => b.key === key);
        const coll = (locale, id, title, status, surface = 'acom') => ({
            path: `/content/dam/mas/${surface}/${locale}/plans-two-wide-reflow-all`,
            id,
            title,
            status,
            model: { path: COLLECTION_MODEL_PATH },
        });

        it('excludes false positives and buckets the rest by type in display order', async () => {
            const referencedBy = [
                coll('en_US', 'coll-en', 'Plans', 'PUBLISHED'),
                coll('fr_FR', 'coll-fr', 'Plans FR', 'DRAFT'),
                { path: '/content/dam/mas/acom/fr_FR/my-card', id: 'self-locale-variation', model: { path: CARD_MODEL_PATH } },
                coll('en_US', 'cross-surface', 'Plans', 'PUBLISHED', 'nala'),
                {
                    path: `/content/dam/mas/acom/${BULK_PUBLISH_PROJECTS_FOLDER}/holiday-push`,
                    id: 'project-1',
                    title: 'Holiday Push',
                    status: 'PUBLISHED',
                    model: { path: BULK_PUBLISH_PROJECT_MODEL_PATH },
                },
                {
                    path: '/content/dam/mas/promotions/summer-sale',
                    id: 'promo-proj',
                    title: 'Summer',
                    model: { path: PROMOTION_MODEL_PATH },
                },
                {
                    path: '/content/dam/mas/acom/translations/loc-1',
                    id: 'loc-proj',
                    title: 'Loc',
                    model: { path: TRANSLATION_PROJECT_MODEL_PATH },
                },
            ];
            const getReferencedByFragmentId = sandbox.stub().resolves({ items: referencedBy });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const result = await getReferencingFragments(aem, fragment);

            expect(getReferencedByFragmentId.calledWith('card-id')).to.be.true;
            expect(result.buckets.map((b) => b.key)).to.deep.equal([
                'collections',
                'promoProjects',
                'bulkPublishProjects',
                'localizationProjects',
            ]);
            const collections = bucket(result, 'collections');
            expect(collections.label).to.equal('Collections');
            expect(collections.rows).to.have.lengthOf(1);
            expect(collections.rows[0].path).to.equal('/content/dam/mas/acom/en_US/plans-two-wide-reflow-all');
            expect(bucket(result, 'bulkPublishProjects').rows[0].title).to.equal('Holiday Push');
            expect(bucket(result, 'promoProjects').rows[0].link).to.include('promotionId=promo-proj');
            expect(bucket(result, 'localizationProjects').rows[0].link).to.include('translationProjectId=loc-proj');
        });

        it('lists collection variations that hold the card as collections of their own', async () => {
            const referencedBy = [
                {
                    path: `/content/dam/mas/acom/en_US/${PZN_FOLDER}/black-friday/my-collection`,
                    id: 'pzn-collection',
                    model: { path: COLLECTION_MODEL_PATH },
                },
                {
                    path: `/content/dam/mas/acom/en_US/${PROMOTIONS_PATH_PREFIX}black-friday/my-collection`,
                    id: 'promo-collection',
                    model: { path: COLLECTION_MODEL_PATH },
                },
            ];
            const getReferencedByFragmentId = sandbox.stub().resolves({ items: referencedBy });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const result = await getReferencingFragments(aem, fragment);

            expect(bucket(result, 'collections').rows.map((row) => row.path)).to.deep.equal(
                referencedBy.map((item) => item.path),
            );
        });

        describe('promo variations', () => {
            const promoVariation = {
                id: 'variation-id',
                path: `/content/dam/mas/sandbox/en_US/${PROMOTIONS_PATH_PREFIX}augdemo/marquee`,
                tags: [{ id: 'mas:promotion/augdemo' }],
            };
            const project = (id, promoName) => ({
                id,
                path: `/content/dam/mas/promotions/${promoName}`,
                title: promoName,
                tags: [{ id: `mas:promotion/${promoName}` }],
            });
            const noReferences = () => ({
                sites: { cf: { fragments: { getReferencedByFragmentId: sandbox.stub().resolves({ items: [] }) } } },
            });

            it('lists the project a promo variation belongs to, which referencedBy never returns', async () => {
                const loadPromotionProjects = sandbox
                    .stub()
                    .resolves([project('other-id', 'springsale'), project('aug-id', 'augdemo')]);

                const result = await getReferencingFragments(noReferences(), promoVariation, { loadPromotionProjects });

                const [row] = bucket(result, 'promoProjects').rows;
                expect(row.link).to.include('promotionId=aug-id');
            });

            it('does not load promotion projects for a fragment without a promotion tag', async () => {
                const loadPromotionProjects = sandbox.stub().resolves([]);

                await getReferencingFragments(noReferences(), fragment, { loadPromotionProjects });

                expect(loadPromotionProjects.called).to.be.false;
            });

            describe('when the promotion-project lookup rejects', () => {
                const withCollection = () => ({
                    sites: {
                        cf: {
                            fragments: {
                                getReferencedByFragmentId: sandbox
                                    .stub()
                                    .resolves({ items: [coll('en_US', 'coll-en', 'Plans', 'PUBLISHED', 'sandbox')] }),
                            },
                        },
                    },
                });
                const rejectingLoader = () => sandbox.stub().rejects(new Error('promotions 500'));

                beforeEach(() => {
                    sandbox.stub(console, 'error');
                });

                it('keeps the references that were already fetched', async () => {
                    const result = await getReferencingFragments(withCollection(), promoVariation, {
                        loadPromotionProjects: rejectingLoader(),
                    });

                    expect(result.buckets.map((b) => b.key)).to.deep.equal(['collections']);
                });

                it('flags the lookup failure', async () => {
                    const result = await getReferencingFragments(withCollection(), promoVariation, {
                        loadPromotionProjects: rejectingLoader(),
                    });

                    expect(result.promotionLookupFailed).to.be.true;
                });
            });
        });

        it('returns no buckets and no lookup failure when there are no references', async () => {
            const getReferencedByFragmentId = sandbox.stub().resolves({ items: [] });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };
            expect(await getReferencingFragments(aem, fragment)).to.deep.equal({ buckets: [], promotionLookupFailed: false });
        });

        it('assembles references across multiple pages before filtering and grouping', async () => {
            const getReferencedByFragmentId = sandbox.stub();
            getReferencedByFragmentId.onCall(0).resolves({
                items: [coll('en_US', 'a-id', 'A', 'PUBLISHED')],
                cursor: 'page-2',
            });
            getReferencedByFragmentId.onCall(1).resolves({ items: [coll('fr_FR', 'a-fr-id', 'A', 'DRAFT')] });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const result = await getReferencingFragments(aem, fragment);

            expect(getReferencedByFragmentId.calledTwice).to.be.true;
            expect(bucket(result, 'collections').rows.map((row) => row.path)).to.deep.equal([
                '/content/dam/mas/acom/en_US/plans-two-wide-reflow-all',
            ]);
        });
    });

    describe('review coverage: links, default-locale representative, error propagation', () => {
        const collItem = (locale, id) => ({
            type: 'content-fragment',
            title: `Plans All ${locale}`,
            path: `/content/dam/mas/acom/${locale}/plans-all`,
            status: 'PUBLISHED',
            id,
            model: { path: COLLECTION_MODEL_PATH },
        });

        it('picks the default-locale representative when the open locale is absent, and builds its deep link', () => {
            // open fragment is an acom en_US card; user viewing fr_CA, whose acom default locale is fr_FR
            const openFragmentTokens = { surface: 'acom', parsedLocale: 'en_US', fragmentPath: 'some-card' };
            const items = [collItem('en_US', 'en1'), collItem('fr_FR', 'fr1'), collItem('de_DE', 'de1')];
            const [group] = groupReferencesByCollection(items, openFragmentTokens, 'fr_CA');
            // fr_CA is absent → falls back to the surface default (fr_FR), NOT items[0] (en_US)
            expect(group.path).to.equal('/content/dam/mas/acom/fr_FR/plans-all');
            // link-ready: the headline feature of the GET-by-id endpoint
            expect(hashParams(group.link).query).to.equal('fr1');
        });

        it('links a collection row on its surface, not its DAM path', () => {
            const openFragmentTokens = { surface: 'acom', parsedLocale: 'en_US', fragmentPath: 'some-card' };
            const [group] = groupReferencesByCollection([collItem('en_US', 'en1')], openFragmentTokens, 'en_US');
            expect(hashParams(group.link).path).to.equal('acom');
        });

        it('propagates an error from getReferencedByFragmentId (never swallows to empty)', async () => {
            const getReferencedByFragmentId = sandbox
                .stub()
                .rejects(new Error('Failed to get referenced by fragment id: 403 Forbidden'));
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };
            let threw = false;
            try {
                await getReferencingFragments(aem, { id: 'card1', path: '/content/dam/mas/acom/en_US/card1' });
            } catch (error) {
                threw = true;
                expect(error.message).to.include('403');
            }
            expect(threw).to.be.true;
        });
    });
});
