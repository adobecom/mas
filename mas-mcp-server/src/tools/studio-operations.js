import { AEMClient } from '../services/aem-client.js';
import { StudioURLBuilder } from '../utils/studio-url-builder.js';
import { jobManager } from '../utils/job-manager.js';

const TAG_MODEL_ID_MAPPING = {
    'mas:studio/content-type/merch-card-collection': 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
    'mas:studio/content-type/merch-card': 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ',
};

const EDITABLE_FRAGMENT_MODEL_IDS = Object.values(TAG_MODEL_ID_MAPPING);

/**
 * Studio Operations Tools
 * MCP tools for Studio AI Chat operations (NO AI CALLS - pure execution only)
 *
 * These tools handle AEM operations requested through Studio's AI chat.
 * AI intent detection happens in Adobe I/O Runtime, these tools only execute.
 * Auto-synced to io/mcp-server via Claude Code hook (verified working)
 */
export class StudioOperations {
    constructor(aemClient, urlBuilder) {
        this.aemClient = aemClient;
        this.urlBuilder = urlBuilder;
    }

    /**
     * Publish a card to production
     * @param {Object} params - { id: string, publishReferences?: boolean }
     */
    async publishCard(params) {
        const { id, publishReferences = true } = params;

        if (!id) {
            throw new Error('Card ID is required for publish operation');
        }

        const fragment = await this.aemClient.getFragment(id);

        if (!fragment) {
            throw new Error(`Card not found: ${id}`);
        }

        await this.aemClient.publishFragment(fragment.id, publishReferences);

        const card = this.formatCard(fragment);
        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            success: true,
            operation: 'publish',
            card,
            message: `✓ "${fragment.title}" has been published to production.`,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Unpublish a card from production
     * @param {Object} params - { id: string }
     */
    async unpublishCard(params) {
        const { id } = params;

        if (!id) {
            throw new Error('Card ID is required for unpublish operation');
        }

        const fragment = await this.aemClient.getFragment(id);

        if (!fragment) {
            throw new Error(`Card not found: ${id}`);
        }

        await this.aemClient.unpublishFragment(fragment.id);

        const card = this.formatCard(fragment);
        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            success: true,
            operation: 'unpublish',
            card,
            message: `✓ "${fragment.title}" has been unpublished from production.`,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Get a card by ID
     * @param {Object} params - { id: string }
     */
    async getCard(params) {
        const { id } = params;

        if (!id) {
            throw new Error('Card ID is required for get operation');
        }

        const fragment = await this.aemClient.getFragment(id);

        if (!fragment) {
            throw new Error(`Card not found: ${id}`);
        }

        const card = this.formatCard(fragment);
        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            success: true,
            operation: 'get',
            card,
            message: `Found "${fragment.title}"`,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Check if a search query is CTA-related
     * @param {string} query - Search query string
     * @returns {boolean} True if query is searching for CTAs
     */
    static isCTASearch(query) {
        if (!query || typeof query !== 'string') {
            return false;
        }

        const ctaKeywords = [
            'cta',
            'button',
            'link',
            'trial',
            'buy',
            'purchase',
            'checkout',
            'select',
            'start',
            'get started',
            'learn more',
            'free trial',
            'buy now',
            'shop now',
            'subscribe',
        ];

        const lowerQuery = query.toLowerCase();
        return ctaKeywords.some((keyword) => lowerQuery.includes(keyword));
    }

    /**
     * Filter search results to exclude merch-addon elements from CTA matches
     * @param {Array} fragments - Array of fragment objects with fields
     * @param {string} query - Original search query
     * @returns {Array} Filtered fragments where query matches actual CTAs, not addon checkboxes
     */
    static filterCTAResults(fragments, query) {
        if (!query || !fragments || fragments.length === 0) {
            return fragments;
        }

        const lowerQuery = query.toLowerCase();

        return fragments.filter((fragment) => {
            const fields = fragment.fields;
            if (!fields) {
                return true;
            }

            let hasCTAMatch = false;
            let hasOnlyAddonMatch = true;

            Object.keys(fields).forEach((fieldName) => {
                const field = fields[fieldName];
                const fieldValue = field?.value || field;

                if (!fieldValue || typeof fieldValue !== 'string') {
                    return;
                }

                const lowerValue = fieldValue.toLowerCase();
                if (lowerValue.includes(lowerQuery)) {
                    if (
                        fieldValue.includes('checkout-link') ||
                        (fieldValue.includes('<a ') && fieldValue.includes('button')) ||
                        fieldValue.includes('is="checkout-link"')
                    ) {
                        hasCTAMatch = true;
                        hasOnlyAddonMatch = false;
                    }

                    if (!fieldValue.includes('merch-addon') && !fieldValue.includes('addon-')) {
                        hasOnlyAddonMatch = false;
                    }
                }
            });

            return hasCTAMatch || !hasOnlyAddonMatch;
        });
    }

    /**
     * Search for cards with filters
     * @param {Object} params - { surface: string, query?: string, tags?: string[], limit?: number, offset?: number, locale?: string, variant?: string, searchMode?: string }
     */
    async searchCards(params) {
        const { surface, query, tags = [], limit = 10, locale = 'en_US', variant, offset = 0, searchMode = 'FUZZY' } = params;

        console.log('[StudioOperations] searchCards received params:', {
            surface,
            locale,
            query,
            limit,
            variant,
            offset,
            searchMode,
        });

        if (!surface) {
            throw new Error('Surface is required for search operation');
        }

        const requestLimit = Math.min(limit * 2, 50);

        const surfacePath = this.getSurfacePath(surface, locale);
        console.log(`[StudioOperations] getSurfacePath(${surface}, ${locale}) = ${surfacePath}`);

        const searchParams = {
            path: surfacePath,
            query,
            tags,
            modelIds: EDITABLE_FRAGMENT_MODEL_IDS,
            limit: requestLimit,
            offset,
            searchMode,
        };

        console.log('[StudioOperations] Search params with modelIds:', {
            path: surfacePath,
            modelIds: EDITABLE_FRAGMENT_MODEL_IDS,
            limit: requestLimit,
        });

        const fragments = await this.aemClient.searchFragments(searchParams);

        const validFragments = await Promise.all(
            fragments.map(async (fragment, index) => {
                try {
                    const fullFragment = await this.aemClient.getFragment(fragment.id);
                    if (!fullFragment || !fullFragment.id || !fullFragment.fields) {
                        console.warn(
                            `[StudioOperations] Fragment ${fragment.id} (index ${index}) invalid: missing id or fields`,
                        );
                        return null;
                    }
                    return fullFragment;
                } catch (error) {
                    console.warn(
                        `[StudioOperations] Fragment ${fragment.id} (index ${index}) failed to load: ${error.message}`,
                    );
                    return null;
                }
            }),
        );

        let filteredFragments = validFragments.filter((fragment) => fragment !== null);

        if (variant) {
            filteredFragments = filteredFragments.filter((fragment) => {
                const fragmentVariant = Array.isArray(fragment.fields)
                    ? fragment.fields.find((f) => f.name === 'variant')?.values?.[0]
                    : fragment.fields?.variant?.value || fragment.fields?.variant;
                return fragmentVariant === variant;
            });
        }

        if (StudioOperations.isCTASearch(query)) {
            console.log('[StudioOperations] CTA search detected, applying CTA filter to exclude addon checkboxes');
            const beforeCTAFilter = filteredFragments.length;
            filteredFragments = StudioOperations.filterCTAResults(filteredFragments, query);
            console.log(
                `[StudioOperations] CTA filter: ${beforeCTAFilter} fragments → ${filteredFragments.length} fragments (excluded ${beforeCTAFilter - filteredFragments.length} with only addon matches)`,
            );
        }

        console.log(
            `[StudioOperations] Search returned ${fragments.length} fragments, ${filteredFragments.length} valid${variant ? ` (filtered by variant: ${variant})` : ''}, returning ${Math.min(filteredFragments.length, limit)}`,
        );

        const results = filteredFragments.slice(0, limit).map((fragment) => {
            const card = this.formatCard(fragment);
            card.fragmentData = this.formatFragmentForCache(fragment, card);
            return card;
        });

        return {
            success: true,
            operation: 'search',
            results,
            count: results.length,
            message: `Found ${results.length} card${results.length !== 1 ? 's' : ''}`,
            studioLinks: {
                viewFolder: this.urlBuilder.createFolderLink(surface),
            },
        };
    }

    /**
     * Delete a card
     * @param {Object} params - { id: string }
     */
    async deleteCard(params) {
        const { id } = params;

        if (!id) {
            throw new Error('Card ID is required for delete operation');
        }

        const fragment = await this.aemClient.getFragment(id);

        if (!fragment) {
            throw new Error(`Card not found: ${id}`);
        }

        const title = fragment.title;

        await this.aemClient.deleteFragment(fragment.id);

        return {
            success: true,
            operation: 'delete',
            deletedId: id,
            message: `✓ "${title}" has been deleted.`,
        };
    }

    /**
     * Copy/duplicate a card
     * @param {Object} params - { id: string, parentPath?: string, newTitle?: string }
     */
    async copyCard(params) {
        const { id, parentPath, newTitle } = params;

        if (!id) {
            throw new Error('Card ID is required for copy operation');
        }

        const fragment = await this.aemClient.getFragment(id);

        if (!fragment) {
            throw new Error(`Card not found: ${id}`);
        }

        const copyParams = {
            id: fragment.id,
            parentPath: parentPath || fragment.parentPath,
            newTitle: newTitle || `${fragment.title} (Copy)`,
        };

        const newFragment = await this.aemClient.copyFragment(copyParams);

        const card = this.formatCard(newFragment);
        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            success: true,
            operation: 'copy',
            originalId: id,
            card,
            message: `✓ Created copy: "${newFragment.title}"`,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Update card fields
     * @param {Object} params - { id: string, fields: Object, title?: string, tags?: string[] }
     */
    async updateCard(params) {
        const { id, fields, title, tags } = params;

        if (!id) {
            throw new Error('Card ID is required for update operation');
        }

        if (!fields && !title && !tags) {
            throw new Error('At least one of fields, title, or tags must be provided for update');
        }

        const fragment = await this.aemClient.getFragment(id);

        if (!fragment) {
            throw new Error(`Card not found: ${id}`);
        }

        const updateParams = {
            id: fragment.id,
            fields: fields || {},
            title,
            tags,
        };

        const updatedFragment = await this.aemClient.updateFragment(updateParams);

        const card = this.formatCard(updatedFragment);
        const studioLinks = this.urlBuilder.createCardLinks(card);

        const updatedFields = Object.keys(fields || {});
        const updates = [];
        if (title) updates.push('title');
        if (tags) updates.push('tags');
        if (updatedFields.length > 0) updates.push(...updatedFields);

        return {
            success: true,
            operation: 'update',
            card,
            updatedFields: updates,
            message: `✓ Updated "${updatedFragment.title}" (${updates.join(', ')})`,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Preview bulk update for multiple cards (NO execution)
     * @param {Object} params - { fragmentIds: string[], updates?: Object, textReplacements?: Array }
     */
    async previewBulkUpdate(params) {
        const { fragmentIds, updates = {}, textReplacements = [] } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for preview');
        }

        const previews = await Promise.allSettled(
            fragmentIds.map(async (id) => {
                try {
                    const fragment = await this.aemClient.getFragment(id);

                    if (!fragment) {
                        throw new Error(`Card not found: ${id}`);
                    }

                    const changes = [];
                    const currentValues = {};
                    const newValues = {};

                    if (Object.keys(updates).length > 0) {
                        Object.entries(updates).forEach(([field, value]) => {
                            const fieldData = fragment.fields[field];
                            const currentValue = fieldData?.value || fieldData;
                            const newValue = value?.value || value;

                            currentValues[field] = currentValue;
                            newValues[field] = newValue;

                            if (currentValue !== newValue) {
                                changes.push(`${field}: "${currentValue}" → "${newValue}"`);
                            }
                        });
                    }

                    if (textReplacements.length > 0) {
                        textReplacements.forEach(({ field, find, replace }) => {
                            if (field) {
                                const fieldData = fragment.fields[field];
                                const currentValue = fieldData?.value || fieldData;
                                if (currentValue && typeof currentValue === 'string' && currentValue.includes(find)) {
                                    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                    const newValue = currentValue.replace(regex, replace);

                                    currentValues[field] = currentValue;
                                    newValues[field] = newValue;
                                    changes.push(`${field}: "${currentValue}" → "${newValue}"`);
                                }
                            } else {
                                Object.entries(fragment.fields).forEach(([fieldName, fieldData]) => {
                                    const currentValue = fieldData?.value || fieldData;
                                    if (currentValue && typeof currentValue === 'string' && currentValue.includes(find)) {
                                        const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                        const newValue = currentValue.replace(regex, replace);

                                        currentValues[fieldName] = currentValue;
                                        newValues[fieldName] = newValue;
                                        changes.push(`${fieldName}: "${currentValue}" → "${newValue}"`);
                                    }
                                });
                            }
                        });
                    }

                    return {
                        fragmentId: id,
                        fragmentName: fragment.title,
                        path: fragment.path,
                        currentValues,
                        newValues,
                        changes,
                        willUpdate: changes.length > 0,
                    };
                } catch (error) {
                    return {
                        fragmentId: id,
                        fragmentName: id,
                        error: error.message,
                        willUpdate: false,
                    };
                }
            }),
        );

        const successful = previews.filter((r) => r.status === 'fulfilled').map((r) => r.value);
        const itemsWithChanges = successful.filter((item) => item.willUpdate);
        const itemsWithoutChanges = successful.filter((item) => !item.willUpdate && !item.error);

        return {
            success: true,
            operation: 'preview_bulk_update',
            previews: successful,
            summary: {
                total: fragmentIds.length,
                willUpdate: itemsWithChanges.length,
                noChanges: itemsWithoutChanges.length,
                errors: successful.filter((item) => item.error).length,
            },
            message: `Preview: ${itemsWithChanges.length} of ${fragmentIds.length} cards will be updated`,
        };
    }

    /**
     * Preview bulk publish for multiple cards (NO execution)
     * @param {Object} params - { fragmentIds: string[], action?: 'publish' | 'unpublish' }
     */
    async previewBulkPublish(params) {
        const { fragmentIds, action = 'publish' } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for preview');
        }

        const previews = await Promise.allSettled(
            fragmentIds.map(async (id) => {
                try {
                    const fragment = await this.aemClient.getFragment(id);

                    if (!fragment) {
                        throw new Error(`Card not found: ${id}`);
                    }

                    const isPublished = fragment.status === 'PUBLISHED' || fragment.published;
                    const willChange = action === 'publish' ? !isPublished : isPublished;

                    return {
                        fragmentId: id,
                        fragmentName: fragment.title,
                        path: fragment.path,
                        currentStatus: isPublished ? 'published' : 'unpublished',
                        action,
                        willChange,
                        message: willChange
                            ? `Will ${action} "${fragment.title}"`
                            : `Already ${isPublished ? 'published' : 'unpublished'}`,
                    };
                } catch (error) {
                    return {
                        fragmentId: id,
                        fragmentName: id,
                        error: error.message,
                        willChange: false,
                    };
                }
            }),
        );

        const successful = previews.filter((r) => r.status === 'fulfilled').map((r) => r.value);
        const itemsWithChanges = successful.filter((item) => item.willChange);

        return {
            success: true,
            operation: 'preview_bulk_publish',
            action,
            previews: successful,
            summary: {
                total: fragmentIds.length,
                willChange: itemsWithChanges.length,
                alreadyInState: successful.filter((item) => !item.willChange && !item.error).length,
                errors: successful.filter((item) => item.error).length,
            },
            message: `Preview: ${itemsWithChanges.length} of ${fragmentIds.length} cards will be ${action}ed`,
        };
    }

    /**
     * Preview bulk delete for multiple cards (NO execution)
     * @param {Object} params - { fragmentIds: string[] }
     */
    async previewBulkDelete(params) {
        const { fragmentIds } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for preview');
        }

        const previews = await Promise.allSettled(
            fragmentIds.map(async (id) => {
                try {
                    const fragment = await this.aemClient.getFragment(id);

                    if (!fragment) {
                        throw new Error(`Card not found: ${id}`);
                    }

                    return {
                        fragmentId: id,
                        fragmentName: fragment.title,
                        path: fragment.path,
                        willDelete: true,
                        warning: 'This action cannot be undone',
                    };
                } catch (error) {
                    return {
                        fragmentId: id,
                        fragmentName: id,
                        error: error.message,
                        willDelete: false,
                    };
                }
            }),
        );

        const successful = previews.filter((r) => r.status === 'fulfilled').map((r) => r.value);
        const itemsToDelete = successful.filter((item) => item.willDelete);

        return {
            success: true,
            operation: 'preview_bulk_delete',
            previews: successful,
            summary: {
                total: fragmentIds.length,
                willDelete: itemsToDelete.length,
                errors: successful.filter((item) => item.error).length,
            },
            warning: '⚠️ DELETE OPERATION CANNOT BE UNDONE',
            message: `Preview: ${itemsToDelete.length} of ${fragmentIds.length} cards will be permanently deleted`,
        };
    }

    /**
     * Get job status for background operations
     * @param {Object} params - { jobId: string }
     */
    async getJobStatus(params) {
        const { jobId } = params;

        if (!jobId) {
            throw new Error('Job ID is required');
        }

        const status = jobManager.getJobStatus(jobId);

        if (!status.found) {
            return {
                success: false,
                error: status.error,
            };
        }

        return {
            success: true,
            job: status,
        };
    }

    /**
     * Bulk update multiple cards
     * @param {Object} params - { fragmentIds: string[], updates?: Object, textReplacements?: Array }
     */
    async bulkUpdateCards(params) {
        const { fragmentIds, updates = {}, textReplacements = [] } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for bulk update');
        }

        const jobId = jobManager.createJob('bulk_update', fragmentIds.length, {
            updates,
            textReplacements,
        });

        setTimeout(() => this.processBulkUpdate(jobId, params), 0);

        return { jobId };
    }

    /**
     * Process bulk update in background with batching
     * @private
     */
    async processBulkUpdate(jobId, params) {
        const { fragmentIds, updates = {}, textReplacements = [] } = params;
        const batchSize = 5;

        try {
            for (let i = 0; i < fragmentIds.length; i += batchSize) {
                const batch = fragmentIds.slice(i, i + batchSize);

                await Promise.allSettled(
                    batch.map(async (id) => {
                        try {
                            const fragment = await this.aemClient.getFragment(id);

                            if (!fragment) {
                                throw new Error(`Card not found: ${id}`);
                            }

                            let updatedFields = { ...updates };
                            const changes = [];

                            if (textReplacements.length > 0) {
                                textReplacements.forEach(({ field, find, replace }) => {
                                    if (field) {
                                        const fieldData = fragment.fields[field];
                                        const currentValue = fieldData?.value || fieldData;
                                        if (currentValue && typeof currentValue === 'string' && currentValue.includes(find)) {
                                            const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                            const newValue = currentValue.replace(regex, replace);
                                            updatedFields[field] = { value: newValue };
                                            changes.push(`${field}: "${currentValue}" → "${newValue}"`);
                                        }
                                    } else {
                                        Object.entries(fragment.fields).forEach(([fieldName, fieldData]) => {
                                            const currentValue = fieldData?.value || fieldData;
                                            if (
                                                currentValue &&
                                                typeof currentValue === 'string' &&
                                                currentValue.includes(find)
                                            ) {
                                                const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                                const newValue = currentValue.replace(regex, replace);
                                                updatedFields[fieldName] = { value: newValue };
                                                changes.push(`${fieldName}: "${currentValue}" → "${newValue}"`);
                                            }
                                        });
                                    }
                                });
                            }

                            if (Object.keys(updatedFields).length === 0 || changes.length === 0) {
                                jobManager.updateItemStatus(jobId, {
                                    fragmentId: id,
                                    fragmentName: fragment.title,
                                    status: 'skipped',
                                    changes: [],
                                });
                                return;
                            }

                            await this.aemClient.updateFragment({
                                id: fragment.id,
                                fields: updatedFields,
                            });

                            jobManager.updateItemStatus(jobId, {
                                fragmentId: id,
                                fragmentName: fragment.title,
                                status: 'completed',
                                changes,
                            });
                        } catch (error) {
                            jobManager.updateItemStatus(jobId, {
                                fragmentId: id,
                                fragmentName: id,
                                status: 'failed',
                                error: error.message,
                            });
                        }
                    }),
                );
            }

            const jobStatus = jobManager.getJobStatus(jobId);
            jobManager.completeJob(jobId, {
                operation: 'bulk_update',
                total: fragmentIds.length,
                successful: jobStatus.successful,
                failed: jobStatus.failed,
                skipped: jobStatus.skipped,
                message: `✓ Updated ${jobStatus.successful} of ${fragmentIds.length} cards`,
            });
        } catch (error) {
            jobManager.failJob(jobId, error);
        }
    }

    /**
     * Bulk publish/unpublish cards
     * @param {Object} params - { fragmentIds: string[], action: 'publish' | 'unpublish' }
     */
    async bulkPublishCards(params) {
        const { fragmentIds, action = 'publish' } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for bulk publish');
        }

        if (!['publish', 'unpublish'].includes(action)) {
            throw new Error('Action must be either "publish" or "unpublish"');
        }

        const jobId = jobManager.createJob(`bulk_${action}`, fragmentIds.length, { action });

        setTimeout(() => this.processBulkPublish(jobId, params), 0);

        return { jobId };
    }

    /**
     * Process bulk publish in background with batching
     * @private
     */
    async processBulkPublish(jobId, params) {
        const { fragmentIds, action = 'publish' } = params;
        const batchSize = 5;

        try {
            for (let i = 0; i < fragmentIds.length; i += batchSize) {
                const batch = fragmentIds.slice(i, i + batchSize);

                await Promise.allSettled(
                    batch.map(async (id) => {
                        try {
                            const fragment = await this.aemClient.getFragment(id);

                            if (!fragment) {
                                throw new Error(`Card not found: ${id}`);
                            }

                            if (action === 'publish') {
                                await this.aemClient.publishFragment(fragment.id);
                            } else {
                                await this.aemClient.unpublishFragment(fragment.id);
                            }

                            jobManager.updateItemStatus(jobId, {
                                fragmentId: id,
                                fragmentName: fragment.title,
                                status: 'completed',
                                changes: [`${action}ed "${fragment.title}"`],
                            });
                        } catch (error) {
                            jobManager.updateItemStatus(jobId, {
                                fragmentId: id,
                                fragmentName: id,
                                status: 'failed',
                                error: error.message,
                            });
                        }
                    }),
                );
            }

            const jobStatus = jobManager.getJobStatus(jobId);
            const actionPastTense = action === 'publish' ? 'published' : 'unpublished';

            jobManager.completeJob(jobId, {
                operation: `bulk_${action}`,
                total: fragmentIds.length,
                successful: jobStatus.successful,
                failed: jobStatus.failed,
                message: `✓ ${actionPastTense.charAt(0).toUpperCase() + actionPastTense.slice(1)} ${jobStatus.successful} of ${fragmentIds.length} cards`,
            });
        } catch (error) {
            jobManager.failJob(jobId, error);
        }
    }

    /**
     * Bulk delete cards
     * @param {Object} params - { fragmentIds: string[] }
     */
    async bulkDeleteCards(params) {
        const { fragmentIds } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for bulk delete');
        }

        const jobId = jobManager.createJob('bulk_delete', fragmentIds.length);

        setTimeout(() => this.processBulkDelete(jobId, params), 0);

        return { jobId };
    }

