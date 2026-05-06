import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
    mapParameterName,
    addParameters,
    getHostName,
    setItemsParameter,
    buildCheckoutUrl,
    addParamsFromPageUrl,
    pathnameRequiresZhHantLang,
    applyPageLocaleToCheckoutUrl,
} from '../src/buildCheckoutUrl.js';
import {
    PROVIDER_ENVIRONMENT,
    CheckoutWorkflowStep,
} from '../src/constants.js';

describe('mapParameterName', () => {
    it('should return mapped name for known parameters', () => {
        expect(mapParameterName('country')).to.equal('co');
        expect(mapParameterName('language')).to.equal('lang');
    });

    it('should return same name for unknown parameters', () => {
        expect(mapParameterName('unknownParam')).to.equal('unknownParam');
    });
});

describe('addParameters', () => {
    it('should add allowed parameters with correct mapping', () => {
        const input = { country: 'US', language: 'en', unknown: 'value' };
        const result = new Map();
        const allowedKeys = new Set(['co', 'lang']);
        addParameters(input, result, allowedKeys);

        expect(result.get('co')).to.equal('US');
        expect(result.get('lang')).to.equal('en');
        expect(result.has('unknown')).to.be.false;
    });
});

describe('getHostName', () => {
    it('should return production URL for production environment', () => {
        expect(getHostName(PROVIDER_ENVIRONMENT.PRODUCTION)).to.equal(
            'https://commerce.adobe.com',
        );
    });

    it('should return staging URL for non-production environments', () => {
        expect(getHostName('staging')).to.equal(
            'https://commerce-stg.adobe.com',
        );
    });
});

describe('setItemsParameter', () => {
    it('should map and set item parameters correctly', () => {
        const items = [{ countrySpecific: 'yes', quantity: 2 }];
        const parameters = new Map();
        setItemsParameter(items, parameters);

        expect(parameters.get('items[0][cs]')).to.equal('yes');
        expect(parameters.get('items[0][q]')).to.equal(2);
    });
});

describe('addParamsFromPageUrl', () => {
    let originalSearch;

    beforeEach(() => {
        originalSearch = window.location.search;
    });

    afterEach(() => {
        if (originalSearch) {
            window.history.replaceState(
                {},
                '',
                window.location.pathname + originalSearch,
            );
        } else {
            window.history.replaceState({}, '', window.location.pathname);
        }
    });

    it('should add allowed parameters from page URL to checkout URL', () => {
        window.history.replaceState(
            {},
            '',
            '?gid=123&gtoken=token&cohortid=c1&productname=photoshop&sdid=sd123&attimer=5&gcsrc=src&gcprog=prog&gcprogcat=cat&gcpagetype=type&mv=search&mv2=paidsearch',
        );
        const url = new URL(
            'https://commerce.adobe.com/store/checkout?cli=testClient&co=US',
        );
        addParamsFromPageUrl(url);
        expect(url.searchParams.get('gid')).to.equal('123');
        expect(url.searchParams.get('gtoken')).to.equal('token');
        expect(url.searchParams.get('cohortid')).to.equal('c1');
        expect(url.searchParams.get('productname')).to.equal('photoshop');
        expect(url.searchParams.get('sdid')).to.equal('sd123');
        expect(url.searchParams.get('attimer')).to.equal('5');
        expect(url.searchParams.get('gcsrc')).to.equal('src');
        expect(url.searchParams.get('gcprog')).to.equal('prog');
        expect(url.searchParams.get('gcprogcat')).to.equal('cat');
        expect(url.searchParams.get('gcpagetype')).to.equal('type');
        expect(url.searchParams.get('cli')).to.equal('testClient');
        expect(url.searchParams.get('co')).to.equal('US');
        expect(url.searchParams.get('mv')).to.equal('search');
        expect(url.searchParams.get('mv2')).to.equal('paidsearch');
    });

    it('should add allowed parameters with empty value as well', () => {
        window.history.replaceState(
            {},
            '',
            '?gid=&gtoken=&cohortid=&productname=&sdid=&attimer=&gcsrc=&gcprog=&gcprogcat=&gcpagetype=&mv=&mv2=',
        );
        const url = new URL(
            'https://commerce.adobe.com/store/checkout?cli=testClient&co=US',
        );
        addParamsFromPageUrl(url);
        expect(url.searchParams.get('gid')).to.equal('');
        expect(url.searchParams.get('gtoken')).to.equal('');
        expect(url.searchParams.get('cohortid')).to.equal('');
        expect(url.searchParams.get('productname')).to.equal('');
        expect(url.searchParams.get('sdid')).to.equal('');
        expect(url.searchParams.get('attimer')).to.equal('');
        expect(url.searchParams.get('gcsrc')).to.equal('');
        expect(url.searchParams.get('gcprog')).to.equal('');
        expect(url.searchParams.get('gcprogcat')).to.equal('');
        expect(url.searchParams.get('gcpagetype')).to.equal('');
        expect(url.searchParams.get('cli')).to.equal('testClient');
        expect(url.searchParams.get('co')).to.equal('US');
        expect(url.searchParams.get('mv')).to.equal('');
        expect(url.searchParams.get('mv2')).to.equal('');
    });

    it('should not add parameters that are not in the allowed list', () => {
        window.history.replaceState(
            {},
            '',
            '?gid=12345&notAllowed=value&anotherBad=test',
        );

        const url = new URL('https://commerce.adobe.com/store/checkout');
        addParamsFromPageUrl(url);

        expect(url.searchParams.get('gid')).to.equal('12345');
        expect(url.searchParams.has('notAllowed')).to.be.false;
        expect(url.searchParams.has('anotherBad')).to.be.false;
    });

    it('should handle empty page URL search params', () => {
        window.history.replaceState({}, '', window.location.pathname);
        const url = new URL('https://commerce.adobe.com/store/checkout');
        addParamsFromPageUrl(url);
        expect(url.search).to.equal('');
    });
});

