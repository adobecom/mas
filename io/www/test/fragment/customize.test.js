import { expect } from 'chai';
import sinon from 'sinon';
import { createResponse } from './mocks/MockFetch.js';
import { MockState } from './mocks/MockState.js';
import { CARD_MODEL_ID, COLLECTION_MODEL_ID } from '../../src/fragment/utils/common.js';
import { deepMerge, transformer as customize } from '../../src/fragment/transformers/customize.js';
import { transformer as defaultLanguage } from '../../src/fragment/transformers/defaultLanguage.js';
import FRAGMENT_RESPONSE_FR from './mocks/fragment-fr.json' with { type: 'json' };
import FRAGMENT_COLL_RESPONSE_US from './mocks/collection-customization.json' with { type: 'json' };

const FAKE_CONTEXT = {
    status: 200,
    debugLogs: true,
    state: new MockState(),
    surface: 'sandbox',
    parsedLocale: 'en_US',
    networkConfig: {
        retries: 1,
        retryDelay: 0,
    },
    loggedTransformer: 'customize',
    requestId: 'mas-customize-ut',
};

let fetchStub;

function mockFrenchFragment() {
    fetchStub
        .withArgs('https://odin.adobe.com/adobe/contentFragments/some-fr-fr-fragment?references=all-hydrated')
        .returns(createResponse(200, FRAGMENT_RESPONSE_FR));
    fetchStub
        .withArgs(
            'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        )
        .returns(createResponse(200, { id: 'some-fr-fr-fragment' }));
}

describe('customize collections', function () {
    it('should have a working deep Merge function', function () {
        const obj1 = {
            a: 1,
            b: {
                c: 2,
                d: 3,
            },
            e: [1, 2, 3],
            h: [7, 8],
        };
        const obj2 = {
            b: {
                c: 20,
                f: 4,
            },
            e: [4, 5],
            g: 6,
            h: [],
        };
        const expected = {
            a: 1,
            b: {
                c: 20,
                d: 3,
                f: 4,
            },
            e: [4, 5],
            g: 6,
            h: [7, 8],
        };
        const result = deepMerge(obj1, obj2);
        expect(result).to.deep.equal(expected);
    });

    it('should preserve nested id and path fields (e.g. model.id after pzn merge)', function () {
        const root = { id: 'root-id', path: '/root', model: { id: 'model-id', title: 'Card' } };
        const variation = { id: 'var-id', path: '/var', model: { title: 'Card Variation' } };
        const result = deepMerge(root, variation);
        // top-level id/path come from root (DO_NOT_MERGE_KEYS)
        expect(result.id).to.equal('root-id');
        expect(result.path).to.equal('/root');
        // nested model.id must be preserved — not dropped by DO_NOT_MERGE_KEYS recursion
        expect(result.model.id).to.equal('model-id');
        expect(result.model.title).to.equal('Card Variation');
    });

    it('should preserve left value when right has undefined (e.g. fields.variant)', function () {
        const left = { fields: { variant: 'regional-variant', title: 'Root' } };
        const right = { fields: { variant: undefined, title: 'Regional' } };
        const result = deepMerge(left, right);
        expect(result.fields.variant).to.equal('regional-variant');
        expect(result.fields.title).to.equal('Regional');
    });

    it('should erase variant when right has empty string', function () {
        const left = { fields: { variant: 'regional-variant' } };
        const right = { fields: { variant: '' } };
        const result = deepMerge(left, right);
        expect(result.fields.variant).to.equal('');
    });

    it('should preserve parent features when compare-chart-column template omits features', function () {
        const parent = {
            fields: {
                variant: 'compare-chart-column',
                features: { value: ['<p name="group-a@parent-only">Parent only</p>'] },
            },
        };
        const child = { fields: { title: 'Regional title' } };
        const result = deepMerge(parent, child);
        expect(result.fields.features.value).to.deep.equal(['<p name="group-a@parent-only">Parent only</p>']);
        expect(result.fields.title).to.equal('Regional title');
    });

    it('should append child features to parent features for compare-chart-column template', async function () {
        const childOnlyResult = deepMerge(
            {
                fields: {
                    variant: 'compare-chart-column',
                    title: 'Parent title',
                },
            },
            {
                fields: {
                    features: { value: ['<p name="group-a@child-only">Child only</p>'] },
                },
            },
        );
        expect(childOnlyResult.fields.features.value).to.deep.equal(['<p name="group-a@child-only">Child only</p>']);
        expect(childOnlyResult.fields.title).to.equal('Parent title');

        const body = {
            path: '/content/dam/mas/sandbox/en_US/compare-chart-card',
            id: 'compare-chart-card',
            title: 'Compare chart card',
            fields: {
                variant: 'compare-chart-column',
                features: {
                    value: ['<p name="group-a@parent-only">Parent only</p>', '<p name="group-a@override">Parent value</p>'],
                },
                variations: ['compare-chart-card-be'],
            },
            references: {
                'compare-chart-card-be': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_BE/compare-chart-card',
                        id: 'compare-chart-card-be',
                        fields: {
                            features: { value: ['<p name="group-a@override">Child value</p>'] },
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'compare-chart-card',
            locale: 'en_BE',
            parsedLocale: 'en_US',
            body,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.features.value).to.deep.equal([
            '<p name="group-a@parent-only">Parent only</p>',
            '<p name="group-a@override">Parent value</p>',
            '<p name="group-a@override">Child value</p>',
        ]);
    });

    it('should customize subcollections and sub fragments', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'another-collection',
            locale: 'en_KW',
            id: 'coll-en-us',
            body: FRAGMENT_COLL_RESPONSE_US,
        });

        expect(result.status).to.equal(200);

        expect(result.body.fields.collections[0], 'expecting main fragment collections field to keep default id').to.equal(
            'subcoll-en-us',
        );

        expect(
            result.body.referencesTree[0].identifier,
            'expecting main fragment reference tree to keep default fragment id',
        ).to.equal('subcoll-en-us');

        expect(
            result.body.references['subcoll-en-us'].value.fields.cards,
            'expecting cards field in references to be customized under default id',
        ).to.deep.equal(['some-card-en-us', 'some-other-card-en-us']);

        expect(result.body.references['subcoll-en-us'].value.id, 'merged subcollection keeps default id').to.equal(
            'subcoll-en-us',
        );

        expect(
            result.body.referencesTree[0].referencesTree[0].identifier,
            'expecting 1st card to not be customized in references tree',
        ).to.deep.equal('some-card-en-us');

        expect(
            result.body.referencesTree[0].referencesTree[1].identifier,
            'expecting 2nd card to keep default id after regional merge',
        ).to.deep.equal('some-other-card-en-us');

        const cardKW = result.body.references['some-other-card-en-us'].value;
        expect(cardKW.title).to.equal('Photography Promo KW');
        expect(cardKW.fields.cardTitle).to.equal('Photography  (1TB)');
        expect(cardKW.fields.backgroundImage).to.equal('https://www.adobe.com/my/image.jpg');
    });

    it('should merge personalization (PZN) variation when pznTags match regionLocale', async function () {
        const pznVariationId = 'pzn-var-en-kw';
        const pznOtherVariationId = 'pzn-test';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId, pznOtherVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_KW/PA-123/pzn/intro',
                        id: pznVariationId,
                        title: 'Intro pricing',
                        fields: {
                            pznTags: ['/content/cq:tags/mas/locale/en_KW'],
                            badge: 'Kuwait PZN badge',
                        },
                    },
                },
                [pznOtherVariationId]: {
                    path: '/content/dam/mas/sandbox/en_KW/PA-123/pzn/pzn-test',
                    id: pznOtherVariationId,
                    title: 'test variation',
                    description: 'has en_KW too, but appears second in the list',
                    fields: {
                        pznTags: [
                            '/content/cq:tags/mas/locale/en_US',
                            '/content/cq:tags/mas/locale/en_CA',
                            '/content/cq:tags/mas/locale/en_KW',
                        ],
                        badge: 'TEST badge',
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_KW',
            parsedLocale: 'en_US',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Kuwait PZN badge');
    });

    it('should merge personalization when pznTags end with pzn/country/<country>', async function () {
        const pznVariationId = 'pzn-var-country';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_KW/PA-123/pzn/country',
                        id: pznVariationId,
                        title: 'Country targeting',
                        fields: {
                            pznTags: ['experience-fragments:mas/sandbox/pzn/country/KW'],
                            badge: 'Kuwait country PZN',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            country: 'KW',
            parsedLocale: 'en_US',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Kuwait country PZN');
    });

    it('should merge personalization using country implied by locale when country param is absent', async function () {
        const pznVariationId = 'pzn-var-br-locale-implied';
        const bodyWithPzn = {
            path: '/content/dam/mas/express/pt_BR/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/express/pt_BR/PA-484/pzn/individual-edu-country-br',
                        id: pznVariationId,
                        title: 'Brazil country targeting',
                        fields: {
                            pznTags: ['experience-fragments:mas/express/pzn/country/br'],
                            badge: 'Brazil country PZN',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            surface: 'express',
            fragmentPath: 'pzn-test-fragment',
            locale: 'pt_BR',
            parsedLocale: 'pt_BR',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Brazil country PZN');
    });

    it('should merge personalization when country is MX and pznTags end with pzn/country/MX', async function () {
        const pznVariationId = 'pzn-var-mx';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/mx',
                        id: pznVariationId,
                        title: 'Mexico country targeting',
                        fields: {
                            pznTags: ['mas:sandbox/pzn/country/MX'],
                            badge: 'Mexico country PZN',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            country: 'MX',
            parsedLocale: 'en_US',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Mexico country PZN');
    });

    it('should merge personalization when pzn is TEAMS, EDU and tags match pzn/TEAMS and pzn/EDU', async function () {
        const pznVariationId = 'pzn-var-teams-edu';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/teams-edu',
                        id: pznVariationId,
                        title: 'Teams and EDU',
                        fields: {
                            pznTags: ['mas:audiences/pzn/TEAMS', 'mas:audiences/pzn/EDU'],
                            badge: 'Teams and EDU PZN',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            parsedLocale: 'en_US',
            pzn: 'TEAMS, EDU',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Teams and EDU PZN');
    });

    it('should prefer TEAMS+EDU variation over TEAMS-only when pzn is TEAMS, EDU', async function () {
        const teamsOnlyId = 'pzn-teams-only';
        const teamsEduId = 'pzn-teams-edu-combo';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [teamsOnlyId, teamsEduId],
            },
            references: {
                [teamsOnlyId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/teams-only',
                        id: teamsOnlyId,
                        title: 'Teams only',
                        fields: {
                            pznTags: ['mas:offers/pzn/TEAMS'],
                            badge: 'Teams only badge',
                        },
                    },
                },
                [teamsEduId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/teams-edu-combo',
                        id: teamsEduId,
                        title: 'Teams and EDU combo',
                        fields: {
                            pznTags: ['mas:offers/pzn/TEAMS', 'mas:offers/pzn/EDU'],
                            badge: 'Teams and EDU combo badge',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            parsedLocale: 'en_US',
            pzn: 'TEAMS, EDU',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Teams and EDU combo badge');
    });

    it('should prefer MX country plus TEAMS and EDU tags over TEAMS+EDU only when country is MX and pzn is TEAMS, EDU', async function () {
        const teamsEduOnlyId = 'pzn-mx-teams-edu-no-country-tag';
        const teamsEduMxId = 'pzn-mx-teams-edu-with-country';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [teamsEduOnlyId, teamsEduMxId],
            },
            references: {
                [teamsEduOnlyId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/no-country',
                        id: teamsEduOnlyId,
                        title: 'TEAMS+EDU no country tag',
                        fields: {
                            pznTags: ['mas:seg/pzn/TEAMS', 'mas:seg/pzn/EDU'],
                            badge: 'TEAMS EDU without MX',
                        },
                    },
                },
                [teamsEduMxId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/with-mx',
                        id: teamsEduMxId,
                        title: 'TEAMS+EDU with MX',
                        fields: {
                            pznTags: ['mas:seg/pzn/country/MX', 'mas:seg/pzn/TEAMS', 'mas:seg/pzn/EDU'],
                            badge: 'TEAMS EDU Mexico',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            country: 'MX',
            parsedLocale: 'en_US',
            pzn: 'TEAMS, EDU',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('TEAMS EDU Mexico');
    });

    it('should merge personalization when a tag ends with pzn/<token>', async function () {
        const pznVariationId = 'pzn-var-pzn-slash-token';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/pzn-slash',
                        id: pznVariationId,
                        title: 'pzn/ token',
                        fields: {
                            pznTags: ['mas:commerce/campaigns/pzn/winter-sale'],
                            badge: 'Winter sale PZN',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            parsedLocale: 'en_US',
            pzn: 'winter-sale',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Winter sale PZN');
    });

    it('should prefer personalization variation that matches more pzn tokens', async function () {
        const oneTokenId = 'pzn-one-token';
        const twoTokenId = 'pzn-two-tokens';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [oneTokenId, twoTokenId],
            },
            references: {
                [oneTokenId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/one',
                        id: oneTokenId,
                        title: 'One token',
                        fields: {
                            pznTags: ['mas:pzn/segment-a'],
                            badge: 'One token badge',
                        },
                    },
                },
                [twoTokenId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/two',
                        id: twoTokenId,
                        title: 'Two tokens',
                        fields: {
                            pznTags: ['mas:pzn/segment-a', 'mas:offers/pzn/promo-b'],
                            badge: 'Two tokens badge',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            parsedLocale: 'en_US',
            pzn: 'segment-a,promo-b',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Two tokens badge');
    });

    it('should merge personalization when a comma-separated pzn token matches a tag suffix', async function () {
        const pznVariationId = 'pzn-var-token';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/token',
                        id: pznVariationId,
                        title: 'Token targeting',
                        fields: {
                            pznTags: ['mas:commerce/pzn/promo-tier-gold'],
                            badge: 'Gold tier PZN',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            parsedLocale: 'en_US',
            pzn: 'silver, promo-tier-gold ',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Gold tier PZN');
    });

    it('should match pzn tag when pzn is the top-level namespace (mas:pzn/edu, no intermediate folder)', async function () {
        const pznVariationId = 'pzn-var-edu';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/cc-plans-photoshop-individuals-default',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/phsp_direct_individual/pzn/photoshop-individual-edu',
                        id: pznVariationId,
                        title: 'EDU variation',
                        fields: {
                            pznTags: ['mas:pzn/edu'],
                            badge: 'Students badge',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'cc-plans-photoshop-individuals-default',
            locale: 'en_US',
            parsedLocale: 'en_US',
            pzn: 'edu',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Students badge');
        expect(result.body.variationId).to.equal(pznVariationId);
    });

    it('should coerce non-string pzn to string for token matching', async function () {
        const pznVariationId = 'pzn-numeric-token';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/numeric',
                        id: pznVariationId,
                        title: 'Numeric pzn',
                        fields: {
                            pznTags: ['mas:segments/pzn/42'],
                            badge: 'Numeric PZN badge',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            parsedLocale: 'en_US',
            pzn: 42,
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Numeric PZN badge');
    });

    it('should skip PZN variations with invalid or empty pznTags and merge a valid one', async function () {
        const emptyArrayId = 'pzn-empty-array-tags';
        const invalidArrayId = 'pzn-invalid-tags-array';
        const emptyTagsId = 'pzn-all-falsy-tags';
        const validId = 'pzn-valid-after-invalid';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [emptyArrayId, invalidArrayId, emptyTagsId, validId],
            },
            references: {
                [emptyArrayId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/empty-array',
                        id: emptyArrayId,
                        title: 'Empty pznTags array',
                        fields: {
                            pznTags: [],
                            badge: 'Empty array should not win',
                        },
                    },
                },
                [invalidArrayId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/invalid',
                        id: invalidArrayId,
                        title: 'Not an array',
                        fields: {
                            pznTags: 'mas:pzn/not-a-tag-array',
                            badge: 'Should not win',
                        },
                    },
                },
                [emptyTagsId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/empty-tags',
                        id: emptyTagsId,
                        title: 'Only falsy tag entries',
                        fields: {
                            pznTags: ['', null, undefined],
                            badge: 'Also should not win',
                        },
                    },
                },
                [validId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/valid',
                        id: validId,
                        title: 'Valid tags',
                        fields: {
                            pznTags: ['/content/cq:tags/mas/locale/en_US'],
                            badge: 'Valid PZN badge',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            parsedLocale: 'en_US',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('Valid PZN badge');
        expect(result.body.id).to.equal('root-fragment');
        expect(result.body.variationId).to.equal(validId);
    });

    it('should adapt referencesTree to match merged cards list (drop removed card, reorder)', async function () {
        // Default fragment has 4 cards in referencesTree but the variation (en_BE) only has 3 cards in a different order
        const body = {
            path: '/content/dam/mas/sandbox/en_US/coll-adapt-test',
            id: 'coll-root',
            title: 'Adapt test collection',
            fields: {
                cards: ['card-a', 'card-b', 'card-c', 'card-d'],
                collections: [],
                variations: ['coll-root-be'],
            },
            references: {
                'coll-root-be': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_BE/coll-adapt-test',
                        id: 'coll-root-be',
                        fields: {
                            // variation removes card-b and reorders
                            cards: ['card-c', 'card-a', 'card-d'],
                            collections: [],
                        },
                    },
                },
                'card-a': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/card-a',
                        id: 'card-a',
                        fields: { title: 'Card A', variations: [] },
                    },
                },
                'card-b': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/card-b',
                        id: 'card-b',
                        fields: { title: 'Card B', variations: [] },
                    },
                },
                'card-c': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/card-c',
                        id: 'card-c',
                        fields: { title: 'Card C', variations: [] },
                    },
                },
                'card-d': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/card-d',
                        id: 'card-d',
                        fields: { title: 'Card D', variations: [] },
                    },
                },
            },
            referencesTree: [
                { fieldName: 'cards', identifier: 'card-a', referencesTree: [] },
                { fieldName: 'cards', identifier: 'card-b', referencesTree: [] },
                { fieldName: 'cards', identifier: 'card-c', referencesTree: [] },
                { fieldName: 'cards', identifier: 'card-d', referencesTree: [] },
                { fieldName: 'variations', identifier: 'coll-root-be', referencesTree: [] },
            ],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'coll-adapt-test',
            locale: 'en_BE',
            parsedLocale: 'en_US',
            body,
        });

        expect(result.status).to.equal(200);

        // merged fragment cards should follow the variation order
        expect(result.body.fields.cards).to.deep.equal(['card-c', 'card-a', 'card-d']);

        // referencesTree should reflect the merged cards: card-b removed, order updated
        const cardEntries = result.body.referencesTree.filter((e) => e.fieldName === 'cards');
        expect(cardEntries.map((e) => e.identifier)).to.deep.equal(['card-c', 'card-a', 'card-d']);
    });

    it('should create stub referencesTree entry for a card added by a variation that had no entry in original tree', async function () {
        const body = {
            path: '/content/dam/mas/sandbox/en_US/coll-new-card-test',
            id: 'coll-new-card-root',
            title: 'New card stub test',
            fields: {
                cards: ['card-a'],
                collections: [],
                variations: ['coll-new-card-be'],
            },
            references: {
                'coll-new-card-be': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_BE/coll-new-card-test',
                        id: 'coll-new-card-be',
                        fields: { cards: ['card-a', 'card-new'], collections: [] },
                    },
                },
                'card-a': {
                    type: 'content-fragment',
                    value: { path: '/content/dam/mas/sandbox/en_US/card-a', id: 'card-a', fields: { variations: [] } },
                },
                'card-new': {
                    type: 'content-fragment',
                    value: { path: '/content/dam/mas/sandbox/en_US/card-new', id: 'card-new', fields: { variations: [] } },
                },
            },
            referencesTree: [
                { fieldName: 'cards', identifier: 'card-a', referencesTree: [] },
                // card-new has no entry in the original referencesTree
                { fieldName: 'variations', identifier: 'coll-new-card-be', referencesTree: [] },
            ],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'coll-new-card-test',
            locale: 'en_BE',
            parsedLocale: 'en_US',
            body,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.cards).to.deep.equal(['card-a', 'card-new']);
        const cardEntries = result.body.referencesTree.filter((e) => e.fieldName === 'cards');
        expect(cardEntries.map((e) => e.identifier)).to.deep.equal(['card-a', 'card-new']);
        // stub entry for card-new should have empty referencesTree
        expect(cardEntries[1].referencesTree).to.deep.equal([]);
    });

    it('should propagate adapted referencesTree of a child collection up to the parent', async function () {
        // Parent collection has no variation. Child subcollection has a pzn variation that swaps the last card.
        // Without propagation, the parent's referencesTree[subcoll].referencesTree still lists the base cards,
        // while references[subcoll].value.fields.cards lists the variation cards — causing renderers to mismatch.
        const body = {
            path: '/content/dam/mas/sandbox/en_US/root-coll',
            id: 'root-coll',
            title: 'Root',
            fields: {
                cards: [],
                collections: ['subcoll'],
                variations: [],
            },
            references: {
                subcoll: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/subcoll',
                        id: 'subcoll',
                        fields: {
                            cards: ['card-a', 'card-base-last'],
                            collections: [],
                            variations: ['subcoll-pzn'],
                        },
                    },
                },
                'subcoll-pzn': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-1/pzn/subcoll-en-us',
                        id: 'subcoll-pzn',
                        fields: {
                            pznTags: ['mas:locale/en_US'],
                            cards: ['card-a', 'card-pzn-last'],
                        },
                    },
                },
                'card-a': {
                    type: 'content-fragment',
                    value: { path: '/content/dam/mas/sandbox/en_US/card-a', id: 'card-a', fields: { variations: [] } },
                },
                'card-base-last': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/card-base-last',
                        id: 'card-base-last',
                        fields: { variations: [] },
                    },
                },
                'card-pzn-last': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/card-pzn-last',
                        id: 'card-pzn-last',
                        fields: { variations: [] },
                    },
                },
            },
            referencesTree: [
                {
                    fieldName: 'collections',
                    identifier: 'subcoll',
                    referencesTree: [
                        { fieldName: 'cards', identifier: 'card-a', referencesTree: [] },
                        { fieldName: 'cards', identifier: 'card-base-last', referencesTree: [] },
                        { fieldName: 'variations', identifier: 'subcoll-pzn', referencesTree: [] },
                    ],
                },
            ],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'root-coll',
            locale: 'en_US',
            parsedLocale: 'en_US',
            body,
        });

        expect(result.status).to.equal(200);

        // sanity: subcoll value in references has the pzn cards
        expect(result.body.references.subcoll.value.fields.cards).to.deep.equal(['card-a', 'card-pzn-last']);

        // the parent's referencesTree[subcoll].referencesTree must reflect the pzn cards, NOT the base ones
        const subcollEntry = result.body.referencesTree.find((e) => e.identifier === 'subcoll');
        const subcollCardIds = subcollEntry.referencesTree.filter((e) => e.fieldName === 'cards').map((e) => e.identifier);
        expect(subcollCardIds).to.deep.equal(['card-a', 'card-pzn-last']);
    });

    it('should not merge personalization variation when no pznTags match regionLocale', async function () {
        const pznVariationId = 'pzn-var-other';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: { value: 'default badge', mimeType: 'text/html' },
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/promo',
                        id: pznVariationId,
                        title: 'PZN Promo',
                        fields: {
                            pznTags: ['/content/cq:tags/mas/locale/en_AE', '/content/cq:tags/mas/locale/fr_FR'],
                            badge: 'Other badge',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            parsedLocale: 'en_US',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.deep.include({ value: 'default badge', mimeType: 'text/html' });
    });

    it('should NOT apply a pzn variation located under en_US when the fragment is in fr_FR', async function () {
        const pznVariationId = 'pzn-var-en-us-wrong-locale';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/fr_FR/some-fr-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/en-us-variant',
                        id: pznVariationId,
                        title: 'EN US pzn variant',
                        fields: {
                            pznTags: ['/content/cq:tags/mas/locale/en_US'],
                            badge: 'EN US PZN badge',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'some-fr-fragment',
            locale: 'fr_FR',
            parsedLocale: 'fr_FR',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        // pzn variation lives under en_US path, must NOT be applied to a fr_FR fragment
        expect(result.body.fields.badge).to.equal('default badge');
    });

    it('should ignore pzn and not apply any variation when pzn contains invalid characters', async function () {
        const pznVariationId = 'pzn-var-winter-sale';
        const bodyWithPzn = {
            path: '/content/dam/mas/sandbox/en_US/pzn-test-fragment',
            id: 'root-fragment',
            title: 'Root',
            fields: {
                badge: 'default badge',
                variations: [pznVariationId],
            },
            references: {
                [pznVariationId]: {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/PA-123/pzn/winter-sale',
                        id: pznVariationId,
                        title: 'Winter sale pzn',
                        fields: {
                            pznTags: ['mas:commerce/campaigns/pzn/winter-sale'],
                            badge: 'Winter sale PZN',
                        },
                    },
                },
            },
            referencesTree: [],
        };

        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'pzn-test-fragment',
            locale: 'en_US',
            parsedLocale: 'en_US',
            pzn: '../evil;drop table',
            body: bodyWithPzn,
        });

        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('default badge');
    });
});

