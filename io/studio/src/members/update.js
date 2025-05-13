/**
 * This action serves as a target endpoint for updating MAS user data
 */

const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs } = require('../../utils');
const { init } = require('@adobe/aio-lib-state');

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    // create a Logger
    const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' });

    try {
        // 'info' is the default level if not set
        logger.info('Calling the main action');

        // check for missing request input parameters and headers
        const requiredHeaders = ['Authorization'];
        // For POST, we also need the 'users' parameter in the body
        const requiredParams = ['users'];
        const errorMessage = checkMissingRequestInputs(
            params,
            requiredParams,
            requiredHeaders,
        );
        if (errorMessage) {
            // return and log client errors
            return errorResponse(400, errorMessage, logger);
        }

        const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60; // 7 days
        const CACHE_KEY = 'mas-users';
        const method = (params.__ow_method || '').toUpperCase(); // POST should be explicit
        const state = await init();

        logger.info(`Method: ${method}`);

        if (method !== 'POST') {
            return errorResponse(
                405,
                `Method ${method} not allowed. Use POST.`,
                logger,
            );
        }

        // Validate the incoming users data
        const users = params.users;
        if (!Array.isArray(users)) {
            return errorResponse(
                400,
                'Invalid input: users must be an array',
                logger,
            );
        }

        // Validate each user object
        for (const user of users) {
            if (!user.userPrincipalName || !user.displayName) {
                return errorResponse(
                    400,
                    'Invalid user data: each user must have userPrincipalName and displayName',
                    logger,
                );
            }
        }

        // Store the validated data in state
        await state.put(CACHE_KEY, JSON.stringify(users), {
            ttl: CACHE_MAX_AGE_MS,
        });

        return {
            statusCode: 200,
            body: {
                message: 'Successfully stored user data',
                count: users.length,
            },
        };
    } catch (error) {
        // log any server errors
        logger.error(error);
        // return with 500
        return errorResponse(500, 'server error', logger);
    }
}

exports.main = main;
