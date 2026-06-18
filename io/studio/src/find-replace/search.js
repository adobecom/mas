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

const PATH_LOCALE = /\/content\/dam\/mas\/[\w-]+\/(?<locale>[\w-]+)\//;

function extractLocale(path = '') {
    return path.match(PATH_LOCALE)?.groups?.locale ?? null;
}

async function main() {}

module.exports = { main, matchesText, extractLocale };
exports.main = main;
