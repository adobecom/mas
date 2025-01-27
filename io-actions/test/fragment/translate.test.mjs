import chai from 'chai';
import nock from 'nock';
import action from '../../src/fragment/translate.js';

const expect = chai.expect;

describe('translate typical cases', () => {
    it('should return translated fragment', async () => {
        nock('https://odin.adobe.com')
            .get('/adobe/sites/fragments')
            .query({ path: '/content/dam/mas/nico/fr_FR/someFragment' })
            .reply(200, {
                items: [
                    {
                        path: '/content/dam/mas/nico/fr_FR/someFragment',
                        some: 'corps',
                    },
                ],
            });

        const result = await action.main({
            status: 200,
            body: {
                path: '/content/dam/mas/nico/en_US/someFragment',
                some: 'body',
            },
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 200,
            body: {
                path: '/content/dam/mas/nico/fr_FR/someFragment',
                some: 'corps',
            },
        });
    });
});

describe('translate corner cases', () => {
    it('main should be defined', () => {
        expect(action.main).to.be.a('function');
    });

    it('no arguments should return 400', async () => {
        const result = await action.main({});
        expect(result).to.deep.equal({
            message: 'requested source is either not here or invalid',
            status: 400,
        });
    });

    it('400 entries should return 400', async () => {
        const result = await action.main({
            status: 400,
            body: { path: '/content/blah' },
        });
        expect(result).to.deep.equal({
            status: 400,
            message: 'requested source is either not here or invalid',
        });
    });

    it('no path should return 400', async () => {
        const result = await action.main({
            status: 200,
            body: {},
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 400,
            message: 'source path is either not here or invalid',
        });
    });

    it('bad path should return 400', async () => {
        const result = await action.main({
            status: 200,
            body: { path: 'something/rather/wrong' },
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 400,
            message: 'source path is either not here or invalid',
        });
    });

    it('same locale should return same body', async () => {
        const result = await action.main({
            status: 200,
            body: {
                path: '/content/dam/mas/nico/fr_FR/someFragment',
                some: 'body',
            },
            locale: 'fr_FR',
        });
        expect(result).to.deep.equal({
            status: 200,
            body: {
                path: '/content/dam/mas/nico/fr_FR/someFragment',
                some: 'body',
            },
        });
    });
});
