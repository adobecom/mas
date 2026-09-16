import { expect } from '@esm-bundle/chai';
import {
    getMarkNameForHeadlessVariant,
    getHeadlessVariantForMarkName,
    resolveHeadlessDisplayVariant,
    getCtaEmphasis,
} from '../../src/rte/link-variant-utils.js';

describe('link-variant-utils', () => {
    describe('getMarkNameForHeadlessVariant', () => {
        it('maps primary to strong', () => {
            expect(getMarkNameForHeadlessVariant('primary')).to.equal('strong');
        });

        it('maps secondary to em', () => {
            expect(getMarkNameForHeadlessVariant('secondary')).to.equal('em');
        });

        it('returns null for secondary-link (no wrapper)', () => {
            expect(getMarkNameForHeadlessVariant('secondary-link')).to.be.null;
        });

        it('returns null for an unknown variant', () => {
            expect(getMarkNameForHeadlessVariant('unknown')).to.be.null;
        });
    });

    describe('getHeadlessVariantForMarkName', () => {
        it('maps strong to primary', () => {
            expect(getHeadlessVariantForMarkName('strong')).to.equal('primary');
        });

        it('maps em to secondary', () => {
            expect(getHeadlessVariantForMarkName('em')).to.equal('secondary');
        });

        it('falls back to secondary-link for no mark', () => {
            expect(getHeadlessVariantForMarkName(undefined)).to.equal('secondary-link');
        });
    });

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
    });

    describe('getCtaEmphasis', () => {
        it('returns null for a falsy className', () => {
            expect(getCtaEmphasis('')).to.be.null;
            expect(getCtaEmphasis(undefined)).to.be.null;
        });

        it('returns bold for a primary (non-link) className', () => {
            expect(getCtaEmphasis('primary')).to.equal('bold');
        });

        it('returns bold for an accent className', () => {
            expect(getCtaEmphasis('accent')).to.equal('bold');
        });

        it('returns italic for a secondary (non-link) className', () => {
            expect(getCtaEmphasis('secondary')).to.equal('italic');
        });

        it('returns null for a link-style className', () => {
            expect(getCtaEmphasis('secondary-link')).to.be.null;
        });
    });
});