describe('pathnameRequiresZhHantLang', () => {
    it('is true for Taiwan and Hong Kong (zh) locale paths', () => {
        expect(pathnameRequiresZhHantLang('/tw/products/photoshop.html')).to.be
            .true;
        expect(pathnameRequiresZhHantLang('/hk_zh/products/photoshop.html')).to
            .be.true;
        expect(pathnameRequiresZhHantLang('/tw/photoshop.html')).to.be.true;
    });

    it('is false for other paths', () => {
        expect(pathnameRequiresZhHantLang('/prefix/tw/products/photoshop.html'))
            .to.be.false;
        expect(pathnameRequiresZhHantLang('/us/products/photoshop.html')).to.be
            .false;
    });

    it('treats nullish pathname as empty', () => {
        expect(pathnameRequiresZhHantLang(null)).to.be.false;
        expect(pathnameRequiresZhHantLang(undefined)).to.be.false;
    });
});

describe('applyPageLocaleToCheckoutUrl', () => {
    let savedUrl;
    let parentStub;

    beforeEach(() => {
        savedUrl =
            window.location.pathname +
            (window.location.search || '') +
            (window.location.hash || '');
    });

    afterEach(() => {
        window.history.replaceState({}, '', savedUrl);
        parentStub?.restore();
        parentStub = undefined;
    });

    it('leaves href unchanged when page is not TW or hk_zh', () => {
        window.history.replaceState({}, '', '/us/products/foo.html');
        const href =
            'https://commerce.adobe.com/store/commitment?lang=en&cli=a&co=US';
        expect(applyPageLocaleToCheckoutUrl(href)).to.equal(href);
    });

    it('returns URL.toString() when page is not TW and input is URL', () => {
        window.history.replaceState({}, '', '/fr/products/foo.html');
        const commerceUrl = new URL(
            'https://commerce.adobe.com/store/commitment?lang=fr',
        );
        expect(applyPageLocaleToCheckoutUrl(commerceUrl)).to.equal(
            commerceUrl.toString(),
        );
    });

    it('sets lang and items[n][lang] to zh-Hant on /tw/ pages', () => {
        window.history.replaceState({}, '', '/tw/products/photoshop.html');
        const href =
            'https://commerce.adobe.com/store/commitment?lang=en&items%5B0%5D%5Blang%5D=ja&items%5B1%5D%5Blang%5D=de';
        const out = new URL(applyPageLocaleToCheckoutUrl(href));
        expect(out.searchParams.get('lang')).to.equal('zh-Hant');
        expect(out.searchParams.get('items[0][lang]')).to.equal('zh-Hant');
        expect(out.searchParams.get('items[1][lang]')).to.equal('zh-Hant');
    });

    it('sets zh-Hant when input is URL on hk_zh pages', () => {
        window.history.replaceState({}, '', '/hk_zh/products/photoshop.html');
        const commerceUrl = new URL(
            'https://commerce.adobe.com/store/commitment?lang=en',
        );
        const out = new URL(applyPageLocaleToCheckoutUrl(commerceUrl));
        expect(out.searchParams.get('lang')).to.equal('zh-Hant');
    });

    it('returns original string when URL is invalid on TW pages', () => {
        window.history.replaceState({}, '', '/tw/products/photoshop.html');
        expect(applyPageLocaleToCheckoutUrl('not-a-valid-url')).to.equal(
            'not-a-valid-url',
        );
    });

    it('uses same-origin parent pathname for locale when parent differs', () => {
        window.history.replaceState({}, '', '/libs/merch-embed');
        parentStub = sinon.stub(window, 'parent').value({
            location: { pathname: '/tw/products/photoshop.html' },
        });
        const href = 'https://commerce.adobe.com/store/commitment?lang=en';
        const out = new URL(applyPageLocaleToCheckoutUrl(href));
        expect(out.searchParams.get('lang')).to.equal('zh-Hant');
    });

    it('ignores cross-origin errors when reading parent pathname', () => {
        window.history.replaceState({}, '', '/us/products/x.html');
        parentStub = sinon.stub(window, 'parent').value({
            get location() {
                throw new DOMException('Blocked', 'SecurityError');
            },
        });
        const href = 'https://commerce.adobe.com/store/commitment?lang=en';
        expect(applyPageLocaleToCheckoutUrl(href)).to.equal(href);
    });

    it('buildCheckoutUrl applies page locale for TW paths', () => {
        window.history.replaceState({}, '', '/tw/products/photoshop.html');
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.COMMITMENT,
            clientId: 'testClient',
            country: 'US',
            lang: 'en',
            items: [{ quantity: 1, language: 'en' }],
        };
        const url = buildCheckoutUrl(checkoutData);
        expect(new URL(url).searchParams.get('lang')).to.equal('zh-Hant');
        expect(new URL(url).searchParams.get('items[0][lang]')).to.equal(
            'zh-Hant',
        );
    });
});

