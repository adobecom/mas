import { AEMClient } from '../services/aem-client.js';
import { StudioURLBuilder } from '../utils/studio-url-builder.js';
import { TAG_MODEL_ID_MAPPING, SURFACE_PATHS } from '../config/constants.js';

/**
 * Collection Management Tools
 * MCP tools for creating, reading, updating merch card collections
 */
export class CollectionTools {
    constructor(aemClient, urlBuilder) {
        this.aemClient = aemClient;
        this.urlBuilder = urlBuilder;
    }

    /**
     * Create a new merch card collection
     */
    async createCollection(params) {
        const { title, parentPath, cardPaths = [], fields = {}, tags = [] } = params;

        const fragmentData = {
            title,
            description: `Merch card collection: ${title}`,
            model: TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card-collection'],
            parentPath,
            fields: {
                cardPaths: { value: cardPaths },
                ...fields,
            },
            tags: [...tags, 'mas:studio/content-type/merch-card-collection'],
        };

        const fragment = await this.aemClient.createFragment(fragmentData);

        const collection = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            cardPaths: fragment.fields?.cardPaths?.value || [],
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const studioLinks = this.urlBuilder.createCollectionLinks(collection);

        return {
            collection,
            studioLinks: {
                viewInStudio: studioLinks.view,
            },
        };
    }

    /**
     * Get a collection by ID
     */
    async getCollection(params) {
        const { id } = params;

        const fragment = await this.aemClient.getFragment(id);

        const collection = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            cardPaths: fragment.fields?.cardPaths?.value || [],
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const studioLinks = this.urlBuilder.createCollectionLinks(collection);

        return {
            collection,
            studioLinks: {
                viewInStudio: studioLinks.view,
            },
        };
    }

    /**
     * Update a collection
     */
    async updateCollection(params) {
        const { id, title, fields = {}, tags, etag } = params;

        const updateFields = { ...fields };

        if (title) {
            updateFields.title = { value: title };
        }

        if (tags) {
            updateFields.tags = { value: tags };
        }

        const fragment = await this.aemClient.updateFragment(id, updateFields, etag);

        const collection = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            cardPaths: fragment.fields?.cardPaths?.value || [],
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const studioLinks = this.urlBuilder.createCollectionLinks(collection);

        return {
            collection,
            studioLinks: {
                viewInStudio: studioLinks.view,
            },
        };
    }

    /**
     * Add cards to a collection
     */
    async addCardsToCollection(params) {
        const { id, cardPaths, etag } = params;

        const fragment = await this.aemClient.getFragment(id);
        const existingPaths = fragment.fields?.cardPaths?.value || [];

        const newPaths = [...new Set([...existingPaths, ...cardPaths])];

        const updateFields = {
            cardPaths: { value: newPaths },
        };

        const updatedFragment = await this.aemClient.updateFragment(id, updateFields, etag);

        const collection = {
            id: updatedFragment.id,
            path: updatedFragment.path,
            title: updatedFragment.title,
            cardPaths: updatedFragment.fields?.cardPaths?.value || [],
            fields: updatedFragment.fields,
            tags: updatedFragment.tags || [],
            modified: updatedFragment.modified,
            published: updatedFragment.published,
        };

        const studioLinks = this.urlBuilder.createCollectionLinks(collection);

        return {
            collection,
            studioLinks: {
                viewInStudio: studioLinks.view,
            },
        };
    }

    /**
     * Remove cards from a collection
     */
    async removeCardsFromCollection(params) {
        const { id, cardPaths, etag } = params;

        const fragment = await this.aemClient.getFragment(id);
        const existingPaths = fragment.fields?.cardPaths?.value || [];

        const newPaths = existingPaths.filter((path) => !cardPaths.includes(path));

        const updateFields = {
            cardPaths: { value: newPaths },
        };

        const updatedFragment = await this.aemClient.updateFragment(id, updateFields, etag);

        const collection = {
            id: updatedFragment.id,
            path: updatedFragment.path,
            title: updatedFragment.title,
            cardPaths: updatedFragment.fields?.cardPaths?.value || [],
            fields: updatedFragment.fields,
            tags: updatedFragment.tags || [],
            modified: updatedFragment.modified,
            published: updatedFragment.published,
        };

        const studioLinks = this.urlBuilder.createCollectionLinks(collection);

        return {
            collection,
            studioLinks: {
                viewInStudio: studioLinks.view,
            },
        };
    }

    /**
     * Search for collections (requires surface selection)
     */
    async searchCollections(params) {
        const { surface, query, limit = 50, offset = 0 } = params;

        if (!SURFACE_PATHS[surface]) {
            throw new Error(`Invalid surface: ${surface}. Must be one of: ${Object.keys(SURFACE_PATHS).join(', ')}`);
        }

        const path = SURFACE_PATHS[surface];

        const fragments = await this.aemClient.searchFragments({
            path,
            query,
            tags: ['mas:studio/content-type/merch-card-collection'],
            limit,
            offset,
        });

        const collections = fragments.map((fragment) => ({
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            cardPaths: fragment.fields?.cardPaths?.value || [],
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        }));

        const studioLinks = {
            viewInStudio: this.urlBuilder.buildContentLink({
                path,
                query,
                tags: {
                    contentType: ['merch-card-collection'],
                },
            }),
        };

        return {
            collections,
            studioLinks,
            total: collections.length,
        };
    }

    /**
     * Delete a collection
     */
    async deleteCollection(params) {
        const { id } = params;

        await this.aemClient.deleteFragment(id);

        return {
            success: true,
            message: `Collection ${id} deleted successfully`,
        };
    }

    /**
     * Publish a collection
     */
    async publishCollection(params) {
        const { id } = params;

        await this.aemClient.publishFragment(id);

        return {
            success: true,
            message: `Collection ${id} published successfully`,
        };
    }
}