    /**
     * Process bulk delete in background with batching
     * @private
     */
    async processBulkDelete(jobId, params) {
        const { fragmentIds } = params;
        const batchSize = 5;

        try {
            for (let i = 0; i < fragmentIds.length; i += batchSize) {
                const batch = fragmentIds.slice(i, i + batchSize);

                await Promise.allSettled(
                    batch.map(async (id) => {
                        try {
                            const fragment = await this.aemClient.getFragment(id);

                            if (!fragment) {
                                throw new Error(`Card not found: ${id}`);
                            }

                            const title = fragment.title;
                            await this.aemClient.deleteFragment(fragment.id);

                            jobManager.updateItemStatus(jobId, {
                                fragmentId: id,
                                fragmentName: title,
                                status: 'completed',
                                changes: [`Deleted "${title}"`],
                            });
                        } catch (error) {
                            jobManager.updateItemStatus(jobId, {
                                fragmentId: id,
                                fragmentName: id,
                                status: 'failed',
                                error: error.message,
                            });
                        }
                    }),
                );
            }

            const jobStatus = jobManager.getJobStatus(jobId);

            jobManager.completeJob(jobId, {
                operation: 'bulk_delete',
                total: fragmentIds.length,
                successful: jobStatus.successful,
                failed: jobStatus.failed,
                message: `✓ Deleted ${jobStatus.successful} of ${fragmentIds.length} cards`,
            });
        } catch (error) {
            jobManager.failJob(jobId, error);
        }
    }

