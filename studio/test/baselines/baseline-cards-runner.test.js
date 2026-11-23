import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { findExistingItems, ITEM_STATUS, runBaselineCardsPlan } from '../../src/baselines/baseline-cards-runner.js';
import Store from '../../src/store.js';
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
    fields: [{ name: 'osi', type: 'text', multiple: false, values: [`${plan}-osi`] }],
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
    fields: [{ name: 'cards', type: 'content-fragment', multiple: true, values: [`${CARDS_FOLDER}/${plan}-card`] }],
});

const ITEMS = [baseline, card('abm'), card('puf'), collection('abm'), collection('puf')];
const PATHS = ITEMS.map(({ path }) => path);

const notFoundError = () => Object.assign(new Error('Fragment not found'), { status: 404 });

const createRepository = (existingPaths = []) => {
    const getByPath = sinon.stub().rejects(notFoundError());
    for (const path of existingPaths) getByPath.withArgs(path).resolves({ id: `existing-${path}`, path });
    return {
        aem: {
            tags: { exists: sinon.stub().resolves(true) },
            sites: { cf: { fragments: { ensureFolderExists: sinon.stub().resolves(true), getByPath } } },
        },
        createFragment: sinon.stub().callsFake(async ({ parentPath, name }) => ({ id: name, path: `${parentPath}/${name}` })),
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
            expect(results.get(card('abm').path).fragment).to.deep.equal({ id: 'abm-card', path: card('abm').path });
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
            expect(results.get(baseline.path).fragment).to.deep.equal({ id: `existing-${baseline.path}`, path: baseline.path });
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

        it('reuses the fragment at the item path when the create answers 409', async () => {
            const repository = createRepository();
            const existingCard = { id: 'existing-abm-card', path: card('abm').path };
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
    });
});
