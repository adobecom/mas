const { Core } = require('@adobe/aio-sdk');
const { errorResponse } = require('../../utils.js');

const logger = Core.Logger('bulk-edit-replace', { level: 'info' });

async function main() {
    return errorResponse(501, 'bulk-edit-replace is not implemented yet', logger);
}

module.exports = { main };
exports.main = main;
