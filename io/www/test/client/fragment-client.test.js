const { expect } = require('chai');
const nock = require('nock');
const mockCollectionData = require('../fragment/mocks/preview-collection.json');
const expectedOutput = require('../fragment/mocks/preview-expected-collection-output.json');
const mockCardFragment = require('../fragment/mocks/preview-fragment.json');
const mockPlaceholders = require('../fragment/mocks/preview-placeholders.json');

// Import the actual source file without coverage instrumentation
let previewFragment;
before(async () => {
    const module = await import('../../src/fragment-client.js');
    previewFragment = module.previewFragment;
});

describe('FragmentClient', () => {
    const baseUrl = 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments';

    afterEach(() => {
        nock.cleanAll();
    });

    describe('previewFragment', () => {
        it('should fetch and transform card fragment for preview', async () => {
            nock(baseUrl).get(`/${mockCardFragment.id}?references=all-hydrated`).reply(200, mockCardFragment);
            nock(baseUrl).get(`/${mockPlaceholders.id}?references=all-hydrated`).reply(200, mockPlaceholders);
            nock(baseUrl)
                .get('?path=/content/dam/mas/sandbox/en_US/dictionary/index')
                .reply(200, {
                    items: [
                        {
                            id: mockPlaceholders.id,
                            type: 'dictionary',
                        },
                    ],
                });
            const result = await previewFragment(mockCardFragment.id, {
                surface: 'sandbox',
                locale: 'en_US',
            });

            expect(result?.fields?.variant).to.equal('plans');
        });

        it('should fetch and transform collection fragment for preview', async () => {
            nock(baseUrl).get(`/${mockCollectionData.id}?references=all-hydrated`).reply(200, mockCollectionData);
            nock(baseUrl)
                .get('?path=/content/dam/mas/sandbox/en_US/dictionary/index')
                .reply(200, {
                    items: [
                        {
                            id: mockPlaceholders.id,
                            type: 'dictionary',
                            fields: {
                                name: 'Dictionary',
                                description: 'Dictionary description',
                            },
                        },
                    ],
                });
            nock(baseUrl).get(`/${mockPlaceholders.id}?references=all-hydrated`).reply(200, mockPlaceholders);
            const output = await previewFragment(mockCollectionData.id, {
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(output.references).deep.equal(expectedOutput.references);
            expect(output.referencesTree).deep.equal(expectedOutput.referencesTree);
        });

        it('should handle fetch errors', async () => {
            const fragmentId = 'non-existent';

            nock(baseUrl).get(`/${fragmentId}?references=all-hydrated`).reply(404, { error: 'Not Found' });

            const result = await previewFragment(fragmentId, {
                surface: 'acom',
                locale: 'en_US',
            });

            expect(result).to.be.undefined;
        });
    });
});
