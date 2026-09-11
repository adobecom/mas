import zlib from 'zlib';
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

function parseFragmentBody(result) {
    const body =
        result.headers?.['Content-Encoding'] === 'br'
            ? zlib.brotliDecompressSync(Buffer.from(result.body, 'base64')).toString('utf-8')
            : result.body;
    return JSON.parse(body);
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

    // A fragment invoke or price hydration must never hang the whole activation to its
    // platform timeout: bound each with a deadline so a stall fails fast (see MWPW agent hang).
    const deadline = (ms, label) =>
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} exceeded ${ms}ms`)), ms));

    let result;
    try {
        const client = openwhiskFactory({
            api_key: params.__ow_api_key,
            apihost: params.__ow_api_host,
            namespace: params.__ow_namespace,
        });
        result = await Promise.race([
            client.actions.invoke({
                name: fragmentActionName(params),
                params: fragmentParams,
                blocking: true,
                result: true,
            }),
            deadline(20000, 'fragment invoke'),
        ]);
    } catch (error) {
        return response(502, { message: `failed to invoke fragment action: ${error.message}` });
    }

    if (result.statusCode !== 200) {
        return response(result.statusCode, { message: `fragment action returned ${result.statusCode}` });
    }

    const flat = await Promise.race([flattenOffer(parseFragmentBody(result)), deadline(15000, 'price hydration')]);
    return response(200, { ...flat, pzn: pzn ?? null });
}

export { main };
