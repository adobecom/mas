---
topic: variants
keywords: variant, variants, template, templates, card type, which template, catalog, plans, plans-v2, pro, product, segment, mini, slice, suggested, fries, special offers, compare chart, express, ccd, picker
---
# Card variants (templates)

## What card variants are available in MAS Studio?

The variant, also called the template, decides how a card is laid out. It is stored on the fragment and chosen in Studio's template picker, which shows only the variants allowed on the current surface. On acom the pricing variants are plans, plans-v2 (the newer design, preferred for new acom pricing work), plans-students and plans-education, alongside catalog for filtered browse collections and media for image-led cards. The pro variant, formerly named bizpro, is the business and pro pricing card and is available on acom, acom-cc and acom-dc. On acom-cc and acom-dc there are also product for a single product with icon, price and short description, segment for audience entry cards, and image for a minimal image-only card. CCD in-app surfaces use mini, ccd-suggested and ccd-slice. Compare tables use mini-compare-chart, its mobile-web counterpart mini-compare-chart-mweb, and compare-chart-column. Express uses simplified-pricing-express and full-pricing-express, commerce uses fries, and acom-cc has special-offers for promotional cards. There is also a headless variant that renders the fragment as a labelled list of its fields rather than a designed card.

## How do I choose the right card variant?

Pick by surface first, because the template picker only offers what the current surface allows, then by what the card has to show. For a standard acom pricing card use plans-v2 for new work and plans for existing designs. Use plans-students or plans-education for student and education offers, which drop or resize parts of the standard layout. Use pro for business and pro pricing. Use catalog inside a filtered collection, product for a single product with an icon and a short description, and segment to send people to an audience-specific area. Use mini, ccd-suggested or ccd-slice on CCD in-app surfaces, the compare chart variants for a column of a comparison table, and special-offers for a promotional card on acom-cc. Changing a card's variant changes which fields are rendered, so check the card preview after switching.

## Can I change a card's variant after it is created?

Yes, from the template picker in the fragment editor, but treat it as a real change rather than a cosmetic one. Each variant maps the fragment's fields onto its own layout, so a field that is shown by one variant may not be rendered by another, and layout-specific behaviour such as badge placement or whats-included belongs to the variant. Check the live preview beside the form after switching, and republish the card for the change to reach pages.
