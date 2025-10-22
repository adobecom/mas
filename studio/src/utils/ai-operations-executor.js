/**
 * AI Operations Executor
 *
 * Executes AEM operations requested by the AI through natural language.
 * Runs in the frontend with access to the repository.
 * Supports both legacy operations (direct repository access) and MCP operations (via MCP server).
 */

import { showToast } from '../utils.js';
import { executeStudioOperation } from '../services/mcp-client.js';

/**
 * Execute an operation received from the AI
 * @param {Object} operation - Operation data from backend (legacy or MCP format)
 * @param {Object} repository - mas-repository instance
 * @returns {Promise<Object>} - Operation result
 */
export async function executeOperation(operation, repository) {
    if (operation.type === 'mcp_operation') {
        return await executeStudioOperation(operation.mcpTool, operation.mcpParams);
    }

    if (!operation || !operation.operation) {
        throw new Error('Invalid operation data');
    }

    switch (operation.operation) {
        case 'publish':
            return await executePublish(operation, repository);

        case 'get':
            return await executeGet(operation, repository);

        case 'search':
            return await executeSearch(operation, repository);

        case 'delete':
            return await executeDelete(operation, repository);

        case 'copy':
            return await executeCopy(operation, repository);

        case 'update':
            return await executeUpdate(operation, repository);

        default:
            throw new Error(`Unknown operation: ${operation.operation}`);
    }
}

/**
 * Publish a fragment to production
 */
async function executePublish(operation, repository) {
    const { fragmentId, publishReferences = true } = operation;

    const fragment = await repository.aem.sites.cf.fragments.getById(fragmentId);

    if (!fragment) {
        throw new Error(`Fragment not found: ${fragmentId}`);
    }

    const publishStatuses = publishReferences ? ['DRAFT', 'UNPUBLISHED'] : [];
    await repository.aem.sites.cf.fragments.publish(fragment, publishStatuses);

    return {
        success: true,
        fragmentId,
        fragmentTitle: fragment.title,
        fragmentPath: fragment.path,
        message: `✓ "${fragment.title}" has been published to production.`,
    };
}

/**
 * Get fragment data
 */
async function executeGet(operation, repository) {
    const { fragmentId } = operation;

    let fragment;
    if (fragmentId.startsWith('/')) {
        fragment = await repository.aem.sites.cf.fragments.getByPath(fragmentId);
    } else {
        fragment = await repository.aem.sites.cf.fragments.getById(fragmentId);
    }

    if (!fragment) {
        throw new Error(`Fragment not found: ${fragmentId}`);
    }

    return {
        success: true,
        fragment,
        message: `Found "${fragment.title}"`,
    };
}

/**
 * Search for fragments
 */
async function executeSearch(operation, repository) {
    const { params = {} } = operation;
    const { query = '', variant, tags = [], limit = 10 } = params;

    const searchParams = {
        path: repository.search.value.path,
        query,
        tags,
        modelIds: [],
    };

    if (variant) {
        searchParams.tags = [...tags, `mas:studio/variant/${variant}`];
    }

    const results = [];
    const searchGenerator = repository.aem.searchFragment(searchParams, limit);

    for await (const items of searchGenerator) {
        results.push(...items);
        if (results.length >= limit) break;
    }

    return {
        success: true,
        results: results.slice(0, limit),
        count: results.length,
        message: `Found ${results.length} card${results.length !== 1 ? 's' : ''}`,
    };
}

/**
 * Delete a fragment
 */
async function executeDelete(operation, repository) {
    const { fragmentId } = operation;

    const fragment = await repository.aem.sites.cf.fragments.getById(fragmentId);

    if (!fragment) {
        throw new Error(`Fragment not found: ${fragmentId}`);
    }

    await repository.aem.sites.cf.fragments.delete(fragment);

    return {
        success: true,
        fragmentId,
        fragmentTitle: fragment.title,
        message: `✓ "${fragment.title}" has been deleted.`,
    };
}

/**
 * Copy/duplicate a fragment
 */
async function executeCopy(operation, repository) {
    const { fragmentId } = operation;

    const fragment = await repository.aem.sites.cf.fragments.getById(fragmentId);

    if (!fragment) {
        throw new Error(`Fragment not found: ${fragmentId}`);
    }

    const newFragment = await repository.aem.sites.cf.fragments.copy(fragment);

    return {
        success: true,
        originalId: fragmentId,
        newFragmentId: newFragment.id,
        newFragmentTitle: newFragment.title,
        newFragmentPath: newFragment.path,
        message: `✓ Created copy: "${newFragment.title}"`,
    };
}

/**
 * Update fragment fields
 */
async function executeUpdate(operation, repository) {
    const { fragmentId, updates } = operation;

    const fragment = await repository.aem.sites.cf.fragments.getById(fragmentId);

    if (!fragment) {
        throw new Error(`Fragment not found: ${fragmentId}`);
    }

    for (const [fieldName, value] of Object.entries(updates)) {
        const field = fragment.fields.find((f) => f.name === fieldName);
        if (field) {
            field.values = [value];
        } else {
            fragment.fields.push({ name: fieldName, values: [value] });
        }
    }

    const updatedFragment = await repository.aem.sites.cf.fragments.save(fragment);

    return {
        success: true,
        fragmentId,
        fragmentTitle: updatedFragment.title,
        updatedFields: Object.keys(updates),
        message: `✓ Updated "${updatedFragment.title}"`,
    };
}

/**
 * Execute operation with error handling and user feedback
 * @param {Object} operation - Operation from AI
 * @param {Object} repository - Repository instance
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export async function executeOperationWithFeedback(operation, repository, onSuccess, onError) {
    try {
        showToast('Executing operation...', 'info');

        const result = await executeOperation(operation, repository);

        if (result.success) {
            showToast(result.message, 'positive');
            if (onSuccess) {
                onSuccess(result);
            }
        }

        return result;
    } catch (error) {
        console.error('Operation execution error:', error);
        const errorMessage = error.message || 'Operation failed';
        showToast(errorMessage, 'negative');

        if (onError) {
            onError(error);
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}
