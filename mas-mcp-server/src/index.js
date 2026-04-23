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
import { TranslationTools } from './tools/translation-tools.js';
import { SURFACES, TRANSLATIONS_ALLOWED_SURFACES } from './config/constants.js';

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
        this.translationTools = new TranslationTools(this.aemClient, this.urlBuilder);
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
                description:
                    'Create a new merch card in AEM. When arrangement_code is provided, auto-populates card fields (title, description, icon) and tags from AOS product data.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Card title (auto-populated from product when arrangement_code provided)',
                        },
                        parentPath: { type: 'string', description: 'Parent folder path in AEM' },
                        variant: { type: 'string', description: 'Card variant (e.g., plans, segment, special-offers)' },
                        size: { type: 'string', description: 'Card size (wide, super-wide)' },
                        fields: {
                            type: 'object',
                            description: 'Additional card fields (merged with product data when arrangement_code provided)',
                        },
                        tags: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'AEM tags (merged with product tags when arrangement_code provided)',
                        },
                        arrangement_code: {
                            type: 'string',
                            description:
                                'Product arrangement code. Auto-populates title, description, icon, and product tags from AOS.',
                        },
                        landscape: {
                            type: 'string',
                            enum: ['PUBLISHED', 'DRAFT'],
                            description: 'Commerce landscape for product lookup (default: PUBLISHED)',
                        },
                    },
                    required: ['parentPath'],
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
                description:
                    'Update a merch card. When arrangement_code is provided, re-enriches card fields and tags from latest AOS product data.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID' },
                        fields: {
                            type: 'object',
                            description: 'Fields to update (merged with product data when arrangement_code provided)',
                        },
                        title: { type: 'string', description: 'New title' },
                        tags: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Tags (merged with product tags when arrangement_code provided)',
                        },
                        arrangement_code: {
                            type: 'string',
                            description: 'Product arrangement code. Re-enriches fields and tags from latest AOS product data.',
                        },
                        landscape: {
                            type: 'string',
                            enum: ['PUBLISHED', 'DRAFT'],
                            description: 'Commerce landscape for product lookup (default: PUBLISHED)',
                        },
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
                description:
                    'Search for merch cards with filters. Supports product-aware filtering by arrangement_code or product_code.',
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
                        arrangement_code: {
                            type: 'string',
                            description: 'Filter cards by product arrangement code (filters by mas:pa/ tag)',
                        },
                        product_code: {
                            type: 'string',
                            description: 'Filter cards by product code (filters by mas:product_code/ tag)',
                        },
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
                description:
                    'Copy/duplicate a merch card. When arrangement_code is provided, re-enriches the copy with latest product data.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID to copy' },
                        parentPath: { type: 'string', description: 'Parent path for the copy (optional)' },
                        newTitle: { type: 'string', description: 'Title for the copied card (optional)' },
                        arrangement_code: {
                            type: 'string',
                            description:
                                'Product arrangement code. Re-enriches the copied card with latest product data from AOS.',
                        },
                        landscape: {
                            type: 'string',
                            enum: ['PUBLISHED', 'DRAFT'],
                            description: 'Commerce landscape for product lookup (default: PUBLISHED)',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'publish_card',
                description: 'Publish a merch card to production. Validates required fields by default.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID to publish' },
                        publishReferences: {
                            type: 'boolean',
                            description: 'Whether to publish referenced fragments (default: true)',
                        },
                        validate: {
                            type: 'boolean',
                            description:
                                'Validate required fields before publishing (default: true). Warns if title/description missing or no product tags.',
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
                name: 'get_card_with_variations',
                description: 'Get a card with all its variations grouped by type (locale, grouped/PZN, promo)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'list_variation_locales',
                description: 'List which locales a card has variations for',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Card ID' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'get_variation_parent',
                description: 'Find the parent (default locale) fragment for a variation',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Variation fragment ID' },
                        path: { type: 'string', description: 'Variation fragment path (alternative to id)' },
                    },
                },
            },
            {
                name: 'create_locale_variation',
                description:
                    'Create a regional locale variation of a card (e.g. fr_FR, de_DE). Card must be in en_US (default locale).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Parent card ID (must be en_US)' },
                        targetLocale: { type: 'string', description: 'Target locale code (e.g. fr_FR, de_DE, ja_JP)' },
                    },
                    required: ['id', 'targetLocale'],
                },
            },
            {
                name: 'create_grouped_variation',
                description: 'Create a grouped (PZN/personalization) variation of a card with targeting tags',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Parent card ID' },
                        pznTags: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Personalization targeting tags (e.g. locale codes like fr_FR, country codes)',
                        },
                        title: { type: 'string', description: 'Custom title for the variation (optional)' },
                    },
                    required: ['id', 'pznTags'],
                },
            },
            {
                name: 'bulk_create_variations',
                description: 'Create locale variations for multiple cards across multiple target locales',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fragmentIds: { type: 'array', items: { type: 'string' }, description: 'Array of parent card IDs' },
                        targetLocales: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of target locale codes',
                        },
                    },
                    required: ['fragmentIds', 'targetLocales'],
                },
            },
            {
                name: 'create_translation_project',
                description: 'Create a translation project with cards and target locales',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Project title' },
                        surface: { type: 'string', description: 'Surface (acom, express, sandbox, nala)' },
                        fragmentPaths: { type: 'array', items: { type: 'string' }, description: 'Card paths to include' },
                        targetLocales: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Target locales (e.g. fr_FR, de_DE)',
                        },
                        projectType: {
                            type: 'string',
                            enum: ['translation', 'rollout'],
                            description: 'Project type (default: translation)',
                        },
                    },
                    required: ['title', 'surface', 'fragmentPaths', 'targetLocales'],
                },
            },
            {
                name: 'submit_translation_project',
                description: 'Submit a translation project to the localization service',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Translation project ID' },
                        surface: { type: 'string', description: 'Surface the project belongs to' },
                    },
                    required: ['id', 'surface'],
                },
            },
            {
                name: 'list_translation_projects',
                description: 'List translation projects for a surface',
                inputSchema: {
                    type: 'object',
                    properties: {
                        surface: {
                            type: 'string',
                            description: 'Surface to list translation projects for',
                            enum: TRANSLATIONS_ALLOWED_SURFACES,
                        },
                        query: { type: 'string', description: 'Search query' },
                        limit: { type: 'number', description: 'Max results (default: 20)' },
                    },
                    required: ['surface'],
                },
            },
            {
                name: 'get_translation_project',
                description: 'Get a translation project by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Translation project ID' },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'check_translation_status',
                description: 'Check which locales a fragment is translated to',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Fragment ID to check translations for' },
                        locales: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific locales to check (defaults to all)',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'list_locales',
                description: 'List supported locales for translations',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'translation_coverage_report',
                description: 'Get translation coverage stats for a surface',
                inputSchema: {
                    type: 'object',
                    properties: {
                        surface: {
                            type: 'string',
                            description: 'Surface to report on',
                            enum: TRANSLATIONS_ALLOWED_SURFACES,
                        },
                        locales: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Specific locales to check (defaults to all)',
                        },
                        limit: { type: 'number', description: 'Max cards to analyze (default: 50)' },
                    },
                    required: ['surface'],
                },
            },
            {
                name: 'find_untranslated_cards',
                description: 'Find cards missing a specific locale translation',
                inputSchema: {
                    type: 'object',
                    properties: {
                        surface: {
                            type: 'string',
                            description: 'Surface to search in',
                            enum: TRANSLATIONS_ALLOWED_SURFACES,
                        },
                        locale: { type: 'string', description: 'Target locale to check for' },
                        limit: { type: 'number', description: 'Max results (default: 20)' },
                    },
                    required: ['surface', 'locale'],
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
                        osi: {
                            type: 'string',
                            description: 'Offer Selector ID (from OST) to assign to the card',
                        },
                        landscape: {
                            type: 'string',
                            enum: ['PUBLISHED', 'DRAFT'],
                            description: 'Commerce landscape to query (default: PUBLISHED). Use DRAFT for unreleased products.',
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
                            description: 'Type of the previous operation (search, bulk_update_cards, bulk_publish_cards, etc.)',
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
                return this.createCardWithEnrichment(args);
            case 'get_card':
                return this.studioOperations.getCard(args);
            case 'update_card':
                return this.updateCardWithEnrichment(args);
            case 'delete_card':
                return this.studioOperations.deleteCard(args);
            case 'search_cards':
                return this.searchCardsWithProductFilter(args);
            case 'copy_card':
                return this.copyCardWithEnrichment(args);
            case 'publish_card':
                return this.publishCardWithValidation(args);
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
            case 'get_fragment_variations':
                return this.studioOperations.getFragmentVariations(args);
            case 'get_card_with_variations':
                return this.studioOperations.getCardWithVariations(args);
            case 'list_variation_locales':
                return this.studioOperations.listVariationLocales(args);
            case 'get_variation_parent':
                return this.studioOperations.getVariationParent(args);
            case 'create_locale_variation':
                return this.studioOperations.createLocaleVariation(args);
            case 'create_grouped_variation':
                return this.studioOperations.createGroupedVariation(args);
            case 'bulk_create_variations':
                return this.studioOperations.bulkCreateVariations(args);

            case 'create_translation_project':
                return this.translationTools.createTranslationProject(args);
            case 'submit_translation_project':
                return this.translationTools.submitTranslationProject(args);
            case 'list_translation_projects':
                return this.translationTools.listTranslationProjects(args);
            case 'get_translation_project':
                return this.translationTools.getTranslationProject(args);
            case 'check_translation_status':
                return this.translationTools.checkTranslationStatus(args);
            case 'list_locales':
                return this.translationTools.listLocales();
            case 'translation_coverage_report':
                return this.translationTools.translationCoverageReport(args);
            case 'find_untranslated_cards':
                return this.translationTools.findUntranslatedCards(args);

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

    enrichFromProduct(product) {
        const primaryItem = product.fulfillable_items?.[0]?.copy || {};
        const productName = product.copy?.name || primaryItem.name || product.name;
        const iconUrl = product.assets?.icons?.svg || product.icon;
        const descriptionCandidates = [
            product.copy?.description,
            product.copy?.short_description,
            primaryItem.description,
            primaryItem.short_description,
        ].filter(Boolean);
        const description = descriptionCandidates.sort((a, b) => b.length - a.length)[0];

        const fields = { cardTitle: productName };
        if (description) fields.description = description;
        if (iconUrl) fields.mnemonics = [{ icon: iconUrl, alt: productName }];

        const tags = [];
        if (product.product_code) tags.push(`mas:product_code/${product.product_code}`);
        if (product.arrangement_code) tags.push(`mas:pa/${product.arrangement_code}`);
        if (product.product_family) tags.push(`mas:product_family/${product.product_family}`);
        if (product.customer_segment) tags.push(`mas:customer_segment/${product.customer_segment}`);
        if (product.market_segments) {
            product.market_segments.forEach((s) => tags.push(`mas:market_segments/${s}`));
        }

        return { fields, tags, productName };
    }

    async createCardWithEnrichment(args) {
        const { arrangement_code, landscape, ...cardArgs } = args;

        if (arrangement_code) {
            const product = await this.fetchMCSProduct(arrangement_code, 'en_US', landscape);
            if (!product) {
                throw new Error(`Product not found in AOS for arrangement code: ${arrangement_code}`);
            }
            const { fields: productFields, tags: productTags, productName } = this.enrichFromProduct(product);
            cardArgs.fields = { ...productFields, ...(cardArgs.fields || {}) };
            cardArgs.tags = [...new Set([...productTags, ...(cardArgs.tags || [])])];
            if (!cardArgs.title) cardArgs.title = productName;
        }

        const result = await this.studioOperations.createCard(cardArgs);
        if (arrangement_code) result.enrichedFromProduct = arrangement_code;
        return result;
    }

    async searchCardsWithProductFilter(args) {
        const { arrangement_code, product_code, ...searchArgs } = args;
        if (!searchArgs.tags) searchArgs.tags = [];
        if (arrangement_code) searchArgs.tags.push(`mas:pa/${arrangement_code}`);
        if (product_code) searchArgs.tags.push(`mas:product_code/${product_code}`);
        return this.studioOperations.searchCards(searchArgs);
    }

    async updateCardWithEnrichment(args) {
        const { arrangement_code, landscape, ...updateArgs } = args;

        if (arrangement_code) {
            const product = await this.fetchMCSProduct(arrangement_code, 'en_US', landscape);
            if (!product) {
                throw new Error(`Product not found in AOS for arrangement code: ${arrangement_code}`);
            }
            const { fields: productFields, tags: productTags } = this.enrichFromProduct(product);
            updateArgs.fields = { ...productFields, ...(updateArgs.fields || {}) };
            updateArgs.tags = [...new Set([...productTags, ...(updateArgs.tags || [])])];
        }

        const result = await this.studioOperations.updateCard(updateArgs);
        if (arrangement_code) result.enrichedFromProduct = arrangement_code;
        return result;
    }

    async copyCardWithEnrichment(args) {
        const { arrangement_code, landscape, ...copyArgs } = args;
        const result = await this.studioOperations.copyCard(copyArgs);

        if (arrangement_code && result.success && result.card?.id) {
            const product = await this.fetchMCSProduct(arrangement_code, 'en_US', landscape);
            if (product) {
                const { fields: productFields, tags: productTags } = this.enrichFromProduct(product);
                await this.studioOperations.updateCard({
                    id: result.card.id,
                    fields: productFields,
                    tags: productTags,
                });
                const refreshed = await this.studioOperations.getCard({ id: result.card.id });
                result.card = refreshed.card;
                result.enrichedFromProduct = arrangement_code;
            }
        }

        return result;
    }

    async publishCardWithValidation(args) {
        const { validate = true, ...publishArgs } = args;

        if (validate) {
            const cardResult = await this.studioOperations.getCard({ id: publishArgs.id });
            const card = cardResult.card;
            const warnings = [];

            if (!card.title || card.title.trim() === '') {
                warnings.push('Card has no title');
            }
            const hasProductTag = (card.tags || []).some((t) => t.startsWith('mas:product_code/') || t.startsWith('mas:pa/'));
            if (!hasProductTag) {
                warnings.push('Card has no product tags — may not be linked to a product');
            }

            if (warnings.length > 0) {
                const result = await this.studioOperations.publishCard(publishArgs);
                result.warnings = warnings;
                return result;
            }
        }

        return this.studioOperations.publishCard(publishArgs);
    }

    async fetchMCSProduct(arrangementCode, locale = 'en_US', landscape = 'PUBLISHED') {
        const aosUrl = this.aosUrl;
        const aosApiKey = this.aosApiKey;
        if (!aosUrl || !aosApiKey) {
            throw new Error('AOS_URL and AOS_API_KEY must be configured');
        }

        const [, country] = locale.split('_');
        const endpoint = `${aosUrl}?country=${encodeURIComponent(country)}&merchant=ADOBE&service_providers=MERCHANDISING,PRODUCT_ARRANGEMENT_V2&sales_channel=DIRECT&buying_program=RETAIL&locale=${encodeURIComponent(locale)}&landscape=${encodeURIComponent(landscape)}&arrangement_code=${encodeURIComponent(arrangementCode)}&page_size=200`;

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

    async createReleaseCards({ arrangement_code, variants, parentPath, locale, osi, landscape }) {
        if (!arrangement_code) throw new Error('arrangement_code is required');
        if (!Array.isArray(variants) || variants.length === 0) throw new Error('variants array is required');
        if (!parentPath) throw new Error('parentPath is required');

        const product = await this.fetchMCSProduct(arrangement_code, 'en_US', landscape);
        if (!product) {
            throw new Error(`Product not found in AOS for arrangement code: ${arrangement_code}`);
        }

        const { fields, tags, productName } = this.enrichFromProduct(product);
        if (osi) fields.osi = osi;

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
