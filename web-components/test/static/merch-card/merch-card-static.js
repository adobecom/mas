// @ts-nocheck
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

export const appendMiloStyles = () => {
    const params = new URLSearchParams(window.location.search);
    let milolibs = params.get('milolibs') ?? 'main--milo--adobecom';
    if (milolibs === 'local') {
        milolibs = 'http://localhost:6456';
    }
    const customStyles = document.querySelector('style');
    let style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `https://${milolibs}.hlx.page/libs/styles/styles.css`;
    document.head.insertBefore(style, customStyles);

    style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `${milolibs}/libs/blocks/merch/merch.css`;

    style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `https://${milolibs}.hlx.page/libs/blocks/merch-card/merch-card.css`;
    document.head.insertBefore(style, customStyles);
};

(async () => {
    appendMiloStyles();
})();
