import { expect } from '@esm-bundle/chai';
import { MasaClient, MasaClientError } from '../../src/mas-chat/masa-client.js';
import {
    isMasaAvailable,
    rememberFailure,
    resetMasaAvailability,
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
    'answer-unavailable',
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

    it('tells input errors apart from every other MASA failure', () => {
        INPUT_CODES.forEach((code) => {
            const error = new MasaClientError(code, '');
            expect(isUserInputError(error)).to.be.true;
        });
        [...REMEMBERED_CODES, ...NOT_REMEMBERED_CODES].forEach((code) => {
            const error = new MasaClientError(code, '');
            expect(isUserInputError(error)).to.be.false;
        });
    });

    it('remembers a missing masa-api action as not configured', async () => {
        const missing = new Response(JSON.stringify({ error: 'The requested resource does not exist.' }), { status: 404 });
        const client = new MasaClient({
            url: 'https://runtime.example/masa-api.http',
            fetchImpl: async () => missing,
            getToken: () => 'test',
        });
        const error = await client.control('c', 'session.create').catch((rejection) => rejection);
        expect(error.code).to.equal('masa-not-configured');
        expect(rememberFailure(error)).to.be.true;
        expect(isMasaAvailable()).to.be.false;
    });

    it('Ask MASA again clears the memory', () => {
        rememberFailure(new MasaClientError('masa-disabled', ''));
        expect(isMasaAvailable()).to.be.false;
        resetMasaAvailability();
        expect(isMasaAvailable()).to.be.true;
    });
});
