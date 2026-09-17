import { expect } from '@esm-bundle/chai';
import { isSupportedImageUrl, buildPictureHtml, extractImageUrl } from '../../src/editors/image-url.js';

const AEM_PAGE_PNG =
    'https://main--da-cc--adobecom.aem.page/cc-shared/fragments/products/photoshop/product-page/media_10771c912534e207f3d12db51da70b851df26ac21.png';
const AEM_PAGE_JPG = 'https://main--cc--adobecom.aem.page/fragments/media_abc.jpg';
const AEM_PAGE_WITH_QUERY = 'https://main--cc--adobecom.aem.page/fragments/media_xyz.png?rev=3';

function parse(html) {
    return new DOMParser().parseFromString(`<picture>${html}</picture>`, 'text/html');
}

describe('isSupportedImageUrl', () => {
    it('accepts an absolute *.aem.page URL', () => {
        expect(isSupportedImageUrl(AEM_PAGE_PNG)).to.be.true;
    });

    it('rejects a non-aem.page host', () => {
        expect(isSupportedImageUrl('https://example.com/media_x.png')).to.be.false;
    });

    it('rejects a relative URL', () => {
        expect(isSupportedImageUrl('./media_x.png')).to.be.false;
    });

    it('rejects an empty value', () => {
        expect(isSupportedImageUrl('')).to.be.false;
    });

    it('rejects the bare aem.page apex (must be a subdomain)', () => {
        expect(isSupportedImageUrl('https://aem.page/media_x.png')).to.be.false;
    });
});

describe('buildPictureHtml', () => {
    it('returns empty string for an unsupported URL', () => {
        expect(buildPictureHtml('https://example.com/x.png')).to.equal('');
    });

    it('emits two webp sources plus original-format source and img for png', () => {
        const doc = parse(buildPictureHtml(AEM_PAGE_PNG));
        const sources = [...doc.querySelectorAll('source')];
        const img = doc.querySelector('img');
        expect(sources).to.have.lengthOf(3);

        expect(sources[0].getAttribute('type')).to.equal('image/webp');
        expect(sources[0].getAttribute('srcset')).to.equal(`${AEM_PAGE_PNG}?width=2000&format=webply&optimize=medium`);
        expect(sources[0].getAttribute('media')).to.equal('(min-width: 600px)');

        expect(sources[1].getAttribute('type')).to.equal('image/webp');
        expect(sources[1].getAttribute('srcset')).to.equal(`${AEM_PAGE_PNG}?width=750&format=webply&optimize=medium`);
        expect(sources[1].hasAttribute('media')).to.be.false;

        expect(sources[2].getAttribute('type')).to.equal('image/png');
        expect(sources[2].getAttribute('srcset')).to.equal(`${AEM_PAGE_PNG}?width=2000&format=png&optimize=medium`);
        expect(sources[2].getAttribute('media')).to.equal('(min-width: 600px)');

        expect(img.getAttribute('loading')).to.equal('lazy');
        expect(img.getAttribute('alt')).to.equal('');
        expect(img.getAttribute('src')).to.equal(`${AEM_PAGE_PNG}?width=750&format=png&optimize=medium`);
    });

    it('maps jpg to image/jpeg source type', () => {
        const doc = parse(buildPictureHtml(AEM_PAGE_JPG));
        const original = [...doc.querySelectorAll('source')].at(-1);
        expect(original.getAttribute('type')).to.equal('image/jpeg');
        expect(original.getAttribute('srcset')).to.contain('format=jpg');
    });
});

describe('buildPictureHtml - attribute injection safety', () => {
    it('does not let a quote in an otherwise-valid-hostname URL break out of the srcset/src attribute', () => {
        const malicious = 'https://main--da-cc--adobecom.aem.page/a.png" onerror="alert(1)';
        const doc = parse(buildPictureHtml(malicious));
        expect(doc.querySelector('[onerror]')).to.not.exist;
    });
});

describe('extractImageUrl', () => {
    it('round-trips the base URL out of generated HTML', () => {
        expect(extractImageUrl(buildPictureHtml(AEM_PAGE_PNG))).to.equal(AEM_PAGE_PNG);
    });

    it('returns empty string for empty input', () => {
        expect(extractImageUrl('')).to.equal('');
    });

    it('round-trips a URL that already had its own query string', () => {
        expect(extractImageUrl(buildPictureHtml(AEM_PAGE_WITH_QUERY))).to.equal(AEM_PAGE_WITH_QUERY);
    });
});

describe('rendition - URLs that already carry a query string', () => {
    it('merges the rendition params into the existing query instead of appending a second "?"', () => {
        const doc = parse(buildPictureHtml(AEM_PAGE_WITH_QUERY));
        const img = doc.querySelector('img');
        const src = img.getAttribute('src');
        expect(src.split('?').length - 1).to.equal(1);
        expect(src).to.contain('rev=3');
        expect(src).to.contain('width=750');
    });
});
