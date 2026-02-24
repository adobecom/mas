import { expect } from 'chai';
import { clearCaches, previewFragment } from '../../../../studio/libs/fragment-client.js';
import sinon from 'sinon';
import mockCollectionData from '../fragment/mocks/preview-collection.json' with { type: 'json' };
import expectedOutput from '../fragment/mocks/preview-expected-collection-output.json' with { type: 'json' };
import mockCardFragment from '../fragment/mocks/preview-fragment.json' with { type: 'json' };
import mockPlaceholders from '../fragment/mocks/preview-placeholders.json' with { type: 'json' };

// Helper function to create mock Response objects
function createResponse(status, data, statusText = 'OK') {
    return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText,
        json: async () => data,
    });
}

// Create a mock localStorage
const storage = {};
const localStorageStub = {
    getItem: sinon.stub().callsFake((key) => storage[key] || null),
    removeItem: sinon.stub().callsFake((key) => delete storage[key]),
    setItem: sinon.stub().callsFake((key, value) => {
        storage[key] = value.toString();
    }),
};
let objectKeysStub;

describe('FragmentClient', () => {
    const baseUrl = 'https://odinpreview.corp.adobe.com/adobe/sites/cf/fragments';
    let fetchStub;

    before(() => {
        // Stub window.localStorage
        globalThis.window = globalThis.window || { localStorage: {} };
        sinon.stub(globalThis.window, 'localStorage').value(localStorageStub);
        globalThis.localStorage = localStorageStub;
        objectKeysStub = sinon.stub(Object, 'keys').callThrough();
        objectKeysStub.withArgs(localStorageStub).callsFake(() => Object.keys(storage));
        fetchStub = sinon.stub(globalThis, 'fetch');
        fetchStub
            .withArgs(`${baseUrl}/${mockCardFragment.id}?references=all-hydrated`)
            .returns(createResponse(200, mockCardFragment));
        fetchStub
            .withArgs(`${baseUrl}/${mockPlaceholders.id}?references=all-hydrated`)
            .returns(createResponse(200, mockPlaceholders));
        fetchStub
            .withArgs(`${baseUrl}/${mockCollectionData.id}?references=all-hydrated`)
            .returns(createResponse(200, mockCollectionData));
        fetchStub.withArgs(`${baseUrl}?path=/content/dam/mas/sandbox/en_US/dictionary/index`).returns(
            createResponse(200, {
                items: [
                    {
                        id: mockPlaceholders.id,
                        type: 'dictionary',
                    },
                ],
            }),
        );
    });

    after(() => {
        fetchStub.restore();
        objectKeysStub.restore();
        delete globalThis.localStorage;
        if (globalThis.window?.localStorage) {
            sinon.restore();
        }
    });

    it('should fetch and transform card fragment for preview', async () => {
        const result = await previewFragment(mockCardFragment.id, {
            surface: 'sandbox',
            locale: 'en_US',
        });
        expect(result?.fields?.variant).to.equal('plans');
    });

    it('should fetch and transform collection fragment for preview', async () => {
        fetchStub.withArgs(`${baseUrl}?path=/content/dam/mas/sandbox/en_US/dictionary/index`).returns(
            createResponse(200, {
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
            }),
        );
        fetchStub
            .withArgs(`${baseUrl}/${mockPlaceholders.id}?references=all-hydrated`)
            .returns(createResponse(200, mockPlaceholders));
        const output = await previewFragment(mockCollectionData.id, {
            surface: 'sandbox',
            locale: 'en_US',
        });
        expect(output.references).deep.equal(expectedOutput.references);
        expect(output.referencesTree).deep.equal(expectedOutput.referencesTree);
        expect(localStorageStub.getItem('dictionary-sandbox-en_US')).to.exist;
        clearCaches();
        expect(localStorageStub.getItem('dictionary-sandbox-en_US')).to.be.null;
    });

    it('should handle fetch errors', async () => {
        const fragmentId = 'non-existent';

        fetchStub
            .withArgs(`${baseUrl}/${fragmentId}?references=all-hydrated`)
            .returns(createResponse(404, { error: 'Not Found' }, 'Not Found'));

        const result = await previewFragment(fragmentId, {
            surface: 'acom',
            locale: 'en_US',
        });

        expect(result).to.be.undefined;
    });
});
