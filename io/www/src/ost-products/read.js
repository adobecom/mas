const stateLib = require('@adobe/aio-lib-state');
const { Ims } = require('@adobe/aio-lib-ims');

const authorize = async (__ow_headers) => {
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

        return {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache', // prevent caching in IO environment
                'Content-Encoding': 'br',
            },
            statusCode: 200,
            body: result?.value,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: `ERROR in I/O action: ${error.toString()}.`,
        };
    }
}

exports.main = main;
