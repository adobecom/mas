import {
    toPromotionCodes,
    toWcsOsiAndPromotionCodes,
} from '../src/utilities.js';
import { expect } from './utilities.js';

describe('function "toPromotionCodes"', () => {
    it('returns an empty array for null or undefined', () => {
        expect(toPromotionCodes(null)).to.deep.equal([]);
        expect(toPromotionCodes(undefined)).to.deep.equal([]);
    });

    it('returns a single-entry array for a value without a comma', () => {
        expect(toPromotionCodes('promo1')).to.deep.equal(['promo1']);
    });

    it('splits a comma-separated value, preserving empty entries', () => {
        expect(toPromotionCodes('promo1,')).to.deep.equal(['promo1', '']);
        expect(toPromotionCodes(',cancel-context')).to.deep.equal([
            '',
            'cancel-context',
        ]);
        expect(toPromotionCodes('promo1,promo2')).to.deep.equal([
            'promo1',
            'promo2',
        ]);
    });

    it('returns an array value as-is', () => {
        expect(toPromotionCodes(['promo1', ''])).to.deep.equal(['promo1', '']);
    });

    it('trims surrounding whitespace around each entry', () => {
        expect(toPromotionCodes('CODE1, CODE2, CODE3')).to.deep.equal([
            'CODE1',
            'CODE2',
            'CODE3',
        ]);
        expect(toPromotionCodes(' CODE1 , ')).to.deep.equal(['CODE1', '']);
    });
});

describe('function "toWcsOsiAndPromotionCodes"', () => {
    it('pairs each OSI with its own promo code, leaving a middle OSI promo-less', () => {
        expect(
            toWcsOsiAndPromotionCodes('A,B,C', 'PROMOCODE1,,PROMOCODE3'),
        ).to.deep.equal({
            wcsOsi: ['A', 'B', 'C'],
            promotionCodes: ['PROMOCODE1', '', 'PROMOCODE3'],
        });
    });

    it('pairs a genuinely promo-less OSI with an empty code', () => {
        expect(toWcsOsiAndPromotionCodes('abm,stock-abm', 'P1,')).to.deep.equal(
            {
                wcsOsi: ['abm', 'stock-abm'],
                promotionCodes: ['P1', ''],
            },
        );
    });

    it('leaves promotionCodes untouched when OSI is null or undefined', () => {
        expect(toWcsOsiAndPromotionCodes(null, 'P1')).to.deep.equal({
            wcsOsi: [],
            promotionCodes: ['P1'],
        });
        expect(toWcsOsiAndPromotionCodes(undefined, 'P1,P2')).to.deep.equal({
            wcsOsi: [],
            promotionCodes: ['P1', 'P2'],
        });
    });

    it('broadcasts a single promo code regardless of OSI blanks', () => {
        expect(
            toWcsOsiAndPromotionCodes('abm,,stock-abm', 'BROADCAST'),
        ).to.deep.equal({
            wcsOsi: ['abm', 'stock-abm'],
            promotionCodes: ['BROADCAST'],
        });
    });

    it('keeps a blank OSI entry from shifting later promo codes onto the wrong OSI', () => {
        expect(
            toWcsOsiAndPromotionCodes('abm,,stock-abm', 'P1,P2,P3'),
        ).to.deep.equal({
            wcsOsi: ['abm', 'stock-abm'],
            promotionCodes: ['P1', 'P3'],
        });
    });

    it('accepts an array OSI value as-is', () => {
        expect(
            toWcsOsiAndPromotionCodes(['abm', 'stock-abm'], 'P1,P2'),
        ).to.deep.equal({
            wcsOsi: ['abm', 'stock-abm'],
            promotionCodes: ['P1', 'P2'],
        });
    });
});
