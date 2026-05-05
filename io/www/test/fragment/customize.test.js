import { expect } from 'chai';
import sinon from 'sinon';
import { createResponse } from './mocks/MockFetch.js';
import { MockState } from './mocks/MockState.js';
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
                            pznTags: ['en_KW'],
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
                        pznTags: ['en_US', 'en_CA', 'en_KW'],
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
                            pznTags: ['en_US'],
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
                        fields: { pznTags: ['en_AE', 'fr_FR'], badge: 'Other badge' },
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
                            pznTags: ['en_US'],
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
            path: '/content/dam/mas/sandbox/fr_CA/ccd-slice-wide-cc-all-app',
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
            path: '/content/dam/mas/sandbox/fr_CH/ccd-slice-wide-cc-all-app',
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
