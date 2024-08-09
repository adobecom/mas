import { init } from 'https://main--milo--adobecom.hlx.page/libs/deps/mas/commerce.js';
import 'https://main--milo--adobecom.hlx.page/libs/deps/mas/merch-card-all.js';

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
    await init(config);
};
