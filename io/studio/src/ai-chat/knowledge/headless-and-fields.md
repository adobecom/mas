---
topic: headless
keywords: mas-field, headless, field, single field, inline, copy field, field link, embed, reuse, one field, price inline, cta inline, headless variant, consumer page, autoblock, jsonld
---
# Headless cards and single fields (mas-field)

## What is mas-field?

mas-field renders exactly one authored field of one card fragment, inline in page copy, with no card around it. There is no border, no badge, no slots and no variant layout: just that field's value. It exists for cases like putting a card's price in the middle of a marquee headline, or its CTA in a paragraph of body copy. The markup on a consumer page looks like a mas-field element with a field attribute naming the field, wrapping an aem-fragment element that names the fragment id. The rendered value lands in a span marked with the data-role mas-field-content. Use it when the fragment is the source of truth for a price, CTA or label, but a whole card is not wanted in that spot.

## What does headless mean in MAS? It means two different things

These are separate features and it matters which one is meant. First, mas-field is a headless usage of a card fragment: any fragment, any template, one field at a time, rendered on a consumer page without a card. Second, headless is also the name of a card variant, a Studio template that renders the fragment as a labelled list of all its fields (Title, Product price, CTAs and so on) instead of a designed card. The headless variant is a card-shaped inspector or feed view, authored in Studio like any other template and available on the sandbox, acom-cc and acom-dc surfaces. Short version: mas-field is the consumer-page mechanism, the headless variant is a Studio template.

## How do I use one field of a card on a page?

Open the fragment in Studio and use the Copy Field button in the side rail. It lists every non-empty field with a live preview of its value, and copies a link whose text reads "mas-field:" followed by the folder path and the field name. Paste that link into the consumer page document. Milo's merch-card autoblock recognises the link and replaces it with the mas-field markup, so the author never writes the element by hand. The Copy Field button is the supported path; hand-writing a field link is easy to get wrong.

## Which field names can mas-field address?

A plain field name renders that whole field: prices, description, title, cardTitle, subtitle, shortDescription, promoText, callout and so on. A single-paragraph rich text field is unwrapped so it sits inline rather than starting a new block. The name ctas renders all CTAs as real checkout buttons in a footer slot, styled the way the card would style them. A numeric index like ctas[1] or ctas[2] renders only the Nth CTA, counting from 1, with the class attribute stripped so the host page can restyle it. An index can instead be a CTA's data-key, which is stable when CTAs are reordered, or a custom field's label, as in customFields[My Label]. The special name jsonLdSchema injects JSON-LD structured data instead of visible content.

## Does a single field still get the right price, promo and locale?

Yes, and this is the reason to use mas-field rather than copying a value into the page. It runs the same data pipeline as a card, so hosted prices resolve with the same locale defaults and the tax or per-unit labelling for that market appears as it would on a card. The fragment's promo code is applied to both prices and checkout URLs under the same compatibility rules a card uses, so older fragments are unaffected, and the promo code is stamped onto the CTA anchor itself so it survives Milo unwrapping the element. Card settings are honoured: hideTrialCTAs drops trial CTAs, displayPlanType drives the plan type on a legal price template, and displayAnnual is respected. Rich text tooltips get the Milo info glyph with correct placement, because Milo does not decorate mas-field content itself.

## How is mas-field different from a merch-card?

Same fragment, same data pipeline, same option providers, same promo and settings rules. The difference is scope: merch-card maps every field onto the slots of its variant layout, and mas-field renders one field with no layout at all. Anything that belongs to a variant layout, such as badge placement, whats-included, addons or slot height syncing, is out of scope for mas-field by design. A mas:ready event fires once the field has loaded and rendered, so a host block can decorate a CTA that resolved after the block itself ran. One known difference: merch-card also drops CTAs whose resolved offer type is a trial, while mas-field matches only the static trial allowlist.
