const fetch = require('node-fetch');
const { odinId } = require('./paths.js');
async function fetchFragment({ id, locale }) {
    if (id) {
        try {
            const response = await fetch(odinId(id));
            if (response.status == 200) {
                const body = await response.json();
                return {
                    status: 200,
                    body,
                    locale,
                };
            }
            return {
                status: 404,
                message: 'requested fragment not found',
            };
        } catch (e) {
            return {
                status: 500,
                message: `error parsing response ${e}`,
            };
        }
    }
    return {
        status: 400,
        message: 'requested parameters are not present',
    };
}

exports.fetchFragment = fetchFragment;
