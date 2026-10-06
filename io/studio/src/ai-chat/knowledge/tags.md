---
topic: tags
keywords: platform, authoring, tags
---
<!-- ported from the MASA knowledge corpus -->
# Tags

## What a tag is

A tag is a label from AEM's shared tag taxonomy under the mas namespace, attached to a fragment to describe something about it, like its offer type, plan type, customer segment, or product. Tags are not fields on the fragment model, they're a separate mechanism, added or removed with a tag picker that shows the taxonomy as a tree and lets an author check the ones that apply.

## The tag categories Studio uses

Studio's filter panel groups tags into fixed categories: offer type, plan type, workflow step, market segment, customer segment, product code, template (the cards' `variant`), Studio's own content-type category, a custom category shown as Tag, and personalization. Publication status (published, draft, new, modified, unpublished) and Created by are separate filters in the same panel, not tag categories. A few of these categories double as real mechanisms elsewhere in the product, a promotion tag on a reference is how Studio tells a promotion variation apart from a locale variation, and a product code tag is how a fragment ties itself to one product.

## How multiple tag filters combine

When you filter by more than one tag at once, tags from the same top-level category combine with "or" logic, matching a fragment that has any one of them, while tags from different categories combine with "and" logic, so the fragment must have at least one match in every category you filtered on. For example filtering by two plan-type tags plus one offer-type tag returns fragments that have either plan-type tag and also have that offer-type tag, not fragments that have all three.

## Common questions

Why does adding a second tag to a filter return more results instead of fewer: the two tags are in the same category, so they combine with "or", not "and"; adding a tag from a different category is what narrows results. Why does a reference in the variations list turn out to be a promotion instead of a locale copy: check its promotion tag, that tag is what tells the two kinds of variation apart, not its path alone.
