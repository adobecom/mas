// Core types for MAS MCP Server

/**
 * @typedef {Object} MCPConfig
 * @property {Object} auth
 * @property {string} [auth.accessToken]
 * @property {string} [auth.clientId]
 * @property {string} [auth.clientSecret]
 * @property {Object} aem
 * @property {string} aem.baseUrl
 * @property {Object} aos
 * @property {string} [aos.baseUrl]
 * @property {string} aos.apiKey
 * @property {'PUBLISHED' | 'DRAFT'} [aos.landscape]
 * @property {'PRODUCTION' | 'STAGE'} [aos.environment]
 * @property {Object} [studio]
 * @property {string} [studio.baseUrl]
 * @property {Object} [products]
 * @property {string} [products.endpoint]
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} [refreshToken]
 * @property {number} [expiresAt]
 */

/**
 * @typedef {Object} CardConfig
 * @property {string} variant
 * @property {string} [title]
 * @property {string} [description]
 * @property {Record<string, any>} [fields]
 * @property {string} [parentPath]
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} path
 * @property {string} title
 * @property {string} variant
 * @property {string} size
 * @property {Record<string, any>} fields
 * @property {string[]} tags
 * @property {string} [modified]
 * @property {boolean} [published]
 */

/**
 * @typedef {Object} Collection
 * @property {string} id
 * @property {string} path
 * @property {string} title
 * @property {string[]} cardPaths
 * @property {Record<string, any>} fields
 * @property {string[]} tags
 * @property {string} [modified]
 * @property {boolean} [published]
 */

/**
 * @typedef {Object} Product
 * @property {string} code
 * @property {string} name
 * @property {string} [icon]
 * @property {Record<string, boolean>} customerSegments
 * @property {Record<string, boolean>} marketSegments
 * @property {string} arrangement_code
 * @property {boolean} [draft]
 */

/**
 * @typedef {Object} OfferSearchParams
 * @property {string} [arrangementCode]
 * @property {string} [productName]
 * @property {'YEAR' | 'MONTH' | 'PERPETUAL' | 'TERM_LICENSE'} [commitment]
 * @property {'MONTHLY' | 'ANNUAL' | 'P3Y'} [term]
 * @property {string} [customerSegment]
 * @property {string} [marketSegment]
 * @property {string} [offerType]
 * @property {string} [country]
 * @property {string} [language]
 * @property {string} [pricePoint]
 * @property {'PUBLISHED' | 'DRAFT'} [landscape]
 */

/**
 * @typedef {Object} Offer
 * @property {string} offer_id
 * @property {string} product_arrangement_code
 * @property {string} commitment
 * @property {string} term
 * @property {string} customer_segment
 * @property {string} market_segment
 * @property {string} offer_type
 * @property {string} [price_point]
 * @property {string} language
 * @property {Object} [pricing]
 * @property {Object} pricing.currency
 * @property {string} pricing.currency.symbol
 * @property {string} pricing.currency.format_string
 * @property {Array<Object>} pricing.prices
 * @property {Object} pricing.prices[].price_details
 * @property {Object} pricing.prices[].price_details.display_rules
 * @property {number} pricing.prices[].price_details.display_rules.price
 * @property {string} [planType]
 */

/**
 * @typedef {Object} StudioTags
 * @property {Array<'BASE' | 'TRIAL' | 'PROMOTION'>} [offerType]
 * @property {Array<'ABM' | 'PUF' | 'M2M' | 'PERPETUAL' | 'P3Y'>} [planType]
 * @property {Array<'COM' | 'EDU' | 'GOV'>} [marketSegments]
 * @property {Array<'INDIVIDUAL' | 'TEAM'>} [customerSegment]
 * @property {string[]} [productCode]
 * @property {string[]} [variant]
 * @property {Array<'PUBLISHED' | 'DRAFT'>} [status]
 * @property {Array<'merch-card' | 'merch-card-collection'>} [contentType]
 */

/**
 * @typedef {Object} StudioLinkParams
 * @property {'welcome' | 'content' | 'placeholders' | 'chat'} [page]
 * @property {string} [path]
 * @property {string} [query]
 * @property {StudioTags} [tags]
 * @property {string} [locale]
 * @property {'PUBLISHED' | 'DRAFT'} [commerceLandscape]
 * @property {string} [sortBy]
 * @property {'asc' | 'desc'} [sortDirection]
 */

/**
 * @typedef {Object} FragmentData
 * @property {string} title
 * @property {string} [description]
 * @property {string} model
 * @property {string} parentPath
 * @property {Record<string, any>} fields
 * @property {string[]} [tags]
 */

/**
 * @typedef {Object} Fragment
 * @property {string} id
 * @property {string} path
 * @property {string} title
 * @property {string} [description]
 * @property {string | {id: string}} model
 * @property {Record<string, any>} fields
 * @property {string[]} [tags]
 * @property {string} [modified]
 * @property {boolean} [published]
 * @property {string} [_etag]
 */

export {};
