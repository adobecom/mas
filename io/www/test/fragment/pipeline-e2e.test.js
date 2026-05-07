import { expect } from 'chai';
import sinon from 'sinon';
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

    it('should return fully baked /content/dam/mas/sandbox/fr_FR/someFragment from preview too', async () => {
        const previewStorage = {};
        globalThis.localStorage = {
            getItem: (key) => previewStorage[key] ?? null,
            setItem: (key, value) => {
                previewStorage[key] = value;
            },
        };
        setupFragmentMocks(
            fetchStub,
            {
                id: 'some-en-us-fragment',
                path: 'someFragment',
            },
            true,
        );
        const state = new MockState();
        const result = await getFragment({
            id: 'some-en-us-fragment',
            preview: {
                url: 'https://odinpreview.corp.adobe.com/adobe/contentFragments',
            },
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
        delete globalThis.localStorage;
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
            path: '/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app',
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
            path: '/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app',
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
            .withArgs('https://odin.adobe.com/adobe/contentFragments?path=/content/dam/mas/promotions')
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

        // Offer matches the fr_FR fragment OSI
        const FR_FR_OSI = 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ';
        const hydrated = makeHydratedProject({ fragmentId: 'some-fr-fr-fragment', osi: FR_FR_OSI, promoCode: 'BF2025' });
        fetchStub.withArgs(hydrateUrl('proj-bf')).returns(createResponse(200, hydrated));

        const state = new MockState();
        const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR' });

        expect(result.statusCode).to.equal(200);
        // replace transformer resolved {{select}} placeholder
        expect(result.body.fields.ctas.value).to.include('data-analytics-id="buy-now"');
        // promotion applied promoCode
        expect(result.body.promoCode).to.equal('BF2025');
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

        // Offer + promo variation reference in the hydrated project
        const FR_FR_OSI = 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ';
        const hydrated = makeHydratedProject({
            fragmentId: 'some-fr-fr-fragment',
            osi: FR_FR_OSI,
            promoCode: 'BF2025',
            variations: ['promo-var-id'],
        });
        hydrated.references['promo-var-id'] = {
            type: 'content-fragment',
            value: {
                id: 'promo-var-id',
                path: '/content/dam/mas/sandbox/fr_FR/promotions/black-friday/ccd-slice-wide-cc-all-app',
                fields: { promoText: 'Black Friday Sale' },
            },
        };
        fetchStub.withArgs(hydrateUrl('proj-bf')).returns(createResponse(200, hydrated));

        const state = new MockState();
        // fr_FR + CA country → regionLocale resolves to fr_CA → fr_CA regional variation would normally win
        const result = await getFragment({ id: 'some-en-us-fragment', state, locale: 'fr_FR', country: 'CA' });

        expect(result.statusCode).to.equal(200);
        // Promo variation applied: promoText is set from the promo variation
        expect(result.body.fields.promoText).to.equal('Black Friday Sale');
        // fr_CA regional variation NOT applied: badge has no "canadian card"
        expect(result.body.fields.badge?.value).to.not.equal('canadian card');
        // promoCode also applied from promotion
        expect(result.body.promoCode).to.equal('BF2025');
    });
});
