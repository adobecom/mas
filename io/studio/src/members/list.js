/**
 * This action serves as a target endpoint for retrieving MAS user data
 * - GET: Retrieves the user data from state cache (requires mas-studio token)
 */

const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs } = require('../../utils');
const { init } = require('@adobe/aio-lib-state');
const { Ims } = require('@adobe/aio-lib-ims');

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try {
        // 'info' is the default level if not set
        logger.info('Calling the main action');

        // check for missing request input parameters and headers
        const requiredHeaders = ['Authorization'];
        const requiredParams = [];
        const errorMessage = checkMissingRequestInputs(
            params,
            requiredParams,
            requiredHeaders,
        );
        if (errorMessage) {
            // return and log client errors
            return errorResponse(400, errorMessage, logger);
        }

        // Validate IMS token
        const authHeader = params.__ow_headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            try {
                const ims = new Ims('prod'); // Use 'prod' environment
                const imsValidation = await ims.validateToken(
                    token,
                    'mas-studio',
                );
                if (!imsValidation || !imsValidation.valid) {
                    logger.warn('IMS token validation failed');
                    return errorResponse(
                        401,
                        'Unauthorized: Invalid IMS token',
                        logger,
                    );
                }
                logger.info('IMS token validated successfully');
            } catch (error) {
                logger.error('IMS Token validation failed with error:', error);
                return errorResponse(
                    401,
                    'Unauthorized: Token validation error',
                    logger,
                );
            }
        } else {
            logger.warn('Missing or invalid Authorization header');
            return errorResponse(
                401,
                'Unauthorized: Bearer token is missing or invalid',
                logger,
            );
        }

        const CACHE_KEY = 'mas-users';
        const method = (params.__ow_method || 'GET').toUpperCase();
        const state = await init();

        logger.info(`Method: ${method}`);

        if (method === 'GET') {
            // Retrieve data from state
            const cachedResponse = await state.get(CACHE_KEY);

            if (!cachedResponse || !cachedResponse.value) {
                return errorResponse(
                    404,
                    'No user data found in cache',
                    logger,
                );
            }

            const users = JSON.parse(cachedResponse.value);
            return {
                statusCode: 200,
                body: users,
            };
        } else {
            return errorResponse(
                405,
                `Method ${method} not allowed. Use GET.`,
                logger,
            );
        }
    } catch (error) {
        // log any server errors
        logger.error(error);
        // return with 500
        return errorResponse(500, 'server error', logger);
    }
}

exports.main = main;
