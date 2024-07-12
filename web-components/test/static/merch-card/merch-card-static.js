import '../../../../libs/commerce.js';
import '../../../../libs/merch-card-all.js';
import '../../../../libs/merch-offer-select.js';
import '../../../../libs/merch-quantity-select.js';

const locale =
    document
        .querySelector('meta[name="mas-locale"]')
        ?.getAttribute('content') ?? 'US_en';

const config = () => ({
    env: { name: 'prod' },
    commerce: { 'commerce.env': 'PROD' },
    locale: { prefix: locale },
});
