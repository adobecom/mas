const { expect } = require('chai');
const nock = require('nock');
const mockFragment = require('../fragment/mocks/preview-fragment.json');
const mockPlaceholders = require('../fragment/mocks/preview-placeholders.json');

// Import the actual source file without coverage instrumentation
const { previewFragment } = require('../../src/fragment-client.js');

describe('FragmentClient', () => {
    const baseUrl =
        'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments';

    afterEach(() => {
        nock.cleanAll();
    });

    describe('previewFragment', () => {
        it('should fetch and transform fragment for preview', async () => {
            nock(baseUrl)
                .get(`/${mockFragment.id}?references=all-hydrated`)
                .reply(200, mockFragment);
            nock(baseUrl)
                .get(`/${mockPlaceholders.id}?references=all-hydrated`)
                .reply(200, mockPlaceholders);

            const result = await previewFragment(mockFragment.id, {
                surface: 'sandbox',
                locale: 'en_US',
            });

            expect(result?.fields?.variant).to.equal('plans');
        });

        it('should handle fetch errors', async () => {
            const fragmentId = 'non-existent';

            nock(baseUrl)
                .get(`/${fragmentId}?references=all-hydrated`)
                .reply(404, { error: 'Not Found' });

            const result = await previewFragment(fragmentId, {
                surface: 'acom',
                locale: 'en_US',
            });

            expect(result).to.be.undefined;
        });
    });
});
