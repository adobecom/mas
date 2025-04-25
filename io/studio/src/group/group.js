/*
 * <license header>
 */

/**
 * This is a sample action showcasing how to access an external API
 *
 * Note:
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header from the array passed in checkMissingRequestInputs
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */

const fetch = require('node-fetch');
const { Core } = require('@adobe/aio-sdk');
const {
    errorResponse,
    getBearerToken,
    stringParameters,
    checkMissingRequestInputs,
} = require('../../utils');
const { Ims, ValidationCache, getToken } = require('@adobe/aio-lib-ims');

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try {
        // 'info' is the default level if not set
        logger.info('Calling the main action');

        // log parameters, only if params.LOG_LEVEL === 'debug'
        logger.debug(stringParameters(params));

        // check for missing request input parameters and headers
        const requiredParams = [
            /* add required params */
        ];
        const requiredHeaders = ['Authorization'];
        const errorMessage = checkMissingRequestInputs(
            params,
            requiredParams,
            requiredHeaders,
        );
        if (errorMessage) {
            // return and log client errors
            return errorResponse(400, errorMessage, logger);
        }

        // extract the user Bearer token from the Authorization header
        const token = getBearerToken(params);

        const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
        const VALID_CACHE_ENTRIES = 10000;
        const INVALID_CACHE_ENTRIES = 20000;
        const cache = new ValidationCache(
            CACHE_MAX_AGE_MS,
            VALID_CACHE_ENTRIES,
            INVALID_CACHE_ENTRIES,
        );
        const ims = new Ims('prod', cache);

        const imsValidation = await ims.validateToken(token, 'mas-studio');
        if (!imsValidation.valid) {
            return new Error('Forbidden: This is not a valid IMS token!'); // Next time validateToken() is called with this token, a call to IMS will not be made while the cache is still fresh
        }

        const tenant = params.__ow_query?.tenant;
        if (!tenant) {
            return errorResponse(400, 'Tenant is required', logger);
        }
        // replace this with the api you want to access
        const apiEndpoint = `https://azure-api.pe.corp.adobe.com/azureapi/v1/ldap/groups/GRP-ODIN-MAS-${tenant}-EDITORS/members?show_all=true`;

        // fetch content from external api endpoint
        const res = await fetch(apiEndpoint, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        });
        if (!res.ok) {
            throw new Error(
                'request to ' +
                    apiEndpoint +
                    ' failed with status code ' +
                    res.status,
            );
        }
        const content = await res.json();
        const response = {
            statusCode: 200,
            body: content,
        };

        // log the response status code
        logger.info(`${response.statusCode}: successful request`);
        return response;
    } catch (error) {
        // log any server errors
        logger.error(error);
        // return with 500
        return errorResponse(500, 'server error', logger);
    }
}

exports.main = main;
