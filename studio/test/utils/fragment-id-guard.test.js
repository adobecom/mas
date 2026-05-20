import { expect } from '@esm-bundle/chai';
import { isValidFragmentId, validateFragmentIds, fragmentIdGuardMessage } from '../../src/utils/fragment-id-guard.js';

const UUID = '0a0eed5c-cb62-4cfa-b7bf-d45b0b5845cf';
const UUID_2 = '12f26a12-118e-4367-b4d2-d8b6995bd9ab';

describe('fragment-id-guard', () => {
    describe('isValidFragmentId', () => {
        it('accepts canonical lowercase UUIDs', () => {
            expect(isValidFragmentId(UUID)).to.equal(true);
        });

        it('accepts uppercase UUIDs', () => {
            expect(isValidFragmentId(UUID.toUpperCase())).to.equal(true);
        });

        it('rejects slug-style strings', () => {
            expect(isValidFragmentId('firefly-essentials-plans')).to.equal(false);
        });

        it('rejects empty / non-string values', () => {
            expect(isValidFragmentId('')).to.equal(false);
            expect(isValidFragmentId(null)).to.equal(false);
            expect(isValidFragmentId(undefined)).to.equal(false);
            expect(isValidFragmentId(123)).to.equal(false);
        });

        it('rejects UUIDs with extra prefix/suffix', () => {
            expect(isValidFragmentId(`prefix-${UUID}`)).to.equal(false);
            expect(isValidFragmentId(`${UUID}-suffix`)).to.equal(false);
        });
    });

    describe('validateFragmentIds', () => {
        it('passes through tools not in the allowlist', () => {
            const result = validateFragmentIds('search_cards', { query: 'firefly' });
            expect(result.ok).to.equal(true);
        });

        it('passes when all fragmentIds are UUIDs', () => {
            const result = validateFragmentIds('bulk_update_cards', {
                fragmentIds: [UUID, UUID_2],
            });
            expect(result.ok).to.equal(true);
        });

        it('passes when single id is a UUID', () => {
            const result = validateFragmentIds('get_card', { id: UUID });
            expect(result.ok).to.equal(true);
        });

        it('rejects slug fragmentIds for bulk_update_cards', () => {
            const result = validateFragmentIds('bulk_update_cards', {
                fragmentIds: ['firefly-essentials-plans', 'firefly-essentials-catalog'],
            });
            expect(result.ok).to.equal(false);
            expect(result.invalid).to.deep.equal(['firefly-essentials-plans', 'firefly-essentials-catalog']);
        });

        it('rejects mixed valid + invalid arrays', () => {
            const result = validateFragmentIds('bulk_publish_cards', {
                fragmentIds: [UUID, 'firefly-essentials-plans'],
            });
            expect(result.ok).to.equal(false);
            expect(result.invalid).to.deep.equal(['firefly-essentials-plans']);
        });

        it('rejects slug id for get_card', () => {
            const result = validateFragmentIds('get_card', { id: 'firefly-essentials-plans' });
            expect(result.ok).to.equal(false);
            expect(result.invalid).to.deep.equal(['firefly-essentials-plans']);
        });

        it('rejects slug cardId for link_card_to_offer', () => {
            const result = validateFragmentIds('link_card_to_offer', {
                cardId: 'firefly-essentials-plans',
                offerSelectorId: 'r_abc',
            });
            expect(result.ok).to.equal(false);
            expect(result.invalid).to.deep.equal(['firefly-essentials-plans']);
        });

        it('passes when fragmentIds is absent on a bulk tool', () => {
            const result = validateFragmentIds('bulk_update_cards', { textReplacements: [] });
            expect(result.ok).to.equal(true);
        });

        it('passes when mcpParams is null', () => {
            const result = validateFragmentIds('bulk_update_cards', null);
            expect(result.ok).to.equal(true);
        });
    });

    describe('fragmentIdGuardMessage', () => {
        it('quotes up to 3 invalid ids', () => {
            const msg = fragmentIdGuardMessage(['a', 'b']);
            expect(msg).to.contain('"a"');
            expect(msg).to.contain('"b"');
            expect(msg).to.not.contain('+');
        });

        it('summarizes overflow when more than 3', () => {
            const msg = fragmentIdGuardMessage(['a', 'b', 'c', 'd', 'e']);
            expect(msg).to.contain('"a"');
            expect(msg).to.contain('"c"');
            expect(msg).to.contain('+2 more');
            expect(msg).to.not.contain('"d"');
        });

        it('instructs the user to search first', () => {
            const msg = fragmentIdGuardMessage(['firefly-essentials-plans']);
            expect(msg.toLowerCase()).to.contain('search for the cards first');
        });
    });
});
