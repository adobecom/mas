const stateLib = require('@adobe/aio-lib-state');
const { Ims } = require('@adobe/aio-lib-ims');

const authorize = async (__ow_headers = {}) => {
    const authHeader = __ow_headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        if (token) {
            const imsValidation = await new Ims('prod').validateToken(token);
            return imsValidation.valid;
        }
    }
    return false;
};

async function main({ __ow_headers }) {
    try {
        if (!(await authorize(__ow_headers))) {
            return {
                statusCode: 401,
                body: 'Unauthorized: Bearer token is missing or invalid',
            };
        }
        const state = await stateLib.init();
        const result = await state.get('ostResult');
        const cached = result?.value;

        // Only ost-products-write populates this key, and .github/workflows/
        // ost-products.yaml triggers it for a single workspace. Every other
        // workspace (stage, personal) has no value, and returning 200 with an
        // undefined body made the runtime answer content-length 0 — callers then
        // failed inside response.json() with a parse error naming neither this
        // action nor the missing cache. Say what is actually wrong instead.
        //
        // Test for bytes, not just length: state round-trips values through
        // serialization, so a Buffer can come back as {type:'Buffer',...}, and a
        // length-only check would wave that through to the 200 path below and
        // hand the browser undecodable content under Content-Encoding: br.
        const hasBytes = (typeof cached === 'string' || Buffer.isBuffer(cached)) && cached.length > 0;
        if (!hasBytes) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                },
                body: {
                    error: 'OST product cache is empty for this workspace. Run ost-products-write to populate it.',
                },
            };
        }

        return {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache', // prevent caching in IO environment
                'Content-Encoding': 'br',
            },
            statusCode: 200,
            body: cached,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: `ERROR in I/O action: ${error.toString()}.`,
        };
    }
}

exports.main = main;
