let polyfillsPromise;
export async function polyfills() {
    if (polyfillsPromise) return polyfillsPromise;
    let isSupported = false;
    document.createElement('div', {
        get is() {
            isSupported = true;
        },
    });
    if (isSupported) {
        polyfillsPromise = Promise.resolve();
    } else {
        polyfillsPromise = await import('../../../deps/custom-elements.js');
    }
    return polyfillsPromise;
}

const toggleTheme = (theme, event, params) => {
    event?.preventDefault();
    document.body.className = `spectrum spectrum--medium spectrum--${theme}`;
    document.querySelector('sp-theme')?.setAttribute('color', theme);
    if (params) {
        params.set('theme', theme);
        history.replaceState(null, '', `${location.pathname}?${params}`);
    }
};

const LANG_LOCALE_MAP = {
    en: 'en_US',
    fr: 'fr_FR',
    de: 'de_DE',
    es: 'es_ES',
};

const toggleLocale = (event, params) => {
    event?.preventDefault();
    const val = event.target.getAttribute('value');
    if (val.includes(',')) {
        const [country, language] = val.split(',');
        params.set('country', country);
        params.delete('language');
        params.set('locale', LANG_LOCALE_MAP[language]);
        if (country === 'AU' && language === 'en') {            
            params.set('locale', 'en_AU');
            params.delete('country');
        }
    } else {
        params.set('locale', val);
        params.delete('country');
        params.delete('language');
    }
    history.replaceState(null, '', `${location.pathname}?${params}`);
    window.location.reload();
};

const createMasCommerceService = (params, commerceEnv) => {
    const old = document.querySelector('mas-commerce-service');
    if (old) {
        old.remove();
    }
    const masCommerceService = document.createElement('mas-commerce-service');
    masCommerceService.setAttribute('lana-tags', 'nala');
    masCommerceService.setAttribute('lana-sample-rate', '100');
    if (commerceEnv) {
        masCommerceService.setAttribute('env', commerceEnv);
    }
    [
        'locale',
        'country',
        'language',
        'env',
        'lana-tags',
        'data-mas-ff-defaults',
    ].forEach((attribute) => {
        const value = params[attribute];
        if (value) masCommerceService.setAttribute(attribute, value);
    });
    if (!masCommerceService.getAttributeNames().includes('locale')){
        masCommerceService.setAttribute('locale', 'en_US');
    }
    document.head.appendChild(masCommerceService);

    return masCommerceService;
};

const init = async (params = {}) => {
    await polyfills();
    const urlParams = new URLSearchParams(document.location.search);

    // Derive locale from URL `language` (+ optional `country`) so io receives a real locale
    // instead of falling back to `en_US`. Examples:
    //   ?country=FR&language=fr  → locale=fr_FR  (fr is native to FR per LANG_LOCALE_MAP)
    //   ?country=AR&language=es  → locale=es_ES, country=AR
    //   ?language=fr             → locale=fr_FR (via LANG_LOCALE_MAP)
    // `?country=XX` alone is left as-is (mas-commerce-service applies its own default).
    if (!urlParams.has('locale')) {
        const language = urlParams.get('language');
        const country = urlParams.get('country');
        const mappedLocale = LANG_LOCALE_MAP[language];
        if (language && country && mappedLocale?.split('_')[1] === country.toUpperCase()) {
            urlParams.set('locale', mappedLocale);
        } else if (language && mappedLocale && !country) {
            urlParams.set('locale', mappedLocale);
        }
    }

    const commerceEnv = document.querySelector(
        'meta[name="commerce.env"]',
    )?.content;

    // theme
    toggleTheme(urlParams.get('theme') ?? 'light');

    // mas-commerce-service
    createMasCommerceService(
        { ...params, ...Object.fromEntries(urlParams.entries()) },
        commerceEnv,
    );
    await import('../dist/mas.js');

    document
        .querySelectorAll('a.theme-toggle')
        .forEach((link) =>
            link.addEventListener('click', (event) =>
                toggleTheme(
                    event.target.getAttribute('value'),
                    event,
                    urlParams,
                ),
            ),
        );

    document
        .querySelectorAll('a.locale-toggle')
        .forEach((link) =>
            link.addEventListener('click', (event) =>
                toggleLocale(event, urlParams),
            ),
        );
};

window.onceEvent = (element, event, handler) => {
    element.addEventListener(event, handler, { once: true });
};

window.log = (target, ...messages) =>
    (target.innerHTML = `${messages.join(' ')}<br>${target.innerHTML}`);
export { init };
