const { fetch } = require('./common.js');
const { odinIdStudio } = require('./paths.js');

async function fetchFragment(context) {
    const { id } = context;
    if (id) {
        const path = odinIdStudio(id);
        const response = await fetch(path, context);
        if (response.status == 200) {
            const body = await response.json();
            return {
                ...context,
                body,
            };
        }
        return {
            status: 404,
            message: 'requested fragment not found',
        };
    }
    return {
        status: 400,
        message: 'requested parameters are not present',
    };
}

exports.fetchFragment = fetchFragment;