async function process(context) {
    const phase1 = {
        status: 200,
        body: context.body,
        parsedLocale: context.parsedLocale,
        surface: context.surface,
        fragmentPath: context.fragmentPath,
    };
    const promises = {
        fetchFragment: Promise.resolve(phase1),
    };
    promises.defaultLanguage = defaultLanguage.init({ ...context, promises });
    context.promises = promises;
    return await customize.process(context);
}

async function processWithPromos(context, activeProject, promoMap) {
    const phase1 = {
        status: 200,
        body: context.body,
        parsedLocale: context.parsedLocale ?? 'en_US',
        surface: context.surface ?? 'sandbox',
        fragmentPath: context.fragmentPath,
    };
    const activeProjects = activeProject ? [activeProject] : [];
    const promises = {
        fetchFragment: Promise.resolve(phase1),
        promotions: Promise.resolve({ activeProjects }),
    };
    promises.defaultLanguage = defaultLanguage.init({ ...context, promises });
    context.promises = promises;
    if (activeProject) {
        // Mirror the real promotions process step: fragmentPaths come from the project itself.
        const fragmentPaths = new Set(activeProject.fragmentPaths ?? []);
        context.promoProjects = [{ project: activeProject, promoMap: promoMap ?? {}, fragmentPaths }];
    }
    return await customize.process(context);
}

