import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    findExistingItems,
    getItemIdentity,
    ITEM_STATUS,
    reuse,
    runBaselineCardsPlan,
} from '../../src/baselines/baseline-cards-runner.js';
import Store from '../../src/store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { TAG_MERCH_CARD, TAG_MERCH_CARD_COLLECTION, TAG_MODEL_ID_MAPPING } from '../../src/constants.js';

const CARDS_FOLDER = '/content/dam/mas/sandbox/en_US/cards';
const BASELINE_FOLDER = '/content/dam/mas/sandbox/en_US/baselines/mini-compare-chart/ilst_direct_team';

const baseline = {
    type: 'baseline',
    path: `${BASELINE_FOLDER}/baseline`,
    title: 'CC: Mini Compare: Illustrator: Team: baseline',
    osi: 'ABM-OSI',
    surface: 'sandbox',
    locale: 'en_US',
    template: 'mini-compare-chart',
    productArrangementCode: 'ilst_direct_team',
    productCode: 'ILST',
    fields: [],
};

const card = (plan) => ({
    type: 'card',
    plan,
    path: `${CARDS_FOLDER}/${plan}-card`,
    parentPath: CARDS_FOLDER,
    name: `${plan}-card`,
    title: `CC: Mini Compare: Illustrator: Team: ${plan.toUpperCase()}: default`,
    baseline: `${BASELINE_FOLDER}/baseline`,
    fields: [
        { name: 'variant', type: 'text', multiple: false, values: ['mini-compare-chart'] },
        { name: 'osi', type: 'text', multiple: false, values: [`${plan}-osi`] },
        { name: 'enableBaselines', type: 'boolean', multiple: false, values: [true] },
    ],
    tags: [`mas:plan_type/${plan}`],
});

const collection = (plan) => ({
    type: 'collection',
    plan,
    path: `${CARDS_FOLDER}/${plan}-collection`,
    parentPath: CARDS_FOLDER,
    name: `${plan}-collection`,
    title: `CC: Mini Compare: Illustrator: ${plan.toUpperCase()}`,
    cards: [`${CARDS_FOLDER}/${plan}-card`],
    fields: [
        { name: 'cards', type: 'content-fragment', multiple: true, values: [`${CARDS_FOLDER}/${plan}-card`] },
        { name: 'enableBaselines', type: 'boolean', multiple: false, values: [true] },
    ],
});

const ITEMS = [baseline, card('abm'), card('puf'), collection('abm'), collection('puf')];
const PATHS = ITEMS.map(({ path }) => path);
const BASELINE_TAGS = ['mas:product_code/ilst', 'mas:market_segments/com', 'mas:product_arrangement_code/ilst_direct_team'];

const notFoundError = () => Object.assign(new Error('Fragment not found'), { status: 404 });

const existingFragment = (
    item,
    fields = item.type === 'baseline' ? [{ name: 'variant', values: [item.template] }] : item.fields,
) => ({
    id: `existing-${item.path}`,
    path: item.path,
    model: { id: TAG_MODEL_ID_MAPPING[item.type === 'collection' ? TAG_MERCH_CARD_COLLECTION : TAG_MERCH_CARD] },
    fields,
});

const createRepository = (existingPaths = []) => {
    const getByPath = sinon.stub().rejects(notFoundError());
    for (const path of existingPaths) {
        getByPath.withArgs(path).resolves(existingFragment(ITEMS.find((item) => item.path === path)));
    }
    return {
        aem: {
            tags: { exists: sinon.stub().resolves(true) },
            sites: { cf: { fragments: { ensureFolderExists: sinon.stub().resolves(true), getByPath } } },
            saveValidTags: sinon.stub().callsFake(async (id, tags) => tags),
        },
        createFragment: sinon.stub().callsFake(async ({ parentPath, name, tags = [] }) => ({
            id: name,
            path: `${parentPath}/${name}`,
            tags: tags.map((id) => ({ id })),
        })),
    };
};

