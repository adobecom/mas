import { expect } from '@esm-bundle/chai';
import {
    extractFragmentIdsFromMessage,
    extractFragmentSummariesFromMessage,
} from '../../src/utils/operation-result-extractors.js';

const UUID_A = '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf';
const UUID_B = '12f26a12-118e-4367-b4d2-d8b6995bd9ab';

describe('operation-result-extractors', () => {
    describe('extractFragmentIdsFromMessage', () => {
        it('returns [] for null / undefined / no operationResult', () => {
            expect(extractFragmentIdsFromMessage(null)).to.deep.equal([]);
            expect(extractFragmentIdsFromMessage(undefined)).to.deep.equal([]);
            expect(extractFragmentIdsFromMessage({})).to.deep.equal([]);
            expect(extractFragmentIdsFromMessage({ operationResult: null })).to.deep.equal([]);
        });

        it('pulls ids from search_cards .results shape', () => {
            const message = {
                operationResult: {
                    results: [
                        { id: UUID_A, title: 't1' },
                        { id: UUID_B, title: 't2' },
                    ],
                },
            };
            expect(extractFragmentIdsFromMessage(message)).to.deep.equal([UUID_A, UUID_B]);
        });

        it('pulls ids from create_release_cards rawResult.cards shape', () => {
            const message = {
                operationType: 'create_release_cards',
                operationResult: {
                    success: true,
                    rawResult: {
                        cards: [
                            { success: true, card: { id: UUID_A, title: 'Firefly - Plans' } },
                            { success: true, card: { id: UUID_B, title: 'Firefly - Catalog' } },
                        ],
                        product: { name: 'Firefly Essentials' },
                    },
                },
            };
            expect(extractFragmentIdsFromMessage(message)).to.deep.equal([UUID_A, UUID_B]);
        });

        it('skips failed cards in rawResult.cards', () => {
            const message = {
                operationResult: {
                    rawResult: {
                        cards: [
                            { success: true, card: { id: UUID_A } },
                            { success: false, card: { title: 'broken' }, error: 'AEM rejected' },
                            { success: true, card: { id: UUID_B } },
                        ],
                    },
                },
            };
            expect(extractFragmentIdsFromMessage(message)).to.deep.equal([UUID_A, UUID_B]);
        });

        it('pulls ids from bulk update updatedCards shape', () => {
            const message = {
                operationResult: {
                    updatedCards: [{ id: UUID_A }, { id: UUID_B }],
                },
            };
            expect(extractFragmentIdsFromMessage(message)).to.deep.equal([UUID_A, UUID_B]);
        });

        it('pulls ids from raw fragmentIds list (bulk-publish style)', () => {
            const message = {
                operationResult: {
                    fragmentIds: [UUID_A, UUID_B],
                },
            };
            expect(extractFragmentIdsFromMessage(message)).to.deep.equal([UUID_A, UUID_B]);
        });

        it('filters out falsy ids', () => {
            const message = {
                operationResult: {
                    results: [{ id: UUID_A }, { id: null }, { id: '' }, {}],
                },
            };
            expect(extractFragmentIdsFromMessage(message)).to.deep.equal([UUID_A]);
        });
    });

    describe('extractFragmentSummariesFromMessage', () => {
        it('returns [] for messages with no operationResult', () => {
            expect(extractFragmentSummariesFromMessage(null)).to.deep.equal([]);
            expect(extractFragmentSummariesFromMessage({})).to.deep.equal([]);
        });

        it('summarizes search_cards .results', () => {
            const host = { extractVariant: () => 'plans', extractOsi: () => 'osi-x' };
            const message = {
                operationResult: {
                    results: [
                        { id: UUID_A, title: 'Firefly' },
                        { id: UUID_B, cardTitle: 'Pro' },
                    ],
                },
            };
            const got = extractFragmentSummariesFromMessage(message, host);
            expect(got).to.deep.equal([
                { id: UUID_A, title: 'Firefly', variant: 'plans', osi: 'osi-x' },
                { id: UUID_B, title: 'Pro', variant: 'plans', osi: 'osi-x' },
            ]);
        });

        it('summarizes create_release_cards rawResult.cards (the regression case)', () => {
            const message = {
                operationType: 'create_release_cards',
                operationResult: {
                    rawResult: {
                        cards: [
                            { success: true, card: { id: UUID_A, title: 'Firefly Essentials - Plans', variant: 'plans' } },
                            { success: true, card: { id: UUID_B, title: 'Firefly Essentials - Catalog', variant: 'catalog' } },
                        ],
                    },
                },
            };
            const got = extractFragmentSummariesFromMessage(message, null);
            expect(got).to.deep.equal([
                { id: UUID_A, title: 'Firefly Essentials - Plans', variant: 'plans', osi: null },
                { id: UUID_B, title: 'Firefly Essentials - Catalog', variant: 'catalog', osi: null },
            ]);
        });

        it('skips failed cards in rawResult.cards summaries', () => {
            const message = {
                operationResult: {
                    rawResult: {
                        cards: [
                            { success: true, card: { id: UUID_A, title: 'Good', variant: 'plans' } },
                            { success: false, card: { title: 'Broken' }, error: 'AEM rejected' },
                        ],
                    },
                },
            };
            const got = extractFragmentSummariesFromMessage(message);
            expect(got).to.have.lengthOf(1);
            expect(got[0].id).to.equal(UUID_A);
        });

        it('falls back to fragment.osi when no host getter is provided', () => {
            const message = {
                operationResult: {
                    results: [{ id: UUID_A, title: 't', variant: 'plans', osi: 'fallback-osi' }],
                },
            };
            const got = extractFragmentSummariesFromMessage(message, null);
            expect(got[0].osi).to.equal('fallback-osi');
        });
    });
});
