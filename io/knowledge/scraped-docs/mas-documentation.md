# M@S Web Components

> Scraped from: https://milo.adobe.com/libs/features/mas/docs/mas.html
> Date: 2025-12-30T05:04:55.812Z

---

# Merch At Scale (MAS) # {#merch-at-scale-(mas)}
## Table of Contents # {#table-of-contents}
- Introduction
- Components
- Terminology
- How It Works
## Introduction # {#introduction}
Merch at Scale (MAS) is a project designed to streamline commerce on adobe.com from authoring to delivering user experience end-to-end. It aims to simplify the process of enabling and managing commerce across different platforms while providing powerful tools for content authors.

MAS is:

- A set of libraries enabling commerce on various surfaces
- A collection of tools (OST, MAS Studio) allowing authors to create and publish merchandise content
- A Platform
## Components # {#components}
MAS includes the following key components:

- WCS (Web Commerce Service): Provides APIs returning Commerce data required by Adobe.com. Learn more about WCS
WCS (Web Commerce Service): Provides APIs returning Commerce data required by Adobe.com. Learn more about WCS

- MAS Studio: A tool for authors to create and manage merchandise content.
MAS Studio: A tool for authors to create and manage merchandise content.

- Offer Selector Tool (OST): Helps in authoring prices and checkout-links.
Offer Selector Tool (OST): Helps in authoring prices and checkout-links.

- Web Components:

Core commerce for basic functionality
UI components for user interface elements
Web Components:

- Core commerce for basic functionality
- UI components for user interface elements
- mas.js: A JavaScript library to enable “4” on any page. mas.js documentation
mas.js: A JavaScript library to enable “4” on any page. mas.js documentation

## Terminology # {#terminology}
### Offer Selector ID # {#offer-selector-id}
An AOS-generated stable reference for a set of natural keys, allowing retrieval of a specific offer whose offer ID may change over time.

API Specification: https://developers.corp.adobe.com/aos/docs/guide/apis/api.yaml#/paths/offer_selectors/post

### WCS # {#wcs}
WCS (pronounced “weks”) is the Web Commerce Service that provides APIs returning Commerce data required by Adobe.com.

API Specification: https://developers.corp.adobe.com/wcs/docs/api/openapi/wcs/latest.yaml#/schemas/Web-Commerce-Artifacts

## How It Works # {#how-it-works}
MAS integrates its components to provide a seamless commerce experience:

- Authors use MAS Studio to create and manage merchandise content.
- The Offer Selector Tool helps in selecting appropriate offers.
- Web Components and mas.js are used to implement the commerce functionality.
- WCS provides the necessary commerce data through its APIs.
## Analytics # {#analytics}
For analytics purposes, every <merch-card> tag can be tagged with ‘PRODUCT_CODE’ tag in Studio. When PRODUCT_CODE tag is present on the card, <merch-card> will reflect the tag value in the ‘daa-lh’ attribute. It is a non-translatable, human-readable card id.
To set a non-translatable, human-readable id on link - open Link editor in Studio and select the value from the dropdown.
Once value is set, every link will have 2 attributes:

- data-analytics-id - the value set in studio, without changes e.g. ‘buy-now’
- daa-ll - the value set in studio + position of the link within the card, e.g. ‘free-trial-1’, ‘buy-now-2’
Example: if you have 5 cards with buy-now cta on your page, you can take a combination of merch-card daa-lh and link daa-ll:
${daa-lh}–${daa-ll}: will result in ‘phlt–buy-now-2’.



## External References

- [adobe.com](http://adobe.com)
- [Adobe.com](http://Adobe.com)
- [https://developers.corp.adobe.com/aos/docs/guide/apis/api.yaml#/paths/offer_selectors/post](https://developers.corp.adobe.com/aos/docs/guide/apis/api.yaml#/paths/offer_selectors/post)
- [WCS](https://developers.corp.adobe.com/wcs/docs/guide/introduction.md)
- [Adobe.com](http://Adobe.com)
- [https://developers.corp.adobe.com/wcs/docs/api/openapi/wcs/latest.yaml#/schemas/Web-Commerce-Artifacts](https://developers.corp.adobe.com/wcs/docs/api/openapi/wcs/latest.yaml#/schemas/Web-Commerce-Artifacts)
