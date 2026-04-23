import { expect } from '@open-wc/testing';
import {
    OFFER_ID_PATTERN,
    OFFER_SELECTOR_ID_PATTERN,
    isOfferId,
    isOfferSelectorId,
} from '../../src/utils/offer-utils.js';

describe('OFFER_ID_PATTERN', () => {
    it('matches a valid 32-char hex string', () => {
        expect(OFFER_ID_PATTERN.test('257E1D82082387D152029F93C1030624')).to.be
            .true;
    });

    it('rejects lowercase hex', () => {
        expect(OFFER_ID_PATTERN.test('257e1d82082387d152029f93c1030624')).to.be
            .false;
    });

    it('rejects strings shorter than 32 chars', () => {
        expect(OFFER_ID_PATTERN.test('257E1D82082387D152029F93C103062')).to.be
            .false;
    });

    it('rejects strings longer than 32 chars', () => {
        expect(OFFER_ID_PATTERN.test('257E1D82082387D152029F93C10306240')).to.be
            .false;
    });
});

describe('OFFER_SELECTOR_ID_PATTERN', () => {
    it('matches a valid 43-char base64 string', () => {
        const id = 'abcdefghijklmnopqrstuvwxyz01234567890ABCDEF';
        expect(OFFER_SELECTOR_ID_PATTERN.test(id)).to.be.true;
    });

    it('allows underscores and hyphens', () => {
        const id = 'abc_efghijklmnopqrstuvwxyz0123456789-ABCDEF';
        expect(OFFER_SELECTOR_ID_PATTERN.test(id)).to.be.true;
    });

    it('rejects strings not 43 chars', () => {
        expect(OFFER_SELECTOR_ID_PATTERN.test('short')).to.be.false;
    });
});

describe('isOfferId', () => {
    it('returns true for valid offer ID', () => {
        expect(isOfferId('257E1D82082387D152029F93C1030624')).to.be.true;
    });

    it('returns false for invalid input', () => {
        expect(isOfferId('notanoffer')).to.be.false;
    });

    it('returns false for non-string input', () => {
        expect(isOfferId(undefined)).to.be.false;
        expect(isOfferId(null)).to.be.false;
        expect(isOfferId(123)).to.be.false;
    });
});

describe('isOfferSelectorId', () => {
    it('returns true for valid OSI', () => {
        const id = 'abcdefghijklmnopqrstuvwxyz01234567890ABCDEF';
        expect(isOfferSelectorId(id)).to.be.true;
    });

    it('returns false for invalid input', () => {
        expect(isOfferSelectorId('short')).to.be.false;
    });

    it('returns false for non-string input', () => {
        expect(isOfferSelectorId(undefined)).to.be.false;
        expect(isOfferSelectorId(null)).to.be.false;
    });
});