async function processWithPromoProjects(context, promoProjects) {
    const phase1 = {
        status: 200,
        body: context.body,
        parsedLocale: context.parsedLocale ?? 'en_US',
        surface: context.surface ?? 'sandbox',
        fragmentPath: context.fragmentPath,
    };
    const activeProjects = promoProjects.map(({ project }) => project);
    const promises = {
        fetchFragment: Promise.resolve(phase1),
        promotions: Promise.resolve({ activeProjects }),
    };
    promises.defaultLanguage = defaultLanguage.init({ ...context, promises });
    context.promises = promises;
    context.promoProjects = promoProjects;
    return await customize.process(context);
}

describe('customize typical cases', function () {
    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('should return fr fragment (us fragment, fr locale)', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        });
    });

    it('should return canadian fragment with override (us fragment, fr locale, ca country)', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
            country: 'CA',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        });
        expect(result.body.fields.badge.value).to.equal('canadian card');
        expect(result.body.fields.description.value).to.equal('<p>french default description</p>');
        //icons should have been overridden
        expect(result.body.fields.mnemonicIcon.length).to.equal(2);
    });

    it('should surface error when default locale fragment fetch fails', async function () {
        const fragmentPath = 'ccd-slice-wide-cc-all-app';
        const defaultLocaleId = 'some-fr-fr-fragment';
        fetchStub
            .withArgs(
                `https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/${fragmentPath}`,
            )
            .returns(createResponse(200, { id: defaultLocaleId }));
        fetchStub
            .withArgs(`https://odin.adobe.com/adobe/contentFragments/${defaultLocaleId}?references=all-hydrated`)
            .returns(createResponse(503, { detail: 'fetch error' }, 'Service Unavailable'));

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath,
            locale: 'fr_CA',
        });

        expect(result.status).to.equal(503);
        expect(result.message).to.equal('fetch error');
    });

    it('should return swiss fragment with override (us fragment, fr locale, ch country)', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
            country: 'CH',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        });
        expect(result.body.fields.badge.value).to.equal('swiss card');
        expect(result.body.fields.description.value).to.equal('<p>swiss description</p>');
        //icons should have been inherited
        expect(result.body.fields.mnemonicIcon.length).to.equal(1);
    });

    it('should return fr fragment (us fragment, fr_BE locale)', async function () {
        // french fragment by id
        mockFrenchFragment();
        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            locale: 'fr_BE',
            fragmentPath: 'ccd-slice-wide-cc-all-app',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        });
    });

    it('should return french fragment if country is not supported (us fragment, fr locale, zz country)', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_ZZ',
            country: 'ZZ',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
        });
    });

    it('should return 400 if language is not supported', async function () {
        // french fragment by id
        mockFrenchFragment();

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'zz_CH',
            country: 'CH',
        });
        expect(result.status).to.equal(400);
        expect(result.message).to.equal("Default locale not found for requested locale 'zz_CH'");
    });

    it('should return en_US fragment (us fragment, en_KW locale)', async function () {
        const usFragment = structuredClone(FRAGMENT_RESPONSE_FR);
        usFragment.path = '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app';
        usFragment.fields.variations = [''];
        // french fragment by id
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/some-en-us-fragment?references=all-hydrated')
            .returns(createResponse(200, usFragment));
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/en_US/some-en-us-fragment',
            )
            .returns(createResponse(200, { id: 'some-en-us-fragment' }));

        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'en_KW',
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app',
        });
    });

    it('should return fr fragment (fr fragment, no locale)', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            body: {
                path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                some: 'corps',
            },
        });
        expect(result.status).to.equal(200);
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            some: 'corps',
        });
    });
});

