import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { copyToClipboard, localeIconProvider } from '../src/utils.js';
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

describe('localeIconProvider', () => {
    it('should return country flag for valid locale tag path with country folder', () => {
        // Path structure: /content/cq:tags/mas/locale/{COUNTRY}/{lang_COUNTRY}
        const result = localeIconProvider('/content/cq:tags/mas/locale/AE/ar_AE');
        expect(result).to.equal('🇦🇪');
    });

    it('should return country flag for different locales with country folder', () => {
        expect(localeIconProvider('/content/cq:tags/mas/locale/FR/fr_FR')).to.equal('🇫🇷');
        expect(localeIconProvider('/content/cq:tags/mas/locale/DE/de_DE')).to.equal('🇩🇪');
        expect(localeIconProvider('/content/cq:tags/mas/locale/JP/ja_JP')).to.equal('🇯🇵');
        expect(localeIconProvider('/content/cq:tags/mas/locale/GB/en_GB')).to.equal('🇬🇧');
        expect(localeIconProvider('/content/cq:tags/mas/locale/US/en_US')).to.equal('🇺🇸');
    });

    it('should return country flag for flat locale paths (without country folder)', () => {
        // Also support flat structure: /content/cq:tags/mas/locale/{lang_COUNTRY}
        expect(localeIconProvider('/content/cq:tags/mas/locale/en_US')).to.equal('🇺🇸');
        expect(localeIconProvider('/content/cq:tags/mas/locale/fr_FR')).to.equal('🇫🇷');
    });

    it('should return null for paths without locale segment', () => {
        const result = localeIconProvider('/content/cq:tags/mas/product/photoshop');
        expect(result).to.be.null;
    });

    it('should return null for country folder paths (not the full locale path)', () => {
        // The country folder itself (e.g., /locale/AE) should return null
        const result = localeIconProvider('/content/cq:tags/mas/locale/AE');
        expect(result).to.be.null;
    });

    it('should return null for empty or invalid paths', () => {
        expect(localeIconProvider('')).to.be.null;
        expect(localeIconProvider(null)).to.be.null;
        expect(localeIconProvider(undefined)).to.be.null;
    });
});
