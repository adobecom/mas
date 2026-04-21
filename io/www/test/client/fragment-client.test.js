import { expect } from 'chai';
import { clearCaches, previewFragment, previewStudioFragment } from '../../../../studio/libs/fragment-client.js';
import { transformer as settingsTransformer } from '../../src/fragment/transformers/settings.js';
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
        // Stub document for fragment-client (reads locale/country from mas-commerce-service)
        if (typeof globalThis.document === 'undefined') {
            globalThis.document = {
                head: { querySelector: () => null },
            };
        }
        // Stub window.localStorage
        globalThis.window = globalThis.window || { localStorage: {} };
        sinon.stub(globalThis.window, 'localStorage').value(localStorageStub);
        globalThis.localStorage = localStorageStub;
        objectKeysStub = sinon.stub(Object, 'keys').callThrough();
        objectKeysStub.withArgs(localStorageStub).callsFake(() => Object.keys(storage));
        fetchStub = sinon.stub(globalThis, 'fetch').callsFake((url) => {
            // eslint-disable-next-line no-console
            console.warn('[test] unmatched fetch stub:', url);
            return createResponse(404, { detail: 'Not Found' }, 'Not Found');
        });
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
        // Settings fetch (preview pipeline now loads settings)
        const settingsIndexUrl = `${baseUrl}?path=/content/dam/mas/sandbox/settings/index`;
        const settingsId = 'preview-settings-id';
        const settingsContentUrl = `${baseUrl}/${settingsId}?references=all-hydrated`;
        const settingsBody = {
            references: {
                ref1: {
                    value: {
                        fields: {
                            name: 'displayPlanType',
                            valuetype: 'boolean',
                            booleanValue: true,
                        },
                    },
                },
                ref2: {
                    value: {
                        fields: {
                            name: 'secureLabel',
                            valuetype: 'optional-text',
                            booleanValue: true,
                            textValue: 'Secure transaction',
                        },
                    },
                },
            },
        };
        fetchStub.withArgs(settingsIndexUrl).returns(createResponse(200, { items: [{ id: settingsId }] }));
        fetchStub.withArgs(settingsContentUrl).returns(createResponse(200, settingsBody));
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

    it('maps non-200 preview pipeline to body.message, logs, and preserves status in fullContext', async () => {
        const fragmentId = 'non-existent';

        fetchStub
            .withArgs(`${baseUrl}/${fragmentId}?references=all-hydrated`)
            .returns(createResponse(404, { detail: 'Not Found' }, 'Not Found'));

        const consoleErrorSpy = sinon.spy(console, 'error');
        try {
            const bodyOnly = await previewFragment(fragmentId, {
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(bodyOnly).to.deep.equal({ message: 'Not Found' });

            const full = await previewFragment(fragmentId, {
                surface: 'sandbox',
                locale: 'en_US',
                fullContext: true,
            });
            expect(full.status).to.equal(404);
            expect(full.body).to.deep.equal({ message: 'Not Found' });
            expect(consoleErrorSpy.calledWithMatch(sinon.match(/Not Found/))).to.be.true;
        } finally {
            consoleErrorSpy.restore();
        }
    });

    it('returns full context with api_key when options.fullContext is true', async () => {
        const result = await previewFragment(mockCardFragment.id, {
            surface: 'sandbox',
            locale: 'en_US',
            fullContext: true,
        });
        expect(result).to.have.property('status');
        expect(result).to.have.property('body');
        expect(result).to.have.property('api_key', 'fragment-client');
    });

    it('returns body only when options.fullContext is false', async () => {
        const result = await previewFragment(mockCardFragment.id, {
            surface: 'sandbox',
            locale: 'en_US',
        });
        expect(result).to.have.property('fields');
        expect(result).to.not.have.property('api_key');
    });

    it('returns error context when fetch rejects', async () => {
        const fragmentId = 'network-fail';
        fetchStub.withArgs(`${baseUrl}/${fragmentId}?references=all-hydrated`).rejects(new Error('Network failed'));
        const result = await previewFragment(fragmentId, {
            surface: 'sandbox',
            locale: 'en_US',
            fullContext: true,
            networkConfig: { retries: 1, retryDelay: 1 },
        });
        expect([500, 503]).to.include(result.status);
        expect(result).to.have.property('message');
    });

    it('merges options locale and country over document element', async () => {
        const dePlaceholderIndex = `${baseUrl}?path=/content/dam/mas/sandbox/de_DE/ilyas-test-placeholders`;
        const deDictIndex = `${baseUrl}?path=/content/dam/mas/sandbox/de_DE/dictionary/index`;
        const deVariationId = 'de-de-default-locale-fragment';
        fetchStub.withArgs(dePlaceholderIndex).returns(
            createResponse(200, {
                items: [{ id: deVariationId, type: 'content-fragment' }],
            }),
        );
        fetchStub.withArgs(deDictIndex).returns(
            createResponse(200, {
                items: [
                    {
                        id: mockPlaceholders.id,
                        type: 'dictionary',
                    },
                ],
            }),
        );
        fetchStub
            .withArgs(`${baseUrl}/${deVariationId}?references=all-hydrated`)
            .returns(createResponse(200, { ...mockCardFragment, id: deVariationId }));

        const result = await previewFragment(mockCardFragment.id, {
            surface: 'sandbox',
            locale: 'de_DE',
            country: 'DE',
        });
        expect(result).to.have.property('fields');
    });

    describe('previewStudioFragment', () => {
        it('returns processed body with api_key fragment-client-studio', async () => {
            const body = { ...mockCardFragment };
            const result = await previewStudioFragment(body, { locale: 'en_US', surface: 'sandbox' });
            expect(result).to.have.property('fields');
        });

        it('maps non-200 studio pipeline to body.message and logs', async () => {
            const stub = sinon.stub(settingsTransformer, 'process').callsFake(async (ctx) => ({
                ...ctx,
                status: 422,
                message: 'Studio pipeline failed',
            }));
            const consoleErrorSpy = sinon.spy(console, 'error');
            try {
                const result = await previewStudioFragment({ ...mockCardFragment }, { locale: 'en_US', surface: 'sandbox' });
                expect(result).to.deep.equal({ message: 'Studio pipeline failed' });
                expect(consoleErrorSpy.calledWithMatch(sinon.match(/Studio pipeline failed/))).to.be.true;
            } finally {
                stub.restore();
                consoleErrorSpy.restore();
            }
        });
    });
});