describe('customize corner cases', function () {
    beforeEach(function () {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(function () {
        fetchStub.restore();
    });

    it('no path should return 400', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            body: {},
            surface: 'sandbox',
            locale: 'fr_FR',
        });
        expect(result).to.deep.include({
            message: 'Missing surface or fragmentPath',
            status: 400,
        });
    });

    it('no fragmentPath should return 400', async function () {
        expect(
            await process({
                status: 200,
                fragmentPath: 'bar',
                locale: 'fr_FR',
            }),
        ).to.deep.include({
            message: 'Missing surface or fragmentPath',
            status: 400,
        });
    });

    it('should return 503 when default locale fetch failed', async function () {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/someFragment')
            .returns(
                createResponse(
                    404,
                    {
                        message: 'Not found',
                    },
                    'Not Found',
                ),
            );

        const result = await process({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/sandbox/en_US/someFragment' },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
        });
        expect(result).to.deep.include({
            status: 503,
            message: 'fetch error',
        });
    });

    it('should return 500 when default locale fetch by id failed', async function () {
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            )
            .returns(createResponse(200, { id: 'some-fr-fr-fragment-server-error' }));

        fetchStub
            .withArgs('https://odin.adobe.com/adobe/contentFragments/byPath?path=/some-fr-fr-fragment-server-error')
            .returns(
                createResponse(
                    500,
                    {
                        message: 'Error',
                    },
                    'Internal Server Error',
                ),
            );

        const result = await process({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/sandbox/en_US/someFragment' },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
        });
        expect(result).to.deep.include({
            status: 503,
            message: 'fetch error',
        });
    });

    it('should return 404 when default locale fragment is not found', async function () {
        fetchStub
            .withArgs(
                'https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            )
            .returns(createResponse(404, {}));

        const result = await process({
            ...FAKE_CONTEXT,
            body: { path: '/content/dam/mas/sandbox/en_US/ccd-slice-wide-cc-all-app' },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            locale: 'fr_FR',
        });
        expect(result).to.deep.include({
            status: 404,
            message: 'Error fetching fragment id',
        });
    });

    it('same locale should return same body', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            body: {
                path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
                some: 'body',
            },
            fragmentPath: 'ccd-slice-wide-cc-all-app',
            parsedLocale: 'fr_FR',
            surface: 'sandbox',
            locale: 'fr_FR',
        });
        expect(result.body).to.deep.include({
            path: '/content/dam/mas/sandbox/fr_FR/ccd-slice-wide-cc-all-app',
            some: 'body',
        });
    });
});