    /**
     * Format fragment to card object
     * @private
     */
    formatCard(fragment) {
        const transformedFields = {};

        if (fragment.fields) {
            if (Array.isArray(fragment.fields)) {
                fragment.fields.forEach((field) => {
                    if (field.name) {
                        const key = field.name;
                        if (field.mimeType) {
                            transformedFields[key] = field.values?.[0] || '';
                        } else if (Array.isArray(field.values)) {
                            transformedFields[key] = field.multiple ? field.values : field.values[0];
                        } else if (field.value !== undefined) {
                            transformedFields[key] = field.value;
                        } else {
                            transformedFields[key] = field.values?.[0];
                        }
                    }
                });
            } else {
                Object.entries(fragment.fields).forEach(([key, value]) => {
                    if (value && typeof value === 'object') {
                        if (value.mimeType) {
                            transformedFields[key] = value.value || value;
                        } else if (value.value !== undefined) {
                            transformedFields[key] = value.value;
                        } else if (Array.isArray(value.values)) {
                            transformedFields[key] = value.multiple ? value.values : value.values[0];
                        } else {
                            transformedFields[key] = value;
                        }
                    } else {
                        transformedFields[key] = value;
                    }
                });
            }
        }

        const model = fragment.model || '/conf/mas/settings/dam/cfm/models/card';

        return {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            model,
            variant: transformedFields.variant || 'unknown',
            size: transformedFields.size || 'wide',
            fields: transformedFields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
            status: fragment.status,
        };
    }

