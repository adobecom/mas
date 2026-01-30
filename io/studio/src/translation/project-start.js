const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken } = require('../../utils');
const { Ims } = require('@adobe/aio-lib-ims');

const logger = Core.Logger('main', { level: 'info' });
const DEFAULT_BATCH_SIZE = 10;

async function main(params) {
    const batchSize = params.batchSize || DEFAULT_BATCH_SIZE;

    try {
        logger.info('Calling the main action');

        const requiredHeaders = ['Authorization'];
        const requiredParams = ['projectId', 'surface'];
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
        if (errorMessage) {
            return errorResponse(400, errorMessage, logger);
        }

        const authToken = getBearerToken(params);
        const allowed = await isAllowed(authToken, params.allowedClientId);
        if (!allowed) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const { projectCF, etag } = await getTranslationProject(params.projectId, authToken);

        const translationData = getTranslationData(projectCF, params.surface, params.translationMapping);
        if (!translationData) {
            return errorResponse(400, 'Translation project is incomplete (missing items or locales)', logger);
        }

        const translationProject = await startTranslationProject(translationData, authToken);
        if (!translationProject) {
            return errorResponse(500, 'Failed to start translation project', logger);
        }

        const updatedProjectCF = await updateTranslationDate(projectCF, etag, authToken);
        if (!updatedProjectCF) {
            return errorResponse(500, 'Failed to update translation project submission date', logger);
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
            const projectCF = await response.json();
            const etag = response.headers.get('etag');
            return { projectCF, etag };
        } catch (error) {
            logger.error(`Error fetching translation project: ${error}`);
            throw new Error(`Failed to fetch translation project: ${error.message || error.toString()}`);
        }
    }

    function getTranslationData(projectCF, surface, translationMapping = {}) {
        const itemsToTranslate = getItemsToTranslate(projectCF, surface);
        const locales = projectCF.fields.find((field) => field.name === 'targetLocales')?.values;
        if (!itemsToTranslate) {
            return null;
        }
        if (!locales || locales.length === 0) {
            logger.warn('No locales found in translation project');
            return null;
        }

        // set translation flow
        const translationFlow = translationMapping[surface];
        logger.info(`Translation flow: ${translationFlow}`);

        return {
            itemsToTranslate,
            locales,
            surface,
            translationFlow: translationFlow
                ? {
                      [translationFlow]: true,
                  }
                : {},
        };
    }

    function getItemsToTranslate(projectCF) {
        // Gather items from all three separate arrays
        const fragments = projectCF.fields.find((field) => field.name === 'fragments')?.values || [];
        const collections = projectCF.fields.find((field) => field.name === 'collections')?.values || [];
        const placeholders = projectCF.fields.find((field) => field.name === 'placeholders')?.values || [];

        // Combine all items into a single array
        const itemsToTranslate = [...fragments, ...collections, ...placeholders];

        if (itemsToTranslate.length === 0) {
            logger.warn(`No items to translate found in translation project: ${projectCF.id}`);
            return null;
        }
        return itemsToTranslate;
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
        const { itemsToTranslate, locales, surface, translationFlow } = translationData;
        logger.info(`Starting translation project ${itemsToTranslate} for locales ${locales} and surface ${surface}`);

        const locPayload = {
            targetLocales: locales,
            ...(translationFlow || {}),
        };

        logger.info(`locPayload: ${JSON.stringify(locPayload)}`);

        const config = {
            authToken,
            odinEndpoint: params.odinEndpoint,
            locPayload,
            maxRetries: 3,
        };

        // Process items in batches to respect RPS limit
        const results = await processBatchWithConcurrency(itemsToTranslate, batchSize, (item) =>
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

    async function updateTranslationDate(projectCF, etag, authToken) {
        try {
            logger.info(`Updating translation project submission date for ${projectCF.id}`);

            // find field index of submissionDate
            const submissionDateFieldIndex = projectCF.fields.findIndex((field) => field.name === 'submissionDate');
            if (submissionDateFieldIndex === -1) {
                logger.error('Submission date field not found in translation project');
                throw new Error('Submission date field not found in translation project');
            }

            // update submissionDate field
            const path = `/fields/${submissionDateFieldIndex}/values`;

            // save translation project
            const response = await fetch(`${params.odinEndpoint}/adobe/sites/cf/fragments/${projectCF.id}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json-patch+json',
                    'If-Match': etag,
                },
                method: 'PATCH',
                body: JSON.stringify([{ op: 'replace', path, value: [new Date().toISOString()] }]),
            });
            if (!response.ok) {
                logger.error(`Failed to update translation project submission date: ${response.status} ${response.statusText}`);
                throw new Error(
                    `Failed to update translation project submission date: ${response.status} ${response.statusText}`,
                );
            }
            return response.ok;
        } catch (error) {
            logger.error(`Error updating translation project submission date: ${error}`);
            throw new Error(`Failed to update translation project submission date: ${error.message || error.toString()}`);
        }
    }
}

exports.main = main;