describe('customize promo variation', function () {
    const PROMO_VARIATION = {
        id: 'promo-var-id',
        path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card',
        fields: { title: 'Promo Title', badge: 'PROMO' },
    };
    const ACTIVE_PROJECT = {
        id: 'promo-proj-id',
        path: '/content/dam/mas/promotions/black-friday',
        defaultVariations: { 'my-card': PROMO_VARIATION },
        regionVariations: {},
    };

    it('should merge promo variation when matching fragmentPath found in defaultVariations', async function () {
        const rootFragment = {
            id: 'root-id',
            path: '/content/dam/mas/sandbox/en_US/my-card',
            fields: { title: 'Original Title', badge: 'ORIGINAL' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'my-card', parsedLocale: 'en_US', body: rootFragment },
            ACTIVE_PROJECT,
        );

        expect(result.status).to.equal(200);
        expect(result.body.id).to.equal('root-id');
        expect(result.body.path).to.equal('/content/dam/mas/sandbox/en_US/my-card');
        expect(result.body.variationId).to.equal('promo-var-id');
        expect(result.body.fields.title).to.equal('Promo Title');
        expect(result.body.fields.badge).to.equal('PROMO');
    });

    it('should merge region variation over default when both exist', async function () {
        const regionVar = {
            id: 'promo-region-id',
            path: '/content/dam/mas/sandbox/fr_BE/promotions/black-friday/my-card',
            fields: { title: 'Region Promo Title' },
        };
        const project = {
            ...ACTIVE_PROJECT,
            defaultVariations: { 'my-card': PROMO_VARIATION },
            regionVariations: { 'my-card': regionVar },
        };
        const rootFragment = {
            id: 'root-id',
            path: '/content/dam/mas/sandbox/en_US/my-card',
            fields: { title: 'Original Title', badge: 'ORIGINAL' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'my-card', parsedLocale: 'en_US', body: rootFragment },
            project,
        );

        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.equal('promo-var-id');
        expect(result.body.fields.title).to.equal('Region Promo Title');
        expect(result.body.fields.badge).to.equal('PROMO');
    });

    it('should skip promo variation when no activeProject', async function () {
        const rootFragment = {
            id: 'root-id',
            path: '/content/dam/mas/sandbox/en_US/my-card',
            fields: { title: 'Original Title', osi: 'OSI-1' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'my-card', parsedLocale: 'en_US', body: rootFragment },
            null,
        );

        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.be.undefined;
        expect(result.body.fields.promoCode).to.be.undefined;
    });

    it('should skip promo variation when fragment has no path', async function () {
        const rootFragment = {
            id: 'root-id',
            fields: { title: 'Original Title' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'my-card', parsedLocale: 'en_US', body: rootFragment },
            ACTIVE_PROJECT,
        );

        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.be.undefined;
    });

    it('should skip promo variation when fragment path does not match expected pattern', async function () {
        const rootFragment = {
            id: 'root-id',
            path: '/unexpected/path/structure',
            fields: { title: 'Original Title' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'my-card', parsedLocale: 'en_US', body: rootFragment },
            ACTIVE_PROJECT,
        );

        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.be.undefined;
    });

    it('should skip promo variation when no matching fragmentPath in variations', async function () {
        const rootFragment = {
            id: 'root-id',
            path: '/content/dam/mas/sandbox/en_US/different-card',
            fields: { title: 'Original Title' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'different-card', parsedLocale: 'en_US', body: rootFragment },
            ACTIVE_PROJECT,
        );

        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.be.undefined;
    });

    it('should apply region variation when only regionVariations has the entry (no defaultVar)', async function () {
        const regionVar = {
            id: 'region-only-id',
            path: '/content/dam/mas/sandbox/fr_BE/promotions/black-friday/my-card',
            fields: { title: 'Region Only Title', badge: 'REGION' },
        };
        const project = {
            ...ACTIVE_PROJECT,
            defaultVariations: {},
            regionVariations: { 'my-card': regionVar },
        };
        const rootFragment = {
            id: 'root-id',
            path: '/content/dam/mas/sandbox/en_US/my-card',
            fields: { title: 'Original Title', badge: 'ORIGINAL' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'my-card', parsedLocale: 'en_US', body: rootFragment },
            project,
        );

        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.equal('region-only-id');
        expect(result.body.fields.title).to.equal('Region Only Title');
        expect(result.body.fields.badge).to.equal('REGION');
    });

    it('should pick the geo-scoped sibling matching the request over an untagged (legacy) sibling', async function () {
        const legacyVariation = {
            id: 'legacy-var-id',
            path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card',
            fields: { title: 'Legacy Title', badge: 'LEGACY' },
        };
        const geoVariation = {
            id: 'geo-var-id',
            path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2',
            fields: { title: 'Greece Title', badge: 'GEO', pznTags: ['mas:locale/en_GR'] },
        };
        const project = {
            ...ACTIVE_PROJECT,
            defaultVariations: { 'my-card': legacyVariation, 'my-card-2': geoVariation },
            regionVariations: {},
        };
        const rootFragment = {
            id: 'root-id',
            path: '/content/dam/mas/sandbox/en_US/my-card',
            fields: { title: 'Original Title', badge: 'ORIGINAL' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            {
                ...FAKE_CONTEXT,
                fragmentPath: 'my-card',
                parsedLocale: 'en_US',
                body: rootFragment,
                locale: 'en_US',
                country: 'GR',
            },
            project,
        );

        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.equal('geo-var-id');
        expect(result.body.fields.title).to.equal('Greece Title');
    });

    it('should fall back to the untagged (legacy) sibling when no geo-scoped sibling matches the request', async function () {
        const legacyVariation = {
            id: 'legacy-var-id',
            path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card',
            fields: { title: 'Legacy Title', badge: 'LEGACY' },
        };
        const geoVariation = {
            id: 'geo-var-id',
            path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2',
            fields: { title: 'Greece Title', badge: 'GEO', pznTags: ['mas:locale/en_GR'] },
        };
        const project = {
            ...ACTIVE_PROJECT,
            defaultVariations: { 'my-card': legacyVariation, 'my-card-2': geoVariation },
            regionVariations: {},
        };
        const rootFragment = {
            id: 'root-id',
            path: '/content/dam/mas/sandbox/en_US/my-card',
            fields: { title: 'Original Title', badge: 'ORIGINAL' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            {
                ...FAKE_CONTEXT,
                fragmentPath: 'my-card',
                parsedLocale: 'en_US',
                body: rootFragment,
                locale: 'en_US',
                country: 'FR',
            },
            project,
        );

        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.equal('legacy-var-id');
        expect(result.body.fields.title).to.equal('Legacy Title');
    });

    it('should prefer a region-locale match over a country-only match among geo-scoped siblings', async function () {
        const countryOnlyVariation = {
            id: 'country-only-id',
            path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card',
            fields: { title: 'Country Only Title', pznTags: ['mas:country/GR'] },
        };
        const regionVariation = {
            id: 'region-match-id',
            path: '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card-2',
            fields: { title: 'Region Match Title', pznTags: ['mas:locale/en_GR'] },
        };
        const project = {
            ...ACTIVE_PROJECT,
            defaultVariations: { 'my-card': countryOnlyVariation, 'my-card-2': regionVariation },
            regionVariations: {},
        };
        const rootFragment = {
            id: 'root-id',
            path: '/content/dam/mas/sandbox/en_US/my-card',
            fields: { title: 'Original Title', badge: 'ORIGINAL' },
            references: {},
            referencesTree: [],
        };

        const result = await processWithPromos(
            {
                ...FAKE_CONTEXT,
                fragmentPath: 'my-card',
                parsedLocale: 'en_US',
                body: rootFragment,
                locale: 'en_US',
                country: 'GR',
            },
            project,
        );

        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.equal('region-match-id');
        expect(result.body.fields.title).to.equal('Region Match Title');
    });
});

const CARD_MODEL = { id: CARD_MODEL_ID };
const COLLECTION_MODEL = { id: COLLECTION_MODEL_ID };
// `customize` receives the already-fetched mask fragment on `context.maskFragment` (set by the `mask`
// transformer). These tests cover the merge only; mask resolution/fetch lives in `mask.test.js`.
const MASK = { fields: { badge: 'MASKED BADGE', mnemonicIcon: [] } };

describe('customize mask overlay', function () {
    it('should overlay the mask onto a card fragment (authored fields win, empty fields preserved)', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'promo-card',
            locale: 'en_US',
            parsedLocale: 'en_US',
            maskFragment: MASK,
            body: {
                path: '/content/dam/mas/sandbox/en_US/promo-card',
                id: 'card-root',
                model: CARD_MODEL,
                fields: { badge: 'ORIGINAL', subtitle: 'keep me', title: 'Card' },
                references: {},
                referencesTree: [],
            },
        });
        expect(result.status).to.equal(200);
        expect(result.body.id).to.equal('card-root');
        expect(result.body.fields.badge).to.equal('MASKED BADGE');
        expect(result.body.fields.subtitle).to.equal('keep me');
        expect(result.body.fields.title).to.equal('Card');
    });

    it('does not apply mask when root fragment is not a card (root-only overlay)', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'promo-coll',
            locale: 'en_US',
            parsedLocale: 'en_US',
            maskFragment: MASK,
            body: {
                path: '/content/dam/mas/sandbox/en_US/promo-coll',
                id: 'coll-root',
                // collection root has no model -> mask must not apply
                fields: { cards: ['card-1'], collections: [] },
                references: {
                    'card-1': {
                        type: 'content-fragment',
                        value: {
                            path: '/content/dam/mas/sandbox/en_US/card-1',
                            id: 'card-1',
                            model: CARD_MODEL,
                            fields: { badge: 'ORIGINAL', variations: [] },
                        },
                    },
                },
                referencesTree: [{ fieldName: 'cards', identifier: 'card-1', referencesTree: [] }],
            },
        });
        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.be.undefined;
        // card references are not overlaid (root-only overlay)
        expect(result.body.references['card-1'].value.fields.badge).to.equal('ORIGINAL');
    });

    it('should not overlay when the fragment has a non-card model', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'promo-coll',
            locale: 'en_US',
            parsedLocale: 'en_US',
            maskFragment: MASK,
            body: {
                path: '/content/dam/mas/sandbox/en_US/promo-coll',
                id: 'coll-root',
                model: COLLECTION_MODEL,
                fields: { badge: 'ORIGINAL', cards: [], collections: [] },
                references: {},
                referencesTree: [],
            },
        });
        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('ORIGINAL');
    });

    it('should be a no-op when no mask fragment was resolved', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'promo-card',
            locale: 'en_US',
            parsedLocale: 'en_US',
            body: {
                path: '/content/dam/mas/sandbox/en_US/promo-card',
                id: 'card-root',
                model: CARD_MODEL,
                fields: { badge: 'ORIGINAL' },
                references: {},
                referencesTree: [],
            },
        });
        expect(result.status).to.equal(200);
        expect(result.body.fields.badge).to.equal('ORIGINAL');
    });

    it('should apply pzn then mask: mask fields win, pzn-only fields preserved, variationId and maskId both set, model.id preserved', async function () {
        const pznVarId = 'pzn-edu-card';
        const maskFragment = { id: 'mask-001', fields: { badge: 'MASK BADGE', cta: 'Buy now' } };
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'phsp-individual',
            locale: 'en_US',
            parsedLocale: 'en_US',
            pzn: 'edu',
            maskFragment,
            body: {
                path: '/content/dam/mas/sandbox/en_US/phsp-individual',
                id: 'root-card',
                model: CARD_MODEL,
                fields: {
                    badge: 'DEFAULT BADGE',
                    cta: 'Try free',
                    variations: [pznVarId],
                },
                references: {
                    [pznVarId]: {
                        type: 'content-fragment',
                        value: {
                            path: '/content/dam/mas/sandbox/en_US/phsp_direct_individual/pzn/phsp-edu',
                            id: pznVarId,
                            model: CARD_MODEL,
                            fields: {
                                pznTags: ['mas:pzn/edu'],
                                badge: 'EDU BADGE',
                                description: 'EDU description',
                            },
                        },
                    },
                },
                referencesTree: [],
            },
        });

        expect(result.status).to.equal(200);
        // pzn variation was selected
        expect(result.body.variationId).to.equal(pznVarId);
        // mask was applied on top
        expect(result.body.maskId).to.equal('mask-001');
        // mask badge wins over pzn badge
        expect(result.body.fields.badge).to.equal('MASK BADGE');
        // mask cta wins over root cta
        expect(result.body.fields.cta).to.equal('Buy now');
        // pzn-only field not touched by mask is preserved
        expect(result.body.fields.description).to.equal('EDU description');
        // root id preserved (DO_NOT_MERGE_KEYS at top level)
        expect(result.body.id).to.equal('root-card');
        // nested model.id preserved through both merges
        expect(result.body.model.id).to.equal(CARD_MODEL_ID);
    });
});

