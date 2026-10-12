---
topic: offers
keywords: offer, OSI, offer selector, OST, price, AOS, product, link offer, arrangement code
---
# Offers and the Offer Selector Tool (OST)

## What is the difference between a card and an offer?
A card is a content fragment authored in MAS Studio: the text, images, badges, and CTAs that users see. An offer is a commerce entity in Adobe's offer catalog (AOS) that defines a purchasable thing: the product, price, commitment, term, and customer segment. Cards never hardcode prices; instead a card stores an Offer Selector ID (OSI) that points at an offer. When the card renders on a page, the merch-card web component uses the OSI to fetch the current price from Adobe's Web Commerce Service (WCS) for the user's locale. If the price changes in the catalog, cards show the new price automatically without any re-authoring.

## What is an OSI (Offer Selector ID)?
An OSI is the identifier stored on a card that selects its offer. It is a string of 7 to 64 characters made of letters, digits, underscores, and hyphens. An OSI is locale-agnostic: the same OSI works across all locales where the offer is valid, and currency, tax labels, and formatting are resolved automatically for the page's locale. An OSI is not the same thing as a raw offer ID, which is a 32-character hexadecimal string identifying one specific offer in AOS. The AI assistant can resolve an OSI to its underlying offer details, and can also fetch a single offer directly by its 32-character hex offer ID.

## What is the Offer Selector Tool (OST)?
OST is Studio's built-in tool for finding an offer and attaching it to a card. Open it from the Offer Selector ID field in the card editor, search by product name, and narrow results by customer segment (individual, team, student), commitment, and term (monthly, annual). Selecting an offer inserts its OSI into the card; save the card afterwards so the OSI persists. OST also opens from the price and CTA fields in the card editor — selecting an offer there inserts an inline price or a checkout link into the field at the cursor. In release flows OST can open in a multi-select mode that picks a base offer and a trial offer together. The AI assistant can open OST for you on request, optionally pre-filled with search parameters.

## How do I link an offer to a card?
In the editor, open OST from the OSI field, pick the offer, insert it, and save the card. Alternatively, ask the AI assistant to link a card to an offer by giving it the card ID and the OSI; it confirms with you before making the change. After linking, the assistant can validate card-offer consistency: it checks that the card's tags (plan type, offer type, customer segment) agree with the linked offer and reports any mismatches.

## How do I find offers or products without opening OST?
Ask the AI assistant. It can search the AOS offer catalog with filters such as product arrangement code, commitment, term, customer segment, market segment, offer type, country, locale, and price point. It can list Adobe products from the catalog and search them by name, fetch a single product by its exact product arrangement (PA) code, and compare all plan types available for one product arrangement side by side. These are read-only lookups, so no confirmation is needed.

## Can the AI assistant create a new offer selector?
Yes. To create an offer selector the assistant needs the product arrangement code, customer segment, market segment, and offer type; commitment, term, and price point are optional refinements. It asks for your confirmation, creates the selector in AOS, and returns the new OSI, which you or the assistant can then link to a card.

## Is the Promotions page the same as a PROMOTION offer type?
No — they are different things that share a name. In the offer catalog, every offer has an offer type attribute such as BASE, TRIAL, or PROMOTION, describing what kind of purchasable offer it is. The Promotions page in MAS Studio manages promotion projects: named campaigns with a promo code, start and end dates, target geos and surfaces, and attached offers and cards, published on a schedule. When someone asks how promotions work in Studio, the answer is the Promotions page and its editor, not the offer type attribute.

## What about offers that are not live yet (draft offers)?
OST searches published production offers by default. Offers that are still being onboarded exist in the DRAFT landscape and can be found by adding the commerce.landscape=DRAFT parameter to OST. A card authored against a draft offer switches automatically to the published version once the offer is released, so no re-authoring is needed. If you expect an offer to exist but cannot find it in either landscape, ask in the #merch-at-scale Slack channel.
