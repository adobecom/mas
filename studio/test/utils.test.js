import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { copyToClipboard, generateFieldLink, camelToTitle, stripHtml, previewValue } from '../src/utils.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../src/constants.js';
import Events from '../src/events.js';

describe('copyToClipboard', () => {
    let sandbox;
    let mockEvent;
    let toastEmitStub;
    let clipboardStub;
    let consoleErrorStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockEvent = {
            stopPropagation: sandbox.stub(),
        };
        toastEmitStub = sandbox.stub(Events.toast, 'emit');
        consoleErrorStub = sandbox.stub(console, 'error');
        clipboardStub = {
            writeText: sandbox.stub(),
        };
        Object.defineProperty(navigator, 'clipboard', {
            value: clipboardStub,
            configurable: true,
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should call stopPropagation on the event', async () => {
        clipboardStub.writeText.resolves();
        await copyToClipboard(mockEvent, 'test text');
        expect(mockEvent.stopPropagation.calledOnce).to.be.true;
    });

    it('should show negative toast when text is undefined', async () => {
        await copyToClipboard(mockEvent, undefined);
        expect(toastEmitStub.calledOnce).to.be.true;
        expect(
            toastEmitStub.calledWith({
                variant: 'negative',
                content: 'No text to copy',
            }),
        ).to.be.true;
        expect(clipboardStub.writeText.called).to.be.false;
    });

    it('should successfully copy text to clipboard and show positive toast', async () => {
        const testText = 'Text to copy';
        clipboardStub.writeText.resolves();
        await copyToClipboard(mockEvent, testText);
        expect(clipboardStub.writeText.calledOnce).to.be.true;
        expect(clipboardStub.writeText.calledWith(testText)).to.be.true;
        expect(toastEmitStub.calledOnce).to.be.true;
        expect(
            toastEmitStub.calledWith({
                variant: 'positive',
                content: 'Copied to clipboard',
            }),
        ).to.be.true;
    });

    it('should handle clipboard API failure and show negative toast', async () => {
        const testText = 'test text';
        const error = new Error('Clipboard API failed');
        clipboardStub.writeText.rejects(error);
        await copyToClipboard(mockEvent, testText);
        expect(clipboardStub.writeText.calledOnce).to.be.true;
        expect(consoleErrorStub.calledOnce).to.be.true;
        expect(consoleErrorStub.calledWith('Failed to copy:', error)).to.be.true;
        expect(toastEmitStub.calledOnce).to.be.true;
        expect(
            toastEmitStub.calledWith({
                variant: 'negative',
                content: 'Failed to copy',
            }),
        ).to.be.true;
    });

    it('should handle long text strings', async () => {
        const longText = 'a'.repeat(10000);
        clipboardStub.writeText.resolves();
        await copyToClipboard(mockEvent, longText);
        expect(clipboardStub.writeText.calledOnce).to.be.true;
        expect(clipboardStub.writeText.calledWith(longText)).to.be.true;
        expect(
            toastEmitStub.calledWith({
                variant: 'positive',
                content: 'Copied to clipboard',
            }),
        ).to.be.true;
    });

    it('should handle special characters in text', async () => {
        const specialText = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`\n\t';
        clipboardStub.writeText.resolves();
        await copyToClipboard(mockEvent, specialText);
        expect(clipboardStub.writeText.calledOnce).to.be.true;
        expect(clipboardStub.writeText.calledWith(specialText)).to.be.true;
        expect(
            toastEmitStub.calledWith({
                variant: 'positive',
                content: 'Copied to clipboard',
            }),
        ).to.be.true;
    });

    it('should handle multiline text', async () => {
        const multilineText = 'Line 1\nLine 2\nLine 3';
        clipboardStub.writeText.resolves();
        await copyToClipboard(mockEvent, multilineText);
        expect(clipboardStub.writeText.calledOnce).to.be.true;
        expect(clipboardStub.writeText.calledWith(multilineText)).to.be.true;
        expect(
            toastEmitStub.calledWith({
                variant: 'positive',
                content: 'Copied to clipboard',
            }),
        ).to.be.true;
    });
});

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
        const result = generateFieldLink(fragment, '/acom', 'prices');
        expect(result).to.not.be.null;
        expect(result.displayText).to.include('prices');
        expect(result.displayText).to.include('→');
        expect(result.href).to.include('content-type=merch-card');
        expect(result.href).to.include('fragment=frag-123');
        expect(result.href).to.include('field=prices');
        expect(result.richText).to.include('<a href=');
        expect(result.richText).to.include(result.displayText);
    });

    it('generates correct link for a collection fragment', () => {
        const fragment = mockFragment(COLLECTION_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'description');
        expect(result).to.not.be.null;
        expect(result.href).to.include('content-type=merch-card-collection');
        expect(result.href).to.include('field=description');
    });

    it('sanitizes alias from special characters', () => {
        const fragment = mockFragment(CARD_MODEL_PATH);
        const result = generateFieldLink(fragment, '/acom', 'cardTitle');
        // alias should only contain lowercase alphanumeric and hyphens
        const alias = result.displayText.split(' → ')[0];
        expect(alias).to.match(/^[a-z0-9-]+$/);
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

    it('truncates long values with ellipsis', () => {
        const longText = 'A'.repeat(80);
        const result = previewValue([longText]);
        expect(result.length).to.equal(60);
        expect(result.endsWith('...')).to.be.true;
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