describe('customize promoCode application', function () {
    const MINIMAL_PROJECT = {
        id: 'promo-proj',
        path: '/content/dam/mas/promotions/test',
        fragmentPaths: ['test-card'],
        defaultVariations: {},
        regionVariations: {},
    };

    function makeBody(osiValue, extra = {}) {
        return {
            path: '/content/dam/mas/sandbox/en_US/test-card',
            id: 'test-card',
            fields: { osi: osiValue },
            references: {},
            referencesTree: [],
            ...extra,
        };
    }

    it('should apply promoCode from promoMap when OSI matches', async function () {
        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'test-card', body: makeBody('OSI-123') },
            MINIMAL_PROJECT,
            { 'OSI-123': 'SUMMER25' },
        );
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.equal('SUMMER25');
    });

    it('should apply promoCode for array OSI field', async function () {
        const result = await processWithPromos(
            {
                ...FAKE_CONTEXT,
                fragmentPath: 'test-card',
                body: makeBody(['OSI-001', 'OSI-002']),
            },
            MINIMAL_PROJECT,
            { 'OSI-002': 'MULTI10' },
        );
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.equal('MULTI10');
    });

    it('should apply wildcard promoCode when no specific OSI match', async function () {
        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'test-card', body: makeBody('OSI-UNKNOWN') },
            MINIMAL_PROJECT,
            { '*': 'UNIVERSAL' },
        );
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.equal('UNIVERSAL');
    });

    it('should prefer specific OSI match over wildcard', async function () {
        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'test-card', body: makeBody('OSI-1') },
            MINIMAL_PROJECT,
            { '*': 'WILDCARD', 'OSI-1': 'SPECIFIC' },
        );
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.equal('SPECIFIC');
    });

    it("should not set promoCode when fragment path is not in the project's fragmentPaths", async function () {
        const result = await processWithPromos(
            {
                ...FAKE_CONTEXT,
                fragmentPath: 'test-card',
                body: makeBody('OSI-123'),
            },
            { ...MINIMAL_PROJECT, fragmentPaths: ['other-path'] },
            { 'OSI-123': 'SUMMER25' },
        );
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.be.undefined;
    });

    it('should not set promoCode when no active project', async function () {
        const result = await process({
            ...FAKE_CONTEXT,
            fragmentPath: 'test-card',
            body: makeBody('OSI-123'),
        });
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.be.undefined;
    });

    it('should not set promoCode when fragment has no osi field', async function () {
        const result = await processWithPromos(
            { ...FAKE_CONTEXT, fragmentPath: 'test-card', body: makeBody(undefined) },
            MINIMAL_PROJECT,
            { '*': 'UNIVERSAL' },
        );
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.be.undefined;
    });

    it('should apply promoCode to child card fragments in collection', async function () {
        const result = await processWithPromos(
            {
                ...FAKE_CONTEXT,
                fragmentPath: 'test-collection',
                body: {
                    path: '/content/dam/mas/sandbox/en_US/test-collection',
                    id: 'test-collection',
                    fields: { cards: ['card-1'], collections: [] },
                    references: {
                        'card-1': {
                            type: 'content-fragment',
                            value: {
                                path: '/content/dam/mas/sandbox/en_US/card-1',
                                id: 'card-1',
                                fields: { osi: 'OSI-CARD', variations: [] },
                            },
                        },
                    },
                    referencesTree: [{ fieldName: 'cards', identifier: 'card-1', referencesTree: [] }],
                },
            },
            { ...MINIMAL_PROJECT, fragmentPaths: ['card-1'] },
            { 'OSI-CARD': 'CARD-PROMO' },
        );
        expect(result.status).to.equal(200);
        expect(result.body.references['card-1'].value.fields.promoCode).to.equal('CARD-PROMO');
    });
});

