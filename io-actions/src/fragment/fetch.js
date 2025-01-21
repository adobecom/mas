const fetch = require('node-fetch');

async function main({ id, locale }) {
    if (id) {
        try {
            const response = await fetch(
                `https://odin.adobe.com/adobe/sites/fragments/${id}`,
            );
            if (response.status == 200) {
                const body = await response.json();
                return {
                    status: 200,
                    body,
                    locale,
                };
            }
            return {
                status: response.status,
                message: 'requested fragment not found',
            };
        } catch (e) {
            return {
                status: 500,
                message: 'error parsing response',
            };
        }
    }
    return {
        status: 400,
        message: 'requested parameters are not present',
    };
}

exports.main = main;
