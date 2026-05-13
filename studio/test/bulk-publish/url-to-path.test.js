import { expect } from '@open-wc/testing';
import { parseStudioUrl } from '../../src/bulk-publish/url-to-path.js';

describe('parseStudioUrl', () => {
    it('extracts fragmentId from the hash query param', () => {
        const url =
            'https://mas.adobe.com/studio.html#content-type=merch-card&page=content&path=sandbox&query=9a75e22f-9c48-418d-8da3-687e8f635282';
        expect(parseStudioUrl(url)).to.deep.equal({
            fragmentId: '9a75e22f-9c48-418d-8da3-687e8f635282',
        });
    });

    it('returns null for non-Studio URLs', () => {
        expect(parseStudioUrl('https://example.com')).to.be.null;
    });

    it('returns null when the query param is missing', () => {
        expect(parseStudioUrl('https://mas.adobe.com/studio.html#page=content')).to.be.null;
    });

    it('returns null for non-UUID query values', () => {
        expect(parseStudioUrl('https://mas.adobe.com/studio.html#query=not-a-uuid')).to.be.null;
    });

    it('trims surrounding whitespace', () => {
        const url = '  https://mas.adobe.com/studio.html#query=9a75e22f-9c48-418d-8da3-687e8f635282  ';
        expect(parseStudioUrl(url)).to.deep.equal({
            fragmentId: '9a75e22f-9c48-418d-8da3-687e8f635282',
        });
    });

    it('returns null for empty/null input', () => {
        expect(parseStudioUrl('')).to.be.null;
        expect(parseStudioUrl(null)).to.be.null;
        expect(parseStudioUrl(undefined)).to.be.null;
    });
});
