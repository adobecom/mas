import openwhisk from 'openwhisk';
import { resolveFragmentId } from './product-fragment-map.js';
import { flattenOffer } from './flatten.js';

function response(statusCode, body) {
    return { statusCode, headers: { 'Content-Type': 'application/json' }, body };
}

function fragmentActionName(params) {
    const current = params.__ow_action_name;
    return current ? current.replace(/[^/]+$/, 'fragment') : 'MerchAtScale/fragment';
}

async function main(params, { openwhiskFactory = openwhisk } = {}) {
    const { productName, locale, pzn, country, api_key: apiKey } = params;
    if (!productName || !locale) {
        return response(400, { message: 'requested parameters productName & locale are not present' });
    }
    const fragmentId = resolveFragmentId(productName);
    if (!fragmentId) {
        return response(404, { message: `unknown product '${productName}'` });
    }

    const fragmentParams = { id: fragmentId, locale };
    if (apiKey) fragmentParams.api_key = apiKey;
    if (pzn) fragmentParams.pzn = pzn;
    if (country) fragmentParams.country = country;

    let result;
    try {
        const client = openwhiskFactory({
            api_key: params.__ow_api_key,
            apihost: params.__ow_api_host,
            namespace: params.__ow_namespace,
        });
        result = await client.actions.invoke({
            name: fragmentActionName(params),
            params: fragmentParams,
            blocking: true,
            result: true,
        });
    } catch (error) {
        return response(502, { message: `failed to invoke fragment action: ${error.message}` });
    }

    if (result.statusCode !== 200) {
        return response(result.statusCode, { message: `fragment action returned ${result.statusCode}` });
    }

    return response(200, {
        ...flattenOffer(JSON.parse(result.body)),
        product: productName,
        pzn: pzn ?? null,
        country: country ?? null,
        locale,
    });
}

export { main };
