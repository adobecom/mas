import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup, waitUntil } from '@open-wc/testing-helpers/pure';
import { sendKeys } from '@web/test-runner-commands';
import sinon from 'sinon';
import '../../src/swc.js';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, PAGE_NAMES, WCS_LANDSCAPE_DRAFT } from '../../src/constants.js';
import { MasBaselineCards } from '../../src/baselines/mas-baseline-cards.js';
import { MasOfferField } from '../../src/common/components/mas-offer-field.js';
import { clearProductCache } from '../../src/services/product-api.js';

const CARD_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const FOLDER = '/content/dam/mas/acom-cc/en_US/mini-compare';
const DICTIONARY = '/content/dam/mas/acom-cc/en_US/dictionary';

const wcsOffer = (commitment, term) => ({
    productArrangementCode: 'ccsn_direct_individual',
    commitment,
    term,
    marketSegments: ['COM'],
    productArrangement: { productCode: 'CCSN' },
});

const OFFERS = {
    'ccpro-abm': wcsOffer('YEAR', 'MONTHLY'),
    'ccpro-abm-team': wcsOffer('YEAR', 'MONTHLY'),
    'ccpro-abm-trial': wcsOffer('YEAR', 'MONTHLY'),
    'ccpro-m2m': wcsOffer('MONTH', 'MONTHLY'),
    'ccpro-puf': wcsOffer('YEAR', 'ANNUAL'),
    'ccpro-m2m-alt': wcsOffer('MONTH', 'MONTHLY'),
    'ccpro-abm-edu': { ...wcsOffer('YEAR', 'MONTHLY'), marketSegments: ['EDU'] },
};

const longText = { type: 'long-text', multiple: false, mimeType: 'text/html' };
const field = (name, values, options = {}) => ({ name, type: 'text', multiple: false, values, ...options });

const createCard = ({
    id = CARD_ID,
    path = `${FOLDER}/cc-pro-individual`,
    modelPath = CARD_MODEL_PATH,
    osi = 'ccpro-abm',
} = {}) => ({
    id,
    title: 'CC: Mini Compare Mweb: CC Pro: Individual: default',
    path,
    model: { path: modelPath },
    tags: [],
    fields: [
        field('variant', ['mini-compare-chart-mweb']),
        field('osi', [osi]),
        field('cardTitle', ['<h3>Creative Cloud Pro</h3>']),
        field('prices', ['<p><span is="inline-price" data-wcs-osi="ccpro-abm"></span></p>'], longText),
        field(
            'ctas',
            [
                '<p><a is="checkout-link" data-wcs-osi="ccpro-abm" data-analytics-id="buy-now">Buy now</a><a is="checkout-link" data-wcs-osi="ccpro-abm-trial" data-analytics-id="free-trial">Free trial</a></p>',
            ],
            longText,
        ),
        field('callout', [''], longText),
    ],
});

const dictionaryEntry = (key, status) => ({ path: `${DICTIONARY}/${key}`, status, fields: [{ name: 'key', values: [key] }] });

const DICTIONARY_ENTRIES = [
    dictionaryEntry('cc-pricing-legal-disclaimer-abm', 'PUBLISHED'),
    dictionaryEntry('cc-pricing-legal-disclaimer-abm-edu', 'PUBLISHED'),
    dictionaryEntry('cc-pricing-legal-disclaimer-puf', 'DRAFT'),
    dictionaryEntry('cc-pricing-buy-now', 'PUBLISHED'),
];

const notFound = () => Object.assign(new Error('Fragment not found'), { status: 404 });

