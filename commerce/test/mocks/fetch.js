import { sinon } from '../utilities.js';

export const priceLiteralsURL =
    'https://milo.adobe.com/libs/commerce/price-literals.json';

const { fetch } = window;

export async function mockFetch() {
    const originalFetch = window.fetch;
    const literals = JSON.parse(
        await originalFetch('/test/mocks/literals.json').then((r) => r.text())
    );
    const offers = JSON.parse(
        await originalFetch('/test/mocks/offers.json').then((r) => r.text())
    );

    const stub = sinon.stub().callsFake((...args) => {
        const { href, pathname, searchParams } = new URL(String(args[0]));

        // mock Wcs responses
        if (pathname.endsWith('/web_commerce_artifact')) {
            const language = searchParams.get('language').toLowerCase();
            const buckets = searchParams
                .get('offer_selector_ids')
                .split(',')
                .map((osi) =>
                    offers[`${osi}-${language}`]?.map((offer) => ({
                        ...offer,
                        offerSelectorIds: [osi],
                    }))
                );

            // 404 if any of requested osis does not exist
            if (buckets.some((bucket) => bucket == null)) {
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    json: () => Promise.reject(),
                    text: () => Promise.resolve('Some osis were not found'),
                });
            }

            // 200, all osis were found
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        resolvedOffers: buckets.flatMap((array) => array ?? []),
                    }),
                text: () => Promise.resolve('Unexpected error'),
            });
        }

        // mock literals fetches
        if (href === priceLiteralsURL) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(literals),
            });
        }

        return fetch.apply(window, args);
    });
    window.fetch = stub;
    return stub;
}

export function unmockFetch() {
    window.fetch = fetch;
}
