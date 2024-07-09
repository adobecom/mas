import { init } from '@adobe/mas-commerce';

const locale =
    document
        .querySelector('meta[name="mas-locale"]')
        ?.getAttribute('content') ?? 'US_en';

const lang = document
    .querySelector('meta[name="mas-lang"]')
    ?.getAttribute('content');

const config = () => ({
    env: { name: 'stage' },
    commerce: { 'commerce.env': 'STAGE' },
    locale: { prefix: locale },
});

const features =
    document
        .querySelector('meta[name="mas-features"]')
        ?.getAttribute('content')
        ?.split(',') ?? [];

init(config);

if (features.includes('merch-card')) {
    const { origin } = new URL(import.meta.url);
    import(`${origin}/lib/merch-card-all.js`);
}