describe('mas-baseline-cards', () => {
    let sandbox;
    let service;
    let repository;
    let createdFragments;
    let initialSearch;
    let initialPage;
    let initialLandscape;
    let initialBaselines;

    const createRepository = (fragments = { [CARD_ID]: createCard() }) => {
        const getById = sandbox.stub().callsFake(async (id) => {
            if (!fragments[id]) throw new Error('Failed to get fragment: 404 Not Found');
            return fragments[id];
        });
        return {
            aem: {
                tags: { exists: sandbox.stub().resolves(true) },
                saveValidTags: sandbox.stub().callsFake(async (id, tags) => tags),
                sites: {
                    cf: {
                        fragments: {
                            getById,
                            getByPath: sandbox.stub().callsFake(async (path) => {
                                if (!createdFragments.has(path)) throw notFound();
                                return createdFragments.get(path);
                            }),
                            ensureFolderExists: sandbox.stub().resolves(true),
                        },
                    },
                },
            },
            searchFragmentList: sandbox.stub().resolves(DICTIONARY_ENTRIES),
            createFragment: sandbox
                .stub()
                .callsFake(async ({ modelId, parentPath, name, fields = [], data = {}, tags = [] }) => {
                    const path = `${parentPath}/${name}`;
                    const dataFields = Object.entries(data).map(([field, value]) => ({ name: field, values: [value].flat() }));
                    const fragment = {
                        id: path,
                        path,
                        model: { id: modelId },
                        fields: [...fields, ...dataFields],
                        tags: tags.map((id) => ({ id })),
                    };
                    createdFragments.set(path, fragment);
                    return fragment;
                }),
            processError: sandbox.stub(),
        };
    };

    const mount = async () => {
        const el = await fixture(html`<mas-baseline-cards></mas-baseline-cards>`);
        await waitUntil(() => el.disclaimerKeys, 'dictionary keys not loaded');
        return el;
    };

    const query = (el, selector) => el.shadowRoot.querySelector(selector);
    const createButton = (el) => query(el, '.create-actions sp-button');
    const statuses = (el) => [...el.shadowRoot.querySelectorAll('sp-table-cell.status')].map(({ dataset }) => dataset.status);
    const offerField = (el, plan, role = 'osi') =>
        query(el, `.plan[data-plan="${plan}"] .offer[data-role="${role}"] mas-offer-field`);
    const offerButton = (el, plan, role = 'osi') => offerField(el, plan, role).shadowRoot.querySelector('sp-action-button');
    const removeButton = (el, plan, role = 'osi') =>
        query(el, `.plan[data-plan="${plan}"] .offer[data-role="${role}"] > sp-action-button`);

    const pasteLinks = async (el, text) => {
        const links = query(el, '#links');
        links.value = text;
        links.dispatchEvent(new Event('input'));
        await el.updateComplete;
    };

    const selectOffer = async (el, plan, osi, role = 'osi') => {
        await waitUntil(() => offerField(el, plan, role), 'offers not shown');
        offerField(el, plan, role).dispatchEvent(new CustomEvent('change', { detail: { osi, offer: null } }));
        await el.updateComplete;
    };

    const beforeUnloadPrevented = () => {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        return event.defaultPrevented;
    };

    const waitForCreatable = (el, rows) =>
        waitUntil(
            () => el.shadowRoot.querySelectorAll('sp-table-row').length === rows && !createButton(el).disabled,
            'Create is not enabled',
        );

    const resolveDraftOffers = (draftOffers) => {
        service.resolveOfferSelectors = ({ wcsOsi }) => {
            const draftOffer = Store.landscape.value === WCS_LANDSCAPE_DRAFT ? draftOffers[wcsOsi] : undefined;
            return [Promise.resolve([draftOffer ?? OFFERS[wcsOsi]])];
        };
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        clearProductCache();
        createdFragments = new Map();
        service = document.createElement('mas-commerce-service');
        service.collectPriceOptions = ({ wcsOsi }) => ({ wcsOsi });
        service.resolveOfferSelectors = ({ wcsOsi }) => [Promise.resolve([OFFERS[wcsOsi]])];
        document.body.append(service);
        initialSearch = Store.search.get();
        initialPage = Store.page.get();
        initialLandscape = Store.landscape.get();
        initialBaselines = Store.baselines.list.data.get();
        Store.search.set((prev) => ({ ...prev, path: 'acom-cc' }));
        repository = createRepository();
        sandbox.stub(MasBaselineCards.prototype, 'repository').get(() => repository);
    });

    afterEach(() => {
        fixtureCleanup();
        service.remove();
        sandbox.restore();
        Store.filters.set((prev) => ({ ...prev, locale: 'en_US' }));
        Store.search.set(initialSearch);
        Store.page.set(initialPage);
        Store.landscape.set(initialLandscape);
        Store.baselines.list.data.set(initialBaselines);
        Store.baselines.creating.set(false);
        Store.confirmDialogOptions.set(null);
        clearProductCache();
    });

    it('switches the locale to en_US when it opens', async () => {
        Store.filters.set((prev) => ({ ...prev, locale: 'fr_FR' }));

        await mount();

        expect(Store.filters.value.locale).to.equal('en_US');
    });

    it('reports why a pasted link cannot be used', async () => {
        const ids = {
            missing: '11111111-1111-4111-8111-111111111111',
            collection: '22222222-2222-4222-8222-222222222222',
            baseline: '33333333-3333-4333-8333-333333333333',
            sandbox: '44444444-4444-4444-8444-444444444444',
            french: '55555555-5555-4555-8555-555555555555',
        };
        repository = createRepository({
            [CARD_ID]: createCard(),
            [ids.collection]: createCard({ id: ids.collection, modelPath: COLLECTION_MODEL_PATH }),
            [ids.baseline]: createCard({
                id: ids.baseline,
                path: '/content/dam/mas/acom-cc/en_US/baselines/mini-compare-chart-mweb/ccsn_direct_individual/baseline',
            }),
            [ids.sandbox]: createCard({ id: ids.sandbox, path: '/content/dam/mas/sandbox/en_US/cards/card' }),
            [ids.french]: createCard({ id: ids.french, path: '/content/dam/mas/acom-cc/fr_FR/mini-compare/card' }),
        });
        const el = await mount();

        await pasteLinks(
            el,
            [
                `https://mas.adobe.com/studio.html#page=fragment-editor&fragmentId=${CARD_ID}&path=acom-cc`,
                ...Object.values(ids),
                `https://mas.adobe.com/studio.html#page=content&path=acom-cc&query=${CARD_ID}`,
            ].join('\n'),
        );
        await waitUntil(() => !el.shadowRoot.querySelector('.link sp-progress-circle'), 'links not loaded');

        const errors = [...el.shadowRoot.querySelectorAll('.link')].map(
            (link) => link.querySelector('.link-error')?.textContent ?? '',
        );
        expect(errors).to.deep.equal([
            '',
            'Not found.',
            'Not a card.',
            'A baseline, not a card.',
            'Surface sandbox, not acom-cc.',
            'Locale fr_FR, not en_US.',
            'Already added.',
        ]);
        await waitUntil(() => query(el, '.links-announcement').textContent, 'link errors not announced');
        const announcement = query(el, '.links-announcement').textContent;
        expect(announcement).to.include(`${ids.missing}: Not found.`);
        expect(announcement).to.include('CC: Mini Compare Mweb: CC Pro: Individual: default: Not a card.');
    });

    it('retries a link that failed to load on the next edit', async () => {
        const { getById } = repository.aem.sites.cf.fragments;
        getById.onFirstCall().rejects(new Error('Failed to get fragment: 503 Service Unavailable'));
        const el = await mount();

        await pasteLinks(el, CARD_ID);
        await waitUntil(() => query(el, '.link-error'), 'no load error');
        expect(query(el, '.link-error').textContent).to.equal('Failed to get fragment: 503 Service Unavailable');

        await pasteLinks(el, `${CARD_ID}\n`);
        await waitUntil(() => query(el, '.link sp-icon-checkmark-circle'), 'link not retried');

        expect(getById.callCount).to.equal(2);
    });

    it('preselects the ABM & PUF legal disclaimers of acom-cc and warns about M2M cards without one', async () => {
        const el = await mount();

        expect(query(el, '#disclaimer-abm').value).to.equal('cc-pricing-legal-disclaimer-abm');
        expect([...el.shadowRoot.querySelectorAll('sp-combobox')].map(({ disabled }) => disabled)).to.deep.equal([
            false,
            false,
            false,
        ]);
        expect(query(el, '#disclaimer-puf').value).to.equal('cc-pricing-legal-disclaimer-puf');
        expect(query(el, '#disclaimer-m2m').value).to.equal('');
        expect(query(el, '.disclaimer[data-plan="puf"] mas-fragment-status').getAttribute('variant')).to.equal('draft');
        expect(query(el, '.disclaimer[data-plan="m2m"] sp-help-text').textContent.trim()).to.equal(
            'M2M cards will have no legal disclaimer.',
        );
    });

    it('disables Create without cards and while an offer is invalid', async () => {
        const el = await mount();
        expect(createButton(el).disabled).to.be.true;

        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);

        await selectOffer(el, 'm2m', 'ccpro-puf');
        await waitUntil(() => offerField(el, 'm2m').error, 'no offer error');

        expect(offerField(el, 'm2m').error).to.equal('The offer is YEAR / ANNUAL, M2M needs MONTH / MONTHLY.');
        expect(createButton(el).disabled).to.be.true;
    });

    for (const plan of ['abm', 'm2m', 'puf']) {
        it(`blocks Create for an unknown ${plan.toUpperCase()} disclaimer until it is cleared`, async () => {
            const el = await mount();
            await pasteLinks(el, CARD_ID);
            await waitForCreatable(el, 3);
            const disclaimer = query(el, `#disclaimer-${plan}`);

            disclaimer.value = 'unknown-disclaimer';
            disclaimer.dispatchEvent(new Event('change'));
            await el.updateComplete;

            expect(disclaimer.invalid).to.be.true;
            expect(query(el, `#disclaimer-${plan} sp-help-text`).textContent.trim()).to.equal(
                'Not a key of the en_US dictionary.',
            );
            expect(createButton(el).disabled).to.be.true;
            createButton(el).click();
            expect(repository.createFragment.called).to.be.false;

            disclaimer.value = '';
            disclaimer.dispatchEvent(new Event('change'));
            await waitForCreatable(el, 3);

            expect(disclaimer.invalid).to.be.false;
        });
    }

    it('reports a conflict in a negative toast, keeps unsaved changes and does not retry it', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        repository.createFragment.onThirdCall().callsFake(async ({ parentPath, name }) => {
            const path = `${parentPath}/${name}`;
            createdFragments.set(path, { id: path, path, model: { id: 'other-model' }, fields: [], tags: [] });
            throw new Error('Failed to create fragment: 409 Conflict');
        });
        const toast = sandbox.spy(Events.toast, 'emit');

        createButton(el).click();
        await waitUntil(() => toast.called, 'conflict toast not shown');
        await el.updateComplete;

        expect(statuses(el)).to.deep.equal(['created', 'created', 'conflict']);
        expect(query(el, 'sp-table-cell.status[data-status="conflict"] sp-status-light').variant).to.equal('negative');
        expect(query(el, 'sp-table-cell.status[data-status="conflict"]').textContent).to.include('Conflict');
        expect(toast.calledOnceWithExactly({ variant: 'negative', content: '1 of 3 items could not be created.' })).to.be.true;
        expect(createButton(el).disabled).to.be.true;
        expect(el.hasChanges).to.be.true;
    });

    it('reports failed and blocked items in a negative toast and retries only them on the next Create', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        repository.createFragment.onSecondCall().rejects(new Error('Failed to create card.'));
        const toast = sandbox.spy(Events.toast, 'emit');

        createButton(el).click();
        await waitUntil(() => toast.called, 'failure toast not shown');
        await el.updateComplete;

        expect(statuses(el)).to.deep.equal(['created', 'failed', 'blocked']);
        expect(toast.calledOnceWithExactly({ variant: 'negative', content: '2 of 3 items could not be created.' })).to.be.true;
        expect(el.running).to.be.false;
        expect(createButton(el).disabled).to.be.false;

        createButton(el).click();
        await waitUntil(() => toast.calledTwice, 'retry toast not shown');
        await el.updateComplete;

        expect(statuses(el)).to.deep.equal(['exists', 'created', 'created']);
        expect(repository.createFragment.callCount).to.equal(4);
    });

    it('shows a card whose offer cannot be resolved and groups it once its offer resolves on the next edit', async () => {
        const unresolvedId = '66666666-6666-4666-8666-666666666666';
        repository = createRepository({ [unresolvedId]: createCard({ id: unresolvedId, osi: 'ccpro-new' }) });
        const el = await mount();

        await pasteLinks(el, unresolvedId);
        await waitUntil(() => query(el, '.link-error'), 'unresolved offer not reported');
        expect(query(el, '.link-error').textContent).to.equal('Its offer could not be resolved.');
        expect(query(el, '.product')).to.be.null;

        OFFERS['ccpro-new'] = wcsOffer('YEAR', 'MONTHLY');
        try {
            await pasteLinks(el, `${unresolvedId}\n`);
            await waitUntil(() => query(el, '.product'), 'card not grouped after its offer resolved');
        } finally {
            delete OFFERS['ccpro-new'];
        }

        expect(query(el, '.link-error')).to.be.null;
        expect(query(el, '.product').dataset.product).to.equal('ccsn_direct_individual');
    });

    it('resolves a card whose offer is only in Draft once the landscape switches to Draft', async () => {
        const draftId = '77777777-7777-4777-8777-777777777777';
        repository = createRepository({ [draftId]: createCard({ id: draftId, osi: 'ccpro-draft' }) });
        resolveDraftOffers({ 'ccpro-draft': wcsOffer('YEAR', 'MONTHLY') });
        const el = await mount();
        await pasteLinks(el, draftId);
        await waitUntil(() => query(el, '.link-error'), 'unresolved offer not reported');

        Store.landscape.set(WCS_LANDSCAPE_DRAFT);

        await waitUntil(() => query(el, '.product'), 'card not grouped in the Draft landscape');
        expect(query(el, '.link-error')).to.be.null;
    });

    it('checks the selected offers again once the landscape changes, without the offers of the previous one', async () => {
        resolveDraftOffers({ 'ccpro-m2m': wcsOffer('YEAR', 'ANNUAL') });
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await selectOffer(el, 'm2m', 'ccpro-m2m');
        await waitForCreatable(el, 5);

        Store.landscape.set(WCS_LANDSCAPE_DRAFT);

        await waitUntil(() => offerField(el, 'm2m').error, 'offer not checked again in the Draft landscape');
        expect(offerField(el, 'm2m').error).to.equal('The offer is YEAR / ANNUAL, M2M needs MONTH / MONTHLY.');
        expect(createButton(el).disabled).to.be.true;
    });

    it('removes the products and items of all cards once their links are cleared, with a card whose offer is unresolved', async () => {
        const unresolvedId = '66666666-6666-4666-8666-666666666666';
        repository = createRepository({
            [CARD_ID]: createCard(),
            [unresolvedId]: createCard({ id: unresolvedId, path: `${FOLDER}/cc-pro-new`, osi: 'ccpro-new' }),
        });
        const el = await mount();
        await pasteLinks(el, `${CARD_ID}\n${unresolvedId}`);
        await waitForCreatable(el, 3);
        expect(query(el, '.link-error').textContent).to.equal('Its offer could not be resolved.');

        await pasteLinks(el, '');
        await waitUntil(() => !el.grouping && !query(el, '.product'), 'products of the removed cards kept');

        expect(statuses(el)).to.have.length(0);
        expect(createButton(el).disabled).to.be.true;
    });

    it('names a product after the product catalog, keeping its PA code in the details', async () => {
        sandbox.stub(sessionStorage, 'getItem').callsFake((key) => (key === 'masAccessToken' ? 'token' : null));
        sandbox.stub(window, 'fetch').resolves({
            ok: true,
            json: async () => [{ arrangement_code: 'ccsn_direct_individual', copy: { name: 'Creative Cloud Pro' } }],
        });
        const el = await mount();

        await pasteLinks(el, CARD_ID);
        await waitUntil(() => query(el, '.product h3')?.textContent === 'Creative Cloud Pro', 'product name not shown');

        expect(query(el, '.product-meta').textContent).to.include('ccsn_direct_individual');
    });

    it('warns when cards of the same template have offers of the same product', async () => {
        const otherId = '66666666-6666-4666-8666-666666666666';
        repository = createRepository({
            [CARD_ID]: createCard(),
            [otherId]: { ...createCard({ id: otherId, path: `${FOLDER}/reader` }), title: 'Reader card' },
        });
        const el = await mount();

        await pasteLinks(el, CARD_ID);
        await waitUntil(() => query(el, '.product'), 'product not shown');
        expect(query(el, '.shared-offer')).to.be.null;

        await pasteLinks(el, `${CARD_ID}\n${otherId}`);
        await waitUntil(() => query(el, '.shared-offer'), 'shared offer warning not shown');

        expect(el.shadowRoot.querySelectorAll('.product')).to.have.length(1);
        expect(query(el, '.shared-offer').textContent).to.include('"Reader card"');
    });

    it('keeps the offers of products with the same PA code apart by market segment', async () => {
        const eduId = '88888888-8888-4888-8888-888888888888';
        repository = createRepository({
            [CARD_ID]: createCard(),
            [eduId]: createCard({ id: eduId, path: `${FOLDER}/cc-pro-edu`, osi: 'ccpro-abm-edu' }),
        });
        const el = await mount();

        await pasteLinks(el, `${CARD_ID}\n${eduId}`);
        await waitForCreatable(el, 6);

        const abmOffers = [...el.shadowRoot.querySelectorAll('.plan[data-plan="abm"] .offer[data-role="osi"] mas-offer-field')];
        expect(abmOffers.map(({ osi }) => osi)).to.deep.equal(['ccpro-abm', 'ccpro-abm-edu']);
    });

    it('forgets the offers of a removed product', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await selectOffer(el, 'm2m', 'ccpro-m2m');
        await waitForCreatable(el, 5);

        await pasteLinks(el, '');
        await waitUntil(() => !query(el, '.product'), 'product not removed');
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);

        expect(offerField(el, 'm2m').osi).to.equal('');
    });

    it('marks a card without an offer price as Free, adding it as is to the collections, until it is turned off', async () => {
        const freeId = '77777777-7777-4777-8777-777777777777';
        const reader = createCard({ id: freeId, path: `${FOLDER}/reader` });
        reader.title = 'Reader card';
        for (const name of ['prices', 'ctas']) reader.fields.find((field) => field.name === name).values = ['<p>Free</p>'];
        repository = createRepository({ [CARD_ID]: createCard(), [freeId]: reader });
        const el = await mount();

        await pasteLinks(el, `${freeId}\n${CARD_ID}`);
        await waitUntil(() => query(el, '.free-collections'), 'free card not shown');

        expect(query(el, `.link[data-id="${freeId}"] sp-switch`).checked).to.be.true;
        expect(el.shadowRoot.querySelectorAll('.product:not(.free)')).to.have.length(1);
        expect(query(el, '.free-collections').textContent).to.include('ABM');
        expect(query(el, '.shared-offer')).to.be.null;

        const freeSwitch = query(el, `.link[data-id="${freeId}"] sp-switch`);
        freeSwitch.checked = false;
        freeSwitch.dispatchEvent(new Event('change'));
        await waitUntil(() => query(el, '.shared-offer'), 'card not grouped with its offer product');

        expect(query(el, '.product.free')).to.be.null;
    });

    it('shows a free card in no collection when no other card of its template and market segment has a plan card', async () => {
        const freeId = '77777777-7777-4777-8777-777777777777';
        const reader = createCard({ id: freeId, path: `${FOLDER}/reader` });
        reader.fields.find((field) => field.name === 'variant').values = ['plans'];
        for (const name of ['prices', 'ctas']) reader.fields.find((field) => field.name === name).values = ['<p>Free</p>'];
        repository = createRepository({ [CARD_ID]: createCard(), [freeId]: reader });
        const el = await mount();

        await pasteLinks(el, `${freeId}\n${CARD_ID}`);
        await waitUntil(() => query(el, '.product.free'), 'free card not shown');

        expect(query(el, '.free-collections')).to.be.null;
        expect(query(el, '.product.free sp-help-text').textContent).to.equal(
            'In no collection: no other plans COM card has a plan card.',
        );
    });

    it('drops a trial offer of another plan with a warning, without blocking Create', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await selectOffer(el, 'm2m', 'ccpro-m2m');
        await selectOffer(el, 'm2m', 'ccpro-puf', 'trialOsi');

        await waitUntil(() => offerField(el, 'm2m', 'trialOsi').error, 'no trial warning');
        expect(offerField(el, 'm2m', 'trialOsi').error).to.equal(
            'Wrong M2M trial for ccsn_direct_individual: the Free trial CTA is removed.',
        );
        await waitForCreatable(el, 5);
    });

    it('removes the trial offer of a plan along with its offer', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await selectOffer(el, 'm2m', 'ccpro-m2m');
        await selectOffer(el, 'm2m', 'ccpro-abm-trial', 'trialOsi');
        await waitForCreatable(el, 5);

        query(el, '.plan[data-plan="m2m"] .offer[data-role="osi"] sp-action-button').click();
        await el.updateComplete;

        expect(offerField(el, 'm2m').osi).to.equal('');
        expect(offerField(el, 'm2m', 'trialOsi').osi).to.equal('');
        await waitUntil(() => el.shadowRoot.activeElement === offerField(el, 'm2m'), 'focus not moved to the offer field');
        await waitForCreatable(el, 3);
    });

    it('takes the ABM offer of the next card of a product once its first card is removed', async () => {
        const teamId = '66666666-6666-4666-8666-666666666666';
        repository = createRepository({
            [CARD_ID]: createCard(),
            [teamId]: createCard({ id: teamId, path: `${FOLDER}/cc-pro-team`, osi: 'ccpro-abm-team' }),
        });
        const el = await mount();
        await pasteLinks(el, `${CARD_ID}\n${teamId}`);
        await waitUntil(() => offerField(el, 'abm')?.osi === 'ccpro-abm', 'ABM offer of the first card not shown');

        await pasteLinks(el, teamId);

        await waitUntil(() => offerField(el, 'abm').osi === 'ccpro-abm-team', 'ABM offer of the removed card kept');
    });

    it('groups the cards only once all links are loaded', async () => {
        const teamId = '66666666-6666-4666-8666-666666666666';
        repository = createRepository({
            [CARD_ID]: createCard(),
            [teamId]: createCard({ id: teamId, path: `${FOLDER}/cc-pro-team`, osi: 'ccpro-abm-team' }),
        });
        let release;
        const gate = new Promise((resolve) => (release = resolve));
        const { getById } = repository.aem.sites.cf.fragments;
        getById.withArgs(teamId).callsFake(async () => {
            await gate;
            return createCard({ id: teamId, path: `${FOLDER}/cc-pro-team`, osi: 'ccpro-abm-team' });
        });
        const el = await mount();

        await pasteLinks(el, `${CARD_ID}\n${teamId}`);
        await waitUntil(() => query(el, `.link[data-id="${CARD_ID}"] sp-icon-checkmark-circle`), 'first link not loaded');
        await el.updateComplete;
        expect(el.grouping).to.be.false;
        expect(Boolean(query(el, '.product'))).to.be.false;

        release();
        await waitUntil(() => query(el, '.product'), 'cards not grouped');
        expect(query(el, '.shared-offer')).to.exist;
    });

    it('aborts the link loads left when it closes', async () => {
        const { getById } = repository.aem.sites.cf.fragments;
        getById.callsFake(() => new Promise(() => {}));
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitUntil(() => getById.called, 'link not loaded');
        const [, abortController] = getById.firstCall.args;

        el.remove();

        expect(abortController.signal.aborted).to.be.true;
    });

    it('names the product groups, Free switches and open links after their card', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        const product = query(el, '.product');

        expect(product.getAttribute('role')).to.equal('group');
        expect(el.shadowRoot.getElementById(product.getAttribute('aria-labelledby')).textContent).to.equal(
            'ccsn_direct_individual',
        );
        expect(query(el, '.link sp-switch').textContent).to.include('CC: Mini Compare Mweb: CC Pro: Individual: default');

        createButton(el).click();
        await waitUntil(() => !el.running && statuses(el).every((status) => status === 'created'), 'items not created');
        const [row] = el.shadowRoot.querySelectorAll('sp-table-row');
        expect(row.querySelector('sp-table-cell.status a').getAttribute('aria-label')).to.equal(
            `Open ${row.querySelector('.item-title').textContent}`,
        );
    });

    it('names the form fields, offer fields and remove buttons after their plan', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await selectOffer(el, 'm2m', 'ccpro-m2m');
        await waitForCreatable(el, 5);
        const accessibleName = (id) => query(el, `#${id}`).focusElement.getAttribute('aria-label');

        await waitUntil(() => accessibleName('disclaimer-m2m'), 'field labels not applied');
        expect(accessibleName('links')).to.equal('Links to the ABM cards');
        expect(accessibleName('collection-label')).to.equal('Collection label');
        expect(['abm', 'm2m', 'puf'].map((plan) => accessibleName(`disclaimer-${plan}`))).to.deep.equal([
            'ABM legal disclaimer',
            'M2M legal disclaimer',
            'PUF legal disclaimer',
        ]);
        const field = offerField(el, 'm2m', 'trialOsi');
        const group = field.shadowRoot.querySelector('[role="group"]');
        expect(field.shadowRoot.getElementById(group.getAttribute('aria-labelledby')).textContent.trim()).to.equal(
            'M2M trial offer',
        );
        expect(removeButton(el, 'm2m').getAttribute('aria-label')).to.equal('Remove M2M offer');
        expect(removeButton(el, 'm2m', 'trialOsi')).to.be.null;
    });

    it('associates an offer error with its offer field until the offer is fixed', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await selectOffer(el, 'm2m', 'ccpro-puf');
        await waitUntil(() => offerField(el, 'm2m').error, 'no offer error');
        await offerField(el, 'm2m').updateComplete;
        const button = offerButton(el, 'm2m');

        expect(button.getAttribute('aria-invalid')).to.equal('true');
        expect(offerField(el, 'm2m').shadowRoot.getElementById(button.getAttribute('aria-describedby')).textContent).to.equal(
            'The offer is YEAR / ANNUAL, M2M needs MONTH / MONTHLY.',
        );

        await selectOffer(el, 'm2m', 'ccpro-m2m');
        await waitUntil(() => !offerField(el, 'm2m').error, 'offer error kept');
        await offerField(el, 'm2m').updateComplete;

        expect(offerButton(el, 'm2m').hasAttribute('aria-invalid')).to.be.false;
        expect(offerButton(el, 'm2m').hasAttribute('aria-describedby')).to.be.false;
    });

    it('associates an unknown disclaimer error with its disclaimer field', async () => {
        const el = await mount();
        const disclaimer = query(el, '#disclaimer-puf');

        disclaimer.value = 'unknown-disclaimer';
        disclaimer.dispatchEvent(new Event('change'));
        await el.updateComplete;
        await disclaimer.updateComplete;

        const input = disclaimer.focusElement;
        expect(input.getAttribute('aria-invalid')).to.equal('true');
        const [helpTextId] = input.getAttribute('aria-describedby').split(' ');
        const slot = disclaimer.shadowRoot.getElementById(helpTextId).querySelector('slot');
        expect(slot.assignedElements().map(({ textContent }) => textContent.trim())).to.deep.equal([
            'Not a key of the en_US dictionary.',
        ]);
    });

    it('opens the offer selector of an offer field with the keyboard', async () => {
        const openOfferSelector = sandbox.stub(MasOfferField.prototype, 'openOfferSelector');
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitUntil(() => offerField(el, 'puf'), 'offers not shown');

        offerField(el, 'puf').focus();
        await sendKeys({ press: 'Enter' });

        expect(openOfferSelector.calledOnce).to.be.true;
        expect(openOfferSelector.firstCall.thisValue).to.equal(offerField(el, 'puf'));
    });

    it('turns a card Free with the keyboard', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);

        query(el, '.link sp-switch').focus();
        await sendKeys({ press: 'Space' });

        await waitUntil(() => query(el, '.product.free'), 'card not turned Free');
        expect(query(el, '.link sp-switch').checked).to.be.true;
    });

    it('removes an offer with the keyboard and keeps the focus on its offer field', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await selectOffer(el, 'm2m', 'ccpro-m2m');
        await waitForCreatable(el, 5);

        removeButton(el, 'm2m').focus();
        await sendKeys({ press: 'Enter' });

        await waitUntil(() => offerField(el, 'm2m').osi === '', 'offer not removed');
        await waitUntil(
            () => offerField(el, 'm2m').shadowRoot.activeElement === offerButton(el, 'm2m'),
            'focus not kept on the offer field',
        );
        expect(removeButton(el, 'm2m')).to.be.null;
    });

    it('filters the disclaimer options as a key is typed and shows them all once one is picked', async () => {
        const el = await mount();
        const disclaimer = query(el, '#disclaimer-abm');
        expect(disclaimer.options).to.have.length(DICTIONARY_ENTRIES.length);

        disclaimer.value = 'EDU';
        disclaimer.dispatchEvent(new Event('input'));
        await el.updateComplete;
        expect(disclaimer.options.map(({ value }) => value)).to.deep.equal(['cc-pricing-legal-disclaimer-abm-edu']);

        disclaimer.value = 'cc-pricing-legal-disclaimer-abm-edu';
        disclaimer.dispatchEvent(new Event('change'));
        await el.updateComplete;
        expect(disclaimer.options).to.have.length(DICTIONARY_ENTRIES.length);
    });

    it('goes back to the Baselines page, except during a run', async () => {
        Store.page.set(PAGE_NAMES.BASELINE_CARDS);
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        const back = query(el, '.baseline-cards-header sp-action-button');
        let release;
        const gate = new Promise((resolve) => (release = resolve));
        const createFragment = repository.createFragment;
        repository.createFragment = sandbox.stub().callsFake(async (...args) => {
            await gate;
            return createFragment(...args);
        });

        createButton(el).click();
        await waitUntil(() => el.running, 'run not started');
        await el.updateComplete;
        expect(back.disabled).to.be.true;
        release();
        await waitUntil(() => !el.running, 'run not finished');
        await el.updateComplete;

        back.click();
        await waitUntil(() => Store.page.value === PAGE_NAMES.BASELINES, 'not back on the Baselines page');
    });

    it('reports a dictionary that cannot be loaded and leaves the disclaimers empty', async () => {
        const error = new Error('Failed to search fragments.');
        repository.searchFragmentList.rejects(error);

        const el = await mount();

        expect(el.disclaimerKeys).to.deep.equal([]);
        expect(repository.processError.calledOnceWithExactly(error, 'Could not load the dictionary.')).to.be.true;
        expect(query(el, '#disclaimer-abm').value).to.equal('');
        expect(query(el, '#disclaimer-abm').pending).to.be.false;
    });

    it('loads the dictionary of the new surface and ignores the one of the previous surface', async () => {
        let releaseFirst;
        const firstLoad = new Promise((resolve) => (releaseFirst = resolve));
        repository.searchFragmentList.onFirstCall().returns(firstLoad);
        repository.searchFragmentList.onSecondCall().resolves([
            {
                path: '/content/dam/mas/express/en_US/dictionary/express-legal-disclaimer-abm',
                status: 'PUBLISHED',
                fields: [{ name: 'key', values: ['express-legal-disclaimer-abm'] }],
            },
        ]);
        const el = await fixture(html`<mas-baseline-cards></mas-baseline-cards>`);

        Store.search.set((prev) => ({ ...prev, path: 'express' }));
        await waitUntil(() => el.disclaimerKeys, 'express dictionary not loaded');
        releaseFirst(DICTIONARY_ENTRIES);
        await firstLoad;
        await el.updateComplete;

        expect(repository.searchFragmentList.secondCall.args[0]).to.deep.equal({
            path: '/content/dam/mas/express/en_US/dictionary',
        });
        expect(el.disclaimerKeys.map(({ key }) => key)).to.deep.equal(['express-legal-disclaimer-abm']);
        expect(query(el, '#disclaimer-abm').value).to.equal('express-legal-disclaimer-abm');
    });

    it('asks to confirm leaving the page once something is entered, until all items are created', async () => {
        const el = await mount();
        expect(beforeUnloadPrevented()).to.be.false;
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        expect(beforeUnloadPrevented()).to.be.true;
        let release;
        const gate = new Promise((resolve) => (release = resolve));
        const createFragment = repository.createFragment;
        repository.createFragment = sandbox.stub().callsFake(async (...args) => {
            await gate;
            return createFragment(...args);
        });

        createButton(el).click();
        await waitUntil(() => el.running, 'run not started');
        expect(beforeUnloadPrevented()).to.be.true;

        release();
        await waitUntil(() => !el.running, 'run not finished');
        expect(beforeUnloadPrevented()).to.be.false;

        await pasteLinks(el, `${CARD_ID}\n11111111-1111-4111-8111-111111111111`);
        expect(beforeUnloadPrevented()).to.be.true;
        await waitUntil(() => query(el, '.link-error'), 'missing link not reported');
        expect(beforeUnloadPrevented()).to.be.true;
    });

    it('shows a created card as a conflict once its offer changes', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await selectOffer(el, 'm2m', 'ccpro-m2m');
        await waitForCreatable(el, 5);

        createButton(el).click();
        await waitUntil(() => !el.running && statuses(el).every((status) => status === 'created'), 'items not created');
        await selectOffer(el, 'm2m', 'ccpro-m2m-alt');
        await waitUntil(() => statuses(el).includes('conflict'), 'changed card not reported');

        expect(statuses(el)).to.deep.equal(['created', 'created', 'conflict', 'created', 'created']);
        expect(el.hasChanges).to.be.true;
    });

    it('shows a created card as a conflict once its disclaimer changes', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);

        createButton(el).click();
        await waitUntil(() => !el.running && statuses(el).every((status) => status === 'created'), 'items not created');
        const disclaimer = query(el, '#disclaimer-abm');
        disclaimer.value = 'cc-pricing-buy-now';
        disclaimer.dispatchEvent(new Event('change'));
        await waitUntil(() => statuses(el).includes('conflict'), 'changed card not reported');

        expect(statuses(el)).to.deep.equal(['created', 'conflict', 'created']);
        expect(el.hasChanges).to.be.true;
    });

    it('checks again which items exist on the next edit when the check failed', async () => {
        const { getByPath } = repository.aem.sites.cf.fragments;
        getByPath.onFirstCall().rejects(new Error('Failed to get fragment: 503 Service Unavailable'));
        const el = await mount();

        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        expect(repository.processError.calledWith(sinon.match.any, 'Could not check which items already exist.')).to.be.true;
        const baselinePath = query(el, 'sp-table-row[data-type="baseline"]').getAttribute('value');
        const baselineLookups = () => getByPath.args.filter(([path]) => path === baselinePath).length;
        expect(baselineLookups()).to.equal(1);

        const label = query(el, '#collection-label');
        label.value = 'CC Pro plans';
        label.dispatchEvent(new Event('input'));
        await waitUntil(() => baselineLookups() === 2, 'baseline not checked again');
    });

    it('looks up the planned items once the edits settle, dropping the superseded ones', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        const { getByPath } = repository.aem.sites.cf.fragments;
        const setLabel = async (value) => {
            const label = query(el, '#collection-label');
            label.value = value;
            label.dispatchEvent(new Event('input'));
            await el.updateComplete;
            return query(el, 'sp-table-row[data-type="collection"]').getAttribute('value');
        };
        const clock = sandbox.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldClearNativeTimers: true });
        getByPath.resetHistory();

        const supersededPath = await setLabel('CC Pro plans');
        await clock.tickAsync(100);
        const plannedPath = await setLabel('CC Pro');
        await clock.tickAsync(299);
        expect(getByPath.called).to.be.false;
        await clock.tickAsync(1);
        await el.updateComplete;
        expect(getByPath.args.map(([path]) => path)).to.deep.equal([plannedPath]);

        expect(await setLabel('CC Pro plans')).to.equal(supersededPath);
        await clock.tickAsync(300);
        await el.updateComplete;

        expect(getByPath.args.map(([path]) => path)).to.deep.equal([plannedPath, supersededPath]);
        expect(statuses(el)).to.not.include('checking');
    });

    it('reports an offer check that fails and checks the offers again on the next offer change', async () => {
        sandbox.stub(MasOfferField.prototype, 'willUpdate');
        const error = new Error('Offer check failed.');
        let fail = true;
        const offer = wcsOffer('MONTH', 'MONTHLY');
        Object.defineProperty(offer, 'productArrangementCode', {
            get() {
                if (fail) throw error;
                return 'ccsn_direct_individual';
            },
        });
        OFFERS['ccpro-m2m-flaky'] = offer;
        try {
            const el = await mount();
            await pasteLinks(el, CARD_ID);
            await waitForCreatable(el, 3);

            await selectOffer(el, 'm2m', 'ccpro-m2m-flaky');
            await waitUntil(() => repository.processError.calledWith(error, 'Could not check the offers.'), 'no check error');
            expect(createButton(el).disabled).to.be.true;

            fail = false;
            await selectOffer(el, 'puf', 'ccpro-puf');
            await waitForCreatable(el, 7);
        } finally {
            delete OFFERS['ccpro-m2m-flaky'];
        }
    });

    it('moves the focus to the items heading once a run started with the keyboard creates every item', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);

        createButton(el).focus();
        await sendKeys({ press: 'Enter' });
        await waitUntil(() => !el.running && statuses(el).every((status) => status === 'created'), 'items not created');

        await waitUntil(() => el.shadowRoot.activeElement === query(el, '#items-heading'), 'focus not restored');
    });

    it('moves the focus back to the Create button once a run started with the keyboard leaves items to retry', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        repository.createFragment.onSecondCall().rejects(new Error('Failed to create card.'));

        createButton(el).focus();
        await sendKeys({ press: 'Enter' });
        await waitUntil(() => !el.running && statuses(el).includes('failed'), 'run not finished');

        await waitUntil(() => el.shadowRoot.activeElement === createButton(el), 'focus not restored');
        expect(createButton(el).disabled).to.be.false;
    });

    it('stops creating the items once it closes during a run', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        let release;
        const gate = new Promise((resolve) => (release = resolve));
        const createFragment = repository.createFragment;
        repository.createFragment = sandbox.stub().callsFake(async (...args) => {
            await gate;
            return createFragment(...args);
        });
        const toast = sandbox.spy(Events.toast, 'emit');

        createButton(el).click();
        await waitUntil(() => repository.createFragment.called, 'run not started');
        el.promptDiscardChanges();
        expect(Store.confirmDialogOptions.get().title).to.equal('Items are being created');
        el.remove();
        release();
        await waitUntil(() => !Store.baselines.creating.get(), 'run not stopped');

        expect(repository.createFragment.callCount).to.equal(1);
        expect(toast.called).to.be.false;
    });

    it('switches to another surface only once the run is over', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await waitForCreatable(el, 3);
        let release;
        const gate = new Promise((resolve) => (release = resolve));
        const createFragment = repository.createFragment;
        repository.createFragment = sandbox.stub().callsFake(async (...args) => {
            await gate;
            return createFragment(...args);
        });

        createButton(el).click();
        await waitUntil(() => el.running, 'run not started');
        expect(Store.baselines.creating.get()).to.be.true;
        Store.search.set((prev) => ({ ...prev, path: 'express' }));
        await el.updateComplete;

        expect(statuses(el)).to.have.length(3);
        expect(query(el, '#disclaimer-abm').value).to.equal('cc-pricing-legal-disclaimer-abm');

        release();
        await waitUntil(() => !el.running, 'run not finished');
        expect(Store.baselines.creating.get()).to.be.false;
        await waitUntil(() => query(el, '.link-error'), 'surface not switched');

        expect(createFragment.callCount).to.equal(3);
        expect(query(el, '.link-error').textContent).to.equal('Surface acom-cc, not express.');
    });

    it('has unsaved changes when the label or a disclaimer differs from its default', async () => {
        const el = await mount();
        expect(el.hasChanges).to.be.false;

        const label = query(el, '#collection-label');
        label.value = 'CC Pro plans';
        label.dispatchEvent(new Event('input'));
        expect(el.hasChanges).to.be.true;
        label.value = ' ';
        label.dispatchEvent(new Event('input'));
        expect(el.hasChanges).to.be.false;

        const disclaimer = query(el, '#disclaimer-m2m');
        disclaimer.value = 'cc-pricing-buy-now';
        disclaimer.dispatchEvent(new Event('change'));
        expect(el.hasChanges).to.be.true;
        disclaimer.value = '';
        disclaimer.dispatchEvent(new Event('change'));
        expect(el.hasChanges).to.be.false;
    });

    it('asks the confirm dialog before leaving only when there are unsaved changes', async () => {
        const el = await mount();
        expect(await el.promptDiscardChanges()).to.be.true;
        expect(Store.confirmDialogOptions.get()).to.be.null;

        await pasteLinks(el, CARD_ID);
        el.promptDiscardChanges();
        expect(Store.confirmDialogOptions.get().title).to.equal('Unsaved changes');
    });

    it('creates the items with the chosen disclaimers, then reuses them all on a second run', async () => {
        const el = await mount();
        await pasteLinks(el, CARD_ID);
        await selectOffer(el, 'm2m', 'ccpro-m2m');
        await selectOffer(el, 'puf', 'ccpro-puf');
        await waitForCreatable(el, 7);
        expect(createButton(el).textContent.trim()).to.equal('Create 7 items');
        let release;
        const gate = new Promise((resolve) => (release = resolve));
        const createFragment = repository.createFragment;
        repository.createFragment = sandbox.stub().callsFake(async (...args) => {
            await gate;
            return createFragment(...args);
        });

        createButton(el).click();
        await waitUntil(() => statuses(el)[0] === 'creating', 'baseline not being created');
        expect(statuses(el)).to.deep.equal(['creating', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']);
        release();
        await waitUntil(() => !el.running, 'run not finished');
        await el.updateComplete;

        expect(statuses(el)).to.deep.equal(Array(7).fill('created'));
        const cards = createFragment.args.map(([fragment]) => fragment).filter(({ tags }) => tags?.length === 1);
        const callouts = Object.fromEntries(
            cards.map(({ tags, fields }) => [tags[0], fields.find(({ name }) => name === 'callout').values[0]]),
        );
        expect(callouts).to.deep.equal({
            'mas:plan_type/abm': '<p>{{cc-pricing-legal-disclaimer-abm}}</p>',
            'mas:plan_type/m2m': '',
            'mas:plan_type/puf': '<p>{{cc-pricing-legal-disclaimer-puf}}</p>',
        });

        fixtureCleanup();
        const createCount = createFragment.callCount;
        const again = await mount();
        await pasteLinks(again, CARD_ID);
        await selectOffer(again, 'm2m', 'ccpro-m2m');
        await selectOffer(again, 'puf', 'ccpro-puf');
        await waitUntil(() => statuses(again).length === 7 && statuses(again).every((status) => status === 'exists'));

        expect(createButton(again).disabled).to.be.true;
        expect(createButton(again).textContent.trim()).to.equal('Create 0 items');
        expect(again.hasChanges).to.be.false;
        expect(createFragment.callCount).to.equal(createCount);
    });
});
