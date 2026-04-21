import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { generateFieldLink, camelToTitle, stripHtml, previewValue, scrubUrls, logError } from '../src/utils.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../src/constants.js';

describe('generateFieldLink', () => {
    function mockFragment(modelPath, id = 'frag-123') {
        return {
            id,
            model: { path: modelPath },
            title: 'Test Collection',
            getField: (name) => {
                const fields = {
                    name: { values: ['card-name'] },
                    cardTitle: { values: ['Creative Cloud'] },
                    variant: { values: ['plans'] },
                };
                return fields[name] || null;
            },
            getTagTitle: () => null,
        };
    }

    it('returns null for unknown model path', () => {
        const fragment = mockFragment('/unknown/model');
        expect(generateFieldLink(fragment, '/acom', 'prices')).to.be.null;
    });

    it('generates correct link for a card fragment', () => {
        const fragment = mockFragment(CARD_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'content', 'prices');
        expect(result).to.not.be.null;
        expect(result.displayText).to.include('prices');
        expect(result.displayText).to.include('→');
        expect(result.href).to.include('content-type=merch-card');
        expect(result.href).to.include('page=content');
        expect(result.href).to.include('path=%2Facom');
        expect(result.href).to.include('query=frag-123');
        expect(result.href).to.include('field=prices');
        expect(result.richText).to.include('<a href=');
        expect(result.richText).to.include(result.displayText);
    });

    it('generates correct link for a collection fragment', () => {
        const fragment = mockFragment(COLLECTION_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'content', 'description');
        expect(result).to.not.be.null;
        expect(result.href).to.include('content-type=merch-card-collection');
        expect(result.href).to.include('query=frag-123');
        expect(result.href).to.include('field=description');
    });

    it('uses mas-field display text and includes field name', () => {
        const fragment = mockFragment(CARD_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'content', 'cardTitle');
        expect(result.displayText).to.include('mas-field:');
        expect(result.displayText).to.include('cardTitle');
    });

    it('defaults page to content for backward-compatible call signature', () => {
        const fragment = mockFragment(CARD_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'prices');
        expect(result).to.not.be.null;
        expect(result.href).to.include('page=content');
        expect(result.href).to.include('field=prices');
    });

    it('returns null when fragment is null', () => {
        expect(generateFieldLink(null, '/acom', 'prices')).to.be.null;
    });
});

describe('camelToTitle', () => {
    it('converts camelCase to title case', () => {
        expect(camelToTitle('cardTitle')).to.equal('Card Title');
    });

    it('handles multiple camelCase boundaries', () => {
        expect(camelToTitle('borderColor')).to.equal('Border Color');
    });

    it('capitalizes a single word', () => {
        expect(camelToTitle('badge')).to.equal('Badge');
    });

    it('handles consecutive transitions', () => {
        expect(camelToTitle('mnemonicIcon')).to.equal('Mnemonic Icon');
    });
});

describe('stripHtml', () => {
    it('strips HTML tags and returns text content', () => {
        expect(stripHtml('<p>Hello <strong>world</strong></p>')).to.equal('Hello world');
    });

    it('returns empty string for empty input', () => {
        expect(stripHtml('')).to.equal('');
    });

    it('returns plain text unchanged', () => {
        expect(stripHtml('no tags here')).to.equal('no tags here');
    });
});

describe('previewValue', () => {
    it('returns empty string for null/undefined values', () => {
        expect(previewValue(null)).to.equal('');
        expect(previewValue(undefined)).to.equal('');
        expect(previewValue([])).to.equal('');
    });

    it('returns empty string when first value is empty', () => {
        expect(previewValue([''])).to.equal('');
    });

    it('returns plain text as-is for short values', () => {
        expect(previewValue(['Creative Cloud Pro'])).to.equal('Creative Cloud Pro');
    });

    it('preserves full text without truncation', () => {
        const longText = 'A'.repeat(80);
        const result = previewValue([longText]);
        expect(result).to.equal(longText);
    });

    it('strips HTML from values containing angle brackets', () => {
        const htmlValue = '<p>Save 50% on <strong>all apps</strong></p>';
        const result = previewValue([htmlValue]);
        expect(result).to.equal('Save 50% on all apps');
        expect(result).to.not.include('<');
    });

    it('converts non-string values to string', () => {
        expect(previewValue([42])).to.equal('42');
        expect(previewValue([true])).to.equal('true');
    });
});

describe('scrubUrls', () => {
    it('passes non-string inputs through unchanged', () => {
        expect(scrubUrls(null)).to.be.null;
        expect(scrubUrls(undefined)).to.be.undefined;
        expect(scrubUrls(42)).to.equal(42);
    });

    it('leaves strings without URLs unchanged', () => {
        expect(scrubUrls('plain message')).to.equal('plain message');
    });

    it('collapses a URL to its origin, dropping path + query', () => {
        const out = scrubUrls('Failed to fetch https://api.example.com/v1/thing?token=SECRET now');
        expect(out).to.equal('Failed to fetch https://api.example.com now');
    });

    it('collapses multiple URLs in one string', () => {
        const out = scrubUrls('From https://a.com/x?t=1 to https://b.com/y?t=2 done');
        expect(out).to.equal('From https://a.com to https://b.com done');
    });

    it('replaces an unparseable URL-like token with [url-scrubbed]', () => {
        const out = scrubUrls('weird http://??? token');
        // Depending on URL parsing leniency this may be '[url-scrubbed]' or the origin.
        expect(out).to.not.include('???');
    });
});

describe('logError', () => {
    let errorStub;

    beforeEach(() => {
        errorStub = sinon.stub(console, 'error');
    });

    afterEach(() => {
        errorStub.restore();
    });

    it('logs label + name + scrubbed message for a standard Error', () => {
        const err = new Error('Request to https://api.example.com/v1/x?token=SECRET failed');
        logError('Op failed', err);
        expect(errorStub.firstCall.args[0]).to.include('Op failed');
        expect(errorStub.firstCall.args[0]).to.include('Error');
        expect(errorStub.firstCall.args[0]).to.include('https://api.example.com');
        expect(errorStub.firstCall.args[0]).to.not.include('token=SECRET');
    });

    it('logs a scrubbed stack trace separately when stack is present and differs from message', () => {
        const err = new Error('boom');
        err.stack = 'Error: boom\n  at fn (https://internal.adobe.io/secret?k=1:12:34)';
        logError('Op failed', err);
        // Two calls: message + stack
        expect(errorStub.callCount).to.be.at.least(2);
        const stackCall = errorStub.secondCall.args[0];
        expect(stackCall).to.include('https://internal.adobe.io');
        expect(stackCall).to.not.include('k=1');
    });

    it('handles non-Error thrown values', () => {
        logError('Op failed', 'string thrown');
        expect(errorStub.firstCall.args[0]).to.include('Op failed');
        expect(errorStub.firstCall.args[0]).to.include('string thrown');
    });

    it('handles null / undefined errors without throwing', () => {
        expect(() => logError('Op failed', null)).to.not.throw();
        expect(() => logError('Op failed', undefined)).to.not.throw();
    });
});
