import {
    buildCheckoutUrl as buildUrl,
    addParamsFromPageUrl as addPageParams,
    applyPageLocaleToCheckoutUrl as applyLocale,
} from '../../checkout/src/buildCheckoutUrl.js';

export {
    mapParameterName,
    addParameters,
    getHostName,
    setItemsParameter,
    add3in1Parameters,
    pathnameRequiresZhHantLang,
} from '../../checkout/src/buildCheckoutUrl.js';

function getPageContext() {
    const pathnames = [window.location.pathname];
    try {
        if (window.parent !== window)
            pathnames.push(window.parent.location.pathname);
    } catch {
        /* cross-origin parent */
    }
    return { search: window.location.search, pathnames };
}

export function buildCheckoutUrl(checkoutData) {
    return buildUrl(checkoutData, getPageContext());
}

export function addParamsFromPageUrl(url) {
    return addPageParams(url, window.location.search);
}

export function applyPageLocaleToCheckoutUrl(url) {
    return applyLocale(url, getPageContext());
}
