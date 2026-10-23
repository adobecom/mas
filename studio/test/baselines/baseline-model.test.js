import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    buildBaselineFolderPath,
    createBaseline,
    prepareBaselineFolder,
    resolveBaselineOffer,
} from '../../src/baselines/baseline-model.js';
import { COMPAT_VERSION, TAG_MERCH_CARD, TAG_MODEL_ID_MAPPING } from '../../src/constants.js';

const FOLDER = '/content/dam/mas/sandbox/fr_FR/baselines/catalog/ccsn_direct_individual';

const baseline = {
    surface: 'sandbox',
    locale: 'fr_FR',
    template: 'catalog',
    productArrangementCode: 'ccsn_direct_individual',
    name: 'my-baseline',
};

const notFoundError = () => Object.assign(new Error('Fragment not found'), { status: 404 });

const createFragmentsApi = (getByPath) => ({
    ensureFolderExists: sinon.stub().resolves(true),
    getByPath,
});

describe('baseline-model', () => {
    it('builds the baseline folder path under <locale>/baselines/<template>/<PA code>', () => {
        expect(buildBaselineFolderPath(baseline)).to.equal(FOLDER);
    });

    it('keeps COM baselines in the PA code folder', () => {
        expect(buildBaselineFolderPath({ ...baseline, marketSegment: 'COM' })).to.equal(FOLDER);
    });

    it('puts segment overrides in a lower-cased segment folder under the PA code', () => {
        expect(buildBaselineFolderPath({ ...baseline, marketSegment: 'EDU' })).to.equal(`${FOLDER}/edu`);
    });

    it('ensures the baseline folder exists', async () => {
        const fragmentsApi = createFragmentsApi(sinon.stub().rejects(notFoundError()));

        await prepareBaselineFolder(fragmentsApi, baseline);

        expect(fragmentsApi.ensureFolderExists.calledOnceWithExactly(FOLDER)).to.be.true;
    });

    it('reports a missing baseline with its folder', async () => {
        const fragmentsApi = createFragmentsApi(sinon.stub().rejects(notFoundError()));

        expect(await prepareBaselineFolder(fragmentsApi, baseline)).to.deep.equal({ folder: FOLDER, exists: false });
    });

    it('reports an existing baseline with the same name', async () => {
        const getByPath = sinon.stub().resolves({ path: `${FOLDER}/my-baseline` });
        const fragmentsApi = createFragmentsApi(getByPath);

        expect(await prepareBaselineFolder(fragmentsApi, baseline)).to.deep.equal({ folder: FOLDER, exists: true });
        expect(getByPath.firstCall.args[0]).to.equal(`${FOLDER}/my-baseline`);
    });

    it('propagates folder creation failures without checking the baseline', async () => {
        const fragmentsApi = {
            ensureFolderExists: sinon.stub().rejects(new Error('Forbidden')),
            getByPath: sinon.stub(),
        };

        const error = await prepareBaselineFolder(fragmentsApi, baseline).catch((err) => err);

        expect(error.message).to.equal('Forbidden');
        expect(fragmentsApi.getByPath.called).to.be.false;
    });

    describe('resolveBaselineOffer', () => {
        let service;

        beforeEach(() => {
            service = document.createElement('mas-commerce-service');
            service.collectPriceOptions = sinon.stub().returns({});
            service.resolveOfferSelectors = sinon.stub();
            document.body.append(service);
        });

        afterEach(() => service.remove());

        it('uses the PA code and segment carried by the offer without a lookup', async () => {
            expect(
                await resolveBaselineOffer('OSI', { productArrangementCode: 'PA-1', market_segments: ['EDU'] }),
            ).to.deep.equal({ productArrangementCode: 'PA-1', marketSegment: 'EDU' });
            expect(service.resolveOfferSelectors.called).to.be.false;
        });

        it('resolves the PA code and segment from the offer selector', async () => {
            service.resolveOfferSelectors.returns([
                Promise.resolve([{ productArrangementCode: 'PA-2', marketSegments: ['GOV'] }]),
            ]);

            expect(await resolveBaselineOffer('OSI', {})).to.deep.equal({
                productArrangementCode: 'PA-2',
                marketSegment: 'GOV',
            });
            expect(service.collectPriceOptions.calledOnceWithExactly({ wcsOsi: 'OSI' })).to.be.true;
        });

        it('gives up when the lookup does not settle in time', async () => {
            service.resolveOfferSelectors.returns([new Promise(() => {})]);

            expect(await resolveBaselineOffer('OSI', {}, 10)).to.deep.equal({
                productArrangementCode: undefined,
                marketSegment: undefined,
            });
        });
    });

    describe('createBaseline', () => {
        const createRepository = (getByPath) => ({
            aem: { sites: { cf: { fragments: createFragmentsApi(getByPath) } } },
            createFragment: sinon.stub().resolves({ id: 'baseline-id' }),
        });

        it('does not create a baseline that already exists', async () => {
            const repository = createRepository(sinon.stub().resolves({ path: `${FOLDER}/my-baseline` }));

            expect(await createBaseline(repository, { ...baseline, title: 'My baseline', osi: 'OSI' })).to.deep.equal({
                exists: true,
            });
            expect(repository.createFragment.called).to.be.false;
        });

        it('creates a card in the baseline folder', async () => {
            const repository = createRepository(sinon.stub().rejects(notFoundError()));

            const result = await createBaseline(repository, { ...baseline, title: 'My baseline', osi: 'OSI' });

            expect(result).to.deep.equal({ folder: FOLDER, fragment: { id: 'baseline-id' } });
            expect(
                repository.createFragment.calledOnceWithExactly({
                    modelId: TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
                    title: 'My baseline',
                    name: 'baseline',
                    parentPath: FOLDER,
                    data: { osi: 'OSI', cardTitle: 'My baseline', variant: 'catalog', compatVersion: COMPAT_VERSION },
                }),
            ).to.be.true;
        });
    });
});
