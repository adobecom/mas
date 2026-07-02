---
topic: studio
keywords: MAS, Merch at Scale, Studio, Odin, AEM, fragment, surface, locale, adobe.com, architecture
---
# MAS Studio Basics

## What is Merch at Scale (M@S)?
Merch at Scale is Adobe's platform for authoring, managing, and delivering merchandising content — merch cards with product information, live pricing, and purchase CTAs — across Adobe's digital properties. Instead of hardcoding product cards into each page, teams author a card once in MAS Studio and the same card can be delivered to adobe.com, Creative Cloud Desktop, Adobe Home, Adobe Express, and Unified Checkout. Prices are fetched from Adobe's commerce services when the card renders, so pricing stays current everywhere without re-authoring.

## What is MAS Studio?
MAS Studio is the web application at https://mas.adobe.com/studio.html where merch cards are created, edited, and published. It offers a visual editor with live preview, a folder tree organized by surface, table and rendered views of your cards, search and filtering, integration with the Offer Selector Tool for pricing, a publish workflow, and an AI assistant chat panel. You sign in with your Adobe corporate account through IMS, and what you can see and do is governed by IAM group permissions.

## Where does card content live?
Cards are stored as content fragments in Odin, Adobe's internal Adobe Experience Manager (AEM) instance for structured content. All MAS content lives under the /content/dam/mas/ path, organized into folders by surface and locale. A fragment is structured data — named fields such as title, description, prices, ctas, and variant — not a rendered page; rendering happens later in the merch-card web component on the consuming page. Always create and edit MAS fragments through MAS Studio rather than directly in the AEM authoring UI, so the card structure stays valid.

## How does a card reach adobe.com?
First, an author creates and publishes the card in MAS Studio, which publishes the content fragment in Odin. Second, an adobe.com page includes the merch-card web component referencing that fragment. Third, when the page loads, the component fetches the fragment as JSON from the MAS delivery endpoint at https://www.adobe.com/mas/io/fragment, which runs a processing pipeline including locale resolution, placeholder replacement, and pricing integration. Fourth, if the card has an Offer Selector ID, the current price is fetched from the Web Commerce Service (WCS) for the user's locale. Responses are cached at the Akamai edge for performance, so a just-published change can take a short while to appear.

## What are surfaces and locales in MAS?
Surfaces are the destinations where cards render: acom (adobe.com), ccd (Creative Cloud Desktop), adobe-home (Adobe Home), commerce (Unified Checkout), and express (Adobe Express), plus a sandbox area for testing. Locales use codes like en_US or fr_FR (language plus country), and content folders follow the pattern /content/dam/mas/ then surface then locale. A card has a locale-default parent fragment, and each locale can hold exactly one variation of it for translated or region-specific content. Prices localize automatically through the offer system, but card text does not — translated text requires locale variations, which can be produced through translation projects.

## What can the AI assistant in Studio do?
The assistant can search cards by title, content, tags, surface, locale, or linked offer ID; fetch a card's contents; open a card in the editor; and copy a deep link to a card. It can publish, unpublish, update, and duplicate cards, run bulk updates and bulk publishes with dry-run previews, create and inspect locale variations, create collections and add cards to them, and create tags. On the commerce side it can search products and offers, resolve OSIs, create offer selectors, link offers to cards, and validate card-offer consistency. It also supports translation coverage reports, finding untranslated cards, translation projects, a guided flow for creating new product release cards, and opening the Offer Selector Tool. Every state-changing action asks for your explicit confirmation before it runs.
