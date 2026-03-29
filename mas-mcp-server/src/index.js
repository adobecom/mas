#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { AuthManager } from '../../io/mcp-server/src/lib/auth-manager.js';
import { AEMClient } from '../../io/mcp-server/src/lib/aem-client.js';
import { StudioURLBuilder } from '../../io/mcp-server/src/lib/studio-url-builder.js';
import { StudioOperations } from '../../io/mcp-server/src/lib/studio-operations.js';

import { AOSClient } from './services/aos-client.js';
import { WCSClient } from './services/wcs-client.js';
import { ProductCatalog } from './services/product-catalog.js';

import { CollectionTools } from './tools/collection-tools.js';
import { OfferTools } from './tools/offer-tools.js';
import { OfferSelectorTools } from './tools/offer-selector-tools.js';
import { CardOfferTools } from './tools/card-offer-tools.js';
import { SURFACES } from './config/constants.js';

/**
 * MAS MCP Server
 * Model Context Protocol server for Merch at Scale operations
 */
export class MASMCPServer {
    constructor(config) {
        this.server = new Server(
            {
                name: 'mas-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            },
        );

        this.authManager = new AuthManager(config.auth.clientId, config.auth.clientSecret);

        if (config.auth.accessToken) {
            this.authManager.setAccessToken(config.auth.accessToken);
        }

        this.aemClient = new AEMClient(config.aem.baseUrl, this.authManager);

        this.aosClient = new AOSClient(this.authManager, {
            baseUrl: config.aos.baseUrl,
            apiKey: config.aos.apiKey,
            landscape: config.aos.landscape,
            environment: config.aos.environment,
        });

        const baseUrl = config.aos.baseUrl || 'https://aos.adobe.io';
        this.aosUrl = baseUrl.endsWith('/offers') ? baseUrl : `${baseUrl}/offers`;
        this.aosApiKey = config.aos.apiKey;

        this.productCatalog = new ProductCatalog(this.authManager, config.products?.endpoint);

        this.wcsClient = new WCSClient(config.wcs);

        this.urlBuilder = new StudioURLBuilder(config.studio?.baseUrl);

        this.collectionTools = new CollectionTools(this.aemClient, this.urlBuilder);
        this.offerTools = new OfferTools(this.aosClient, this.productCatalog, this.urlBuilder);
        this.offerSelectorTools = new OfferSelectorTools(this.aosClient, this.urlBuilder, this.wcsClient);
        this.cardOfferTools = new CardOfferTools(this.aemClient, this.aosClient, this.urlBuilder);
        this.studioOperations = new StudioOperations(this.aemClient, this.urlBuilder);

        this.setupHandlers();
    }

    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: this.getToolDefinitions(),
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                const result = await this.handleToolCall(name, args || {});

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    error: errorMessage,
                                    tool: name,
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    getToolDefinitions() {
        return [
            {
                name: 'create_card',
                description: 'Create a new merch card in AEM',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Card title' },
                        parentPath: { type: 'string', description: 'Parent folder path in AEM' },
                        variant: { type: 'string', description: 'Card variant (e.g., plans, segment, special-offers)' },
                        size: { type: 'string', description: 'Card size (wide, super-wide)' },
                        fields: { type: 'object', description: 'Additional card fields' },
                        tags: { type: 'array', items: { type: 'string' }, description: 'AEM tags' },
                    },
                    required: ['title', 'parentPath'],
                },
            },
            {
                name: 'get_card',
                description: 'Get a merch card by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'update_card',
                description: 'Update a merch card',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID' },
                        fields: { type: 'object', description: 'Fields to update' },
                        title: { type: 'string', description: 'New title' },
                        tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'delete_card',
                description: 'Delete a merch card',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'search_cards',
                description: 'Search for merch cards with filters (requires surface selection)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        surface: {
                            type: 'string',
                            description: 'Surface/folder to search in',
                            enum: Object.values(SURFACES),
                        },
                        query: { type: 'string', description: 'Search query' },
                        tags: { type: 'array', items: { type: 'string' }, description: 'Tag filters' },
                        limit: { type: 'number', description: 'Max results (default: 10)' },
                        locale: { type: 'string', description: 'Locale (default: en_US)' },
                        variant: { type: 'string', description: 'Filter by card variant' },
                        variationType: {
                            type: 'string',
                            description:
                                'Filter by variation type: all (default), default-locale-only (parents), variations-only (regional variations)',
                            enum: ['all', 'default-locale-only', 'variations-only'],
                        },
                    },
                    required: ['surface'],
                },
            },
            {
                name: 'copy_card',
                description: 'Copy/duplicate a merch card',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID to copy' },
                        parentPath: { type: 'string', description: 'Parent path for the copy (optional)' },
                        newTitle: { type: 'string', description: 'Title for the copied card (optional)' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'publish_card',
                description: 'Publish a merch card to production',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID to publish' },
                        publishReferences: {
                            type: 'boolean',
                            description: 'Whether to publish referenced fragments (default: true)',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'unpublish_card',
                description: 'Unpublish a merch card from production',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID to unpublish' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'bulk_update_cards',
                description: 'Update multiple cards at once',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fragmentIds: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of card IDs to update',
                        },
                        updates: {
                            type: 'object',
                            description: 'Common updates to apply to all cards',
                        },
                        textReplacements: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: {
                                        type: 'string',
                                        description: 'Field name (optional - if omitted, searches ALL fields)',
                                    },
                                    find: { type: 'string', description: 'Text to find' },
                                    replace: { type: 'string', description: 'Text to replace with' },
                                },
                                required: ['find', 'replace'],
                            },
                            description: 'Text find/replace operations to apply',
                        },
                    },
                    required: ['fragmentIds'],
                },
            },
            {
                name: 'bulk_publish_cards',
                description: 'Publish or unpublish multiple cards',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fragmentIds: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of card IDs to publish/unpublish',
                        },
                        action: {
                            type: 'string',
                            enum: ['publish', 'unpublish'],
                            description: 'Action to perform: publish or unpublish',
                        },
                    },
                    required: ['fragmentIds', 'action'],
                },
            },
            {
                name: 'bulk_delete_cards',
                description: 'Delete multiple cards',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fragmentIds: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of card IDs to delete',
                        },
                    },
                    required: ['fragmentIds'],
                },
            },
            {
                name: 'preview_bulk_update',
                description: 'Preview bulk update without executing',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fragmentIds: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of card IDs to preview updates for',
                        },
                        updates: { type: 'object', description: 'Field updates to apply' },
                        textReplacements: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    find: { type: 'string' },
                                    replace: { type: 'string' },
                                },
                            },
                            description: 'Text replacements to apply',
                        },
                    },
                    required: ['fragmentIds'],
                },
            },
            {
                name: 'preview_bulk_publish',
                description: 'Preview bulk publish/unpublish without executing',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fragmentIds: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of card IDs to preview',
                        },
                        action: {
                            type: 'string',
                            enum: ['publish', 'unpublish'],
                            description: 'Action to preview',
                        },
                    },
                    required: ['fragmentIds'],
                },
            },
            {
                name: 'preview_bulk_delete',
                description: 'Preview bulk delete without executing',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fragmentIds: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of card IDs to preview delete for',
                        },
                    },
                    required: ['fragmentIds'],
                },
            },
            {
                name: 'get_job_status',
                description: 'Get status of a background job',
                inputSchema: {
                    type: 'object',
                    properties: {
                        jobId: { type: 'string', description: 'Job ID to get status for' },
                    },
                    required: ['jobId'],
                },
            },
            {
                name: 'get_variations',
                description: 'Get all regional locale variations of a fragment',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Fragment ID to find variations for' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'create_collection',
                description: 'Create a new merch card collection',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Collection title' },
                        parentPath: { type: 'string', description: 'Parent folder path' },
                        cardPaths: { type: 'array', items: { type: 'string' }, description: 'Card paths' },
                        fields: { type: 'object', description: 'Additional fields' },
                        tags: { type: 'array', items: { type: 'string' }, description: 'AEM tags' },
                    },
                    required: ['title', 'parentPath'],
                },
            },
            {
                name: 'get_collection',
                description: 'Get a collection by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Collection ID' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'add_cards_to_collection',
                description: 'Add cards to a collection',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Collection ID' },
                        cardPaths: { type: 'array', items: { type: 'string' }, description: 'Card paths to add' },
                        etag: { type: 'string', description: 'ETag for optimistic locking' },
                    },
                    required: ['id', 'cardPaths'],
                },
            },
            {
                name: 'search_collections',
                description: 'Search for merch card collections (requires surface selection)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        surface: {
                            type: 'string',
                            description: 'Surface/folder to search in',
                            enum: Object.values(SURFACES),
                        },
                        query: { type: 'string', description: 'Search query' },
                        limit: { type: 'number', description: 'Max results' },
                        offset: { type: 'number', description: 'Result offset' },
                    },
                    required: ['surface'],
                },
            },
            {
                name: 'search_offers',
                description: 'Search for offers from AOS',
                inputSchema: {
                    type: 'object',
                    properties: {
                        arrangementCode: { type: 'string', description: 'Product arrangement code' },
                        commitment: { type: 'string', description: 'Commitment type' },
                        term: { type: 'string', description: 'Term type' },
                        customerSegment: { type: 'string', description: 'Customer segment' },
                        marketSegment: { type: 'string', description: 'Market segment' },
                        offerType: { type: 'string', description: 'Offer type' },
                        country: { type: 'string', description: 'Country code' },
                        language: { type: 'string', description: 'Language code' },
                        pricePoint: { type: 'string', description: 'Price point' },
                    },
                },
            },
            {
                name: 'get_offer_by_id',
                description: 'Get offer details by offer ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        offerId: { type: 'string', description: 'Offer ID' },
                        country: { type: 'string', description: 'Country code' },
                    },
                    required: ['offerId'],
                },
            },
            {
                name: 'list_products',
                description: 'List Adobe products',
                inputSchema: {
                    type: 'object',
                    properties: {
                        searchText: { type: 'string', description: 'Search text' },
                        customerSegment: { type: 'string', description: 'Customer segment' },
                        marketSegment: { type: 'string', description: 'Market segment' },
                        limit: { type: 'number', description: 'Max results' },
                    },
                },
            },
            {
                name: 'get-product-detail',
                description:
                    'Get enriched product detail with merchandising data (name, description, icons, fulfillable items) from AOS',
                inputSchema: {
                    type: 'object',
                    properties: {
                        arrangementCode: { type: 'string', description: 'Product arrangement code' },
                    },
                    required: ['arrangementCode'],
                },
            },
            {
                name: 'compare_offers',
                description: 'Compare offers for a product',
                inputSchema: {
                    type: 'object',
                    properties: {
                        arrangementCode: { type: 'string', description: 'Product arrangement code' },
                        customerSegment: { type: 'string', description: 'Customer segment' },
                        marketSegment: { type: 'string', description: 'Market segment' },
                        country: { type: 'string', description: 'Country code' },
                    },
                    required: ['arrangementCode'],
                },
            },
            {
                name: 'create_offer_selector',
                description: 'Create or retrieve an offer selector ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        productArrangementCode: { type: 'string', description: 'Product arrangement code' },
                        commitment: { type: 'string', description: 'Commitment type' },
                        term: { type: 'string', description: 'Term type' },
                        customerSegment: { type: 'string', description: 'Customer segment' },
                        marketSegment: { type: 'string', description: 'Market segment' },
                        offerType: { type: 'string', description: 'Offer type' },
                        pricePoint: { type: 'string', description: 'Price point' },
                    },
                    required: ['productArrangementCode', 'customerSegment', 'marketSegment', 'offerType'],
                },
            },
            {
                name: 'resolve_offer_selector',
                description: 'Resolve offers from an offer selector ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        offerSelectorId: { type: 'string', description: 'Offer selector ID' },
                        country: { type: 'string', description: 'Country code' },
                    },
                    required: ['offerSelectorId'],
                },
            },
            {
                name: 'link_card_to_offer',
                description: 'Link a card to an offer selector',
                inputSchema: {
                    type: 'object',
                    properties: {
                        cardId: { type: 'string', description: 'Card ID' },
                        offerSelectorId: { type: 'string', description: 'Offer selector ID' },
                        etag: { type: 'string', description: 'ETag for optimistic locking' },
                    },
                    required: ['cardId', 'offerSelectorId'],
                },
            },
            {
                name: 'validate_card_offer',
                description: 'Validate card-offer consistency',
                inputSchema: {
                    type: 'object',
                    properties: {
                        cardId: { type: 'string', description: 'Card ID' },
                    },
                    required: ['cardId'],
                },
            },
            {
                name: 'create_release_cards',
                description:
                    'Creates merch cards from MCS product data. Pass the arrangement_code and desired variants — the server looks up MCS data and maps fields/tags automatically. No need to construct field values or tags.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        arrangement_code: {
                            type: 'string',
                            description: 'Product arrangement code from MCS (e.g., PA-2244, phsp_direct_individual)',
                        },
                        variants: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Card variants to create (e.g., ["plans", "catalog"])',
                        },
                        parentPath: {
                            type: 'string',
                            description: 'AEM DAM parent folder path (e.g., /content/dam/mas/sandbox/en_US)',
                        },
                    },
                    required: ['arrangement_code', 'variants', 'parentPath'],
                },
            },
            {
                name: 'create_tags',
                description:
                    'Creates tags in AEM taxonomy so they can be applied to fragments. Must be called before applying new MCS-derived tags (product_code, pa, customer_segment, etc.) to cards.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        tags: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Tag IDs to create, e.g. ["mas:product_code/AGIL", "mas:pa/PA-2244"]',
                        },
                    },
                    required: ['tags'],
                },
            },
            {
                name: 'list_context_cards',
                description: 'List cards from a previous operation (search, update, publish, etc.)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fragmentIds: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of fragment IDs from previous operation',
                        },
                        operationType: {
                            type: 'string',
                            description: 'Type of the previous operation (search, bulk_update, bulk_publish, etc.)',
                        },
                    },
                    required: ['fragmentIds'],
                },
            },
        ];
    }

    async handleToolCall(name, args) {
        switch (name) {
            case 'create_card':
                return this.studioOperations.createCard(args);
            case 'get_card':
                return this.studioOperations.getCard(args);
            case 'update_card':
                return this.studioOperations.updateCard(args);
            case 'delete_card':
                return this.studioOperations.deleteCard(args);
            case 'search_cards':
                return this.studioOperations.searchCards(args);
            case 'copy_card':
                return this.studioOperations.copyCard(args);
            case 'publish_card':
                return this.studioOperations.publishCard(args);
            case 'unpublish_card':
                return this.studioOperations.unpublishCard(args);
            case 'bulk_update_cards':
                return this.studioOperations.bulkUpdateCards(args);
            case 'bulk_publish_cards':
                return this.studioOperations.bulkPublishCards(args);
            case 'bulk_delete_cards':
                return this.studioOperations.bulkDeleteCards(args);
            case 'preview_bulk_update':
                return this.studioOperations.previewBulkUpdate(args);
            case 'preview_bulk_publish':
                return this.studioOperations.previewBulkPublish(args);
            case 'preview_bulk_delete':
                return this.studioOperations.previewBulkDelete(args);
            case 'get_job_status':
                return this.studioOperations.getJobStatus(args);
            case 'get_variations':
                return this.studioOperations.getFragmentVariations(args);

            case 'create_collection':
                return this.collectionTools.createCollection(args);
            case 'get_collection':
                return this.collectionTools.getCollection(args);
            case 'add_cards_to_collection':
                return this.collectionTools.addCardsToCollection(args);
            case 'search_collections':
                return this.collectionTools.searchCollections(args);

            case 'search_offers':
                return this.offerTools.searchOffers(args);
            case 'get_offer_by_id':
                return this.offerTools.getOfferById(args);
            case 'list_products':
                return this.listProductsWithMCS(args);
            case 'get-product-detail':
                return this.getProductDetail(args);
            case 'compare_offers':
                return this.offerTools.compareOffers(args);

            case 'create_offer_selector':
                return this.offerSelectorTools.createOfferSelector(args);
            case 'resolve_offer_selector':
                return this.offerSelectorTools.resolveOfferSelector(args);

            case 'link_card_to_offer':
                return this.cardOfferTools.linkCardToOffer(args);
            case 'validate_card_offer':
                return this.cardOfferTools.validateCardOfferConsistency(args);

            case 'create_release_cards':
                return this.createReleaseCards(args);
            case 'create_tags':
                return this.createTags(args);

            case 'list_context_cards':
                return this.studioOperations.listContextCards(args);

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    async listProductsWithMCS(params = {}) {
        const { enrich } = params;

        // Use cache for listing — fast, returns all products
        const cached = await this.offerTools.listProducts(params);
        const cachedProducts = cached.products || [];

        if (cachedProducts.length === 0) {
            return { products: [], total: 0 };
        }

        // If enrich=true and small result set, fetch full MCS data from AOS
        if (enrich && cachedProducts.length <= 5) {
            const enriched = [];
            for (const p of cachedProducts) {
                try {
                    const full = await this.fetchMCSProduct(p.arrangement_code);
                    if (full) enriched.push(full);
                    else enriched.push(p);
                } catch (e) {
                    enriched.push(p);
                }
            }
            return { products: enriched, total: enriched.length };
        }

        return { products: cachedProducts, total: cachedProducts.length };
    }

    async fetchMCSProduct(arrangementCode, locale = 'en_US') {
        const aosUrl = this.aosUrl;
        const aosApiKey = this.aosApiKey;
        if (!aosUrl || !aosApiKey) {
            throw new Error('AOS_URL and AOS_API_KEY must be configured');
        }

        const [, country] = locale.split('_');
        const endpoint = `${aosUrl}?country=${encodeURIComponent(country)}&merchant=ADOBE&service_providers=MERCHANDISING,PRODUCT_ARRANGEMENT_V2&locale=${encodeURIComponent(locale)}&landscape=PUBLISHED&arrangement_code=${encodeURIComponent(arrangementCode)}&page_size=200`;

        const response = await fetch(endpoint, {
            headers: { 'x-api-key': aosApiKey },
        });
        if (!response.ok) {
            throw new Error(`AOS API error: ${response.status} ${response.statusText}`);
        }

        const offers = await response.json();
        if (!offers || offers.length === 0) return null;

        const offer = offers.find((o) => o.merchandising) || offers[0];
        const merch = offer.merchandising || {};

        return {
            arrangement_code: offer.product_arrangement_code || arrangementCode,
            product_code: offer.product_code,
            product_family: offer.product_arrangement_v2?.family,
            customer_segment: offer.customer_segment,
            market_segments: offer.market_segments || [],
            copy: merch.copy || {},
            assets: merch.assets || {},
            links: merch.links || {},
            misc: merch.misc || {},
            fulfillable_items: merch.fulfillable_items || [],
            metadata: merch.metadata || {},
            name: merch.copy?.name,
            icon: merch.assets?.icons?.svg,
        };
    }

    async getProductDetail({ arrangementCode }) {
        if (!arrangementCode) throw new Error('arrangementCode is required');
        const product = await this.fetchMCSProduct(arrangementCode);
        if (!product) {
            throw new Error(`No product found for arrangement code: ${arrangementCode}`);
        }
        return { success: true, product };
    }

    async createReleaseCards({ arrangement_code, variants, parentPath, locale }) {
        if (!arrangement_code) throw new Error('arrangement_code is required');
        if (!Array.isArray(variants) || variants.length === 0) throw new Error('variants array is required');
        if (!parentPath) throw new Error('parentPath is required');

        const product = await this.fetchMCSProduct(arrangement_code, 'en_US');
        if (!product) {
            throw new Error(`Product not found in AOS for arrangement code: ${arrangement_code}`);
        }

        const primaryItem = product.fulfillable_items?.[0]?.copy || {};
        const productName = product.copy.name || primaryItem.name || product.name;
        const iconUrl = product.assets.icons?.svg || product.icon;
        const description =
            product.copy.description ||
            product.copy.short_description ||
            primaryItem.description ||
            primaryItem.short_description;

        const fields = { cardTitle: productName };
        if (description) fields.description = description;
        if (iconUrl) {
            fields.mnemonics = [{ icon: iconUrl, alt: productName }];
        }

        const tags = [];
        if (product.product_code) tags.push(`mas:product_code/${product.product_code}`);
        if (product.arrangement_code) tags.push(`mas:pa/${product.arrangement_code}`);
        if (product.product_family) tags.push(`mas:product_family/${product.product_family}`);
        if (product.customer_segment) tags.push(`mas:customer_segment/${product.customer_segment}`);
        if (product.market_segments) {
            product.market_segments.forEach((s) => tags.push(`mas:market_segments/${s}`));
        }

        const results = [];
        for (const variant of variants) {
            const card = {
                title: `${productName} - ${variant.charAt(0).toUpperCase() + variant.slice(1)}`,
                variant,
                parentPath,
                fields,
                tags,
            };
            try {
                const result = await this.studioOperations.createCard(card);
                results.push(result);
            } catch (e) {
                results.push({ success: false, error: e.message, card });
            }
        }

        const successCount = results.filter((r) => r.success).length;
        return {
            success: successCount === results.length,
            cards: results,
            count: results.length,
            successCount,
            product: {
                name: productName,
                product_code: product.product_code,
                arrangement_code: product.arrangement_code,
                copy: product.copy,
                assets: product.assets,
                links: product.links,
                misc: product.misc,
            },
        };
    }

    async createTags({ tags }) {
        if (!Array.isArray(tags) || tags.length === 0) {
            throw new Error('tags array is required and must not be empty');
        }

        const results = await this.aemClient.ensureTags(tags);
        const created = results.filter((r) => r.created).length;
        return {
            success: true,
            tags: results,
            count: tags.length,
            createdCount: created,
            message: `Ensured ${tags.length} tag(s) exist in AEM taxonomy.`,
        };
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('MAS MCP Server running on stdio');
    }
}

async function main() {
    const config = {
        auth: {
            accessToken: process.env.MAS_ACCESS_TOKEN || process.env.IMS_ACCESS_TOKEN,
            clientId: process.env.IMS_CLIENT_ID,
            clientSecret: process.env.IMS_CLIENT_SECRET,
        },
        aem: {
            baseUrl: process.env.AEM_BASE_URL || 'https://author-p133911-e1313554.adobeaemcloud.com',
        },
        aos: {
            baseUrl: process.env.AOS_BASE_URL || 'https://aos.adobe.io',
            apiKey: process.env.AOS_API_KEY || 'wcms-commerce-ims-user-prod',
            landscape: process.env.AOS_LANDSCAPE || 'PUBLISHED',
            environment: process.env.AOS_ENVIRONMENT || 'PRODUCTION',
        },
        wcs: {
            baseUrl: process.env.WCS_BASE_URL || 'https://www.adobe.com/web_commerce_artifact',
            apiKey: process.env.WCS_API_KEY || 'wcms-commerce-ims-ro-user-milo',
            landscape: process.env.WCS_LANDSCAPE || 'PUBLISHED',
        },
        studio: {
            baseUrl: process.env.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html',
        },
        products: {
            endpoint: process.env.PRODUCTS_ENDPOINT,
        },
    };

    const server = new MASMCPServer(config);
    await server.run();
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
