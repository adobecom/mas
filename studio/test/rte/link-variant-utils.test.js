import { expect } from '@esm-bundle/chai';
import { resolveHeadlessDisplayVariant } from '../../src/rte/link-variant-utils.js';

describe('link-variant-utils', () => {
    describe('resolveHeadlessDisplayVariant', () => {
        it('resolves accent/primary/primary-outline to primary', () => {
            expect(resolveHeadlessDisplayVariant('accent')).to.equal('primary');
            expect(resolveHeadlessDisplayVariant('primary')).to.equal('primary');
            expect(resolveHeadlessDisplayVariant('primary-outline')).to.equal('primary');
        });

        it('resolves secondary/secondary-outline to secondary', () => {
            expect(resolveHeadlessDisplayVariant('secondary')).to.equal('secondary');
            expect(resolveHeadlessDisplayVariant('secondary-outline')).to.equal('secondary');
        });

        it('falls back to secondary-link for anything else', () => {
            expect(resolveHeadlessDisplayVariant('secondary-link')).to.equal('secondary-link');
            expect(resolveHeadlessDisplayVariant(undefined)).to.equal('secondary-link');
        });

        it('resolves a variant alongside unrelated classes', () => {
            expect(resolveHeadlessDisplayVariant('upt-link secondary')).to.equal('secondary');
            expect(resolveHeadlessDisplayVariant('primary-link button-l')).to.equal('secondary-link');
        });
    });
});
