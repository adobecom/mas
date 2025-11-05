import { AEMClient } from './aem-client.js';
import { StudioURLBuilder } from './studio-url-builder.js';
import { JobManager } from './job-manager.js';

const TAG_MODEL_ID_MAPPING = {
    'mas:studio/content-type/merch-card-collection': 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
    'mas:studio/content-type/merch-card': 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ',
};

const CARD_MODEL_ID = TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'];
const COLLECTION_MODEL_ID = TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card-collection'];
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
     * Search for cards with filters
     * @param {Object} params - { surface: string, query?: string, tags?: string[], limit?: number, offset?: number, locale?: string, variant?: string }
     */
    async searchCards(params) {
        const { surface, query, tags = [], limit = 10, locale = 'en_US', variant, offset = 0 } = params;

        console.log('[StudioOperations] searchCards received params:', {
            surface,
            locale,
            query,
            limit,
            variant,
            offset,
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
            modelIds: [CARD_MODEL_ID],
            limit: requestLimit,
            offset,
        };

        console.log('[StudioOperations] Search params with modelIds:', {
            path: surfacePath,
            modelIds: [CARD_MODEL_ID],
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

        const updatedFragment = await this.aemClient.updateFragment(fragment.id, fields || {}, fragment.etag, title, tags);

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
     * Bulk update multiple cards
     * @param {Object} params - { fragmentIds: string[], updates?: Object, textReplacements?: Array }
     */
    async bulkUpdateCards(params) {
        const { fragmentIds, updates = {}, textReplacements = [] } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for bulk update');
        }

        const jobManager = new JobManager();
        const jobId = await jobManager.createJob('bulk_update', fragmentIds.length);

        this.processConcurrentUpdates(jobManager, jobId, fragmentIds, updates, textReplacements).catch((error) => {
            console.error('[BulkUpdate] Job processing failed:', error);
            jobManager.failJob(jobId, error);
        });

        return {
            success: true,
            jobId,
            status: 'processing',
            operation: 'bulk_update',
            total: fragmentIds.length,
            message: 'Bulk update started. Processing in background...',
        };
    }

    async processConcurrentUpdates(jobManager, jobId, fragmentIds, updates, textReplacements) {
        const results = await Promise.allSettled(
            fragmentIds.map(async (id) => {
                try {
                    let fieldsToUpdate = { ...updates };

                    if (textReplacements.length > 0) {
                        const fragment = await this.aemClient.getFragment(id);
                        const currentFields = this.formatCard(fragment).fields;

                        textReplacements.forEach(({ field, find, replace }) => {
                            if (currentFields[field]) {
                                const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                fieldsToUpdate[field] = currentFields[field].replace(regex, replace);
                            }
                        });
                    }

                    const result = await this.updateCard({ id, fields: fieldsToUpdate });

                    await jobManager.addSuccessfulItem(jobId, {
                        id,
                        title: result.card.title,
                    });

                    return { success: true, id };
                } catch (error) {
                    console.error(`[BulkUpdate] Failed to update card ${id}:`, error);
                    await jobManager.addFailedItem(jobId, {
                        id,
                        error: error.message,
                    });
                    return { success: false, id, error };
                }
            }),
        );

        const job = await jobManager.getJob(jobId);
        await jobManager.completeJob(jobId, {
            message: `✓ Updated ${job.successful.length} of ${job.total} cards${job.failed.length > 0 ? ` (${job.failed.length} failed)` : ''}`,
        });
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

        const jobManager = new JobManager();
        const jobId = await jobManager.createJob(`bulk_${action}`, fragmentIds.length);

        this.processPublishJob(jobManager, jobId, fragmentIds, action).catch((error) => {
            console.error('[BulkPublish] Job processing failed:', error);
            jobManager.failJob(jobId, error);
        });

        return {
            success: true,
            jobId,
            status: 'processing',
            operation: `bulk_${action}`,
            total: fragmentIds.length,
            message: `Bulk ${action} started. Processing in background...`,
        };
    }

    async processPublishJob(jobManager, jobId, fragmentIds, action) {
        for (const id of fragmentIds) {
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

                await jobManager.addSuccessfulItem(jobId, {
                    id,
                    title: fragment.title,
                });
            } catch (error) {
                console.error(`[BulkPublish] Failed to ${action} card ${id}:`, error);
                await jobManager.addFailedItem(jobId, {
                    id,
                    error: error.message,
                });
            }
        }

        const job = await jobManager.getJob(jobId);
        const actionPastTense = action === 'publish' ? 'published' : 'unpublished';
        await jobManager.completeJob(jobId, {
            message: `✓ ${actionPastTense.charAt(0).toUpperCase() + actionPastTense.slice(1)} ${job.successful.length} of ${job.total} cards${job.failed.length > 0 ? ` (${job.failed.length} failed)` : ''}`,
        });
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

        const jobManager = new JobManager();
        const jobId = await jobManager.createJob('bulk_delete', fragmentIds.length);

        this.processDeleteJob(jobManager, jobId, fragmentIds).catch((error) => {
            console.error('[BulkDelete] Job processing failed:', error);
            jobManager.failJob(jobId, error);
        });

        return {
            success: true,
            jobId,
            status: 'processing',
            operation: 'bulk_delete',
            total: fragmentIds.length,
            message: 'Bulk delete started. Processing in background...',
        };
    }

    async processDeleteJob(jobManager, jobId, fragmentIds) {
        for (const id of fragmentIds) {
            try {
                const fragment = await this.aemClient.getFragment(id);

                if (!fragment) {
                    throw new Error(`Card not found: ${id}`);
                }

                const title = fragment.title;
                await this.aemClient.deleteFragment(fragment.id);

                await jobManager.addSuccessfulItem(jobId, {
                    id,
                    title,
                });
            } catch (error) {
                console.error(`[BulkDelete] Failed to delete card ${id}:`, error);
                await jobManager.addFailedItem(jobId, {
                    id,
                    error: error.message,
                });
            }
        }

        const job = await jobManager.getJob(jobId);
        await jobManager.completeJob(jobId, {
            message: `✓ Deleted ${job.successful.length} of ${job.total} cards${job.failed.length > 0 ? ` (${job.failed.length} failed)` : ''}`,
        });
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
