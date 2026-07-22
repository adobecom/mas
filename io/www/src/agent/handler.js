import { resolveFragmentId } from './product-fragment-map.js';
import { flattenOffer } from './flatten.js';

const DEFAULT_FRAGMENT_ENDPOINT = 'https://www.adobe.com/mas/io/fragment';

function response(statusCode, body) {
    return { statusCode, headers: { 'Content-Type': 'application/json' }, body };
}

async function main(params) {
    const { productName, locale, pzn, country, api_key: apiKey } = params;
    if (!productName || !locale) {
        return response(400, { message: 'requested parameters productName & locale are not present' });
    }
    const fragmentId = resolveFragmentId(productName);
    if (!fragmentId) {
        return response(404, { message: `unknown product '${productName}'` });
    }

    const url = new URL(params.FRAGMENT_ENDPOINT || DEFAULT_FRAGMENT_ENDPOINT);
    url.searchParams.set('id', fragmentId);
    url.searchParams.set('locale', locale);
    if (apiKey) url.searchParams.set('api_key', apiKey);
    if (pzn) url.searchParams.set('pzn', pzn);
    if (country) url.searchParams.set('country', country);

    let fragment;
    try {
        const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
        if (!res.ok) {
            return response(res.status, { message: `fragment endpoint returned ${res.status}` });
        }
        fragment = await res.json();
    } catch (error) {
        return response(502, { message: `failed to reach fragment endpoint: ${error.message}` });
    }

    return response(200, {
        ...flattenOffer(fragment),
        product: productName,
        pzn: pzn ?? null,
        country: country ?? null,
        locale,
    });
}

export { main };