    /**
     * Format fragment for cache (matches I/O Runtime structure)
     * Transforms nested fields to flat structure that merch-card expects
     * @private
     */
    formatFragmentForCache(fragment, card) {
        const transformedFields = {};

        if (fragment.fields) {
            if (Array.isArray(fragment.fields)) {
                fragment.fields.forEach((field) => {
                    if (field.name) {
                        transformedFields[field.name] = field.multiple ? field.values : field.values?.[0] || field.value || '';
                    }
                });
            } else {
                Object.entries(fragment.fields).forEach(([key, value]) => {
                    if (value && typeof value === 'object') {
                        transformedFields[key] = value.mimeType
                            ? value.value
                            : value.multiple
                              ? value.values
                              : value.values?.[0] || value.value || '';
                    } else {
                        transformedFields[key] = value || '';
                    }
                });
            }
        }

        const result = {
            id: fragment.id,
            fields: transformedFields,
            tags: fragment.tags || [],
            settings: fragment.settings || {},
            priceLiterals: fragment.priceLiterals || {},
            dictionary: fragment.dictionary || {},
            placeholders: fragment.placeholders || {},
        };

        return result;
    }

    /**
     * Get AEM path for surface with locale
     * @private
     */
    getSurfacePath(surface, locale = 'en_US') {
        const surfaceMap = {
            commerce: '/content/dam/mas/commerce',
            acom: '/content/dam/mas/acom',
            ccd: '/content/dam/mas/ccd',
            'adobe-home': '/content/dam/mas/adobe-home',
            express: '/content/dam/mas/express',
            sandbox: '/content/dam/mas/sandbox',
            docs: '/content/dam/mas/docs',
            nala: '/content/dam/mas/nala',
        };

        const basePath = surfaceMap[surface] || '/content/dam/mas';
        return `${basePath}/${locale}`;
    }
}
