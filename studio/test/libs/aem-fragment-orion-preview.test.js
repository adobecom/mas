import { expect, initMasCommerceService, removeMasCommerceService } from '../../../web-components/test/utilities.js';
import sinon from 'sinon';
import { clearCaches } from '../../libs/fragment-client.js';
import { resetCache } from '../../../io/www/src/fragment/utils/configuration.js';
import '../../../web-components/src/mas-commerce-service.js';
import '../../../web-components/src/aem-fragment.js';

describe('Orion fragment preview pipeline', () => {
    const fragmentId = 'orion-preview-fragment';
    const osi = 'test-osi';
    const cacheKey = `${osi}-gb`;
    const AemFragment = customElements.get('aem-fragment');
    let service;
    let fragment;
    let sandbox;
    let href;
    let storage;
    let enableBaselines;

    beforeEach(() => {
        href = window.location.href;
        storage = Object.entries(localStorage);
        localStorage.clear();
        clearCaches();
        resetCache();
        AemFragment.cache.clear();
        enableBaselines = true;
        const url = new URL(href);
        url.search = '?commerce.env=stage&mas.orion=on&mas.preview=on';
        window.history.replaceState({}, '', url);
        service = initMasCommerceService({
            'allow-override': 'true',
            locale: 'en_GB',
        });
        sandbox = sinon.createSandbox();
        sandbox
            .stub(AemFragment.prototype, 'getFragmentClientUrl')
            .returns(new URL('../../libs/fragment-client.js', import.meta.url).href);
        sandbox.stub(window, 'fetch').callsFake(async (input) => {
            const url = new URL(input);
            if (url.pathname.includes('web_commerce_artifact')) {
                const latest = url.searchParams.get('serveLatest') === 'true';
                return new Response(
                    JSON.stringify({
                        resolvedOffers: ['EN', 'MULT'].map((language) => ({
                            offerId: `${latest ? 'orion' : 'legacy'}-${language}`,
                            offerSelectorIds: [osi],
                            productArrangementCode: 'test-pa',
                            marketSegments: ['COM'],
                            language,
                            priceDetails: { price: latest ? 25 : 21.98 },
                        })),
                    }),
                );
            }
            if (url.pathname.endsWith(`/${fragmentId}`)) {
                return new Response(
                    JSON.stringify({
                        id: fragmentId,
                        path: '/content/dam/mas/nala/en_GB/orion-preview',
                        fields: {
                            variant: 'plans',
                            osi,
                            enableBaselines,
                            prices: `<span is="inline-price" data-template="price" data-wcs-osi="${osi}"></span>`,
                        },
                        references: {},
                        referencesTree: [],
                    }),
                );
            }
            if (url.searchParams.has('limit')) {
                return new Response(JSON.stringify({ items: [] }));
            }
            if (url.pathname.endsWith('/offers')) {
                return new Response('{}');
            }
            return new Response('Not Found', { status: 404 });
        });
    });

    afterEach(() => {
        fragment?.remove();
        removeMasCommerceService();
        sandbox.restore();
        AemFragment.cache.clear();
        clearCaches();
        resetCache();
        localStorage.clear();
        for (const [key, value] of storage) localStorage.setItem(key, value);
        window.history.replaceState({}, '', href);
    });

    const load = async () => {
        fragment = document.createElement('aem-fragment');
        fragment.setAttribute('fragment', fragmentId);
        document.body.append(fragment);
        await fragment.updateComplete;
    };

    const wcsRequests = () =>
        window.fetch
            .getCalls()
            .map(({ args: [input] }) => new URL(input))
            .filter(({ pathname }) => pathname.includes('web_commerce_artifact'));

    it('uses latest offers for the early preview WCS lookup and reuses them as latest prefill', async () => {
        await load();

        expect(wcsRequests()).to.have.lengthOf(1);
        expect(wcsRequests()[0].searchParams.get('serveLatest')).to.equal('true');
        expect(fragment.rawData.wcs).not.to.have.property('stage');
        expect(fragment.rawData.wcs['stage-latest'][cacheKey].map(({ offerId }) => offerId)).to.deep.equal([
            'orion-EN',
            'orion-MULT',
        ]);
        const [offers] = await Promise.all(service.resolveOfferSelectors({ country: 'GB', language: 'en', wcsOsi: [osi] }));
        expect(offers.map(({ offerId }) => offerId)).to.deep.equal(['orion-EN', 'orion-MULT']);
        expect(wcsRequests()).to.have.lengthOf(1);
        expect(localStorage.getItem(`req-${fragmentId}-en_GB-latest`)).not.to.equal(null);
    });

    it('uses latest offers for final preview WCS requests without an early baseline lookup', async () => {
        enableBaselines = false;

        await load();

        expect(wcsRequests()).to.have.lengthOf(1);
        expect(wcsRequests()[0].searchParams.get('serveLatest')).to.equal('true');
        expect(fragment.rawData.wcs['stage-latest'][cacheKey][0].offerId).to.equal('orion-EN');
    });

    it('does not cache a preview under Orion when production becomes active during module loading', async () => {
        const loading = load();
        const url = new URL(window.location.href);
        url.searchParams.set('commerce.env', 'prod');
        window.history.replaceState({}, '', url);
        service.activate();

        await loading;

        expect(AemFragment.cache.has(`${fragmentId}-orion`)).to.be.false;
        expect(fragment.rawData.wcs).not.to.have.property('stage-latest');
        expect(fragment.rawData.wcs.prod[cacheKey][0].offerId).to.equal('legacy-EN');
    });

    for (const env of ['stage', 'prod']) {
        it(`omits the latest flag and prefill namespace for normal ${env} preview`, async () => {
            const url = new URL(href);
            url.search = `?commerce.env=${env}&mas.orion=${env === 'prod' ? 'on' : 'off'}&mas.preview=on`;
            window.history.replaceState({}, '', url);
            service.activate();
            await load();

            expect(wcsRequests()).to.have.lengthOf(1);
            expect(wcsRequests()[0].searchParams.has('serveLatest')).to.be.false;
            expect(fragment.rawData.wcs).not.to.have.property('stage-latest');
            expect(fragment.rawData.wcs[env][cacheKey][0].offerId).to.equal('legacy-EN');
        });
    }

    for (const firstMode of ['on', 'off']) {
        it(`keeps preview options isolated when Orion ${firstMode} changes during module loading`, async () => {
            const url = new URL(href);
            url.search = `?commerce.env=stage&mas.orion=${firstMode}&mas.preview=on`;
            window.history.replaceState({}, '', url);
            service.activate();
            const loading = load();

            url.searchParams.set('mas.orion', firstMode === 'on' ? 'off' : 'on');
            window.history.replaceState({}, '', url);
            service.activate();
            const prefill = sandbox.spy(service, 'prefillWcsCache');
            await loading;

            expect(wcsRequests().map(({ searchParams }) => searchParams.has('serveLatest'))).to.deep.equal([
                firstMode === 'on',
                firstMode !== 'on',
            ]);
            expect(prefill.calledOnce).to.be.true;
            const namespace = firstMode === 'on' ? 'stage' : 'stage-latest';
            expect(prefill.firstCall.args[0][namespace][cacheKey][0].offerId).to.equal(
                firstMode === 'on' ? 'legacy-EN' : 'orion-EN',
            );
        });
    }
});