describe('customize with multiple active promotion projects', function () {
    const PROJECT_A = {
        id: 'proj-a',
        path: '/content/dam/mas/promotions/proj-a',
        defaultVariations: {
            'card-a': {
                id: 'var-a',
                path: '/content/dam/mas/sandbox/en_US/promotions/proj-a/card-a',
                fields: { title: 'Project A variation' },
            },
        },
        regionVariations: {},
    };
    const PROJECT_B = {
        id: 'proj-b',
        path: '/content/dam/mas/promotions/proj-b',
        defaultVariations: {
            'card-b': {
                id: 'var-b',
                path: '/content/dam/mas/sandbox/en_US/promotions/proj-b/card-b',
                fields: { title: 'Project B variation' },
            },
        },
        regionVariations: {},
    };

    function makeCollectionBody() {
        return {
            path: '/content/dam/mas/sandbox/en_US/collection',
            id: 'collection',
            fields: { cards: ['card-a', 'card-b'], collections: [] },
            references: {
                'card-a': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/card-a',
                        id: 'card-a',
                        fields: { osi: 'OSI-A', title: 'Original A', variations: [] },
                    },
                },
                'card-b': {
                    type: 'content-fragment',
                    value: {
                        path: '/content/dam/mas/sandbox/en_US/card-b',
                        id: 'card-b',
                        fields: { osi: 'OSI-B', title: 'Original B', variations: [] },
                    },
                },
            },
            referencesTree: [
                { fieldName: 'cards', identifier: 'card-a', referencesTree: [] },
                { fieldName: 'cards', identifier: 'card-b', referencesTree: [] },
            ],
        };
    }

    it('applies a different project to each fragment in a collection', async function () {
        const result = await processWithPromoProjects(
            { ...FAKE_CONTEXT, fragmentPath: 'collection', body: makeCollectionBody() },
            [
                { project: PROJECT_A, promoMap: { 'OSI-A': 'CODE-A' }, fragmentPaths: new Set(['card-a']) },
                { project: PROJECT_B, promoMap: { 'OSI-B': 'CODE-B' }, fragmentPaths: new Set(['card-b']) },
            ],
        );
        expect(result.status).to.equal(200);
        expect(result.body.references['card-a'].value.variationId).to.equal('var-a');
        expect(result.body.references['card-a'].value.fields.promoCode).to.equal('CODE-A');
        expect(result.body.references['card-b'].value.variationId).to.equal('var-b');
        expect(result.body.references['card-b'].value.fields.promoCode).to.equal('CODE-B');
    });

    it('first project wins when both projects target the same fragment', async function () {
        const projectAlt = {
            id: 'proj-alt',
            path: '/content/dam/mas/promotions/proj-alt',
            defaultVariations: {
                'card-a': {
                    id: 'var-alt',
                    path: '/content/dam/mas/sandbox/en_US/promotions/proj-alt/card-a',
                    fields: { title: 'Project Alt variation' },
                },
            },
            regionVariations: {},
        };
        const rootFragment = {
            id: 'card-a',
            path: '/content/dam/mas/sandbox/en_US/card-a',
            fields: { osi: 'OSI-A', title: 'Original A' },
            references: {},
            referencesTree: [],
        };
        const result = await processWithPromoProjects({ ...FAKE_CONTEXT, fragmentPath: 'card-a', body: rootFragment }, [
            { project: PROJECT_A, promoMap: { 'OSI-A': 'FIRST' }, fragmentPaths: new Set(['card-a']) },
            { project: projectAlt, promoMap: { 'OSI-A': 'SECOND' }, fragmentPaths: new Set(['card-a']) },
        ]);
        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.equal('var-a');
        expect(result.body.fields.promoCode).to.equal('FIRST');
    });

    it('projects with disjoint per-country entries coexist — the one with an explicit entry applies', async function () {
        // Both projects target the same fragment but each only carries an explicit entry for one
        // country; promoMap is already geo-resolved, so the non-matching project's map is empty.
        // For MY the second project must apply even though the first (BR) project is earlier in order.
        const projectBR = {
            id: 'proj-br',
            path: '/content/dam/mas/promotions/proj-br',
            defaultVariations: {},
            regionVariations: {},
        };
        const projectMY = {
            id: 'proj-my',
            path: '/content/dam/mas/promotions/proj-my',
            defaultVariations: {},
            regionVariations: {},
        };
        const rootFragment = {
            id: 'card-x',
            path: '/content/dam/mas/sandbox/en_US/card-x',
            fields: { osi: 'OSI-X', title: 'Original X' },
            references: {},
            referencesTree: [],
        };
        const result = await processWithPromoProjects({ ...FAKE_CONTEXT, fragmentPath: 'card-x', body: rootFragment }, [
            { project: projectBR, promoMap: {}, fragmentPaths: new Set(['card-x']) },
            { project: projectMY, promoMap: { 'OSI-X': 'MY-PROMO' }, fragmentPaths: new Set(['card-x']) },
        ]);
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.equal('MY-PROMO');
        expect(result.body.promoProject).to.equal('proj-my');
    });

    it('stamps promoProject with the project title when available, else the id', async function () {
        const projectTitled = {
            id: 'proj-titled',
            title: 'Summer Sale 2026',
            path: '/content/dam/mas/promotions/proj-titled',
            defaultVariations: {},
            regionVariations: {},
        };
        const rootFragment = {
            id: 'card-x',
            path: '/content/dam/mas/sandbox/en_US/card-x',
            fields: { osi: 'OSI-X', title: 'Original X' },
            references: {},
            referencesTree: [],
        };
        const result = await processWithPromoProjects({ ...FAKE_CONTEXT, fragmentPath: 'card-x', body: rootFragment }, [
            { project: projectTitled, promoMap: { 'OSI-X': 'CODE' }, fragmentPaths: new Set(['card-x']) },
        ]);
        expect(result.status).to.equal(200);
        expect(result.body.promoProject).to.equal('Summer Sale 2026');
    });

    it('an explicit osi entry in a later project beats a wildcard in an earlier project', async function () {
        const projectWildcard = {
            id: 'proj-wild',
            path: '/content/dam/mas/promotions/proj-wild',
            defaultVariations: {},
            regionVariations: {},
        };
        const projectExplicit = {
            id: 'proj-explicit',
            path: '/content/dam/mas/promotions/proj-explicit',
            defaultVariations: {},
            regionVariations: {},
        };
        const rootFragment = {
            id: 'card-x',
            path: '/content/dam/mas/sandbox/en_US/card-x',
            fields: { osi: 'OSI-X', title: 'Original X' },
            references: {},
            referencesTree: [],
        };
        const result = await processWithPromoProjects({ ...FAKE_CONTEXT, fragmentPath: 'card-x', body: rootFragment }, [
            { project: projectWildcard, promoMap: { '*': 'WILDCARD' }, fragmentPaths: new Set(['card-x']) },
            { project: projectExplicit, promoMap: { 'OSI-X': 'EXPLICIT' }, fragmentPaths: new Set(['card-x']) },
        ]);
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.equal('EXPLICIT');
        expect(result.body.promoProject).to.equal('proj-explicit');
    });

    it('falls back to the first project wildcard when no project has an explicit osi entry', async function () {
        const projectWild = {
            id: 'proj-w1',
            path: '/content/dam/mas/promotions/proj-w1',
            defaultVariations: {},
            regionVariations: {},
        };
        const projectWild2 = {
            id: 'proj-w2',
            path: '/content/dam/mas/promotions/proj-w2',
            defaultVariations: {},
            regionVariations: {},
        };
        const rootFragment = {
            id: 'card-x',
            path: '/content/dam/mas/sandbox/en_US/card-x',
            fields: { osi: 'OSI-X', title: 'Original X' },
            references: {},
            referencesTree: [],
        };
        const result = await processWithPromoProjects({ ...FAKE_CONTEXT, fragmentPath: 'card-x', body: rootFragment }, [
            { project: projectWild, promoMap: { '*': 'FIRST-WILD' }, fragmentPaths: new Set(['card-x']) },
            { project: projectWild2, promoMap: { '*': 'SECOND-WILD' }, fragmentPaths: new Set(['card-x']) },
        ]);
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.equal('FIRST-WILD');
        expect(result.body.promoProject).to.equal('proj-w1');
    });

    it('variation and promoCode walks are independent — A supplies variation, B supplies promoCode', async function () {
        const projectVariationOnly = {
            id: 'proj-var',
            path: '/content/dam/mas/promotions/proj-var',
            defaultVariations: {
                'card-x': {
                    id: 'var-x',
                    path: '/content/dam/mas/sandbox/en_US/promotions/proj-var/card-x',
                    fields: { title: 'Variation-only project' },
                },
            },
            regionVariations: {},
        };
        const projectPromoOnly = {
            id: 'proj-promo',
            path: '/content/dam/mas/promotions/proj-promo',
            defaultVariations: {},
            regionVariations: {},
        };
        const rootFragment = {
            id: 'card-x',
            path: '/content/dam/mas/sandbox/en_US/card-x',
            fields: { osi: 'OSI-X', title: 'Original X' },
            references: {},
            referencesTree: [],
        };
        const result = await processWithPromoProjects({ ...FAKE_CONTEXT, fragmentPath: 'card-x', body: rootFragment }, [
            { project: projectVariationOnly, promoMap: { 'OSI-X': 'FROM-VAR-PROJECT' }, fragmentPaths: new Set() },
            { project: projectPromoOnly, promoMap: { 'OSI-X': 'FROM-PROMO-PROJECT' }, fragmentPaths: new Set(['card-x']) },
        ]);
        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.equal('var-x');
        expect(result.body.fields.promoCode).to.equal('FROM-PROMO-PROJECT');
        // Variation and promoCode provenance are tracked on separate fields, so two different
        // projects touching the same fragment are both recorded rather than clobbering each other.
        expect(result.body.promoVariationProject).to.equal('proj-var');
        expect(result.body.promoProject).to.equal('proj-promo');
    });

    it('stamps promoVariationProject from the variation project when no promoCode is applied', async function () {
        const projectVarOnly = {
            id: 'proj-var-only',
            path: '/content/dam/mas/promotions/proj-var-only',
            defaultVariations: {
                'card-y': {
                    id: 'var-y',
                    path: '/content/dam/mas/sandbox/en_US/promotions/proj-var-only/card-y',
                    fields: { title: 'Variation-only project' },
                },
            },
            regionVariations: {},
        };
        const rootFragment = {
            id: 'card-y',
            path: '/content/dam/mas/sandbox/en_US/card-y',
            fields: { osi: 'OSI-Y', title: 'Original Y' },
            references: {},
            referencesTree: [],
        };
        const result = await processWithPromoProjects({ ...FAKE_CONTEXT, fragmentPath: 'card-y', body: rootFragment }, [
            { project: projectVarOnly, promoMap: {}, fragmentPaths: new Set() },
        ]);
        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.equal('var-y');
        expect(result.body.fields.promoCode).to.be.undefined;
        expect(result.body.promoProject).to.be.undefined;
        expect(result.body.promoVariationProject).to.equal('proj-var-only');
    });

    it('seasonal promo are over evergreen promo targeting the same fragment', async function () {
        const seasonalProject = {
            id: 'proj-seasonal',
            path: '/content/dam/mas/promotions/seasonal',
            defaultVariations: {
                'card-a': {
                    id: 'var-seasonal',
                    path: '/content/dam/mas/sandbox/en_US/promotions/seasonal/card-a',
                    fields: { title: 'Seasonal variation' },
                },
            },
            regionVariations: {},
        };
        const evergreenProject = {
            id: 'proj-evergreen',
            path: '/content/dam/mas/promotions/evergreen',
            defaultVariations: {
                'card-a': {
                    id: 'var-evergreen',
                    path: '/content/dam/mas/sandbox/en_US/promotions/evergreen/card-a',
                    fields: { title: 'Evergreen variation' },
                },
            },
            regionVariations: {},
        };
        const rootFragment = {
            id: 'card-a',
            path: '/content/dam/mas/sandbox/en_US/card-a',
            fields: { osi: 'OSI-A', title: 'Original A' },
            references: {},
            referencesTree: [],
        };
        const result = await processWithPromoProjects({ ...FAKE_CONTEXT, fragmentPath: 'card-a', body: rootFragment }, [
            { project: seasonalProject, promoMap: { 'OSI-A': 'SEASONAL-CODE' }, fragmentPaths: new Set(['card-a']) },
            { project: evergreenProject, promoMap: { 'OSI-A': 'EVERGREEN-CODE' }, fragmentPaths: new Set(['card-a']) },
        ]);
        expect(result.status).to.equal(200);
        expect(result.body.variationId).to.equal('var-seasonal');
        expect(result.body.fields.promoCode).to.equal('SEASONAL-CODE');
    });
});

