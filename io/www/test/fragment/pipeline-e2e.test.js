import { expect } from 'chai';
import sinon from 'sinon';
import { CARD_MODEL_ID } from '../../src/fragment/utils/common.js';
import { resetCache } from '../../src/fragment/pipeline.js';
import { clearSettingsCache } from '../../src/fragment/transformers/settings.js';
import { clearPromoCache } from '../../src/fragment/transformers/promotions.js';
import { mockDictionary } from './replace.test.js';
import DICTIONARY_RESPONSE from './mocks/dictionary.json' with { type: 'json' };
import SETTINGS_RESPONSE from './mocks/settings-sandbox.json' with { type: 'json' };
import FRAGMENT_AH_DE_DE_CORRUPTED from './mocks/fragment-ah-de_DE-corrupted.json' with { type: 'json' };
import { MockState } from './mocks/MockState.js';
import { createResponse } from './mocks/MockFetch.js';
import { makeProject, makeHydratedProject, FOLDER_URL, hydrateUrl } from './promotions.test.js';
import {
    getFragment,
    setupFragmentMocks,
    runOnFilledState,
    EXPECTED_BODY,
    EXPECTED_BODY_HASH,
    RANDOM_OLD_DATE,
} from './pipeline.test.js';

let fetchStub;

describe('pipeline end to end', () => {
    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch').callsFake((url) => {
            // eslint-disable-next-line no-console
            console.warn('[test] unmatched fetch stub:', url);
            return createResponse(404, { detail: 'Not Found' }, 'Not Found');
        });
        mockDictionary(false, fetchStub);
        resetCache();
        clearSettingsCache();
        clearPromoCache();
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it('should return fully baked /content/dam/mas/sandbox/fr_FR/someFragment', async () => {
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_FR',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.include(EXPECTED_BODY);
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers).to.have.property('ETag');
        expect(result.headers['ETag']).to.equal(EXPECTED_BODY_HASH);
        expect(Object.keys(state.store).length).to.equal(1);
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_FR');
        const json = JSON.parse(state.store['req-some-en-us-fragment-fr_FR']);
        delete json.lastModified; // removing the date to avoid flakiness
        expect(json).to.deep.include({
            fragmentsIds: {
                'dictionary-id-sandbox-fr_FR': 'sandbox_fr_FR_dictionary',
                'default-locale-id': 'some-fr-fr-fragment',
                'settings-id': 'settings-id',
            },
            hash: EXPECTED_BODY_HASH,
        });
    });

    it('should detect already treated /content/dam/mas/sandbox/fr_FR/someFragment if not changed', async () => {
        const result = await runOnFilledState(
            fetchStub,
            JSON.stringify({
                fragmentsIds: {
                    'dictionary-id': 'sandbox_fr_FR_dictionary',
                    'default-locale-id': 'some-fr-fr-fragment',
                    'settings-id': 'settings-id',
                },
                fragmentPath: 'someFragment',
                lastModified: RANDOM_OLD_DATE,
                hash: EXPECTED_BODY_HASH,
            }),
            {
                'if-modified-since': 'Tue, 21 Nov 2050 08:00:00 GMT',
            },
        );
        expect(result.body).to.be.undefined;
        expect(result.statusCode).to.equal(304);
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers['Last-Modified']).to.equal(RANDOM_OLD_DATE);
    });

    it('should return fully baked /content/dam/mas/sandbox/fr_FR/someFragment from fr_CA locale request', async () => {
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_CA/dictionary/index',
            )
            .returns(createResponse(404, {}, 'Not Found'));
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_CA',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            id: 'some-fr-fr-fragment',
        });
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers).to.have.property('ETag');
        expect(Object.keys(state.store).length).to.equal(1);
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_CA');
        const json = JSON.parse(state.store['req-some-en-us-fragment-fr_CA']);
        expect(json.fragmentsIds['dictionary-id']).to.not.equal('sandbox_fr_FR_dictionary');
        expect(json.fragmentsIds['default-locale-id']).to.equal('some-fr-fr-fragment');
    });

    it('should return fully baked /content/dam/mas/sandbox/fr_CA/someFragment from fr_FR locale request, and country CA', async () => {
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/dictionary/index',
            )
            .returns(createResponse(404, {}, 'Not Found'));
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_FR',
            country: 'CA',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            id: 'some-fr-fr-fragment',
        });
        expect(result.headers).to.have.property('Last-Modified');
        expect(result.headers).to.have.property('ETag');
        expect(Object.keys(state.store).length).to.equal(1);
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_FR-CA');
        const json = JSON.parse(state.store['req-some-en-us-fragment-fr_FR-CA']);
        expect(json.fragmentsIds['dictionary-id']).to.not.equal('sandbox_fr_FR_dictionary');
        expect(json.fragmentsIds['default-locale-id']).to.equal('some-fr-fr-fragment');
    });

    it('fetches the region overlay from the regional path when locale=fr_FR + country=BE', async () => {
        setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });
        // country=BE → regionLocale=fr_BE. Base stays acom/fr_FR (setupFragmentMocks); the region
        // overlay is fetched from the fr_BE regional path (direct-hydrated).
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_BE/dictionary/index',
            )
            .returns(createResponse(200, { id: 'sandbox_fr_BE_dictionary' }));
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/sandbox_fr_BE_dictionary?references=direct-hydrated')
            .returns(createResponse(200, { id: 'sandbox_fr_BE_dictionary', references: {} }));
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
            country: 'BE',
        });
        expect(result.statusCode).to.equal(200);
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_FR-BE');
        const json = JSON.parse(state.store['req-some-en-us-fragment-fr_FR-BE']);
        expect(json.fragmentsIds['dictionary-id-sandbox-fr_BE']).to.equal('sandbox_fr_BE_dictionary');
    });

    it('should NOT apply fr_FR settings override when country=CA forces regionLocale=fr_CA', async () => {
        setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
            country: 'CA',
        });
        expect(result.statusCode).to.equal(200);
        // Override `secureLabel` locales = ["fr_FR","fr_BE","fr_CH"] (NOT fr_CA). When the regional
        // locale is fr_CA, the override must NOT fire — default booleanValue=false → optional-text
        // returns ''. If settings see the request locale (fr_FR) by mistake, override fires and
        // secureLabel becomes '{{secure-label}}' (or 'secure-label' after replace).
        expect(result.body.settings?.secureLabel).to.equal('');
    });

    it('should include pzn segment in cache key when pzn is provided', async () => {
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_FR',
            pzn: 'segment-A',
        });
        expect(result.statusCode).to.equal(200);
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_FR-p_segment-A');
    });

    function stubMask(fetchStub) {
        // Mask fragment: variables map 'promo-label' to '{{select}}', a key already in the
        // dictionary mock — replace resolves the nested placeholder in a second pass.
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/masks/black-friday',
            )
            .returns(createResponse(200, { id: 'mask-holiday-id' }));
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/masks/holiday')
            .returns(createResponse(200, { id: 'mask-holiday-id' }));
        fetchStub.withArgs('https://odin.adobe.com/adobe/contentFragments/mask-holiday-id').returns(
            createResponse(200, {
                id: 'mask-holiday-id',
                path: '/content/dam/mas/sandbox/fr_FR/masks/holiday',
                model: { id: CARD_MODEL_ID },
                fields: { variables: ['promo-label:{{select}}'] },
                references: {},
            }),
        );
    }

    it('should include mask segment in cache key when mask is provided', async () => {
        setupFragmentMocks(fetchStub, {
            id: 'some-en-us-fragment',
            path: 'someFragment',
        });
        const state = new MockState();
        stubMask(fetchStub);
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state: state,
            locale: 'fr_FR',
            mask: 'black-friday',
        });
        expect(result.statusCode).to.equal(200);
        expect(result.body.id).to.equal('some-fr-fr-fragment');
        expect(result.body.path).to.equal('/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app');
        expect(result.body.maskId).to.equal('mask-holiday-id');
        expect(state.store).to.have.property('req-some-en-us-fragment-fr_FR-m_black-friday');
    });

    it('should replace fragment placeholders with values from mask variables', async () => {
        setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });

        // Override the fr fragment: badge field contains a placeholder solved by the mask's variables
        fetchStub.withArgs('https://odin.adobe.com/adobe/contentFragments/some-fr-fr-fragment?references=all-hydrated').returns(
            createResponse(200, {
                path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                id: 'some-fr-fr-fragment',
                model: { id: CARD_MODEL_ID },
                fields: {
                    variant: 'plans',
                    osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                    badge: { value: '{{promo-label}}', mimeType: 'text/html' },
                },
                references: {},
                referencesTree: [],
            }),
        );

        stubMask(fetchStub);

        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            state,
            locale: 'fr_FR',
            mask: 'holiday',
        });

        expect(result.statusCode).to.equal(200);
        // {{promo-label}} → {{select}} (from mask variables) → 'Select' (from dictionary)
        expect(result.body.fields.badge.value).to.equal('Select');
    });

    it('should fix corrupted data-extra-options in adobe-home fragment', async () => {
        const fragmentId = '8ede258f-a996-43c4-8525-b52543925ab0';

        // Mock settings for adobe-home surface
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/adobe-home/settings/index')
            .returns(createResponse(200, { id: 'adobe-home-settings-id' }));
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/adobe-home-settings-id?references=all-hydrated')
            .returns(createResponse(200, SETTINGS_RESPONSE));

        // Mock the fragment fetch
        fetchStub
            .withArgs(`https://odin.adobe.com/adobe/contentFragments/${fragmentId}?references=all-hydrated`)
            .returns(createResponse(200, FRAGMENT_AH_DE_DE_CORRUPTED));

        // Mock dictionary for adobe-home de_DE (note the path structure matches adobe-home)
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/adobe-home/de_DE/dictionary/index',
            )
            .returns(createResponse(200, { id: 'de_DE_dictionary' }));

        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/de_DE_dictionary?references=all-hydrated')
            .returns(createResponse(200, DICTIONARY_RESPONSE));

        // Mock promotions folder for adobe-home
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/?path=/content/dam/mas/promotions')
            .returns(createResponse(200, { items: [] }));

        const state = new MockState();
        const result = await getFragment({
            id: fragmentId,
            state: state,
            locale: 'de_DE',
            surface: 'adobe-home',
        });

        expect(result.statusCode).to.equal(200);
        expect(result.body.fields.ctas.value).to.include(
            'data-extra-options="{&quot;actionId&quot;:&quot;try&quot;,&quot;ctx&quot;:&quot;if&quot;}"',
        );
        expect(result.body.fields.ctas.value).to.include(
            'data-extra-options="{&quot;actionId&quot;:&quot;buy&quot;,&quot;ctx&quot;:&quot;if&quot;}"',
        );
        expect(result.body.fields.ctas.value).to.not.include('\\"actionId\\"');
    });

    it('should apply promoCode from active promotion project', async () => {
        setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });

        // Active promotion for the sandbox surface, all geos, open date range
        const project = makeProject({
            id: 'proj-bf',
            path: '/content/dam/mas/promotions/black-friday',
            surfaces: ['sandbox'],
            geos: [],
            startDate: null,
            endDate: null,
        });
        fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));

        // Project-level promoCode applies to all matching fragments
        const hydrated = makeHydratedProject({
            fragmentId: 'some-fr-fr-fragment',
            fragmentPath: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
            promoCode: 'BF2025',
        });
        fetchStub.withArgs(hydrateUrl('proj-bf')).returns(createResponse(200, hydrated));

        const state = new MockState();
        const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR' });

        expect(result.statusCode).to.equal(200);
        // replace transformer resolved {{select}} placeholder
        expect(result.body.fields.ctas.value).to.include('data-analytics-id="buy-now"');
        // promotion applied promoCode from project-level wildcard
        expect(result.body.fields.promoCode).to.equal('BF2025');
    });

    it('should use promo variation over fr_CA regional variation when both match', async () => {
        setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });

        // fr_CA dictionary not available — pipeline falls back to fr_FR dict
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_CA/dictionary/index',
            )
            .returns(createResponse(404, {}, 'Not Found'));

        // Active promotion for the sandbox surface
        const project = makeProject({
            id: 'proj-bf',
            path: '/content/dam/mas/promotions/black-friday',
            surfaces: ['sandbox'],
            geos: [],
            startDate: null,
            endDate: null,
        });
        fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));

        // Project-level promoCode applies as wildcard
        const hydrated = makeHydratedProject({
            fragmentId: 'some-fr-fr-fragment',
            fragmentPath: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
            promoCode: 'BF2025',
        });
        fetchStub.withArgs(hydrateUrl('proj-bf')).returns(createResponse(200, hydrated));

        // Promo variation folder — fr_FR default locale variation
        const variationFolderUrl =
            'https://odin.adobe.com/adobe/contentFragments/?path=/content/dam/mas/sandbox/fr_FR/promotions/black-friday&limit=50';
        fetchStub.withArgs(variationFolderUrl).returns(
            createResponse(200, {
                items: [
                    {
                        id: 'promo-var-id',
                        path: '/content/dam/mas/sandbox/fr_FR/promotions/black-friday/ccd-slice-wide-cc-all-app',
                        fields: { promoText: 'Black Friday Sale' },
                    },
                ],
            }),
        );

        const state = new MockState();
        // fr_FR + CA country → regionLocale resolves to fr_CA → fr_CA regional variation would normally win
        const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR', country: 'CA' });

        expect(result.statusCode).to.equal(200);
        // Promo variation applied: promoText is set from the promo variation
        expect(result.body.fields.promoText).to.equal('Black Friday Sale');
        // fr_CA regional variation NOT applied: badge has no "canadian card"
        expect(result.body.fields.badge?.value).to.not.equal('canadian card');
        // promoCode also applied from promotion
        expect(result.body.fields.promoCode).to.equal('BF2025');
    });

    describe('per-offer promo + substitute + ignore-variations for one country, global variation for another', () => {
        const OFFER_OSI = 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ';
        const VARIATION_FOLDER_FR_FR =
            'https://odin.adobe.com/adobe/contentFragments/?path=/content/dam/mas/sandbox/fr_FR/promotions/black-friday&limit=50';

        // Active seasonal promo project targeting the fragment. For DE, the offer carries a promo
        // code, an OSI substitution, and an ignore-variations flag. A single global promo variation
        // lives in the default-locale (fr_FR) folder and applies wherever it is not ignored.
        // `withPriceElement` adds an inline price carrying the offer's osi, so the wcs transformer
        // actually resolves pricing for it (a bare `fields.osi` alone is skipped by scanMasElements).
        function setupPromoScenario(fetchStub, { withPriceElement = false } = {}) {
            setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });

            // Controlled base fragment: known osi, no local variations, so the only variation in play
            // is the project's global promo variation.
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/contentFragments/some-fr-fr-fragment?references=all-hydrated')
                .returns(
                    createResponse(200, {
                        path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                        id: 'some-fr-fr-fragment',
                        model: { id: CARD_MODEL_ID },
                        fields: {
                            variant: 'plans',
                            osi: OFFER_OSI,
                            ...(withPriceElement && {
                                prices: {
                                    value: `<span is="inline-price" data-wcs-osi="${OFFER_OSI}"></span>`,
                                    mimeType: 'text/html',
                                },
                            }),
                        },
                        references: {},
                        referencesTree: [],
                    }),
                );

            const project = makeProject({
                id: 'proj-bf',
                path: '/content/dam/mas/promotions/black-friday',
                surfaces: ['sandbox'],
                geos: [],
            });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));

            const hydrated = makeHydratedProject({
                fragmentId: 'some-fr-fr-fragment',
                fragmentPath: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
                promoCode: null,
                offers: [
                    `${OFFER_OSI}|DE20|mas:country/DE`,
                    `substitute|${OFFER_OSI}|OSI-DE|mas:country/DE`,
                    `ignore-variations|${OFFER_OSI}|mas:country/DE`,
                ],
            });
            fetchStub.withArgs(hydrateUrl('proj-bf')).returns(createResponse(200, hydrated));

            // The single global promo variation (default locale folder).
            fetchStub.withArgs(VARIATION_FOLDER_FR_FR).returns(
                createResponse(200, {
                    items: [
                        {
                            id: 'promo-var-id',
                            path: '/content/dam/mas/sandbox/fr_FR/promotions/black-friday/ccd-slice-wide-cc-all-app',
                            fields: { promoText: 'Global Promo' },
                        },
                    ],
                }),
            );
            // No region-specific variation folder for fr_DE.
            fetchStub
                .withArgs(
                    'https://odin.adobe.com/adobe/contentFragments/?path=/content/dam/mas/sandbox/fr_DE/promotions/black-friday&limit=50',
                )
                .returns(createResponse(404, {}, 'Not Found'));
        }

        it('DE (outside fr_FR market): country is restricted to FR before promo matching, so the DE-only offer never applies (MWPW-207865)', async () => {
            setupPromoScenario(fetchStub);
            const state = new MockState();
            const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR', country: 'DE' });

            expect(result.statusCode).to.equal(200);
            // DE is not a registered region of fr_FR on ACOM, so the effective country for this
            // request is restricted to FR before promo/customize matching ever runs — the DE-only
            // offer (promo code + OSI substitution + ignore-variations) never matches, and the
            // outcome is identical to an actual FR request (see the FR test just below).
            expect(result.body.fields.promoText).to.equal('Global Promo');
            expect(result.body.fields.promoCode).to.be.undefined;
            expect(result.body.fields.osi).to.equal(OFFER_OSI);
        });

        it('FR: applies the global promo variation (no ignore flag for this country)', async () => {
            setupPromoScenario(fetchStub);
            const state = new MockState();
            const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR', country: 'FR' });

            expect(result.statusCode).to.equal(200);
            // Global promo variation applies here.
            expect(result.body.fields.promoText).to.equal('Global Promo');
            // The DE-only promo code / substitution do not apply.
            expect(result.body.fields.promoCode).to.be.undefined;
            expect(result.body.fields.osi).to.equal(OFFER_OSI);
        });

        it('DE (outside fr_FR market): promo, grouped-variation matching AND WCS pricing all consistently use the restricted FR country (MWPW-207865)', async () => {
            setupPromoScenario(fetchStub, { withPriceElement: true });
            const state = new MockState();
            const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR', country: 'DE' });

            expect(result.statusCode).to.equal(200);
            // Same restriction applies here as above: DE is not in fr_FR's market family, so the
            // DE-only promo/substitution never matches, and the global variation applies instead.
            expect(result.body.fields.promoText).to.equal('Global Promo');
            expect(result.body.fields.promoCode).to.be.undefined;
            expect(result.body.fields.osi).to.equal(OFFER_OSI);
            // WCS pricing agrees with the same restricted country — there is no longer a split
            // between content/promo country and commerce country once the request country itself
            // is restricted to the locale's market family.
            const wcsCalls = fetchStub.getCalls().filter((call) => String(call.args[0]).includes('web_commerce_artifact'));
            expect(wcsCalls.length).to.be.greaterThan(0);
            expect(wcsCalls.every((call) => String(call.args[0]).includes('country=FR'))).to.be.true;
            expect(wcsCalls.some((call) => String(call.args[0]).includes('country=DE'))).to.be.false;
        });
    });

    it('does not promo-match an OSI injected into a placeholder value when the fragment osi has no explicit or wildcard mapping', async () => {
        setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });

        // Fragment prices field is a placeholder; its own osi (OWN-OSI) is NOT in the promo.
        fetchStub.withArgs('https://odin.adobe.com/adobe/contentFragments/some-fr-fr-fragment?references=all-hydrated').returns(
            createResponse(200, {
                path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                id: 'some-fr-fr-fragment',
                model: { id: CARD_MODEL_ID },
                fields: {
                    variant: 'plans',
                    osi: 'OWN-OSI',
                    prices: { value: '{{promo-price}}', mimeType: 'text/html' },
                },
                references: {},
                referencesTree: [],
            }),
        );

        // Dictionary resolves {{promo-price}} to inline price markup carrying INJECTED-OSI. This OSI
        // only exists in the baked fragment AFTER the replace transformer runs — it is invisible to
        // customize, which runs earlier.
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/dictionary/index',
            )
            .returns(createResponse(200, { id: 'sandbox_fr_FR_dictionary' }));
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/sandbox_fr_FR_dictionary?references=direct-hydrated')
            .returns(
                createResponse(200, {
                    id: 'sandbox_fr_FR_dictionary',
                    fields: { entries: ['promo-price-entry'] },
                    references: {
                        'promo-price-entry': {
                            type: 'content-fragment',
                            value: {
                                id: 'promo-price-entry',
                                path: '/content/dam/mas/sandbox/fr_FR/dictionary/promo-price',
                                fields: {
                                    key: 'promo-price',
                                    value: '<span is="inline-price" data-wcs-osi="INJECTED-OSI"></span>',
                                },
                            },
                        },
                    },
                }),
            );

        // Promo project targets this fragment's path, and does define a substitution/promo code —
        // but only for INJECTED-OSI/SUB-INJECTED, neither of which is the fragment's own osi
        // (OWN-OSI) at customize time, and there is no wildcard promoCode either. So the project
        // does not qualify for this fragment: no scope is recorded, and the OSI injected later by
        // the replace transformer is never seen by wcs.
        const project = makeProject({
            id: 'proj-bts',
            path: '/content/dam/mas/promotions/bts',
            surfaces: ['sandbox'],
            geos: [],
            startDate: null,
            endDate: null,
        });
        fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));

        const hydrated = makeHydratedProject({
            fragmentId: 'some-fr-fr-fragment',
            fragmentPath: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
            promoCode: null,
            offers: [
                'substitute|INJECTED-OSI|SUB-INJECTED|/content/cq:tags/mas/locale/fr_FR',
                'SUB-INJECTED|BTS26|/content/cq:tags/mas/locale/fr_FR',
            ],
        });
        fetchStub.withArgs(hydrateUrl('proj-bts')).returns(createResponse(200, hydrated));

        // WCS resolves the plain, unpromoted injected offer (falls through to the default
        // resolvedOffers:[] stub registered by setupFragmentMocks for any web_commerce_artifact call).
        const state = new MockState();
        const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR' });

        expect(result.statusCode).to.equal(200);
        // The placeholder-injected OSI is left untouched — no substitution happened...
        expect(result.body.fields.prices.value).to.include('data-wcs-osi="INJECTED-OSI"');
        expect(result.body.fields.prices.value).to.not.include('SUB-INJECTED');
        // ...no promo code was applied...
        expect(result.body.fields.promoCode).to.be.undefined;
        // ...and only the plain, unpromoted offer is in the WCS cache.
        const cacheKeys = Object.keys(result.body.wcs.prod);
        expect(cacheKeys.some((key) => key.startsWith('SUB-INJECTED-'))).to.be.false;
        expect(cacheKeys.some((key) => key.startsWith('INJECTED-OSI-') && !key.endsWith('bts26'))).to.be.true;
    });

    describe('acom-cc placeholder layering with country=AU', () => {
        // Stubs one `direct-hydrated` dictionary layer for (surface, locale) from a { key: value } map.
        const stubDictLayer = (surface, locale, entries) => {
            const id = `${surface}_${locale}_dictionary`;
            const references = {};
            const ids = Object.keys(entries).map((key) => {
                const refId = `entry-${surface}-${locale}-${key}`;
                references[refId] = { type: 'content-fragment', value: { id: refId, fields: { key, value: entries[key] } } };
                return refId;
            });
            fetchStub
                .withArgs(
                    `https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/${surface}/${locale}/dictionary/index`,
                )
                .returns(createResponse(200, { id }));
            fetchStub
                .withArgs(`https://odin.adobe.com/adobe/contentFragments/${id}?references=direct-hydrated`)
                .returns(createResponse(200, { fields: { entries: ids }, references }));
            return id;
        };

        // Neutralizes the surface-level machinery so the assertions isolate placeholder layering +
        // content locale: no settings entries, no promotions, empty WCS.
        const stubSurfaceNoise = () => {
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/acom-cc/settings/index')
                .returns(createResponse(200, {}));
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [] }));
            fetchStub
                .withArgs(sinon.match((url) => typeof url === 'string' && url.includes('web_commerce_artifact')))
                .returns(createResponse(200, { resolvedOffers: [] }));
        };

        it('locale en_US + country AU: content stays en_US, placeholders layer acom/en_US → acom-cc/en_US → acom-cc/en_AU', async () => {
            stubSurfaceNoise();
            fetchStub.withArgs('https://odin.adobe.com/adobe/contentFragments/acom-cc-card-us?references=all-hydrated').returns(
                createResponse(200, {
                    id: 'acom-cc-card-us',
                    path: '/content/dam/mas/acom-cc/en_US/card',
                    model: { id: CARD_MODEL_ID },
                    fields: { variant: 'ccd-slice', description: '{{baseKey}}/{{surfaceKey}}/{{label}}/{{regionKey}}' },
                    references: {},
                    referencesTree: [],
                }),
            );
            // base (acom/en_US) < surface baseline (acom-cc/en_US) < region overlay (acom-cc/en_AU)
            stubDictLayer('acom', 'en_US', { baseKey: 'base-only', surfaceKey: 'base-surface', label: 'base-label' });
            stubDictLayer('acom-cc', 'en_US', { surfaceKey: 'cc-surface', label: 'cc-label' });
            stubDictLayer('acom-cc', 'en_AU', { label: 'au-label', regionKey: 'au-region' });

            const state = new MockState();
            const result = await getFragment({ id: 'acom-cc-card-us', state, locale: 'en_US', country: 'AU' });

            expect(result.statusCode).to.equal(200);
            // Content unchanged: en_US request stays on en_US (AU is not a region of en_US).
            expect(result.body.path).to.equal('/content/dam/mas/acom-cc/en_US/card');
            // baseKey only in base, surfaceKey wins at surface baseline, label wins at region overlay, regionKey overlay-only.
            expect(result.body.fields.description).to.equal('base-only/cc-surface/au-label/au-region');
            const json = JSON.parse(state.store['req-acom-cc-card-us-en_US-AU']);
            expect(json.fragmentsIds).to.include({
                'dictionary-id-acom-en_US': 'acom_en_US_dictionary',
                'dictionary-id-acom-cc-en_US': 'acom-cc_en_US_dictionary',
                'dictionary-id-acom-cc-en_AU': 'acom-cc_en_AU_dictionary',
            });
        });

        it('locale en_GB + country AU: content resolves to en_AU variation, placeholders layer acom/en_GB → acom-cc/en_GB → acom-cc/en_AU', async () => {
            stubSurfaceNoise();
            fetchStub.withArgs('https://odin.adobe.com/adobe/contentFragments/acom-cc-card-gb?references=all-hydrated').returns(
                createResponse(200, {
                    id: 'acom-cc-card-gb',
                    path: '/content/dam/mas/acom-cc/en_GB/card',
                    model: { id: CARD_MODEL_ID },
                    fields: {
                        variant: 'ccd-slice',
                        description: '{{baseKey}}/{{surfaceKey}}/{{label}}/{{regionKey}}',
                        variations: ['var-au'],
                    },
                    references: {
                        'var-au': {
                            type: 'content-fragment',
                            value: {
                                id: 'var-au',
                                path: '/content/dam/mas/acom-cc/en_AU/card',
                                fields: { badge: { value: 'AU exclusive', mimeType: 'text/html' } },
                            },
                        },
                    },
                    referencesTree: [],
                }),
            );
            // base (acom/en_GB) < surface baseline (acom-cc/en_GB) < region overlay (acom-cc/en_AU)
            stubDictLayer('acom', 'en_GB', { baseKey: 'gb-base-only', surfaceKey: 'gb-base-surface', label: 'gb-base-label' });
            stubDictLayer('acom-cc', 'en_GB', { surfaceKey: 'gb-cc-surface', label: 'gb-cc-label' });
            stubDictLayer('acom-cc', 'en_AU', { label: 'au-label', regionKey: 'au-region' });

            const state = new MockState();
            const result = await getFragment({ id: 'acom-cc-card-gb', state, locale: 'en_GB', country: 'AU' });

            expect(result.statusCode).to.equal(200);
            // Content en_GB → en_AU: the en_AU regional variation is merged in (badge override applied).
            expect(result.body.variationId).to.equal('var-au');
            expect(result.body.fields.badge.value).to.equal('AU exclusive');
            // Placeholders base on en_GB (the request's own default language), then acom-cc/en_GB, then acom-cc/en_AU.
            expect(result.body.fields.description).to.equal('gb-base-only/gb-cc-surface/au-label/au-region');
            const json = JSON.parse(state.store['req-acom-cc-card-gb-en_GB-AU']);
            expect(json.fragmentsIds).to.include({
                'dictionary-id-acom-en_GB': 'acom_en_GB_dictionary',
                'dictionary-id-acom-cc-en_GB': 'acom-cc_en_GB_dictionary',
                'dictionary-id-acom-cc-en_AU': 'acom-cc_en_AU_dictionary',
            });
        });
    });

    // Reproduces the real /content/dam/mas/nala/en_US/cc-modal-promo-placeholder case: the base card
    // carries no rich text at all, and the `countdown-timer` link only exists in the promo variation
    // merged by customize. The countdown dates come from that same promo project.
    describe('countdown timer from a promo variation', () => {
        const CDT_START = '2001-12-12T12:12:00Z';
        const CDT_END = '2027-12-12T12:12:00Z';
        const CARD_OSI = 'PpnQ-UmW9NBwZwXlFw79zw2JybhvwIUwMTDYiIlu5qI';
        const VARIATION_DESCRIPTION =
            '<p>Buy creative for only <span is="inline-price" data-quantity="true" data-template="price" ' +
            `data-wcs-osi="${CARD_OSI}"></span></p>` +
            '<p><a class="secondary-link" href="#" target="_self">countdown-timer</a></p>';

        // Base card: every rich text field is empty, exactly like the authored fragment.
        const stubBaseCard = () =>
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/contentFragments/some-fr-fr-fragment?references=all-hydrated')
                .returns(
                    createResponse(200, {
                        path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                        id: 'some-fr-fr-fragment',
                        model: { id: CARD_MODEL_ID },
                        fields: { variant: 'headless', osi: CARD_OSI, description: '', callout: '' },
                        references: {},
                        referencesTree: [],
                    }),
                );

        const stubPromoProject = ({ cdtStart = CDT_START, cdtEnd = CDT_END } = {}) => {
            const project = makeProject({
                id: 'proj-cdt',
                path: '/content/dam/mas/promotions/nalaevergreen',
                surfaces: ['sandbox'],
                geos: [],
                startDate: '2026-05-01T15:09:00Z',
                endDate: null, // evergreen, like the real project
                tags: ['mas:promotion/nala-evergreen'],
                cdtStart,
                cdtEnd,
            });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-cdt')).returns(
                createResponse(
                    200,
                    makeHydratedProject({
                        fragmentId: 'some-fr-fr-fragment',
                        fragmentPath: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
                        promoCode: 'NICOPROMO',
                        title: 'NalaEvergreen',
                    }),
                ),
            );
        };

        // The promo variation is the only place the countdown-timer link exists.
        const stubPromoVariation = (description = VARIATION_DESCRIPTION) =>
            fetchStub
                .withArgs(
                    'https://odin.adobe.com/adobe/contentFragments/?path=/content/dam/mas/sandbox/fr_FR/promotions/nala-evergreen&limit=50',
                )
                .returns(
                    createResponse(200, {
                        items: [
                            {
                                id: 'promo-var-cdt',
                                path: '/content/dam/mas/sandbox/fr_FR/promotions/nala-evergreen/ccd-slice-wide-cc-all-app',
                                fields: {
                                    cardTitle: 'Creative cloud promotion!',
                                    subtitle: 'Get a great discount on creativecloud',
                                    description: { mimeType: 'text/html', value: description },
                                },
                            },
                        ],
                    }),
                );

        it('exposes cdtStart/cdtEnd when the merged promo variation carries the countdown-timer link', async () => {
            setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });
            stubBaseCard();
            stubPromoProject();
            stubPromoVariation();

            const state = new MockState();
            const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR' });

            expect(result.statusCode).to.equal(200);
            expect(result.body.variationId).to.equal('promo-var-cdt');
            expect(result.body.promoProject).to.equal('NalaEvergreen');
            expect(result.body.fields.description.value).to.include('countdown-timer');
            expect(result.body.cdtStart).to.equal(CDT_START);
            expect(result.body.cdtEnd).to.equal(CDT_END);
        });

        // The `countdown-timer` link is supplied by a dictionary placeholder, so it only exists once
        // `replace` has expanded it - after `customize` ran.
        const stubDictionary = (entries) => {
            const references = {};
            const ids = Object.keys(entries).map((key) => {
                const refId = `entry-${key}`;
                references[refId] = { type: 'content-fragment', value: { id: refId, fields: { key, value: entries[key] } } };
                return refId;
            });
            fetchStub
                .withArgs(
                    'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/dictionary/index',
                )
                .returns(createResponse(200, { id: 'sandbox_fr_FR_dictionary' }));
            fetchStub
                .withArgs('https://odin.adobe.com/adobe/contentFragments/sandbox_fr_FR_dictionary?references=direct-hydrated')
                .returns(createResponse(200, { fields: { entries: ids }, references }));
        };

        it('exposes cdtStart/cdtEnd when the countdown-timer link comes from a placeholder', async () => {
            setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });
            stubBaseCard();
            stubPromoProject();
            stubPromoVariation('<p>{{promo-countdown}}</p>');
            stubDictionary({ 'promo-countdown': '<a class="secondary-link" href="#">countdown-timer</a>' });

            const state = new MockState();
            const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR' });

            expect(result.statusCode).to.equal(200);
            expect(result.body.fields.description.value).to.include('countdown-timer');
            expect(result.body.cdtStart).to.equal(CDT_START);
            expect(result.body.cdtEnd).to.equal(CDT_END);
        });

        it('exposes nothing when the promo project only defines one of the two dates', async () => {
            setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });
            stubBaseCard();
            stubPromoProject({ cdtEnd: null });
            stubPromoVariation();

            const state = new MockState();
            const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR' });

            expect(result.statusCode).to.equal(200);
            expect(result.body.fields.description.value).to.include('countdown-timer');
            expect(result.body.cdtStart).to.be.undefined;
            expect(result.body.cdtEnd).to.be.undefined;
        });
    });
});
