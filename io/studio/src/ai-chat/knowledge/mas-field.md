---
topic: mas-field
keywords: platform, authoring, mas-field and headless cards
---
<!-- ported from the MASA knowledge corpus -->
# mas-field and headless cards

## What is mas-field?

mas-field renders exactly one authored field of one card fragment inline on a page, with no card chrome around it. It runs the same data pipeline as a card, so locale-correct prices, promo codes and card settings such as hideTrialCTAs are honored. One known difference from merch-card: mas-field filters trial CTAs by a static analytics-id allowlist rather than by the resolved offer type from the commerce service.

## How an indexed field reference resolves

A field name can carry an index in square brackets, which picks one item out of a multi-item field. CTAs are the usual case, written as `ctas[1]` or `ctas[2u25ddjvjn]`.

A whole-number index selects by position, so `ctas[1]` takes the first anchor stored in the field. Any other index is first matched against the fragment's labels field for that field, such as `ctaLabels` for `ctas`, when the fragment has one: the item at the matching label's position is rendered, and if no label matches, the element hides itself. Only when there is no labels field is the index looked up as an anchor whose `data-key` attribute equals it, and a positional lookup that finds nothing falls back to the same `data-key` lookup. If nothing is found, the element sets itself hidden and renders nothing. There is no error and no console message.

A `data-key` reference resolves against the anchors in whichever fragment is being rendered. An anchor in a variation can carry a different key from the equivalent anchor in its parent, so a reference written against one renders empty against the other, with no error. When an indexed CTA reference renders nothing, compare the key in the reference against the key on the anchor in the fragment that is actually being rendered, not the one it was authored from.

## What does headless mean in MAS?

It means two different things. mas-field is a headless usage of any fragment: one field, rendered without a card. The Headless template is a Studio card template that renders a fragment as a labelled list of all its fields, such as Title, Product price and CTAs, instead of a designed layout. The Headless template is offered on the sandbox, acom-cc, acom and acom-dc surfaces. To place a single field on a consumer page, use the Copy Field button rather than the headless variant.
