import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import {
    BULK_PUBLISH_PROJECT_MODEL_ID,
    BULK_PUBLISH_PROJECTS_FOLDER,
    COLLECTION_MODEL_PATH,
    PROMOTIONS_PATH_PREFIX,
    PZN_FOLDER,
} from '../../src/constants.js';
import {
    REFERENCED_BY_PAGE_LIMIT,
    buildGroupKey,
    chooseRepresentative,
    fetchAllReferencingItems,
    getReferencingFragments,
    groupBulkPublishProjects,
    groupReferencesByCollection,
    isBulkPublishProjectReference,
    isCrossSurfaceReference,
    isExcludedReference,
    isGroupedVariationReference,
    isPromoVariationReference,
    isSelfLocaleVariationReference,
    parsePathTokens,
} from '../../src/references/references-repository.js';

describe('references-repository', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('isGroupedVariationReference (pzn predicate)', () => {
        it('excludes a pzn grouped-variation path', () => {
            const path = `/content/dam/mas/sandbox/en_US/${PZN_FOLDER}/black-friday/my-card`;
            expect(isGroupedVariationReference(path)).to.be.true;
        });

        it('keeps a plain collection path even when the fragment name contains "pzn"', () => {
            const path = '/content/dam/mas/sandbox/en_US/pzn-template-collection';
            expect(isGroupedVariationReference(path)).to.be.false;
        });
    });

    describe('isPromoVariationReference (promo predicate)', () => {
        it('excludes a fragmentPath rooted at the promotions prefix', () => {
            expect(isPromoVariationReference(`${PROMOTIONS_PATH_PREFIX}black-friday/my-card`)).to.be.true;
        });

        it('keeps a fragmentPath that is not a promo variation', () => {
            expect(isPromoVariationReference('plans-two-wide-reflow-all')).to.be.false;
        });

        it('is false for non-string input', () => {
            expect(isPromoVariationReference(undefined)).to.be.false;
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

        it('returns null for non-string input', () => {
            expect(parsePathTokens(undefined)).to.equal(null);
        });

        it(`suppresses the bogus "${BULK_PUBLISH_PROJECTS_FOLDER}" locale segment`, () => {
            const tokens = parsePathTokens(`/content/dam/mas/acom/${BULK_PUBLISH_PROJECTS_FOLDER}/holiday-push`);
            expect(tokens.surface).to.equal('acom');
            expect(tokens.parsedLocale).to.equal(null);
            expect(tokens.fragmentPath).to.equal('holiday-push');
        });
    });

    describe('buildGroupKey', () => {
        it('groups by surface + fragmentPath, ignoring locale', () => {
            const keyEnUS = buildGroupKey('/content/dam/mas/acom/en_US/plans-two-wide-reflow-all');
            const keyFrFR = buildGroupKey('/content/dam/mas/acom/fr_FR/plans-two-wide-reflow-all');
            expect(keyEnUS).to.equal('acom/plans-two-wide-reflow-all');
            expect(keyEnUS).to.equal(keyFrFR);
        });

        it('falls back to the raw path when PATH_TOKENS does not match', () => {
            const path = '/content/dam/mas/promotions/campaign-card';
            expect(buildGroupKey(path)).to.equal(path);
        });
    });

    describe('isExcludedReference', () => {
        const openFragmentTokens = { surface: 'acom', parsedLocale: 'en_US', fragmentPath: 'my-card' };

        it('excludes pzn parents', () => {
            const reference = { path: `/content/dam/mas/acom/en_US/${PZN_FOLDER}/black-friday/my-collection` };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.true;
        });

        it('excludes promo variation parents', () => {
            const reference = { path: `/content/dam/mas/acom/en_US/${PROMOTIONS_PATH_PREFIX}black-friday/my-collection` };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.true;
        });

        it('excludes the self locale variation', () => {
            const reference = { path: '/content/dam/mas/acom/fr_FR/my-card' };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.true;
        });

        it('excludes cross-surface clones', () => {
            const reference = { path: '/content/dam/mas/nala/en_US/my-collection' };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.true;
        });

        it('keeps a legitimate same-surface collection parent', () => {
            const reference = { path: '/content/dam/mas/acom/en_US/plans-two-wide-reflow-all' };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.false;
        });

        it('keeps an unparseable path rather than excluding it', () => {
            const reference = { path: '/content/dam/mas/acom/weird-path' };
            expect(isExcludedReference(reference, openFragmentTokens)).to.be.false;
        });
    });

    describe('isBulkPublishProjectReference', () => {
        it('identifies a bulk-publish-project parent by model id', () => {
            const reference = { model: { id: BULK_PUBLISH_PROJECT_MODEL_ID } };
            expect(isBulkPublishProjectReference(reference)).to.be.true;
        });

        it('is false for a collection model', () => {
            const reference = { model: { id: 'some-other-model-id' } };
            expect(isBulkPublishProjectReference(reference)).to.be.false;
        });

        it('is false when model is missing', () => {
            expect(isBulkPublishProjectReference({})).to.be.false;
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

        it('returns null for an empty group', () => {
            expect(chooseRepresentative([], 'en_US', 'en_US')).to.equal(null);
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

            const [group] = groupReferencesByCollection(items, openFragmentTokens, 'en_US');

            expect(group.groupKey).to.equal('acom/plans-two-wide-reflow-all');
            expect(group.locales.sort()).to.deep.equal(['en_US', 'fr_FR', 'ja_JP']);
            expect(group.localeCount).to.equal(3);
            expect(group.representative.id).to.equal('en-id');
            expect(group.representative.status).to.equal('PUBLISHED');
        });

        it('keeps distinct collections in separate rows', () => {
            const items = [
                { path: '/content/dam/mas/acom/en_US/collection-a', id: 'a-id' },
                { path: '/content/dam/mas/acom/en_US/collection-b', id: 'b-id' },
            ];

            const groups = groupReferencesByCollection(items, openFragmentTokens, 'en_US');

            expect(groups).to.have.lengthOf(2);
            expect(groups.map((group) => group.groupKey).sort()).to.deep.equal(['acom/collection-a', 'acom/collection-b']);
        });

        it('falls back to the raw path as its own key when PATH_TOKENS does not match', () => {
            const items = [{ path: '/content/dam/mas/promotions/campaign-card', id: 'weird-id' }];

            const [group] = groupReferencesByCollection(items, openFragmentTokens, 'en_US');

            expect(group.groupKey).to.equal('/content/dam/mas/promotions/campaign-card');
            expect(group.locales).to.deep.equal([]);
        });
    });

    describe('groupBulkPublishProjects', () => {
        it('buckets project parents separately, suppressing the locale chip', () => {
            const items = [
                {
                    path: `/content/dam/mas/acom/${BULK_PUBLISH_PROJECTS_FOLDER}/holiday-push`,
                    id: 'project-1',
                    title: 'Holiday Push',
                    status: 'PUBLISHED',
                    model: { id: BULK_PUBLISH_PROJECT_MODEL_ID },
                },
            ];

            const [project] = groupBulkPublishProjects(items);

            expect(project.groupKey).to.equal(items[0].path);
            expect(project.locales).to.deep.equal([]);
            expect(project.localeCount).to.equal(0);
            expect(project.representative.id).to.equal('project-1');
        });

        it('deduplicates repeated project parents by path', () => {
            const item = {
                path: `/content/dam/mas/acom/${BULK_PUBLISH_PROJECTS_FOLDER}/holiday-push`,
                id: 'project-1',
                model: { id: BULK_PUBLISH_PROJECT_MODEL_ID },
            };

            const projects = groupBulkPublishProjects([item, { ...item }]);

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

        it('wraps a provided abort signal for the aem layer', async () => {
            const getReferencedByFragmentId = sandbox.stub().resolves({ items: [] });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };
            const signal = {};

            await fetchAllReferencingItems(aem, 'fragment-id', { signal });

            expect(getReferencedByFragmentId.firstCall.args[1].abortController).to.deep.equal({ signal });
        });
    });

    describe('getReferencingFragments', () => {
        const fragment = { id: 'card-id', path: '/content/dam/mas/acom/en_US/my-card', locale: 'en_US' };

        it('excludes false positives and groups the rest into collections and projects', async () => {
            const referencedBy = [
                {
                    path: '/content/dam/mas/acom/en_US/plans-two-wide-reflow-all',
                    id: 'coll-en',
                    title: 'Plans',
                    status: 'PUBLISHED',
                },
                {
                    path: '/content/dam/mas/acom/fr_FR/plans-two-wide-reflow-all',
                    id: 'coll-fr',
                    title: 'Plans FR',
                    status: 'DRAFT',
                },
                { path: `/content/dam/mas/acom/en_US/${PZN_FOLDER}/black-friday/my-collection`, id: 'pzn-parent' },
                { path: `/content/dam/mas/acom/en_US/${PROMOTIONS_PATH_PREFIX}black-friday/my-collection`, id: 'promo-parent' },
                { path: '/content/dam/mas/acom/fr_FR/my-card', id: 'self-locale-variation' },
                { path: '/content/dam/mas/nala/en_US/plans-two-wide-reflow-all', id: 'cross-surface' },
                {
                    path: `/content/dam/mas/acom/${BULK_PUBLISH_PROJECTS_FOLDER}/holiday-push`,
                    id: 'project-1',
                    title: 'Holiday Push',
                    status: 'PUBLISHED',
                    model: { id: BULK_PUBLISH_PROJECT_MODEL_ID },
                },
            ];
            const getReferencedByFragmentId = sandbox.stub().resolves({ items: referencedBy });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const result = await getReferencingFragments(aem, fragment);

            expect(getReferencedByFragmentId.calledWith('card-id')).to.be.true;
            expect(result.collections).to.have.lengthOf(1);
            expect(result.collections[0].groupKey).to.equal('acom/plans-two-wide-reflow-all');
            expect(result.collections[0].representative.id).to.equal('coll-en');
            expect(result.collections[0].localeCount).to.equal(2);
            expect(result.projects).to.have.lengthOf(1);
            expect(result.projects[0].representative.id).to.equal('project-1');
            expect(result.projects[0].locales).to.deep.equal([]);
        });

        it('returns empty collections and projects when there are no references', async () => {
            const getReferencedByFragmentId = sandbox.stub().resolves({ items: [] });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const result = await getReferencingFragments(aem, fragment);

            expect(result).to.deep.equal({ collections: [], projects: [] });
        });

        it('assembles references across multiple pages before filtering and grouping', async () => {
            const getReferencedByFragmentId = sandbox.stub();
            getReferencedByFragmentId.onCall(0).resolves({
                items: [{ path: '/content/dam/mas/acom/en_US/collection-a', id: 'a-id' }],
                cursor: 'page-2',
            });
            getReferencedByFragmentId.onCall(1).resolves({
                items: [{ path: '/content/dam/mas/acom/fr_FR/collection-a', id: 'a-fr-id' }],
            });
            const aem = { sites: { cf: { fragments: { getReferencedByFragmentId } } } };

            const result = await getReferencingFragments(aem, fragment);

            expect(getReferencedByFragmentId.calledTwice).to.be.true;
            expect(result.collections).to.have.lengthOf(1);
            expect(result.collections[0].localeCount).to.equal(2);
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
            expect(group.localeCount).to.equal(3);
            // fr_CA is absent → falls back to the surface default (fr_FR), NOT items[0] (en_US)
            expect(group.representative.id).to.equal('fr1');
            // link-ready: the headline feature of the GET-by-id endpoint
            expect(group.representative.link).to.be.a('string');
            expect(group.representative.link).to.include('fr1');
        });

        it('links a bulk-publish-project row to the bulk-publish editor (not a card deep link)', () => {
            const project = {
                type: 'content-fragment',
                title: 'Launch EMEA',
                path: '/content/dam/mas/acom/bulk-publish-projects/launch-emea',
                status: 'PUBLISHED',
                id: 'proj1',
                model: { id: BULK_PUBLISH_PROJECT_MODEL_ID, path: '/conf/mas/settings/dam/cfm/models/bulk-publish-project' },
            };
            const [row] = groupBulkPublishProjects([project]);
            expect(row.representative.link).to.be.a('string');
            expect(row.representative.link).to.include('bulkPublishProjectId=proj1');
            expect(row.representative.link).to.not.include('content-type=');
            expect(row.locales).to.deep.equal([]);
            expect(row.localeCount).to.equal(0);
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
