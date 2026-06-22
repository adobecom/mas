/*
 * <license header>
 */

/* This file exposes some common utilities for your actions */

/**
 *
 * Returns a log ready string of the action input parameters.
 * The `Authorization` header content will be replaced by '<hidden>'.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string}
 *
 */
function stringParameters(params) {
    // hide authorization token without overriding params
    let headers = params.__ow_headers || {};
    if (headers.authorization) {
        headers = { ...headers, authorization: '<hidden>' };
    }
    return JSON.stringify({ ...params, __ow_headers: headers });
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys(obj, required) {
    return required.filter((r) => {
        const splits = r.split('.');
        const last = splits[splits.length - 1];
        const traverse = splits.slice(0, -1).reduce((tObj, split) => {
            tObj = tObj[split] || {};
            return tObj;
        }, obj);
        return traverse[last] === undefined || traverse[last] === ''; // missing default params are empty string
    });
}

/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {array} requiredHeaders list of required input headers.
 * @param {array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 *
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 *
 */
function checkMissingRequestInputs(params, requiredParams = [], requiredHeaders = []) {
    let errorMessage = null;

    // input headers are always lowercase
    requiredHeaders = requiredHeaders.map((h) => h.toLowerCase());
    // check for missing headers
    const missingHeaders = getMissingKeys(params.__ow_headers || {}, requiredHeaders);
    if (missingHeaders.length > 0) {
        errorMessage = `missing header(s) '${missingHeaders}'`;
    }

    // check for missing parameters
    const missingParams = getMissingKeys(params, requiredParams);
    if (missingParams.length > 0) {
        if (errorMessage) {
            errorMessage += ' and ';
        } else {
            errorMessage = '';
        }
        errorMessage += `missing parameter(s) '${missingParams}'`;
    }

    return errorMessage;
}

/**
 *
 * Extracts the bearer token string from the Authorization header in the request parameters.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string|undefined} the token string or undefined if not set in request headers.
 *
 */
function getBearerToken(params) {
    if (params.__ow_headers && params.__ow_headers.authorization && params.__ow_headers.authorization.startsWith('Bearer ')) {
        return params.__ow_headers.authorization.substring('Bearer '.length);
    }
    return undefined;
}
/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 *
 * @returns {object} the error object, ready to be returned from the action main's function.
 *
 */
function errorResponse(statusCode, message, logger) {
    if (logger && typeof logger.info === 'function') {
        logger.info(`${statusCode}: ${message}`);
    }
    return {
        error: {
            statusCode,
            body: {
                error: message,
            },
        },
    };
}

const { Ims } = require('@adobe/aio-lib-ims');

async function isAllowed(token, allowedClientId, ims = new Ims('prod')) {
    if (!token || !allowedClientId) return false;
    const imsValidation = await ims.validateTokenAllowList(token, [allowedClientId]);
    return !!(imsValidation && imsValidation.valid);
}

function parseOwBody(params) {
    if (!params.__ow_body) return params;
    try {
        let bodyStr = params.__ow_body;
        if (typeof bodyStr === 'string') {
            try {
                bodyStr = Buffer.from(bodyStr, 'base64').toString();
            } catch {}
        }
        const body = typeof bodyStr === 'object' ? bodyStr : JSON.parse(bodyStr);
        return { ...params, ...body };
    } catch {
        return params;
    }
}

function parseRawBody(params) {
    if (params.__ow_body == null) return '';
    const body = params.__ow_body;
    if (Buffer.isBuffer(body)) return body.toString('utf8');
    if (typeof body !== 'string') return String(body);
    const trimmed = body.trim();
    if (trimmed.startsWith('\uFEFF') || trimmed.startsWith('fragment_id')) return body;
    try {
        const decoded = Buffer.from(body, 'base64').toString('utf8');
        if (decoded.includes('fragment_id')) return decoded;
    } catch {}
    return body;
}

function isCsvContentType(params) {
    const ct = params.__ow_headers?.['content-type'] || '';
    return ct.split(';')[0].trim().toLowerCase() === 'text/csv';
}

function isMultipartContentType(params) {
    const ct = params.__ow_headers?.['content-type'] || '';
    return ct.split(';')[0].trim().toLowerCase() === 'multipart/form-data';
}

function parseMultipartBoundary(contentType) {
    const match = /boundary=([^;]+)/i.exec(contentType || '');
    if (!match) return null;
    return match[1].trim().replace(/^"|"$/g, '');
}

function parseMultipartRawBody(params) {
    if (params.__ow_body == null) return '';
    let body = params.__ow_body;
    if (Buffer.isBuffer(body)) body = body.toString('utf8');
    if (typeof body !== 'string') body = String(body);
    if (body.trimStart().startsWith('--')) return body;
    try {
        const decoded = Buffer.from(body, 'base64').toString('utf8');
        if (decoded.trimStart().startsWith('--')) return decoded;
    } catch {}
    return body;
}

function extractCsvFromMultipart(body, contentType) {
    const boundary = parseMultipartBoundary(contentType);
    if (!boundary) return '';
    const delimiter = `--${boundary}`;
    for (const section of body.split(delimiter)) {
        const trimmed = section.replace(/^\r?\n/, '').replace(/\r?\n--?\s*$/, '');
        if (!trimmed || trimmed === '--') continue;
        const splitAt = trimmed.indexOf('\r\n\r\n');
        let content;
        if (splitAt >= 0) {
            content = trimmed.slice(splitAt + 4);
        } else {
            const lfSplit = trimmed.indexOf('\n\n');
            content = lfSplit >= 0 ? trimmed.slice(lfSplit + 2) : trimmed;
        }
        content = content.replace(/\r?\n--\s*$/, '').trim();
        if (content.includes('fragment_id')) return content;
    }
    return '';
}

function parseCsvUploadBody(params) {
    if (isMultipartContentType(params)) {
        const ct = params.__ow_headers?.['content-type'] || '';
        return extractCsvFromMultipart(parseMultipartRawBody(params), ct);
    }
    return parseRawBody(params);
}

function isCsvUpload(params) {
    return isCsvContentType(params) || isMultipartContentType(params);
}

module.exports = {
    errorResponse,
    getBearerToken,
    isAllowed,
    parseOwBody,
    parseRawBody,
    parseCsvUploadBody,
    parseMultipartRawBody,
    extractCsvFromMultipart,
    isCsvContentType,
    isMultipartContentType,
    isCsvUpload,
    stringParameters,
    checkMissingRequestInputs,
};
