const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed } = require('../../utils.js');
const { fetchOdin, getValues } = require('../common.js');

const logger = Core.Logger('find-replace-search', { level: 'info' });

function matchesText(value, find, matchCase) {
    if (value == null) return false;
    const haystack = String(value);
    if (matchCase) return haystack.includes(find);
    return haystack.toLowerCase().includes(find.toLowerCase());
}

async function main() {}

module.exports = { main, matchesText };
exports.main = main;
