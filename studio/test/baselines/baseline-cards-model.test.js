import { expect } from '@esm-bundle/chai';
import {
    buildBaselineCardsPlan,
    buildBaselineFields,
    buildBaselineTitle,
    buildCollectionTitle,
    buildPlanCardFields,
    buildPlanTitle,
    checkPlanOffers,
    getPlanOfferError,
    getTrialOsi,
    groupCardsByProduct,
    withPlanTypeTag,
} from '../../src/baselines/baseline-cards-model.js';

const FOLDER = '/content/dam/mas/acom-cc/en_US/mini-compare';
const BASELINES = '/content/dam/mas/acom-cc/en_US/baselines';
const TEMPLATE = 'mini-compare-chart-mweb';

const ILST_TEAM_OSI = 'Z3QWplJj6vfX1gmA3QRemOP9HTCmgt_pSt5GN0SkzxE';
const ILST_INDIVIDUAL_TRIAL_OSI = 'nlYSyCqrsegoFuLBJfEe-QqgnptUzduO5I-jA06CNFI';
const ILST_TEAM = 'ilst_direct_indirect_team';
const CCSN_INDIVIDUAL = 'ccsn_direct_individual';

const wcsOffer = (productArrangementCode, commitment, term, productCode) => ({
    productArrangementCode,
    commitment,
    term,
    marketSegments: ['COM'],
    productArrangement: { productCode },
});

const createCache = () =>
    new Map([
        [ILST_TEAM_OSI, wcsOffer(ILST_TEAM, 'YEAR', 'MONTHLY', 'ILST')],
        [ILST_INDIVIDUAL_TRIAL_OSI, wcsOffer('ilst_direct_individual', 'YEAR', 'MONTHLY', 'ILST')],
        ['ccpro-abm', wcsOffer(CCSN_INDIVIDUAL, 'YEAR', 'MONTHLY', 'CCSN')],
        ['ccpro-abm-trial', wcsOffer(CCSN_INDIVIDUAL, 'YEAR', 'MONTHLY', 'CCSN')],
        ['ccpro-m2m', wcsOffer(CCSN_INDIVIDUAL, 'MONTH', 'MONTHLY', 'CCSN')],
        ['ccpro-m2m-trial', wcsOffer(CCSN_INDIVIDUAL, 'MONTH', 'MONTHLY', 'CCSN')],
        ['ccpro-puf', wcsOffer(CCSN_INDIVIDUAL, 'YEAR', 'ANNUAL', 'CCSN')],
        ['ccpro-puf-trial', wcsOffer(CCSN_INDIVIDUAL, 'YEAR', 'ANNUAL', 'CCSN')],
        ['unknown-osi', null],
    ]);

const longText = { type: 'long-text', mimeType: 'text/html' };
const field = (name, values, options = {}) => ({ name, type: 'text', multiple: false, values, ...options });

const pricesHtml = (osi) => `<p><span is="inline-price" data-template="price" data-wcs-osi="${osi}"></span></p>`;
const buyNow = (osi) =>
    `<a is="checkout-link" data-wcs-osi="${osi}" data-checkout-workflow-step="email" data-analytics-id="buy-now" class="con-button blue">Buy now</a>`;
const freeTrial = (osi) =>
    `<a is="checkout-link" data-wcs-osi="${osi}" data-analytics-id="free-trial" data-modal="twp" class="con-button">Free trial</a>`;
const SEE_TERMS = '<a is="checkout-link" data-wcs-osi="terms-osi" data-analytics-id="see-terms">See terms</a>';
const ctasHtml = (osi, trialOsi) => `<p slot="footer">${buyNow(osi)}${freeTrial(trialOsi)}${SEE_TERMS}</p>`;

