const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken } = require('../../utils');
const { Ims } = require('@adobe/aio-lib-ims');

const logger = Core.Logger('main', { level: 'info' });
const BATCH_SIZE = 10;

async function main(params) {
    try {
        logger.info('Calling the main action');

        const requiredHeaders = ['Authorization'];
        const requiredParams = ['projectId'];
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
        if (errorMessage) {
            return errorResponse(400, errorMessage, logger);
        }

        const authToken = getBearerToken(params);
        const allowed = await isAllowed(authToken, params.allowedClientId);
        if (!allowed) {
            return errorResponse(403, 'Forbidden: Invalid client ID', logger);
        }

        const projectCF = await getTranslationProject(params.projectId, authToken);

        const translationData = getTranslationData(projectCF);
        if (!translationData) {
            return errorResponse(400, 'Translation project is incomplete (missing items or locales)', logger);
        }

        const translationProject = await startTranslationProject(translationData, authToken);
        if (!translationProject) {
            return errorResponse(500, 'Failed to start translation project', logger);
        }
    } catch (error) {
        logger.error('Error calling the main action', error);
        return errorResponse(500, `Internal server error - ${error.message}`, logger);
    }

    return {
        statusCode: 200,
        body: {
            message: 'Translation project started',
        },
    };

    async function isAllowed(token, allowedClientId) {
        logger.info(`Validating IMS token for client ID: ${allowedClientId}`);
        const ims = new Ims('prod');
        const imsValidation = await ims.validateTokenAllowList(token, [allowedClientId]);

        // Check if token is valid
        if (!imsValidation || !imsValidation.valid) {
            logger.error(`IMS token validation failed: ${JSON.stringify(imsValidation, null, 2)}`);
            return false;
        }

        return true;
    }

    async function getTranslationProject(projectId, authToken) {
        try {
            logger.info(`Fetching translation project from ${params.odinEndpoint}/adobe/sites/cf/fragments/${projectId}`);
            const response = await fetch(`${params.odinEndpoint}/adobe/sites/cf/fragments/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            logger.info(`response.status: ${response.status}`);
            logger.info(`response.statusText: ${response.statusText}`);
            if (!response.ok) {
                logger.error(`Failed to fetch translation project: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch translation project: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            logger.error(`Error fetching translation project: ${error}`);
            throw new Error(`Failed to fetch translation project: ${error.message || error.toString()}`);
        }
    }

    function getTranslationData(projectCF) {
        const itemsToTranslate = projectCF.fields.find((field) => field.name === 'items')?.values;
        const locales = projectCF.fields.find((field) => field.name === 'targetLocales')?.values;
        if (!itemsToTranslate || itemsToTranslate.length === 0) {
            logger.warn('No items to translate found in translation project');
            return null;
        }
        if (!locales || locales.length === 0) {
            logger.warn('No locales found in translation project');
            return null;
        }
        return { itemsToTranslate, locales };
    }

    // Helper function to send a single request with retry logic
    async function sendLocRequestWithRetry(item, config) {
        const { authToken, odinEndpoint, locPayload, maxRetries = 3 } = config;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info(`Sending loc request for fragment ${item} (attempt ${attempt}/${maxRetries})`);

                const response = await fetch(`${odinEndpoint}/bin/sendToLocalisationAsync?path=${item}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                    body: JSON.stringify(locPayload),
                });

                logger.info(`loc response.status for ${item}: ${response.status}`);
                logger.info(`loc response.statusText for ${item}: ${response.statusText}`);

                if (!response.ok) {
                    lastError = `${response.status} ${response.statusText}`;
                    logger.warn(`Request failed for fragment ${item} (attempt ${attempt}/${maxRetries}): ${lastError}`);

                    if (attempt < maxRetries) {
                        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                        logger.info(`Waiting ${delay}ms before retry...`);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        continue;
                    }
                } else {
                    return { success: true, item };
                }
            } catch (error) {
                lastError = error.message || error.toString();
                logger.warn(`Error sending loc request for fragment ${item} (attempt ${attempt}/${maxRetries}): ${lastError}`);

                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    logger.info(`Waiting ${delay}ms before retry...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        logger.error(`Failed to send loc request for fragment ${item} after ${maxRetries} attempts: ${lastError}`);
        return { success: false, item, error: lastError };
    }

    // Helper function to process items in batches with concurrency limit
    async function processBatchWithConcurrency(items, batchSize, processor) {
        const allResults = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(items.length / batchSize)}`);

            const batchResults = await Promise.all(batch.map(processor));
            allResults.push(...batchResults);
        }

        return allResults;
    }

    async function startTranslationProject(translationData = {}, authToken) {
        const { itemsToTranslate, locales } = translationData;
        logger.info(`Starting translation project ${itemsToTranslate} for locales ${locales}`);

        // TODO: remove machineTranslation once we have a way to configure the translation project
        const locPayload = {
            targetLocales: locales,
            machineTranslation: true,
        };

        const config = {
            authToken,
            odinEndpoint: params.odinEndpoint,
            locPayload,
            maxRetries: 3,
        };

        // Process items in batches to respect RPS limit
        const results = await processBatchWithConcurrency(itemsToTranslate, BATCH_SIZE, (item) =>
            sendLocRequestWithRetry(item, config),
        );

        // Check if any requests failed after all retries
        const failures = results.filter((result) => !result.success);
        if (failures.length > 0) {
            logger.error(
                `${failures.length} request(s) failed after retries: ${failures.map((failure) => failure.item).join(', ')}`,
            );
            return false;
        }

        logger.info(`Successfully sent ${results.length} loc requests`);
        return true;
    }
}

exports.main = main;
