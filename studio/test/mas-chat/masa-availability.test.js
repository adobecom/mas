import { expect } from '@esm-bundle/chai';
import { MasaClientError } from '../../src/mas-chat/masa-client.js';
import {
    isMasaAvailable,
    rememberFailure,
    resetMasaAvailability,
    isFallbackFailure,
    isUserInputError,
} from '../../src/mas-chat/masa-availability.js';

const REMEMBERED_CODES = [
    'connection-unavailable',
    'caller-not-allowed',
    'surface-not-allowed',
    'investigations-disabled',
    'masa-disabled',
    'masa-not-configured',
    'studio-origin-denied',
];

const NOT_REMEMBERED_CODES = [
    'service-busy',
    'request-rate-limit',
    'investigation-rate-limit',
    'investigation-capacity',
    'masa-timeout',
    'masa-unavailable',
    'worker-unavailable',
];

const INPUT_CODES = ['invalid-question', 'question-too-large', 'invalid-image'];

describe('masa-availability', () => {
    beforeEach(() => {
        resetMasaAvailability();
    });

    afterEach(() => {
        resetMasaAvailability();
    });

    it('starts available', () => {
        expect(isMasaAvailable()).to.be.true;
    });

    it('remembers each unavailable code for the page', () => {
        REMEMBERED_CODES.forEach((code) => {
            resetMasaAvailability();
            expect(rememberFailure(new MasaClientError(code, ''))).to.be.true;
            expect(isMasaAvailable()).to.be.false;
        });
    });

    it('does not remember busy or timeout codes', () => {
        NOT_REMEMBERED_CODES.forEach((code) => {
            resetMasaAvailability();
            expect(rememberFailure(new MasaClientError(code, ''))).to.be.false;
            expect(isMasaAvailable()).to.be.true;
        });
    });

    it('treats input errors as neither fallback nor unavailability', () => {
        INPUT_CODES.forEach((code) => {
            const error = new MasaClientError(code, '');
            expect(isUserInputError(error)).to.be.true;
            expect(isFallbackFailure(error)).to.be.false;
        });
        [...REMEMBERED_CODES, ...NOT_REMEMBERED_CODES].forEach((code) => {
            const error = new MasaClientError(code, '');
            expect(isUserInputError(error)).to.be.false;
            expect(isFallbackFailure(error)).to.be.true;
        });
    });

    it('Ask MASA again clears the memory', () => {
        rememberFailure(new MasaClientError('masa-disabled', ''));
        expect(isMasaAvailable()).to.be.false;
        resetMasaAvailability();
        expect(isMasaAvailable()).to.be.true;
    });
});
