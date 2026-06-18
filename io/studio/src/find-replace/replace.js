const { Core } = require('@adobe/aio-sdk');
const { errorResponse } = require('../../utils.js');

const logger = Core.Logger('find-replace-replace', { level: 'info' });

async function main() {
    return errorResponse(501, 'find-replace-replace is not implemented yet', logger);
}

module.exports = { main };
exports.main = main;
