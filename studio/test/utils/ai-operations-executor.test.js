import { expect } from '@esm-bundle/chai';
import { DESTRUCTIVE_TOOLS, shouldRequireConfirmation } from '../../src/utils/ai-operations-executor.js';

describe('ai-operations-executor', () => {
    describe('DESTRUCTIVE_TOOLS allowlist', () => {
        it('contains all known destructive MCP tools', () => {
            expect(DESTRUCTIVE_TOOLS.has('delete_card')).to.be.true;
            expect(DESTRUCTIVE_TOOLS.has('bulk_delete_cards')).to.be.true;
            expect(DESTRUCTIVE_TOOLS.has('bulk_publish_cards')).to.be.true;
            expect(DESTRUCTIVE_TOOLS.has('bulk_update_cards')).to.be.true;
            expect(DESTRUCTIVE_TOOLS.has('unpublish_card')).to.be.true;
            expect(DESTRUCTIVE_TOOLS.has('create_release_cards')).to.be.true;
        });

        it('does not include read-only or preview tools', () => {
            expect(DESTRUCTIVE_TOOLS.has('get_card')).to.be.false;
            expect(DESTRUCTIVE_TOOLS.has('search_cards')).to.be.false;
            expect(DESTRUCTIVE_TOOLS.has('list_products')).to.be.false;
            expect(DESTRUCTIVE_TOOLS.has('preview_bulk_delete')).to.be.false;
            expect(DESTRUCTIVE_TOOLS.has('preview_bulk_publish')).to.be.false;
            expect(DESTRUCTIVE_TOOLS.has('preview_bulk_update')).to.be.false;
            expect(DESTRUCTIVE_TOOLS.has('resolve_offer_selector')).to.be.false;
        });
    });

    describe('shouldRequireConfirmation', () => {
        it('returns true when the backend flag is true regardless of tool', () => {
            expect(shouldRequireConfirmation('get_card', true)).to.be.true;
            expect(shouldRequireConfirmation('search_cards', true)).to.be.true;
        });

        it('returns true for destructive tools even when backend flag is false', () => {
            expect(shouldRequireConfirmation('delete_card', false)).to.be.true;
            expect(shouldRequireConfirmation('bulk_delete_cards', false)).to.be.true;
            expect(shouldRequireConfirmation('bulk_publish_cards', false)).to.be.true;
            expect(shouldRequireConfirmation('bulk_update_cards', false)).to.be.true;
            expect(shouldRequireConfirmation('unpublish_card', false)).to.be.true;
            expect(shouldRequireConfirmation('create_release_cards', false)).to.be.true;
        });

        it('returns true for destructive tools when backend flag is undefined', () => {
            expect(shouldRequireConfirmation('delete_card', undefined)).to.be.true;
            expect(shouldRequireConfirmation('bulk_delete_cards', undefined)).to.be.true;
        });

        it('returns false for read-only tools when backend flag is false', () => {
            expect(shouldRequireConfirmation('get_card', false)).to.be.false;
            expect(shouldRequireConfirmation('search_cards', false)).to.be.false;
            expect(shouldRequireConfirmation('list_products', false)).to.be.false;
        });

        it('returns false for preview tools (which are inherently safe)', () => {
            expect(shouldRequireConfirmation('preview_bulk_delete', false)).to.be.false;
            expect(shouldRequireConfirmation('preview_bulk_publish', false)).to.be.false;
            expect(shouldRequireConfirmation('preview_bulk_update', false)).to.be.false;
        });

        it('does not throw when toolName is undefined or null', () => {
            expect(() => shouldRequireConfirmation(undefined, false)).to.not.throw();
            expect(() => shouldRequireConfirmation(null, false)).to.not.throw();
            expect(shouldRequireConfirmation(undefined, false)).to.be.false;
        });

        it('returns true if toolName is undefined but backend flag is true', () => {
            expect(shouldRequireConfirmation(undefined, true)).to.be.true;
        });
    });
});
