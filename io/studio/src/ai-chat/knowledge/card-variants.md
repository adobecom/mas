---
topic: card-variants
keywords: platform, authoring, card templates (the variant field), variant, variants, template, templates, card type, which template, catalog, plans, plans-v2, pro, product, segment, mini, slice, suggested, fries, special offers, compare chart, express, ccd, picker
---
<!-- ported from the MASA knowledge corpus -->
# Card templates (the variant field)

## Template or variant?

They are the same thing. Authors and Studio call it the **template**: the card editor's field, the search filter, the settings dialogs and the side navigation are all labelled "Template". The code and the stored fragment still call it the **variant**: the card's `variant` field, `variant-picker.js`, the `variants/` folder in the web components, and the `variant` attribute on `merch-card`. "Variant" is the older name for authors. Say "template" to people, and use `variant` only when naming the code, the field or an attribute.

Do not confuse a template with a variation (a locale, grouped or promotion copy of a fragment, see the variations concept), or with a button's style, which the rich text link editor labels "Variant" (primary, secondary, accent and so on).

## What a card template is

The template, set in the card editor's Template field, decides the layout a card renders in: which parts show up, how they are arranged, and what sizes are allowed. Every card fragment stores exactly one template, as its `variant` value, and it sets the card's overall layout.

## Why you don't see every template on every surface

Studio's template picker filters the full template list down to the ones registered for the surface you are working in. Sandbox and the NALA test surface are the exception: they can see every template regardless of scoping, which is why a template only meant for one production surface can still be tried out in sandbox first.

## The families of templates

Catalog is the general-purpose acom card. Plans, Plans v2, Plans Students and Plans Education are variations on a pricing-plan layout for acom, aimed at general, student and education audiences respectively. Pro serves acom, Creative Cloud and Document Cloud with a layout built around a top card and synced price bands, and unlike the plans family it never renders inside a collection sidenav. Product and Segment are single-offer layouts for the Creative Cloud and Document Cloud surfaces, and Brand Concierge Product is a similar layout for the sandbox surface. Media is an acom layout, Special offers is a Creative Cloud layout, Image serves both Creative Cloud and Document Cloud, and Fries is a commerce layout. Slice and Suggested exist only for the CCD surface, and Mini is a compact CCD layout meant for pages that need a small footprint. Mini Compare Chart, Mini Compare Chart Mweb and Compare Chart Column lay several offers side by side for comparison. Full Pricing Express and Simplified Pricing Express are Adobe Express layouts, one more detailed than the other. Try Buy Widget and Promoted Plans exist only for Adobe Home. Headless is a special case covered on its own page: it renders a card's fields as a plain labelled list instead of a designed layout. Marquee, FAQ and Banner/Blade are simpler, non-pricing card shapes offered on sandbox, NALA, acom and both Creative and Document Cloud surfaces. The Template picker in Studio shows the full set for your surface, which includes more than these.

## Common questions

Why can't an author select a template that clearly exists in the code: the template is not registered for the surface currently selected in Studio's surface picker; switch to sandbox to preview it or confirm the intended surface with the team. Why do two templates named similarly, like Plans and Plans v2, look and behave differently: they are genuinely separate layouts with separate field mappings, not the same layout with a version flag.