describe('customize OSI substitution', function () {
    const MINIMAL_PROJECT = {
        id: 'sub-proj',
        path: '/content/dam/mas/promotions/test',
        defaultVariations: {},
        regionVariations: {},
    };

    it('should apply promoCode via substituteMap for scalar OSI', async function () {
        const result = await processWithPromoProjects(
            {
                ...FAKE_CONTEXT,
                fragmentPath: 'test-card',
                body: {
                    path: '/content/dam/mas/sandbox/en_US/test-card',
                    id: 'test-card',
                    fields: { osi: 'BASE-OSI' },
                    references: {},
                    referencesTree: [],
                },
            },
            [
                {
                    project: MINIMAL_PROJECT,
                    promoMap: { 'SUB-OSI': 'PROMO-FOR-SUB' },
                    substituteMap: { 'BASE-OSI': 'SUB-OSI' },
                    fragmentPaths: new Set(['test-card']),
                },
            ],
        );
        expect(result.status).to.equal(200);
        expect(result.body.fields.osi).to.equal('BASE-OSI');
        expect(result.body.fields.promoCode).to.equal('PROMO-FOR-SUB');
    });

    it('should apply promoCode when promoMap is keyed by original (base) OSI — real AEM pattern', async function () {
        const result = await processWithPromoProjects(
            {
                ...FAKE_CONTEXT,
                fragmentPath: 'test-card',
                body: {
                    path: '/content/dam/mas/sandbox/en_US/test-card',
                    id: 'test-card',
                    fields: { osi: 'r_BASE-OSI' },
                    references: {},
                    referencesTree: [],
                },
            },
            [
                {
                    project: MINIMAL_PROJECT,
                    promoMap: { '*': 'NICOPROMO', 'r_BASE-OSI': 'IPCCSN55P12MINA' },
                    substituteMap: { 'r_BASE-OSI': 'PW3K57bKr9oyfdtwhnFN' },
                    fragmentPaths: new Set(['test-card']),
                },
            ],
        );
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.equal('IPCCSN55P12MINA');
    });

    it('should apply promoCode via substituteMap for array OSI', async function () {
        const result = await processWithPromoProjects(
            {
                ...FAKE_CONTEXT,
                fragmentPath: 'test-card',
                body: {
                    path: '/content/dam/mas/sandbox/en_US/test-card',
                    id: 'test-card',
                    fields: { osi: ['OSI-A', 'OSI-B'] },
                    references: {},
                    referencesTree: [],
                },
            },
            [
                {
                    project: MINIMAL_PROJECT,
                    promoMap: { 'OSI-B-SUB': 'ARRAY-PROMO' },
                    substituteMap: { 'OSI-B': 'OSI-B-SUB' },
                    fragmentPaths: new Set(['test-card']),
                },
            ],
        );
        expect(result.status).to.equal(200);
        expect(result.body.fields.promoCode).to.equal('ARRAY-PROMO');
    });
});
