/**
 * GENERATED FILE — do not edit by hand.
 * Source: src/ai-chat/knowledge/*.md — regenerate with `npm run build:knowledge`.
 * The corpus sync test fails when this file is out of date.
 */

export const KNOWLEDGE_CHUNKS = [
    {
        "id": "advanced-tools.md#0",
        "topic": "advanced-tools",
        "title": "Advanced tools in MAS Studio",
        "section": "What is on the Advanced tools page?",
        "keywords": [
            "platform",
            "authoring",
            "advanced tools in mas studio"
        ],
        "text": "Advanced tools is the hub at the bottom of the side navigation that gathers the tools an author needs occasionally rather than daily. It links to four of them: Bulk publish, to schedule and publish many items across regions; Global settings, to configure the rules and defaults of a surface; Masks, to author reusable card overlays applied at delivery time; and Offer mapping, to substitute offers by geo at delivery time as a fallback to promotion mappings.\n\nThe page is only a hub. Each card opens the tool for the surface that is currently selected, so switch surface before entering if you are working on another one."
    },
    {
        "id": "advanced-tools.md#1",
        "topic": "advanced-tools",
        "title": "Advanced tools in MAS Studio",
        "section": "Why do I see fewer tools than someone else?",
        "keywords": [
            "platform",
            "authoring",
            "advanced tools in mas studio"
        ],
        "text": "Bulk publish is shown to every author. Global settings, Masks and Offer mapping are shown only when you have the permission for the current surface, which is the surface's power users group or MAS administrator, and the card is simply left out when you do not. A few internal surfaces, namely commerce, sandbox and nala, limit those three tools to administrators.\n\nThe three gated tools share one permission, so an author who can open global settings for a surface can also open masks and offer mapping for it. The access page explains how to request the group."
    },
    {
        "id": "bulk-operations.md#0",
        "topic": "bulk-operations",
        "title": "Bulk Operations in MAS Studio",
        "section": "Can the AI assistant update or publish many cards at once?",
        "keywords": [
            "bulk",
            "bulk update",
            "bulk publish",
            "bulk unpublish",
            "publish multiple",
            "batch",
            "mass update",
            "find and replace",
            "preview"
        ],
        "text": "No. The assistant does not run bulk updates or bulk publishes, and it has no\noperation for either. Bulk work happens in Studio itself, which has a purpose\nbuilt UI for it with preview, snapshot and revert. If you ask the assistant to\nchange or publish a set of cards, it points you here rather than attempting it.\n\nFor a handful of cards, ask for them one at a time: a single card update or\npublish is still something the assistant does, each with its own confirmation."
    },
    {
        "id": "bulk-operations.md#1",
        "topic": "bulk-operations",
        "title": "Bulk Operations in MAS Studio",
        "section": "How do I update many cards at once in Studio?",
        "keywords": [
            "bulk",
            "bulk update",
            "bulk publish",
            "bulk unpublish",
            "publish multiple",
            "batch",
            "mass update",
            "find and replace",
            "preview"
        ],
        "text": "Use the Select button in the Fragments toolbar to multi-select cards, then apply\nthe change to the selection. For large batches, use a bulk publish project under\nAdvanced tools."
    },
    {
        "id": "bulk-operations.md#2",
        "topic": "bulk-operations",
        "title": "Bulk Operations in MAS Studio",
        "section": "What is the Bulk Publishing page in Studio?",
        "keywords": [
            "bulk",
            "bulk update",
            "bulk publish",
            "bulk unpublish",
            "publish multiple",
            "batch",
            "mass update",
            "find and replace",
            "preview"
        ],
        "text": "Studio has a bulk publishing feature built around bulk publish projects, reached\nfrom Advanced tools in the side navigation. A saved project holds a list of\nfragment paths and target locales; its items are picked with an items selector\nspanning cards, collections, and placeholders, and items already in the project\nare skipped with a warning. Publishing a project dispatches an asynchronous\nbackend worker (the request is accepted immediately and runs in the background)\nthat resolves every path in every selected locale, takes a snapshot of the\ncurrent published state, and then publishes the resolved fragments. The project\nends in one of three statuses: Published, Partially published, or Failed.\nFragments that do not exist in a target locale are reported as not localized\nrather than failing silently. Because a snapshot is taken before publishing, a\nbulk publish can be reverted, and Studio checks whether entries were modified\nafter the snapshot before allowing a revert."
    },
    {
        "id": "bulk-operations.md#3",
        "topic": "bulk-operations",
        "title": "Bulk Operations in MAS Studio",
        "section": "Can I bulk delete cards?",
        "keywords": [
            "bulk",
            "bulk update",
            "bulk publish",
            "bulk unpublish",
            "publish multiple",
            "batch",
            "mass update",
            "find and replace",
            "preview"
        ],
        "text": "No. Deletion is not performed by the assistant at all, in bulk or one at a time.\nIf you ask to delete cards, the assistant declines and directs you to MAS Studio,\nwhere fragments are deleted individually through the UI with a confirmation\ndialog. This is a deliberate safety restriction: deletion is destructive and\ncannot be previewed and approved the way an edit can."
    },
    {
        "id": "bulk-operations.md#4",
        "topic": "bulk-operations",
        "title": "Bulk Operations in MAS Studio",
        "section": "How do I see the cards from my last search?",
        "keywords": [
            "bulk",
            "bulk update",
            "bulk publish",
            "bulk unpublish",
            "publish multiple",
            "batch",
            "mass update",
            "find and replace",
            "preview"
        ],
        "text": "Ask the assistant \"show me those cards again\" or \"list the cards from our last\nsearch\". It renders the cards referenced by the previous operation, using the\nfragment IDs stored in the conversation context. If there is no previous\noperation in the conversation, it tells you so rather than guessing. Fragment IDs\nare AEM UUIDs and cannot be derived from card titles, so the assistant never\ninvents them."
    },
    {
        "id": "card-anatomy.md#0",
        "topic": "card-anatomy",
        "title": "Card anatomy, the parts a card can render",
        "section": "What decides what shows up on a card",
        "keywords": [
            "platform",
            "card anatomy",
            "the parts a card can render"
        ],
        "text": "A card fragment's fields don't render directly, each one is placed into a named part of the card, things like the badge, the title, or the footer of CTAs. Whether a given part appears at all, and where exactly it lands, depends on the card's template (its `variant` in code): a template defines a mapping from field names to parts, and a field with no entry in that mapping is simply never shown, no matter what value it has."
    },
    {
        "id": "card-anatomy.md#1",
        "topic": "card-anatomy",
        "title": "Card anatomy, the parts a card can render",
        "section": "The parts every card can potentially have, in the order they render",
        "keywords": [
            "platform",
            "card anatomy",
            "the parts a card can render"
        ],
        "text": "Mnemonics (small icons) come first, followed by a trial badge, the card's allowed size, its internal name, title, badge, subtitle, and prices. Next come the background image, an image, a backgrounds layer, then the background color and border color. Then the description group renders as a unit: promo text, the main description, a short description, description links turned into buttons, a callout, a quantity selector, and a \"what's included\" list, all in that fixed order. After that come extra features, the \"what's included\" divider color, an add-on and its confirmation text, custom fields, a secure-transaction label, See Terms (`upt-link`) links, and finally the CTAs footer and analytics tagging. A card template can skip any of these, but it can't reorder them."
    },
    {
        "id": "card-anatomy.md#2",
        "topic": "card-anatomy",
        "title": "Card anatomy, the parts a card can render",
        "section": "What a template's mapping actually says",
        "keywords": [
            "platform",
            "card anatomy",
            "the parts a card can render"
        ],
        "text": "For a given part, the mapping tells the renderer what kind of tag to wrap the content in, which named slot to place it into, and sometimes extra detail like a maximum character count with a tooltip for the full text, or a button size for CTAs. A part with no mapping entry for the current template is dropped entirely rather than shown with default styling."
    },
    {
        "id": "card-anatomy.md#3",
        "topic": "card-anatomy",
        "title": "Card anatomy, the parts a card can render",
        "section": "Common questions",
        "keywords": [
            "platform",
            "card anatomy",
            "the parts a card can render"
        ],
        "text": "Why does a field have a value on the fragment but never appears on the card: the card's template has no mapping entry for that field; check the template's own field list rather than assuming every field always renders. Why does changing a field's order in the fragment editor not change where it appears on the card: layout order is fixed by the template, not by field order in the source data. Why is my text cut off with a \"...\" and a tooltip: the part has a maximum character count configured for that template, and the full text is still available on hover."
    },
    {
        "id": "card-price.md#0",
        "topic": "card-price",
        "title": "Where a card's price comes from",
        "section": "Where does the number on a card come from?",
        "keywords": [
            "platform",
            "pricing",
            "where a card's price comes from"
        ],
        "text": "An author never types in a price. In Studio, an author picks an offer with the Offer Selector Tool, which stores that offer's ID on the card. When the card renders in a browser, that ID is used to ask Adobe's Web Commerce Service for the current price, and the number that comes back is what gets shown. Because the price is fetched live every time the card renders, a catalog price change reaches every card automatically, without anyone re-editing content."
    },
    {
        "id": "card-price.md#1",
        "topic": "card-price",
        "title": "Where a card's price comes from",
        "section": "How are country and locale figured out for a price?",
        "keywords": [
            "platform",
            "pricing",
            "where a card's price comes from"
        ],
        "text": "Two separate things can point at different countries. The page's locale, such as French for France, decides which language content is fetched. The country used to price the offer normally comes from the country part of that locale, but an explicit country setting overrides it, so a French-language page can still show a price in a different country's currency. That is expected behavior, not a bug. The visitor's own country is only a fallback, not an override: MAS reads the signed-in visitor's country cookie only when the page gives no country at all, neither as a setting nor as part of the locale. Milo pages always pass a full locale such as `fr_FR` from the page's URL prefix, so there the visitor's location changes prices only when the page turns on `mas-geo-detection`."
    },
    {
        "id": "card-price.md#2",
        "topic": "card-price",
        "title": "Where a card's price comes from",
        "section": "When does a price include tax and when does it not?",
        "keywords": [
            "platform",
            "pricing",
            "where a card's price comes from"
        ],
        "text": "Whether a price shows tax included, shows tax added separately, or shows no tax label at all is normally computed automatically from the buyer's country, language and customer segment, not set by hand on each card. Business and university offers default to showing the price without tax; individual and student offers default to showing the price with tax included, and a handful of countries override this default outright. An author can still force a specific tax display on one price, which skips the automatic calculation."
    },
    {
        "id": "card-price.md#3",
        "topic": "card-price",
        "title": "Where a card's price comes from",
        "section": "How does a card pick which promo code to use?",
        "keywords": [
            "platform",
            "pricing",
            "where a card's price comes from"
        ],
        "text": "A promo code can reach a card's price in three ways, and the most specific one wins. A code set directly on one price or button beats a code set once for the whole card, and the card-wide code only applies when nothing more specific is set. A server-side promotion can also rewrite offers and inject a promo code into a fragment before it ever reaches the browser. There is also a special value, cancel-context, that an author can set on one element to mean \"no promo here\"; it is not a real promo code and is never sent to the pricing service."
    },
    {
        "id": "card-price.md#4",
        "topic": "card-price",
        "title": "Where a card's price comes from",
        "section": "Why can a price look wrong or out of date right after a change?",
        "keywords": [
            "platform",
            "pricing",
            "where a card's price comes from"
        ],
        "text": "Prices are cached in two places that do not automatically know about each other: the browser keeps its own short-lived cache of recent prices, and the server that builds the card also keeps a cache it fills in ahead of time. A promo or offer change has to work through both before every viewer sees it. Refreshing the browser's cache does not guarantee a fresh price either, because a failed refresh falls back to the old cached value rather than showing nothing."
    },
    {
        "id": "card-variants.md#0",
        "topic": "card-variants",
        "title": "Card templates (the variant field)",
        "section": "Template or variant?",
        "keywords": [
            "platform",
            "authoring",
            "card templates (the variant field)",
            "variant",
            "variants",
            "template",
            "templates",
            "card type",
            "which template",
            "catalog",
            "plans",
            "plans-v2",
            "pro",
            "product",
            "segment",
            "mini",
            "slice",
            "suggested",
            "fries",
            "special offers",
            "compare chart",
            "express",
            "ccd",
            "picker"
        ],
        "text": "They are the same thing. Authors and Studio call it the **template**: the card editor's field, the search filter, the settings dialogs and the side navigation are all labelled \"Template\". The code and the stored fragment still call it the **variant**: the card's `variant` field, `variant-picker.js`, the `variants/` folder in the web components, and the `variant` attribute on `merch-card`. \"Variant\" is the older name for authors. Say \"template\" to people, and use `variant` only when naming the code, the field or an attribute.\n\nDo not confuse a template with a variation (a locale, grouped or promotion copy of a fragment, see the variations concept), or with a button's style, which the rich text link editor labels \"Variant\" (primary, secondary, accent and so on)."
    },
    {
        "id": "card-variants.md#1",
        "topic": "card-variants",
        "title": "Card templates (the variant field)",
        "section": "What a card template is",
        "keywords": [
            "platform",
            "authoring",
            "card templates (the variant field)",
            "variant",
            "variants",
            "template",
            "templates",
            "card type",
            "which template",
            "catalog",
            "plans",
            "plans-v2",
            "pro",
            "product",
            "segment",
            "mini",
            "slice",
            "suggested",
            "fries",
            "special offers",
            "compare chart",
            "express",
            "ccd",
            "picker"
        ],
        "text": "The template, set in the card editor's Template field, decides the layout a card renders in: which parts show up, how they are arranged, and what sizes are allowed. Every card fragment stores exactly one template, as its `variant` value, and it sets the card's overall layout."
    },
    {
        "id": "card-variants.md#2",
        "topic": "card-variants",
        "title": "Card templates (the variant field)",
        "section": "Why you don't see every template on every surface",
        "keywords": [
            "platform",
            "authoring",
            "card templates (the variant field)",
            "variant",
            "variants",
            "template",
            "templates",
            "card type",
            "which template",
            "catalog",
            "plans",
            "plans-v2",
            "pro",
            "product",
            "segment",
            "mini",
            "slice",
            "suggested",
            "fries",
            "special offers",
            "compare chart",
            "express",
            "ccd",
            "picker"
        ],
        "text": "Studio's template picker filters the full template list down to the ones registered for the surface you are working in. Sandbox and the NALA test surface are the exception: they can see every template regardless of scoping, which is why a template only meant for one production surface can still be tried out in sandbox first."
    },
    {
        "id": "card-variants.md#3",
        "topic": "card-variants",
        "title": "Card templates (the variant field)",
        "section": "The families of templates",
        "keywords": [
            "platform",
            "authoring",
            "card templates (the variant field)",
            "variant",
            "variants",
            "template",
            "templates",
            "card type",
            "which template",
            "catalog",
            "plans",
            "plans-v2",
            "pro",
            "product",
            "segment",
            "mini",
            "slice",
            "suggested",
            "fries",
            "special offers",
            "compare chart",
            "express",
            "ccd",
            "picker"
        ],
        "text": "Catalog is the general-purpose acom card. Plans, Plans v2, Plans Students and Plans Education are variations on a pricing-plan layout for acom, aimed at general, student and education audiences respectively. Pro serves acom, Creative Cloud and Document Cloud with a layout built around a top card and synced price bands, and unlike the plans family it never renders inside a collection sidenav. Product and Segment are single-offer layouts for the Creative Cloud and Document Cloud surfaces, and Brand Concierge Product is a similar layout for the sandbox surface. Media is an acom layout, Special offers is a Creative Cloud layout, Image serves both Creative Cloud and Document Cloud, and Fries is a commerce layout. Slice and Suggested exist only for the CCD surface, and Mini is a compact CCD layout meant for pages that need a small footprint. Mini Compare Chart, Mini Compare Chart Mweb and Compare Chart Column lay several offers side by side for comparison. Full Pricing Express and Simplified Pricing Express are Adobe Express layouts, one more detailed than the other. Try Buy Widget and Promoted Plans exist only for Adobe Home. Headless is a special case covered on its own page: it renders a card's fields as a plain labelled list instead of a designed layout. Marquee, FAQ and Banner/Blade are simpler, non-pricing card shapes offered on sandbox, NALA, acom and both Creative and Document Cloud surfaces. The Template picker in Studio shows the full set for your surface, which includes more than these."
    },
    {
        "id": "card-variants.md#4",
        "topic": "card-variants",
        "title": "Card templates (the variant field)",
        "section": "Common questions",
        "keywords": [
            "platform",
            "authoring",
            "card templates (the variant field)",
            "variant",
            "variants",
            "template",
            "templates",
            "card type",
            "which template",
            "catalog",
            "plans",
            "plans-v2",
            "pro",
            "product",
            "segment",
            "mini",
            "slice",
            "suggested",
            "fries",
            "special offers",
            "compare chart",
            "express",
            "ccd",
            "picker"
        ],
        "text": "Why can't an author select a template that clearly exists in the code: the template is not registered for the surface currently selected in Studio's surface picker; switch to sandbox to preview it or confirm the intended surface with the team. Why do two templates named similarly, like Plans and Plans v2, look and behave differently: they are genuinely separate layouts with separate field mappings, not the same layout with a version flag."
    },
    {
        "id": "cards-and-publishing.md#0",
        "topic": "cards",
        "title": "Cards and Publishing in MAS Studio",
        "section": "How do I create a card in MAS Studio?",
        "keywords": [
            "card",
            "merch card",
            "variant",
            "create card",
            "publish",
            "unpublish",
            "edit fields",
            "draft",
            "modified",
            "surface"
        ],
        "text": "Open MAS Studio at https://mas.adobe.com/studio.html, use the folder picker in the top navigation to choose the surface and folder where the card should live, and click Create, which offers the available content types: merch card, collection, and compare chart. The create dialog asks for a title — and for a merch card, an offer chosen through the Offer Selector Tool, unless the folder's template is offerless. After creation the card opens in the editor panel, where you choose the variant and fill in the fields: title, description, prices, CTAs, and optional extras such as a badge, mnemonics (product icons), or a background image. The editor shows a live preview as you type. Saving stores the card as a content fragment in Draft status; it is not visible to end users until you publish it. You can also describe the card you want to the AI assistant in the chat panel, or duplicate an existing card and edit the copy — the assistant can duplicate a card for you if you give it the card ID."
    },
    {
        "id": "cards-and-publishing.md#1",
        "topic": "cards",
        "title": "Cards and Publishing in MAS Studio",
        "section": "Which card variants exist and which surfaces use them?",
        "keywords": [
            "card",
            "merch card",
            "variant",
            "create card",
            "publish",
            "unpublish",
            "edit fields",
            "draft",
            "modified",
            "surface"
        ],
        "text": "Each surface supports a specific set of card variants. Adobe.com (acom) uses plans, plans-students, plans-education, catalog, special-offers, mini, and simplified-pricing-express. Creative Cloud Desktop (ccd) uses ccd-slice and ccd-suggested. The commerce surface (Unified Checkout) uses fries, a horizontal commerce-focused card. Adobe Home uses ah-try-buy-widget and ah-promoted-plans. Adobe Express uses full-pricing-express and simplified-pricing-express. Variants differ in layout, required fields, and CTA styling: plans cards require a title, prices, and CTAs and use primary-outline CTAs, while fries cards require a title, description, and CTAs and use primary CTAs. Choose the variant first, because it determines which fields the editor offers."
    },
    {
        "id": "cards-and-publishing.md#2",
        "topic": "cards",
        "title": "Cards and Publishing in MAS Studio",
        "section": "What is a surface and how does it affect my card?",
        "keywords": [
            "card",
            "merch card",
            "variant",
            "create card",
            "publish",
            "unpublish",
            "edit fields",
            "draft",
            "modified",
            "surface"
        ],
        "text": "A surface is a destination where merch cards render: acom (adobe.com pages), ccd (Creative Cloud Desktop), commerce (Unified Checkout), adobe-home (Adobe Home), and express (Adobe Express). There is also a sandbox area for testing. Card content is stored under the /content/dam/mas/ path in AEM, organized into folders per surface, so the folder where you create a card determines its surface, and the surface determines which variants are valid. The AI assistant detects the surface from the folder you are currently browsing and suggests matching variants, and card searches can be filtered by surface and locale."
    },
    {
        "id": "cards-and-publishing.md#3",
        "topic": "cards",
        "title": "Cards and Publishing in MAS Studio",
        "section": "How do I publish a card?",
        "keywords": [
            "card",
            "merch card",
            "variant",
            "create card",
            "publish",
            "unpublish",
            "edit fields",
            "draft",
            "modified",
            "surface"
        ],
        "text": "Open the card in the editor, make sure there are no validation errors and all required fields for the variant are filled, then use the Publish action and confirm. The card status changes from Draft to Published and the fragment becomes available to consuming pages through the delivery API. Publishing also publishes the card's referenced fragments that are still in draft or unpublished status, so dependencies go live together. To publish many items at once, use a bulk publish project under Advanced tools, or ask the AI assistant. The AI assistant can publish a card if you ask (for example \"publish this card\"); it always asks for your confirmation before publishing, and for multiple cards it can first show a preview of exactly which cards would be affected before running the job."
    },
    {
        "id": "cards-and-publishing.md#4",
        "topic": "cards",
        "title": "Cards and Publishing in MAS Studio",
        "section": "How do I search and filter cards?",
        "keywords": [
            "card",
            "merch card",
            "variant",
            "create card",
            "publish",
            "unpublish",
            "edit fields",
            "draft",
            "modified",
            "surface"
        ],
        "text": "The Fragments page has a text search plus a filter panel with facets for template, market segment, customer segment, product, offer type, plan type, personalization (pzn) tags, arbitrary tags, and status. The locale you are browsing comes from the locale picker in the top navigation, and the surface and folder come from the folder picker next to it. A personalization toggle hides or shows grouped-variation content in the list. The AI assistant can run the same searches conversationally, including by linked offer ID."
    },
    {
        "id": "cards-and-publishing.md#5",
        "topic": "cards",
        "title": "Cards and Publishing in MAS Studio",
        "section": "What happens when I edit a card that is already published?",
        "keywords": [
            "card",
            "merch card",
            "variant",
            "create card",
            "publish",
            "unpublish",
            "edit fields",
            "draft",
            "modified",
            "surface"
        ],
        "text": "Cards have three statuses in Studio: Draft, Published, and Modified. When you edit and save a card that was already published, its status becomes Modified, meaning it has unpublished changes. Publish the card again so the live version picks up your edits. The status indicator in the content table shows where each card stands: Draft (never published), Published (live and unchanged), or Modified (live but with pending changes). Save with the Save button or Ctrl+S; the editor tracks unsaved changes and prompts before you close or navigate away, and Version History lets you inspect earlier versions of the fragment."
    },
    {
        "id": "cards-and-publishing.md#6",
        "topic": "cards",
        "title": "Cards and Publishing in MAS Studio",
        "section": "How do I unpublish a card and what happens to pages using it?",
        "keywords": [
            "card",
            "merch card",
            "variant",
            "create card",
            "publish",
            "unpublish",
            "edit fields",
            "draft",
            "modified",
            "surface"
        ],
        "text": "Unpublishing removes a card from delivery, so any live page that references the fragment stops rendering it. Typical reasons to unpublish are an ended promotion, outdated content, or deprecating a card. Open the card and use the Unpublish action, or select several cards and unpublish in bulk. The AI assistant can unpublish a single card or a batch of cards by ID; because this changes production it always asks you to confirm first. After unpublishing, remember to update any pages that referenced the card."
    },
    {
        "id": "cards-and-publishing.md#7",
        "topic": "cards",
        "title": "Cards and Publishing in MAS Studio",
        "section": "Can the AI assistant edit cards for me?",
        "keywords": [
            "card",
            "merch card",
            "variant",
            "create card",
            "publish",
            "unpublish",
            "edit fields",
            "draft",
            "modified",
            "surface"
        ],
        "text": "Yes. The assistant can update fields on a single card, run a bulk update across many cards (including text replacements), duplicate a card, open a card in the Studio editor for you, and copy a deep link to a card. Before any bulk update it can show a dry-run preview of exactly what would change on each card, and every change requires your explicit confirmation before it runs. It can also search cards by title, content, tags, surface, locale, or linked offer ID, and fetch a card's full contents when you just want to read it."
    },
    {
        "id": "cards-and-publishing.md#8",
        "topic": "cards",
        "title": "Cards and Publishing in MAS Studio",
        "section": "How do locale variations of a card work?",
        "keywords": [
            "card",
            "merch card",
            "variant",
            "create card",
            "publish",
            "unpublish",
            "edit fields",
            "draft",
            "modified",
            "surface"
        ],
        "text": "A card has a locale-default parent fragment, and each locale can have exactly one variation of it — attempting to create a second variation for the same locale fails. Variations carry translated or region-specific content while staying linked to the parent. The AI assistant can show a card's full variation tree, list which locales already have variations, find the parent of a variation, and create a new locale variation of a card (with confirmation). To find gaps, ask it to list cards that are missing a variation for a target locale."
    },
    {
        "id": "checkout.md#0",
        "topic": "checkout",
        "title": "Checkout and buy flow",
        "section": "How a CTA resolves its offer",
        "keywords": [
            "platform",
            "pricing",
            "checkout and buy flow"
        ],
        "text": "A checkout element (checkout link or checkout button) does not carry a URL in authored content. On render it collects its options from its observed attributes — `data-wcs-osi`, `data-quantity`, `data-promotion-code`, `data-extra-options`, `data-modal`, `data-entitlement`, `data-upgrade`, `data-perpetual`, `data-ims-country`, `data-checkout-workflow`, `data-checkout-workflow-step`, `data-template` — and resolves the offer from WCS by OSI, country (the visitor's IMS country when known) and locale. Market and customer segment are not card attributes: the element takes them from its `ms`/`cs` options or, failing that, from the resolved offer (`marketSegments` and `customerSegment`), mapping `e` and `t` to `EDU` and `TEAM`. The country the request uses is the IMS country of the logged-in visitor or the page's country, which is why the same CTA can point at different offers for different visitors. If no offer resolves for the OSI, the element marks itself failed and its URL collapses to `#`."
    },
    {
        "id": "checkout.md#1",
        "topic": "checkout",
        "title": "Checkout and buy flow",
        "section": "The checkout URL",
        "keywords": [
            "platform",
            "pricing",
            "checkout and buy flow"
        ],
        "text": "When an offer resolves, the client builds a Unified Checkout v3 URL: `https://commerce.adobe.com/store/<workflowStep>` in production, `https://commerce-stg.adobe.com` in stage. Items are encoded as `items[0][pa]` (product arrangement code) plus per-item parameters such as `co` (country), `ms` (market segment), `q` (quantity) and `apc` (checkout promo code). Top-level parameters include `cli` (client id), `ctx` (context), `lang` and `co`. The page's own URL contributes only an allow-listed set of tracking parameters (`gid`, `gtoken`, `sdid`, `mv`, `mv2`, and a few others). A checkout whose `data-modal` is `true` renders `#` and opens the modal instead of navigating. A CTA with a 3-in-1 modal type keeps the real checkout URL, because the 3-in-1 modal builds its iframe from that link."
    },
    {
        "id": "checkout.md#2",
        "topic": "checkout",
        "title": "Checkout and buy flow",
        "section": "Promo codes into checkout",
        "keywords": [
            "platform",
            "pricing",
            "checkout and buy flow"
        ],
        "text": "A promo code reaches checkout as `apc`. If the resolved offer's promotion is not active for the visitor's country and quantity, an authored promo code is dropped rather than sent. The special value `cancel-context` means \"no promotion\" for that element and must never reach WCS or checkout as a real code. Pages under the `/tw/` or `/hk_zh/` paths force `lang=zh-Hant` on the checkout URL."
    },
    {
        "id": "checkout.md#3",
        "topic": "checkout",
        "title": "Checkout and buy flow",
        "section": "3-in-1 modal",
        "keywords": [
            "platform",
            "pricing",
            "checkout and buy flow"
        ],
        "text": "When a CTA uses a 3-in-1 modal type (crm, twp, d2p) and the page has not turned 3-in-1 off with `<meta name=\"mas-ff-3in1\" content=\"off\">` (it is on by default), the checkout context becomes `ctx=if`, and on the segmentation workflow step the checkout URL also gets `rtc=t`, `lo=sl`, iframe `af` flags, and a client id of `creative` or `mini_plans` (a `doc_cloud` client id is kept), which renders the unified 3-in-1 paywall instead of a plain checkout."
    },
    {
        "id": "checkout.md#4",
        "topic": "checkout",
        "title": "Checkout and buy flow",
        "section": "Where it breaks",
        "keywords": [
            "platform",
            "pricing",
            "checkout and buy flow"
        ],
        "text": "Typical failure: the CTA points to `#` and nothing happens on click. Check in order: the OSI on the element (does an offer exist for it?), the country the visitor resolved to (WCS returns no offer for that country/landscape), and the promotion state when a promo code is involved. On stage, the offer landscape is always `ALL`, which can mask missing prod landscape offers."
    },
    {
        "id": "collections.md#0",
        "topic": "collections",
        "title": "Collections",
        "section": "What a collection is",
        "keywords": [
            "platform",
            "authoring",
            "collections",
            "collection",
            "merch card collection",
            "variation",
            "locale variation",
            "grouped variation",
            "pzn",
            "personalization",
            "locale default",
            "parent fragment",
            "translation"
        ],
        "text": "A collection is a content fragment (its own model, distinct from the card model) that groups cards. Its `cards` field references card fragments and its `collections` field can reference other collections, so a collection can nest. It also carries its own label, navigation label, icons, a default child, tag filters, and its own variations like any fragment. In Studio a collection is edited like a card but with a different model. A collection can be added to a promotion (Studio saves it into the promotion's `fragments` list alongside cards), but Studio offers no way to create a promo variation for a collection and does not look for one. On delivery a promotion is matched per fragment by its own path, so attaching a collection does not by itself put its cards in the promotion; each card is in the promotion only if it is attached itself."
    },
    {
        "id": "collections.md#1",
        "topic": "collections",
        "title": "Collections",
        "section": "What IO adds for a collection",
        "keywords": [
            "platform",
            "authoring",
            "collections",
            "collection",
            "merch card collection",
            "variation",
            "locale variation",
            "grouped variation",
            "pzn",
            "personalization",
            "locale default",
            "parent fragment",
            "translation"
        ],
        "text": "The settings transformer treats a collection body specially: it applies the surface settings to every referenced card in the collection, then injects a fixed set of collection placeholders (`coll-search-text`, `coll-filters-text`, `coll-sort-text`, `coll-no-results-text`, sidenav titles and more) plus collection-specific dictionary entries (`coll-filter`, `coll-result-count`, `coll-search-term`) that the client resolves as live filter, result-count and search-term text. The collection's card and sub-collection order in the reference tree is re-adapted after variations merge, so a variation that reorders `cards` reorders what renders."
    },
    {
        "id": "collections.md#2",
        "topic": "collections",
        "title": "Collections",
        "section": "What the client renders",
        "keywords": [
            "platform",
            "authoring",
            "collections",
            "collection",
            "merch card collection",
            "variation",
            "locale variation",
            "grouped variation",
            "pzn",
            "personalization",
            "locale default",
            "parent fragment",
            "translation"
        ],
        "text": "The `merch-card-collection` web component renders the collection's cards as a grid (column count from the card template and screen size) with client-side search over card titles, tag-based filters (`filter` attribute, `filtered` to freeze), sorting — exactly two orders exist, `authored` (the default) and `alphabetical`; the sort menu's \"popularity\" label is just the display text for the authored option, driven by the `popularityText` placeholder — and pagination (`limit` and `page`). State is exposed through the URL via the deeplink helper, so a filtered or sorted collection can be shared. Card templates define `collectionOptions` (per variant in code) that control sidenav behavior — header visibility, results text, wide-card resize — for plans- and product-style collections; some templates (Pro) render without a sidenav. A collection that fails to load dispatches the same `mas:error` event as a card."
    },
    {
        "id": "collections.md#3",
        "topic": "collections",
        "title": "Collections",
        "section": "Common questions",
        "keywords": [
            "platform",
            "authoring",
            "collections",
            "collection",
            "merch card collection",
            "variation",
            "locale variation",
            "grouped variation",
            "pzn",
            "personalization",
            "locale default",
            "parent fragment",
            "translation"
        ],
        "text": "Why is a card missing from a live collection: the card is not in the collection's `cards` references, or a merged variation removed it. Why does the collection show a different order than Studio: sorting is client-side and defaults to the authored `order` in each card's tag filters, not the fragment reference order. Why is search or filter text in the wrong language: it comes from the collection placeholders in the dictionary for the region locale, not from a field on the card."
    },
    {
        "id": "fragment-editor.md#0",
        "topic": "fragment-editor",
        "title": "The fragment editor",
        "section": "What does the fragment editor do?",
        "keywords": [
            "authoring",
            "platform",
            "the fragment editor"
        ],
        "text": "The fragment editor is the full page view where one fragment is edited: a card, a collection or a compare chart. It opens when a fragment is created and when one is opened from the Fragments page, and it shows a form column with that fragment's fields on the left. For a card, a live preview of the card sits beside the form and re-renders as you type, with its real resolved price, so what you see is what a page will show.\n\nWhich form appears depends on what the fragment is. A card gets the card form, whose sections are general information with the template picker, visuals, what is included, footer rows, price and promo, product details, custom fields, footer, and options and settings. A collection gets the collection form with its cards and categories, and a compare chart gets its own editor."
    },
    {
        "id": "fragment-editor.md#1",
        "topic": "fragment-editor",
        "title": "The fragment editor",
        "section": "What can I do from the editor's side rail?",
        "keywords": [
            "authoring",
            "platform",
            "the fragment editor"
        ],
        "text": "The side rail replaces the usual navigation while you edit and offers Save, Preview, Publish, Copy Link, Copy Field, History and Delete. Create Variation and Duplicate are offered on a default locale fragment only, and disappear once you are inside a variation. Unpublish and Unlock appear in the rail but are disabled today.\n\nCopy Field opens a list of the fragment's fields with a preview of each value, and copying one puts a link to that single field on the clipboard, ready to paste on a consuming page. The result renders that one field on the page without any card around it, which is what the headless field page describes."
    },
    {
        "id": "glossary.md#0",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Odin and content fragments",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "Odin is the headless AEM instance that stores MAS content as content fragments under `/content/dam/mas/<surface>/<locale>/`. Cards, collections, settings, and dictionaries are all fragments. The published tier is what production serves (`https://odin.adobe.com/adobe/contentFragments/…`); the author tier holds unpublished draft edits."
    },
    {
        "id": "glossary.md#1",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Surface",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "A surface is a MAS tenant folder such as `acom`, `ccd`, `express`, `acom-cc`, or `sandbox`. In MAS Studio the surface is chosen with the dropdown at the top left of the header (`mas-nav-folder-picker`), which shows it in upper case, for example SANDBOX, ACOM or CCD, and changes which surface's cards Studio lists. Words later in a fragment's path or its tags are not the surface: in \"merch-card: SANDBOX / Plans / Individual / com / Creative Cloud Individual\" the surface is SANDBOX, not `com`. Settings live at `/content/dam/mas/<surface>/settings/index` and dictionaries at `/content/dam/mas/<surface>/<locale>/dictionary/index`."
    },
    {
        "id": "glossary.md#2",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Fragment, variation, and locale default",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "Every card has a default-locale fragment, for example `en_US`. A variation is a regional copy of that fragment for one locale, for example `en_KR`; there is at most one variation per locale per fragment. The default-locale fragment (`localeDefaultFragment`) is the parent a variation derives from. IO reads the default-language fragment first and then applies the region locale."
    },
    {
        "id": "glossary.md#3",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "MAS IO fragment pipeline",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "MAS IO (`https://www.adobe.com/mas/io/fragment?id=<uuid>&locale=<locale>&country=<CC>`) is the Adobe I/O Runtime action that turns an Odin fragment into what cards render. It fetches the fragment, resolves the default-language fragment, computes the region locale, applies settings, replaces `{{placeholder}}` tokens from dictionaries, and returns JSON with `fields`, `settings`, and `references`. Stage IO is `https://www.stage.adobe.com/mas/io` and only answers on the corp network."
    },
    {
        "id": "glossary.md#4",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Region locale",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "IO computes a region locale from `locale` and `country` with `computeRegionLocale`. When the country differs from the default locale's own country and the surface defines a region for that country, the request is treated as that region: `locale=en_US&country=KR` resolves region locale `en_KR`. Settings overrides and dictionaries match the region locale, not the raw `locale` parameter."
    },
    {
        "id": "glossary.md#5",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Settings",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "Settings are per-surface switches stored as entries under `/content/dam/mas/<surface>/settings/index`: `hideTrialCTAs`, `displayPlanType`, `secureLabel`, `displayAnnual`, `quantitySelect`, `addon`, `hideEduDisclaimer`, `additionalModalTriggers`, and `placeholderRemap`. Each setting has one default entry and optional override entries scoped by `geos`, `locales`, `tags`, or `templates`. IO returns the resolved values in the `settings` object of the fragment response."
    },
    {
        "id": "glossary.md#6",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Placeholders and dictionaries",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "IO replaces `{{key}}` tokens in every fragment field from dictionary fragments, layered as the `acom` baseline, then the surface baseline, then the region overlay. A well-formed key missing from every layer renders as the bare key, braces removed. A literal `{{...}}` still visible on a page means the key is malformed, for example it contains a space, or no dictionary loaded for that request."
    },
    {
        "id": "glossary.md#7",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "maslibs and mas-io-url",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "`?maslibs=` is a Milo consumer-page parameter that selects where the MAS web-components bundle loads from: `local` (`http://localhost:3000`), `main`, or a branch name (`stage` is just a branch name). Milo ignores it on `www.adobe.com`. `?mas-io-url=` points web components at another IO runtime base, such as a PR author namespace. MAS Studio (`mas.adobe.com/studio.html`) ignores both."
    },
    {
        "id": "glossary.md#8",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Web components and the IMS country cookie",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "Cards render with the MAS web-components bundle (`merch-card`, `aem-fragment`, `inline-price`, `checkout-link`). `aem-fragment` builds the IO request. When the page gives the commerce service no explicit country, its `country` is the `ims_country_code` cookie if that cookie exists, and otherwise the page's configured country. A locale with a country part (`fr_FR`) counts as explicit, and Milo pages always pass one, so on Milo pages the cookie is never used and the page's market sets the country. No `country` parameter is sent when the country equals the locale's own country."
    },
    {
        "id": "glossary.md#9",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "NALA",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "NALA is the MAS Playwright end-to-end suite in `nala/`, run on pull requests by `.github/workflows/run-nala.yml`. The agent reads existing NALA results only; it never runs tests."
    },
    {
        "id": "glossary.md#10",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "EDS preview and live",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "Branches deploy to Edge Delivery at `https://<branch>--mas--adobecom.aem.page` (preview) and `.aem.live` (live). Branch `.aem.live` hosts throttle automation bursts with HTTP 429, so probes use `.aem.page`."
    },
    {
        "id": "glossary.md#11",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "RPP, WCS, AOS and MCS",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "RPP, short for Regional Pricing, is a permanent, country-specific lower price, not a promotion. WCS, the Web Commerce Service, is the API that resolves an offer selector ID plus country, locale and promo code into the price, tax and terms a card renders, and it is the only pricing service MAS calls directly. AOS, the Available Offers Service, is the catalog service that WCS calls behind the scenes to resolve an offer selector ID into one or more priced offers. MCS, the Merchandising Content Service (also called just the Merchandising Service), is the system of record for an offer's marketing content, separate from pricing."
    },
    {
        "id": "glossary.md#12",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Intro pricing and price point",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "Intro pricing, or IP, is a discount that behaves like an open-ended promotion, with its own strikethrough price and badge, unlike RPP's plain permanent reprice. A price point is a named pricing tier of the same offer, used to run different prices for different customer segments or pricing tests."
    },
    {
        "id": "glossary.md#13",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Term, commitment and billing frequency",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "Term is the billing period category on a resolved offer, such as monthly or annual. Commitment is the length a customer is contractually locked into, such as one year, which can be billed on a different schedule than the term suggests. Billing frequency is how often the customer is actually charged, which can differ from both term and commitment, for example a one-year commitment billed monthly."
    },
    {
        "id": "glossary.md#14",
        "topic": "glossary",
        "title": "MAS glossary",
        "section": "Tax inclusive and tax exclusive",
        "keywords": [
            "platform",
            "mas glossary"
        ],
        "text": "Tax inclusive means the price shown already has local tax, such as VAT or GST, added in. Tax exclusive means tax is shown, or added, separately from the listed price."
    },
    {
        "id": "headless-and-fields.md#0",
        "topic": "headless",
        "title": "Headless cards and single fields (mas-field)",
        "section": "What is mas-field?",
        "keywords": [
            "mas-field",
            "headless",
            "field",
            "single field",
            "inline",
            "copy field",
            "field link",
            "embed",
            "reuse",
            "one field",
            "price inline",
            "cta inline",
            "headless variant",
            "consumer page",
            "autoblock",
            "jsonld"
        ],
        "text": "mas-field renders exactly one authored field of one card fragment, inline in page copy, with no card around it. There is no border, no badge, no slots and no variant layout: just that field's value. It exists for cases like putting a card's price in the middle of a marquee headline, or its CTA in a paragraph of body copy. The markup on a consumer page looks like a mas-field element with a field attribute naming the field, wrapping an aem-fragment element that names the fragment id. The rendered value lands in a span marked with the data-role mas-field-content. Use it when the fragment is the source of truth for a price, CTA or label, but a whole card is not wanted in that spot."
    },
    {
        "id": "headless-and-fields.md#1",
        "topic": "headless",
        "title": "Headless cards and single fields (mas-field)",
        "section": "What does headless mean in MAS? It means two different things",
        "keywords": [
            "mas-field",
            "headless",
            "field",
            "single field",
            "inline",
            "copy field",
            "field link",
            "embed",
            "reuse",
            "one field",
            "price inline",
            "cta inline",
            "headless variant",
            "consumer page",
            "autoblock",
            "jsonld"
        ],
        "text": "These are separate features and it matters which one is meant. First, mas-field is a headless usage of a card fragment: any fragment, any template, one field at a time, rendered on a consumer page without a card. Second, headless is also the name of a card variant, a Studio template that renders the fragment as a labelled list of all its fields (Title, Product price, CTAs and so on) instead of a designed card. The headless variant is a card-shaped inspector or feed view, authored in Studio like any other template and available on the sandbox, acom-cc and acom-dc surfaces. Short version: mas-field is the consumer-page mechanism, the headless variant is a Studio template."
    },
    {
        "id": "headless-and-fields.md#2",
        "topic": "headless",
        "title": "Headless cards and single fields (mas-field)",
        "section": "How do I use one field of a card on a page?",
        "keywords": [
            "mas-field",
            "headless",
            "field",
            "single field",
            "inline",
            "copy field",
            "field link",
            "embed",
            "reuse",
            "one field",
            "price inline",
            "cta inline",
            "headless variant",
            "consumer page",
            "autoblock",
            "jsonld"
        ],
        "text": "Open the fragment in Studio and use the Copy Field button in the side rail. It lists every non-empty field with a live preview of its value, and copies a link whose text reads \"mas-field:\" followed by the folder path and the field name. Paste that link into the consumer page document. Milo's merch-card autoblock recognises the link and replaces it with the mas-field markup, so the author never writes the element by hand. The Copy Field button is the supported path; hand-writing a field link is easy to get wrong."
    },
    {
        "id": "headless-and-fields.md#3",
        "topic": "headless",
        "title": "Headless cards and single fields (mas-field)",
        "section": "Which field names can mas-field address?",
        "keywords": [
            "mas-field",
            "headless",
            "field",
            "single field",
            "inline",
            "copy field",
            "field link",
            "embed",
            "reuse",
            "one field",
            "price inline",
            "cta inline",
            "headless variant",
            "consumer page",
            "autoblock",
            "jsonld"
        ],
        "text": "A plain field name renders that whole field: prices, description, title, cardTitle, subtitle, shortDescription, promoText, callout and so on. A single-paragraph rich text field is unwrapped so it sits inline rather than starting a new block. The name ctas renders all CTAs as real checkout buttons in a footer slot, styled the way the card would style them. A numeric index like ctas[1] or ctas[2] renders only the Nth CTA, counting from 1, with the class attribute stripped so the host page can restyle it. An index can instead be a CTA's data-key, which is stable when CTAs are reordered, or a custom field's label, as in customFields[My Label]. The special name jsonLdSchema injects JSON-LD structured data instead of visible content."
    },
    {
        "id": "headless-and-fields.md#4",
        "topic": "headless",
        "title": "Headless cards and single fields (mas-field)",
        "section": "Does a single field still get the right price, promo and locale?",
        "keywords": [
            "mas-field",
            "headless",
            "field",
            "single field",
            "inline",
            "copy field",
            "field link",
            "embed",
            "reuse",
            "one field",
            "price inline",
            "cta inline",
            "headless variant",
            "consumer page",
            "autoblock",
            "jsonld"
        ],
        "text": "Yes, and this is the reason to use mas-field rather than copying a value into the page. It runs the same data pipeline as a card, so hosted prices resolve with the same locale defaults and the tax or per-unit labelling for that market appears as it would on a card. The fragment's promo code is applied to both prices and checkout URLs under the same compatibility rules a card uses, so older fragments are unaffected, and the promo code is stamped onto the CTA anchor itself so it survives Milo unwrapping the element. Card settings are honoured: hideTrialCTAs drops trial CTAs, displayPlanType drives the plan type on a legal price template, and displayAnnual is respected. Rich text tooltips get the Milo info glyph with correct placement, because Milo does not decorate mas-field content itself."
    },
    {
        "id": "headless-and-fields.md#5",
        "topic": "headless",
        "title": "Headless cards and single fields (mas-field)",
        "section": "How is mas-field different from a merch-card?",
        "keywords": [
            "mas-field",
            "headless",
            "field",
            "single field",
            "inline",
            "copy field",
            "field link",
            "embed",
            "reuse",
            "one field",
            "price inline",
            "cta inline",
            "headless variant",
            "consumer page",
            "autoblock",
            "jsonld"
        ],
        "text": "Same fragment, same data pipeline, same option providers, same promo and settings rules. The difference is scope: merch-card maps every field onto the slots of its variant layout, and mas-field renders one field with no layout at all. Anything that belongs to a variant layout, such as badge placement, whats-included, addons or slot height syncing, is out of scope for mas-field by design. A mas:ready event fires once the field has loaded and rendered, so a host block can decorate a CTA that resolved after the block itself ran. One known difference: merch-card also drops CTAs whose resolved offer type is a trial, while mas-field matches only the static trial allowlist."
    },
    {
        "id": "howto-bulk-publish.md#0",
        "topic": "howto-bulk-publish",
        "title": "Bulk publishing across locales",
        "section": "Does MAS have a bulk publisher for several locales?",
        "keywords": [
            "authoring",
            "bulk publishing across locales"
        ],
        "text": "Yes. Open https://mas.adobe.com/studio.html#page=bulkPublish&path=<surface> to reach the bulk publish tool, which publishes a card across locales. The `path` parameter must match the surface, for example `path=express` for Express. The page is also linked from Advanced tools."
    },
    {
        "id": "howto-bulk-publish.md#1",
        "topic": "howto-bulk-publish",
        "title": "Bulk publishing across locales",
        "section": "What is a bulk publish project?",
        "keywords": [
            "authoring",
            "bulk publishing across locales"
        ],
        "text": "A bulk publish project holds a list of fragment paths and target locales, and is reached from Advanced tools. Publishing a project runs as an asynchronous backend job and ends in a status such as Published, Partially published or Failed. The current statuses also include Draft, Publishing, Locked, Reverting and Reverted, because a bulk publish can be reverted from its snapshot. A card must exist in a locale before it can be bulk-published there."
    },
    {
        "id": "howto-bulk-publish.md#2",
        "topic": "howto-bulk-publish",
        "title": "Bulk publishing across locales",
        "section": "How do I set up a bulk publish project?",
        "keywords": [
            "authoring",
            "bulk publishing across locales"
        ],
        "text": "On the bulk publish page, use Create project, give the project a title, then fill its item list. Items are added either by pasting Studio fragment links into the list or with Add by search, and the list validates each entry and flags the invalid ones. Then open the locales section, choose the target locales, and save.\n\nPublish from the project's action bar, which also offers save, duplicate, copy, revert, lock and delete. The confirmation dialog states how many items will be published and how many are skipped, and the project then shows a banner with who published it and when. A project that ended as Published or Partially published can also be reverted from the row menu on the project list, where duplicating and deleting a project live too."
    },
    {
        "id": "howto-create-collection.md#0",
        "topic": "howto-create-collection",
        "title": "Create a collection",
        "section": "How do I create a collection?",
        "keywords": [
            "authoring",
            "create a collection"
        ],
        "text": "A collection is a fragment that groups cards. Open the Fragments page for the surface you want, open the Create menu in the toolbar, and choose Merch Card Collection. The dialog asks only for an internal title, and Create then makes the fragment and opens it in the fragment editor. A collection needs no offer, unlike a card.\n\nThe Collections item in the side navigation is disabled, so it is not the way in. Collections are created and found on the Fragments page alongside cards."
    },
    {
        "id": "howto-create-collection.md#1",
        "topic": "howto-create-collection",
        "title": "Create a collection",
        "section": "How do I add cards to a collection?",
        "keywords": [
            "authoring",
            "create a collection"
        ],
        "text": "In the collection editor, drag cards or other collections onto the Cards section, or onto the Categories section for a nested collection. The editor shows a hint to drag and drop cards or collections while both lists are still empty.\n\nThe Cards section also accepts links. Paste Studio fragment links into the Enter URLs box and use Add from links to add them in one go. Each item in the list can be removed, opened for editing, previewed when it is a card, and reordered. Save and publish the collection the same way as a card."
    },
    {
        "id": "howto-promo-campaign.md#0",
        "topic": "howto-promo-campaign",
        "title": "Running a promo campaign",
        "section": "What a promotion project is",
        "keywords": [
            "authoring",
            "pricing",
            "running a promo campaign"
        ],
        "text": "A promotion project is a content fragment under `/content/dam/mas/promotions/` declaring its `surfaces`, `geos`, `startDate`, `endDate` and tags (the project is addressed by a `mas:promotion/<name>` tag). A project is active only inside its date window and when the request's surface and geo match. A project with an `endDate` is seasonal; one without is evergreen."
    },
    {
        "id": "howto-promo-campaign.md#1",
        "topic": "howto-promo-campaign",
        "title": "Running a promo campaign",
        "section": "The three ways a promo reaches a card",
        "keywords": [
            "authoring",
            "pricing",
            "running a promo campaign"
        ],
        "text": "A project only touches the fragments listed in its `fragments` field; every other card is left alone, whatever its offers. The list only picks targets: the project reads no promo codes from those fragments.\n\n1. Project promo code: the project's `promoCode` field is its default code, applied to every offer on the fragments the project lists; an inline price or button that already carries its own promo code keeps it.\n2. Offer overrides: the project's `offers` field carries text lines `<osis>|<promoCode>|<geos>` — comma-separated lists, empty meaning wildcard. The parser splits on `|`, so a line written with colons is dropped silently and its code never applies. A line whose geos (`locale/…` or `country/…` tags) match neither the request's country nor its region locale is skipped. A line naming OSIs sets the code for those OSIs and beats the project's default code; a line with an empty OSI list replaces the default code for every OSI. Lines starting with `substitute|<osi>|<newOsi>|<geos>` swap one offer for another in those geos instead of setting a code.\n3. Promo variations: per-fragment variation copies (path-suffixed `-2`, `-3`, up to fifty per fragment) that change card content for the campaign, resolved per default locale and region locale and deep-merged onto the fragment. A fragment can also opt its OSI out of variation merging per geo."
    },
    {
        "id": "howto-promo-campaign.md#2",
        "topic": "howto-promo-campaign",
        "title": "Running a promo campaign",
        "section": "Priority when several projects match",
        "keywords": [
            "authoring",
            "pricing",
            "running a promo campaign"
        ],
        "text": "Seasonal projects always beat evergreen ones. Within the group, a project with an explicit OSI mapping for the fragment's offer wins over one with only a wildcard, over one with neither; evergreen projects without any mapping do not apply at all. Multiple projects with disjoint per-country entries can coexist on the same fragment."
    },
    {
        "id": "howto-promo-campaign.md#3",
        "topic": "howto-promo-campaign",
        "title": "Running a promo campaign",
        "section": "How it is authored and published",
        "keywords": [
            "authoring",
            "pricing",
            "running a promo campaign"
        ],
        "text": "Studio has a dedicated Promotions page (list, create, duplicate, edit) gated by the promotions edit permission. The editor manages the offer lines, geo scoping, dates and attached promo variations. Publishing the project activates it; expired published projects are unpublished automatically, and the publish flow warns when attached promo variations are still unpublished or when the project has already expired."
    },
    {
        "id": "howto-promo-campaign.md#4",
        "topic": "howto-promo-campaign",
        "title": "Running a promo campaign",
        "section": "How the code reaches the rendered card",
        "keywords": [
            "authoring",
            "pricing",
            "running a promo campaign"
        ],
        "text": "The promotions step stages the selected project per fragment; the wcs step then applies the project's promo code and offer-mapping OSI substitutions to inline price and checkout elements (offer-mapping entries at `<surface>/offer-mapping/index` can also swap an OSI, per geo, with an optional promo code on either side). The card renders the discounted price from WCS with that code, and the checkout CTA carries it as `apc`. If the discount is not showing: confirm the project is active and matches the surface/geo, that the OSI mapping exists for that country, and that WCS itself accepts the code for that offer and visitor country — a code WCS rejects renders no discount even though the pipeline applied it."
    },
    {
        "id": "howto-publish-card.md#0",
        "topic": "howto-publish-card",
        "title": "Publishing a card",
        "section": "How do I publish a card?",
        "keywords": [
            "authoring",
            "publishing a card"
        ],
        "text": "Open the card in the editor, clear any validation errors, then use the Publish action and confirm if asked. The status changes from Draft, or from Modified, to Published, and the fragment becomes available to consuming pages through the delivery API. Publishing one card does not publish its references on its own. If the card has variations, or is a collection with cards or sub-collections, a Publish fragment dialog lists them with checkboxes, all unchecked, and only the ones the author checks (or Select all) are published with it. If any of them, or the card itself, is marked staged, Studio asks for a second confirmation. Publishing several cards selected together in the content table is different: it also publishes their referenced fragments that are still Draft or Unpublished. To publish many cards at once, use a bulk publish project under Advanced tools."
    },
    {
        "id": "howto-publish-card.md#1",
        "topic": "howto-publish-card",
        "title": "Publishing a card",
        "section": "What happens when I edit a card that is already published?",
        "keywords": [
            "authoring",
            "publishing a card"
        ],
        "text": "Studio shows five statuses, which it reads from AEM: Published, Draft, New, Modified and Unpublished. Editing and saving a card that was already published changes its status to Modified, which means it has unpublished changes. Publish it again for the live version to pick up the edits. The status column in the content table shows where each card stands, and the status filter offers all five."
    },
    {
        "id": "howto-retire-card.md#0",
        "topic": "howto-retire-card",
        "title": "Retiring a card",
        "section": "What do I use to take a card down?",
        "keywords": [
            "authoring",
            "retiring a card"
        ],
        "text": "Studio's quick actions include Save, Duplicate, Publish, Unpublish, Cancel, Copy, Lock, Discard, Delete, Loc, Validate, Link, Revert and Check modifications. Unpublish is the action meant to take a card off the live site and Delete removes it entirely, but see below: Studio does not currently let authors unpublish a card; Discard is an editor-level action, not a lifecycle one, and Revert belongs to bulk publish projects, not to single cards."
    },
    {
        "id": "howto-retire-card.md#1",
        "topic": "howto-retire-card",
        "title": "Retiring a card",
        "section": "What does Unpublish do?",
        "keywords": [
            "authoring",
            "retiring a card"
        ],
        "text": "Unpublish removes the fragment from the published tier; the authored draft stays in the authoring tier and can be published again later. On consumers, the published fragment no longer resolves, the IO fetch fails, and the card element fails and hides itself (outside preview the element sets `display: none`), so the slot simply goes empty. Unpublish a card that other fragments reference and those references start failing too — check the referencing cards and collections first.\n\nStudio does not currently offer Unpublish for cards. The card editor side nav shows an Unpublish item but it is hard-coded disabled, the editor panel toolbar's Unpublish button is disabled the same way, and the content table's selection bar is not given an unpublish handler, so its Unpublish button stays disabled. An author who needs a card off the live site today cannot do it from Studio and should raise it with the MAS team. (Settings, promotions and offer mappings do have a working Unpublish.)"
    },
    {
        "id": "howto-retire-card.md#2",
        "topic": "howto-retire-card",
        "title": "Retiring a card",
        "section": "What does Delete do?",
        "keywords": [
            "authoring",
            "retiring a card"
        ],
        "text": "Delete removes the fragment (and, when used with variations, its variations) from Odin. It is the irreversible option; force delete removes it by path. Use it only after Unpublish has confirmed the card is safely off, or when the card was never meaningful to keep."
    },
    {
        "id": "howto-retire-card.md#3",
        "topic": "howto-retire-card",
        "title": "Retiring a card",
        "section": "What are Discard and Revert?",
        "keywords": [
            "authoring",
            "retiring a card"
        ],
        "text": "Discard throws away unsaved edits and puts the card back to its last saved state; nothing is sent to Odin. In the card editor it comes up as a confirmation (\"Are you sure you want to discard changes?\") when the author leaves or duplicates a card with unsaved edits; the collection editor also has a Discard button in its toolbar. There is no Revert for a single card: the Revert quick action only appears in a bulk publish project, where it rolls every item in the project back to the snapshot taken before publishing. To take one card back to an earlier saved version, open History in the card editor and restore that version, which saves it as the card's current content. Neither Discard nor a restore changes what is live: a restored version on a published card is a saved edit, so it only goes live when the card is published again."
    },
    {
        "id": "howto-retire-card.md#4",
        "topic": "howto-retire-card",
        "title": "Retiring a card",
        "section": "What stays behind after a card is gone",
        "keywords": [
            "authoring",
            "retiring a card"
        ],
        "text": "The card's OSI does not disappear with it: commerce offers keep existing, so checkout URLs built from the old OSI can still work. Collections that listed the card show one fewer entry once the reference fails or is removed. Any page hardcoding the fragment id (for example a hand-authored `aem-fragment` on a non-Milo page) will show nothing. Before retiring, remove the card from collections and note down the fragment id and OSI for the audit trail."
    },
    {
        "id": "howto-test-before-publish.md#0",
        "topic": "howto-test-before-publish",
        "title": "Testing a card before and after publish",
        "section": "How do I preview a card before publishing it?",
        "keywords": [
            "authoring",
            "platform",
            "testing a card before and after publish"
        ],
        "text": "Use the card preview in MAS Studio. Preview runs the same IO pipeline in the browser through `fragment-client.js`, against the authoring tier, so unpublished drafts, draft settings and draft dictionaries all apply. The previewed fragment is rendered with the service in preview mode: in that mode a failing card is shown with its error instead of being hidden, which is what you want while authoring. Preview lets you set locale, `pzn` and `mask` explicitly — so set them to test a non-default region."
    },
    {
        "id": "howto-test-before-publish.md#1",
        "topic": "howto-test-before-publish",
        "title": "Testing a card before and after publish",
        "section": "How do I test a web-components change on a real page?",
        "keywords": [
            "authoring",
            "platform",
            "testing a card before and after publish"
        ],
        "text": "Add the `?maslibs=` parameter to a Milo page's URL on a stage, `.aem.page` or `.aem.live` host; Milo ignores it on `www.adobe.com`, so a branch can never be tried on production. Milo validates the value itself: `maslibs=<branch>` loads the bundles from `https://<branch>--mas--adobecom.aem.live/web-components/dist/` (`branch--repo` and `branch--repo--owner` are accepted for a fork), `maslibs=main` loads MAS main, and `maslibs=local` loads from `http://localhost:3000`, where you must serve the built `web-components/dist` yourself. `stage` is not special — it is read as a branch named `stage`. Milo always uses `.aem.live`, and the MAS web components resolve the same parameter to the same `localhost:3000` for their own preview pipeline (`fragment-client.js`), so one local server serves both. Without `maslibs`, every Milo host other than `www.adobe.com` already runs MAS main. After loading, verify in the Network tab that the MAS scripts actually came from the branch you expected, not a cached prod response."
    },
    {
        "id": "howto-test-before-publish.md#2",
        "topic": "howto-test-before-publish",
        "title": "Testing a card before and after publish",
        "section": "How do I test against stage?",
        "keywords": [
            "authoring",
            "platform",
            "testing a card before and after publish"
        ],
        "text": "Stage IO lives at `https://www.stage.adobe.com/mas/io` and answers on the corp network; stage content is the stage tier of Odin. Stage WCS always uses landscape `ALL`, so offers that are missing from the production landscape will still resolve on stage. Use stage to validate pipeline changes and staged content before prod."
    },
    {
        "id": "howto-test-before-publish.md#3",
        "topic": "howto-test-before-publish",
        "title": "Testing a card before and after publish",
        "section": "How do I verify what is actually live?",
        "keywords": [
            "authoring",
            "platform",
            "testing a card before and after publish"
        ],
        "text": "Probe the published delivery API directly with the exact `id`, `locale` and `country` the consumer page sends, and read the response fields (including settings and resolved placeholders) instead of the rendered card. If the published response is right but the page is wrong, the problem is in the client or the page; if the published response is wrong, the problem is content, settings or the pipeline. Remember the CDN caches IO responses for up to five minutes, so a freshly published change can take a few minutes to appear."
    },
    {
        "id": "howto-translation-workflow.md#0",
        "topic": "howto-translation-workflow",
        "title": "Sending a fragment for translation",
        "section": "What a translation project is",
        "keywords": [
            "authoring",
            "sending a fragment for translation"
        ],
        "text": "A translation project is its own kind of item in Studio, separate from the cards and collections it carries. You create one from the Translations page, give it a title, pick target languages, and add the cards, collections or placeholders you want translated. A project stays editable, and reusable, until it is actually sent."
    },
    {
        "id": "howto-translation-workflow.md#1",
        "topic": "howto-translation-workflow",
        "title": "Sending a fragment for translation",
        "section": "Choosing what to translate and which languages",
        "keywords": [
            "authoring",
            "sending a fragment for translation"
        ],
        "text": "Studio will not let a project be sent until it has a title, at least one target language, and at least one card, collection or placeholder attached. The title follows plain rules: it must have at least one letter or number, can only use letters, numbers, hyphens, underscores and dots, and can't contain two dots in a row. The language list Studio offers is each surface's own set of default languages, not every regional variation locale, and it leaves out the English source language by default so you only pick the languages you actually want translated into."
    },
    {
        "id": "howto-translation-workflow.md#2",
        "topic": "howto-translation-workflow",
        "title": "Sending a fragment for translation",
        "section": "Sending the project and what happens after",
        "keywords": [
            "authoring",
            "sending a fragment for translation"
        ],
        "text": "Sending a project calls an IO action, passing along the surface you're working in, which kicks off the actual localization job and stamps the project with a submission date. Once sent, the project becomes read only, so building a new batch of translations means creating a new project rather than reopening an old one. A sent project's status reads Pending while it's queued, Running while it's in progress, \"Sent to loc\" once it has been handed off to the localization system, or Failed if that handoff didn't go through."
    },
    {
        "id": "howto-translation-workflow.md#3",
        "topic": "howto-translation-workflow",
        "title": "Sending a fragment for translation",
        "section": "Common questions",
        "keywords": [
            "authoring",
            "sending a fragment for translation"
        ],
        "text": "Why can't I click send on a translation project: check that it has a title, at least one target language and at least one card, collection or placeholder, all three are required. Why can I no longer edit a translation project I just sent: sending locks the project, start a new one for further changes. Why don't I see every regional locale in the language list: the picker only offers each surface's default languages, not the full set of regional variations."
    },
    {
        "id": "limitations.md#0",
        "topic": "limitations",
        "title": "Known gaps",
        "section": "Can I see which pages use a card?",
        "keywords": [
            "platform",
            "authoring",
            "known gaps"
        ],
        "text": "Not today. MAS Studio has no built-in \"where used\" lookup for cards. If several pages reuse the same fragment id, editing that shared fragment affects every page that renders it, and there is no report that lists them."
    },
    {
        "id": "limitations.md#1",
        "topic": "limitations",
        "title": "Known gaps",
        "section": "Is there an AOS API that turns an offer id into an OSI?",
        "keywords": [
            "platform",
            "authoring",
            "known gaps"
        ],
        "text": "No documented AOS API converts an offer id directly into an OSI. The documented flow is to create an offer selector with `POST /offer_selectors` and then query it with `GET /offers:search.selector`. `GET /offers/{ids}` only returns offer details."
    },
    {
        "id": "limitations.md#2",
        "topic": "limitations",
        "title": "Known gaps",
        "section": "Can the offer selector tool list countries alphabetically?",
        "keywords": [
            "platform",
            "authoring",
            "known gaps"
        ],
        "text": "Not today. The country dropdown order belongs to the offer selector tool itself rather than to MAS authoring configuration, so it cannot be changed from MAS Studio settings. As a workaround, click the dropdown and type the country abbreviation, then press Enter to jump to it."
    },
    {
        "id": "limitations.md#3",
        "topic": "limitations",
        "title": "Known gaps",
        "section": "Can a promotion leave a personalization segment alone?",
        "keywords": [
            "platform",
            "authoring",
            "known gaps"
        ],
        "text": "Not today. A promotion that targets a card also reaches visitors who get a grouped variation of it, either through a promo variation or through the promo code, and no project setting excludes a segment. Adding the grouped variation to the project does not protect it. The request is tracked in MWPW-208439. As a workaround, an MEP manifest row can swap individual card fields to the grouped variation's own id, which served those fields without the promotion on the adobe.com homepage; fields that are not swapped still show the promotion."
    },
    {
        "id": "limitations.md#4",
        "topic": "limitations",
        "title": "Known gaps",
        "section": "Is there an audit log for a deleted fragment?",
        "keywords": [
            "platform",
            "authoring",
            "known gaps"
        ],
        "text": "No. There is no audit log today showing who deleted a card fragment, and no built-in recovery. The editor's delete dialog states that the action cannot be undone, and when the fragment has variations it warns that they will be deleted too, with a count by type such as \"2 locale, 1 promo variation(s)\", but does not name them."
    },
    {
        "id": "limitations.md#5",
        "topic": "limitations",
        "title": "Known gaps",
        "section": "Can I subscribe to fragment create, modify and delete events?",
        "keywords": [
            "platform",
            "authoring",
            "known gaps"
        ],
        "text": "No activity or audit-log API exists for fragment events today. MAS runs on Odin, a managed AEM environment, so event-subscription requests go to the Odin team."
    },
    {
        "id": "limitations.md#6",
        "topic": "limitations",
        "title": "Known gaps",
        "section": "Can this assistant create or change an offer, or change its price?",
        "keywords": [
            "platform",
            "authoring",
            "known gaps"
        ],
        "text": "No. MAS never stores a price itself; a card only holds an offer's ID, and the price always comes from Adobe's separate commerce catalog systems, WCS and AOS, at render time. This assistant has no way to create an offer, change an offer's price, or adjust pricing policy."
    },
    {
        "id": "locale-picker.md#0",
        "topic": "locale-picker",
        "title": "The locale picker in MAS Studio",
        "section": "What does the locale picker change?",
        "keywords": [
            "authoring",
            "platform",
            "the locale picker in mas studio"
        ],
        "text": "The picker at the top right of MAS Studio sets the locale the whole session is scoped to, next to the surface picker. It lists the languages the current surface publishes, each shown with its country, and choosing one changes which fragments the Fragments page lists and which locale the other pages work in.\n\nIt is active on Home, on Fragments, on Placeholders and in the fragment editor. On the other pages it is shown but greyed out, and on the Promotions pages it is hidden altogether, because a promotion targets geos rather than one locale."
    },
    {
        "id": "locale-picker.md#1",
        "topic": "locale-picker",
        "title": "The locale picker in MAS Studio",
        "section": "Why do the Placeholders and Masks pages have a second picker?",
        "keywords": [
            "authoring",
            "platform",
            "the locale picker in mas studio"
        ],
        "text": "Those two pages add their own picker, labelled Region, which lists the regional locales that belong to the language currently selected in the header. Placeholders and masks are stored per surface and per locale, so the region choice decides which set of entries the page lists and which one a new entry is written into.\n\nThe header picker and the region picker answer different questions: the header one chooses the language, the region one chooses the country inside that language. Other dialogs reuse the same picker component in different modes. A global settings override uses it in region mode with checkboxes, listing every language and regional locale of the surface so an override can apply to several locales at once. The copy fragment dialog uses it in its default language mode, where you choose a single language locale for the copy."
    },
    {
        "id": "locale-picker.md#2",
        "topic": "locale-picker",
        "title": "The locale picker in MAS Studio",
        "section": "How do locales and variations relate in the picker?",
        "keywords": [
            "authoring",
            "platform",
            "the locale picker in mas studio"
        ],
        "text": "Each card has one fragment in its default locale and at most one variation per locale, as described in the glossary. When you open a card in the fragment editor, the picker lists the locales for that card and marks every locale with no variation as not translated. Choosing a locale that has a variation opens that variation; choosing one that has none shows the missing variation state instead.\n\nThe picker is how you move between existing variations, not how you make one. To create a variation, use Create Variation in the editor's side rail, which asks for a variation type and, for a regional variation, for the target locale in its own dialog. The picker is disabled while you are already inside a variation, so go back to the default locale fragment to switch again."
    },
    {
        "id": "mas-field.md#0",
        "topic": "mas-field",
        "title": "mas-field and headless cards",
        "section": "What is mas-field?",
        "keywords": [
            "platform",
            "authoring",
            "mas-field and headless cards"
        ],
        "text": "mas-field renders exactly one authored field of one card fragment inline on a page, with no card chrome around it. It runs the same data pipeline as a card, so locale-correct prices, promo codes and card settings such as hideTrialCTAs are honored. One known difference from merch-card: mas-field filters trial CTAs by a static analytics-id allowlist rather than by the resolved offer type from the commerce service."
    },
    {
        "id": "mas-field.md#1",
        "topic": "mas-field",
        "title": "mas-field and headless cards",
        "section": "How an indexed field reference resolves",
        "keywords": [
            "platform",
            "authoring",
            "mas-field and headless cards"
        ],
        "text": "A field name can carry an index in square brackets, which picks one item out of a multi-item field. CTAs are the usual case, written as `ctas[1]` or `ctas[2u25ddjvjn]`.\n\nA whole-number index selects by position, so `ctas[1]` takes the first anchor stored in the field. Any other index is first matched against the fragment's labels field for that field, such as `ctaLabels` for `ctas`, when the fragment has one: the item at the matching label's position is rendered, and if no label matches, the element hides itself. Only when there is no labels field is the index looked up as an anchor whose `data-key` attribute equals it, and a positional lookup that finds nothing falls back to the same `data-key` lookup. If nothing is found, the element sets itself hidden and renders nothing. There is no error and no console message.\n\nA `data-key` reference resolves against the anchors in whichever fragment is being rendered. An anchor in a variation can carry a different key from the equivalent anchor in its parent, so a reference written against one renders empty against the other, with no error. When an indexed CTA reference renders nothing, compare the key in the reference against the key on the anchor in the fragment that is actually being rendered, not the one it was authored from."
    },
    {
        "id": "mas-field.md#2",
        "topic": "mas-field",
        "title": "mas-field and headless cards",
        "section": "What does headless mean in MAS?",
        "keywords": [
            "platform",
            "authoring",
            "mas-field and headless cards"
        ],
        "text": "It means two different things. mas-field is a headless usage of any fragment: one field, rendered without a card. The Headless template is a Studio card template that renders a fragment as a labelled list of all its fields, such as Title, Product price and CTAs, instead of a designed layout. The Headless template is offered on the sandbox, acom-cc, acom and acom-dc surfaces. To place a single field on a consumer page, use the Copy Field button rather than the headless variant."
    },
    {
        "id": "masks.md#0",
        "topic": "masks",
        "title": "Masks",
        "section": "What is a mask?",
        "keywords": [
            "platform",
            "authoring",
            "masks"
        ],
        "text": "A mask is a card fragment, stored in a masks folder inside a surface and locale, that is laid over other cards when a page asks for it by name. It uses the same content model as a card, and only the fields it actually fills are overridden: everything the mask leaves empty keeps coming from the card itself. One mask therefore restyles or rewords many cards at once, without touching any of them.\n\nA mask can also carry a list of variables written as a key and a value. Those pairs join the dictionary used for placeholder replacement for that request, so a masked card can resolve tokens that the surface dictionary does not define. See the placeholders page for how token replacement works."
    },
    {
        "id": "masks.md#1",
        "topic": "masks",
        "title": "Masks",
        "section": "When does a mask apply?",
        "keywords": [
            "platform",
            "authoring",
            "masks"
        ],
        "text": "Only when the request names it. The fragment pipeline reads the mask name from the request, looks for that mask in the regional locale first and then in the surface default locale, and merges it onto the card before the card is returned. A request with no mask name is served exactly as authored, and masked and unmasked responses are cached separately."
    },
    {
        "id": "masks.md#2",
        "topic": "masks",
        "title": "Masks",
        "section": "Where are masks managed?",
        "keywords": [
            "platform",
            "authoring",
            "masks"
        ],
        "text": "Masks live under Advanced tools, on the Masks page, which lists the masks of the selected surface and region with their status and last update, and offers Create mask. Access is granted per surface, in the same way as global settings, so an author without that permission sees a no access message instead of the list.\n\nThe mask editor shows general information, where the name is fixed once the mask is created and the title can still change, followed by the field sections Content, Price and promo, Footer, Badge and colors, and Placeholders. These sections follow the plans card template rather than offering a template picker, and a blurred preview beside them reveals each part of the card as the matching field gains content."
    },
    {
        "id": "milo-cards-collections.md#0",
        "topic": "milo-cards-collections",
        "title": "MAS cards and collections on Milo pages",
        "section": "What Milo builds for a MAS card link",
        "keywords": [
            "platform",
            "milo",
            "authoring",
            "mas cards and collections on milo pages"
        ],
        "text": "For a Studio card link, Milo builds `<merch-card consonant><aem-fragment fragment=\"<id>\"></aem-fragment></merch-card>`, adding `mask` and `pzn` to `aem-fragment` when the link's hash has them. If the link is alone in its paragraph, the whole paragraph is replaced. When the same fragment, `pzn` and `mask` combination appears again on the page, the repeat gets `loading=\"cache\"` and reuses the first request.\n\n`aem-fragment` then fetches the card from MAS IO, and the card resolves its prices and CTAs. After the card is ready Milo decorates it: it wires up modals, localizes links, adds CTA aria labels and analytics ids, and, when the page metadata sets `mas-heading-level` (`h1` to `h6`), changes the card's heading levels."
    },
    {
        "id": "milo-cards-collections.md#1",
        "topic": "milo-cards-collections",
        "title": "MAS cards and collections on Milo pages",
        "section": "Why a broken card is invisible on production",
        "keywords": [
            "platform",
            "milo",
            "authoring",
            "mas cards and collections on milo pages"
        ],
        "text": "A MAS card that fails hides itself (`display: none`) unless the page is in preview mode, and dispatches `mas:error`. So on `www.adobe.com` a broken card is simply missing, with no message. The reason is in the browser console. Typical messages are \"AEM fragment cannot be loaded\", \"CTA has an invalid offer\", \"Contains unresolved offers\", and a \"not resolved within 20000 timeout\".\n\nOn `localhost` and `*.aem.page` pages only, Milo also puts a visible box above a failed card, labelled \"Load Error\" or \"Not Found\" and followed by \"Card:\" and the fragment id. A failed collection gets the same box labelled \"Collection:\". To see why a production card is missing, open the same page on its `.aem.page` host, or run the Milo preflight \"M@S Unpublished Fragments\" check."
    },
    {
        "id": "milo-cards-collections.md#2",
        "topic": "milo-cards-collections",
        "title": "MAS cards and collections on Milo pages",
        "section": "Do MAS cards slow down the rest of a Milo page",
        "keywords": [
            "platform",
            "milo",
            "authoring",
            "mas cards and collections on milo pages"
        ],
        "text": "They can, for a few seconds. Milo loads a page one section at a time and waits for every block in a section before moving to the next. A card waits for the commerce service and for its own readiness, each capped at five seconds, so a slow card can hold back the sections below it for about five seconds before Milo moves on. The card itself keeps trying for up to 20 seconds. A collection waits up to ten seconds for its files, and up to 30 seconds for its cards.\n\nIf a section below a card appears late, check the card in the Network tab: a slow MAS IO or pricing request, or a card that never finishes, is the usual cause."
    },
    {
        "id": "milo-cards-collections.md#3",
        "topic": "milo-cards-collections",
        "title": "MAS cards and collections on Milo pages",
        "section": "How to link to a collection with a filter already selected",
        "keywords": [
            "platform",
            "milo",
            "authoring",
            "mas cards and collections on milo pages"
        ],
        "text": "Collection state lives in the page URL's hash, not its query string. A collection reads `filter` (or `category`), `types`, `sort`, `search`, `single_app` and `page` from the hash, and writes them back as the visitor filters, sorts or presses Show more; picking a new filter resets `page`. So a deep link looks like `…/plans.html#filter=photography`.\n\nThe side navigation writes `category` for a collection whose `variant` is `catalog` and `filter` for every other collection. It is on by default; `#sidenav=false` on the Studio link turns it off. It is only built when the collection has categories (child collections).\n\nA `?filter=` or `?single_app=` in the query string only works on a collection with a side navigation: when the side navigation starts, it moves those two values from the query string into the hash. Milo also maps some `single_app` values to a filter in that case: `illustrator` to `illustration`, `indesign` and `incopy` to `design`, `animate`, `premiere`, `aftereffects` and `audition` to `video-audio`, and `lightroom_1tb` to `photography`. On a collection without a side navigation, a query-string filter does nothing."
    },
    {
        "id": "milo-cards-collections.md#4",
        "topic": "milo-cards-collections",
        "title": "MAS cards and collections on Milo pages",
        "section": "Why a collection shows only 27 cards",
        "keywords": [
            "platform",
            "milo",
            "authoring",
            "mas cards and collections on milo pages"
        ],
        "text": "A collection shows 27 cards per page, and Show more adds the next 27. A collection with no categories is fixed to `filtered=\"all\"`, and a `filtered` collection starts on page one and never renders the Show more footer. Reading the code, a collection with no categories and more than 27 cards shows only its first 27 with no way to see the rest. This has not been confirmed on a live page. If it happens, the fix is to give the collection categories, or to split the cards across collections."
    },
    {
        "id": "milo-cards-collections.md#5",
        "topic": "milo-cards-collections",
        "title": "MAS cards and collections on Milo pages",
        "section": "How a collection chooses its column layout",
        "keywords": [
            "platform",
            "milo",
            "authoring",
            "mas cards and collections on milo pages"
        ],
        "text": "The collection's column classes come from the template of its first card only (its `variant` value). Plans collections with two or three non-wide cards, segment and product collections with two or three cards, and mini compare charts with at most two cards get a two or three column layout. A collection whose first card has a different template from the rest will lay out for that first card.\n\nMilo adds one styling rule of its own: a `plans` collection inside tabs, on one of about 45 listed locale prefixes such as `de`, `fr`, `uk`, `jp` and `au`, gets the `red-strikethrough-price` class, so its strikethrough prices are red."
    },
    {
        "id": "milo-cards-collections.md#6",
        "topic": "milo-cards-collections",
        "title": "MAS cards and collections on Milo pages",
        "section": "The legacy Milo merch-card block versus a MAS card",
        "keywords": [
            "platform",
            "milo",
            "authoring",
            "mas cards and collections on milo pages"
        ],
        "text": "Milo still has an older `merch-card` block that builds a card from a table authored in the page document. It creates the same `<merch-card>` element but has no `aem-fragment`, so nothing comes from Odin or MAS IO. Its prices and CTAs come from OST links inside the table.\n\nNothing authored in MAS Studio applies to a legacy card: settings, placeholders, masks, variations, promotions, translations and publish status are all MAS features. Its supported types are `segment`, `special-offers`, `plans`, `catalog`, `product`, `inline-heading`, `image`, `mini-compare-chart` and `twp`, defaulting to `product`. Multi-offer legacy cards use `merch-offer-select`. The code does not mark the block as deprecated.\n\nTo tell the two apart on a page, look for `aem-fragment` inside the `merch-card`. A card with one is a MAS card: debug it in Studio and MAS IO. A card without one is a legacy block: debug the page document."
    },
    {
        "id": "milo-cards-collections.md#7",
        "topic": "milo-cards-collections",
        "title": "MAS cards and collections on Milo pages",
        "section": "Milo blocks that host MAS cards",
        "keywords": [
            "platform",
            "milo",
            "authoring",
            "mas cards and collections on milo pages"
        ],
        "text": "Milo's generic `tabs` block does nothing special for cards: it doesn't equalize heights or wait for cards to load. It deep-links a tab with `?<tabs-id>=<deeplink>` (for example `?plans=edu`) or `?tab=<id>-<n>`. For cards inside tabs, Milo changes the analytics ids so that tab clicks are reported as user actions.\n\nCard height alignment is done by MAS, per card template, not by Milo. Milo's `table` block does its own height alignment when MAS reports prices as resolved (`mas:resolved`). The c2 `product-marquee-grid` block does not create a `merch-card` at all: it builds its own layout and pulls single fields (such as `field=prices` and `field=description`) through `mas-field`."
    },
    {
        "id": "milo-cards-collections.md#8",
        "topic": "milo-cards-collections",
        "title": "MAS cards and collections on Milo pages",
        "section": "MAS events a Milo page listens for",
        "keywords": [
            "platform",
            "milo",
            "authoring",
            "mas cards and collections on milo pages"
        ],
        "text": "Milo listens for `aem:load`, `aem:error`, `mas:ready`, `mas:resolved`, and the collection events for sort, show more, sidenav select, search change and quantity change. MAS also emits `mas:error`, `mas:failed` and `wcms:commerce:ready`, the last of which `aem-fragment` waits for when no commerce service exists yet. A page script that needs to act after a card is ready should listen for `mas:ready` on the card instead of polling."
    },
    {
        "id": "milo-loading.md#0",
        "topic": "milo-loading",
        "title": "How a Milo page loads and starts MAS",
        "section": "Where a Milo page gets the MAS bundles",
        "keywords": [
            "platform",
            "milo",
            "deploy",
            "how a milo page loads and starts mas"
        ],
        "text": "Milo does not carry its own copy of MAS. There is no MAS folder under Milo's `libs/deps`; every MAS file (`commerce.js`, `mas.js`, `merch-card.js`, `mas-field.js` and the rest) is loaded at runtime from outside Milo.\n\nWhich URL it loads from depends only on the page's hostname. On exactly `www.adobe.com` the files come from `https://www.adobe.com/mas/libs/<name>.js`. On every other host — `www.stage.adobe.com`, any `*.aem.page` or `*.aem.live` preview, localhost — they come from MAS `main` on Edge Delivery: `https://main--mas--adobecom.aem.live/web-components/dist/<name>.js`. A stage page therefore runs the latest merged MAS code, not a separately released stage build."
    },
    {
        "id": "milo-loading.md#1",
        "topic": "milo-loading",
        "title": "How a Milo page loads and starts MAS",
        "section": "Who builds and deploys the MAS bundles",
        "keywords": [
            "platform",
            "milo",
            "deploy",
            "how a milo page loads and starts mas"
        ],
        "text": "The MAS team builds and ships them from the `adobecom/mas` repository; the Milo team takes no action for a MAS release. `web-components/build.mjs` writes the bundles to `web-components/dist`, the built files are committed, and the web-components PR workflow fails a PR whose committed `dist` does not match a fresh build. Merging to MAS `main` publishes them on `main--mas--adobecom.aem.live`, which is what every non-production Milo host loads. How `www.adobe.com/mas/libs/` is mapped to that content is not in either repository (it is CDN configuration), so confirm a production rollout by loading the file on `www.adobe.com`, not by reading code.\n\nOlder MAS docs describe a `mas-ff-mas-deps` flag with a fallback to Milo's `../../deps/mas/`. Neither exists in today's Milo: if a MAS file fails to load, Milo caches the failure and rethrows it; there is no fallback copy."
    },
    {
        "id": "milo-loading.md#2",
        "topic": "milo-loading",
        "title": "How a Milo page loads and starts MAS",
        "section": "What maslibs does on a Milo page",
        "keywords": [
            "platform",
            "milo",
            "deploy",
            "how a milo page loads and starts mas"
        ],
        "text": "`?maslibs=` on a Milo page swaps where the MAS bundles load from, so a MAS branch can be tested on a real page. Milo validates the value itself:\n- `local` → `http://localhost:3000` (serve the built `web-components/dist` there yourself).\n- `main` → `https://main--mas--adobecom.aem.live`.\n- A bare branch name → `https://<branch>--mas--adobecom.aem.live`; `branch--repo` and `branch--repo--owner` are also accepted, for a fork.\n- The value is lowercased and limited to 100 characters, and Milo always uses `.aem.live`, never `.aem.page`. Anything else is ignored.\n- `stage` has no special meaning: it is treated as a branch called `stage`.\n\nThe bundles then load from `<base>/web-components/dist/`, and Milo also imports that branch's `studio/libs/fragment-client.js` when the service starts.\n\n**`maslibs` is ignored on `www.adobe.com`.** A branch can be tested on stage, `.aem.page` and `.aem.live` Milo pages, never on production. MAS CI tests each web-components PR this way, on Milo `main` with `?maslibs=<branch>--mas--<owner>`."
    },
    {
        "id": "milo-loading.md#3",
        "topic": "milo-loading",
        "title": "How a Milo page loads and starts MAS",
        "section": "Which authored link becomes which MAS block",
        "keywords": [
            "platform",
            "milo",
            "deploy",
            "how a milo page loads and starts mas"
        ],
        "text": "Milo turns links into blocks by a plain substring match on the link's URL, and the first pattern that matches wins, so the order matters:\n1. `/tools/ost?` or `/miniplans` → the `merch` block (an inline price or a checkout link).\n2. `mas.adobe.com/studio.html#content-type=mas-compare-chart` → a compare chart.\n3. `mas.adobe.com/studio.html#content-type=merch-card-collection` → a card collection.\n4. Any other `mas.adobe.com/studio.html` link → a single card. A Studio link whose hash contains `field=` is the exception: it renders just that one field (`mas-field`), not a card.\n\nThe link's host must be trusted or it stays a plain link: the page's own host, `adobe.com` or any `*.adobe.com`, or any `*.hlx.page`, `*.hlx.live`, `*.aem.page` or `*.aem.live` host. A link that already carries `data-wcs-osi` is left alone."
    },
    {
        "id": "milo-loading.md#4",
        "topic": "milo-loading",
        "title": "How a Milo page loads and starts MAS",
        "section": "What the Studio link's hash controls",
        "keywords": [
            "platform",
            "milo",
            "deploy",
            "how a milo page loads and starts mas"
        ],
        "text": "A card or collection is configured only by the hash of its Studio link; the query string is ignored. The recognised hash keys are:\n- `fragment` or `query` — the fragment id (the two are aliases). Without one, nothing renders and the authored link stays on the page.\n- `mask`, `pzn`, `field` — passed through to the card.\n- `sidenav` — `true` turns on a collection's side navigation.\n- `jsonld` — `on` injects the card's structured data (JSON-LD) into the page and renders no visible card."
    },
    {
        "id": "milo-loading.md#5",
        "topic": "milo-loading",
        "title": "How a Milo page loads and starts MAS",
        "section": "What an OST link's parameters control",
        "keywords": [
            "platform",
            "milo",
            "deploy",
            "how a milo page loads and starts mas"
        ],
        "text": "A `/tools/ost?` link becomes a checkout link when `type=checkoutUrl`, and an inline price for any other `type`. `osi` is required; without it nothing renders.\n- Price links read `term`, `seat`, `tax`, `planType`, `exclusive`, `alt` and `quantity`; `type` picks the template (`price`, `optical`, `discount`, `strikethrough`, `promo-strikethrough`, `annual`, `legal`, and the older `priceOptical` style names). `old` only matters when a promo is present, and `annual` only when the page turns on `mas-ff-annual-price`.\n- Checkout links read `workflowStep`, `marketSegment`, `entitlement`, `upgrade`, `modal`, `fallbackStep` and `target=_blank`; allow-listed checkout keys such as `cli`, `ctx`, `apc`, `ms`, `cs`, `q`, `promoid`, `rf` and `pcid` are passed to checkout. A `#_tcl` hash makes a text link instead of a button.\n- The promo code is the link's `promo` or `promotionCode` parameter, or the nearest ancestor with `data-promotion-code`. `perp=true` marks a perpetual offer."
    },
    {
        "id": "milo-loading.md#6",
        "topic": "milo-loading",
        "title": "How a Milo page loads and starts MAS",
        "section": "How Milo creates the commerce service",
        "keywords": [
            "platform",
            "milo",
            "deploy",
            "how a milo page loads and starts mas"
        ],
        "text": "Milo's merch code loads `commerce.js` and appends one `<mas-commerce-service>` to the page `<head>`. It sets `locale`, `language` and, when known, `country` (see the Milo locale and country concept), then copies every key of the site's Milo `commerce` config onto it as attributes.\n\nOn any non-production Milo environment Milo also adds `allow-override`. Only then do the `commerce.env` and `commerce.landscape` settings take effect; on production they are ignored. Milo counts `*.aem.page`, `*.aem.live`, and stage, corp, graybox and `aem.reviews` hosts as non-production, and `?env=` can force it.\n\nMAS defaults to production pricing (WCS) whatever the Milo environment is. On a non-production page, `commerce.env=stage` switches to stage WCS and stage MAS IO, and `commerce.landscape` takes `DRAFT` or `PUBLISHED`. These are read from the page URL or from session or local storage; `commerce.env` is not read from page metadata.\n\nService settings are looked up in the page URL first, then session or local storage, then a page `<meta>` tag. That covers `checkoutClientId` (default `adobe_com`), `checkoutWorkflowStep` (default `email`), `displayOldPrice`, `displayRecurrence`, `displayTax`, `displayPlanType`, `entitlement`, `modal`, `forceTaxExclusive`, `promotionCode`, `quantity` and `wcsApiKey`. A value left in session storage from an earlier test can therefore still apply after the URL parameter is gone."
    },
    {
        "id": "milo-loading.md#7",
        "topic": "milo-loading",
        "title": "How a Milo page loads and starts MAS",
        "section": "Which Milo pages show unpublished drafts",
        "keywords": [
            "platform",
            "milo",
            "deploy",
            "how a milo page loads and starts mas"
        ],
        "text": "Milo turns MAS preview on automatically on any `*.aem.page` host and on exactly `www.stage.adobe.com`. In preview, cards are built in the browser from the Odin preview (authoring) tier instead of MAS IO, so these pages show unpublished card edits, need the corporate network, and keep a failing card visible instead of hiding it. `?mas.preview=off` (or `false`) turns preview off. A `.aem.live` page and `www.adobe.com` are not in preview and show only published content.\n\nThat is the usual answer to \"it looks right on the preview page but not on production\": the preview page shows the draft, and production shows what was last published."
    },
    {
        "id": "milo-loading.md#8",
        "topic": "milo-loading",
        "title": "How a Milo page loads and starts MAS",
        "section": "What the Milo preflight checks for MAS",
        "keywords": [
            "platform",
            "milo",
            "deploy",
            "how a milo page loads and starts mas"
        ],
        "text": "Milo's preflight tool has two MAS checks.\n- **M@S Unpublished Fragments** (critical) runs three seconds after load. It requests every card's fragment from production MAS IO with the page's locale, and fails on any response that is not 200. It is the quickest way to find a card that was never published.\n- The **Merch** panel lists every offer on the page and flags \"Offer unavailable\" when a price or CTA failed to resolve. It follows each checkout link and fails it if the final URL contains an error or the product changed. It checks each promotion code as valid, expired or not found, and warns when one section or block uses more than one MAS fragment id."
    },
    {
        "id": "milo-locale-country.md#0",
        "topic": "milo-locale-country",
        "title": "Locale and country for MAS content on Milo pages",
        "section": "How the Milo page prefix becomes the MAS locale and country",
        "keywords": [
            "platform",
            "milo",
            "pricing",
            "locale and country for mas content on milo pages"
        ],
        "text": "Milo, not MAS, decides the locale and country that cards request. Milo's merch code reads only the page's locale prefix (the `/fr` or `/ch_fr` in the URL), not its `ietf` value, and maps it to a MAS locale of the form `language_COUNTRY`:\n- A prefix listed in Milo's `GeoMap` table uses that entry: `/ch_fr` becomes `fr_CH`, `/la` becomes `es_DO` and `/africa` becomes `en_MU`.\n- Any other `country_language` prefix is split in two: `/ca_fr` becomes `fr_CA` and `/ae_ar` becomes `ar_AE`.\n- No prefix (the global English site) is `en_US`.\n- `/langstore/<lang>` pages use a language-to-country table instead: `/langstore/el` becomes `el_GR`.\n- Puerto Rico is special: `/pr` requests the `es_PR` locale, but MAS prices Puerto Rico as `US`, because commerce has no Puerto Rico prices.\n\nThe mapping assumes English when a prefix is only a country and is not in `GeoMap`. `/in` becomes `en_IN`, and Greek `/el` becomes `en_EL`, with country `EL`. `EL` is not a country MAS prices, so pricing falls back to US, and IO may not recognise `en_EL` as a locale. That follows from reading the code and is untested. When a Greek or other unusual market page shows English or US prices, check this mapping first.\n\nSites that put the language first in the URL (such as `/es/mx`) are not handled by this mapping. Unless the page turns on geo detection, it can produce an invalid locale. That also comes from reading the code and should be confirmed with the Milo team."
    },
    {
        "id": "milo-locale-country.md#1",
        "topic": "milo-locale-country",
        "title": "Locale and country for MAS content on Milo pages",
        "section": "Why the visitor's Adobe account country does not change prices on a Milo page",
        "keywords": [
            "platform",
            "milo",
            "pricing",
            "locale and country for mas content on milo pages"
        ],
        "text": "On a Milo page, the page's market sets the country for MAS content, not the visitor. MAS only uses the signed-in visitor's `ims_country_code` cookie when the page gives no country. It treats a locale with a country part (`fr_FR`, `en_US`) as an explicit country. Milo always passes such a locale, so `aem-fragment` never reads the cookie on a Milo page. A UK account on the US page sees US prices. That is intended, not a bug.\n\nThe IO request only carries `&country=` when the country differs from the locale's own country, for example `locale=en_GB&country=AU`."
    },
    {
        "id": "milo-locale-country.md#2",
        "topic": "milo-locale-country",
        "title": "Locale and country for MAS content on Milo pages",
        "section": "Why ?country= does not change the prices on a Milo page",
        "keywords": [
            "platform",
            "milo",
            "pricing",
            "locale and country for mas content on milo pages"
        ],
        "text": "By default a Milo page ignores `?country=` and the visitor's location for MAS. The country comes only from the URL prefix. `?country=`, `?akamaiLocale=` and the visitor's detected location only matter for MAS when the page turns on geo detection. To see another market's prices, open that market's localized page (`/fr/...`), or add `?mas-geo-detection=on&country=FR` to the page URL."
    },
    {
        "id": "milo-locale-country.md#3",
        "topic": "milo-locale-country",
        "title": "Locale and country for MAS content on Milo pages",
        "section": "What mas-geo-detection changes",
        "keywords": [
            "platform",
            "milo",
            "pricing",
            "locale and country for mas content on milo pages"
        ],
        "text": "`mas-geo-detection`, set to `on` or `true` as a URL parameter or as page metadata, lets the visitor's market decide the country. Milo then picks the first of these that gives a country: `?country=`, then `?akamaiLocale=`, then the Akamai value in session storage, then a lookup on `geo2.adobe.com`. The `country` cookie also counts, and so does the `ims_country_code` cookie when the page also sets `mas-ims-login=on`. The result is checked against the markets the page's language supports, and a market that is not supported becomes the language's default market.\n\nWith geo detection on, the global English page gives visitors from Australia, India and the United Kingdom the `en_GB` locale, so they see the UK English card copy. `/au`, `/in` and `/uk` keep their own locales. Milo also puts the validated market on checkout links (`data-ims-country`). If MAS later sets an unsupported account country on them, Milo changes it back.\n\nPersonalization (MEP) works out its own visitor country for `countryip(...)` audiences, whether or not `mas-geo-detection` is on. So a Target activity can target by location while MAS prices follow the page prefix."
    },
    {
        "id": "milo-locale-country.md#4",
        "topic": "milo-locale-country",
        "title": "Locale and country for MAS content on Milo pages",
        "section": "Why the market selector does not update prices until the page reloads",
        "keywords": [
            "platform",
            "milo",
            "pricing",
            "locale and country for mas content on milo pages"
        ],
        "text": "The market selector sets `country` on the page's commerce service and stores the chosen market in the `country` cookie. But the commerce service reads `locale`, `country` and `language` only once, when it starts, so changing the attribute afterwards changes nothing on the running page. That is also from reading the code. The selector then reloads or redirects with `?country=<market>`, and that parameter only affects MAS when geo detection is on. Choosing a language whose markets do not include the stored market resets the cookie to that language's default market."
    },
    {
        "id": "offers-and-ost.md#0",
        "topic": "offers",
        "title": "Offers and the Offer Selector Tool (OST)",
        "section": "What is the difference between a card and an offer?",
        "keywords": [
            "offer",
            "OSI",
            "offer selector",
            "OST",
            "price",
            "AOS",
            "product",
            "link offer",
            "arrangement code"
        ],
        "text": "A card is a content fragment authored in MAS Studio: the text, images, badges, and CTAs that users see. An offer is a commerce entity in Adobe's offer catalog (AOS) that defines a purchasable thing: the product, price, commitment, term, and customer segment. Cards never hardcode prices; instead a card stores an Offer Selector ID (OSI) that points at an offer. When the card renders on a page, the merch-card web component uses the OSI to fetch the current price from Adobe's Web Commerce Service (WCS) for the user's locale. If the price changes in the catalog, cards show the new price automatically without any re-authoring."
    },
    {
        "id": "offers-and-ost.md#1",
        "topic": "offers",
        "title": "Offers and the Offer Selector Tool (OST)",
        "section": "What is an OSI (Offer Selector ID)?",
        "keywords": [
            "offer",
            "OSI",
            "offer selector",
            "OST",
            "price",
            "AOS",
            "product",
            "link offer",
            "arrangement code"
        ],
        "text": "An OSI is the identifier stored on a card that selects its offer. It is a string of 7 to 64 characters made of letters, digits, underscores, and hyphens. An OSI is locale-agnostic: the same OSI works across all locales where the offer is valid, and currency, tax labels, and formatting are resolved automatically for the page's locale. An OSI is not the same thing as a raw offer ID, which is a 32-character hexadecimal string identifying one specific offer in AOS. The AI assistant can resolve an OSI to its underlying offer details, and can also fetch a single offer directly by its 32-character hex offer ID."
    },
    {
        "id": "offers-and-ost.md#2",
        "topic": "offers",
        "title": "Offers and the Offer Selector Tool (OST)",
        "section": "What is the Offer Selector Tool (OST)?",
        "keywords": [
            "offer",
            "OSI",
            "offer selector",
            "OST",
            "price",
            "AOS",
            "product",
            "link offer",
            "arrangement code"
        ],
        "text": "OST is Studio's built-in tool for finding an offer and attaching it to a card. Open it from the Offer Selector ID field in the card editor, search by product name, and narrow results by customer segment (individual, team, student), commitment, and term (monthly, annual). Selecting an offer inserts its OSI into the card; save the card afterwards so the OSI persists. OST also opens from the price and CTA fields in the card editor — selecting an offer there inserts an inline price or a checkout link into the field at the cursor. In release flows OST can open in a multi-select mode that picks a base offer and a trial offer together. The AI assistant can open OST for you on request, optionally pre-filled with search parameters."
    },
    {
        "id": "offers-and-ost.md#3",
        "topic": "offers",
        "title": "Offers and the Offer Selector Tool (OST)",
        "section": "How do I link an offer to a card?",
        "keywords": [
            "offer",
            "OSI",
            "offer selector",
            "OST",
            "price",
            "AOS",
            "product",
            "link offer",
            "arrangement code"
        ],
        "text": "In the editor, open OST from the OSI field, pick the offer, insert it, and save the card. Alternatively, ask the AI assistant to link a card to an offer by giving it the card ID and the OSI; it confirms with you before making the change. After linking, the assistant can validate card-offer consistency: it checks that the card's tags (plan type, offer type, customer segment) agree with the linked offer and reports any mismatches."
    },
    {
        "id": "offers-and-ost.md#4",
        "topic": "offers",
        "title": "Offers and the Offer Selector Tool (OST)",
        "section": "How do I find offers or products without opening OST?",
        "keywords": [
            "offer",
            "OSI",
            "offer selector",
            "OST",
            "price",
            "AOS",
            "product",
            "link offer",
            "arrangement code"
        ],
        "text": "Ask the AI assistant. It can search the AOS offer catalog with filters such as product arrangement code, commitment, term, customer segment, market segment, offer type, country, locale, and price point. It can list Adobe products from the catalog and search them by name, fetch a single product by its exact product arrangement (PA) code, and compare all plan types available for one product arrangement side by side. These are read-only lookups, so no confirmation is needed."
    },
    {
        "id": "offers-and-ost.md#5",
        "topic": "offers",
        "title": "Offers and the Offer Selector Tool (OST)",
        "section": "Can the AI assistant create a new offer selector?",
        "keywords": [
            "offer",
            "OSI",
            "offer selector",
            "OST",
            "price",
            "AOS",
            "product",
            "link offer",
            "arrangement code"
        ],
        "text": "Yes. To create an offer selector the assistant needs the product arrangement code, customer segment, market segment, and offer type; commitment, term, and price point are optional refinements. It asks for your confirmation, creates the selector in AOS, and returns the new OSI, which you or the assistant can then link to a card."
    },
    {
        "id": "offers-and-ost.md#6",
        "topic": "offers",
        "title": "Offers and the Offer Selector Tool (OST)",
        "section": "Is the Promotions page the same as a PROMOTION offer type?",
        "keywords": [
            "offer",
            "OSI",
            "offer selector",
            "OST",
            "price",
            "AOS",
            "product",
            "link offer",
            "arrangement code"
        ],
        "text": "No — they are different things that share a name. In the offer catalog, every offer has an offer type attribute such as BASE, TRIAL, or PROMOTION, describing what kind of purchasable offer it is. The Promotions page in MAS Studio manages promotion projects: named campaigns with a promo code, start and end dates, target geos and surfaces, and attached offers and cards, published on a schedule. When someone asks how promotions work in Studio, the answer is the Promotions page and its editor, not the offer type attribute."
    },
    {
        "id": "offers-and-ost.md#7",
        "topic": "offers",
        "title": "Offers and the Offer Selector Tool (OST)",
        "section": "What about offers that are not live yet (draft offers)?",
        "keywords": [
            "offer",
            "OSI",
            "offer selector",
            "OST",
            "price",
            "AOS",
            "product",
            "link offer",
            "arrangement code"
        ],
        "text": "OST searches published production offers by default. Offers that are still being onboarded exist in the DRAFT landscape and can be found by adding the commerce.landscape=DRAFT parameter to OST. A card authored against a draft offer switches automatically to the published version once the offer is released, so no re-authoring is needed. If you expect an offer to exist but cannot find it in either landscape, ask in the #merch-at-scale Slack channel."
    },
    {
        "id": "osi.md#0",
        "topic": "osi",
        "title": "Offers and the OSI",
        "section": "What is an OSI?",
        "keywords": [
            "platform",
            "offers and the osi"
        ],
        "text": "An OSI, an Offer Selector ID, is the identifier stored on a card that points at an offer in Adobe's offer catalog (AOS). Cards never hardcode prices: the merch-card component uses the OSI to fetch the current price from Adobe's Web Commerce Service at render time, so a catalog price change reaches every card without re-authoring. An OSI is not the same as a raw 32-character hexadecimal offer id, which identifies one specific offer."
    },
    {
        "id": "osi.md#1",
        "topic": "osi",
        "title": "Offers and the OSI",
        "section": "How do I attach an offer to a card?",
        "keywords": [
            "platform",
            "offers and the osi"
        ],
        "text": "Open the Offer Selector Tool from the Offer Selector ID field in the card editor, search for the product, and narrow by customer segment, commitment and term. Selecting an offer inserts its OSI, and the card must be saved for the OSI to persist. The tool also opens from the price and CTA fields, where selecting an offer inserts an inline price or a checkout link instead. It searches published production offers by default; add `commerce.landscape=DRAFT` to search draft offers."
    },
    {
        "id": "page-personalization.md#0",
        "topic": "page-personalization",
        "title": "How a personalized card reaches a consumer page",
        "section": "The two routes a grouped variation can take to a page",
        "keywords": [
            "platform",
            "authoring",
            "how a personalized card reaches a consumer page"
        ],
        "text": "A grouped variation is selected by personalization tags, but the tags alone do not put it on a page. Something on the page has to ask for it, and there are two different ways that happens.\n\nThe first route is whole card. The authored link for the card carries a `pzn` value, the card sends it to the IO fragment endpoint, and IO scores the value against each variation's personalization tags and merges the winner over the default card. Every field of the card changes together.\n\nThe second route is per field. A Target activity, delivered as an MEP manifest, rewrites which fragment one single field reads from. Only the fields named in the manifest change.\n\nThese are independent. A page can use one, the other, or neither. Before debugging why a grouped variation is not showing, establish which route the page uses, because the checks are completely different."
    },
    {
        "id": "page-personalization.md#1",
        "topic": "page-personalization",
        "title": "How a personalized card reaches a consumer page",
        "section": "Where the pzn value comes from",
        "keywords": [
            "platform",
            "authoring",
            "how a personalized card reaches a consumer page"
        ],
        "text": "`pzn` is the value a card sends to IO to select a variation by personalization tag, and it is authored rather than dynamic. The merch block reads it from the hash of the authored link that creates the card, alongside `mask` and `field`, and copies it into the card's options. The value is therefore fixed in the page content at authoring time.\n\nTarget and MEP cannot set it. MEP's in-block handling runs before the card element is created, so there is no card yet to set an attribute on, and the only thing a manifest row replaces on that path is the fragment id. A page that was not authored with a `pzn` value will never request one, whatever the Target activity does.\n\nSo whole card personalization has to be arranged in the page source, not in the activity."
    },
    {
        "id": "page-personalization.md#2",
        "topic": "page-personalization",
        "title": "How a personalized card reaches a consumer page",
        "section": "How a manifest row targets one card field",
        "keywords": [
            "platform",
            "authoring",
            "how a personalized card reaches a consumer page"
        ],
        "text": "An MEP manifest row that personalizes MAS content uses an `in-block:mas` selector, and both the selector and the replacement are Studio links carrying a fragment id in `query=` and an optional `field=`.\n\nMEP parses the selector's hash into a fragment id plus a field name, and stores the row in a two level map, keyed first by the fragment id and then by the field name, with an empty string standing for a row with no `field=`. The replacement link is reduced to just its fragment id, so any `field=` written on the replacement side is discarded and has no effect.\n\nWhen the merch block builds a card it looks the row up by that same pair, the authored fragment id and the field it is rendering. The field names are compared as exact strings. `ctas` and `ctas[2u25ddjvjn]` are two different keys, and a row written for one will not apply to the other."
    },
    {
        "id": "page-personalization.md#3",
        "topic": "page-personalization",
        "title": "How a personalized card reaches a consumer page",
        "section": "Why a manifest row swaps the fragment rather than selecting a variation",
        "keywords": [
            "platform",
            "authoring",
            "how a personalized card reaches a consumer page"
        ],
        "text": "When a row matches, the merch block returns the card options with the fragment id replaced by the manifest's replacement id. The page then renders the variation fragment directly for that field, rather than asking IO to merge the variation over its parent.\n\nThat distinction matters because a variation only stores the fields that differ from its parent. Rendering a variation directly means there is no parent underneath it, so a field the variation does not define resolves to nothing rather than falling back to the parent's value. A manifest row pointing a field at a variation that does not define that field renders empty, silently.\n\nIt also means personalization scales per field. Each field to be personalized needs its own manifest row, and each row has to name the field exactly as the page names it."
    },
    {
        "id": "page-personalization.md#4",
        "topic": "page-personalization",
        "title": "How a personalized card reaches a consumer page",
        "section": "Why a variation id in a manifest row never matches",
        "keywords": [
            "platform",
            "authoring",
            "how a personalized card reaches a consumer page"
        ],
        "text": "A manifest row is only ever found by the fragment id that the page author wrote into the link. The lookup happens while the card's options are being prepared, before the card element exists and before anything has been fetched from IO, so no variation id is known at that point.\n\nA row whose selector names a variation id therefore registers in the map but can never be matched, because no card on the page is authored against that id. It is inert: no error, no log line, and it still reads as meaningful in the manifest.\n\nWhen reviewing a manifest, check each selector's `query=` id against the fragment ids authored on the page. An id that appears only in the manifest is dead weight, and it confuses readers because it still shows up in the manifest and in the page's MEP config."
    },
    {
        "id": "page-personalization.md#5",
        "topic": "page-personalization",
        "title": "How a personalized card reaches a consumer page",
        "section": "Can MEP personalize a card collection",
        "keywords": [
            "platform",
            "authoring",
            "how a personalized card reaches a consumer page"
        ],
        "text": "Yes, in two ways. To swap the whole collection, write an `in-block:mas` row whose selector is the collection's own authored fragment id. The collection block looks the row up the same way the card block does, and swaps the fragment when the row's action is `replace`. Compare charts work the same way. Rows with any other action are ignored for cards, fields, collections and compare charts.\n\nTo swap a card or a sub-collection inside a collection, write an `in-block:mas` row with no `field=` whose selector is that child's fragment id. The collection block turns every such row on the page into an `overrides` list on the collection (source id to replacement id). The collection then uses the replacement wherever the source id appears among its cards, its sub-collections, or its default child. It takes every no-field row on the page, not only rows for this collection, and it does not check the action.\n\nTwo limits follow. A row with `field=` does nothing to a card inside a collection, because only no-field rows reach the collection. And a swapped child card keeps the filter tags of the card it replaced, so it stays in the same categories."
    },
    {
        "id": "page-personalization.md#6",
        "topic": "page-personalization",
        "title": "How a personalized card reaches a consumer page",
        "section": "Why a personalized sub-collection disappears",
        "keywords": [
            "platform",
            "authoring",
            "how a personalized card reaches a consumer page"
        ],
        "text": "For every `in-block:mas` row, MEP adds a hidden `aem-fragment` for the replacement fragment at the end of the page, inside a `div.mas-overrides`, so the replacement starts loading early. A collection swapping a sub-collection reads the replacement's data from that hidden element. If the data has not arrived when the parent collection builds its categories, the collection logs `Override fragment <id> not found or invalid` and leaves that sub-collection out. Nothing appears on the page.\n\nThat comes from reading the code: it is a timing race, so it can come and go between page loads. If a personalized category is sometimes empty, look for that console message, and check that the replacement id is a published collection and not a card or a variation."
    },
    {
        "id": "page-personalization.md#7",
        "topic": "page-personalization",
        "title": "How a personalized card reaches a consumer page",
        "section": "How MEP can redirect a merch modal",
        "keywords": [
            "platform",
            "authoring",
            "how a personalized card reaches a consumer page"
        ],
        "text": "A row with the selector `in-block:merch <modal path>` makes any merch CTA whose modal URL has that path open the row's replacement URL instead. The replacement must be a full URL. Anything else is logged as an error and the original modal opens. This is how a promotion can point an existing Buy CTA's modal at a different offer page without editing the card."
    },
    {
        "id": "placeholders.md#0",
        "topic": "placeholders",
        "title": "Placeholders",
        "section": "What is a placeholder?",
        "keywords": [
            "platform",
            "authoring",
            "placeholders",
            "placeholder",
            "dictionary",
            "key",
            "value",
            "rich text",
            "locale string",
            "translation string",
            "token",
            "substitution"
        ],
        "text": "A placeholder is a reusable key and value text entry scoped to a surface and a locale, stored as its own AEM content fragment in that surface and locale's dictionary folder. Card fields reference a placeholder with a `{{key}}` token, and keys allow only word characters, hyphens and underscores. The Placeholders page in Studio manages the placeholders for the currently selected surface and locale."
    },
    {
        "id": "placeholders.md#1",
        "topic": "placeholders",
        "title": "Placeholders",
        "section": "Where the dictionary index lives",
        "keywords": [
            "platform",
            "authoring",
            "placeholders",
            "placeholder",
            "dictionary",
            "key",
            "value",
            "rich text",
            "locale string",
            "translation string",
            "token",
            "substitution"
        ],
        "text": "Each surface and locale pair has one dictionary index fragment, holding references to every placeholder authored for that pair, on the Odin author tier at `/content/dam/mas/<surface>/<locale>/dictionary/index`. Reading the index directly is the fastest way to confirm whether a placeholder exists for a given surface and locale before looking further downstream."
    },
    {
        "id": "placeholders.md#2",
        "topic": "placeholders",
        "title": "Placeholders",
        "section": "Why does a card show English text on a non-English page?",
        "keywords": [
            "platform",
            "authoring",
            "placeholders",
            "placeholder",
            "dictionary",
            "key",
            "value",
            "rich text",
            "locale string",
            "translation string",
            "token",
            "substitution"
        ],
        "text": "Two different fallbacks look the same on the page. A card with no locale variation renders its locale-default parent fragment, which is usually the English content. Placeholder text is resolved separately, from three dictionary layers merged lowest to highest priority: the `acom` dictionary for the page's default locale, the card's own surface dictionary for that same default locale, and the region overlay (for example `fr_BE`). A key missing from the region overlay falls back to the default-locale value, `fr_FR` for a `fr_BE` page, not to English. English placeholder text on a French page therefore means the French dictionary entry itself holds English text, or the key is missing everywhere and is showing as its bare key name. Prices and checkout links are resolved by the commerce backend from the offer and are never translated, so they are not evidence of a localization problem."
    },
    {
        "id": "placeholders.md#3",
        "topic": "placeholders",
        "title": "Placeholders",
        "section": "What a page shows when a placeholder key does not resolve",
        "keywords": [
            "platform",
            "authoring",
            "placeholders",
            "placeholder",
            "dictionary",
            "key",
            "value",
            "rich text",
            "locale string",
            "translation string",
            "token",
            "substitution"
        ],
        "text": "A well-formed key that no dictionary layer holds is replaced by the key itself, with the braces removed: `{{buy-now}}` renders as `buy-now`. A word that looks like a key sitting in the card text therefore means the key is missing for that surface and locale. The same happens when spaces pad the key inside the braces, as in `{{ buy-now }}`, because the spaces become part of the key that is looked up.\n\nA literal token with its braces, such as `{{buy now}}` inside a heading or on a button, means IO did not replace it. There are two causes. The key is malformed: keys allow only word characters, hyphens and underscores, so a token containing a space or a dot never matches the placeholder pattern and is left untouched. Authors hit this when they type a label the way it reads, `{{buy now}}`, instead of the authored key, `{{buy-now}}`. Or no dictionary loaded at all: when every layer comes back empty or fails to load, IO skips replacement and every token stays as written.\n\nConfirm by reading the dictionary index for the surface and locale and checking the key exists exactly as the token spells it, including hyphens. If the key is there and tokens still show with braces, the dictionaries did not load for that request."
    },
    {
        "id": "playbook-locale-fallback.md#0",
        "topic": "playbook-locale-fallback",
        "title": "Locale and variation fallback",
        "section": "How the region locale is computed",
        "keywords": [
            "platform",
            "authoring",
            "locale and variation fallback"
        ],
        "text": "IO takes `locale` and `country` request parameters. First it resolves the default locale for that locale on the surface: the surface's default-locale table is matched by language, then by country or the language's region list, falling back to a language-only match. If the default locale differs from the fragment's own path locale, IO fetches the default-locale fragment and uses that as the body. Then `computeRegionLocale` runs: when the request country differs from the default locale's own country and is a known region for that language on the surface, the region locale becomes that region (for example `locale=fr_FR&country=CA` resolves to `fr_CA`). Settings, dictionaries and regional variations all key off the region locale, not the raw `locale` parameter. An unknown locale is rejected with 400 before any Odin call, and a territory locale like `es_PR` keeps PR content but is priced as US."
    },
    {
        "id": "playbook-locale-fallback.md#1",
        "topic": "playbook-locale-fallback",
        "title": "Locale and variation fallback",
        "section": "Why the same locale differs across surfaces",
        "keywords": [
            "platform",
            "authoring",
            "locale and variation fallback"
        ],
        "text": "Each surface has its own default-locale table (acom, ccd, express, adobe-home, commerce, sandbox). English is the clearest case, and it differs per surface: on acom, `en_GB` is a default locale whose regions are Australia and India; on express, `en_GB` is a default locale with no regions, and India is a region of `en_US` instead; on ccd there is no `en_GB` entry at all, so an `en_GB` request falls back to the `en_US` fragment. The same `en_GB` request therefore gets the `en_GB` fragment on acom and express but the `en_US` fragment on ccd. The same logic applies per language and per surface: a card that \"works in fr_FR but not fr_CA\" usually means the fr_CA regional variation simply was not authored, and a card that behaves differently on CC than on adobe.com usually means the two surfaces resolve the locale to different defaults."
    },
    {
        "id": "playbook-locale-fallback.md#2",
        "topic": "playbook-locale-fallback",
        "title": "Locale and variation fallback",
        "section": "When a regional variation applies",
        "keywords": [
            "platform",
            "authoring",
            "locale and variation fallback"
        ],
        "text": "In the customize step, variations merge in this order: a promo variation (when a promotion project targets the fragment), otherwise the regional variation, otherwise a personalization variation. The regional variation is found only when the region locale differs from the default locale, by matching the variation's Odin path against `/content/dam/mas/<surface>/<regionLocale>/`. So a variation applies when three things hold: it is listed in the fragment's variations references, its path uses the exact surface and region locale, and no promo variation is in front of it. The merge is a deep merge where the variation wins field by field, except `id` and `path`."
    },
    {
        "id": "playbook-locale-fallback.md#3",
        "topic": "playbook-locale-fallback",
        "title": "Locale and variation fallback",
        "section": "Why a placeholder falls back to English",
        "keywords": [
            "platform",
            "authoring",
            "locale and variation fallback"
        ],
        "text": "Placeholder dictionaries resolve in three layers, lowest to highest: the global baseline, which is always the acom dictionary for the request's own default locale; the requested surface's dictionary for that same base locale; and the region overlay, the requested surface's dictionary for the region locale. A key missing from the region overlay but present in the base renders the base (typically English) value. Note the region locale used for placeholders can differ from the one used for fragments: an `en_US` acom page with `country=IN` overlays `en_IN` (a region of en_GB on acom) onto its `en_US` base, without moving the shared region locale. A 404 on a region dictionary is a stable \"nothing authored\" case, while a 404 on a base dictionary is treated as a transient publish race."
    },
    {
        "id": "playbook-locale-fallback.md#4",
        "topic": "playbook-locale-fallback",
        "title": "Locale and variation fallback",
        "section": "Troubleshooting a locale bug",
        "keywords": [
            "platform",
            "authoring",
            "locale and variation fallback"
        ],
        "text": "Work in this order: 1) confirm what the request actually is (locale, country, surface) on the consuming page. 2) Compute the expected default locale and region locale from the surface's table for that locale and country, and say them out loud. 4) If the content is wrong, verify in Odin that the expected regional variation exists for that surface and region locale and is listed in the parent fragment's variations. 5) If a string is in the wrong language, trace the placeholder through the three dictionary layers and find the layer that supplies the key. The most common root causes, in order: variation never authored for that region locale, the surface resolves the locale to a different default than expected, and a dictionary key missing at the region layer."
    },
    {
        "id": "playbook-milo-page-trouble.md#0",
        "topic": "playbook-milo-page-trouble",
        "title": "MAS content on a Milo page",
        "section": "About MAS content on a Milo page",
        "keywords": [
            "platform",
            "milo",
            "troubleshooting",
            "mas content on a milo page"
        ],
        "text": "Start by pinning down the page: its exact URL and host, its locale prefix, and which MAS content is involved (card, collection, price or CTA). On a Milo page, the host decides which MAS code runs and whether drafts show, and the prefix decides the country."
    },
    {
        "id": "playbook-milo-page-trouble.md#1",
        "topic": "playbook-milo-page-trouble",
        "title": "MAS content on a Milo page",
        "section": "A card or collection is missing on a Milo page",
        "keywords": [
            "platform",
            "milo",
            "troubleshooting",
            "mas content on a milo page"
        ],
        "text": "Check in this order.\n1. Open the same page on its `.aem.page` host. On `.aem.page` and localhost Milo shows a \"Load Error\" or \"Not Found\" box with the fragment id where a card or collection failed. On `www.adobe.com` a failed card just hides itself.\n2. Run the Milo preflight \"M@S Unpublished Fragments\" check. It fails for any card whose fragment production MAS IO does not return, which is usually an unpublished card.\n3. Check the authored link. It must be a `mas.adobe.com/studio.html` link on a trusted host, with the fragment id in the hash as `fragment=` or `query=`. A link with no fragment id renders nothing and stays a plain link. A collection link whose hash does not start with `content-type=merch-card-collection` is treated as a single card.\n4. Check personalization. Add `?mep=off` to see the page without any MEP changes. If the card comes back, a manifest is replacing or hiding it.\n5. Read the console for the MAS error message, such as \"CTA has an invalid offer\" or \"Contains unresolved offers\"."
    },
    {
        "id": "playbook-milo-page-trouble.md#2",
        "topic": "playbook-milo-page-trouble",
        "title": "MAS content on a Milo page",
        "section": "It looks right on the preview page but wrong on production",
        "keywords": [
            "platform",
            "milo",
            "troubleshooting",
            "mas content on a milo page"
        ],
        "text": "This is expected when the card has unpublished changes. Milo turns MAS preview on for `*.aem.page` hosts and for `www.stage.adobe.com`. In preview, cards are built from the unpublished (authoring) content, so the preview page shows edits that production does not have yet. Publish the card in Studio, then allow a few minutes for the IO cache.\n\nThe two hosts also run different MAS code. Production loads the bundles released to `www.adobe.com/mas/libs/`, while every other host loads the latest MAS `main`. So a fix merged in MAS can appear on stage and preview before it reaches production."
    },
    {
        "id": "playbook-milo-page-trouble.md#3",
        "topic": "playbook-milo-page-trouble",
        "title": "MAS content on a Milo page",
        "section": "Prices are in the wrong country or currency on a Milo page",
        "keywords": [
            "platform",
            "milo",
            "troubleshooting",
            "mas content on a milo page"
        ],
        "text": "The country comes from the page's locale prefix, not from the visitor. See the Milo locale and country concept.\n- Check the prefix mapping: `/ch_fr` is `fr_CH`, `/la` is `es_DO`, `/africa` is `en_MU`, `/pr` is priced as US, and a country-only prefix missing from Milo's table gets English (Greek `/el` becomes `en_EL`).\n- `?country=` and the visitor's Adobe account country do not change MAS prices unless the page turns on `mas-geo-detection`.\n- With geo detection on, check the market the page resolved. The MEP overlay's M@S panel shows the page market and where it came from."
    },
    {
        "id": "playbook-milo-page-trouble.md#4",
        "topic": "playbook-milo-page-trouble",
        "title": "MAS content on a Milo page",
        "section": "A trial CTA is missing on the Korean page",
        "keywords": [
            "platform",
            "milo",
            "troubleshooting",
            "mas content on a milo page"
        ],
        "text": "On `/kr` pages Milo removes trial checkout CTAs once they resolve. The exceptions are a link hash of `#_allow-kr-trial` and page metadata `allow-kr-free-trial=on`. Studio settings still decide what reaches the page; this rule is an extra filter that Milo applies on top. The code marks this rule for removal (MWPW-173470), so check that it is still present before relying on it."
    },
    {
        "id": "playbook-milo-page-trouble.md#5",
        "topic": "playbook-milo-page-trouble",
        "title": "MAS content on a Milo page",
        "section": "A Buy CTA opens a modal, Download or Upgrade instead of checkout",
        "keywords": [
            "platform",
            "milo",
            "troubleshooting",
            "mas content on a milo page"
        ],
        "text": "Milo decides this on the page, not MAS. For each CTA it tries a download (for a signed-in visitor who already owns the product and has `entitlement=true`), then an upgrade (with `upgrade` on the link and an upgrade offer on the page), then a modal. The first that applies replaces the plain checkout link.\n\nThe modal paths come from Milo's commerce `checkout-link.json` spreadsheet, which is content and not code. Its rows are keyed by product family and can differ by locale. The 3-in-1 modal is on unless the page has `<meta name=\"mas-ff-3in1\" content=\"off\">`. When it is off, Milo uses the link's `fallbackStep` instead. Upgrade CTAs go to `plan.adobe.com` and need an entitlement that allows a plan change."
    },
    {
        "id": "playbook-milo-page-trouble.md#6",
        "topic": "playbook-milo-page-trouble",
        "title": "MAS content on a Milo page",
        "section": "MAS content looks different only on some pages",
        "keywords": [
            "platform",
            "milo",
            "troubleshooting",
            "mas content on a milo page"
        ],
        "text": "Check whether the page runs a MEP experiment that loads forked block code. Milo's `libs/mep/<test-id>/` folders hold temporary block code for experiments, loaded through the `useblockcode` manifest action. Some of them fork MAS-related blocks: `emea1443/merch-card` is a copy of the legacy merch-card block, and the `ace1209` tabs and product-marquee-grid forks change how cards and MAS fields look. If only an experiment page looks wrong, suspect the fork before MAS. `?mep=off` confirms it."
    },
    {
        "id": "playbook-milo-page-trouble.md#7",
        "topic": "playbook-milo-page-trouble",
        "title": "MAS content on a Milo page",
        "section": "URL parameters that change MAS on a Milo page",
        "keywords": [
            "platform",
            "milo",
            "troubleshooting",
            "mas content on a milo page"
        ],
        "text": "- `?maslibs=<branch>` loads MAS from a branch. It is ignored on `www.adobe.com`. `local` means `http://localhost:3000`, and `main` means MAS main.\n- `?mas.preview=off` turns off the automatic preview on `.aem.page` and stage.\n- `?mas-geo-detection=on` lets the visitor's market decide the country. With it on, `?country=XX` or `?akamaiLocale=XX` sets that market.\n- `?mas-ims-login=on` lets the signed-in account country count when geo detection is on.\n- `?commerce.env=stage` and `?commerce.landscape=DRAFT` use stage pricing or draft offers. They only work on non-production Milo hosts.\n- `?instant=<date>` pretends it is that date, for MEP promo schedules and for MAS promotions. MAS passes it to IO, which uses it to pick promotions.\n- `?mep=off` turns off all personalization, and `?martech=off` turns off Target and other martech manifests.\n- `?promo=` selects MEP promo manifests. It is not a MAS promo code. A MAS promo code comes from the authored OST link (`promo` or `promotionCode`), a `data-promotion-code` wrapper, or a page-wide `promotionCode`, which MAS reads from the URL, storage or a `promotion-code` meta tag. Checkout links use the page-wide code as their default.\n- `?mepMasHighlight=true` turns on the MEP overlay's MAS highlighting (below).\n\nMAS reads its settings from the URL first, then session or local storage, so a value from an earlier test can linger after the parameter is gone. Clear the site's storage when a setting will not reset."
    },
    {
        "id": "playbook-milo-page-trouble.md#8",
        "topic": "playbook-milo-page-trouble",
        "title": "MAS content on a Milo page",
        "section": "How to find MAS content on a Milo page with the MEP overlay",
        "keywords": [
            "platform",
            "milo",
            "troubleshooting",
            "mas content on a milo page"
        ],
        "text": "The MEP preview overlay can highlight all MAS content on a page. The preview is on by default outside production. On production it is on when the URL has `?mep` (even with no value) or `?mepButton`, and `?mepButton=off` hides it. The current overlay (mep-next) is the default. `?mepnext=off` loads the older one.\n\nTurn on \"Highlight M@S Content\", or add `?mepMasHighlight=true`. Collections get an \"Edit Collection in M@S Studio\" badge. Cards inside a collection get Edit Card, View in OST and Copy Fragment ID. Standalone prices and CTAs get \"View in OST\", and the active sidenav filter gets \"Edit Sub-collection\". This is the fastest way to get from a page to the right card in Studio.\n\nEach highlighted item carries a country chip. A chip that is flagged as a mismatch means that item resolved a different market from the page. The overlay's M@S panel shows whether geo detection is on, where the country came from, the page market, and how many collections, sub-collections, cards, inline fields and standalone offers the page has."
    },
    {
        "id": "playbook-price-trouble.md#0",
        "topic": "playbook-price-trouble",
        "title": "Price trouble",
        "section": "Symptom",
        "keywords": [
            "platform",
            "pricing",
            "price trouble"
        ],
        "text": "Reports look like \"price mismatch between acom and the checkout page\", \"price is not showing up\", \"price shows up but the tax is wrong\", or \"the price literal text is wrong\". This playbook traces the number from the card element down through WCS to AOS. For MAS's own two-layer caching (browser and IO server prefetch) and how country, locale and tax normally resolve, see the concept on where a card's price comes from; this playbook is for when the problem looks like it sits downstream of MAS, in WCS or AOS."
    },
    {
        "id": "playbook-price-trouble.md#1",
        "topic": "playbook-price-trouble",
        "title": "Price trouble",
        "section": "Step 1: get the OSI",
        "keywords": [
            "platform",
            "pricing",
            "price trouble"
        ],
        "text": "Inspect the price element — it is a `<span is=\"inline-price\">` — and copy its `data-wcs-osi` attribute value. Every later step needs this offer selector ID."
    },
    {
        "id": "playbook-price-trouble.md#2",
        "topic": "playbook-price-trouble",
        "title": "Price trouble",
        "section": "Step 2: check WCS",
        "keywords": [
            "platform",
            "pricing",
            "price trouble"
        ],
        "text": "A rendered card's own browser code calls WCS directly, but MAS IO's `wcs` transformer already prefills prices and rewrites promo codes into the `/mas/io` fragment payload server-side, so what the browser shows can come from that prefill rather than a fresh WCS round trip — the browser's own WCS call may not reflect what actually changed.\n\nA price shows the first offer after the browser sorts the list: offers in the preferred language (MULT, or EN in GB) come first, then offers without a term. WCS returns the offers in the same order every time. When two offers tie on both keys, the browser's sort does not keep that order (see more than one offer returned for one OSI, below).\n\nA price change staged in the catalog often shows up as an offer whose start date has passed on DRAFT but is a far-off placeholder such as 2049 on PUBLISHED. A future start date does not hide the offer. WCS still returns it on PUBLISHED, and neither the MAS web components nor MAS IO filter offers by start date. So if the staged offer shares an OSI with the live one, the card can show either price on production today. When PUBLISHED returns more than one offer for the OSI, follow more than one offer returned for one OSI (below). Do not treat it as a price that production does not show yet.\n\nBoth tiers cache for 15 minutes and update on their own; WCS cache staleness has not historically been the cause of a reported issue, so do not spend time purging first."
    },
    {
        "id": "playbook-price-trouble.md#3",
        "topic": "playbook-price-trouble",
        "title": "Price trouble",
        "section": "Step 3: classify the WCS response",
        "keywords": [
            "platform",
            "pricing",
            "price trouble"
        ],
        "text": "**Offers returned but the payload looks wrong:** check the field that matches the symptom.\n- Tax label wrong (shows \"tax included\" when it should say \"tax excluded\", or vice versa): check the `taxDisplay` and `taxTerm` fields.\n- Price text/literal wrong: check the `formatString` field.\n- Promo not applying or applying when it shouldn't: check the `promotion` object and whether it has expired.\n\n**More than one offer returned for one OSI:** a card shows two different prices for the same OSI, for example the price in the rich text editor (RTE) in Studio differs from the price in the card preview, or the price changes after a refresh. Compare the `offerId` values, not just the prices: different offer ids are different offers, not one offer in two states. An OSI should resolve to a single offer per country (a GB `EN` plus `MULT` language pair is the normal exception). When several offers match on segment, commitment, term, language and tax, the browser cannot tell them apart and its pick is not stable. `selectOffers` sorts the offer list in place. Price elements that share the OSI share that list, and a tie makes the sort swap the two offers. So each price element that renders can flip the order for the next one. One card can show both prices at once, and any re-render (such as a reload or Studio's draft landscape toggle) can swap which price shows where. The second offer on the OSI is a catalog problem, but the flipping is MAS behavior, so the layer is `client`, not only commerce."
    },
    {
        "id": "playbook-price-trouble.md#4",
        "topic": "playbook-price-trouble",
        "title": "Price trouble",
        "section": "Step 3: classify the WCS response (part 2)",
        "keywords": [
            "platform",
            "pricing",
            "price trouble"
        ],
        "text": "**Suspecting the draft landscape:** Studio's \"Draft landscape offer\" toggle (`commerce.landscape=DRAFT`) is not proof that a price difference comes from draft vs published pricing. Flipping the toggle on an open Studio page re-renders every price, but it does not change the landscape the price requests ask for. Studio copies its landscape into the commerce service only when it renders that service: when the page loads, and again when the locale, region or folder changes. So right after a flip, the requests keep asking for the landscape the page had before, usually `landscape=PUBLISHED`, and a price that changes at that moment comes from the same offers picked again, which points to more than one offer returned for the OSI. A page opened with the draft landscape already on (`commerce.landscape=DRAFT` in the URL), or one where the locale changed after the flip, does ask WCS for `landscape=DRAFT`. To check whether landscape matters at all, run the same WCS query twice, once with `landscape=DRAFT` and once with `landscape=PUBLISHED`. Landscape explains the difference only if the two responses return different offers or prices. A different start date on the same offer does not change which price shows."
    },
    {
        "id": "playbook-publish-trouble.md#0",
        "topic": "playbook-publish-trouble",
        "title": "Publish and content-delivery trouble",
        "section": "About Publish and content-delivery trouble",
        "keywords": [
            "platform",
            "authoring",
            "publish and content-delivery trouble"
        ],
        "text": "Three failures all present as \"my content isn't showing up\": the Odin publish workflow not completing, Studio not reflecting a fragment Odin has already published, and a consumer page serving stale or wrong content. They sit at separate layers and each has its own check. For how publishing a card from Studio normally works, see the how-to on publishing a card; this playbook is for when that action does not have the effect it should."
    },
    {
        "id": "playbook-publish-trouble.md#1",
        "topic": "playbook-publish-trouble",
        "title": "Publish and content-delivery trouble",
        "section": "Symptom: the publish workflow does not complete",
        "keywords": [
            "platform",
            "authoring",
            "publish and content-delivery trouble"
        ],
        "text": "An author publishes and nothing goes live, with no obvious error.\n\n1. Filter the Network tab for the `publish` POST request. A successful (200) response only means Odin scheduled the job — it does not mean the job finished or that the content is actually live.\n2. Copy the workflow instance path from the response, for example `/var/workflow/instances/server765/2026-07-29/scheduled_activation_with_references_5`, and check its status at `https://author-p22655-e59433.adobeaemcloud.com<that path>.json`. Wait for `\"state\": \"COMPLETED\"`. The workflow archive console (`/libs/cq/workflow/admin/console/content/archive.html` on the author host) also lists finished jobs; a line reading \"Skipped invalid content fragments: `<path>`\" names the fragment that blocked the job.\n3. If the workflow completed but the content is still not published, the fragment itself is likely invalid. **Before opening it in the Odin editor to check, keep the cursor away from every field.** The editor autosaves on focus, and that save writes the broken markup back, which can corrupt production content. Clone the fragment to a sandbox path and inspect the clone first, especially if this is a production card. In the editor, an invalid fragment shows a warning icon and any offending fields are outlined in red."
    },
    {
        "id": "playbook-publish-trouble.md#2",
        "topic": "playbook-publish-trouble",
        "title": "Publish and content-delivery trouble",
        "section": "Symptom: Studio does not reflect a fragment that is already published on Odin",
        "keywords": [
            "platform",
            "authoring",
            "publish and content-delivery trouble"
        ],
        "text": "The fragment looks published when checked directly against Odin, but Studio still shows it as unpublished or stale.\n\n1. Confirm the publish POST to Odin author returned 200.\n2. If it returned 200, get the fragment id from the request/response and read the fragment directly: `https://author-p22655-e59433.adobeaemcloud.com/adobe/sites/cf/fragments/<fragmentId>`. Copy its content path from that response, then read `https://author-p22655-e59433.adobeaemcloud.com<path>/jcr:content.json`.\n3. If `cq:lastReplicated` is present, Odin considers the fragment published and the gap is on the Studio side. That case has no confirmed root cause yet, so treat it as a fresh investigation."
    },
    {
        "id": "playbook-publish-trouble.md#3",
        "topic": "playbook-publish-trouble",
        "title": "Publish and content-delivery trouble",
        "section": "Symptom: a consumer page shows missing or wrong content",
        "keywords": [
            "platform",
            "authoring",
            "publish and content-delivery trouble"
        ],
        "text": "A report comes in that a card is not rendering, or that a collection shows the wrong card. Before assuming the fragment or the settings content is actually wrong, rule out Akamai's cache of the `/mas/io` response: add `?mas-io-url=https://14257-merchatscale.adobeioruntime.net/api/v1/web/MerchAtScale` to the page URL. This routes the page around Akamai and straight to IO production. If the content is correct with that parameter but wrong without it, the problem is cache staleness, which clears on its own within the CDN's normal cache window; if it is still wrong with the parameter, the problem is upstream of the cache — the fragment, the settings, or the pipeline itself."
    },
    {
        "id": "playbook-pzn-variation-not-showing.md#0",
        "topic": "playbook-pzn-variation-not-showing",
        "title": "Personalized variation not showing on a page",
        "section": "Symptom",
        "keywords": [
            "platform",
            "authoring",
            "personalized variation not showing on a page"
        ],
        "text": "Reports look like \"I published a grouped variation with the right tag but the page still shows the default\", \"the Target activity fires and I can see other parts of the experience, but the card content does not change\", or \"one field changed and the others did not\". Check how the page asks for the variation before suspecting the variation itself."
    },
    {
        "id": "playbook-pzn-variation-not-showing.md#1",
        "topic": "playbook-pzn-variation-not-showing",
        "title": "Personalized variation not showing on a page",
        "section": "Step 1: work out which route the page uses",
        "keywords": [
            "platform",
            "authoring",
            "personalized variation not showing on a page"
        ],
        "text": "Look at the authored link behind the card. If its hash carries a `pzn` value, the page uses whole card personalization and IO picks the variation by tag. If it does not, the only way content changes is a manifest row rewriting a field, and the variation's tags are irrelevant to that path.\n\nA quick browser check: the card only appends a `pzn` parameter to its fragment request when it has a `pzn` value, so a request without one is not using the tag route, whatever tags the variation has. Do not spend time on tags, publish state or tag scoring until this is settled, because on the manifest route none of them participate."
    },
    {
        "id": "playbook-pzn-variation-not-showing.md#2",
        "topic": "playbook-pzn-variation-not-showing",
        "title": "Personalized variation not showing on a page",
        "section": "Step 2: reproduce without a Target token",
        "keywords": [
            "platform",
            "authoring",
            "personalized variation not showing on a page"
        ],
        "text": "An MEP manifest can be force applied straight from the URL, which removes Target, audiences and preview tokens from the picture:\n\n`?mep=<url-encoded manifest path>--<variant column name>`\n\nChain more than one with `---`. Load the page with and without it and compare, which separates \"the manifest is wrong\" from \"the activity is not reaching me\".\n\nBe careful about caching here. A manifest JSON has been observed served from the edge with a true TTL far longer than the `max-age` its own response advertised, so a page kept applying the previous version of a manifest for a while after an edit was published. Fetch the manifest path directly with a cache busting query parameter to see what the origin actually holds, and compare that against what the page loaded, before concluding an edit did not take."
    },
    {
        "id": "playbook-pzn-variation-not-showing.md#3",
        "topic": "playbook-pzn-variation-not-showing",
        "title": "Personalized variation not showing on a page",
        "section": "Step 3: compare the manifest field string against the page",
        "keywords": [
            "platform",
            "authoring",
            "personalized variation not showing on a page"
        ],
        "text": "This is a frequent break. MEP matches the field name as an exact string, so the `field=` in the manifest row has to be character for character what the page authored.\n\nRead the page source and list the `field=` values it uses, then read the manifest rows. A row saying `field=ctas` will not apply to a page that authored `ctas[2u25ddjvjn]`, and neither will a row using a different index. Any `field=` written on the replacement side of the row is discarded, so only the selector side matters.\n\nWhile you are there, check each row's `query=` id against the fragment ids the page authors. A row naming a variation id rather than an authored card id can never match and is inert."
    },
    {
        "id": "playbook-pzn-variation-not-showing.md#4",
        "topic": "playbook-pzn-variation-not-showing",
        "title": "Personalized variation not showing on a page",
        "section": "Step 4: check the variation actually defines the field",
        "keywords": [
            "platform",
            "authoring",
            "personalized variation not showing on a page"
        ],
        "text": "On the manifest route the page renders the variation fragment directly, with no parent underneath. A field that the variation does not define resolves to nothing, and the element is hidden rather than falling back to the parent's value.\n\nSo if one field personalizes and another stays default or goes blank, open the variation and confirm it has its own value for every field a manifest row points at. A variation that only overrides, say, the description cannot serve a row that asks it for a CTA or a subtitle."
    },
    {
        "id": "playbook-pzn-variation-not-showing.md#5",
        "topic": "playbook-pzn-variation-not-showing",
        "title": "Personalized variation not showing on a page",
        "section": "Step 5: for CTAs, check the data-key",
        "keywords": [
            "platform",
            "authoring",
            "personalized variation not showing on a page"
        ],
        "text": "CTA rows usually carry an index. A numeric index selects by position. Any other index is first matched against the fragment's labels field for that field, `ctaLabels` for CTAs, when the fragment has one: the CTA at the matching label's position is used, and if no label matches, the field is hidden. Only when the fragment has no labels field is the index looked up as an anchor whose `data-key` matches it. If nothing matches, the field is hidden and nothing is rendered or logged.\n\nAnchors in a variation do not automatically carry the same `data-key` as the equivalent anchor in the parent, so a variation authored separately can end up with a different key. When a CTA row applies but renders nothing, compare the index the manifest and the page ask for with the variation's `ctaLabels` entries if it has them, and otherwise with the `data-key` on its anchor, and make them agree."
    },
    {
        "id": "playbook-pzn-variation-not-showing.md#6",
        "topic": "playbook-pzn-variation-not-showing",
        "title": "Personalized variation not showing on a page",
        "section": "Step 6: check the CTA text resolves",
        "keywords": [
            "platform",
            "authoring",
            "personalized variation not showing on a page"
        ],
        "text": "A CTA whose label is a placeholder token renders the raw token when the key does not exist for that surface and locale, and a token written with a space can never resolve. If a button shows something like `{{buy now}}`, the fix is the token in the variation, not the personalization wiring. The placeholders concept covers how to confirm a key against the dictionary index."
    },
    {
        "id": "playbook-pzn-variation-not-showing.md#7",
        "topic": "playbook-pzn-variation-not-showing",
        "title": "Personalized variation not showing on a page",
        "section": "A diagnostic trap when reading the rendered page",
        "keywords": [
            "platform",
            "authoring",
            "personalized variation not showing on a page"
        ],
        "text": "Do not conclude a field is not personalizable just because you cannot find a `mas-field` element wrapping the rendered content. On a marquee block this has been seen with a CTA: the resolved anchor ended up outside its original wrapper in the final DOM, while the wrapper that failed to resolve stayed behind as a hidden empty element.\n\nSearching the DOM for `mas-field` can therefore show you only the broken ones and none of the working ones, which reads as \"this field is not wired up at all\". Confirm against the page source and against a control load of the page instead, and compare the rendered element's attributes, such as a CTA's `href` and `data-key`, between the personalized and default loads."
    },
    {
        "id": "playbook-settings-trial-ctas.md#0",
        "topic": "playbook-settings-trial-ctas",
        "title": "Settings and trial CTAs",
        "section": "Symptom: trial CTAs do not hide for a country",
        "keywords": [
            "platform",
            "settings and trial ctas"
        ],
        "text": "Reports look like \"trial CTAs don't hide on catalog.html?country=kr\" or \"the free trial button still shows in Korea\". Whether a card hides its trial CTAs comes from the `hideTrialCTAs` setting that MAS IO resolves per card, region locale, and country. `displayPlanType`, `secureLabel`, `displayAnnual`, `quantitySelect`, and `addon` resolve the same way."
    },
    {
        "id": "playbook-settings-trial-ctas.md#1",
        "topic": "playbook-settings-trial-ctas",
        "title": "Settings and trial CTAs",
        "section": "How IO resolves hideTrialCTAs",
        "keywords": [
            "platform",
            "settings and trial ctas"
        ],
        "text": "1. IO computes the region locale from `locale` and `country`: `locale=en_US&country=KR` becomes region locale `en_KR` because KR is a region of `en_US` on the surface.\n2. IO reads `/content/dam/mas/<surface>/settings/index` and groups the entries of each setting into one default entry and its override entries.\n3. An override applies when its `geos` match the region locale and country (or its `locales` list contains the region locale) and its `tags` and `templates` match the card. The best geo match wins; tag matches break ties.\n4. With no matching override the default entry applies. A value set on the card fragment itself (a `hideTrialCTAs` field on the card) takes precedence over the value of the settings entry.\n5. IO returns the result in `settings.hideTrialCTAs`; web components hide the trial CTAs when it is `true`."
    },
    {
        "id": "playbook-settings-trial-ctas.md#2",
        "topic": "playbook-settings-trial-ctas",
        "title": "Settings and trial CTAs",
        "section": "When hideTrialCTAs is true but trial CTAs still show",
        "keywords": [
            "platform",
            "settings and trial ctas"
        ],
        "text": "Web components (`processCTAs` in `hydrate.js`) drop every CTA whose `data-analytics-id` is a trial id (`free-trial`, `start-free-trial`, `seven-day-trial`, and similar; the full allowlist is `TRIAL_ANALYTICS_IDS` in `constants.js`) only when at least one other CTA remains. If every CTA on the card or on its locale variation is a trial CTA, for example because the variation was authored without its buy CTA, all CTAs stay visible even though the setting is `true`. When the setting is `true` and a non-trial CTA remains, web components also hide each remaining checkout CTA (a checkout link or button; other CTAs are left alone) until its checkout resolves, then remove it if its resolved offer has `offerType` `TRIAL` and another CTA is still visible, and show it again otherwise.\n\nA CTA can also look like a trial offer (its visible text says \"Free trial\") but not be recognized as one at the first filtering pass: the `TRIAL_ANALYTICS_IDS` match is on `data-analytics-id`, not on the button's text. A CTA authored with no `data-analytics-id` (or one outside the allowlist) survives that pass and falls through to the async offer-type fallback described above, which has a timing gap: if the other CTA's checkout has not settled yet when the check runs, `othersVisible` reads `false` and the trial CTA is shown instead of removed, even though its `offerType` did resolve to `TRIAL`. So a trial CTA that is still visible does not mean its offer type went unrecognized."
    },
    {
        "id": "playbook-settings-trial-ctas.md#3",
        "topic": "playbook-settings-trial-ctas",
        "title": "Settings and trial CTAs",
        "section": "Investigation steps",
        "keywords": [
            "platform",
            "settings and trial ctas"
        ],
        "text": "1. Read `settings.hideTrialCTAs` and the CTA analytics ids.\n2.\n3. If the KR value is `true` and every CTA is a trial CTA, the card or its KR variation is missing a buy CTA. Layer: `odin`.\n4. If the KR value is `true` and a non-trial CTA exists but a trial CTA is still visible, read that CTA's `data-analytics-id` before assuming a locale or country mismatch. A missing or non-allowlisted id routes the CTA into the async offer-type fallback, which can leave it visible even when its offer resolves as `TRIAL`; authoring an allowlisted id is the fix either way. Layer: `odin`.\n5. If that CTA's analytics id is set and allowlisted and it is still visible, compare the locale, country, and fragment id the page requests with what you probed. Layer: `milo` or `client`.\n6. It lists the matched entry, every candidate override with its geo score, and whether the reconstruction agrees with live IO.\n7. If no override targets `KR` or `en_KR`, the settings content lacks the override. Layer: `odin`. If an override matches but IO does not apply it, layer: `io`."
    },
    {
        "id": "playbook-settings-trial-ctas.md#4",
        "topic": "playbook-settings-trial-ctas",
        "title": "Settings and trial CTAs",
        "section": "Reference case: KR trial CTAs on the catalog page, 2026-09-14",
        "keywords": [
            "platform",
            "settings and trial ctas"
        ],
        "text": "The settings were correct. The catalog page with `?country=kr` still showed trial CTAs because the card's KR variation was authored without its buy CTA; with only trial CTAs left, web components keep them visible. Layer: `odin`. An earlier guess that the `ims_country_code` cookie overrode `?country=kr` was wrong."
    },
    {
        "id": "playbook-settings-trial-ctas.md#5",
        "topic": "playbook-settings-trial-ctas",
        "title": "Settings and trial CTAs",
        "section": "Reference case: KR Free Trial button on acrobat pages, 2026-09-21",
        "keywords": [
            "platform",
            "settings and trial ctas"
        ],
        "text": "Reported for `stage.adobe.com/acrobat.html`, `acrobat/plans.html`, and `acrobat/pdf-and-document-essentials.html` with `?akamaiLocale=kr`. Live inspection of card `0a1fb174-fc95-4712-9f7d-0aea79d30113` showed `country` resolving to `KR` and `settings.hideTrialCTAs` already `true`, with both a \"Free trial\" and a \"Buy now\" CTA visible, so this was neither a country mismatch nor a card left with only trial CTAs. The \"Free trial\" link had no `data-analytics-id` while \"Buy now\" had `data-analytics-id=\"buy-now\"`, so the \"Free trial\" CTA fell through to the async offer-type fallback instead of being excluded outright. Its resolved checkout confirmed `offerType: 'TRIAL'`, yet the CTA still rendered visible, because \"Buy now\" was still `hidden` at the instant the \"Free trial\" check ran, so `othersVisible` read `false`. Layer: `odin`. The fix is authoring `data-analytics-id=\"free-trial\"` (or another `TRIAL_ANALYTICS_IDS` value) on that CTA, so it is excluded at the first pass and never depends on the fallback's timing. An earlier guess that MAS reads `akamaiLocale` or a `?country=` parameter, so that adding `?country=KR` would fix it, was wrong: MAS reads only the `country` attribute Milo sets on `mas-commerce-service`."
    },
    {
        "id": "playbook-studio-validation-errors.md#0",
        "topic": "playbook-studio-validation-errors",
        "title": "Studio validation and price errors on a card",
        "section": "Symptom",
        "keywords": [
            "platform",
            "authoring",
            "pricing",
            "studio validation and price errors on a card"
        ],
        "text": "Reports look like \"I'm seeing a reference validation error on this card\", \"the card has a red alert icon in Studio\", \"there is a validation error on the CTA\", or \"the price shows an error icon\". Studio shows two different alert icons on a card, and they come from different layers, so first find out which one the author sees."
    },
    {
        "id": "playbook-studio-validation-errors.md#1",
        "topic": "playbook-studio-validation-errors",
        "title": "Studio validation and price errors on a card",
        "section": "The two alert icons",
        "keywords": [
            "platform",
            "authoring",
            "pricing",
            "studio validation and price errors on a card"
        ],
        "text": "1. **Validation error.** An alert icon next to the card's status (Draft, Published, Modified) in the content table, and a banner at the top of the card editor that reads \"This fragment has validation errors.\" followed by one line per error in the form `property: message`. Hovering the table icon lists the same messages. These come from AEM author: the fragment carries a `validationStatus` list of `{ property, message }` entries, and Studio shows them verbatim.\n2. **Price error.** An alert icon in place of the actions menu at the end of the card's table row. Studio shows it when it cannot resolve the card's `osi` field to an offer: the offer lookup returns nothing or throws. It has nothing to do with AEM validation; it is offer resolution (the OSI against WCS), and the price trouble playbook applies."
    },
    {
        "id": "playbook-studio-validation-errors.md#2",
        "topic": "playbook-studio-validation-errors",
        "title": "Studio validation and price errors on a card",
        "section": "How to read a validation message",
        "keywords": [
            "platform",
            "authoring",
            "pricing",
            "studio validation and price errors on a card"
        ],
        "text": "The `property` names the part of the fragment AEM rejects. `fields.<name>` is a card field, so `fields.ctas` is the CTA field, `fields.prices` the price field, and `fields.variations` the list of variation references. An index such as `values[0]` points at the first entry of a multi-value field, and `<list element>` means the entry itself. Messages seen in Studio include `fields.ctas.values[0].<list element>: is not valid HTML` (AEM refuses the CTA markup) and `path: is required`.\n\nTriage by what the property names:\n- **A rich-text field (`fields.ctas`, `fields.prices`, `fields.description` and similar):** AEM rejects the stored markup of that field. The markup edited last is the first suspect, for example a CTA whose checkout link was edited by hand to add `data-extra-options` (such as an `svar` value). Ask the author to reopen that CTA or price in the editor, save it again through the link or price dialog, and check whether the banner clears.\n- **`fields.osi`, or the price icon rather than the banner:** follow the price trouble playbook from the card's OSI."
    },
    {
        "id": "playbook-studio-validation-errors.md#3",
        "topic": "playbook-studio-validation-errors",
        "title": "Studio validation and price errors on a card",
        "section": "What this assistant can and cannot see",
        "keywords": [
            "platform",
            "authoring",
            "pricing",
            "studio validation and price errors on a card"
        ],
        "text": "`validationStatus` exists only on the author (draft) side of AEM. So never guess the validation message: ask the author to copy the exact `property: message` lines from the banner in the card editor. If it is missing, the change was saved but never published, or the publish failed."
    },
    {
        "id": "playbook-studio-validation-errors.md#4",
        "topic": "playbook-studio-validation-errors",
        "title": "Studio validation and price errors on a card",
        "section": "Validation errors and publishing",
        "keywords": [
            "platform",
            "authoring",
            "pricing",
            "studio validation and price errors on a card"
        ],
        "text": "Clear validation errors before publishing a card; a fragment AEM rejects may not publish, and then production keeps serving the previous version. Promo projects handle this explicitly: publishing a promo project skips each promo variation that has a validation error and reports \"Project published, but N promo variation(s) could not be included.\""
    },
    {
        "id": "playbook-studio-validation-errors.md#5",
        "topic": "playbook-studio-validation-errors",
        "title": "Studio validation and price errors on a card",
        "section": "Investigation steps",
        "keywords": [
            "platform",
            "authoring",
            "pricing",
            "studio validation and price errors on a card"
        ],
        "text": "1. Ask which icon the author sees, and for the exact banner lines if it is the validation banner. Get the card's fragment id from the Studio URL (`fragmentId=`).\n2. Layer: `odin`.\n3. Layer: `odin`.\n4. Layer: `client` (offer resolution), or `odin` if the OSI itself is wrong.\n5. If it is absent, the card needs a clean save and a publish once the validation errors are gone. If it is present, the problem is downstream of the fragment, for example checkout or the page. Layer: `odin`, then `client` or `milo`."
    },
    {
        "id": "playbook-translation-project-trouble.md#0",
        "topic": "playbook-translation-project-trouble",
        "title": "Translation project trouble",
        "section": "About Translation project trouble",
        "keywords": [
            "platform",
            "authoring",
            "translation project trouble"
        ],
        "text": "For how a translation project is normally built and sent, see the how-to on sending a fragment for translation. This playbook is for when that flow fails: a project that will not save, a project that will not send, or one that has to be resent after something goes wrong on the localization side."
    },
    {
        "id": "playbook-translation-project-trouble.md#1",
        "topic": "playbook-translation-project-trouble",
        "title": "Translation project trouble",
        "section": "Symptom: saving a project doesn't work",
        "keywords": [
            "platform",
            "authoring",
            "translation project trouble"
        ],
        "text": "Check the Network tab for the failing request. One possible cause is a project name that isn't unique. Studio does not check this up front: it names the new project fragment after its title, and when the translations folder already holds a project with that name, the create request fails with a 409 and Studio shows \"Project with this name already exists.\"\n\n**Symptom: \"Send for Localization\" doesn't work.** Filter the Network tab for the `translation-project-start` request and inspect its POST."
    },
    {
        "id": "playbook-translation-project-trouble.md#2",
        "topic": "playbook-translation-project-trouble",
        "title": "Translation project trouble",
        "section": "Resending a translation project",
        "keywords": [
            "platform",
            "authoring",
            "translation project trouble"
        ],
        "text": "If CATS-I or Odin reports something went wrong during translation and asks for the project to be resent, Studio's own \"sent\" lock normally prevents that. The workaround:\n1. Open the translation project fragment in the Odin editor.\n2. Clear the `submissionDate` field.\n3. Move the cursor to another field to trigger the editor's autosave (autosave is always on in the Odin editor).\n4. Open the same project in Studio (`https://mas.adobe.com/studio.html#content-type=merch-card&page=translation-editor&path=<surface>&translationProjectId=<id>`) and click Submit — the Submit button is available again because Studio now treats it as unsent.\n\nOdin treats this as a new project and appends a new timestamp, but the project title still starts with the same authored text, so resends of the same project differ only by that timestamp and are hard to tell apart. Duplicating the project under a new title would be the cleaner fix long-term, but that is not implemented.\n\n**If the issue isn't on the content or MAS code side.**"
    },
    {
        "id": "pricing-systems.md#0",
        "topic": "pricing-systems",
        "title": "WCS, AOS and MCS",
        "section": "What is WCS?",
        "keywords": [
            "platform",
            "pricing",
            "wcs",
            "aos and mcs"
        ],
        "text": "WCS, the Web Commerce Service, is the API that takes an offer selector ID plus context like country, locale and promo code, and returns a ready-to-show price, tax and terms for a web page. It exists so that pages only ever handle an opaque offer ID and a few context values, never raw pricing logic themselves."
    },
    {
        "id": "pricing-systems.md#1",
        "topic": "pricing-systems",
        "title": "WCS, AOS and MCS",
        "section": "What is AOS?",
        "keywords": [
            "platform",
            "pricing",
            "wcs",
            "aos and mcs"
        ],
        "text": "AOS, the Available Offers Service, is the catalog and search service behind WCS. It looks up an offer selector ID, or a direct query, and resolves it into one or more concrete offers, each with its own price, terms and business details such as commitment and term."
    },
    {
        "id": "pricing-systems.md#2",
        "topic": "pricing-systems",
        "title": "WCS, AOS and MCS",
        "section": "What is MCS?",
        "keywords": [
            "platform",
            "pricing",
            "wcs",
            "aos and mcs"
        ],
        "text": "MCS, the Merchandising Content Service (its own service descriptor also just calls it the Merchandising Service), is the system of record for an offer's marketing content, things like its product name, description, icons and links. It is a separate concern from pricing: AOS can pull that content in when asked, but MCS itself never touches price."
    },
    {
        "id": "pricing-systems.md#3",
        "topic": "pricing-systems",
        "title": "WCS, AOS and MCS",
        "section": "Which of these does MAS actually call when a card renders?",
        "keywords": [
            "platform",
            "pricing",
            "wcs",
            "aos and mcs"
        ],
        "text": "Only WCS. A MAS card's browser code makes exactly one pricing network call, straight to WCS, and never calls AOS or MCS directly. WCS itself calls AOS behind the scenes to resolve the offer selector ID into real offers, but MAS never sees that step happen. The one unrelated exception is MAS Studio's offer selector tool, which refreshes its own product search cache by querying AOS directly; that has nothing to do with how a live card gets its price.\n\n**Who owns WCS?.**"
    },
    {
        "id": "promotions.md#0",
        "topic": "promotions",
        "title": "Promotions",
        "section": "What is a promotion in MAS?",
        "keywords": [
            "platform",
            "authoring",
            "promotions",
            "promotion",
            "promo",
            "promo code",
            "campaign",
            "project",
            "discount",
            "offer substitution",
            "promo variation",
            "schedule",
            "publish promotion"
        ],
        "text": "A promotion, called a promotion project in MAS Studio, is a content fragment that describes one campaign: when it runs, where it runs, which promo code it carries, and which offers, cards and collections take part. Authors work with promotions on the Promotions page in the side navigation, which lists every project with its timeline, status and creator.\n\nA promotion is not a place where you change a price. It carries a promo code that the commerce service applies to an offer at render time, so the discounted price still comes from the catalog. See the offers and pricing pages for how an offer resolves into a price."
    },
    {
        "id": "promotions.md#1",
        "topic": "promotions",
        "title": "Promotions",
        "section": "What does an author set on a promotion?",
        "keywords": [
            "platform",
            "authoring",
            "promotions",
            "promotion",
            "promo",
            "promo code",
            "campaign",
            "project",
            "discount",
            "offer substitution",
            "promo variation",
            "schedule",
            "publish promotion"
        ],
        "text": "The project form has a title, an optional promo code, a start date and an end date in UTC, with an evergreen switch for a campaign that has no end. It also takes one or more geos, chosen as locale and personalization tags, and one or more surfaces, chosen from a surface list. Studio assigns the promotion tag itself, and the field is read only.\n\nBelow the form, the author attaches the items the campaign touches, on an Offers tab and a Fragments tab that also holds collections. A separate Manage promo codes and offers view lets the author override the promo code per country for a given offer selector, so one project can run different codes in different countries."
    },
    {
        "id": "promotions.md#2",
        "topic": "promotions",
        "title": "Promotions",
        "section": "How does a promotion reach a card?",
        "keywords": [
            "platform",
            "authoring",
            "promotions",
            "promotion",
            "promo",
            "promo code",
            "campaign",
            "project",
            "discount",
            "offer substitution",
            "promo variation",
            "schedule",
            "publish promotion"
        ],
        "text": "The fragment pipeline reads the promotions folder for the requested surface, keeps the projects whose promotion tag, geo and date window match the request, and then applies them to the card being rendered. A matching project can change the card in two ways: it applies its promo code to the card's offer, and it merges the card's promo variation over the authored card when one exists.\n\nA promo variation is a promotion specific copy of a card, stored in a promotions folder inside the same surface and locale, under the promotion's own name. An author creates it from the project's fragments list with Create promo variation, optionally scoped to particular geos, and Studio opens the copy in the fragment editor. Editing that copy changes only what the campaign shows, never the default card."
    },
    {
        "id": "promotions.md#3",
        "topic": "promotions",
        "title": "Promotions",
        "section": "What does a promotion do to a personalized card?",
        "keywords": [
            "platform",
            "authoring",
            "promotions",
            "promotion",
            "promo",
            "promo code",
            "campaign",
            "project",
            "discount",
            "offer substitution",
            "promo variation",
            "schedule",
            "publish promotion"
        ],
        "text": "This applies when a card is requested with a `pzn` value and a promotion project also targets it. The pipeline looks for promo copies before it looks at personalization, and picks the first of these that applies:\n\n1. The project holds a promo variation made from the visitor's grouped variation. That promo variation renders.\n2. The default card has a promo variation in the project. It renders instead of the visitor's grouped variation, whether or not that grouped variation was added to the project.\n3. The project lists grouped variations and the visitor's is one of them. The grouped variation renders with the promo code.\n4. The project lists grouped variations but not the visitor's. The default card renders with the promo code, and the visitor's grouped variation is dropped.\n5. The project lists no grouped variations. The visitor's grouped variation renders with the promo code.\n\nThe promo code applies in every case. Adding a grouped variation to a project brings it into the promotion rather than protecting it.\n\nThere is no setting that keeps a promotion away from a personalization segment. The project model has a `variationStrategy` field, but nothing reads it. The per offer \"ignore variations\" option is not a segment switch either: it applies to every visitor of that offer in that geo, skips only the promo variation, and still applies the promo code. The request to leave chosen segments untouched is tracked in MWPW-208439.\n\nA card field that an MEP manifest row swaps to the grouped variation's own id is a different path. On the adobe.com homepage on 2026-09-23 that request came back with no promotion applied, so a field swap can keep segment content while the rest of the card shows the promotion."
    },
    {
        "id": "promotions.md#4",
        "topic": "promotions",
        "title": "Promotions",
        "section": "Which countries and dates is a promo code set up for?",
        "keywords": [
            "platform",
            "authoring",
            "promotions",
            "promotion",
            "promo",
            "promo code",
            "campaign",
            "project",
            "discount",
            "offer substitution",
            "promo variation",
            "schedule",
            "publish promotion"
        ],
        "text": "A promo code has two separate lives, and a question about \"where and when it is valid\" can mean either.\n\nIn MAS, a code is attached by promotion projects, either as the project's promo code (for all the project's geos) or on an offer line of the form `<OSIs>|<code>|<geos>`, where an empty geo list means all the project's geos. So the MAS answer is: which published projects use the code, their start and end dates (no end date means evergreen), their surfaces, and the countries each line maps the code to. A project without a `mas:promotion/` tag is never applied by the fragment pipeline, whatever it says.\n\nIn commerce, the code is defined in the promotions system with its own validity window and eligible countries. That window is not visible to MAS or to this assistant. What can be checked is the effect today: pricing an OSI through WCS with the code shows the discounted price next to the price before the discount when the code applies, and the regular price when it does not. The start and end dates in a WCS response belong to the offer, not to the promo code.\n\nThis assistant can do both: it finds every published project using a code and prices each OSI and country pair it maps through WCS with the code."
    },
    {
        "id": "promotions.md#5",
        "topic": "promotions",
        "title": "Promotions",
        "section": "What do the promotion statuses mean?",
        "keywords": [
            "platform",
            "authoring",
            "promotions",
            "promotion",
            "promo",
            "promo code",
            "campaign",
            "project",
            "discount",
            "offer substitution",
            "promo variation",
            "schedule",
            "publish promotion"
        ],
        "text": "Studio computes the status from the dates and from the publish state rather than storing it. A project that is not published yet is draft; a published project is scheduled before its start date and active between its dates; a project whose end date has passed is expired; a project that was published and then edited again is modified. A project without a usable start date shows as unknown.\n\nStudio also separates production from test projects: a project that targets only the sandbox or nala surfaces counts as a test project, and any other surface makes it a production one."
    },
    {
        "id": "promotions.md#6",
        "topic": "promotions",
        "title": "Promotions",
        "section": "Who can create or edit a promotion?",
        "keywords": [
            "platform",
            "authoring",
            "promotions",
            "promotion",
            "promo",
            "promo code",
            "campaign",
            "project",
            "discount",
            "offer substitution",
            "promo variation",
            "schedule",
            "publish promotion"
        ],
        "text": "Creating, editing and duplicating promotion projects is limited to a promotions editors group, with MAS administrators always allowed. Everyone else sees the Promotions page and can open a project in a view only mode, without the create button. The access page explains how group membership is requested."
    },
    {
        "id": "rpp-offers.md#0",
        "topic": "rpp-offers",
        "title": "RPP offers",
        "section": "What is an RPP offer?",
        "keywords": [
            "platform",
            "pricing",
            "rpp offers"
        ],
        "text": "An RPP offer is a permanently lower price for one country or region. It is not a promotion: it has no end date, no strikethrough discount logic of its own, and no separate terms and conditions, because it is meant to stay in place rather than run for a limited time. RPP is short for Regional Pricing, and every source that discusses it uses the two names interchangeably, though no source spells out a longer official name for the letters."
    },
    {
        "id": "rpp-offers.md#1",
        "topic": "rpp-offers",
        "title": "RPP offers",
        "section": "How is RPP different from intro pricing?",
        "keywords": [
            "platform",
            "pricing",
            "rpp offers"
        ],
        "text": "Intro pricing, or IP, behaves like a promotion that never expires: it carries the usual promo signals, a strikethrough \"was\" price and a savings badge, and it comes with terms the way a real promotion does. RPP has none of that on its own; it is a plain repriced base offer for that country, not a markdown layered on top of a regular price. Some countries get RPP only, and some get RPP plus an added IP markdown on top, which is called RPP+IP."
    },
    {
        "id": "rpp-offers.md#2",
        "topic": "rpp-offers",
        "title": "RPP offers",
        "section": "What does a card show for an RPP offer?",
        "keywords": [
            "platform",
            "pricing",
            "rpp offers"
        ],
        "text": "As of mid 2026, for roughly the first six months after an RPP offer launches in a country, its card is still merchandised like a promotion, with crossed-out \"was/is\" prices and discount messaging, to draw attention to the new price. After that window, the promotional merchandising is taken down and the card shows the plain regional price, with no badge, no strikethrough and the existing product copy."
    },
    {
        "id": "rpp-offers.md#3",
        "topic": "rpp-offers",
        "title": "RPP offers",
        "section": "How do authors set up an RPP offer on a card?",
        "keywords": [
            "platform",
            "pricing",
            "rpp offers"
        ],
        "text": "Authors point the card at the RPP geo's offer with the same Offer Selector Tool and offer ID field used for any other offer. The convention across RPP geos is to reuse the same default content and offer ID rather than writing country-specific copy, because an RPP rollout typically shares one promo variation across all of its geos."
    },
    {
        "id": "see-terms-link.md#0",
        "topic": "see-terms-link",
        "title": "The universal See Terms link",
        "section": "How does the See Terms link choose the country and locale?",
        "keywords": [
            "platform",
            "authoring",
            "the universal see terms link"
        ],
        "text": "The universal See Terms link is the `upt-link` element in the MAS web components. It builds `https://www.adobe.com/offers/promo-terms.html` with `locale`, `country`, `offer_id` and, when set, `promotion_code`. The language and country come from the page's MAS locale and country settings, or from `data-language` and `data-country` on the element. The visitor's IMS country cookie does not change the link: `upt-link` copies it into `data-ims-country`, but the page's country is used first. The promo terms page itself belongs to adobe.com."
    },
    {
        "id": "see-terms-link.md#1",
        "topic": "see-terms-link",
        "title": "The universal See Terms link",
        "section": "Why does the See Terms link send Canadian visitors to the US terms page?",
        "keywords": [
            "platform",
            "authoring",
            "the universal see terms link"
        ],
        "text": "Because the link follows the page locale, not the visitor's country. A page served in English (US) links every visitor, including Canadian ones, to the US terms. This was reported for Canadian users of the try-and-buy widget on Adobe Home and is the intended behaviour of the element, so no MAS code change applies. A visitor sees Canadian terms only when the page is served in a Canadian locale. Hardcoding the terms URL in content removes the per-locale link altogether."
    },
    {
        "id": "studio-basics.md#0",
        "topic": "studio",
        "title": "MAS Studio Basics",
        "section": "What is Merch at Scale (M@S)?",
        "keywords": [
            "MAS",
            "Merch at Scale",
            "Studio",
            "Odin",
            "AEM",
            "fragment",
            "surface",
            "locale",
            "adobe.com",
            "architecture",
            "features",
            "navigation",
            "side nav",
            "pages",
            "product catalog",
            "permissions",
            "admin"
        ],
        "text": "Merch at Scale is Adobe's platform for authoring, managing, and delivering merchandising content — merch cards with product information, live pricing, and purchase CTAs — across Adobe's digital properties. Instead of hardcoding product cards into each page, teams author a card once in MAS Studio and the same card can be delivered to adobe.com, Creative Cloud Desktop, Adobe Home, Adobe Express, and Unified Checkout. Prices are fetched from Adobe's commerce services when the card renders, so pricing stays current everywhere without re-authoring."
    },
    {
        "id": "studio-basics.md#1",
        "topic": "studio",
        "title": "MAS Studio Basics",
        "section": "What is MAS Studio?",
        "keywords": [
            "MAS",
            "Merch at Scale",
            "Studio",
            "Odin",
            "AEM",
            "fragment",
            "surface",
            "locale",
            "adobe.com",
            "architecture",
            "features",
            "navigation",
            "side nav",
            "pages",
            "product catalog",
            "permissions",
            "admin"
        ],
        "text": "MAS Studio is the web application at https://mas.adobe.com/studio.html where merch cards are created, edited, and published. It offers a visual editor with live preview, a folder tree organized by surface, table and rendered views of your cards, search and filtering, integration with the Offer Selector Tool for pricing, a publish workflow, and an AI assistant chat panel. You sign in with your Adobe corporate account through IMS, and what you can see and do is governed by IAM group permissions."
    },
    {
        "id": "studio-basics.md#2",
        "topic": "studio",
        "title": "MAS Studio Basics",
        "section": "Where does card content live?",
        "keywords": [
            "MAS",
            "Merch at Scale",
            "Studio",
            "Odin",
            "AEM",
            "fragment",
            "surface",
            "locale",
            "adobe.com",
            "architecture",
            "features",
            "navigation",
            "side nav",
            "pages",
            "product catalog",
            "permissions",
            "admin"
        ],
        "text": "Cards are stored as content fragments in Odin, Adobe's internal Adobe Experience Manager (AEM) instance for structured content. All MAS content lives under the /content/dam/mas/ path, organized into folders by surface and locale. A fragment is structured data — named fields such as title, description, prices, ctas, and variant — not a rendered page; rendering happens later in the merch-card web component on the consuming page. Always create and edit MAS fragments through MAS Studio rather than directly in the AEM authoring UI, so the card structure stays valid."
    },
    {
        "id": "studio-basics.md#3",
        "topic": "studio",
        "title": "MAS Studio Basics",
        "section": "How does a card reach adobe.com?",
        "keywords": [
            "MAS",
            "Merch at Scale",
            "Studio",
            "Odin",
            "AEM",
            "fragment",
            "surface",
            "locale",
            "adobe.com",
            "architecture",
            "features",
            "navigation",
            "side nav",
            "pages",
            "product catalog",
            "permissions",
            "admin"
        ],
        "text": "First, an author creates and publishes the card in MAS Studio, which publishes the content fragment in Odin. Second, an adobe.com page includes the merch-card web component referencing that fragment. Third, when the page loads, the component fetches the fragment as JSON from the MAS delivery endpoint at https://www.adobe.com/mas/io/fragment, which runs a processing pipeline including locale resolution, placeholder replacement, and pricing integration. Fourth, if the card has an Offer Selector ID, the current price is fetched from the Web Commerce Service (WCS) for the user's locale. Responses are cached at the Akamai edge for performance, so a just-published change can take a short while to appear."
    },
    {
        "id": "studio-basics.md#4",
        "topic": "studio",
        "title": "MAS Studio Basics",
        "section": "What are surfaces and locales in MAS?",
        "keywords": [
            "MAS",
            "Merch at Scale",
            "Studio",
            "Odin",
            "AEM",
            "fragment",
            "surface",
            "locale",
            "adobe.com",
            "architecture",
            "features",
            "navigation",
            "side nav",
            "pages",
            "product catalog",
            "permissions",
            "admin"
        ],
        "text": "Surfaces are the destinations where cards render: acom (adobe.com), ccd (Creative Cloud Desktop), adobe-home (Adobe Home), commerce (Unified Checkout), and express (Adobe Express), plus a sandbox area for testing. Locales use codes like en_US or fr_FR (language plus country), and content folders follow the pattern /content/dam/mas/ then surface then locale. A card has a locale-default parent fragment, and each locale can hold exactly one variation of it for translated or region-specific content. Prices localize automatically through the offer system, but card text does not — translated text requires locale variations, which can be produced through translation projects."
    },
    {
        "id": "studio-basics.md#5",
        "topic": "studio",
        "title": "MAS Studio Basics",
        "section": "What features does Merch at Scale Studio have?",
        "keywords": [
            "MAS",
            "Merch at Scale",
            "Studio",
            "Odin",
            "AEM",
            "fragment",
            "surface",
            "locale",
            "adobe.com",
            "architecture",
            "features",
            "navigation",
            "side nav",
            "pages",
            "product catalog",
            "permissions",
            "admin"
        ],
        "text": "MAS Studio covers the full merchandising content workflow. You can author and publish merch cards on the Fragments page, group cards into collections, create locale variations for regional content and grouped personalization variations, localize content with translation projects on the Translations page, manage placeholders — reusable text strings resolved into cards per surface and locale — on the Placeholders page, and manage promotions with promo codes, schedules, geos, and attached offers and cards on the Promotions page (admin-only). You can publish content at scale with bulk publish projects under Advanced tools, browse the product catalog and create cards for a product from its detail page, attach live pricing through the Offer Selector Tool, and use the AI assistant to search, publish, update, and create content conversationally. Global settings and masks are additional permission-gated tools under Advanced tools."
    },
    {
        "id": "studio-basics.md#6",
        "topic": "studio",
        "title": "MAS Studio Basics",
        "section": "What pages are in the Studio side navigation?",
        "keywords": [
            "MAS",
            "Merch at Scale",
            "Studio",
            "Odin",
            "AEM",
            "fragment",
            "surface",
            "locale",
            "adobe.com",
            "architecture",
            "features",
            "navigation",
            "side nav",
            "pages",
            "product catalog",
            "permissions",
            "admin"
        ],
        "text": "The side navigation contains Home (quick actions and recently updated cards), Product Catalog, Fragments (the card content table), Collections (currently disabled — collections are managed from the Fragments page), Promotions, Placeholders, Translations, AI Assistant, and Advanced tools. The Promotions page only appears for members of the MAS admins group. Advanced tools contains three tools: Bulk publish (available to everyone), Global settings (admins and surface power users; on the sandbox, commerce, and nala surfaces it is admin-only), and Masks (permission-gated, for authoring reusable card overlays applied at delivery time). If a page you expect is missing from your side navigation, you are most likely missing the corresponding group membership."
    },
    {
        "id": "studio-basics.md#7",
        "topic": "studio",
        "title": "MAS Studio Basics",
        "section": "How do I browse the product catalog?",
        "keywords": [
            "MAS",
            "Merch at Scale",
            "Studio",
            "Odin",
            "AEM",
            "fragment",
            "surface",
            "locale",
            "adobe.com",
            "architecture",
            "features",
            "navigation",
            "side nav",
            "pages",
            "product catalog",
            "permissions",
            "admin"
        ],
        "text": "The Product Catalog page lists Adobe products in a sortable table with columns for name, product code, arrangement code, product family, customer segment, markets, and plan types, plus facet filters for markets, plan types, customer segments, and product families and a text search. Clicking a product opens its detail page. From the product detail page you can create a card for that product: pick the surface, locale, and one or more card variants, and Studio opens the Offer Selector Tool pre-filtered to the product's arrangement code so you can pick the offer that prices the card."
    },
    {
        "id": "studio-basics.md#8",
        "topic": "studio",
        "title": "MAS Studio Basics",
        "section": "What can the AI assistant in Studio do?",
        "keywords": [
            "MAS",
            "Merch at Scale",
            "Studio",
            "Odin",
            "AEM",
            "fragment",
            "surface",
            "locale",
            "adobe.com",
            "architecture",
            "features",
            "navigation",
            "side nav",
            "pages",
            "product catalog",
            "permissions",
            "admin"
        ],
        "text": "The assistant can search cards by title, content, tags, surface, locale, or linked offer ID; fetch a card's contents; open a card in the editor; and copy a deep link to a card. It can publish, unpublish, update, and duplicate cards, run bulk updates and bulk publishes with dry-run previews, create and inspect locale variations, create collections and add cards to them, and create tags. On the commerce side it can search products and offers, resolve OSIs, create offer selectors, link offers to cards, and validate card-offer consistency. It also supports translation coverage reports, finding untranslated cards, translation projects, a guided flow for creating new product release cards, and opening the Offer Selector Tool. Every state-changing action asks for your explicit confirmation before it runs."
    },
    {
        "id": "studio-pages.md#0",
        "topic": "studio-pages",
        "title": "Studio pages and editors",
        "section": "What does the fragment editor do?",
        "keywords": [
            "fragment editor",
            "advanced tools",
            "masks",
            "mask",
            "global settings",
            "locale picker",
            "region picker",
            "rollout",
            "roll out",
            "rollout project",
            "preview",
            "preview on page",
            "render view",
            "table view",
            "permission",
            "gated",
            "access",
            "side rail",
            "breadcrumb"
        ],
        "text": "The fragment editor is the full-page editor for one card, collection or compare chart, with a live preview of the card beside the form. It opens from the Fragments list and shows the fields for the card's template, a side rail, and an action toolbar. From it you can save, publish, duplicate, delete, and set a variation type, and its dialogs include Confirm Deletion (which warns when the card has locale variations), Confirm Discard, and Confirm Cloning, which asks for a new title, an OSI search and tags. The side rail includes the Copy Field button, which produces a link for using a single field of the card on a page. Breadcrumbs show where you are, for example Fragments then Editor."
    },
    {
        "id": "studio-pages.md#1",
        "topic": "studio-pages",
        "title": "Studio pages and editors",
        "section": "What is the Advanced tools page?",
        "keywords": [
            "fragment editor",
            "advanced tools",
            "masks",
            "mask",
            "global settings",
            "locale picker",
            "region picker",
            "rollout",
            "roll out",
            "rollout project",
            "preview",
            "preview on page",
            "render view",
            "table view",
            "permission",
            "gated",
            "access",
            "side rail",
            "breadcrumb"
        ],
        "text": "Advanced tools is a hub page whose cards link to Bulk publish, Global settings and Masks. It is the entry point for the operations that are not part of everyday card authoring. The Global settings and Masks cards are permission gated, so which cards you see depends on your access for the current surface."
    },
    {
        "id": "studio-pages.md#2",
        "topic": "studio-pages",
        "title": "Studio pages and editors",
        "section": "What are masks in MAS Studio?",
        "keywords": [
            "fragment editor",
            "advanced tools",
            "masks",
            "mask",
            "global settings",
            "locale picker",
            "region picker",
            "rollout",
            "roll out",
            "rollout project",
            "preview",
            "preview on page",
            "render view",
            "table view",
            "permission",
            "gated",
            "access",
            "side rail",
            "breadcrumb"
        ],
        "text": "A mask is a reusable card overlay applied at delivery time, rather than something baked into each card. The Masks list has a region picker and a Create mask action, with columns for Name, Description, Last updated by, Last published by and Status, and a row menu offering Edit, Publish and Delete. The mask editor has a Title, Name, Description, a template picker and a Placeholders multifield where you add variables. Masks are reached from Advanced tools."
    },
    {
        "id": "studio-pages.md#3",
        "topic": "studio-pages",
        "title": "Studio pages and editors",
        "section": "Who can see Masks and Global settings?",
        "keywords": [
            "fragment editor",
            "advanced tools",
            "masks",
            "mask",
            "global settings",
            "locale picker",
            "region picker",
            "rollout",
            "roll out",
            "rollout project",
            "preview",
            "preview on page",
            "render view",
            "table view",
            "permission",
            "gated",
            "access",
            "side rail",
            "breadcrumb"
        ],
        "text": "Both are gated behind the same permission check. Access requires membership of the MAS admins group or of the current surface's power-user group, so access is per surface: a user may see settings on one surface and not another. The commerce, sandbox and nala surfaces are admin only. If you are not permitted, the Masks page says you do not have access to masks for this surface, and navigating directly to the settings page redirects you to Home rather than showing an error."
    },
    {
        "id": "studio-pages.md#4",
        "topic": "studio-pages",
        "title": "Studio pages and editors",
        "section": "What is the locale picker for?",
        "keywords": [
            "fragment editor",
            "advanced tools",
            "masks",
            "mask",
            "global settings",
            "locale picker",
            "region picker",
            "rollout",
            "roll out",
            "rollout project",
            "preview",
            "preview on page",
            "render view",
            "table view",
            "permission",
            "gated",
            "access",
            "side rail",
            "breadcrumb"
        ],
        "text": "The locale picker, also called the region picker, selects which locale you are working in. Studio scopes what you see to the currently selected surface and locale, so the Fragments list, the Placeholders page and the Masks list all follow it. It also appears inside dialogs, notably when setting a variation type, where a regional locale picker chooses the target locale for a new locale variation. It is enabled in more editor states than it once was, including on grouped variations, and language switching also works for promo variations."
    },
    {
        "id": "studio-pages.md#5",
        "topic": "studio-pages",
        "title": "Studio pages and editors",
        "section": "How do I roll out a card to other locales (rollout project)?",
        "keywords": [
            "fragment editor",
            "advanced tools",
            "masks",
            "mask",
            "global settings",
            "locale picker",
            "region picker",
            "rollout",
            "roll out",
            "rollout project",
            "preview",
            "preview on page",
            "render view",
            "table view",
            "permission",
            "gated",
            "access",
            "side rail",
            "breadcrumb"
        ],
        "text": "To roll out a card to other locales without translating it, use a rollout project. A rollout project is a translation project whose type is set to Rollout instead of Translation. Rather than sending content out for translation, it copies the selected content into the target locales as-is. Use it when you need locale copies of a card without changing the text, for example when the content is language neutral or will be edited by hand per locale. You choose Translation or Rollout with the Project Type control when creating the project in the translation project editor, and both kinds go through the same submission pipeline and show the same statuses on the Translations page."
    },
    {
        "id": "studio-pages.md#6",
        "topic": "studio-pages",
        "title": "Studio pages and editors",
        "section": "What is the difference between Render view and Table view?",
        "keywords": [
            "fragment editor",
            "advanced tools",
            "masks",
            "mask",
            "global settings",
            "locale picker",
            "region picker",
            "rollout",
            "roll out",
            "rollout project",
            "preview",
            "preview on page",
            "render view",
            "table view",
            "permission",
            "gated",
            "access",
            "side rail",
            "breadcrumb"
        ],
        "text": "The Fragments list can show content either as rendered cards or as a table. The toolbar carries the Filter button with a count badge, a Search box, a Create menu offering Merch Card, Merch Card Collection and Compare chart, a Select action for multi-select mode, and the Render view / Table view switch. Render view is for recognising cards visually; Table view is for scanning many rows and for multi-select work."
    },
    {
        "id": "studio-pages.md#7",
        "topic": "studio-pages",
        "title": "Studio pages and editors",
        "section": "How do I preview a card on a real page?",
        "keywords": [
            "fragment editor",
            "advanced tools",
            "masks",
            "mask",
            "global settings",
            "locale picker",
            "region picker",
            "rollout",
            "roll out",
            "rollout project",
            "preview",
            "preview on page",
            "render view",
            "table view",
            "permission",
            "gated",
            "access",
            "side rail",
            "breadcrumb"
        ],
        "text": "Use the Preview action, available from the fragment editor's action bar and from a row in the Fragments table. It opens the card on a Milo preview page in a new tab, passing the fragment id, whether it is a card or a collection, and the locale taken from the fragment's path. Which host it opens depends on the card's status: a published card previews on the production Milo host, and an unpublished one previews on the Milo branch host so you can see draft content. This is different from the live preview beside the form in the fragment editor, which shows the card on its own rather than on a page."
    },
    {
        "id": "surface-settings.md#0",
        "topic": "surface-settings",
        "title": "Surface settings",
        "section": "Where settings live",
        "keywords": [
            "platform",
            "authoring",
            "surface settings"
        ],
        "text": "Each surface has one settings fragment at `/content/dam/mas/<surface>/settings/index` holding many setting entries. An entry has a `name`, a default value, and optional overrides scoped by `locales`, `geos`, `tags` (fragment tags) and `templates` (card templates, matched against each card's `variant`). The IO pipeline caches the whole settings fragment per surface for five minutes, so a settings edit takes a few minutes to reach the live fleet on top of the CDN cache."
    },
    {
        "id": "surface-settings.md#1",
        "topic": "surface-settings",
        "title": "Surface settings",
        "section": "The setting list",
        "keywords": [
            "platform",
            "authoring",
            "surface settings"
        ],
        "text": "The pipeline recognizes exactly these names: `addon` (optional text, addon editor), `secureLabel` (optional text, reads the `showSecureLabel` fragment field), `displayAnnual` (boolean), `displayPlanType` (boolean, reads `showPlanType`), `quantitySelect` (optional text, quantity-select editor), `hideTrialCTAs` (boolean), `hideEduDisclaimer` (boolean), `additionalModalTriggers` (boolean), and `placeholderRemap` (text). Resolved values are written onto each fragment's `settings` object in the IO response, which is what the client reads. `placeholderRemap` is special: it is not written to `settings` but rewrites `{{old}}` tokens in the fragment fields to `{{new}}` before the replace step, one `from: to` pair per line."
    },
    {
        "id": "surface-settings.md#2",
        "topic": "surface-settings",
        "title": "Surface settings",
        "section": "How an entry resolves",
        "keywords": [
            "platform",
            "authoring",
            "surface settings"
        ],
        "text": "When the settings fragment is loaded, each entry is filed either as an override or as the default for its name. Only an entry that declares locales, geos or tags becomes an override; an entry scoped only by templates is filed as the default (and if a name has more than one unscoped or template-only entry, the last one read becomes the default). To resolve a surface setting for a given fragment and region locale: if the default entry has template scoping and the fragment's template (its `variant`) is not in it, the fragment's own field value (if present) wins instead, and with no field value the setting is left unset. Otherwise the candidate overrides are filtered and scored. An override qualifies when every scope it declares matches: locales and geos against the request's region locale and country, tags against the fragment's tags, and, if the override also lists templates, the fragment's template — so a tag-only override is fully live, while templates on an override only narrow it. Candidates are then scored — geo match weight times ten plus one per matching tag — and the best-scoring override is merged over the default. Boolean values normalize from the strings `true`/`false`; an optional text whose boolean scope is false resolves to an empty string."
    },
    {
        "id": "surface-settings.md#3",
        "topic": "surface-settings",
        "title": "Surface settings",
        "section": "Common questions",
        "keywords": [
            "platform",
            "authoring",
            "surface settings"
        ],
        "text": "Why does a setting behave differently per region: the entry has `geos` or `locales` overrides and the request's region locale matched one of them; trace the entry for the exact locale and country rather than assuming the default. Why does a card-level checkbox win over a setting: some settings (secureLabel, displayPlanType) are designed to fall back to the fragment's own field when no template-scoped entry applies. Why did an edit not take effect: the five-minute settings cache plus the CDN max-age, both in minutes."
    },
    {
        "id": "tags.md#0",
        "topic": "tags",
        "title": "Tags",
        "section": "What a tag is",
        "keywords": [
            "platform",
            "authoring",
            "tags"
        ],
        "text": "A tag is a label from AEM's shared tag taxonomy under the mas namespace, attached to a fragment to describe something about it, like its offer type, plan type, customer segment, or product. Tags are not fields on the fragment model, they're a separate mechanism, added or removed with a tag picker that shows the taxonomy as a tree and lets an author check the ones that apply."
    },
    {
        "id": "tags.md#1",
        "topic": "tags",
        "title": "Tags",
        "section": "The tag categories Studio uses",
        "keywords": [
            "platform",
            "authoring",
            "tags"
        ],
        "text": "Studio's filter panel groups tags into fixed categories: offer type, plan type, workflow step, market segment, customer segment, product code, template (the cards' `variant`), Studio's own content-type category, a custom category shown as Tag, and personalization. Publication status (published, draft, new, modified, unpublished) and Created by are separate filters in the same panel, not tag categories. A few of these categories double as real mechanisms elsewhere in the product, a promotion tag on a reference is how Studio tells a promotion variation apart from a locale variation, and a product code tag is how a fragment ties itself to one product."
    },
    {
        "id": "tags.md#2",
        "topic": "tags",
        "title": "Tags",
        "section": "How multiple tag filters combine",
        "keywords": [
            "platform",
            "authoring",
            "tags"
        ],
        "text": "When you filter by more than one tag at once, tags from the same top-level category combine with \"or\" logic, matching a fragment that has any one of them, while tags from different categories combine with \"and\" logic, so the fragment must have at least one match in every category you filtered on. For example filtering by two plan-type tags plus one offer-type tag returns fragments that have either plan-type tag and also have that offer-type tag, not fragments that have all three."
    },
    {
        "id": "tags.md#3",
        "topic": "tags",
        "title": "Tags",
        "section": "Common questions",
        "keywords": [
            "platform",
            "authoring",
            "tags"
        ],
        "text": "Why does adding a second tag to a filter return more results instead of fewer: the two tags are in the same category, so they combine with \"or\", not \"and\"; adding a tag from a different category is what narrows results. Why does a reference in the variations list turn out to be a promotion instead of a locale copy: check its promotion tag, that tag is what tells the two kinds of variation apart, not its path alone."
    },
    {
        "id": "translations.md#0",
        "topic": "translations",
        "title": "Translations in MAS Studio",
        "section": "How do I create a translation project?",
        "keywords": [
            "translation",
            "translate",
            "localize",
            "localization",
            "locale",
            "language",
            "translation project",
            "rollout"
        ],
        "text": "Open the Translations page from the MAS Studio side navigation and click the \"Create project\" button. This opens the translation project editor, where you give the project a title, choose one or more target locales, and add the content to translate: cards (fragments), placeholders, and collections. A project cannot be saved until it has a title, at least one target locale, and at least one selected item. The title is used as the localization task name, so it must be at most 255 characters, contain at least one letter or number, and use only letters, numbers, hyphens, underscores, and dots (consecutive dots are not allowed). Translation projects are created on this page; the AI assistant cannot create or submit them."
    },
    {
        "id": "translations.md#1",
        "topic": "translations",
        "title": "Translations in MAS Studio",
        "section": "What does a translation project contain?",
        "keywords": [
            "translation",
            "translate",
            "localize",
            "localization",
            "locale",
            "language",
            "translation project",
            "rollout"
        ],
        "text": "A translation project is stored as a content fragment with these fields: title, status, fragments (the card paths to translate), placeholders, collections, targetLocales, submissionDate, and projectType. Target locales use the underscore format such as fr_FR, de_DE, or ja_JP. The projectType is \"translation\" by default; a second type, \"rollout\", exists for rollout-only projects that copy content to target locales without sending it for translation. The Translations page lists all projects in a table showing title, status, who last modified the project, and the \"Sent on\" date (the submission date, sortable). From the row action menu you can edit or delete a project; deleting is permanent. Duplicate and Archive also appear in the menu but are currently disabled."
    },
    {
        "id": "translations.md#2",
        "topic": "translations",
        "title": "Translations in MAS Studio",
        "section": "How do I add content and locales to a translation project?",
        "keywords": [
            "translation",
            "translate",
            "localize",
            "localization",
            "locale",
            "language",
            "translation project",
            "rollout"
        ],
        "text": "In the translation project editor, \"Add items\" opens an overlay with tabs for cards, placeholders, and collections; search and filters (template, market segment, customer segment, product) help find the content, and Cancel reverts to the selection you had when the overlay opened. \"Add languages\" opens the target-locale picker the same way. The editor's quick-action bar offers Save, the send-for-localization action, Copy, Discard, and Delete. You can also start a pre-filled project from the fragment editor: the missing-variation panel routes to a new translation project with that card and the missing locale already selected. Studio has no dedicated translation coverage page — the fragment editor's variations panel shows which locales a card has. The AI assistant cannot produce coverage reports; ask it to list a card's variation locales instead."
    },
    {
        "id": "translations.md#3",
        "topic": "translations",
        "title": "Translations in MAS Studio",
        "section": "How do I send a translation project for localization?",
        "keywords": [
            "translation",
            "translate",
            "localize",
            "localization",
            "locale",
            "language",
            "translation project",
            "rollout"
        ],
        "text": "After creating and saving the project, use the send-for-localization action in the translation project editor. Studio calls the translation-project-start backend action with the project ID and the current surface, authenticated with your IMS token. On success the submission date is stamped on the project, its status becomes Pending, and the project becomes read-only in the editor. This is a Studio action only; the AI assistant cannot submit a project for you."
    },
    {
        "id": "translations.md#4",
        "topic": "translations",
        "title": "Translations in MAS Studio",
        "section": "What do the translation project statuses mean?",
        "keywords": [
            "translation",
            "translate",
            "localize",
            "localization",
            "locale",
            "language",
            "translation project",
            "rollout"
        ],
        "text": "The status column on the Translations page maps internal states to labels. \"Pending\" (internal status QUEUED) means the submission was accepted and the job is waiting in the queue. \"Running\" (RUNNING) means the job is being processed, including content synchronization. \"Sent to loc\" (ASYNC_PROCESSING) means the content has been handed off to the localization service and is out for translation. \"Failed\" (FAILED) means the job did not complete; the project can be inspected and resubmitted. These statuses are visible on the Translations page; the assistant cannot query them."
    },
    {
        "id": "translations.md#5",
        "topic": "translations",
        "title": "Translations in MAS Studio",
        "section": "What happens after I submit a translation project?",
        "keywords": [
            "translation",
            "translate",
            "localize",
            "localization",
            "locale",
            "language",
            "translation project",
            "rollout"
        ],
        "text": "Submission is asynchronous. The translation-project-start action validates the request, marks the project QUEUED with a submission date, stores the job payload, enqueues the job, and invokes a dispatcher action in the background, returning immediately. The worker then runs a sync stage before localization: placeholder entries are added to the dictionary index of each target locale, and for grouped (pzn) variations the parent fragments in each target locale are updated to reference the translated variations so they stay linked. After syncing, the worker sends the localization request to the AEM/Odin localization endpoint with the task name, the content fragment paths, and the target locales. The translation flow is determined per surface (for example transcreation) unless human translation is configured."
    },
    {
        "id": "translations.md#6",
        "topic": "translations",
        "title": "Translations in MAS Studio",
        "section": "What is a rollout project?",
        "keywords": [
            "translation",
            "translate",
            "localize",
            "localization",
            "locale",
            "language",
            "translation project",
            "rollout"
        ],
        "text": "A rollout project is a translation project whose projectType field is set to \"rollout\". Instead of sending content out for translation, the backend sends the selected content paths and target locales to the Odin locale-sync endpoint, which copies the content into the target locales as-is. This is useful when you need locale copies of fragments without changing the text, for example when the content is language-neutral or will be edited manually per locale. Rollout projects go through the same submission pipeline as translation projects: they are queued, synced, and dispatched asynchronously, and the same status labels apply on the Translations page."
    },
    {
        "id": "translations.md#7",
        "topic": "translations",
        "title": "Translations in MAS Studio",
        "section": "What can the AI assistant do with translations?",
        "keywords": [
            "translation",
            "translate",
            "localize",
            "localization",
            "locale",
            "language",
            "translation project",
            "rollout"
        ],
        "text": "Nothing directly. Translation projects are created, edited and submitted on the Translations page in Studio, not through the assistant.\n\nWhat the assistant can help with is the variation side of localization: it can show a card's variation tree, list which locales a card already has variations for, find the parent of a variation, and create a new locale variation of a card. So \"which locales does this card have?\" is answerable, while \"create a translation project for these\" is not."
    },
    {
        "id": "translations.md#8",
        "topic": "translations",
        "title": "Translations in MAS Studio",
        "section": "Are prices and offers translated too?",
        "keywords": [
            "translation",
            "translate",
            "localize",
            "localization",
            "locale",
            "language",
            "translation project",
            "rollout"
        ],
        "text": "No, and they do not need to be. Card prices come from the offer selector (OSI), which adapts automatically to the page locale: currency, tax labels, and checkout links are resolved at render time by the commerce backend. The same OSI works across locales as long as the offer is valid there. Commerce placeholders are likewise resolved by backend locale logic rather than translated. What translation projects handle is the authored card content itself — titles, descriptions, and other text fields — which is not auto-translated and must go through a translation project (or be authored separately per locale)."
    },
    {
        "id": "troubleshooting.md#0",
        "topic": "troubleshooting",
        "title": "Troubleshooting MAS Studio",
        "section": "Why is my card not showing on the page (fragment not found)?",
        "keywords": [
            "error",
            "fragment not found",
            "publish failed",
            "price not showing",
            "404",
            "401",
            "403",
            "help",
            "slack"
        ],
        "text": "A \"fragment not found\" or 404 error means the delivery API cannot find the fragment at the requested path. Check three things. First, the card must be Published, not Draft or Modified — unpublished fragments are not delivered. Second, the fragment path must be exact and is case-sensitive; it starts with /content/dam/mas/. Third, test delivery directly by opening https://www.adobe.com/mas/io/fragment with the path parameter set to your fragment path — a working fragment returns JSON. If the card was just published, edge caching can briefly serve stale results; hard refresh and retry after a minute or two. You can also ask the AI assistant to search for the card to confirm it exists and check its status."
    },
    {
        "id": "troubleshooting.md#1",
        "topic": "troubleshooting",
        "title": "Troubleshooting MAS Studio",
        "section": "Why is the price not showing on my card?",
        "keywords": [
            "error",
            "fragment not found",
            "publish failed",
            "price not showing",
            "404",
            "401",
            "403",
            "help",
            "slack"
        ],
        "text": "Prices are fetched at render time from the Web Commerce Service (WCS) using the card's Offer Selector ID (OSI). Verify the OSI field has a value and that the card was saved after inserting it — the OSI only persists after a save. Then verify the offer is valid for the page's locale and country and that today falls within its availability dates; a WCS response of 200 with an empty body usually means the offer is not available for that locale. In the browser network tab, look for requests containing web_commerce_artifact and inspect the response. The AI assistant can resolve the OSI to its offer details so you can confirm the offer exists, and it can validate that the card and its linked offer are consistent."
    },
    {
        "id": "troubleshooting.md#2",
        "topic": "troubleshooting",
        "title": "Troubleshooting MAS Studio",
        "section": "Why can't I publish my card?",
        "keywords": [
            "error",
            "fragment not found",
            "publish failed",
            "price not showing",
            "404",
            "401",
            "403",
            "help",
            "slack"
        ],
        "text": "The most common causes are missing permissions, validation errors, or a temporary backend issue. Publishing requires a publisher role through your IAM group membership — being able to edit does not imply being able to publish. Validation errors also block publishing: check for red error indicators and fill all required fields for the card's variant. If permissions and validation are fine, it may be a temporary issue in the AEM backend; retry later, and if it persists ask in the #merch-at-scale Slack channel. For publishing many cards, the AI assistant can show a preview of exactly which cards a bulk publish would affect before running it."
    },
    {
        "id": "troubleshooting.md#3",
        "topic": "troubleshooting",
        "title": "Troubleshooting MAS Studio",
        "section": "Why don't I see Promotions or Global settings in the side navigation?",
        "keywords": [
            "error",
            "fragment not found",
            "publish failed",
            "price not showing",
            "404",
            "401",
            "403",
            "help",
            "slack"
        ],
        "text": "Those pages are group-gated, not broken. Promotions is only rendered for members of the MAS admins group. Global settings requires admin membership or the surface's power-users group, and on the sandbox, commerce, and nala surfaces it is admin-only; Masks is gated the same way. Collections appears in the navigation but is currently disabled for everyone. If you need one of these pages, request the matching group through IAM, then sign out of Studio and back in so the new membership is picked up."
    },
    {
        "id": "troubleshooting.md#4",
        "topic": "troubleshooting",
        "title": "Troubleshooting MAS Studio",
        "section": "What do 401 and 403 errors mean?",
        "keywords": [
            "error",
            "fragment not found",
            "publish failed",
            "price not showing",
            "404",
            "401",
            "403",
            "help",
            "slack"
        ],
        "text": "A 401 means your IMS session token is expired or invalid: sign out of Studio and sign back in; clearing the browser's session storage for the site also helps. A 403 means you are authenticated but lack permission for the action: check your IAM group membership. If you can log in but see no content at all, you are likely missing the surface-specific author group for the surface you are browsing. Request the needed groups through Adobe's IAM system, allow time for provisioning, then log out and back in."
    },
    {
        "id": "troubleshooting.md#5",
        "topic": "troubleshooting",
        "title": "Troubleshooting MAS Studio",
        "section": "Why does OST show no results for my search?",
        "keywords": [
            "error",
            "fragment not found",
            "publish failed",
            "price not showing",
            "404",
            "401",
            "403",
            "help",
            "slack"
        ],
        "text": "Several causes are common. The offer may not be valid for the locale you are authoring in — offers are onboarded per country. Its availability dates may exclude today. It may still be a draft offer, which only appears when searching the DRAFT landscape (add the commerce.landscape=DRAFT parameter). Or it may not exist yet. The AI assistant can search the offer catalog with filters and list matching products, which quickly confirms whether the offer exists at all before you dig further."
    },
    {
        "id": "troubleshooting.md#6",
        "topic": "troubleshooting",
        "title": "Troubleshooting MAS Studio",
        "section": "The AI assistant gave an error or a wrong result — what should I do?",
        "keywords": [
            "error",
            "fragment not found",
            "publish failed",
            "price not showing",
            "404",
            "401",
            "403",
            "help",
            "slack"
        ],
        "text": "Retry the request once — transient backend errors happen. If the conversation seems stuck in the middle of a flow, ask to start over; this clears the chat and any in-progress flow state. Note that the assistant always asks for confirmation before publishing, updating, or creating anything, so an error never means something was changed without your approval. If a problem persists, report it in the #merch-at-scale Slack channel with what you asked and roughly when."
    },
    {
        "id": "troubleshooting.md#7",
        "topic": "troubleshooting",
        "title": "Troubleshooting MAS Studio",
        "section": "Where do I get help?",
        "keywords": [
            "error",
            "fragment not found",
            "publish failed",
            "price not showing",
            "404",
            "401",
            "403",
            "help",
            "slack"
        ],
        "text": "The #merch-at-scale Slack channel is the main channel for all MAS questions: authoring help, Studio bugs, publishing problems, and access requests. The team has a no-direct-message policy, so post in the channel rather than messaging individuals — answers in channel help everyone. For pricing and offer catalog data issues use #catalog-support, and for adobe.com page integration questions use #milo-dev. Bugs are tracked in the Jira MWPW project; a good report includes steps to reproduce, the fragment path, the OSI if pricing-related, the environment, and screenshots."
    },
    {
        "id": "troubleshooting.md#8",
        "topic": "troubleshooting",
        "title": "Troubleshooting MAS Studio",
        "section": "Why is my card showing English text on a non-English page?",
        "keywords": [
            "error",
            "fragment not found",
            "publish failed",
            "price not showing",
            "404",
            "401",
            "403",
            "help",
            "slack"
        ],
        "text": "The card is falling back to English because the localized content is not being found for that locale. Check three things in order. First, does the card actually have a variation for that locale? A card with no locale variation renders its parent, which is usually the English one. Second, are the placeholders resolved? Placeholder text is looked up in the dictionary for that surface and locale, and a key missing there falls back up the chain, so a card can be localized while its placeholder labels are not. Third, is the page requesting the locale you think it is? The locale comes from the page's own path and country handling, so an English-looking page URL will fetch English content even when a localized variation exists. Prices and checkout links are a separate matter: they are resolved by the commerce backend from the offer and adapt to the market automatically, so they are not translated and do not need a variation."
    },
    {
        "id": "variations.md#0",
        "topic": "variations",
        "title": "Creating and managing variations",
        "section": "What is a variation, from an authoring point of view",
        "keywords": [
            "platform",
            "authoring",
            "creating and managing variations",
            "collection",
            "merch card collection",
            "variation",
            "locale variation",
            "grouped variation",
            "pzn",
            "personalization",
            "locale default",
            "parent fragment",
            "translation"
        ],
        "text": "A variation is a copy of a card or collection that an author creates from its default locale fragment to serve one region or one personalization group differently. This page covers the Studio side of making and editing a variation. How IO decides which variation a live page actually gets, based on the requested locale and country, is a separate topic, see the locale and variation fallback page."
    },
    {
        "id": "variations.md#1",
        "topic": "variations",
        "title": "Creating and managing variations",
        "section": "The two kinds of variation you can create",
        "keywords": [
            "platform",
            "authoring",
            "creating and managing variations",
            "collection",
            "merch card collection",
            "variation",
            "locale variation",
            "grouped variation",
            "pzn",
            "personalization",
            "locale default",
            "parent fragment",
            "translation"
        ],
        "text": "Studio's \"Set a variation type\" dialog offers two choices. A regional variation targets one locale, and the picker only lists locales that are valid regions of the source fragment's own locale, for example a card authored in fr_FR can only get regional variations for fr_FR's own region list. A grouped variation is targeted by a set of locale or personalization tags instead of a single locale, and it can only be created from an en_US source fragment, or from any collection regardless of locale."
    },
    {
        "id": "variations.md#2",
        "topic": "variations",
        "title": "Creating and managing variations",
        "section": "Why you can only make one variation per locale",
        "keywords": [
            "platform",
            "authoring",
            "creating and managing variations",
            "collection",
            "merch card collection",
            "variation",
            "locale variation",
            "grouped variation",
            "pzn",
            "personalization",
            "locale default",
            "parent fragment",
            "translation"
        ],
        "text": "The locale picker disables any locale that already has a variation, so an author cannot start creating a second one. The creation step in Studio double checks this on save: if a variation already exists at the target path, Studio does not error out, it quietly reuses the existing variation and repairs the parent's list of variations if it was out of sync. Trying to create a variation from another variation is also blocked outright, an author has to start from the default locale fragment."
    },
    {
        "id": "variations.md#3",
        "topic": "variations",
        "title": "Creating and managing variations",
        "section": "What a variation field shows as inherited, overridden, or the same as parent",
        "keywords": [
            "platform",
            "authoring",
            "creating and managing variations",
            "collection",
            "merch card collection",
            "variation",
            "locale variation",
            "grouped variation",
            "pzn",
            "personalization",
            "locale default",
            "parent fragment",
            "translation"
        ],
        "text": "Every field on a variation has one of these states relative to its parent: inherited means the field has no value of its own and is showing the parent's value, same as parent means the author entered a value but it happens to match the parent exactly, and overridden means the value genuinely differs. Studio shows an \"Overridden, click to restore\" link for the second and third states, and a \"Click to override\" link for the first, so an author can always tell, and reset, what a field is actually doing. When a variation is saved, any field that is inherited or exactly matches its parent is cleared back to empty rather than stored as a duplicate value, which keeps the variation holding only its real differences."
    },
    {
        "id": "variations.md#4",
        "topic": "variations",
        "title": "Creating and managing variations",
        "section": "Common questions",
        "keywords": [
            "platform",
            "authoring",
            "creating and managing variations",
            "collection",
            "merch card collection",
            "variation",
            "locale variation",
            "grouped variation",
            "pzn",
            "personalization",
            "locale default",
            "parent fragment",
            "translation"
        ],
        "text": "Why can't I pick a locale in the variation dialog: it is either already taken by an existing variation, or it is not a valid region of the source fragment's own locale. Why did my new variation dialog silently open an existing fragment instead of creating one: a variation for that locale already existed, Studio found it and reused it instead of failing. Why does a field look empty on a variation but still shows a value on the live page: it is inherited from the parent, not missing."
    },
    {
        "id": "vocabulary.md#0",
        "topic": "vocabulary",
        "title": "Studio words and where they live",
        "section": "What do author words map to in the system?",
        "keywords": [
            "authoring",
            "platform",
            "studio words and where they live"
        ],
        "text": "The Template picker in the card editor chooses a card's template, which the code and the fragment store as its `variant` (picker defined in `studio/src/editors/variant-picker.js`). Authors say template; variant is the older author term and remains the code name. The side navigation and its pages come from `studio/src/mas-side-nav.js`. A placeholder token in a field is resolved by `io/www/src/fragment/transformers/replace.js`. Card content lives in Odin under `/content/dam/mas/<surface>/<locale>/`, and settings under `/content/dam/mas/<surface>/settings/index`. Masks live under `<surface>/<locale>/masks/<name>`."
    },
    {
        "id": "vocabulary.md#1",
        "topic": "vocabulary",
        "title": "Studio words and where they live",
        "section": "What are the Studio side navigation pages?",
        "keywords": [
            "authoring",
            "platform",
            "studio words and where they live"
        ],
        "text": "Home, Fragments, Collections (disabled), Promotions, Offers (disabled), Placeholders, Translations, Support, and Advanced tools. Advanced tools links to Bulk publish, Global settings, Masks and Offer mapping. There is no Product Catalog page in current MAS Studio: product and offer lookup happens through the Offer Selector Tool."
    }
];
