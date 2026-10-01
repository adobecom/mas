import { expect } from '@esm-bundle/chai';
import { auditCustomFieldPairs, planCustomFieldCorrections } from '../../src/promotions/custom-field-audit.js';

describe('custom-field-audit', () => {
    describe('auditCustomFieldPairs', () => {
        it('aggregates one finding per mismatched pair', () => {
            const pairs = [
                {
                    defaultPath: '/default/a',
                    promoPath: '/promo/a',
                    defaultEntries: [
                        { name: 'foo', value: '1' },
                        { name: 'bar', value: '2' },
                    ],
                    promoEntries: [{ name: 'foo', value: '1' }],
                },
                {
                    defaultPath: '/default/b',
                    promoPath: '/promo/b',
                    defaultEntries: [{ name: 'baz', value: '3' }],
                    promoEntries: [{ name: 'qux', value: '9' }],
                },
            ];
            const { findings, correctionCount } = auditCustomFieldPairs(pairs);
            expect(correctionCount).to.equal(2);
            expect(findings[0]).to.include({ defaultPath: '/default/a', promoPath: '/promo/a' });
            expect(findings[0].missing).to.deep.equal(['bar']);
            expect(findings[1]).to.include({ defaultPath: '/default/b', promoPath: '/promo/b' });
            expect(findings[1].renames).to.deep.equal([{ from: 'qux', to: 'baz', index: 0 }]);
        });

        it('yields no finding for a fully in-sync pair', () => {
            const pairs = [
                {
                    defaultPath: '/default/a',
                    promoPath: '/promo/a',
                    defaultEntries: [{ name: 'foo', value: '1' }],
                    promoEntries: [{ name: 'foo', value: '1' }],
                },
            ];
            const { findings, correctionCount } = auditCustomFieldPairs(pairs);
            expect(findings).to.deep.equal([]);
            expect(correctionCount).to.equal(0);
        });

        it('returns an empty result for an empty pairs list', () => {
            expect(auditCustomFieldPairs([])).to.deep.equal({ findings: [], correctionCount: 0 });
            expect(auditCustomFieldPairs()).to.deep.equal({ findings: [], correctionCount: 0 });
        });
    });

    describe('planCustomFieldCorrections', () => {
        it('appends missing fields using the default entry and keeps the promo value', () => {
            const pairs = [
                {
                    defaultPath: '/default/a',
                    promoPath: '/promo/a',
                    defaultEntries: [
                        { name: 'foo', value: 'default-value' },
                        { name: 'bar', value: 'bar-default' },
                    ],
                    promoEntries: [{ name: 'foo', value: 'promo-value' }],
                },
            ];
            const { findings } = auditCustomFieldPairs(pairs);
            const corrections = planCustomFieldCorrections(findings);
            expect(corrections).to.deep.equal([
                {
                    promoPath: '/promo/a',
                    entries: [
                        { name: 'foo', value: 'promo-value' },
                        { name: 'bar', value: 'bar-default' },
                    ],
                },
            ]);
        });

        it('rewrites a renamed promo entry to the default name while preserving its value', () => {
            const pairs = [
                {
                    defaultPath: '/default/b',
                    promoPath: '/promo/b',
                    defaultEntries: [{ name: 'baz', value: 'unused' }],
                    promoEntries: [{ name: 'qux', value: 'promo-only-value' }],
                },
            ];
            const { findings } = auditCustomFieldPairs(pairs);
            const corrections = planCustomFieldCorrections(findings);
            expect(corrections).to.deep.equal([
                {
                    promoPath: '/promo/b',
                    entries: [{ name: 'baz', value: 'promo-only-value' }],
                },
            ]);
        });

        it('returns an empty array when there are no findings', () => {
            expect(planCustomFieldCorrections([])).to.deep.equal([]);
        });
    });
});