describe('buildCheckoutUrl', () => {
    it('should construct a valid checkout URL', () => {
        const validateStub = sinon.stub().returns(true);
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.COMMITMENT,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1, language: 'en' }],
        };
        const url = buildCheckoutUrl(checkoutData);
        expect(url).to.equal(
            'https://commerce.adobe.com/store/commitment?items%5B0%5D%5Bq%5D=1&items%5B0%5D%5Blang%5D=en&cli=testClient&co=US',
        );
        sinon.restore();
    });

    it('should throw an error if required fields are missing', () => {
        expect(() =>
            buildCheckoutUrl({ workflowStep: CheckoutWorkflowStep.CHECKOUT }),
        ).to.throw();
    });

    it('should set correct parameters for CRM modal type', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
            modal: 'crm',
            is3in1: true,
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('af')).to.equal(
            'uc_new_user_iframe,uc_new_system_close',
        );
        expect(parsedUrl.searchParams.get('cli')).to.equal('creative');
    });

    it('should set correct parameters for TWP modal type', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
            modal: 'twp',
            is3in1: true,
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('af')).to.equal(
            'uc_new_user_iframe,uc_new_system_close',
        );
        expect(parsedUrl.searchParams.get('cli')).to.equal('mini_plans');
    });

    it('should set correct parameters for D2P modal type', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
            modal: 'd2p',
            is3in1: true,
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('af')).to.equal(
            'uc_new_user_iframe,uc_new_system_close',
        );
        expect(parsedUrl.searchParams.get('cli')).to.equal('mini_plans');
    });

    it('should set market segment for EDU individual customer', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
            modal: 'twp',
            is3in1: true,
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('ms')).to.equal('EDU');
    });

    it('should set customer segment for COM team customer', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            customerSegment: 'TEAM',
            marketSegment: 'COM',
            modal: 'twp',
            is3in1: true,
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('cs')).to.equal('TEAM');
    });

    it('should handle addon product arrangement code for 3-in-1 modal', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }, { productArrangementCode: 'ADDON123' }],
            modal: 'twp',
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
            is3in1: true,
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('ao')).to.equal('ADDON123');
    });

    it('should not set 3in1 parameters when 3in1 is disabled', () => {
        const meta = document.createElement('meta');
        meta.name = 'mas-ff-3in1';
        meta.content = 'off';
        document.head.appendChild(meta);

        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            modal: 'twp',
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
            is3in1: false,
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);

        expect(parsedUrl.searchParams.has('rtc')).to.be.false;
        expect(parsedUrl.searchParams.has('lo')).to.be.false;

        document.head.removeChild(meta);
    });

    it('should not modify clientId if doc_cloud for 3-in-1 modal', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'doc_cloud',
            country: 'US',
            items: [{ quantity: 1 }],
            modal: 'twp',
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
            is3in1: true,
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('cli')).to.equal('doc_cloud');
    });

    it('should not add 3-in-1 parameters for non-3-in-1 modal types', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            modal: 'other',
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.has('rtc')).to.be.false;
        expect(parsedUrl.searchParams.has('lo')).to.be.false;
    });

    it('should handle segmentation workflow step without items', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            marketSegment: 'EDU',
            offerType: 'SUBSCRIPTION',
            productArrangementCode: 'PAC123',
        };
        expect(() => buildCheckoutUrl(checkoutData)).to.not.throw();
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.pathname).to.include('/store/segmentation');
        expect(parsedUrl.searchParams.get('ms')).to.equal('EDU');
        expect(parsedUrl.searchParams.get('ot')).to.equal('SUBSCRIPTION');
        expect(parsedUrl.searchParams.get('pa')).to.equal('PAC123');
    });

    it('should handle quantity parameter for 3-in-1 modal when quantity > 1', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 2 }],
            modal: 'twp',
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('q')).to.equal('2');
    });

    it('should handle addon product arrangement code when root pa is provided', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            productArrangementCode: 'MAIN123',
            items: [
                { productArrangementCode: 'MAIN123' },
                { productArrangementCode: 'ADDON123' },
            ],
            modal: 'twp',
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('pa')).to.equal('MAIN123');
        expect(parsedUrl.searchParams.get('ao')).to.equal('ADDON123');
    });

    it('should remove the ot parameter when it is PROMOTION', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            modal: 'twp',
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
            ot: 'PROMOTION',
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.has('ot')).to.be.false;
    });

    it('should add af parameter when landscape is DRAFT', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            landscape: 'DRAFT',
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('af')).to.equal('p_draft_landscape');
    });

    it('should set af parameter with 3-in-1 values when landscape is not defined', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            modal: 'twp',
            is3in1: true,
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('af')).to.equal(
            'uc_new_user_iframe,uc_new_system_close',
        );
    });

    it('should append 3-in-1 af values to existing draft landscape af parameter', () => {
        const checkoutData = {
            env: PROVIDER_ENVIRONMENT.PRODUCTION,
            workflowStep: CheckoutWorkflowStep.SEGMENTATION,
            clientId: 'testClient',
            country: 'US',
            items: [{ quantity: 1 }],
            landscape: 'DRAFT',
            modal: 'twp',
            is3in1: true,
            customerSegment: 'INDIVIDUAL',
            marketSegment: 'EDU',
        };
        const url = buildCheckoutUrl(checkoutData);
        const parsedUrl = new URL(url);
        expect(parsedUrl.searchParams.get('af')).to.equal(
            'p_draft_landscape,uc_new_user_iframe,uc_new_system_close',
        );
    });
});
