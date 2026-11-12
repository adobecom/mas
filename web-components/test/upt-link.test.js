import { getPromoTermsUrl } from '../src/promo-terms.js';
import { UptLink } from '../src/upt-link.js';
import '../src/commerce.js';
import { MasError } from '../src/mas-error.js';
import { mockFetch } from './mocks/fetch.js';
import { mockLana, unmockLana } from './mocks/lana.js';
import { withWcs } from './mocks/wcs.js';
import {
    expect,
    sinon,
    initMasCommerceService,
    removeMasCommerceService,
} from './utilities.js';
import { delay } from './utils.js';

describe('function "getPromoTermsUrl"', () => {
    const offer = { language: 'en', country: 'US', offerId: 'OFFER1' };
    const query = 'locale=en_US&country=US&offer_id=OFFER1';

    for (const [label, options, url] of [
        [
            'points production at www.adobe.com',
            { env: 'PRODUCTION' },
            `https://www.adobe.com/offers/promo-terms.html?${query}`,
        ],
        [
            'points other environments at www.stage.adobe.com',
            { env: 'STAGE' },
            `https://www.stage.adobe.com/offers/promo-terms.html?${query}`,
        ],
        [
            'adds an encoded promotion code',
            { env: 'PRODUCTION', promotionCode: 'PROMO 1&2' },
            `https://www.adobe.com/offers/promo-terms.html?${query}&promotion_code=PROMO%201%262`,
        ],
        [
            'omits an empty promotion code',
            { env: 'PRODUCTION', promotionCode: null },
            `https://www.adobe.com/offers/promo-terms.html?${query}`,
        ],
    ]) {
        it(label, () => {
            expect(getPromoTermsUrl({ ...offer, ...options })).to.equal(url);
        });
    }
});

describe('class "UptLink"', () => {
    let uptLink;

    beforeEach(async () => {
        await mockFetch(withWcs);
        mockLana();
        initMasCommerceService();
        const placeholder = document.createElement('a');
        placeholder.className = 'upt-link';
        placeholder.textContent = 'See terms';
        uptLink = UptLink.createFrom(placeholder);
    });

    afterEach(() => {
        uptLink.remove();
        removeMasCommerceService();
        unmockLana();
        sinon.restore();
    });

    it('does not request offers without an OSI', async () => {
        document.body.append(uptLink);
        await delay(10);
        expect(uptLink.hasAttribute('href')).to.be.false;
        expect(uptLink.classList.contains('placeholder-failed')).to.be.false;
    });

    it('keeps the cause of an offer resolution failure', async () => {
        uptLink.initializeWcsData('xyz');
        document.body.append(uptLink);
        const error = await uptLink.onceSettled().catch((reason) => reason);
        expect(error.message).to.equal(
            'Could not resolve offer selectors for id: xyz.',
        );
        expect(error.cause).to.be.instanceOf(MasError);
    });

    it('does not render again for the IMS country it sets', async () => {
        Object.defineProperty(document, 'cookie', {
            configurable: true,
            get: () => 'ims_country_code=CH',
        });
        try {
            const render = sinon.spy(uptLink, 'render');
            uptLink.initializeWcsData('abm');
            document.body.append(uptLink);
            await uptLink.onceSettled();
            await delay(10);
            expect(uptLink.dataset.imsCountry).to.equal('CH');
            expect(uptLink.href).to.equal(
                'https://www.adobe.com/offers/promo-terms.html?locale=en_US&country=US&offer_id=632B3ADD940A7FBB7864AA5AD19B8D28',
            );
            expect(render.calledOnce).to.be.true;
        } finally {
            delete document.cookie;
        }
    });
});
