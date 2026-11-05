import {
    expect,
    initMasCommerceService,
    removeMasCommerceService,
} from './utilities.js';
import sinon from 'sinon';
import '../src/mas-commerce-service.js';
import '../src/aem-fragment.js';

describe('Orion fragment requests and cache isolation', () => {
    let service;
    let fetchStub;
    let originalFetch;
    let href;
    let baseHref;
    const fragments = [];
    const cache = customElements.get('aem-fragment').cache;

    beforeEach(() => {
        href = window.location.href;
        const url = new URL(href);
        url.search = '';
        baseHref = url.href;
        originalFetch = window.fetch;
        window.history.replaceState(
            {},
            '',
            `${baseHref}?commerce.env=stage&mas.orion=true`,
        );
        service = initMasCommerceService({ 'allow-override': 'true' });
        cache.clear();
        fetchStub = sinon.stub().callsFake(async (url) => {
            const latest =
                new URL(url).searchParams.get('serveLatest') === 'true';
            return new Response(
                JSON.stringify({
                    id: 'localized-id',
                    fields: {
                        originalId: 'requested-id',
                        title: latest ? 'Orion' : 'Legacy',
                    },
                    references: {
                        'child-id': {
                            type: 'content-fragment',
                            value: {
                                id: 'child-id',
                                fields: { title: 'Child' },
                            },
                        },
                    },
                }),
            );
        });
        window.fetch = fetchStub;
    });

    afterEach(() => {
        for (const fragment of fragments.splice(0)) fragment.remove();
        removeMasCommerceService();
        cache.clear();
        window.fetch = originalFetch;
        window.history.replaceState({}, '', href);
    });

    const load = async (id = 'requested-id') => {
        const fragment = document.createElement('aem-fragment');
        fragment.setAttribute('fragment', id);
        fragments.push(fragment);
        document.body.append(fragment);
        await fragment.updateComplete;
        return fragment;
    };

    it('forwards latest mode to the fragment URL', async () => {
        await load();
        expect(
            new URL(fetchStub.firstCall.args[0]).searchParams.get(
                'serveLatest',
            ),
        ).to.equal('true');
    });

    it('does not forward latest mode on production', async () => {
        window.history.replaceState({}, '', `${baseHref}?mas.orion=true`);
        service.activate();
        await load();
        expect(
            new URL(fetchStub.firstCall.args[0]).searchParams.has(
                'serveLatest',
            ),
        ).to.be.false;
    });

    for (const firstMode of ['on', 'off']) {
        it(`does not reuse a fragment when changing from Orion ${firstMode} to the other mode`, async () => {
            window.history.replaceState(
                {},
                '',
                `${baseHref}?commerce.env=stage&mas.orion=${firstMode}`,
            );
            service.activate();
            const first = await load();
            const firstKey = first.cacheKey();
            const otherMode = firstMode === 'on' ? 'off' : 'on';
            window.history.replaceState(
                {},
                '',
                `${baseHref}?commerce.env=stage&mas.orion=${otherMode}`,
            );
            service.activate();
            const second = await load();
            expect(second.cacheKey()).not.to.equal(firstKey);
            expect(second.data.fields.title).to.equal(
                otherMode === 'on' ? 'Orion' : 'Legacy',
            );
            expect(fetchStub.callCount).to.equal(2);
        });
    }

    it('caches localized aliases only in the latest namespace', async () => {
        await load();
        await load('localized-id');
        expect(fetchStub.callCount).to.equal(1);
        expect(cache.has('requested-id')).to.be.false;
        expect(cache.has('localized-id')).to.be.false;
    });

    it('hydrates referenced fragments from the latest cache without another request', async () => {
        await load();
        const child = await load('child-id');
        expect(child.data.fields.title).to.equal('Child');
        expect(fetchStub.callCount).to.equal(1);
        expect(cache.has('child-id')).to.be.false;
    });

    it('loads server latest prefill into the active GB WCS cache without a second request', async () => {
        service.setAttribute('locale', 'en_GB');
        service.activate();
        const offers = ['EN', 'MULT'].map((language) => ({
            offerId: `orion-${language}`,
            language,
            priceDetails: { price: 37 },
        }));
        fetchStub.callsFake(
            async () =>
                new Response(
                    JSON.stringify({
                        id: 'requested-id',
                        fields: { title: 'Orion' },
                        wcs: {
                            stage: {
                                'test-osi-gb': [
                                    {
                                        offerId: 'legacy',
                                        priceDetails: { price: 32.98 },
                                    },
                                ],
                            },
                            'stage-latest': { 'test-osi-gb': offers },
                        },
                    }),
                ),
        );
        await load();
        const [resolved] = await Promise.all(
            service.resolveOfferSelectors({
                country: 'GB',
                language: 'en',
                wcsOsi: ['test-osi'],
            }),
        );
        expect(resolved).to.deep.equal(
            offers.map((offer) => ({ ...offer, planType: '' })),
        );
        expect(fetchStub.callCount).to.equal(1);
    });
});
