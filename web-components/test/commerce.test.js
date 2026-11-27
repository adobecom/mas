import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import * as commerce from '../dist/commerce.js';
import '../dist/merch-card.js';

describe('commerce exports', () => {
    it('exposes the shared helpers required by merch cards', () => {
        for (const name of [
            'createTag',
            'getHeadlessCtaVariant',
            'getService',
            'hydrateHeadlessCta',
            'printMeasure',
            'createMasElement',
            'toPromotionCodes',
            'UptLink',
            'extractBackgroundUrl',
            'rewriteImageUrlsForProd',
            'sanitizePictureMarkup',
            'hostOsi',
            'applyContextPromotionCode',
            'applyDisplayAnnualDefault',
            'applyHideStPriceLabels',
            'mergePriceLiterals',
            'registerContextOptionsProviders',
        ]) {
            expect(commerce[name], name).to.not.equal(undefined);
        }
    });
});

describe('built commerce/card shared boundary', () => {
    let service;
    let card;

    beforeEach(async () => {
        service = document.createElement('mas-commerce-service');
        service.setAttribute('country', 'US');
        service.setAttribute('language', 'en');
        document.body.append(service);
        sinon.stub(service, 'collectCheckoutOptions').returns({
            wcsOsi: 'test-osi',
            country: 'US',
            language: 'en',
            env: 'PRODUCTION',
        });
        sinon
            .stub(service, 'resolveOfferSelectors')
            .returns([Promise.resolve([{ offerId: 'OFFER1' }])]);
        Object.defineProperty(service, 'imsCountryPromise', {
            value: Promise.resolve('US'),
        });
        card = document.createElement('merch-card');
        card.setAttribute('variant', 'mini');
        document.body.append(card);
        await card.updateComplete;
    });

    afterEach(() => {
        card.remove();
        service.remove();
        commerce.Log.reset();
        sinon.restore();
    });

    it('hydrates a card terms link using the registered commerce constructor', async () => {
        await card.handleAemFragmentEvents({
            type: 'aem:load',
            target: { nodeName: 'AEM-FRAGMENT' },
            detail: {
                id: 'shared-commerce-card',
                fields: {
                    variant: 'mini',
                    osi: 'test-osi',
                    cardTitle: 'Shared helpers',
                    description: '<a class="upt-link" href="#">See terms</a>',
                },
            },
        });
        const terms = card.querySelector('a[is="upt-link"]');
        expect(terms).to.exist;
        expect(terms.constructor).to.equal(customElements.get('upt-link'));
        await terms.render();
        expect(terms.href).to.equal(
            'https://www.adobe.com/offers/promo-terms.html?locale=en_US&country=US&offer_id=OFFER1',
        );
        expect(card.querySelector('a.upt-link')).not.to.exist;
        const commerceRequests = performance
            .getEntriesByType('resource')
            .filter(({ name }) =>
                new URL(name).pathname.endsWith('/dist/commerce.js'),
            );
        expect(commerceRequests).to.have.length(1);
    });

    it('routes card diagnostics to the commerce logging appender', async () => {
        const append = sinon.spy();
        commerce.Log.use({ append });
        await card.handleAemFragmentEvents({ type: 'aem:error' });
        expect(append.called).to.be.true;
        expect(append.lastCall.args[0].message).to.include(
            'AEM fragment cannot be loaded',
        );
    });
});
