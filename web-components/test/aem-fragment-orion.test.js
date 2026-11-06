import {
    expect,
    initMasCommerceService,
    removeMasCommerceService,
} from './utilities.js';
import sinon from 'sinon';
import { waitUntil } from '@open-wc/testing';
import { EVENT_AEM_LOAD, EVENT_AEM_ERROR } from '../src/constants.js';
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
                    wcs: {
                        [latest ? 'stage-latest' : 'stage']: {
                            'test-osi-gb': [
                                { offerId: latest ? 'latest' : 'legacy' },
                            ],
                        },
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

    const startLoad = (id = 'requested-id', attributes = {}) => {
        const fragment = document.createElement('aem-fragment');
        for (const [name, value] of Object.entries(attributes)) {
            fragment.setAttribute(name, value);
        }
        fragment.setAttribute('fragment', id);
        fragments.push(fragment);
        document.body.append(fragment);
        return fragment;
    };

    const load = async (id = 'requested-id') => {
        const fragment = startLoad(id);
        await fragment.updateComplete;
        return fragment;
    };

    const switchMode = (mode) => {
        window.history.replaceState(
            {},
            '',
            `${baseHref}?commerce.env=stage&mas.orion=${mode}`,
        );
        service.activate();
    };

    const deferFirstResponse = () => {
        let resolve;
        fetchStub.onFirstCall().returns(
            new Promise((release) => {
                resolve = release;
            }),
        );
        return (mode, status = 200) =>
            resolve(
                new Response(
                    JSON.stringify({
                        id: 'requested-id',
                        fields: { title: mode === 'on' ? 'Orion' : 'Legacy' },
                        wcs: {
                            [mode === 'on' ? 'stage-latest' : 'stage']: {
                                'test-osi-gb': [{ offerId: mode }],
                            },
                        },
                    }),
                    { status },
                ),
            );
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

        for (const attributes of [
            {},
            { pzn: 'segment' },
            { mask: 'mask-id' },
        ]) {
            it(`keeps an in-flight Orion ${firstMode} response in its original namespace with ${JSON.stringify(attributes)}`, async () => {
                switchMode(firstMode);
                const release = deferFirstResponse();
                const fragment = startLoad('requested-id', attributes);
                const originalKey = fragment.cacheKey();
                await waitUntil(() => fetchStub.calledOnce);

                switchMode(firstMode === 'on' ? 'off' : 'on');
                release(firstMode);
                await fragment.updateComplete;

                expect(cache.get(originalKey).fields.title).to.equal(
                    firstMode === 'on' ? 'Orion' : 'Legacy',
                );
                expect(cache.get(fragment.cacheKey()).fields.title).to.equal(
                    firstMode === 'on' ? 'Legacy' : 'Orion',
                );
            });
        }

        it(`publishes only current-mode data when Orion ${firstMode} changes during a request`, async () => {
            switchMode(firstMode);
            const release = deferFirstResponse();
            const fragment = startLoad();
            const loaded = sinon.spy();
            fragment.addEventListener(EVENT_AEM_LOAD, loaded);
            await waitUntil(() => fetchStub.calledOnce);

            switchMode(firstMode === 'on' ? 'off' : 'on');
            const prefill = sinon.spy(service, 'prefillWcsCache');
            release(firstMode);
            await fragment.updateComplete;

            expect(
                loaded
                    .getCalls()
                    .map(({ args: [event] }) => event.detail.fields.title),
            ).to.deep.equal([firstMode === 'on' ? 'Legacy' : 'Orion']);
            expect(fragment.data.fields.title).to.equal(
                firstMode === 'on' ? 'Legacy' : 'Orion',
            );
            expect(prefill.calledOnce).to.be.true;
            expect(prefill.firstCall.args[0]).not.to.have.property(
                firstMode === 'on' ? 'stage-latest' : 'stage',
            );
            prefill.restore();
        });

        it(`retries the current mode when an obsolete Orion ${firstMode} request fails`, async () => {
            switchMode(firstMode);
            const release = deferFirstResponse();
            const fragment = startLoad();
            await waitUntil(() => fetchStub.calledOnce);

            switchMode(firstMode === 'on' ? 'off' : 'on');
            release(firstMode, 404);
            await fragment.updateComplete;

            expect(fragment.data.fields.title).to.equal(
                firstMode === 'on' ? 'Legacy' : 'Orion',
            );
            expect(fragment.classList.contains('error')).to.be.false;
        });

        it(`hides already-loaded Orion ${firstMode} data after switching modes`, async () => {
            switchMode(firstMode);
            const fragment = await load();

            switchMode(firstMode === 'on' ? 'off' : 'on');

            expect(fragment.rawData).to.be.null;
            expect(fragment.data).to.be.null;
        });

        it(`uses the current namespace after waiting for an Orion ${firstMode} cache entry`, async () => {
            switchMode(firstMode);
            const fragment = startLoad('requested-id', { loading: 'cache' });
            const originalKey = fragment.cacheKey();

            switchMode(firstMode === 'on' ? 'off' : 'on');
            cache.set(originalKey, {
                id: 'requested-id',
                fields: { title: 'Obsolete cached data' },
            });
            await waitUntil(() => fetchStub.calledOnce);
            await fragment.updateComplete;

            expect(fragment.data.fields.title).to.equal(
                firstMode === 'on' ? 'Legacy' : 'Orion',
            );
        });

        it(`does not serve Orion ${firstMode} data as stale fallback after switching modes`, async () => {
            switchMode(firstMode);
            const fragment = await load();
            const failed = sinon.spy();
            fragment.addEventListener(EVENT_AEM_ERROR, failed);
            switchMode(firstMode === 'on' ? 'off' : 'on');
            fetchStub.callsFake(
                async () => new Response('Not Found', { status: 404 }),
            );

            expect(await fragment.refresh()).to.be.false;
            expect(failed.calledOnce).to.be.true;
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
