---
topic: masks
keywords: platform, authoring, masks
---
<!-- ported from the MASA knowledge corpus -->
# Masks

## What is a mask?

A mask is a card fragment, stored in a masks folder inside a surface and locale, that is laid over other cards when a page asks for it by name. It uses the same content model as a card, and only the fields it actually fills are overridden: everything the mask leaves empty keeps coming from the card itself. One mask therefore restyles or rewords many cards at once, without touching any of them.

A mask can also carry a list of variables written as a key and a value. Those pairs join the dictionary used for placeholder replacement for that request, so a masked card can resolve tokens that the surface dictionary does not define. See the placeholders page for how token replacement works.

## When does a mask apply?

Only when the request names it. The fragment pipeline reads the mask name from the request, looks for that mask in the regional locale first and then in the surface default locale, and merges it onto the card before the card is returned. A request with no mask name is served exactly as authored, and masked and unmasked responses are cached separately.

## Where are masks managed?

Masks live under Advanced tools, on the Masks page, which lists the masks of the selected surface and region with their status and last update, and offers Create mask. Access is granted per surface, in the same way as global settings, so an author without that permission sees a no access message instead of the list.

The mask editor shows general information, where the name is fixed once the mask is created and the title can still change, followed by the field sections Content, Price and promo, Footer, Badge and colors, and Placeholders. These sections follow the plans card template rather than offering a template picker, and a blurred preview beside them reveals each part of the card as the matching field gains content.
