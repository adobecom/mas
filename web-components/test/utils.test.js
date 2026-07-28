import { expect } from './utilities.js';

const {
    paramsToHash,
    historyPushState,
    shouldHideStPriceLabels,
    getValidatedMasLibsUrl,
    isAllowedMasIOUrl,
} = await import('../src/utils.js');

describe('function "paramsToHash"', () => {
    it('Transfer query params to hash', () => {
        historyPushState('filter=photo&single_app=illustrator');
        paramsToHash(['filter', 'single_app']);
        expect(window.location.hash).to.equal(
            '#filter=photo&single_app=illustrator',
        );
    });

    it('Update existing hash from query params', () => {
        historyPushState('filter=3D&single_app=animate');
        paramsToHash(['filter', 'single_app']);
        expect(window.location.hash).to.equal('#filter=3D&single_app=animate');
    });
});

describe('function "shouldHideStPriceLabels"', () => {
    it('The simplest case', () => {
        const div = document.createElement('div');
        const elementST = document.createElement('span');
        div.append(elementST);
        elementST.setAttribute('data-template', 'strikethrough');
        const element = document.createElement('span');
        div.append(element);
        element.setAttribute('data-template', 'price');
        element.isInlinePrice = true;
        document.body.innerHTML = '';
        document.body.appendChild(div);
        expect(shouldHideStPriceLabels(document.querySelector('span'))).to.be
            .true;
    });
    it('With short text between prices', () => {
        const div = document.createElement('div');
        const elementST = document.createElement('span');
        div.append(elementST);
        const text = document.createTextNode('* ');
        div.append(text);
        elementST.setAttribute('data-template', 'strikethrough');
        const element = document.createElement('span');
        div.append(element);
        element.setAttribute('data-template', 'price');
        element.isInlinePrice = true;
        document.body.innerHTML = '';
        document.body.appendChild(div);
        expect(shouldHideStPriceLabels(document.querySelector('span'))).to.be
            .true;
    });
    it('With some element between prices', () => {
        const div = document.createElement('div');
        const elementST = document.createElement('span');
        div.appendChild(elementST);
        const el = document.createElement('i');
        el.isInlinePrice = false;
        div.appendChild(el);
        elementST.setAttribute('data-template', 'strikethrough');
        const element = document.createElement('span');
        div.appendChild(element);
        element.setAttribute('data-template', 'price');
        element.isInlinePrice = true;
        document.body.innerHTML = '';
        document.body.appendChild(div);
        expect(shouldHideStPriceLabels(document.querySelector('span'))).to.be
            .false;
    });
    it('Without promo price', () => {
        const div = document.createElement('div');
        const elementST = document.createElement('span');
        div.appendChild(elementST);
        const el = document.createElement('i');
        div.appendChild(el);
        elementST.setAttribute('data-template', 'strikethrough');
        document.body.innerHTML = '';
        document.body.appendChild(div);
        expect(!!shouldHideStPriceLabels(document.querySelector('span'))).to.be
            .false;
    });
});

describe('function "getValidatedMasLibsUrl"', () => {
    it('returns null when maslibs is missing or empty', () => {
        expect(getValidatedMasLibsUrl(null)).to.be.null;
        expect(getValidatedMasLibsUrl('')).to.be.null;
        expect(getValidatedMasLibsUrl('   ')).to.be.null;
    });

    it('resolves the local shortcut and the main branch', () => {
        expect(getValidatedMasLibsUrl('local')).to.equal(
            'http://localhost:3000',
        );
        expect(getValidatedMasLibsUrl('main')).to.equal(
            'https://main--mas--adobecom.aem.live',
        );
        expect(getValidatedMasLibsUrl(' MAIN ')).to.equal(
            'https://main--mas--adobecom.aem.live',
        );
    });

    it('resolves a simple branch against mas--adobecom', () => {
        expect(getValidatedMasLibsUrl('mwpw-202151')).to.equal(
            'https://mwpw-202151--mas--adobecom.aem.live',
        );
    });

    it('resolves a full branch--repo--owner triple', () => {
        expect(getValidatedMasLibsUrl('feature--other--repo')).to.equal(
            'https://feature--other--repo.aem.live',
        );
    });

    it('honors the page extension', () => {
        expect(getValidatedMasLibsUrl('mwpw-202151', 'page')).to.equal(
            'https://mwpw-202151--mas--adobecom.aem.page',
        );
        expect(getValidatedMasLibsUrl('main', 'page')).to.equal(
            'https://main--mas--adobecom.aem.page',
        );
    });

    it('rejects an unknown aem extension', () => {
        const extensions = ['evil.com', 'live.evil.com', 'page/', '', null];
        for (const extension of extensions) {
            expect(getValidatedMasLibsUrl('main', extension), String(extension))
                .to.be.null;
        }
    });

    it('rejects host-escape payloads', () => {
        const hostile = [
            'evil.com',
            'cdn.jsdelivr.net/gh/u/r@main--mas--aem',
            'evil.com#',
            'a--b@evil.com',
            'evil.com:8080/x--y',
            'javascript:alert(1)',
        ];
        for (const payload of hostile) {
            expect(getValidatedMasLibsUrl(payload), payload).to.be.null;
        }
    });

    it('rejects malformed branch shapes', () => {
        const malformed = ['a----b', '-a', 'a-', 'a--', 'a--b--c--d', 'a_b'];
        for (const payload of malformed) {
            expect(getValidatedMasLibsUrl(payload), payload).to.be.null;
        }
    });

    it('does not throw on invalid punycode labels', () => {
        const payloads = [
            'xn--abc',
            'xn--a',
            'xn--0',
            'xn--b--c',
            'xn--aa--bb',
        ];
        for (const payload of payloads) {
            expect(
                () => getValidatedMasLibsUrl(payload),
                payload,
            ).to.not.throw();
        }
    });

    it('rejects overlong values', () => {
        expect(getValidatedMasLibsUrl('a'.repeat(200))).to.be.null;
    });
});

describe('function "isAllowedMasIOUrl"', () => {
    it('accepts adobe, runtime, aem and localhost urls', () => {
        const allowed = [
            'https://www.adobe.com/mas/io',
            'https://www.stage.adobe.com/mas/io',
            'https://14257-merchatscale-axel.adobeioruntime.net/api/v1/web/MerchAtScale',
            'https://main--mas--adobecom.aem.live/mas/io',
            'https://main--mas--adobecom.aem.page/mas/io',
            'http://localhost:2023/mas/io',
            'http://127.0.0.1:3000/mas/io',
        ];
        for (const url of allowed) {
            expect(isAllowedMasIOUrl(url), url).to.be.true;
        }
    });

    it('rejects attacker-controlled urls', () => {
        const rejected = [
            'https://mycustomurl',
            'https://evil-adobe.com',
            'https://adobe.com.evil.io',
            'https://user:pass@adobe.com.evil.io',
            'https://evil.com/@adobe.com',
            'javascript:alert(1)',
            'not a url',
            '',
            undefined,
        ];
        for (const url of rejected) {
            expect(isAllowedMasIOUrl(url), url).to.be.false;
        }
    });

    it('rejects non-localhost http', () => {
        expect(isAllowedMasIOUrl('http://evil.com/mas/io')).to.be.false;
    });

    it('rejects non-http protocols on localhost', () => {
        const rejected = [
            'ftp://localhost/mas/io',
            'ws://localhost:2023/mas/io',
            'file://localhost/etc/passwd',
            'ftp://127.0.0.1/mas/io',
        ];
        for (const url of rejected) {
            expect(isAllowedMasIOUrl(url), url).to.be.false;
        }
    });
});
