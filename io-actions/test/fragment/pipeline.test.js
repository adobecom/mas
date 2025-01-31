const { expect } = require('chai');
const nock = require('nock');
const action = require('../../src/fragment/pipeline.js');
const mockDictionary = require('./replace.test.js').mockDictionary;

describe('pipeline full use case', () => {
    beforeEach(() => {
        mockDictionary();
    });

    afterEach(() => {
        nock.cleanAll();
    });
    it('should return fully baked /content/dam/mas/drafts/fr_FR/someFragment', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments/some-us-en-fragment')
            .reply(200, {
                path: '/content/dam/mas/drafts/en_US/someFragment',
                some: 'body',
            });
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/drafts/fr_FR/someFragment' })
            .reply(200, {
                items: [
                    {
                        path: '/content/dam/mas/drafts/fr_FR/someFragment',
                        fields: {
                            description: 'corps',
                            cta: '{{buy-now}}',
                        },
                    },
                ],
            });
        const result = await action.main({
            id: 'some-us-en-fragment',
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 200,
            body: {
                path: '/content/dam/mas/drafts/fr_FR/someFragment',
                fields: {
                    description: 'corps',
                    cta: 'Buy now',
                },
            },
        });
    });
});

describe('pipeline corner cases', () => {
    it('main should be defined', () => {
        expect(action.main).to.be.a('function');
    });

    it('no arguments should return 400', async () => {
        const result = await action.main({});
        expect(result).to.deep.equal({
            message: 'requested parameters are not present',
            status: 400,
        });
    });
});
