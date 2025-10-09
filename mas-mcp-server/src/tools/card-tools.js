import { AEMClient } from '../services/aem-client.js';
import { StudioURLBuilder } from '../utils/studio-url-builder.js';
import { TAG_MODEL_ID_MAPPING, SURFACE_PATHS } from '../config/constants.js';

/**
 * Card Management Tools
 * MCP tools for creating, reading, updating, and deleting merch cards
 */
export class CardTools {
    constructor(aemClient, urlBuilder) {
        this.aemClient = aemClient;
        this.urlBuilder = urlBuilder;
    }

    /**
     * Create a new merch card
     */
    async createCard(params) {
        const { title, parentPath, variant = 'plans', size = 'wide', fields = {}, tags = [] } = params;

        const fragmentData = {
            title,
            description: `Merch card: ${title}`,
            model: TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'],
            parentPath,
            fields: {
                variant: { value: variant },
                size: { value: size },
                ...fields,
            },
            tags,
        };

        const fragment = await this.aemClient.createFragment(fragmentData);

        const card = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            variant,
            size,
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            card,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Get a card by ID
     */
    async getCard(params) {
        const { id } = params;

        const fragment = await this.aemClient.getFragment(id);

        const card = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            variant: fragment.fields?.variant?.value || 'plans',
            size: fragment.fields?.size?.value || 'wide',
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            card,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Update a card
     */
    async updateCard(params) {
        const { id, fields = {}, title, tags, etag } = params;

        const updateFields = { ...fields };

        if (title) {
            updateFields.title = { value: title };
        }

        if (tags) {
            updateFields.tags = { value: tags };
        }

        const fragment = await this.aemClient.updateFragment(id, updateFields, etag);

        const card = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            variant: fragment.fields?.variant?.value || 'plans',
            size: fragment.fields?.size?.value || 'wide',
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            card,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Delete a card
     */
    async deleteCard(params) {
        const { id } = params;

        await this.aemClient.deleteFragment(id);

        return {
            success: true,
            message: `Card ${id} deleted successfully`,
        };
    }

    /**
     * Search for cards with filters (requires surface selection)
     */
    async searchCards(params) {
        const { surface, query, tags, limit = 50, offset = 0 } = params;

        if (!SURFACE_PATHS[surface]) {
            throw new Error(`Invalid surface: ${surface}. Must be one of: ${Object.keys(SURFACE_PATHS).join(', ')}`);
        }

        const path = SURFACE_PATHS[surface];
        const tagFilters = [];

        tagFilters.push('mas:studio/content-type/merch-card');

        if (tags) {
            if (tags.variant?.length) {
                tags.variant.forEach((v) => tagFilters.push(`mas:variant/${v}`));
            }
            if (tags.offerType?.length) {
                tags.offerType.forEach((t) => tagFilters.push(`mas:offer_type/${t.toLowerCase()}`));
            }
            if (tags.planType?.length) {
                tags.planType.forEach((t) => tagFilters.push(`mas:plan_type/${t.toLowerCase()}`));
            }
            if (tags.marketSegments?.length) {
                tags.marketSegments.forEach((s) => tagFilters.push(`mas:market_segments/${s.toLowerCase()}`));
            }
            if (tags.customerSegment?.length) {
                tags.customerSegment.forEach((s) => tagFilters.push(`mas:customer_segment/${s.toLowerCase()}`));
            }
            if (tags.productCode?.length) {
                tags.productCode.forEach((c) => tagFilters.push(`mas:product_code/${c}`));
            }
            if (tags.status?.length) {
                tags.status.forEach((s) => tagFilters.push(`mas:status/${s.toLowerCase()}`));
            }
        }

        const fragments = await this.aemClient.searchFragments({
            path,
            query,
            tags: tagFilters,
            limit,
            offset,
        });

        const cards = fragments.map((fragment) => ({
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            variant: fragment.fields?.variant?.value || 'plans',
            size: fragment.fields?.size?.value || 'wide',
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        }));

        const studioLinks = {
            viewInStudio: this.urlBuilder.buildContentLink({
                path,
                query,
                tags,
            }),
        };

        return {
            cards,
            studioLinks,
            total: cards.length,
        };
    }

    /**
     * List all cards in a surface
     */
    async listCards(params) {
        const { surface, limit = 100 } = params;

        return this.searchCards({
            surface,
            limit,
        });
    }

    /**
     * Duplicate a card
     */
    async duplicateCard(params) {
        const { id, newTitle, parentPath } = params;

        const original = await this.aemClient.getFragment(id);

        const title = newTitle || `${original.title} (Copy)`;
        const targetPath = parentPath || original.path.substring(0, original.path.lastIndexOf('/'));

        const fragmentData = {
            title,
            description: original.description || `Copy of ${original.title}`,
            model: typeof original.model === 'string' ? original.model : original.model.id,
            parentPath: targetPath,
            fields: original.fields,
            tags: original.tags || [],
        };

        const fragment = await this.aemClient.createFragment(fragmentData);

        const card = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            variant: fragment.fields?.variant?.value || 'plans',
            size: fragment.fields?.size?.value || 'wide',
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            card,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Publish a card
     */
    async publishCard(params) {
        const { id } = params;

        await this.aemClient.publishFragment(id);

        return {
            success: true,
            message: `Card ${id} published successfully`,
        };
    }
}
