import { expect } from '@esm-bundle/chai';
import { aemPageToProd, rewriteImageUrlsForProd } from '../src/image-markup.js';

const AEM =
    'https://main--da-cc--adobecom.aem.page/cc-shared/fragments/media_1.png';
const INNER =
    `<source type="image/webp" srcset="${AEM}?width=2000&format=webply&optimize=medium" media="(min-width: 600px)">` +
    `<source type="image/webp" srcset="${AEM}?width=750&format=webply&optimize=medium">` +
    `<img loading="lazy" alt="" src="${AEM}?width=750&format=png&optimize=medium">`;

const parse = (html) =>
    new DOMParser().parseFromString(`<picture>${html}</picture>`, 'text/html');

describe('aemPageToProd', () => {
    it('rewrites an aem.page URL to the prod origin, keeping path + query', () => {
        expect(
            aemPageToProd(
                `${AEM}?width=750&format=png`,
                'https://www.adobe.com',
            ),
        ).to.equal(
            'https://www.adobe.com/cc-shared/fragments/media_1.png?width=750&format=png',
        );
    });

    it('returns null for a non-aem.page URL', () => {
        expect(
            aemPageToProd('https://example.com/x.png', 'https://www.adobe.com'),
        ).to.be.null;
    });

    it('returns null for empty input', () => {
        expect(aemPageToProd('', 'https://www.adobe.com')).to.be.null;
    });
});

describe('rewriteImageUrlsForProd', () => {
    it('leaves markup unchanged off prod', () => {
        expect(
            rewriteImageUrlsForProd(INNER, { hostname: 'localhost' }),
        ).to.equal(INNER);
    });

    it('leaves markup unchanged when location is absent (non-DOM runtime)', () => {
        expect(rewriteImageUrlsForProd(INNER, undefined)).to.equal(INNER);
    });

    it('rewrites *.aem.page origins to the prod origin on adobe.com', () => {
        const out = rewriteImageUrlsForProd(INNER, {
            hostname: 'www.adobe.com',
            origin: 'https://www.adobe.com',
        });
        const doc = parse(out);
        expect(doc.querySelector('img').getAttribute('src')).to.equal(
            'https://www.adobe.com/cc-shared/fragments/media_1.png?width=750&format=png&optimize=medium',
        );
        doc.querySelectorAll('source').forEach((s) => {
            expect(s.getAttribute('srcset')).to.contain(
                'https://www.adobe.com/',
            );
            expect(s.getAttribute('srcset')).to.not.contain('aem.page');
        });
    });

    it('returns inner markup without adding a <picture> wrapper', () => {
        const out = rewriteImageUrlsForProd(INNER, {
            hostname: 'www.adobe.com',
            origin: 'https://www.adobe.com',
        });
        expect(out).to.not.contain('<picture>');
    });
});
