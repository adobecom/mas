import { mockFetch } from './mocks/fetch.js';
import { mockLana, unmockLana } from './mocks/lana.js';
import { withWcs } from './mocks/wcs.js';
import {
    expect,
    initMasCommerceService,
    removeMasCommerceService,
} from './utilities.js';
import '../src/mas.js';

/**
 * @param {string} wcsOsi
 * @param {Record<string, any>} options
 * @returns {HTMLAnchorElement}
 */
function mockUptLink(wcsOsi, options = {}) {
    const element = document.createElement('a', { is: 'upt-link' });
    element.setAttribute('data-wcs-osi', wcsOsi);
    element.textContent = 'See terms';
    if (options.href) {
        element.setAttribute('href', options.href);
    } else {
        element.setAttribute('href', '#');
    }
    document.body.append(element);
    return element;
}

afterEach(() => {
    removeMasCommerceService();
    unmockLana();
});

beforeEach(async () => {
    await mockFetch(withWcs);
    mockLana();
});

describe('class "UptLink"', () => {
    it('auto-generates href when href="#"', async () => {
        initMasCommerceService();
        const uptLink = mockUptLink('abm');
        await uptLink.onceSettled();
        expect(uptLink.href).to.include(
            'https://www.adobe.com/offers/promo-terms.html',
        );
        expect(uptLink.href).to.include('locale=en_US');
        expect(uptLink.href).to.include('country=US');
        expect(uptLink.href).to.include('offer_id=');
    });

    it('preserves custom href when valid URL is provided', async () => {
        initMasCommerceService();
        const customUrl = 'https://www.example.com/custom-terms';
        const uptLink = mockUptLink('abm', { href: customUrl });
        await uptLink.onceSettled();
        expect(uptLink.href).to.equal(customUrl);
    });
});