const run = async (repository, options) => {
    const statuses = [];
    const results = await runBaselineCardsPlan(repository, ITEMS, {
        ...options,
        onStatus: ({ path }, { status }) => statuses.push([path.split('/').pop(), status]),
    });
    return { results, statuses };
};

const finalStatuses = (results) =>
    Object.fromEntries([...results].map(([path, { status }]) => [path.split('/').pop(), status]));

describe('baseline-cards-runner', () => {
    afterEach(() => {
        Store.baselines.list.data.set([]);
        sinon.restore();
    });

    describe('findExistingItems', () => {
        it('returns the fragments found at the item paths', async () => {
            const repository = createRepository([baseline.path]);

            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            expect([...existing.keys()]).to.deep.equal([baseline.path]);
            expect(repository.aem.sites.cf.fragments.getByPath.callCount).to.equal(ITEMS.length);
        });

        it('looks up at most 4 item paths at a time', async () => {
            let inFlight = 0;
            let maxInFlight = 0;
            const getByPath = sinon.stub().callsFake(async () => {
                inFlight += 1;
                maxInFlight = Math.max(maxInFlight, inFlight);
                await new Promise((resolve) => setTimeout(resolve, 5));
                inFlight -= 1;
                throw notFoundError();
            });
            const items = [...ITEMS, card('m2m'), collection('m2m')];

            const existing = await findExistingItems({ getByPath }, items);

            expect(maxInFlight).to.equal(4);
            expect(getByPath.callCount).to.equal(items.length);
            expect(existing.size).to.equal(0);
        });
    });

    describe('runBaselineCardsPlan', () => {
        it('creates baselines, then cards, then collections, reporting each status', async () => {
            const repository = createRepository();

            const { results, statuses } = await run(repository);

            expect(repository.createFragment.args.map(([{ name }]) => name)).to.deep.equal([
                'baseline',
                'abm-card',
                'puf-card',
                'abm-collection',
                'puf-collection',
            ]);
            expect(statuses.slice(0, ITEMS.length).every(([, status]) => status === ITEM_STATUS.PENDING)).to.be.true;
            expect(statuses.slice(ITEMS.length, ITEMS.length + 2)).to.deep.equal([
                ['baseline', ITEM_STATUS.CREATING],
                ['baseline', ITEM_STATUS.CREATED],
            ]);
            expect(Object.values(finalStatuses(results)).every((status) => status === ITEM_STATUS.CREATED)).to.be.true;
            expect(results.get(card('abm').path).fragment).to.deep.equal({
                id: 'abm-card',
                path: card('abm').path,
                tags: [{ id: 'mas:plan_type/abm' }],
            });
            expect(repository.aem.saveValidTags.called).to.be.false;
        });

        it('starts no other item once its signal is aborted', async () => {
            const repository = createRepository();
            const abortController = new AbortController();

            const results = await runBaselineCardsPlan(repository, ITEMS, {
                signal: abortController.signal,
                onStatus: (item, { status }) => {
                    if (status === ITEM_STATUS.CREATED) abortController.abort();
                },
            });

            expect(repository.createFragment.args.map(([{ name }]) => name)).to.deep.equal(['baseline']);
            expect(Object.values(finalStatuses(results))).to.deep.equal([
                ITEM_STATUS.CREATED,
                ITEM_STATUS.PENDING,
                ITEM_STATUS.PENDING,
                ITEM_STATUS.PENDING,
                ITEM_STATUS.PENDING,
            ]);
        });

        it('creates a collection holding a free card, an existing fragment that is not an item', async () => {
            const freeCollection = { ...collection('abm'), cards: [`${CARDS_FOLDER}/free-card`, card('abm').path] };

            const results = await runBaselineCardsPlan(createRepository(), [baseline, card('abm'), freeCollection]);

            expect(results.get(freeCollection.path).status).to.equal(ITEM_STATUS.CREATED);
        });

        it('creates cards & collections with their model, fields & tags, without toasts', async () => {
            const repository = createRepository();

            await run(repository);

            const [cardData, withToast] = repository.createFragment.secondCall.args;
            expect(cardData).to.deep.equal({
                modelId: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
                title: card('abm').title,
                name: 'abm-card',
                parentPath: CARDS_FOLDER,
                fields: card('abm').fields,
                tags: ['mas:plan_type/abm'],
            });
            expect(withToast).to.be.false;
            expect(repository.createFragment.getCall(3).args[0].modelId).to.equal(
                TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION],
            );
            expect(repository.createFragment.firstCall.args[1]).to.be.false;
        });

        it('ensures each folder once per run', async () => {
            const repository = createRepository();

            await run(repository);

            expect(repository.aem.sites.cf.fragments.ensureFolderExists.args).to.deep.equal([
                [BASELINE_FOLDER],
                [CARDS_FOLDER],
            ]);
        });

        it('adds the created baselines to the baselines list', async () => {
            await run(createRepository());

            expect(Store.baselines.list.data.get().map((store) => store.id)).to.deep.equal(['baseline']);
        });

        it('creates nothing when run again with the same plan', async () => {
            const repository = createRepository(PATHS);
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results, statuses } = await run(repository, { existing });

            expect(repository.createFragment.called).to.be.false;
            expect(statuses.every(([, status]) => status === ITEM_STATUS.EXISTS)).to.be.true;
            expect(results.get(baseline.path).fragment).to.deep.equal({
                ...existingFragment(baseline),
                tags: BASELINE_TAGS.map((id) => ({ id })),
            });
        });

        it('saves the missing tags of a reused baseline as tag ids', async () => {
            const repository = createRepository([baseline.path]);
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            await run(repository, { existing });

            expect(repository.aem.saveValidTags.args).to.deep.equal([[`existing-${baseline.path}`, BASELINE_TAGS]]);
        });

        it('reports the saved tags of a reused baseline, on its fragment & its store in the baselines list', async () => {
            const repository = createRepository([baseline.path]);
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);
            const store = new FragmentStore({ id: `existing-${baseline.path}`, tags: [] });
            Store.baselines.list.data.set([store]);
            const onListChange = sinon.spy();
            Store.baselines.list.data.subscribe(onListChange);
            const reported = [];

            await runBaselineCardsPlan(repository, ITEMS, {
                existing,
                onStatus: ({ path }, result) => path === baseline.path && reported.push(result),
            });
            Store.baselines.list.data.unsubscribe(onListChange);

            const tags = BASELINE_TAGS.map((id) => ({ id }));
            expect(reported.at(-1)).to.include({ status: ITEM_STATUS.EXISTS });
            expect(reported.at(-1).fragment.tags).to.deep.equal(tags);
            expect(store.get().tags).to.deep.equal(tags);
            expect(onListChange.callCount).to.equal(2);
        });

        it('saves the missing tags of a reused card, so a restart repairs a card whose tags failed to save', async () => {
            const repository = createRepository([card('abm').path]);
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results } = await run(repository, { existing });

            expect(repository.aem.saveValidTags.args).to.deep.equal([[`existing-${card('abm').path}`, ['mas:plan_type/abm']]]);
            expect(results.get(card('abm').path).status).to.equal(ITEM_STATUS.EXISTS);
            expect(results.get(collection('abm').path).status).to.equal(ITEM_STATUS.CREATED);
        });

        it('fails a reused card whose missing tags cannot be saved, blocking its collection', async () => {
            const repository = createRepository([card('abm').path]);
            repository.aem.saveValidTags.rejects(new Error('Failed to save tags: 500'));
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results } = await run(repository, { existing });

            expect(results.get(card('abm').path)).to.include({
                status: ITEM_STATUS.FAILED,
                error: 'Failed to save tags: 500',
            });
            expect(results.get(collection('abm').path).status).to.equal(ITEM_STATUS.BLOCKED);
        });

        it('creates a baseline whose PA code has no tag, without that tag', async () => {
            const repository = createRepository();
            repository.aem.tags.exists
                .withArgs('/content/cq:tags/mas/product_arrangement_code/ilst_direct_team')
                .resolves(false);

            const { results } = await run(repository);

            expect(results.get(baseline.path).status).to.equal(ITEM_STATUS.CREATED);
            expect(repository.aem.saveValidTags.called).to.be.false;
            expect(repository.aem.tags.exists.callCount).to.equal(3);
            expect(results.get(card('abm').path).status).to.equal(ITEM_STATUS.CREATED);
        });

        it('saves the tags a created baseline misses without checking the taxonomy again', async () => {
            const repository = createRepository();
            const createFragment = repository.createFragment;
            repository.createFragment = sinon
                .stub()
                .callsFake(async (fragment) => ({ ...(await createFragment(fragment)), tags: [] }));

            const { results } = await run(repository);

            expect(results.get(baseline.path).status).to.equal(ITEM_STATUS.CREATED);
            expect(repository.aem.tags.exists.callCount).to.equal(3);
            expect(repository.aem.saveValidTags.firstCall.args).to.deep.equal([
                'baseline',
                ['mas:product_code/ilst', 'mas:market_segments/com', 'mas:product_arrangement_code/ilst_direct_team'],
            ]);
        });

        it('reuses a baseline missing a tag absent from the taxonomy without saving its tags', async () => {
            const repository = createRepository();
            repository.aem.sites.cf.fragments.getByPath.withArgs(baseline.path).resolves({
                ...existingFragment(baseline),
                tags: [{ id: 'mas:product_code/ilst' }, { id: 'mas:market_segments/com' }],
            });
            repository.aem.tags.exists
                .withArgs('/content/cq:tags/mas/product_arrangement_code/ilst_direct_team')
                .resolves(false);
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results } = await run(repository, { existing });

            expect(results.get(baseline.path).status).to.equal(ITEM_STATUS.EXISTS);
            expect(repository.aem.saveValidTags.called).to.be.false;
            expect(results.get(card('abm').path).status).to.equal(ITEM_STATUS.CREATED);
        });

        it('reuses a baseline carrying all its tags without checking the taxonomy', async () => {
            const repository = createRepository();
            repository.aem.sites.cf.fragments.getByPath.withArgs(baseline.path).resolves({
                ...existingFragment(baseline),
                tags: [
                    { id: 'mas:product_code/ilst' },
                    { id: 'mas:market_segments/com' },
                    { id: 'mas:product_arrangement_code/ilst_direct_team' },
                ],
            });
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results } = await run(repository, { existing });

            expect(results.get(baseline.path).status).to.equal(ITEM_STATUS.EXISTS);
            expect(repository.aem.tags.exists.called).to.be.false;
            expect(repository.aem.saveValidTags.called).to.be.false;
        });

        it('fails a reused baseline whose tags cannot be checked, blocking its cards', async () => {
            const repository = createRepository([baseline.path]);
            repository.aem.tags.exists.rejects(new Error('Failed to check tag: 500'));
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results } = await run(repository, { existing });

            expect(results.get(baseline.path)).to.include({
                status: ITEM_STATUS.FAILED,
                error: 'Failed to check tag: 500',
            });
            expect(results.get(baseline.path).fragment.id).to.equal(`existing-${baseline.path}`);
            expect(repository.aem.saveValidTags.called).to.be.false;
            expect(results.get(card('abm').path).status).to.equal(ITEM_STATUS.BLOCKED);
        });

        it('fails a reused baseline when only some of its missing tags are saved, blocking its cards', async () => {
            const repository = createRepository([baseline.path]);
            repository.aem.saveValidTags.callsFake(async (id, tags) => tags.slice(0, -1));
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results } = await run(repository, { existing });

            expect(results.get(baseline.path)).to.include({
                status: ITEM_STATUS.FAILED,
                error: 'Tags could not be saved: mas:product_arrangement_code/ilst_direct_team.',
            });
            expect(results.get(card('abm').path).status).to.equal(ITEM_STATUS.BLOCKED);
        });

        it('creates a baseline without its tags missing from AEM, without blocking its cards & collections', async () => {
            const repository = createRepository();
            const absentTag = 'mas:product_arrangement_code/ilst_direct_team';
            repository.aem.tags.exists
                .withArgs('/content/cq:tags/mas/product_arrangement_code/ilst_direct_team')
                .resolves(false);
            repository.aem.saveValidTags.callsFake(async (id, tags) => tags.filter((tag) => tag !== absentTag));

            const { results } = await run(repository);

            expect(repository.aem.saveValidTags.called).to.be.false;
            expect(finalStatuses(results)).to.deep.equal({
                baseline: ITEM_STATUS.CREATED,
                'abm-card': ITEM_STATUS.CREATED,
                'puf-card': ITEM_STATUS.CREATED,
                'abm-collection': ITEM_STATUS.CREATED,
                'puf-collection': ITEM_STATUS.CREATED,
            });
        });

        it('keeps going after a failure and blocks the collections that need the failed card', async () => {
            const repository = createRepository();
            repository.createFragment.withArgs(sinon.match({ name: 'puf-card' })).resolves(undefined);

            const { results } = await run(repository);

            expect(finalStatuses(results)).to.deep.equal({
                baseline: ITEM_STATUS.CREATED,
                'abm-card': ITEM_STATUS.CREATED,
                'puf-card': ITEM_STATUS.FAILED,
                'abm-collection': ITEM_STATUS.CREATED,
                'puf-collection': ITEM_STATUS.BLOCKED,
            });
            expect(repository.createFragment.calledWith(sinon.match({ name: 'puf-collection' }))).to.be.false;
            expect(results.get(card('puf').path).error).to.equal('Failed to create fragment.');
        });

        it('blocks the cards of a failed baseline, and their collections', async () => {
            const repository = createRepository();
            repository.createFragment.withArgs(sinon.match({ name: 'baseline' })).resolves(undefined);

            const { results } = await run(repository);

            expect(finalStatuses(results)).to.deep.equal({
                baseline: ITEM_STATUS.FAILED,
                'abm-card': ITEM_STATUS.BLOCKED,
                'puf-card': ITEM_STATUS.BLOCKED,
                'abm-collection': ITEM_STATUS.BLOCKED,
                'puf-collection': ITEM_STATUS.BLOCKED,
            });
            expect(repository.createFragment.callCount).to.equal(1);
            expect(results.get(card('abm').path).error).to.equal('Its baseline could not be created.');
        });

        it('blocks an existing card whose baseline failed, and its collection', async () => {
            const repository = createRepository([card('abm').path]);
            repository.createFragment.withArgs(sinon.match({ name: 'baseline' })).resolves(undefined);
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results } = await run(repository, { existing });

            expect(results.get(card('abm').path)).to.deep.equal({
                status: ITEM_STATUS.BLOCKED,
                error: 'Its baseline could not be created.',
            });
            expect(results.get(collection('abm').path).status).to.equal(ITEM_STATUS.BLOCKED);
            expect(repository.aem.saveValidTags.called).to.be.false;
            expect(repository.createFragment.callCount).to.equal(1);
        });

        it('reuses the fragment at the item path when the create answers 409', async () => {
            const repository = createRepository();
            const existingCard = existingFragment(card('abm'));
            repository.createFragment
                .withArgs(sinon.match({ name: 'abm-card' }))
                .rejects(new Error('Failed to create fragment: 409 Conflict'));
            repository.aem.sites.cf.fragments.getByPath.withArgs(card('abm').path).resolves(existingCard);

            const { results } = await run(repository);

            expect(results.get(card('abm').path)).to.deep.equal({ status: ITEM_STATUS.EXISTS, fragment: existingCard });
            expect(results.get(collection('abm').path).status).to.equal(ITEM_STATUS.CREATED);
        });

        it('fails the item when nothing is found after a 409', async () => {
            const repository = createRepository();
            repository.createFragment
                .withArgs(sinon.match({ name: 'abm-card' }))
                .rejects(new Error('Failed to create fragment: 409 Conflict'));

            const { results } = await run(repository);

            expect(results.get(card('abm').path)).to.deep.equal({
                status: ITEM_STATUS.FAILED,
                error: 'Failed to create fragment: 409 Conflict',
            });
            expect(results.get(collection('abm').path).status).to.equal(ITEM_STATUS.BLOCKED);
        });

        it('reports a different card at the item path as a conflict, leaving it untouched and blocking its collection', async () => {
            const repository = createRepository();
            const otherCard = existingFragment(card('abm'), [{ name: 'osi', values: ['other-osi'] }]);
            repository.aem.sites.cf.fragments.getByPath.withArgs(card('abm').path).resolves(otherCard);
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results, statuses } = await run(repository, { existing });

            expect(statuses[1]).to.deep.equal(['abm-card', ITEM_STATUS.CONFLICT]);
            expect(results.get(card('abm').path)).to.deep.equal({
                status: ITEM_STATUS.CONFLICT,
                error: 'A different fragment already exists at its path.',
            });
            expect(results.get(collection('abm').path).status).to.equal(ITEM_STATUS.BLOCKED);
            expect(repository.createFragment.calledWith(sinon.match({ name: 'abm-card' }))).to.be.false;
            expect(repository.aem.saveValidTags.called).to.be.false;
        });

        for (const [name, values] of [
            ['variant', ['catalog']],
            ['enableBaselines', [false]],
        ]) {
            it(`reports an existing card with another ${name} as a conflict, leaving it untouched`, async () => {
                const repository = createRepository();
                const fields = card('abm').fields.map((field) => (field.name === name ? { ...field, values } : field));
                repository.aem.sites.cf.fragments.getByPath
                    .withArgs(card('abm').path)
                    .resolves(existingFragment(card('abm'), fields));
                const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

                const { results } = await run(repository, { existing });

                expect(results.get(card('abm').path).status).to.equal(ITEM_STATUS.CONFLICT);
                expect(results.get(collection('abm').path).status).to.equal(ITEM_STATUS.BLOCKED);
                expect(repository.aem.saveValidTags.called).to.be.false;
            });
        }

        it('reports an existing baseline of another template as a conflict and blocks its cards', async () => {
            const repository = createRepository();
            const otherBaseline = existingFragment(baseline, [{ name: 'variant', values: ['catalog'] }]);
            repository.aem.sites.cf.fragments.getByPath.withArgs(baseline.path).resolves(otherBaseline);

            const { results } = await run(repository);

            expect(finalStatuses(results)).to.deep.equal({
                baseline: ITEM_STATUS.CONFLICT,
                'abm-card': ITEM_STATUS.BLOCKED,
                'puf-card': ITEM_STATUS.BLOCKED,
                'abm-collection': ITEM_STATUS.BLOCKED,
                'puf-collection': ITEM_STATUS.BLOCKED,
            });
            expect(repository.createFragment.called).to.be.false;
            expect(repository.aem.saveValidTags.called).to.be.false;
        });

        it('reports a conflict when the collection found after a 409 has other cards', async () => {
            const repository = createRepository();
            repository.createFragment
                .withArgs(sinon.match({ name: 'abm-collection' }))
                .rejects(new Error('Failed to create fragment: 409 Conflict'));
            const otherCollection = existingFragment(collection('abm'), [
                { name: 'cards', values: [card('abm').path, `${CARDS_FOLDER}/other-card`] },
            ]);
            repository.aem.sites.cf.fragments.getByPath.withArgs(collection('abm').path).resolves(otherCollection);

            const { results } = await run(repository);

            expect(results.get(collection('abm').path).status).to.equal(ITEM_STATUS.CONFLICT);
            expect(results.get(collection('puf').path).status).to.equal(ITEM_STATUS.CREATED);
            expect(repository.aem.saveValidTags.called).to.be.false;
        });

        it('reports an existing collection with its cards in another order as a conflict', async () => {
            const plannedCollection = { ...collection('abm'), cards: [card('abm').path, card('puf').path] };
            const repository = createRepository();
            repository.aem.sites.cf.fragments.getByPath
                .withArgs(plannedCollection.path)
                .resolves(
                    existingFragment(plannedCollection, [{ name: 'cards', values: [card('puf').path, card('abm').path] }]),
                );
            const items = [baseline, card('abm'), card('puf'), plannedCollection];
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, items);

            const results = await runBaselineCardsPlan(repository, items, { existing });

            expect(results.get(plannedCollection.path).status).to.equal(ITEM_STATUS.CONFLICT);
        });

        it('reports an existing collection without baselines enabled as a conflict, leaving it untouched', async () => {
            const repository = createRepository();
            const fields = collection('abm').fields.filter(({ name }) => name !== 'enableBaselines');
            repository.aem.sites.cf.fragments.getByPath
                .withArgs(collection('abm').path)
                .resolves(existingFragment(collection('abm'), fields));
            const existing = await findExistingItems(repository.aem.sites.cf.fragments, ITEMS);

            const { results } = await run(repository, { existing });

            expect(results.get(collection('abm').path).status).to.equal(ITEM_STATUS.CONFLICT);
            expect(repository.createFragment.calledWith(sinon.match({ name: 'abm-collection' }))).to.be.false;
        });
    });

    describe('reuse', () => {
        const freeTrialCta = (osi) => `<a data-analytics-id="free-trial" data-wcs-osi="${osi}">Free trial</a>`;
        const withFields = (item, fields) => ({ ...item, fields: [...item.fields, ...fields] });
        const planCard = withFields(card('abm'), [
            { name: 'ctas', values: [freeTrialCta('abm-trial-osi')] },
            { name: 'callout', values: ['<p>{{cc-pricing-legal-disclaimer-abm}}</p>'] },
        ]);
        const labelledCollection = withFields(collection('abm'), [{ name: 'label', values: ['CC Pro'] }]);
        const withValues = (item, name, values) =>
            existingFragment(
                item,
                item.fields.map((field) => (field.name === name ? { ...field, values } : field)),
            );

        for (const [item, name, values] of [
            [planCard, 'ctas', [freeTrialCta('other-trial-osi')]],
            [planCard, 'callout', ['<p>{{cc-pricing-legal-disclaimer-m2m}}</p>']],
            [labelledCollection, 'label', ['CC: Pro']],
        ]) {
            it(`reports an existing ${item.type} with another ${name} as a conflict, with another identity`, () => {
                const fragment = withValues(item, name, values);

                expect(reuse(item, fragment).status).to.equal(ITEM_STATUS.CONFLICT);
                expect(getItemIdentity({ ...item, fields: fragment.fields })).to.not.equal(getItemIdentity(item));
            });
        }

        it('reuses an existing card whose CTAs & callout only differ in markup', () => {
            const fragment = existingFragment(planCard, [
                ...card('abm').fields,
                {
                    name: 'ctas',
                    values: ['<a class="con-button" data-wcs-osi="abm-trial-osi" data-analytics-id="free-trial">Try</a>'],
                },
                { name: 'callout', values: ['<p class="note">{{cc-pricing-legal-disclaimer-abm}}</p>'] },
            ]);

            expect(reuse(planCard, fragment).status).to.equal(ITEM_STATUS.EXISTS);
        });

        it('reports an existing card with a static callout as a conflict when its plan has no disclaimer', () => {
            const fragment = existingFragment(card('abm'), [
                ...card('abm').fields,
                { name: 'callout', values: ['<p>Billed monthly.</p>'] },
            ]);

            expect(reuse(card('abm'), fragment).status).to.equal(ITEM_STATUS.CONFLICT);
        });
    });
});
