const locale =
    document
        .querySelector('meta[name="mas-locale"]')
        ?.getAttribute('content') ?? 'US_en';

const config = () => ({
    env: { name: 'prod' },
    commerce: { 'commerce.env': 'PROD' },
    locale: { prefix: locale },
});

/** in tests, eagerly initialisation breaks mocks */
export default async () => {
    const { init } = await import(
        'https://main--milo--adobecom.hlx.live/libs/deps/mas/commerce.js'
    );
    import(
        'https://main--milo--adobecom.hlx.live/libs/deps/mas/merch-card-all.js'
    );
    await init(config);
};