const createCard = ({ title, cardName, osi, trialOsi, variant = TEMPLATE }) => ({
    id: title,
    title,
    path: `${FOLDER}/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    tags: [{ id: 'mas:plan_type/abm' }, { id: 'mas:product_code/ilst' }],
    fields: [
        field('variant', [variant]),
        field('osi', [osi]),
        field('cardTitle', ['<h3>Illustrator</h3>']),
        field('cardName', [cardName]),
        field('description', ['<p>Get Illustrator.</p>'], longText),
        field('mnemonicIcon', ['illustrator.svg'], { multiple: true }),
        field('badge', [''], longText),
        field('prices', [pricesHtml(osi)], longText),
        field('ctas', [ctasHtml(osi, trialOsi)], longText),
        field('callout', ['<p>{{old-disclaimer}}</p>'], longText),
        field('tags', ['mas:plan_type/abm', 'mas:product_code/ilst'], { type: 'tag', multiple: true }),
        field('variations', [`${FOLDER}/variation`], { type: 'content-fragment', multiple: true }),
        field('originalId', ['original-id']),
        field('compatVersion', [2], { type: 'number' }),
    ],
});

const illustratorTeamCard = () =>
    createCard({
        title: 'CC: Mini Compare Mweb: Illustrator: Team: default',
        cardName: 'CC Mini Compare: Illustrator: Teams: default',
        osi: ILST_TEAM_OSI,
        trialOsi: ILST_INDIVIDUAL_TRIAL_OSI,
    });

const ccProCard = () =>
    createCard({
        title: 'CC: Mini Compare Mweb: CC Pro: Individual: default',
        cardName: 'CC Mini Compare: CC Pro: Individual: default',
        osi: 'ccpro-abm',
        trialOsi: 'ccpro-abm-trial',
    });

const getField = (fields, name) => fields.find((item) => item.name === name);

const ccProProduct = (offers) => ({
    productArrangementCode: CCSN_INDIVIDUAL,
    marketSegment: 'COM',
    productCode: 'CCSN',
    cards: [ccProCard()],
    offers,
});

const ALL_CC_PRO_OFFERS = {
    abm: { osi: 'ccpro-abm', trialOsi: 'ccpro-abm-trial' },
    m2m: { osi: 'ccpro-m2m', trialOsi: 'ccpro-m2m-trial' },
    puf: { osi: 'ccpro-puf', trialOsi: 'ccpro-puf-trial' },
};

const checkedProducts = async (products, cache = createCache()) =>
    Promise.all(products.map(async (product) => ({ ...product, offers: await checkPlanOffers(product, { cache }) })));

describe('baseline-cards-model', () => {
    describe('groupCardsByProduct', () => {
        it('groups the cards by the PA code of their own offer, in paste order', async () => {
            const catalogCard = { ...illustratorTeamCard(), id: 'catalog' };
            catalogCard.fields = catalogCard.fields.map((item) =>
                item.name === 'variant' ? field('variant', ['catalog']) : item,
            );

            const { products } = await groupCardsByProduct([illustratorTeamCard(), ccProCard(), catalogCard], {
                cache: createCache(),
            });

            expect(products.map(({ productArrangementCode, cards }) => [productArrangementCode, cards.length])).to.deep.equal([
                [ILST_TEAM, 2],
                [CCSN_INDIVIDUAL, 1],
            ]);
        });

        it('reads the product, the ABM offer and the ABM trial from the card', async () => {
            const { products } = await groupCardsByProduct([illustratorTeamCard()], { cache: createCache() });

            expect(products[0]).to.deep.include({
                productArrangementCode: ILST_TEAM,
                marketSegment: 'COM',
                productCode: 'ILST',
                offers: { abm: { osi: ILST_TEAM_OSI, trialOsi: ILST_INDIVIDUAL_TRIAL_OSI } },
            });
        });

        it('reports the cards whose offer has no PA code', async () => {
            const card = createCard({ title: 'Unknown: default', osi: 'unknown-osi', trialOsi: 'x' });

            const { products, unresolvedCards } = await groupCardsByProduct([card], { cache: createCache() });

            expect(products).to.deep.equal([]);
            expect(unresolvedCards).to.deep.equal([card]);
        });
    });

    describe('getTrialOsi', () => {
        it('reads the OSI of the free trial CTA', () => {
            expect(getTrialOsi(ccProCard())).to.equal('ccpro-abm-trial');
        });

        it('reads nothing without a free trial CTA', () => {
            expect(getTrialOsi({ fields: [field('ctas', [`<p>${buyNow('osi')}</p>`])] })).to.be.undefined;
        });
    });

    describe('checkPlanOffers', () => {
        it('keeps the Illustrator Team ABM offer and removes its Illustrator Individual trial, without M2M', async () => {
            const product = {
                productArrangementCode: ILST_TEAM,
                offers: { abm: { osi: ILST_TEAM_OSI, trialOsi: ILST_INDIVIDUAL_TRIAL_OSI }, m2m: { osi: '' } },
            };

            expect(await checkPlanOffers(product, { cache: createCache() })).to.deep.equal({
                abm: { osi: ILST_TEAM_OSI, removedTrialOsi: ILST_INDIVIDUAL_TRIAL_OSI },
            });
        });

        it('keeps the offers and trials of Creative Cloud Pro Individual for all three plans', async () => {
            expect(await checkPlanOffers(ccProProduct(ALL_CC_PRO_OFFERS), { cache: createCache() })).to.deep.equal(
                ALL_CC_PRO_OFFERS,
            );
        });

        it('reports an offer of another plan type as an error', async () => {
            const checked = await checkPlanOffers(ccProProduct({ m2m: { osi: 'ccpro-puf' } }), { cache: createCache() });

            expect(checked.m2m.error).to.equal('The offer is YEAR / ANNUAL, M2M needs MONTH / MONTHLY.');
        });
    });

    describe('getPlanOfferError', () => {
        it('reports an offer of another product', () => {
            expect(
                getPlanOfferError(wcsOffer('other_pa', 'YEAR', 'MONTHLY'), { productArrangementCode: ILST_TEAM }, 'abm'),
            ).to.equal(`The offer is for other_pa, not ${ILST_TEAM}.`);
        });

        it('reports an offer that could not be loaded', () => {
            expect(getPlanOfferError(null, { productArrangementCode: ILST_TEAM }, 'abm')).to.equal(
                'The offer could not be loaded.',
            );
        });

        it('accepts an offer of the product and plan', () => {
            expect(getPlanOfferError(wcsOffer(ILST_TEAM, 'YEAR', 'ANNUAL'), { productArrangementCode: ILST_TEAM }, 'puf')).to.be
                .null;
        });
    });

    describe('buildBaselineFields', () => {
        it('takes the non empty card fields but the card own and plan fields', () => {
            expect(buildBaselineFields(ccProCard()).map(({ name }) => name)).to.deep.equal([
                'cardTitle',
                'cardName',
                'description',
                'mnemonicIcon',
            ]);
        });
    });

    describe('buildPlanCardFields', () => {
        const planCardFields = (options) =>
            buildPlanCardFields(ccProCard(), { plan: 'puf', osi: 'ccpro-puf', trialOsi: 'ccpro-puf-trial', ...options });

        it('keeps only the card own, plan and card name fields, without variations and original id', () => {
            expect(planCardFields().map(({ name }) => name)).to.deep.equal([
                'variant',
                'osi',
                'cardName',
                'prices',
                'ctas',
                'callout',
                'tags',
                'compatVersion',
                'enableBaselines',
            ]);
        });

        it('sets the plan offer and enables baselines', () => {
            const fields = planCardFields();

            expect(getField(fields, 'osi').values).to.deep.equal(['ccpro-puf']);
            expect(getField(fields, 'enableBaselines')).to.deep.equal({
                name: 'enableBaselines',
                type: 'boolean',
                multiple: false,
                values: [true],
            });
        });

        it('replaces the plan type tag', () => {
            expect(getField(planCardFields(), 'tags').values).to.deep.equal(['mas:product_code/ilst', 'mas:plan_type/puf']);
        });

        it('inserts the plan in the card name', () => {
            expect(getField(planCardFields(), 'cardName').values).to.deep.equal([
                'CC Mini Compare: CC Pro: Individual: PUF: default',
            ]);
        });

        it('puts the disclaimer placeholder in the callout', () => {
            expect(
                getField(planCardFields({ disclaimerKey: 'cc-pricing-legal-disclaimer-puf' }), 'callout').values,
            ).to.deep.equal(['<p>{{cc-pricing-legal-disclaimer-puf}}</p>']);
        });

        it('empties the callout without a disclaimer key', () => {
            expect(getField(planCardFields(), 'callout').values).to.deep.equal(['']);
        });

        it('gives prices and Buy now the plan offer and Free trial the plan trial, keeping the rest of the markup', () => {
            const fields = planCardFields();

            expect(getField(fields, 'prices').values).to.deep.equal([pricesHtml('ccpro-puf')]);
            expect(getField(fields, 'ctas').values).to.deep.equal([ctasHtml('ccpro-puf', 'ccpro-puf-trial')]);
        });

        it('removes the Free trial CTA without a plan trial', () => {
            expect(getField(planCardFields({ trialOsi: undefined }), 'ctas').values).to.deep.equal([
                `<p slot="footer">${buyNow('ccpro-puf')}${SEE_TERMS}</p>`,
            ]);
        });

        it('adds the offer and the callout to a card without them', () => {
            const card = { fields: [field('variant', [TEMPLATE])] };

            const fields = buildPlanCardFields(card, { plan: 'abm', osi: 'osi', disclaimerKey: 'key' });

            expect(fields.map(({ name, values }) => [name, values])).to.deep.equal([
                ['variant', [TEMPLATE]],
                ['osi', ['osi']],
                ['enableBaselines', [true]],
                ['callout', ['<p>{{key}}</p>']],
            ]);
        });
    });

    describe('titles', () => {
        it('inserts the plan before the last part of a card title', () => {
            expect(buildPlanTitle('CC: Mini Compare Mweb: Illustrator: Team: default', 'puf')).to.equal(
                'CC: Mini Compare Mweb: Illustrator: Team: PUF: default',
            );
        });

        it('replaces a plan already in the card title', () => {
            expect(buildPlanTitle('CC: Illustrator: Team: ABM: default', 'm2m')).to.equal(
                'CC: Illustrator: Team: M2M: default',
            );
        });

        it('ends a baseline title with baseline', () => {
            expect(buildBaselineTitle('CC: Mini Compare Mweb: Illustrator: Team: default')).to.equal(
                'CC: Mini Compare Mweb: Illustrator: Team: baseline',
            );
        });

        it('builds a collection title from the card prefix and template, the label and the plan', () => {
            expect(
                buildCollectionTitle(
                    'CC: Mini Compare Mweb: Illustrator: Team: default',
                    'Illustrator and CC Pro plans',
                    'abm',
                ),
            ).to.equal('CC: Mini Compare Mweb: Illustrator and CC Pro plans: ABM');
        });
    });

    describe('withPlanTypeTag', () => {
        it('normalizes tag ids and keeps a single plan type tag', () => {
            expect(
                withPlanTypeTag([{ id: 'mas:plan_type/abm' }, '/content/cq:tags/mas/product_code/ilst'], 'm2m'),
            ).to.deep.equal(['mas:product_code/ilst', 'mas:plan_type/m2m']);
        });
    });

    describe('buildBaselineCardsPlan', () => {
        const LABEL = 'Illustrator and CC Pro plans';

        const illustratorTeamProduct = () => ({
            productArrangementCode: ILST_TEAM,
            marketSegment: 'COM',
            productCode: 'ILST',
            cards: [illustratorTeamCard()],
            offers: { abm: { osi: ILST_TEAM_OSI, trialOsi: ILST_INDIVIDUAL_TRIAL_OSI } },
        });

        const buildPlan = async (products, disclaimerKeys) =>
            buildBaselineCardsPlan({
                surface: 'acom-cc',
                products: await checkedProducts(products),
                label: LABEL,
                disclaimerKeys,
            });

        it('builds the Illustrator Team baseline, ABM card without trial and ABM collection', async () => {
            const items = await buildPlan([illustratorTeamProduct()]);

            expect(items.map(({ type, path }) => [type, path])).to.deep.equal([
                ['baseline', `${BASELINES}/${TEMPLATE}/${ILST_TEAM}/baseline`],
                ['card', `${FOLDER}/cc-mini-compare-mweb-illustrator-team-abm-default`],
                ['collection', `${FOLDER}/cc-mini-compare-mweb-illustrator-and-cc-pro-plans-abm`],
            ]);
            expect(getField(items[1].fields, 'ctas').values).to.deep.equal([
                `<p slot="footer">${buyNow(ILST_TEAM_OSI)}${SEE_TERMS}</p>`,
            ]);
        });

        it('builds the baseline for createBaseline with the card content as seed fields', async () => {
            const [baseline] = await buildPlan([illustratorTeamProduct()]);

            expect(baseline).to.deep.include({
                title: 'CC: Mini Compare Mweb: Illustrator: Team: baseline',
                osi: ILST_TEAM_OSI,
                surface: 'acom-cc',
                locale: 'en_US',
                template: TEMPLATE,
                productArrangementCode: ILST_TEAM,
                marketSegment: 'COM',
                productCode: 'ILST',
            });
            expect(baseline.fields).to.deep.equal(buildBaselineFields(illustratorTeamCard()));
        });

        it('builds a card per plan of Creative Cloud Pro Individual with its title, tags and disclaimer', async () => {
            const items = await buildPlan([ccProProduct(ALL_CC_PRO_OFFERS)], { abm: 'cc-pricing-legal-disclaimer-abm' });
            const cards = items.filter(({ type }) => type === 'card');

            expect(cards.map(({ plan, title, tags }) => [plan, title, tags.at(-1)])).to.deep.equal([
                ['abm', 'CC: Mini Compare Mweb: CC Pro: Individual: ABM: default', 'mas:plan_type/abm'],
                ['m2m', 'CC: Mini Compare Mweb: CC Pro: Individual: M2M: default', 'mas:plan_type/m2m'],
                ['puf', 'CC: Mini Compare Mweb: CC Pro: Individual: PUF: default', 'mas:plan_type/puf'],
            ]);
            expect(cards.map(({ fields }) => getField(fields, 'callout').values[0])).to.deep.equal([
                '<p>{{cc-pricing-legal-disclaimer-abm}}</p>',
                '',
                '',
            ]);
        });

        it('leaves products without a plan out of that collection', async () => {
            const items = await buildPlan([illustratorTeamProduct(), ccProProduct(ALL_CC_PRO_OFFERS)]);
            const collections = items.filter(({ type }) => type === 'collection');

            expect(collections.map(({ title, cards }) => [title, cards])).to.deep.equal([
                [
                    `CC: Mini Compare Mweb: ${LABEL}: ABM`,
                    [
                        `${FOLDER}/cc-mini-compare-mweb-illustrator-team-abm-default`,
                        `${FOLDER}/cc-mini-compare-mweb-cc-pro-individual-abm-default`,
                    ],
                ],
                [`CC: Mini Compare Mweb: ${LABEL}: M2M`, [`${FOLDER}/cc-mini-compare-mweb-cc-pro-individual-m2m-default`]],
                [`CC: Mini Compare Mweb: ${LABEL}: PUF`, [`${FOLDER}/cc-mini-compare-mweb-cc-pro-individual-puf-default`]],
            ]);
            expect(getField(collections[1].fields, 'cards').values).to.deep.equal(collections[1].cards);
        });

        it('builds no ABM card nor ABM collection for a product without ABM, keeping its baseline', async () => {
            const items = await buildPlan([ccProProduct({ abm: { osi: '' }, puf: ALL_CC_PRO_OFFERS.puf })]);

            expect(items.map(({ type, plan }) => [type, plan])).to.deep.equal([
                ['baseline', undefined],
                ['card', 'puf'],
                ['collection', 'puf'],
            ]);
        });

        it('builds no card for an invalid offer', async () => {
            const items = await buildPlan([ccProProduct({ abm: ALL_CC_PRO_OFFERS.abm, m2m: { osi: 'ccpro-puf' } })]);

            expect(items.filter(({ type }) => type === 'card').map(({ plan }) => plan)).to.deep.equal(['abm']);
        });

        it('builds one baseline per template and PA code', async () => {
            const product = ccProProduct(ALL_CC_PRO_OFFERS);
            product.cards.push({ ...ccProCard(), id: 'duplicate', title: 'CC: Mini Compare Mweb: CC Pro: Individual: alt' });

            const items = await buildPlan([product]);

            expect(items.filter(({ type }) => type === 'baseline')).to.have.length(1);
        });
    });
});
