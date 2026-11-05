import { expect } from '@esm-bundle/chai';
import { pasteTextFromClipboardHtml } from '../../src/utils/chat-paste.js';

const HREF =
    'https://mas.adobe.com/studio.html#content-type=merch-card&page=content&query=dcb58302-f2dc-4f33-a501-9375fe4ec0bb';

describe('pasteTextFromClipboardHtml', () => {
    it('returns the href when the clipboard is a single rich link', () => {
        const html = `<a href="${HREF}">merch-card: SANDBOX / Mini Compare Chart Mweb : Creative Cloud Pro for test</a>`;
        expect(pasteTextFromClipboardHtml(html)).to.equal(HREF);
    });

    it('substitutes hrefs for anchors while keeping surrounding text', () => {
        const html = `please publish <a href="${HREF}">this card</a> today`;
        expect(pasteTextFromClipboardHtml(html)).to.equal(`please publish ${HREF} today`);
    });

    it('handles clipboard HTML wrapped in document boilerplate', () => {
        const html = `<html><body><!--StartFragment--><a href="${HREF}" target="_blank">label</a><!--EndFragment--></body></html>`;
        expect(pasteTextFromClipboardHtml(html)).to.equal(HREF);
    });

    it('returns null when the HTML has no anchors', () => {
        expect(pasteTextFromClipboardHtml('<p>just <b>text</b></p>')).to.equal(null);
        expect(pasteTextFromClipboardHtml('plain words')).to.equal(null);
    });

    it('returns null for empty or non-string input', () => {
        expect(pasteTextFromClipboardHtml('')).to.equal(null);
        expect(pasteTextFromClipboardHtml(null)).to.equal(null);
        expect(pasteTextFromClipboardHtml(undefined)).to.equal(null);
    });

    it('ignores anchors without an http href', () => {
        expect(pasteTextFromClipboardHtml('<a href="javascript:alert(1)">x</a>')).to.equal(null);
    });
});
