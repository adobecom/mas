import { expect } from '@open-wc/testing';

const MOCK_FRAGMENT_MAPPING = {
    title: { tag: 'h3', slot: 'heading-xs' },
    prices: { tag: 'p', slot: 'body-xxs' },
    description: { tag: 'div', slot: 'body-xs' },
    ctas: { size: 'm', slot: 'footer' },
};

if (!customElements.get('merch-card')) {
    customElements.define(
        'merch-card',
        class extends HTMLElement {
            static getFragmentMapping() {
                return MOCK_FRAGMENT_MAPPING;
            }
        },
    );
}

if (!customElements.get('aem-fragment')) {
    customElements.define(
        'aem-fragment',
        class extends HTMLElement {
            static cache = { add: () => {} };
        },
    );
}

describe('aem-operations', () => {
    let originalQuerySelector;
    let mockRepository;
    let createdFragments;

    function makeMockRepository() {
        createdFragments = [];
        return {
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            create: async (data) => {
                                const frag = {
                                    id: `frag-${createdFragments.length + 1}`,
                                    title: data.title || 'Untitled',
                                    path: data.parentPath,
                                    ...data,
                                };
                                createdFragments.push(frag);
                                return frag;
                            },
                            getById: async (id) => ({
                                id,
                                title: `Fragment ${id}`,
                                path: '/content/dam/test',
                            }),
                            publishFragment: async () => {},
                            delete: async () => {},
                        },
                    },
                },
            },
        };
    }

    beforeEach(() => {
        originalQuerySelector = document.querySelector;
        mockRepository = makeMockRepository();
        document.querySelector = (selector) => {
            if (selector === 'mas-repository') return mockRepository;
            return originalQuerySelector.call(document, selector);
        };
    });

    afterEach(() => {
        document.querySelector = originalQuerySelector;
    });

    async function loadModule() {
        return import('../../src/services/aem-operations.js');
    }

    describe('saveDraftToAEM', () => {
        it('creates a fragment with a unique name and adds to cache', async () => {
            const { saveDraftToAEM } = await loadModule();
            const AemFragmentElement = customElements.get('aem-fragment');
            let cacheAddCalled = false;
            AemFragmentElement.cache = {
                add: () => {
                    cacheAddCalled = true;
                },
            };

            const result = await saveDraftToAEM({
                variant: 'catalog',
                title: '<p>Test Card</p>',
            });

            expect(result).to.not.be.undefined;
            expect(result.id).to.equal('frag-1');
            expect(cacheAddCalled).to.be.true;
            expect(createdFragments.length).to.equal(1);
        });
    });

    describe('saveToAEM', () => {
        it('creates a fragment via repository', async () => {
            const { saveToAEM } = await loadModule();
            const result = await saveToAEM({
                variant: 'catalog',
                title: 'New Card',
            });

            expect(result).to.not.be.undefined;
            expect(result.id).to.equal('frag-1');
        });
    });

    describe('publishDraft', () => {
        it('fetches and publishes fragment', async () => {
            const { publishDraft } = await loadModule();
            let publishCalled = false;
            mockRepository.aem.sites.cf.fragments.publishFragment = async () => {
                publishCalled = true;
            };

            const result = await publishDraft('frag-abc');

            expect(result.id).to.equal('frag-abc');
            expect(publishCalled).to.be.true;
        });
    });

    describe('deleteDraft', () => {
        it('fetches and deletes fragment', async () => {
            const { deleteDraft } = await loadModule();
            let deleteCalled = false;
            mockRepository.aem.sites.cf.fragments.delete = async () => {
                deleteCalled = true;
            };

            const result = await deleteDraft('frag-xyz');

            expect(result.id).to.equal('frag-xyz');
            expect(deleteCalled).to.be.true;
        });
    });

    describe('saveCollectionToAEM', () => {
        it('creates multiple fragments for collection cards', async () => {
            const { saveCollectionToAEM } = await loadModule();

            const result = await saveCollectionToAEM({
                title: 'My Collection',
                cards: [
                    { variant: 'catalog', title: 'Card 1' },
                    { variant: 'catalog', title: 'Card 2' },
                ],
            });

            expect(result).to.be.an('array');
            expect(result.length).to.equal(2);
            expect(createdFragments.length).to.equal(2);
        });
    });

    describe('error handling', () => {
        it('throws when repository element is missing', async () => {
            const { saveDraftToAEM } = await loadModule();
            document.querySelector = () => null;

            try {
                await saveDraftToAEM({ variant: 'catalog', title: 'Test' });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.message).to.equal('Repository not found');
            }
        });

        it('throws for saveToAEM when repository is missing', async () => {
            const { saveToAEM } = await loadModule();
            document.querySelector = () => null;

            try {
                await saveToAEM({ variant: 'catalog', title: 'Test' });
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.message).to.equal('Repository not found');
            }
        });

        it('throws for publishDraft when repository is missing', async () => {
            const { publishDraft } = await loadModule();
            document.querySelector = () => null;

            try {
                await publishDraft('frag-123');
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.message).to.equal('Repository not found');
            }
        });

        it('throws for deleteDraft when repository is missing', async () => {
            const { deleteDraft } = await loadModule();
            document.querySelector = () => null;

            try {
                await deleteDraft('frag-123');
                expect.fail('should have thrown');
            } catch (err) {
                expect(err.message).to.equal('Repository not found');
            }
        });
    });
});
