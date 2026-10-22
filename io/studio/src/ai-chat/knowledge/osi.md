---
topic: osi
keywords: platform, offers and the osi
---
<!-- ported from the MASA knowledge corpus -->
# Offers and the OSI

## What is an OSI?

An OSI, an Offer Selector ID, is the identifier stored on a card that points at an offer in Adobe's offer catalog (AOS). Cards never hardcode prices: the merch-card component uses the OSI to fetch the current price from Adobe's Web Commerce Service at render time, so a catalog price change reaches every card without re-authoring. An OSI is not the same as a raw 32-character hexadecimal offer id, which identifies one specific offer.

## How do I attach an offer to a card?

Open the Offer Selector Tool from the Offer Selector ID field in the card editor, search for the product, and narrow by customer segment, commitment and term. Selecting an offer inserts its OSI, and the card must be saved for the OSI to persist. The tool also opens from the price and CTA fields, where selecting an offer inserts an inline price or a checkout link instead. It searches published production offers by default; add `commerce.landscape=DRAFT` to search draft offers.
