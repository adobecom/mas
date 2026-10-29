import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    buildBaselineFolderPath,
    buildBaselineParent,
    createBaseline,
    findCardBaselines,
    parseBaselinePath,
    prepareBaselineFolder,
    resolveBaselineOffer,
} from '../../src/baselines/baseline-model.js';
import { COMPAT_VERSION, TAG_MERCH_CARD, TAG_MODEL_ID_MAPPING, BASELINE_NAME } from '../../src/constants.js';
import { Fragment } from '../../src/aem/fragment.js';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';
import { clearBaselineCache } from '../../../io/www/src/fragment/transformers/offer.js';
import { EXPLICIT_EMPTY_SENTINEL } from '../../../io/www/src/fragment/utils/explicit-empty.js';

const FOLDER = '/content/dam/mas/sandbox/fr_FR/baselines/catalog/ccsn_direct_individual';

const baseline = {
    surface: 'sandbox',
    locale: 'fr_FR',
    template: 'catalog',
    productArrangementCode: 'ccsn_direct_individual',
    name: BASELINE_NAME,
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

    it('parses the template and PA code of a baseline path', () => {
        expect(parseBaselinePath(`${FOLDER}/${BASELINE_NAME}`)).to.deep.equal({
            template: 'catalog',
            productArrangementCode: 'ccsn_direct_individual',
            marketSegment: undefined,
        });
    });

    it('parses the market segment of a segment baseline path', () => {
        expect(parseBaselinePath(`${FOLDER}/edu/${BASELINE_NAME}`)).to.deep.include({ marketSegment: 'edu' });
    });

    it('parses nothing out of a card path', () => {
        expect(parseBaselinePath('/content/dam/mas/sandbox/fr_FR/my-card')).to.be.null;
        expect(parseBaselinePath(undefined)).to.be.null;
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
        const getByPath = sinon.stub().resolves({ path: `${FOLDER}/${BASELINE_NAME}` });
        const fragmentsApi = createFragmentsApi(getByPath);

        expect(await prepareBaselineFolder(fragmentsApi, baseline)).to.deep.equal({ folder: FOLDER, exists: true });
        expect(getByPath.firstCall.args[0]).to.equal(`${FOLDER}/${BASELINE_NAME}`);
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
            const repository = createRepository(sinon.stub().resolves({ path: `${FOLDER}/${BASELINE_NAME}` }));

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
                    name: BASELINE_NAME,
                    parentPath: FOLDER,
                    data: { osi: 'OSI', cardTitle: 'My baseline', variant: 'catalog', compatVersion: COMPAT_VERSION },
                }),
            ).to.be.true;
        });
    });

    describe('findCardBaselines', () => {
        const SURFACE = 'sandbox';
        const LOCALE = 'fr_FR';
        const DEFAULT_LOCALE = getDefaultLocaleCode(SURFACE, LOCALE);
        const PA_FOLDER = `/content/dam/mas/${SURFACE}/${DEFAULT_LOCALE}/baselines/catalog/PA-1`;
        const card = { surface: SURFACE, locale: LOCALE, osi: 'OSI', template: 'catalog' };
        let service;
        let fetchStub;

        const resolvePa = (marketSegment) =>
            service.resolveOfferSelectors.returns([
                Promise.resolve([{ productArrangementCode: 'PA-1', marketSegments: marketSegment ? [marketSegment] : [] }]),
            ]);
        const offersResponse = (body, status = 200) => new Response(JSON.stringify(body), { status });

        beforeEach(() => {
            clearBaselineCache(true);
            service = document.createElement('mas-commerce-service');
            service.collectPriceOptions = sinon.stub().returns({});
            service.resolveOfferSelectors = sinon.stub();
            document.body.append(service);
            fetchStub = sinon.stub(window, 'fetch').resolves(offersResponse({}));
        });

        afterEach(() => {
            service.remove();
            fetchStub.restore();
            clearBaselineCache(true);
        });

        it('looks up nothing without an offer or a template', async () => {
            const getByPath = sinon.stub();

            expect(await findCardBaselines(createFragmentsApi(getByPath), { ...card, osi: '' })).to.be.null;
            expect(await findCardBaselines(createFragmentsApi(getByPath), { ...card, template: '' })).to.be.null;
            expect(getByPath.called).to.be.false;
        });

        it('looks up nothing when the offer has no PA code', async () => {
            service.resolveOfferSelectors.returns([Promise.resolve([{}])]);
            const getByPath = sinon.stub();

            expect(await findCardBaselines(createFragmentsApi(getByPath), card)).to.be.null;
            expect(getByPath.called).to.be.false;
        });

        it('reads the template baseline from the default locale of the card locale', async () => {
            resolvePa('COM');
            const templateBaseline = { id: 'template', fields: [] };
            const getByPath = sinon.stub().resolves(templateBaseline);

            const baselines = await findCardBaselines(createFragmentsApi(getByPath), card);

            expect(getByPath.calledOnce).to.be.true;
            expect(getByPath.firstCall.args[0]).to.equal(`${PA_FOLDER}/${BASELINE_NAME}`);
            expect(baselines.fragmentBaseline).to.equal(templateBaseline);
            expect(baselines.fragmentSegmentBaseline).to.be.null;
        });

        it('also reads the segment baseline of a non COM offer', async () => {
            resolvePa('EDU');
            const getByPath = sinon.stub();
            getByPath.withArgs(`${PA_FOLDER}/${BASELINE_NAME}`).resolves({ id: 'template', fields: [] });
            getByPath.withArgs(`${PA_FOLDER}/edu/${BASELINE_NAME}`).resolves({ id: 'segment', fields: [] });

            const baselines = await findCardBaselines(createFragmentsApi(getByPath), card);

            expect(baselines.fragmentBaseline.id).to.equal('template');
            expect(baselines.fragmentSegmentBaseline.id).to.equal('segment');
        });

        it('reports missing fragment baselines as null', async () => {
            resolvePa('EDU');

            const baselines = await findCardBaselines(createFragmentsApi(sinon.stub().rejects(notFoundError())), card);

            expect(baselines).to.deep.include({ fragmentBaseline: null, fragmentSegmentBaseline: null });
        });

        it('returns the PA code and market segment the baselines were looked up for', async () => {
            resolvePa('EDU');

            const baselines = await findCardBaselines(createFragmentsApi(sinon.stub().resolves(null)), card);

            expect(baselines).to.deep.include({ productArrangementCode: 'PA-1', marketSegment: 'EDU' });
        });

        it('maps the offer baseline to card fields in the authoring format', async () => {
            resolvePa('COM');
            fetchStub.resolves(
                offersResponse({ 'PA-1': { id: 'offer', fields: { name: 'Photoshop', icons: ['ps.svg', 'ps.png'] } } }),
            );

            const { offerBaseline } = await findCardBaselines(createFragmentsApi(sinon.stub().resolves(null)), card);

            expect(fetchStub.firstCall.args[0]).to.include(`locale=${DEFAULT_LOCALE}`);
            expect(offerBaseline.id).to.equal('offer');
            expect(offerBaseline.fields).to.deep.equal([
                { name: 'cardTitle', multiple: false, values: ['Photoshop'] },
                { name: 'mnemonicIcon', multiple: true, values: ['ps.svg'] },
                { name: 'mnemonicAlt', multiple: true, values: ['Photoshop'] },
            ]);
        });

        it('reports a missing offer baseline as null', async () => {
            resolvePa('COM');

            const { offerBaseline } = await findCardBaselines(createFragmentsApi(sinon.stub().resolves(null)), card);

            expect(offerBaseline).to.be.null;
        });
    });

    describe('buildBaselineParent', () => {
        const field = (name, ...values) => ({ name, values });
        const layer = (id, ...fields) => ({ id, fields });

        it('returns null without any baseline', () => {
            expect(buildBaselineParent({ offerBaseline: null, fragmentBaseline: null, fragmentSegmentBaseline: null })).to.be
                .null;
        });

        it('layers offer < template < segment baselines, field by field, with their sources', () => {
            const { fragment, sources } = buildBaselineParent({
                offerBaseline: layer('offer', field('cardTitle', 'Offer title'), field('subtitle', 'Offer subtitle')),
                fragmentBaseline: layer('template', field('cardTitle', 'Template title'), field('badge', 'Template badge')),
                fragmentSegmentBaseline: layer('segment', field('badge', 'Segment badge')),
            });

            expect(fragment).to.be.instanceOf(Fragment);
            expect(fragment.getFieldValues('cardTitle')).to.deep.equal(['Template title']);
            expect(fragment.getFieldValues('subtitle')).to.deep.equal(['Offer subtitle']);
            expect(fragment.getFieldValues('badge')).to.deep.equal(['Segment badge']);
            expect(sources).to.deep.equal({ cardTitle: 'template', subtitle: 'offer', badge: 'segment' });
        });

        it('skips empty values of a higher baseline', () => {
            const { fragment, sources } = buildBaselineParent({
                fragmentBaseline: layer('template', field('subtitle', 'Template subtitle'), field('features', 'a', 'b')),
                fragmentSegmentBaseline: layer('segment', field('subtitle', ''), field('features')),
            });

            expect(fragment.getFieldValues('subtitle')).to.deep.equal(['Template subtitle']);
            expect(fragment.getFieldValues('features')).to.deep.equal(['a', 'b']);
            expect(sources).to.deep.equal({ subtitle: 'template', features: 'template' });
        });

        it('lets the explicit empty sentinel of a higher baseline clear a lower value', () => {
            const { fragment, sources } = buildBaselineParent({
                fragmentBaseline: layer('template', field('badge', 'Template badge')),
                fragmentSegmentBaseline: layer('segment', {
                    name: 'badge',
                    multiple: false,
                    values: [EXPLICIT_EMPTY_SENTINEL],
                }),
            });

            expect(fragment.getFieldValues('badge')).to.deep.equal(['']);
            expect(sources.badge).to.equal('segment');
        });

        it('never provides card identity or system fields', () => {
            const { fragment } = buildBaselineParent({
                fragmentBaseline: layer(
                    'template',
                    field('variant', 'catalog'),
                    field('osi', 'BASELINE-OSI'),
                    field('tags', 'mas:tag'),
                    field('pznTags', 'mas:pzn'),
                    field('variations', 'variation-id'),
                    field('enableBaselines', true),
                    field('locReady', true),
                    field('compatVersion', 2),
                    field('originalId', 'original-id'),
                    field('cardTitle', 'Template title'),
                ),
            });

            expect(fragment.fields.map(({ name }) => name)).to.deep.equal(['cardTitle']);
        });

        it('drops the offer icon and alt text when a higher baseline has an icon', () => {
            const { fragment, sources } = buildBaselineParent({
                offerBaseline: layer('offer', field('mnemonicIcon', 'offer.svg'), field('mnemonicAlt', 'Offer')),
                fragmentBaseline: layer('template', field('mnemonicIcon', 'template.svg')),
            });

            expect(fragment.getFieldValues('mnemonicIcon')).to.deep.equal(['template.svg']);
            expect(fragment.getField('mnemonicAlt')).to.be.undefined;
            expect(sources).to.deep.equal({ mnemonicIcon: 'template' });
        });

        it('drops the offer icon and alt text when the card has its own icon', () => {
            const card = new Fragment({ fields: [field('mnemonicIcon', 'card.svg')] });

            const parent = buildBaselineParent(
                { offerBaseline: layer('offer', field('mnemonicIcon', 'offer.svg'), field('mnemonicAlt', 'Offer')) },
                card,
            );

            expect(parent).to.be.null;
        });

        it('keeps the offer icon and alt text when nothing above has an icon', () => {
            const { fragment } = buildBaselineParent(
                { offerBaseline: layer('offer', field('mnemonicIcon', 'offer.svg'), field('mnemonicAlt', 'Offer')) },
                new Fragment({ fields: [field('mnemonicIcon', '')] }),
            );

            expect(fragment.getFieldValues('mnemonicIcon')).to.deep.equal(['offer.svg']);
            expect(fragment.getFieldValues('mnemonicAlt')).to.deep.equal(['Offer']);
        });
    });
});
