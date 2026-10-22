---
topic: card-anatomy
keywords: platform, card anatomy, the parts a card can render
---
<!-- ported from the MASA knowledge corpus -->
# Card anatomy, the parts a card can render

## What decides what shows up on a card

A card fragment's fields don't render directly, each one is placed into a named part of the card, things like the badge, the title, or the footer of CTAs. Whether a given part appears at all, and where exactly it lands, depends on the card's template (its `variant` in code): a template defines a mapping from field names to parts, and a field with no entry in that mapping is simply never shown, no matter what value it has.

## The parts every card can potentially have, in the order they render

Mnemonics (small icons) come first, followed by a trial badge, the card's allowed size, its internal name, title, badge, subtitle, and prices. Next come the background image, an image, a backgrounds layer, then the background color and border color. Then the description group renders as a unit: promo text, the main description, a short description, description links turned into buttons, a callout, a quantity selector, and a "what's included" list, all in that fixed order. After that come extra features, the "what's included" divider color, an add-on and its confirmation text, custom fields, a secure-transaction label, See Terms (`upt-link`) links, and finally the CTAs footer and analytics tagging. A card template can skip any of these, but it can't reorder them.

## What a template's mapping actually says

For a given part, the mapping tells the renderer what kind of tag to wrap the content in, which named slot to place it into, and sometimes extra detail like a maximum character count with a tooltip for the full text, or a button size for CTAs. A part with no mapping entry for the current template is dropped entirely rather than shown with default styling.

## Common questions

Why does a field have a value on the fragment but never appears on the card: the card's template has no mapping entry for that field; check the template's own field list rather than assuming every field always renders. Why does changing a field's order in the fragment editor not change where it appears on the card: layout order is fixed by the template, not by field order in the source data. Why is my text cut off with a "..." and a tooltip: the part has a maximum character count configured for that template, and the full text is still available on hover.
