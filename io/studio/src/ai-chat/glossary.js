/**
 * MAS Glossary — sourced from FluffyJaws on 2026-05-07
 *
 * Compact term definitions used to ground the AI assistant's reasoning.
 * Loaded as a cached preamble in every system prompt that talks to MCP tools
 * or runs intent classification.
 *
 * Schema per entry:
 *   TERM = short definition. Format/example. Resolves via <tool>. Distinct from <neighbor>.
 *
 * Each entry is one to four lines of ~40-80 tokens. Total budget: ~2K tokens.
 *
 * Sourcing rule: every definition came from a FluffyJaws query that cited the
 * Adobe internal wiki. Do NOT hand-edit definitions without re-validating
 * against FluffyJaws — the goal is canonical accuracy, not folk knowledge.
 */

export const MAS_GLOSSARY = `=== MAS GLOSSARY (canonical, from FluffyJaws 2026-05-07) ===

## Commerce identifiers

OSI (Offer Selector ID) = unique ID for an offer-selector query in AOS, representing a set of natural-key filters (PA, plan type, segment, etc.) independent of locale.
  Format: URL-safe Base64 string, ~40-50 chars (e.g. "HYsz3AI88MM6akn1YZdxihp-n-WGYFxAPPajQ2j8dNM").
  Resolves via: AOS POST /offer_selectors (typically via OST) → returns matching offer IDs and pricing.
  Distinct from: offer ID (32-hex), the OST tool itself (UI), SKU/spec ID.

Offer ID = unique identifier for a concrete offer instance (one spec, PA, price point, segment).
  Format: 32-character uppercase hex (e.g. "029538C03BBC21610968B40C499F97A2").
  Resolves via: AOS GET /offers, AOS Offer Validation UI.
  Distinct from: OSI, PA code, spec_id, SKU.

Offer selector = the query object (set of natural keys: PA, commitment, term, segment, channel, etc.) that AOS persists. Its id field IS the OSI.
  Distinct from: OST (the authoring UI tool), and OSI (the ID *of* the selector).

Arrangement code (PA code, product_arrangement_code) = identifier of a Product Arrangement — the bundle of entitlements a customer gets.
  Format: snake_case (e.g. "phsp_direct_individual", "ccsv_enterprise_ml") OR numeric "PA-####" (e.g. "PA-892").
  Resolves via: AOS GET /product_arrangements, list_products MCS lookup.
  Distinct from: product code (SAP), offer ID, product family.

Product code = SAP-originated short code for a product line (CCSV, STKM, APAP, etc.). Reused across multiple PAs.
  Format: uppercase letters/underscores (e.g. "CCSV", "CCSN", "STKM").
  Distinct from: arrangement code, SKU, product family.

Product family = high-level grouping of related PAs for catalog/reporting (e.g. "CC_ALL_APPS", "PHOTOGRAPHY", "MARKETO_ENGAGE").
  Used in: AOS product_arrangement_v2.family field.
  Distinct from: PA code, product code, customer-facing solution names.

## Commerce concepts

Base offer = standard purchase runtime offer at regular (non-promo) price.
  Format: offer type "BASE", price point "REGULAR".
  Card relation: most M@S cards point at one base offer via OSI; WCS resolves it for the card to render regular price + checkout URL.

Trial offer = variation of a base offer granting time-limited free/discounted access before converting to paid.
  Format: offer type "TRIAL", price point like "TRIAL_7_DAY_TWP".
  Card relation: trial-focused cards show trial duration + after-trial pricing.

Commitment = minimum contractual duration of a subscription/license.
  Values: MONTH, YEAR, THREE_YEARS, TERM_LICENSE, PERPETUAL, ACCESS_PASS, etc.
  Card relation: combined with term to derive plan type label ("Annual, billed monthly").

Term (billing term) = how often billing recurs within the commitment window.
  Values: MONTHLY, ANNUAL, P3Y, "--" for perpetual.

Promo / promotion = discounted pricing layered on a base/trial offer, typically as Flex Promo (coupon-like) or legacy PROMOTION offer type.
  Format: Flex Promo codes like "FLX-ACQ-AA-40%-1Y-ABM-STE-AM-S-XXXX"; vanity codes like "back_to_school".
  Card relation: card shows strike-through list price, promo price, "Limited-time offer" badge.

Customer segment = who the offer is for in commerce terms.
  Values: INDIVIDUAL, TEAM. UCv3: "cs=INDIVIDUAL".
  Card relation: M@S cards authored per customer segment.

Market segment = commercial vs education vs government.
  Values: COM, EDU, GOV. UCv3: "ms=COM".
  Card relation: separate cards per market segment for student/commercial pricing.

Landscape = catalog data-plane view used to read offers (draft vs published).
  Values: DRAFT, PUBLISHED. Passed as landscape= query param to WCS/AOS.

WCS (Web Commerce Service) = backend service converting AOS data into "Web Commerce Artifacts" (price, commitment, currency) for adobe.com front-ends.
  Returns: offerId, productArrangementCode, commitment, term, customerSegment, marketSegments, priceDetails, taxDisplay.
  Card relation: M@S cards call WCS with OSIs → WCS returns resolved offer + formatted price for rendering.

## Card / fragment concepts

Merch card = self-contained merchandising web component authored in M@S Studio. Displays an offer's copy, pricing, CTAs for a given surface.
  Storage: AEM Sites content fragment in Odin tenant, delivered as JSON by Freyja.

Content fragment = structured AEM Sites content object storing card fields (copy, pricing bindings, mnemonic, CTAs).
  Path: /content/dam/mas/<surface>/<locale>/<name>.

Fragment ID = unique ID for a specific merch fragment.
  Format: opaque UUID (e.g. "9e742dd9-df33-4537-8d66-0cc2707ed617").
  Visible in: M@S Studio URLs, search results.

Variant = card template style controlling layout (e.g. plans, catalog, mini, fries, ccd-slice).
  Stored as: select field on the card content fragment.
  Example values: plans, plans-students, plans-education, catalog, special-offers, mini, fries, ccd-slice, ccd-suggested, ah-try-buy-widget, ah-promoted-plans, simplified-pricing-express, full-pricing-express.

Locale = language-country combination determining which localized card content/pricing/legal terms ship to a user.
  Format: ISO-style (en_US, fr_FR, de_DE).
  In path: /content/dam/mas/<surface>/<locale>/...

Draft (status) = fragment exists but not yet published; only on author, not in Freyja public endpoints.
  Status value: DRAFT.

Published (status) = fragment pushed to publish, available to Freyja and consuming surfaces.
  Status values: PUBLISHED, ACTIVE.

Modified (status) = fragment has saved changes since last publish; live version is now stale.
  Distinct from: draft (which was never published).

Collection = grouped/ordered set of merch cards driving layouts (plans grids, "Recommended for you" rows).
  Storage: separate content fragment type with ordered references to card fragments.

Placeholder = named slot in a page/experience layout where a card or collection is injected without changing parent HTML.

Mnemonic = short label or badge on a card ("Best value", "Most popular") communicating a key offer attribute.

CTA (call to action) = actionable control on a card — typically a button — routing to checkout, add-to-cart, trial flows.
  Often generated via: OST (URLs and IDs).

## Services & acronyms

AEM = Adobe Experience Manager. Adobe's web CMS. M@S uses AEM Sites (via Odin tenant) as headless CMS for merch card content fragments.

AOS = Available Offer Service. Catalog service returning eligible offers and merchandising metadata for a context.
  M@S relation: OST queries AOS (often via WCS) to bind offers, prices, checkout flows into cards.

MCS = Merchandising Content Service. Manages merchandising copy, icons, assets as AEM content fragments for products/entitlements/promos.
  M@S relation: MCS-managed content reused via fragment paths in AOS/WCS responses; pulls branded product/promo copy into Odin-hosted M@S cards.
  NOT: "Merchandising Catalog System" or other expansions.

IMS = Adobe Identity Management System. Central identity/access for Adobe users, orgs, OAuth clients.
  M@S relation: M@S Studio and mas/io use IMS for author login, authorization, tenant scoping.

Odin = internal AEM Sites tenant for structured headless content. M@S stores merch card content as Odin content fragments in the MaS tenant.

Freyja = Edge Delivery Services API exposing AEM content fragments as JSON over HTTP.
  M@S relation: Freyja delivers Odin-based M@S fragments (cards) as JSON to adobe.com, CCD, Adobe Home, Unified Checkout.

OST (Offer Selector Tool) = authoring UI in M@S Studio that lets authors search/select commerce offers from AOS.
  Connects to: WCS/AOS so authors can attach offer IDs, dynamic prices, checkout URLs to cards.
  Distinct from: OSI (the ID); offer selector (the query object).

MCP = Model Context Protocol — standardized contract for AI tools. In MAS context: mcp-server action exposes search_cards, publish_card, etc.
  NOT: "Merchandising Content Provider" or other expansions.

RAG = Retrieval-Augmented Generation. AI pattern where the LLM retrieves relevant docs at query time.
  M@S relation: used by internal AI assistants (FluffyJaws) for documentation queries; not in the M@S card-delivery runtime.

MAS / Merch at Scale = the Adobe program. Also: "mas/io" specifically refers to the serverless/edge runtime delivering merch content to consuming surfaces.

## Surfaces (where cards live)

acom = Plans and Catalog cards for adobe.com (triples, singles, plans grid, catalog tiles).
  Path: /content/dam/mas/acom/...

acom-cc = Creative Cloud-specific cards (image/product, mini-compare, segment, special-offer) — excludes core Plans/Catalog.
  Use case: CC marketing pages on adobe.com.

acom-dc = Document Cloud-specific cards (Acrobat/Sign product and promo).
  Use case: DC pages on adobe.com.

ccd = In-app Creative Cloud Desktop cards (Home tab "Suggested", Apps tab custom/product cards, mini cards with inline price).
  Use case: drive buy/try and upsell inside CCD.

commerce = Checkout/commerce cards (recommendation, upsell) embedded in Unified Checkout.
  Use case: upsell during checkout on commerce.adobe.com.

adobe-home = Adobe Home Try/Buy widgets (triple/single plans), Apps tab product cards.
  Use case: promote plans to free or lapsed users on Adobe Home.

express = Express-specific cards (plans/product tiles, promos) tied to Express offers.
  Use case: Adobe Express experiences on adobe.com.

sandbox = Experimental/prototype cards. Authors and engineers test templates without touching consumer surfaces.

nala = Stable engineering-owned test/demo cards. Fixtures for Nala automated tests and "kitchen sink" gallery pages.

## Workflows

NPI / release flow = how a new product goes live via M@S:
  1. MCS holds new product metadata (names, copy, icons, links).
  2. WCS/AOS configured so offers/prices resolve per locale/segment.
  3. Authors create/update M@S templates in Studio, attaching offers via OST.
  4. Drafts reviewed (often first in sandbox), then promoted to target surfaces.
  5. Localization workflows produce localized card variants; QA via nala fixtures.
  6. NPI dashboards track surface adoption and rollout.
`;

/**
 * Estimated tokens of the glossary (rough): ~2.0K. Caches as a stable
 * preamble. Update this constant when the glossary content materially
 * changes so cost-tracking telemetry stays accurate.
 */
export const MAS_GLOSSARY_TOKEN_ESTIMATE = 2000;
