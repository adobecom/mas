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
                'dictionary-id': 'sandbox_fr_FR_dictionary',
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

    it('should fetch dictionary from regional path when locale=fr_FR + country=BE', async () => {
        setupFragmentMocks(fetchStub, { id: 'some-en-us-fragment', path: 'someFragment' });
        // Override the fr_FR dictionary stub from setupFragmentMocks → empty response to ensure
        // a fr_FR fetch would NOT yield a dictionary-id (forces the regression test to be honest).
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/dictionary/index',
            )
            .returns(createResponse(200, {}));
        // Mock fr_BE dictionary explicitly.
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_BE/dictionary/index',
            )
            .returns(createResponse(200, { id: 'sandbox_fr_BE_dictionary' }));
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/sandbox_fr_BE_dictionary?references=all-hydrated')
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
        expect(json.fragmentsIds['dictionary-id']).to.equal('sandbox_fr_BE_dictionary');
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
});
