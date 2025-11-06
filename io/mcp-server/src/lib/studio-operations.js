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
 * Strip HTML tags from text while preserving the content
 * Used for searching text in HTML-formatted fields
 * @param {string} html - HTML text to strip
 * @returns {string} - Plain text without HTML tags
 */
function stripHtml(html) {
    if (typeof html !== 'string') {
        return '';
    }
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Check if text exists in either raw HTML or stripped plain text
 * Handles both HTML-formatted fields and plain text fields
 * @param {string} value - The field value to search in
 * @param {string} find - The text to find
 * @returns {boolean} - True if found in either raw or stripped version
 */
function textExistsInField(value, find) {
    if (typeof value !== 'string' || typeof find !== 'string') {
        return false;
    }
    return value.includes(find) || stripHtml(value).includes(find);
}

// Create shared JobManager instance for all operations to avoid isolation issues
const sharedJobManager = new JobManager();

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
     * Extract content from slot="footer" attribute
     * @private
     * @param {string} htmlContent - HTML string to parse
     * @returns {Array} Array of footer slot content strings
     */
    static extractFooterSlotContent(htmlContent) {
        const footerSlots = [];

        // Match div or other elements with slot="footer"
        const slotRegex = /<(div|[a-z]+)\s[^>]*slot="footer"[^>]*>(.*?)<\/\1>/gis;
        let match;

        while ((match = slotRegex.exec(htmlContent)) !== null) {
            footerSlots.push(match[2]);
        }

        // Also match slot element itself
        const namedSlotRegex = /<slot\s+name="footer"[^>]*><\/slot>/gis;
        if (namedSlotRegex.test(htmlContent)) {
            // For named slots, we need to extract content from corresponding slot="footer"
            footerSlots.push(htmlContent);
        }

        return footerSlots;
    }

    /**
     * Check if content is inside a merch-addon element
     * @private
     * @param {string} htmlContent - Full HTML content
     * @param {number} matchIndex - Index position to check
     * @returns {boolean} True if position is inside merch-addon
     */
    static isInsideMerchAddon(htmlContent, matchIndex) {
        // Find all merch-addon boundaries
        const addonRegex = /<merch-addon[^>]*>(.*?)<\/merch-addon>/gis;
        let addonMatch;

        while ((addonMatch = addonRegex.exec(htmlContent)) !== null) {
            const addonStart = addonMatch.index;
            const addonEnd = addonMatch.index + addonMatch[0].length;

            if (matchIndex >= addonStart && matchIndex < addonEnd) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extract CTA elements from HTML content
     * Extracts ALL <a> and <button> tags from the content
     * @param {string} htmlContent - HTML string to parse
     * @returns {Array} Array of CTA objects with text and href properties
     */
    static extractCTAElements(htmlContent) {
        if (!htmlContent || typeof htmlContent !== 'string') {
            return [];
        }

        const ctas = [];
        let match;

        // Pattern 1: Extract ALL <a> tags (not limited to footer slots)
        const linkRegex = /<a\s[^>]*>(.*?)<\/a>/gis;

        while ((match = linkRegex.exec(htmlContent)) !== null) {
            const fullElement = match[0];
            const innerText = match[1];

            // Extract href attribute
            const hrefMatch = fullElement.match(/(?:data-)?href=["']([^"']+)["']/i);
            const href = hrefMatch ? hrefMatch[1] : '';

            // Strip HTML tags from inner text to get clean text
            const text = innerText.replace(/<[^>]+>/g, '').trim();

            // Include if there's text or href
            if (text || href) {
                ctas.push({ text, href, type: 'link' });
            }
        }

        // Pattern 2: Extract ALL <button> tags
        const buttonRegex = /<button\s[^>]*>(.*?)<\/button>/gis;

        while ((match = buttonRegex.exec(htmlContent)) !== null) {
            const fullElement = match[0];
            const innerText = match[1];

            // Extract data-href if it exists (some buttons have this)
            const hrefMatch = fullElement.match(/(?:data-)?href=["']([^"']+)["']/i);
            const href = hrefMatch ? hrefMatch[1] : '';

            // Strip HTML tags from inner text to get clean text
            const text = innerText.replace(/<[^>]+>/g, '').trim();

            // Include if there's text
            if (text) {
                ctas.push({ text, href, type: 'button' });
            }
        }

        return ctas;
    }

    /**
     * Filter search results to only include cards with CTAs matching the query - simplified approach
     * @param {Array} fragments - Array of fragment objects with fields
     * @param {string} query - Original search query
     * @returns {Array} Filtered fragments with matching CTA content
     */
    static filterCTAResults(fragments, query) {
        if (!query || !fragments || fragments.length === 0) {
            return fragments;
        }

        const lowerQuery = query.toLowerCase();
        console.log('[StudioOperations] CTA search: simple filtering for links and buttons');
        const beforeCount = fragments.length;

        // Extract meaningful keywords (skip CTA-intent words)
        const skipWords = ['cta', 'button', 'link', 'call', 'action'];
        const queryKeywords = lowerQuery.split(/\s+/).filter((word) => word.length > 2 && !skipWords.includes(word));

        console.log(`[StudioOperations] Searching for keywords: ${queryKeywords.join(', ') || '(any CTA)'}`);

        const filtered = fragments.filter((fragment) => {
            const fields = fragment.fields;
            if (!fields) return true; // Include if no fields to check

            // FIRST: Check if this card has ANY merch-addon elements
            const hasAddonElements = Object.values(fields).some((field) => {
                // Fields have structure: { name, type, multiple, locked, values: [...] }
                let fieldValue = null;
                if (field && field.values && Array.isArray(field.values)) {
                    fieldValue = field.values.join(' '); // Join all values if multiple
                } else if (field && typeof field === 'string') {
                    fieldValue = field; // Direct string field
                }
                return typeof fieldValue === 'string' && fieldValue.includes('<merch-addon');
            });

            // If card has addon elements, exclude it from CTA search results
            if (hasAddonElements) {
                console.log(`[StudioOperations] Excluding card with addon elements: ${fragment.id || fragment.title}`);
                return false;
            }

            // Check ALL fields - no exclusions or restrictions
            for (const fieldName of Object.keys(fields)) {
                const field = fields[fieldName];

                // Fields have structure: { name, type, multiple, locked, values: [...] }
                // Access the actual content from field.values array
                let fieldValue = null;
                if (field && field.values && Array.isArray(field.values)) {
                    fieldValue = field.values.join(' '); // Join all values if multiple
                } else if (field && typeof field === 'string') {
                    fieldValue = field; // Direct string field
                }

                if (!fieldValue || typeof fieldValue !== 'string') continue;

                // Extract CTAs from this field
                const ctas = StudioOperations.extractCTAElements(fieldValue);

                if (ctas.length === 0) continue;

                // If no specific keywords, include any card with CTAs
                if (queryKeywords.length === 0) {
                    console.log(`[StudioOperations] Found CTAs in ${fragment.id || fragment.title || 'fragment'}`);
                    return true;
                }

                // Check if any CTA matches keywords
                for (const cta of ctas) {
                    const ctaContent = `${cta.text} ${cta.href}`.toLowerCase();

                    // Check if ALL keywords are found (more lenient)
                    const hasMatch = queryKeywords.some((keyword) => ctaContent.includes(keyword));

                    if (hasMatch) {
                        console.log(
                            `[StudioOperations] Match found: "${cta.text}" in ${fragment.id || fragment.title || 'fragment'}`,
                        );
                        return true;
                    }
                }
            }

            return false; // No matching CTAs found
        });

        console.log(`[StudioOperations] CTA filter: ${fragments.length} → ${filtered.length} results`);
        return filtered;
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

        console.log('[BulkUpdate] ===== BULK UPDATE STARTED =====');
        console.log('[BulkUpdate] Received fragmentIds:', fragmentIds.length, 'cards');
        console.log('[BulkUpdate] Fragment IDs:', fragmentIds);
        console.log('[BulkUpdate] Text replacements:', textReplacements);

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for bulk update');
        }

        const jobId = await sharedJobManager.createJob('bulk_update', fragmentIds.length);

        this.processConcurrentUpdates(sharedJobManager, jobId, fragmentIds, updates, textReplacements).catch((error) => {
            console.error('[BulkUpdate] Job processing failed:', error);
            sharedJobManager.failJob(jobId, error);
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
        console.log('[BulkUpdate] ===== CONCURRENT PROCESSING STARTED =====');
        console.log('[BulkUpdate] Creating promises for', fragmentIds.length, 'cards');

        const results = await Promise.allSettled(
            fragmentIds.map(async (id, index) => {
                console.log(`[BulkUpdate] ===== Processing card ${index + 1}/${fragmentIds.length}: ${id} =====`);
                try {
                    let fieldsToUpdate = { ...updates };
                    let fragment = null;

                    console.log('[BulkUpdate] Processing card:', {
                        id,
                        updatesFromMCP: JSON.stringify(updates, null, 2),
                        fieldsToUpdateInitial: JSON.stringify(fieldsToUpdate, null, 2),
                        hasTextReplacements: textReplacements.length > 0,
                    });

                    if (textReplacements.length > 0) {
                        fragment = await this.aemClient.getFragment(id);

                        textReplacements.forEach(({ field, find, replace }) => {
                            if (field) {
                                // Specific field lookup - handle both array and object formats
                                let currentValue = null;

                                if (Array.isArray(fragment.fields)) {
                                    const fieldData = fragment.fields.find((f) => f.name === field);
                                    if (fieldData) {
                                        if (Array.isArray(fieldData.values)) {
                                            currentValue = fieldData.values[0];
                                        } else if (fieldData.value !== undefined) {
                                            currentValue = fieldData.value;
                                        }
                                    }
                                } else {
                                    const fieldData = fragment.fields[field];
                                    if (fieldData) {
                                        currentValue = fieldData?.value || (typeof fieldData === 'string' ? fieldData : null);
                                    }
                                }

                                if (textExistsInField(currentValue, find)) {
                                    const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                    const newValue = currentValue.replace(regex, replace);
                                    fieldsToUpdate[field] = newValue;
                                    console.log(`[BulkUpdate] Replaced in field "${field}":`, {
                                        id,
                                        field,
                                        oldValue: currentValue,
                                        newValue,
                                    });
                                }
                            } else {
                                // All fields search - handle both array and object formats
                                if (Array.isArray(fragment.fields)) {
                                    fragment.fields.forEach((field) => {
                                        if (field.name) {
                                            let currentValue = null;
                                            if (Array.isArray(field.values)) {
                                                currentValue = field.values[0];
                                            } else if (field.value !== undefined) {
                                                currentValue = field.value;
                                            }

                                            if (textExistsInField(currentValue, find)) {
                                                const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                                const newValue = currentValue.replace(regex, replace);
                                                fieldsToUpdate[field.name] = newValue;
                                                console.log(`[BulkUpdate] Replaced in field "${field.name}":`, {
                                                    id,
                                                    field: field.name,
                                                    oldValue: currentValue,
                                                    newValue,
                                                });
                                            }
                                        }
                                    });
                                } else {
                                    Object.entries(fragment.fields).forEach(([fieldName, fieldData]) => {
                                        let currentValue = null;
                                        if (fieldData) {
                                            currentValue =
                                                fieldData?.value || (typeof fieldData === 'string' ? fieldData : null);
                                        }

                                        if (textExistsInField(currentValue, find)) {
                                            const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                            const newValue = currentValue.replace(regex, replace);
                                            fieldsToUpdate[fieldName] = newValue;
                                            console.log(`[BulkUpdate] Replaced in field "${fieldName}":`, {
                                                id,
                                                field: fieldName,
                                                oldValue: currentValue,
                                                newValue,
                                            });
                                        }
                                    });
                                }
                            }
                        });

                        console.log('[BulkUpdate] After text replacements:', {
                            id,
                            fieldsToUpdateFinal: JSON.stringify(fieldsToUpdate, null, 2),
                        });
                    }

                    if (Object.keys(fieldsToUpdate).length === 0) {
                        console.log(`[BulkUpdate] Skipping card ${id} - no changes to apply`);
                        await jobManager.addSkippedItem(jobId, {
                            id,
                            title: fragment?.title || id,
                            reason: 'No matching text found',
                        });
                        return { id, skipped: true };
                    }

                    const result = await this.updateCard({ id, fields: fieldsToUpdate });

                    await jobManager.addSuccessfulItem(jobId, {
                        id,
                        title: result.card.title,
                        fieldsChanged: Object.keys(fieldsToUpdate),
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

        console.log('[BulkUpdate] ===== PROMISE.ALLSETTLED COMPLETED =====');
        console.log('[BulkUpdate] Total promises:', results.length);
        console.log('[BulkUpdate] Results breakdown:');
        results.forEach((result, index) => {
            console.log(
                `  [${index + 1}] Status: ${result.status}`,
                result.status === 'fulfilled' ? result.value : result.reason,
            );
        });

        const job = await jobManager.getJob(jobId);
        console.log('[BulkUpdate] Final job state:', {
            total: job.total,
            completed: job.completed,
            successful: job.successful.length,
            failed: job.failed.length,
            skipped: job.skipped.length,
        });

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

        const jobId = await sharedJobManager.createJob(`bulk_${action}`, fragmentIds.length);

        this.processPublishJob(sharedJobManager, jobId, fragmentIds, action).catch((error) => {
            console.error('[BulkPublish] Job processing failed:', error);
            sharedJobManager.failJob(jobId, error);
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

        const jobId = await sharedJobManager.createJob('bulk_delete', fragmentIds.length);

        this.processDeleteJob(sharedJobManager, jobId, fragmentIds).catch((error) => {
            console.error('[BulkDelete] Job processing failed:', error);
            sharedJobManager.failJob(jobId, error);
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
     * Preview bulk update (shows changes without executing)
     * @param {Object} params - { fragmentIds: string[], updates?: Object, textReplacements?: Array }
     */
    async previewBulkUpdate(params) {
        const { fragmentIds, updates = {}, textReplacements = [] } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for preview');
        }

        const previews = [];
        let willUpdate = 0;
        let noChanges = 0;
        let errors = 0;

        console.log('[Studio Ops] previewBulkUpdate called with:', {
            fragmentIds: fragmentIds.length,
            textReplacements,
            updates,
        });

        for (const id of fragmentIds) {
            try {
                const fragment = await this.aemClient.getFragment(id);
                console.log(`[Studio Ops] Fragment ${id} loaded:`, {
                    title: fragment.title,
                    fieldNames: fragment.fields.map((f) => f.name),
                });

                let fieldsToUpdate = { ...updates };
                const changes = [];
                const currentValues = {};
                const newValues = {};

                if (textReplacements.length > 0) {
                    textReplacements.forEach(({ field, find, replace }) => {
                        console.log(
                            `[Studio Ops] Processing replacement: field=${field}, find="${find}", replace="${replace}"`,
                        );

                        if (field) {
                            // Specific field lookup - handle both array and object formats
                            let currentValue = null;

                            if (Array.isArray(fragment.fields)) {
                                const fieldData = fragment.fields.find((f) => f.name === field);
                                if (fieldData) {
                                    if (Array.isArray(fieldData.values)) {
                                        currentValue = fieldData.values[0];
                                    } else if (fieldData.value !== undefined) {
                                        currentValue = fieldData.value;
                                    }
                                }
                            } else {
                                const fieldData = fragment.fields[field];
                                if (fieldData) {
                                    currentValue = fieldData?.value || (typeof fieldData === 'string' ? fieldData : null);
                                }
                            }

                            const found = textExistsInField(currentValue, find);
                            console.log(`[Studio Ops] Field-specific search in "${field}":`, {
                                type: typeof currentValue,
                                length: typeof currentValue === 'string' ? currentValue.length : 'n/a',
                                rawMatch: currentValue && currentValue.includes(find),
                                stripHtmlMatch: currentValue && stripHtml(currentValue).includes(find),
                                found,
                            });

                            if (found) {
                                const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                const newValue = currentValue.replace(regex, replace);
                                fieldsToUpdate[field] = newValue;
                                changes.push(`${field}: "${find}" → "${replace}"`);
                                currentValues[field] = currentValue;
                                newValues[field] = newValue;
                            }
                        } else {
                            // All fields search - handle both array and object formats
                            console.log(`[Studio Ops] All-fields search for "${find}"`);
                            if (Array.isArray(fragment.fields)) {
                                fragment.fields.forEach((field) => {
                                    if (field.name) {
                                        let currentValue = null;
                                        if (Array.isArray(field.values)) {
                                            currentValue = field.values[0];
                                        } else if (field.value !== undefined) {
                                            currentValue = field.value;
                                        }

                                        const hasMatch = textExistsInField(currentValue, find);

                                        if (hasMatch) {
                                            console.log(`[Studio Ops] ✓ Match found in "${field.name}":`, {
                                                valueSnippet: currentValue.substring(0, 100),
                                                rawMatch: currentValue.includes(find),
                                                stripHtmlMatch: stripHtml(currentValue).includes(find),
                                                find,
                                            });
                                            const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                            const newValue = currentValue.replace(regex, replace);
                                            fieldsToUpdate[field.name] = newValue;
                                            changes.push(`${field.name}: "${find}" → "${replace}"`);
                                            currentValues[field.name] = currentValue;
                                            newValues[field.name] = newValue;
                                        }
                                    }
                                });
                            } else {
                                Object.entries(fragment.fields).forEach(([fieldName, fieldData]) => {
                                    let currentValue = null;
                                    if (fieldData) {
                                        currentValue = fieldData?.value || (typeof fieldData === 'string' ? fieldData : null);
                                    }

                                    const hasMatch = textExistsInField(currentValue, find);

                                    if (hasMatch) {
                                        console.log(`[Studio Ops] ✓ Match found in "${fieldName}":`, {
                                            valueSnippet: currentValue.substring(0, 100),
                                            rawMatch: currentValue.includes(find),
                                            stripHtmlMatch: stripHtml(currentValue).includes(find),
                                            find,
                                        });
                                        const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                                        const newValue = currentValue.replace(regex, replace);
                                        fieldsToUpdate[fieldName] = newValue;
                                        changes.push(`${fieldName}: "${find}" → "${replace}"`);
                                        currentValues[fieldName] = currentValue;
                                        newValues[fieldName] = newValue;
                                    }
                                });
                            }
                        }
                    });
                }

                const hasChanges = Object.keys(fieldsToUpdate).length > 0;
                if (hasChanges) {
                    willUpdate++;
                } else {
                    noChanges++;
                }

                previews.push({
                    fragmentId: id,
                    fragmentName: fragment.title,
                    willUpdate: hasChanges,
                    changes,
                    currentValues,
                    newValues,
                });
            } catch (error) {
                errors++;
                previews.push({
                    fragmentId: id,
                    fragmentName: id,
                    willUpdate: false,
                    error: error.message,
                });
            }
        }

        return {
            operation: 'preview_bulk_update',
            previews,
            summary: { willUpdate, noChanges, errors },
        };
    }

    /**
     * Preview bulk publish/unpublish (shows what will change)
     * @param {Object} params - { fragmentIds: string[], action: 'publish' | 'unpublish' }
     */
    async previewBulkPublish(params) {
        const { fragmentIds, action = 'publish' } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for preview');
        }

        if (!['publish', 'unpublish'].includes(action)) {
            throw new Error('Action must be either "publish" or "unpublish"');
        }

        const previews = [];
        let willChange = 0;
        let alreadyInState = 0;
        let errors = 0;

        for (const id of fragmentIds) {
            try {
                const fragment = await this.aemClient.getFragment(id);
                const isPublished = fragment.status === 'PUBLISHED' || fragment.status === 'Published';
                const needsChange = (action === 'publish' && !isPublished) || (action === 'unpublish' && isPublished);

                if (needsChange) {
                    willChange++;
                } else {
                    alreadyInState++;
                }

                previews.push({
                    fragmentId: id,
                    fragmentName: fragment.title,
                    currentStatus: fragment.status,
                    willChange: needsChange,
                });
            } catch (error) {
                errors++;
                previews.push({
                    fragmentId: id,
                    fragmentName: id,
                    willChange: false,
                    error: error.message,
                });
            }
        }

        return {
            operation: 'preview_bulk_publish',
            action,
            previews,
            summary: { willChange, alreadyInState, errors },
        };
    }

    /**
     * Preview bulk delete (shows what will be deleted)
     * @param {Object} params - { fragmentIds: string[] }
     */
    async previewBulkDelete(params) {
        const { fragmentIds } = params;

        if (!fragmentIds || fragmentIds.length === 0) {
            throw new Error('At least one fragment ID is required for preview');
        }

        const previews = [];
        let willDelete = 0;
        let notFound = 0;
        let errors = 0;

        for (const id of fragmentIds) {
            try {
                const fragment = await this.aemClient.getFragment(id);

                willDelete++;
                previews.push({
                    fragmentId: id,
                    fragmentName: fragment.title,
                    willDelete: true,
                });
            } catch (error) {
                if (error.message.includes('not found')) {
                    notFound++;
                } else {
                    errors++;
                }
                previews.push({
                    fragmentId: id,
                    fragmentName: id,
                    willDelete: false,
                    error: error.message,
                });
            }
        }

        return {
            operation: 'preview_bulk_delete',
            previews,
            summary: { willDelete, notFound, errors },
        };
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

    /**
     * Get job status for bulk operations
     * @param {Object} params - { jobId: string }
     * @returns {Promise<Object>} - Job status information
     */
    async getJobStatus(params) {
        const { jobId } = params;

        if (!jobId) {
            throw new Error('jobId parameter is required');
        }

        const job = await sharedJobManager.getJob(jobId);

        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        return {
            jobId: job.jobId,
            type: job.type,
            status: job.status,
            total: job.total,
            completed: job.completed,
            successful: job.successful,
            failed: job.failed,
            skipped: job.skipped,
            successCount: job.successful.length,
            failureCount: job.failed.length,
            skippedCount: job.skipped.length,
            startedAt: job.startedAt,
            updatedAt: job.updatedAt,
            completedAt: job.completedAt,
            percentage: job.total > 0 ? Math.round((job.completed / job.total) * 100) : 0,
        };
    }
}
