const collection = require('../../src/fragment/collection').collection;
const COLLECTION_RESPONSE = require('./mocks/collection.json');
const { expect } = require('chai');
const nock = require('nock');

const collectionContext = {
    status: 200,
    transformer: 'collection',
    requestId: 'mas-collection-ut',
    body: {
        path: '/content/dam/mas/nala/ccd/collections/test',
        id: 'test',
        fields: {
            variant: 'ccd-slice',
            categories: ['blah'],
        },
    },
    locale: 'en_US',
};

describe('collection transform', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should not do anything when not a collection', async () => {
        const context = {
            status: 200,
            body: {
                path: '/content/dam/mas/nala/ccd/slice-cc-allapps31211',
                id: 'test',
                fields: {
                    variant: 'ccd-slice',
                    description: 'blah',
                    cta: 'Buy now',
                },
            },
        };
        const response = await collection(context);
        expect(response).to.deep.equal(context);
    });

    it('should return a 500 when request fails', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test/variations/master/references')
            .query({ references: 'all-hydrated' })
            .reply(500);
        const context = await collection(collectionContext);
        expect(context).to.deep.equal({
            status: 500,
            message: 'unable to fetch references',
        });
    });

    it('should return a collection object with categories and cards', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/test/variations/master/references')
            .query({ references: 'all-hydrated' })
            .reply(200, COLLECTION_RESPONSE);
        const response = await collection(collectionContext);
        expect(response?.body?.fields)
            .to.have.property('cards')
            .that.is.an('object');
        expect(
            response.body.fields.cards['7c87d1c4-d7fd-4370-b318-4cb2ebb4dd13']
                .fields.description.value,
        ).to.equal(
            "<p><strong>i'm aon, with a price his is nicolas' card {{view-account}}</strong></p>",
        );
        expect(response.body.fields)
            .to.have.property('categories')
            .that.is.an('array');
        expect(response.body.fields.categories).to.deep.equal([
            {
                label: 'All',
                cards: [
                    '7c87d1c4-d7fd-4370-b318-4cb2ebb4dd13',
                    'aec092ef-d5b5-4271-8b6f-4bbd535fcc56',
                ],
            },
            { label: 'Photo', cards: ['aec092ef-d5b5-4271-8b6f-4bbd535fcc56'] },
        ]);
    });

    describe('parseReferences', () => {
        const parseReferences =
            require('../../src/fragment/collection').parseReferences;

        it('should handle empty references', () => {
            const result = parseReferences([], {});
            expect(result).to.deep.equal({ cards: {}, categories: [] });
        });

        it('should handle card references', () => {
            const references = {
                card1: {
                    value: {
                        fields: {
                            variant: 'card',
                            title: 'Test Card',
                        },
                    },
                },
            };
            const result = parseReferences(['card1'], references);
            expect(result.cards).to.have.property('card1');
            expect(result.categories).to.be.empty;
        });

        it('should handle category references with cards', () => {
            const references = {
                cat1: {
                    value: {
                        fields: {
                            label: 'Test Category',
                            cards: ['card1', 'card2'],
                        },
                    },
                },
            };
            const result = parseReferences(['cat1'], references);
            expect(result.categories).to.deep.equal([
                { label: 'Test Category', cards: ['card1', 'card2'] },
            ]);
            expect(result.cards).to.be.empty;
        });

        it('should handle nested categories', () => {
            const references = {
                cat1: {
                    value: {
                        fields: {
                            label: 'Parent Category',
                            categories: ['subcat1'],
                        },
                    },
                },
                subcat1: {
                    value: {
                        fields: {
                            label: 'Sub Category',
                            cards: ['card1'],
                        },
                    },
                },
            };
            const result = parseReferences(['cat1'], references);
            expect(result.categories).to.deep.equal([
                {
                    label: 'Parent Category',
                    categories: [{ label: 'Sub Category', cards: ['card1'] }],
                },
            ]);
            expect(result.cards).to.be.empty;
        });

        it('should handle mixed references (cards and categories)', () => {
            const references = {
                card1: {
                    value: {
                        fields: {
                            variant: 'card',
                            title: 'Test Card',
                        },
                    },
                },
                cat1: {
                    value: {
                        fields: {
                            label: 'Test Category',
                            cards: ['card2'],
                        },
                    },
                },
            };
            const result = parseReferences(['card1', 'cat1'], references);
            expect(result.cards).to.have.property('card1');
            expect(result.categories).to.deep.equal([
                { label: 'Test Category', cards: ['card2'] },
            ]);
        });

        it('should handle references with missing fields', () => {
            const references = {
                ref1: {
                    value: {
                        fields: {},
                    },
                },
            };
            const result = parseReferences(['ref1'], references);
            expect(result).to.deep.equal({ cards: {}, categories: [] });
        });
    });
});
