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

async function withTimeout(operation, ms, label) {
    let timer;
    const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
            const error = new Error(`${label} exceeded ${ms}ms`);
            error.isTimeout = true;
            reject(error);
        }, ms);
    });
    try {
        return await Promise.race([operation(), deadline]);
    } finally {
        clearTimeout(timer);
    }
}

async function main(params, { openwhiskFactory = openwhisk } = {}) {
    const { productName, locale, country: requestedCountry, api_key: apiKey } = params;
    const path = params.__ow_path ?? '';
    let fragmentId;
    if (path !== '' && path !== '/') {
        const match =
            typeof path === 'string' && path.match(/^\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i);
        if (!match || match[0] !== path) {
            return response(400, { message: 'requested path must contain one fragment UUID' });
        }
        fragmentId = match[1].toLowerCase();
    }
    const pzn = fragmentId ? undefined : params.pzn;
    if (!fragmentId && (!productName || typeof productName !== 'string')) {
        return response(400, { message: 'requested parameter productName or fragment ID is not present' });
    }
    if (!locale) {
        return response(400, { message: 'requested parameter locale is not present' });
    }
    if (!apiKey) {
        return response(400, { message: 'requested parameter api_key is not present' });
    }
    if (pzn !== undefined && !['edu', 'team'].includes(pzn)) {
        return response(400, { message: `unknown pzn '${pzn}', expected one of edu, team` });
    }
    fragmentId ??= resolveFragmentId(productName, pzn ?? 'individual');

    const country = requestedCountry?.toUpperCase();
    const fragmentParams = { id: fragmentId, locale, api_key: apiKey };
    if (country) fragmentParams.country = country;

    let result;
    try {
        const client = openwhiskFactory({
            api_key: params.__ow_api_key,
            apihost: params.__ow_api_host,
            namespace: params.__ow_namespace,
        });
        result = await withTimeout(
            () =>
                client.actions.invoke({
                    name: fragmentActionName(params),
                    params: fragmentParams,
                    blocking: true,
                    result: true,
                }),
            20000,
            'fragment invoke',
        );
    } catch (error) {
        return response(error.isTimeout ? 504 : 502, { message: `failed to invoke fragment action: ${error.message}` });
    }

    if (result.statusCode !== 200) {
        return response(result.statusCode, { message: result.message ?? `fragment action returned ${result.statusCode}` });
    }

    try {
        const flat = await withTimeout(
            () => flattenOffer(parseFragmentBody(result), { locale, country }),
            15000,
            'price hydration',
        );
        return response(200, { ...flat, fragment: fragmentId, pzn: pzn ?? null });
    } catch (error) {
        return response(error.isTimeout ? 504 : 502, { message: `failed to hydrate fragment offer: ${error.message}` });
    }
}

export { main };
